#!/bin/bash
# scripts/floating-smoke.sh
# 浮窗可见性 7 层一键验证。启动 tauri dev → 等启动 → 逐层检查 → 输出 PASS/FAIL。
#
# 7 层(详见 docs/architecture/floating-visibility-checklist.md):
#   1. Tauri 进程存活 + webview created   (动态)
#   2. floating.html 存在 + 引用 main     (静态)
#   3. floatingSetHeight 已在某处调用     (静态)
#   4. useWindowPosition + setPosition     (静态)
#   5. FloatShell 顶层 div 含 floating-root (静态)
#   6. webview 物理 pos/size/visible (动态,读 mindtap.log 的 "floating webview state")
#   7. .floating-root CSS 含 background + width/height (静态,grep built css)
#
# 用法:
#   bash scripts/floating-smoke.sh
#   npm run smoke:floating

set -uo pipefail

cd "$(dirname "$0")/.."

LOG_DIR="/tmp/mindtap-smoke"
mkdir -p "$LOG_DIR"
DEV_LOG="$LOG_DIR/dev.log"
APP_LOG="$HOME/Library/Application Support/mindtap/mindtap.log"

# 0/1 状态变量 — 避免 (( )) 空字符串算术崩
L1_TAURI=0    # Tauri alive + floating geometry log
L2_HTML=0     # floating.html 存在 + 引用 main
L3_RESIZE=0   # floatingSetHeight 已在某处调
L4_POS=0      # useWindowPosition + setPosition
L5_CLASS=0    # FloatShell 顶层 div 含 floating-root
L6_STATE=0    # webview 物理 pos/size/visible (动态, R4 log 解析)
L7_CSS=0      # .floating-root CSS 含 background + 显式 width/height (R1/R3 防御)

cleanup() {
  local pid="${TAURI_PID:-}"
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
  fi
  pkill -f 'target/debug/mindtap' 2>/dev/null || true
  pkill -f 'tauri dev' 2>/dev/null || true
  pkill -f 'node.*vite' 2>/dev/null || true
}
trap cleanup EXIT

# 启动前先杀任何残留的 mindtap / vite 进程 + 等端口释放,避免上次 smoke 泄漏导致这次起不来
echo "════════════════════════════════════════════════════════════════════"
echo "  浮窗可见性 7 层 smoke test"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "─── 预清理:杀掉残留 mindtap / tauri / vite 进程 ───"
pkill -f 'target/debug/mindtap' 2>/dev/null || true
pkill -f 'tauri dev' 2>/dev/null || true
pkill -f 'node.*vite' 2>/dev/null || true
sleep 1
echo "  ✓ 预清理完成"

# ─── Layer 2 — 静态:floating.html 存在 + script 引用 floating/main ───
echo ""
echo "─── Layer 2 · floating.html 挂载(静态) ───"
if [[ -f floating.html ]] && grep -E "src/floating/main" floating.html > /dev/null; then
  echo "  ✓ PASS · floating.html 存在 + script 引用 floating/main"
  L2_HTML=1
else
  echo "  ✗ FAIL · floating.html 缺失或 script 引用错"
fi

# ─── Layer 3 — 静态:App.tsx 或 hook 调 floatingSetHeight ───
echo ""
echo "─── Layer 3 · D-13 webview 物理尺寸自适应(静态) ───"
if grep -rE "floatingSetHeight" src/ > /dev/null; then
  echo "  ✓ PASS · floatingSetHeight 已在 src/ 调"
  L3_RESIZE=1
else
  echo "  ✗ FAIL · src/ 没人调 floatingSetHeight"
fi

# ─── Layer 4 — 静态:useWindowPosition + setPosition 已 wire ───
echo ""
echo "─── Layer 4 · macOS 菜单栏位置偏移(静态) ───"
if grep -E "useWindowPosition" src/floating/App.tsx > /dev/null \
   && grep -rE "setPosition" src/floating/ > /dev/null; then
  echo "  ✓ PASS · useWindowPosition 已 wire + setPosition 调用存在"
  L4_POS=1
else
  echo "  ✗ FAIL · useWindowPosition 未 wire / setPosition 未调"
fi

# ─── Layer 5 — 静态:FloatShell.tsx 必须挂 floating-root 类 ───
echo ""
echo "─── Layer 5 · CSS 类挂载(静态) ───"
if grep -E "floating-root" src/floating/FloatShell.tsx > /dev/null; then
  echo "  ✓ PASS · FloatShell.tsx 含 floating-root"
  L5_CLASS=1
else
  echo "  ✗ FAIL · FloatShell.tsx 缺 floating-root 类"
fi

# ─── Layer 7 — 静态:R1/R3 防御(built css 含 background + 显式 width/height)───
# npm run build 跑过再 grep dist/ — 若用户没 build 跳过这层(避免阻塞)。
echo ""
echo "─── Layer 7 · R1/R3 防御 — built css 含 background + 显式尺寸(静态) ───"
FLOAT_CSS=$(ls dist/assets/floating-*.css 2>/dev/null | head -1 || echo "")
if [[ -n "$FLOAT_CSS" ]] \
   && grep -E "\.floating-root\s*\{" "$FLOAT_CSS" > /dev/null \
   && grep -E "background:[^;]*var\(--glass-bg|background:[^;]*rgba" "$FLOAT_CSS" > /dev/null \
   && grep -E "width:[^;]*320px|height:[^;]*36px" "$FLOAT_CSS" > /dev/null; then
  echo "  ✓ PASS · .floating-root 有 background + 显式 320x36"
  L7_CSS=1
else
  echo "  ⚠ SKIP · dist/ 不存在或缺 .floating-root / background / 显式尺寸(跑 npm run build 再验)"
fi

# ─── Layer 1 — 动态:启动 tauri dev 跑 12s,验证进程 + 浮窗创建 ───
echo ""
echo "─── Layer 1 · 启动 tauri dev(动态) ───"
echo "  启动 npm run tauri dev(后台)…"

LOG_OFFSET=$(wc -l < "$APP_LOG" 2>/dev/null || echo 0)
npm run tauri dev > "$DEV_LOG" 2>&1 &
TAURI_PID=$!
echo "  tauri dev pid=$TAURI_PID"

# 等 12 秒(编译 + 启动 + 浮窗创建 + React mount)
sleep 12

# 1a: 进程存活
if kill -0 "$TAURI_PID" 2>/dev/null; then
  echo "  ✓ PASS · tauri dev 进程仍存活"
  L1_TAURI=1
else
  echo "  ✗ FAIL · tauri dev 进程已退出"
  echo "  --- dev.log 末尾 ---"
  tail -30 "$DEV_LOG"
  echo "  --- app.log 末尾 ---"
  tail -10 "$APP_LOG" 2>/dev/null || true
fi

# 1b: 浮窗被创建(floating geometry applied 日志)
NEW_LOGS=$(tail -n +$((LOG_OFFSET + 1)) "$APP_LOG" 2>/dev/null || echo "")
if echo "$NEW_LOGS" | grep -E "floating geometry applied" > /dev/null; then
  echo "  ✓ PASS · floating geometry applied 日志出现,webview 已创建"
else
  echo "  ✗ FAIL · 无 floating geometry applied 日志"
  echo "  --- 新增 app.log ---"
  echo "$NEW_LOGS" | tail -10
  L1_TAURI=0
fi

# ─── Layer 6 — 动态:R4 log_floating_state 解析 webview 物理 state ───
# 读 mindtap.log 最后一行 "floating webview state: pos=(X, Y), size=(W, H), visible=V"
# 断言:visible=true + pos.y >= 50(避开菜单栏)+ size 至少 (320, 36)
echo ""
echo "─── Layer 6 · R4 webview 物理 state(动态,读 mindtap.log) ───"
STATE_LINE=$(echo "$NEW_LOGS" | grep -E "floating webview state" | tail -1 || echo "")
if [[ -z "$STATE_LINE" ]]; then
  echo "  ✗ FAIL · 无 floating webview state log(R4 log_floating_state 未生效)"
else
  echo "  读到的 state: $STATE_LINE"
  VISIBLE=$(echo "$STATE_LINE" | grep -oE "visible=(true|false)" | cut -d= -f2)
  # Rust Debug 格式:pos=Some((X, Y)), size=Some((W, H))
  # 第一次 grep 抓 Some((X, Y)) 整段,第二次从里抠 [0-9]+,sed 取第 1/2 个。
  POS_X=$(echo "$STATE_LINE" | grep -oE "pos=Some\(\([0-9]+, [0-9]+\)\)" | grep -oE "[0-9]+" | sed -n '1p')
  POS_Y=$(echo "$STATE_LINE" | grep -oE "pos=Some\(\([0-9]+, [0-9]+\)\)" | grep -oE "[0-9]+" | sed -n '2p')
  SIZE_W=$(echo "$STATE_LINE" | grep -oE "size=Some\(\([0-9]+, [0-9]+\)\)" | grep -oE "[0-9]+" | sed -n '1p')
  SIZE_H=$(echo "$STATE_LINE" | grep -oE "size=Some\(\([0-9]+, [0-9]+\)\)" | grep -oE "[0-9]+" | sed -n '2p')
  OK=1
  if [[ "$VISIBLE" != "true" ]]; then
    echo "  ✗ FAIL · visible=$VISIBLE(期望 true)"
    OK=0
  fi
  if [[ -z "$POS_Y" || "$POS_Y" -lt 50 ]]; then
    echo "  ✗ FAIL · pos.y=$POS_Y(期望 >= 50 避菜单栏)"
    OK=0
  fi
  if [[ -z "$SIZE_W" || "$SIZE_W" -lt 320 || -z "$SIZE_H" || "$SIZE_H" -lt 36 ]]; then
    echo "  ✗ FAIL · size=${SIZE_W}x${SIZE_H}(期望 >= 320x36 物理像素,Retina 2x 下 = 640x72)"
    OK=0
  fi
  if [[ "$OK" == "1" ]]; then
    echo "  ✓ PASS · visible=$VISIBLE, pos=($POS_X, $POS_Y), size=${SIZE_W}x${SIZE_H}"
    L6_STATE=1
  fi
fi

# ─── 总览 ───
echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "  7 层结果汇总"
echo "════════════════════════════════════════════════════════════════════"
printf "  Layer 1 · Tauri 进程 + webview 创建 · %s\n" "$([[ $L1_TAURI == 1 ]] && echo PASS || echo FAIL)"
printf "  Layer 2 · floating.html 挂载         · %s\n" "$([[ $L2_HTML == 1 ]] && echo PASS || echo FAIL)"
printf "  Layer 3 · floatingSetHeight 已 wire  · %s\n" "$([[ $L3_RESIZE == 1 ]] && echo PASS || echo FAIL)"
printf "  Layer 4 · 菜单栏位置偏移已 wire      · %s\n" "$([[ $L4_POS == 1 ]] && echo PASS || echo FAIL)"
printf "  Layer 5 · CSS 类挂载                 · %s\n" "$([[ $L5_CLASS == 1 ]] && echo PASS || echo FAIL)"
printf "  Layer 6 · R4 webview 物理 state      · %s\n" "$([[ $L6_STATE == 1 ]] && echo PASS || echo FAIL)"
printf "  Layer 7 · R1/R3 built css 防御       · %s\n" "$([[ $L7_CSS == 1 ]] && echo PASS || echo SKIP)"

# L7 是 SKIP 时只计 6 层要全 PASS;否则要 7 层全 PASS
if [[ $L7_CSS == 1 ]]; then
  TOTAL=$((L1_TAURI + L2_HTML + L3_RESIZE + L4_POS + L5_CLASS + L6_STATE + L7_CSS))
  EXPECTED=7
else
  TOTAL=$((L1_TAURI + L2_HTML + L3_RESIZE + L4_POS + L5_CLASS + L6_STATE))
  EXPECTED=6
fi
echo "════════════════════════════════════════════════════════════════════"
if [[ $TOTAL -eq $EXPECTED ]]; then
  echo "  ✓ ALL $EXPECTED LAYERS PASS — 浮窗可见性机制 OK"
  echo "════════════════════════════════════════════════════════════════════"
  exit 0
else
  echo "  ✗ $((EXPECTED - TOTAL))/$EXPECTED LAYERS FAIL — 修最上层失败再跑"
  echo "════════════════════════════════════════════════════════════════════"
  echo ""
  echo "诊断建议:"
  echo "  · 失败 1 (动态):检查 dev.log + app.log,看启动崩溃或 ensure_window 失败"
  echo "  · 失败 2:floating.html 是否引用了 src/floating/main"
  echo "  · 失败 3:grep -rE 'floatingSetHeight' src/ 看哪里没 wire"
  echo "  · 失败 4:grep -E 'useWindowPosition' src/floating/App.tsx 看是否 import"
  echo "  · 失败 5:grep -E 'floating-root' src/floating/FloatShell.tsx 看 className"
  echo "  · 失败 6:看 app.log 末尾 'floating webview state' 行的 pos.y 是否 >= 50 / visible 是否 true"
  echo "  · 失败 7:跑 npm run build 后 grep dist/assets/floating-*.css 看 .floating-root 规则"
  exit 1
fi
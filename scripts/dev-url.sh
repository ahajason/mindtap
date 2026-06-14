#!/bin/bash
IP=$(hostname -I | awk '{print $1}')

echo "=================================="
echo "🌐 WSL IP: $IP"
echo "👉 Windows 浏览器打开: http://${IP}:1420"
echo "=================================="

# 检测 dev server 是否在跑
if ss -tln 2>/dev/null | grep -q ':1420 '; then
  echo "✅ Vite dev server 正在跑 (port 1420)"
else
  echo "⏳ Vite dev server 未启动 — 先跑: npm run tauri dev"
fi

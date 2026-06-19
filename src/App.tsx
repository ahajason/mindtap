import '@/styles/glassmorphism.css';
import { RecordTimeline } from './timeline/RecordTimeline';

/**
 * Mindtap 主窗（V1.3 · 浮动窗口快速记录）
 *
 * V1.0 脚手架结构（保留）：
 * - 顶栏（玻璃）+ 侧栏（玻璃）
 * - 玻璃只承载控件/导航，内容由 RecordTimeline 承载
 *
 * 设计语言：Liquid Glass（来自 Apple HIG · Materials）
 * - 玻璃只承载控件/导航：顶栏、侧栏、工具栏、浮动按钮
 * - 玻璃不承载内容：内容在 RecordTimeline 中
 * - 反 AI 味：暖白基色 + 真实字号 + 真实组件 demo
 *
 * 真实运行在 Tauri 桌面 + Web 端。
 * 浮动窗入口：Cmd/Ctrl+Shift+Space（或点 FAB 触发 floating_toggle）。
 */

function App() {
  return (
    <>
      {/* ============ 顶栏（玻璃） ============ */}
      <header className="topbar">
        <div className="brand">
          <h1>轻念 · Mindtap</h1>
          <span className="meta">/ 浮动窗口快速记录</span>
        </div>
        <div className="crumb">
          <span className="now">timeline</span>
        </div>
      </header>

      <div className="app">

        {/* ============ 侧栏（玻璃） ============ */}
        <aside className="sidebar">
          <h3>视图</h3>
          <a className="nav-item active" href="#timeline">
            <span>时间线</span>
            <span className="chevron">›</span>
          </a>
          <a className="nav-item" href="#heatmap">
            <span>热力图</span>
            <span className="chevron">›</span>
          </a>
          <a className="nav-item" href="#ideas">
            <span>灵感</span>
            <span className="chevron">›</span>
          </a>
          <a className="nav-item" href="#tasks">
            <span>任务</span>
            <span className="chevron">›</span>
          </a>

          <h3>浮动窗</h3>
          <a className="nav-item" href="#" onClick={(e) => e.preventDefault()}>
            <span>3 秒记录 / 1 秒查看</span>
            <span className="chevron">→</span>
          </a>
          <a className="nav-item" href="#" onClick={(e) => e.preventDefault()}>
            <span>对比方法论</span>
            <span className="chevron">→</span>
          </a>

          <div className="foot">
            v1.3 · 14.06.2026<br />
            Tauri 2 + React 19
          </div>
        </aside>

        {/* ============ 主区（内容由 RecordTimeline 承载） ============ */}
        <main className="main">
          <RecordTimeline />
        </main>
      </div>

      {/* 浮动 [+] 玻璃按钮（V1.3 入口：触发 floating_toggle 唤起浮动窗） */}
      <button className="fab" aria-label="新记录" type="button">+</button>
    </>
  );
}

export default App;

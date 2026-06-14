import '@/styles/glass.css';
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
 * prototype 资产：docs/projects/v1.0/prototype/
 */

function App() {
  return (
    <>
      {/* ============ 顶栏（玻璃） ============ */}
      <header className="topbar">
        <div className="brand">
          <h1>轻念 · Mindtap</h1>
          <span className="meta">/ DESIGN SYSTEM</span>
        </div>
        <div className="crumb">
          <a href="docs/projects/v1.0/compare-method.md" target="_blank" rel="noreferrer">docs</a> / <span className="now">scaffold</span>
        </div>
        <div className="topbar-actions">
          <a className="btn btn-ghost" href="docs/projects/v1.0/prototype/index.html" target="_blank" rel="noreferrer">
            打开原型目录
          </a>
        </div>
      </header>

      <div className="app">

        {/* ============ 侧栏（玻璃） ============ */}
        <aside className="sidebar">
          <h3>Fundamentals</h3>
          <a className="nav-item active" href="#surface">
            <span>Surface</span>
            <span className="chevron">›</span>
          </a>
          <a className="nav-item" href="#toolbar">
            <span>Toolbar</span>
            <span className="chevron">›</span>
          </a>
          <a className="nav-item" href="#button">
            <span>Button</span>
            <span className="chevron">›</span>
          </a>
          <a className="nav-item" href="#card">
            <span>Card</span>
            <span className="chevron">›</span>
          </a>

          <h3>Patterns</h3>
          <a className="nav-item" href="#heat">
            <span>Heatmap</span>
            <span className="chevron">›</span>
          </a>
          <a className="nav-item" href="#fab">
            <span>Floating Button</span>
            <span className="chevron">›</span>
          </a>

          <h3>Compare</h3>
          <a className="nav-item" href="docs/projects/v1.0/prototype/index.html" target="_blank" rel="noreferrer">
            <span>4 方向对比</span>
            <span className="chevron">→</span>
          </a>
          <a className="nav-item" href="docs/projects/v1.0/compare-method.md" target="_blank" rel="noreferrer">
            <span>对比方法论</span>
            <span className="chevron">→</span>
          </a>

          <div className="foot">
            v0.1 · 14.06.2026<br />
            Tauri 2 + React 19
          </div>
        </aside>

        {/* ============ 主区（内容由 RecordTimeline 承载） ============ */}
        <main className="main">
          <RecordTimeline />
        </main>
      </div>

      {/* 浮动 [+] 玻璃按钮 */}
      <button className="fab" aria-label="新记录" type="button">+</button>
    </>
  );
}

export default App;

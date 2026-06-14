import '@/styles/glass.css';

/**
 * 脚手架交互单元演示页（V1.0 P3 脚手架）
 *
 * 设计语言：Liquid Glass（来自 Apple HIG · Materials）
 * - 玻璃只承载控件/导航：顶栏、侧栏、工具栏、浮动按钮
 * - 玻璃不承载内容：内容在 demo 块中，用标准材质
 * - 反 AI 味：暖白基色 + 真实字号 + 真实组件 demo；不是紫粉渐变
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

        {/* ============ 主区 ============ */}
        <main className="main">

          <section className="section">
            <div className="kicker">V1.0 P3 · SCAFFOLD</div>
            <h1 className="h1">脚手架交互单元演示</h1>
            <p className="lead">
              这是 P3 脚手架阶段的可交互组件库。基于 Apple Liquid Glass 设计语言——
              玻璃只承载控件与导航，不承载内容。每个组件下方有真实 demo 与使用约束。
            </p>
            <p className="lead" style={{ marginTop: 8 }}>
              详见 <code>docs/projects/v1.0/compare-method.md</code> · 反 AI 味硬约束 + 跳转关系。
            </p>
          </section>

          {/* --- Surface --- */}
          <section className="section" id="surface">
            <div className="kicker">§ 01 / FUNDAMENTALS</div>
            <h2 className="h2">Surface</h2>
            <p className="lead">
              内容层容器。承载文字、列表、媒体。**不**使用 Liquid Glass，
              用标准材质（白色 + 1px 边框 + 16-18px 圆角）。
            </p>
            <div className="demo">
              <div className="surface" style={{ maxWidth: 460 }}>
                <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 700 }}>记录 #0014</h3>
                <p style={{ margin: 0, color: 'var(--ink-2)' }}>
                  脚手架就绪。玻璃层漂浮在内容之上，不与内容争夺视觉。
                </p>
              </div>
            </div>
          </section>

          {/* --- Toolbar --- */}
          <section className="section" id="toolbar">
            <div className="kicker">§ 02 / FUNDAMENTALS</div>
            <h2 className="h2">Toolbar</h2>
            <p className="lead">
              系统自动应用 Liquid Glass；用 <code>ToolbarSpacer</code> 按功能分组。
              玻璃层只承载功能，不承载内容。
            </p>
            <div className="demo">
              <div className="toolbar">
                <button className="btn btn-glass">⟨</button>
                <button className="btn btn-glass">⟩</button>
                <div className="sep" />
                <button className="btn btn-glass">⋯ 更多</button>
                <div className="sep" />
                <button className="btn btn-glass">↗ Share</button>
                <button className="btn btn-glass">☆ Fav</button>
                <div className="sep" />
                <button className="btn btn-glass">⊞ Add to set</button>
                <div style={{ flex: 1 }} />
                <button className="btn btn-primary">+ New record</button>
              </div>
            </div>
          </section>

          {/* --- Button --- */}
          <section className="section" id="button">
            <div className="kicker">§ 03 / FUNDAMENTALS</div>
            <h2 className="h2">Button</h2>
            <p className="lead">
              4 个层级。Primary 强调操作；Secondary 中性动作；Ghost 弱操作；Glass 浮动场景。
            </p>
            <div className="demo">
              <div className="demo-row">
                <button className="btn btn-primary">+ 新建记录</button>
                <button className="btn btn-secondary">查看详情</button>
                <button className="btn btn-ghost">稍后</button>
                <button className="btn btn-glass">⌘K 搜索</button>
              </div>
            </div>
            <div className="demo">
              <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--ink-3)' }}>标签 / 状态</div>
              <div className="demo-row">
                <span className="pill pill-blue">INSPIRATION</span>
                <span className="pill pill-green">CHECK-IN</span>
                <span className="pill pill-red">DRAFT</span>
                <span className="pill pill-blue">MNT-142</span>
              </div>
            </div>
          </section>

          {/* --- Card --- */}
          <section className="section" id="card">
            <div className="kicker">§ 04 / FUNDAMENTALS</div>
            <h2 className="h2">Card</h2>
            <p className="lead">
              内容载体。不应用 Liquid Glass。白色背景 + 1px 边框 + 18px 圆角。
            </p>
            <div className="demo" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card">
                <span className="pill pill-blue" style={{ marginBottom: 8 }}>INSPIRATION</span>
                <h4>Record #0014</h4>
                <div className="meta">14 JUNE 2026 · 14:09</div>
                <p>脚手架就绪，玻璃层漂浮在内容之上。</p>
                <div className="actions">
                  <button className="btn btn-primary">查看详情</button>
                  <button className="btn btn-secondary">归档</button>
                </div>
              </div>
              <div className="card">
                <span className="pill pill-green" style={{ marginBottom: 8 }}>CHECK-IN</span>
                <h4>3/5 · 连续 7 天</h4>
                <div className="meta">14 JUNE 2026</div>
                <div className="heatmap" style={{ marginTop: 8 }}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} className={i % 5 === 2 ? 'mid' : i % 7 === 0 ? 'high' : ''} />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* --- Heatmap --- */}
          <section className="section" id="heat">
            <div className="kicker">§ 05 / PATTERNS</div>
            <h2 className="h2">Heatmap</h2>
            <p className="lead">
              12 周 × 7 天。颜色深浅 = 当日强度。3 档透明度。
            </p>
            <div className="demo">
              <div className="heatmap">
                {Array.from({ length: 84 }, (_, i) => {
                  const v = (i * 37) % 11;
                  return <div key={i} className={v > 7 ? 'high' : v > 3 ? 'mid' : ''} />;
                })}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-3)' }}>
                M T W T F S S · last 12 weeks
              </div>
            </div>
          </section>

          {/* --- FAB --- */}
          <section className="section" id="fab">
            <div className="kicker">§ 06 / PATTERNS</div>
            <h2 className="h2">Floating [+] Button</h2>
            <p className="lead">
              浮动操作。右下角玻璃圆按钮，1px 镜面高光 + 8px 阴影。
              点击展开快速操作菜单（V1.0 待实现）。
            </p>
            <p className="lead" style={{ color: 'var(--ink-3)' }}>
              → 看屏幕右下角 ·
              详见 <code>docs/material/apple/swiftui/landmarks/05-custom-badges.md</code>
            </p>
          </section>

        </main>
      </div>

      {/* 浮动 [+] 玻璃按钮 */}
      <button className="fab" aria-label="新记录" type="button">+</button>
    </>
  );
}

export default App;

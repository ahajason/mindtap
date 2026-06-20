import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const sections = [
  { title: '总览', items: [{ to: '/', label: '设计语言' }] },
  {
    title: '表面',
    items: [{ to: '/surface', label: 'Card / Separator' }],
  },
  {
    title: '表单',
    items: [
      { to: '/button', label: 'Button' },
      { to: '/input', label: 'Input / Textarea / Label' },
    ],
  },
  {
    title: '反馈',
    items: [{ to: '/feedback', label: 'Badge / Toast / Dialog' }],
  },
  { title: '浮层', items: [{ to: '/overlay', label: 'Tooltip / Tabs' }] },
  { title: 'Token', items: [{ to: '/tokens', label: 'Token 速查' }] },
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 h-screen glass-l1 border-r border-white/40 p-4 flex flex-col gap-4 overflow-y-auto">
      <header>
        <h1 className="text-lg font-semibold text-text-1">轻念 · Mindtap</h1>
        <p className="text-xs text-text-3 mt-0.5">V0.1.0 · Style Guide</p>
      </header>
      <nav className="flex flex-col gap-3">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-xs font-medium text-text-3 px-2 mb-1">{section.title}</h2>
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'block px-2 py-1.5 rounded-md text-sm transition-all duration-base',
                        isActive
                          ? 'bg-white/55 text-primary font-medium'
                          : 'text-text-2 hover:bg-white/35'
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
import PageHeader from '@/components/style-guide/PageHeader';
import { Card } from '@/components/ui/card';

const colors = [
  { name: 'primary', value: '#165DFF' },
  { name: 'primary-hover', value: '#0E4AD9' },
  { name: 'primary-active', value: '#0A3DBC' },
  { name: 'text-1', value: '#1D2939' },
  { name: 'text-2', value: '#475467' },
  { name: 'text-3', value: '#98A2B3' },
  { name: 'success', value: '#5BCBA0' },
  { name: 'inactive', value: '#DDE3EE' },
];

export default function TokensRoute() {
  return (
    <div>
      <PageHeader
        title="Token 速查"
        description="色板 / 字号 / 间距 (静态展示,无 Live Preview)"
      />
      <section className="glass-l3 rounded-xl p-4 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-text-1 mb-3">色板</h2>
          <div className="grid grid-cols-4 gap-3">
            {colors.map((c) => (
              <Card key={c.name} tier="l1" className="p-3">
                <div className="w-full h-12 rounded-md mb-2" style={{ background: c.value }} />
                <div className="text-xs font-mono text-text-1">{c.name}</div>
                <div className="text-xs font-mono text-text-3">{c.value}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
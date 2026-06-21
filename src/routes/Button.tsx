import { useState } from 'react';
import PageHeader from '@/components/style-guide/PageHeader';
import LivePreview from '@/components/style-guide/LivePreview';
import CodeBlock from '@/components/style-guide/CodeBlock';
import PropsTable from '@/components/style-guide/PropsTable';
import StateSwitcher, { type State } from '@/components/style-guide/StateSwitcher';
import { TabsRoot, TabsList, TabsTrigger, TabsPanel } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const variants = ['primary', 'secondary', 'ghost', 'icon'] as const;
const sizes = ['sm', 'md'] as const;

export default function ButtonRoute() {
  const [state, setState] = useState<State>('default');

  const stateClass = {
    default: '',
    hover: 'hover:opacity-90',
    active: 'active:scale-[0.97]',
    focus: 'ring-2 ring-primary',
    disabled: 'opacity-40 pointer-events-none',
  }[state];

  return (
    <div>
      <PageHeader
        title="Button"
        description="4 变体 (primary / secondary / ghost / icon) × 2 尺寸 (sm / md)"
      />
      <section className="glass-l3 rounded-xl p-4 space-y-4">
        <StateSwitcher value={state} onChange={setState} />
        <TabsRoot defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">预览</TabsTrigger>
            <TabsTrigger value="code">代码</TabsTrigger>
            <TabsTrigger value="props">属性</TabsTrigger>
          </TabsList>
          <TabsPanel value="preview">
            <LivePreview className="flex-col items-start">
              {variants.map((v) => (
                <div key={v} className="flex items-center gap-2">
                  <span className="text-xs text-text-3 w-20">{v}</span>
                  {sizes.map((s) => (
                    <Button key={s} variant={v} size={s} className={cn(stateClass)}>
                      {v === 'icon' ? '✦' : `${v} ${s}`}
                    </Button>
                  ))}
                </div>
              ))}
            </LivePreview>
          </TabsPanel>
          <TabsPanel value="code">
            <CodeBlock
              code={`<Button variant="primary" size="md">提交</Button>
<Button variant="secondary" size="md">取消</Button>
<Button variant="ghost" size="md">更多</Button>
<Button variant="icon" size="md">✦</Button>`}
            />
          </TabsPanel>
          <TabsPanel value="props">
            <PropsTable
              rows={[
                { name: 'variant', type: "'primary' | 'secondary' | 'ghost' | 'icon'", default: "'primary'" },
                { name: 'size', type: "'sm' | 'md'", default: "'md'" },
                { name: 'className', type: 'string' },
                { name: 'children', type: 'ReactNode', required: true },
              ]}
            />
          </TabsPanel>
        </TabsRoot>
      </section>
    </div>
  );
}
import PageHeader from '@/components/style-guide/PageHeader';
import LivePreview from '@/components/style-guide/LivePreview';
import { TabsRoot, TabsList, TabsTrigger, TabsPanel } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Surface() {
  return (
    <div>
      <PageHeader
        title="Surface"
        description="Card (L1 / L2 / L3) + Separator (horizontal / vertical)"
      />
      <section className="glass-l3 rounded-xl p-4">
        <TabsRoot defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">预览</TabsTrigger>
            <TabsTrigger value="code">代码</TabsTrigger>
          </TabsList>
          <TabsPanel value="preview">
            <LivePreview>
              <Card tier="l1" className="p-4 w-48">L1 Card</Card>
              <Card tier="l2" className="p-4 w-48">L2 Card</Card>
              <Card tier="l3" className="p-4 w-48">L3 Card</Card>
              <Separator orientation="horizontal" className="w-full" />
              <Separator orientation="vertical" className="h-12" />
            </LivePreview>
          </TabsPanel>
          <TabsPanel value="code">
            <pre className="glass-l1 rounded-md p-4 text-xs text-text-1 overflow-x-auto">
{`<Card tier="l1">L1 Card</Card>
<Card tier="l2">L2 Card</Card>
<Card tier="l3">L3 Card</Card>
<Separator />
<Separator orientation="vertical" />`}
            </pre>
          </TabsPanel>
        </TabsRoot>
      </section>
    </div>
  );
}
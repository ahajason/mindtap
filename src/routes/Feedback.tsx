import { useState } from 'react';
import { toast } from 'sonner';
import PageHeader from '@/components/style-guide/PageHeader';
import LivePreview from '@/components/style-guide/LivePreview';
import { TabsRoot, TabsList, TabsTrigger, TabsPanel } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DialogWrapper } from '@/components/ui/dialog';

export default function FeedbackRoute() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <PageHeader
        title="Feedback"
        description="Badge / Sonner Toast / Dialog"
      />
      <section className="glass-l3 rounded-xl p-4">
        <TabsRoot defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">预览</TabsTrigger>
            <TabsTrigger value="code">代码</TabsTrigger>
          </TabsList>
          <TabsPanel value="preview">
            <LivePreview className="flex-col items-start gap-4">
              <div className="flex items-center gap-2">
                <Badge>Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="inactive">Inactive</Badge>
                <Badge variant="warning">Warning</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => toast.success('保存成功')}>触发 Toast</Button>
                <Button variant="secondary" onClick={() => setOpen(true)}>打开 Dialog</Button>
              </div>
              <DialogWrapper
                open={open}
                onOpenChange={setOpen}
                title="确认操作"
                description="此操作不可撤销,确定继续?"
              >
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setOpen(false)}>取消</Button>
                  <Button onClick={() => setOpen(false)}>确定</Button>
                </div>
              </DialogWrapper>
            </LivePreview>
          </TabsPanel>
          <TabsPanel value="code">
            <pre className="glass-l1 rounded-md p-4 text-xs text-text-1 overflow-x-auto">
{`import { toast } from 'sonner';
import { DialogWrapper } from '@/components/ui/dialog';

toast.success('保存成功');

<DialogWrapper open={open} onOpenChange={setOpen} title="确认" description="...">
  ...
</DialogWrapper>`}
            </pre>
          </TabsPanel>
        </TabsRoot>
      </section>
    </div>
  );
}
import PageHeader from '@/components/style-guide/PageHeader';
import LivePreview from '@/components/style-guide/LivePreview';
import { TabsRoot, TabsList, TabsTrigger, TabsPanel } from '@/components/ui/tabs';
import { TooltipProvider, TooltipWrapper } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function OverlayRoute() {
  return (
    <div>
      <PageHeader
        title="Overlay"
        description="Tooltip / Tabs (浮层组件)"
      />
      <TabsRoot defaultValue="preview">
        <TabsList>
          <TabsTrigger value="preview">预览</TabsTrigger>
          <TabsTrigger value="code">代码</TabsTrigger>
        </TabsList>
        <TabsPanel value="preview">
          <LivePreview className="flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <TooltipProvider>
                <TooltipWrapper content="提示:这是一段说明" side="top">
                  <Button>Hover 我 (top)</Button>
                </TooltipWrapper>
              </TooltipProvider>
              <TooltipProvider>
                <TooltipWrapper content="右侧提示" side="right">
                  <Badge>Hover 我 (right)</Badge>
                </TooltipWrapper>
              </TooltipProvider>
            </div>
            <TabsRoot defaultValue="a">
              <TabsList>
                <TabsTrigger value="a">子 Tab A</TabsTrigger>
                <TabsTrigger value="b">子 Tab B</TabsTrigger>
              </TabsList>
              <TabsPanel value="a"><div className="p-4">A 内容</div></TabsPanel>
              <TabsPanel value="b"><div className="p-4">B 内容</div></TabsPanel>
            </TabsRoot>
          </LivePreview>
        </TabsPanel>
        <TabsPanel value="code">
          <pre className="glass-l1 rounded-md p-4 text-xs text-text-1 overflow-x-auto">
{`<TooltipWrapper content="提示" side="top">
  <Button>Hover</Button>
</TooltipWrapper>`}
          </pre>
        </TabsPanel>
      </TabsRoot>
    </div>
  );
}
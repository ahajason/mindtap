import PageHeader from '@/components/style-guide/PageHeader';
import LivePreview from '@/components/style-guide/LivePreview';
import CodeBlock from '@/components/style-guide/CodeBlock';
import { TabsRoot, TabsList, TabsTrigger, TabsPanel } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function InputRoute() {
  return (
    <div>
      <PageHeader
        title="Input / Textarea / Label"
        description="表单输入三件套"
      />
      <TabsRoot defaultValue="preview">
        <TabsList>
          <TabsTrigger value="preview">预览</TabsTrigger>
          <TabsTrigger value="code">代码</TabsTrigger>
        </TabsList>
        <TabsPanel value="preview">
          <LivePreview className="flex-col items-start gap-3">
            <div className="flex flex-col gap-1 w-64">
              <Label required>姓名</Label>
              <Input placeholder="输入姓名" />
            </div>
            <div className="flex flex-col gap-1 w-64">
              <Label>简介</Label>
              <Textarea placeholder="说点什么" />
            </div>
            <div className="flex flex-col gap-1 w-64">
              <Label>禁用</Label>
              <Input disabled placeholder="不可用" />
            </div>
          </LivePreview>
        </TabsPanel>
        <TabsPanel value="code">
          <CodeBlock
            code={`<Label required>姓名</Label>
<Input placeholder="输入姓名" />

<Label>简介</Label>
<Textarea placeholder="说点什么" />`}
          />
        </TabsPanel>
      </TabsRoot>
    </div>
  );
}
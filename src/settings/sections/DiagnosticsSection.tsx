import { Section } from '../components/Section'
import { Button } from '@/components/ui/button'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import { toast } from 'sonner'

export function DiagnosticsSection() {
  const { data, refresh } = useDiagnostics()
  if (!data) return null
  const copy = () => {
    const snap = JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(snap).then(() => toast.success('已复制诊断快照'))
  }
  return (
    <Section kicker="诊断" title="运行状态">
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="glass-l2 rounded-glass-sm p-2">
          <div className="text-xs text-muted-foreground">辅助功能</div>
          <div>{data.accessibility ? '✓ 已授权' : '✗ 未授权'}</div>
        </div>
        <div className="glass-l2 rounded-glass-sm p-2">
          <div className="text-xs text-muted-foreground">快捷键</div>
          <div>{data.hotkeyRegistered ? '✓ 已注册' : '✗ 未注册'}</div>
        </div>
        <div className="glass-l2 rounded-glass-sm p-2">
          <div className="text-xs text-muted-foreground">浮窗</div>
          <div>{data.floatingVisible ? '▣ 显示中' : '▢ 隐藏'}</div>
        </div>
        <div className="glass-l2 rounded-glass-sm p-2">
          <div className="text-xs text-muted-foreground">记录数</div>
          <div>{data.db.recordCount}</div>
        </div>
        {data.activeTask && (
          <div className="glass-l2 rounded-glass-sm p-2 col-span-2">
            <div className="text-xs text-muted-foreground">进行中任务</div>
            <div className="truncate">{data.activeTask.content}</div>
          </div>
        )}
        <div className="glass-l2 rounded-glass-sm p-2 col-span-2">
          <div className="text-xs text-muted-foreground">数据库</div>
          <div className="font-mono text-xs truncate">{data.db.path}</div>
          <div className="text-xs text-muted-foreground">{(data.db.sizeBytes / 1024).toFixed(1)} KB</div>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Button variant="outline" size="sm" onClick={refresh}>刷新</Button>
        <Button variant="outline" size="sm" onClick={copy}>复制快照</Button>
      </div>
    </Section>
  )
}

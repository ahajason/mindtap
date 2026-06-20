import { useState } from 'react'
import { Section } from '../components/Section'
import { Button } from '@/components/ui/button'
import { useDiagnostics } from '@/hooks/useDiagnostics'
import { api } from '@/lib/tauri-bridge'
import { toast } from 'sonner'

// R5:浮窗物理诊断报告(Rust 端 floating_diagnose command 返回)。
// 一次 invoke 拿到 {exists, visible, position, size, monitors},主窗 diagnostics 面板
// "Run Diag" 按钮触发,详情展开 → 用户截图发我看 → 不再 incremental 调试。
type FloatingDiag = Awaited<ReturnType<typeof api.floatingDiagnose>>

export function DiagnosticsSection() {
  const { data, refresh } = useDiagnostics()
  const [diag, setDiag] = useState<FloatingDiag | null>(null)
  const [diagLoading, setDiagLoading] = useState(false)
  if (!data) return null
  const copy = () => {
    const snap = JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(snap).then(() => toast.success('已复制诊断快照'))
  }
  const runDiag = async () => {
    setDiagLoading(true)
    try {
      const r = await api.floatingDiagnose()
      setDiag(r)
      toast.success('浮窗诊断完成,详情见下方')
    } catch (e) {
      toast.error(`浮窗诊断失败: ${String(e)}`)
    } finally {
      setDiagLoading(false)
    }
  }
  return (
    <Section kicker="诊断" title="运行状态">
      <div className="grid grid-cols-2 gap-2 text-sm">
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
        <Button variant="outline" size="sm" onClick={runDiag} disabled={diagLoading}>
          {diagLoading ? '诊断中…' : 'Run Floating Diag'}
        </Button>
      </div>
      {diag && (
        <pre className="mt-3 p-2 text-xs bg-muted/40 rounded-glass-sm overflow-x-auto font-mono whitespace-pre-wrap">
          {JSON.stringify(diag, null, 2)}
        </pre>
      )}
    </Section>
  )
}

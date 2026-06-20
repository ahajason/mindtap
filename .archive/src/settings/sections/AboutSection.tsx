import { Section } from '../components/Section'
import { useDiagnostics } from '@/hooks/useDiagnostics'

export function AboutSection() {
  const { data } = useDiagnostics()
  if (!data) return null
  return (
    <Section kicker="关于" title="轻念 · Mindtap">
      <dl className="grid grid-cols-2 gap-y-1 text-sm">
        <dt className="text-muted-foreground">App 版本</dt><dd>{data.app.version}</dd>
        <dt className="text-muted-foreground">已启动次数</dt><dd>{data.app.totalLaunches}</dd>
        <dt className="text-muted-foreground">技术栈</dt><dd>Tauri 2 · React 19 · SQLite</dd>
      </dl>
    </Section>
  )
}

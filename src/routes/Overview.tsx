import PageHeader from '@/components/style-guide/PageHeader';
import { Card } from '@/components/ui/card';

export default function Overview() {
  return (
    <div>
      <PageHeader
        title="浅色玻璃拟态 · 设计语言"
        description="3-tier 玻璃 (L1 / L2 / L3) + 4 要素 (模糊 + 半透 + 高光 + 阴影)"
      />
      <div className="grid grid-cols-3 gap-4">
        <Card tier="l1" className="p-6">
          <h3 className="text-h2 font-semibold text-text-1 mb-2">L1 基础</h3>
          <p className="text-sm text-text-2">blur 20px · fill 0.35 · border 0.60 · shadow 0.08</p>
        </Card>
        <Card tier="l2" className="p-6">
          <h3 className="text-h2 font-semibold text-text-1 mb-2">L2 中等</h3>
          <p className="text-sm text-text-2">blur 24px · fill 0.42 · border 0.70 · shadow 0.10</p>
        </Card>
        <Card tier="l3" className="p-6">
          <h3 className="text-h2 font-semibold text-text-1 mb-2">L3 顶层</h3>
          <p className="text-sm text-text-2">blur 28px · fill 0.50 · border 0.80 · shadow 0.12</p>
        </Card>
      </div>
    </div>
  );
}
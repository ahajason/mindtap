// 一个最小 Liquid Glass 玻璃容器
// Apple HIG: 玻璃只用于功能层（controls/navigation），不用于内容
// 此处作为脚手架 demo 临时使用，Sprint 4 视觉打磨时再细化
interface SurfaceProps {
  children: React.ReactNode;
  className?: string;
}

export function Surface({ children, className = '' }: SurfaceProps) {
  return <div className={`surface ${className}`}>{children}</div>;
}

interface PageHeaderProps {
  title: string;
  description?: string;
}

export default function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold text-text-1">{title}</h1>
      {description && <p className="text-sm text-text-2 mt-1">{description}</p>}
    </header>
  );
}
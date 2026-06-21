interface PropRow {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description?: string;
}

interface PropsTableProps {
  rows: PropRow[];
}

export default function PropsTable({ rows }: PropsTableProps) {
  return (
    <div className="rounded-[var(--radius-input)] glass-l1 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-white/30 text-text-2 text-xs">
          <tr>
            <th className="text-left px-3 py-2 font-medium">Name</th>
            <th className="text-left px-3 py-2 font-medium">Type</th>
            <th className="text-left px-3 py-2 font-medium">Default</th>
            <th className="text-left px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-t border-white/40">
              <td className="px-3 py-2 font-mono text-text-1">
                {row.name}
                {row.required && <span className="text-[var(--color-error)] ml-1">*</span>}
              </td>
              <td className="px-3 py-2 font-mono text-text-2 text-xs">{row.type}</td>
              <td className="px-3 py-2 font-mono text-text-3 text-xs">{row.default ?? '—'}</td>
              <td className="px-3 py-2 text-text-2">{row.description ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
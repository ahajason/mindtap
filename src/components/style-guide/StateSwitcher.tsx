import { cn } from '@/lib/utils';

type State = 'default' | 'hover' | 'active' | 'focus' | 'disabled';

interface StateSwitcherProps {
  value: State;
  onChange: (s: State) => void;
}

const states: State[] = ['default', 'hover', 'active', 'focus', 'disabled'];

export default function StateSwitcher({ value, onChange }: StateSwitcherProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 glass-l1 rounded-[var(--radius-input)]">
      {states.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={cn(
            'px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-base',
            value === s ? 'bg-white/55 text-text-1' : 'text-text-2 hover:bg-white/35'
          )}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

export type { State };
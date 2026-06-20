import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = 'tsx' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative rounded-[var(--radius-input)] glass-l1 p-4 group">
      <pre className={cn('text-xs text-text-1 overflow-x-auto')}>
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md glass-l1 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={copied ? '已复制' : '复制代码'}
      >
        {copied ? (
          <Check size={14} className="text-[var(--color-success)]" />
        ) : (
          <Copy size={14} />
        )}
      </button>
      <span className="absolute top-2 left-2 text-[10px] text-text-3 uppercase">{language}</span>
    </div>
  );
}
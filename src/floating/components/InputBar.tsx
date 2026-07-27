type InputBarProps = {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.Ref<HTMLInputElement>;
  maxLength: number;
  submitting: boolean;
};

export function InputBar({
  value,
  onChange,
  onKeyDown,
  inputRef,
  maxLength,
  submitting,
}: InputBarProps) {
  return (
    <div className="flex flex-col gap-1">
      <input
        ref={inputRef}
        type="text"
        className="glass-l1 h-9 w-full rounded-xl px-3 text-[14px] text-text-1 outline-none placeholder:text-text-3 focus:bg-white/30"
        placeholder="我现在在做什么…（回车开始）"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        maxLength={maxLength}
        disabled={submitting}
        aria-label="任务标题"
      />
      <span className="text-right text-[12px] text-text-3">
        {value.length}/{maxLength}
      </span>
    </div>
  );
}

import { forwardRef } from "react";

type InputBarProps = {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  inputRef: React.Ref<HTMLInputElement>;
  maxLength: number;
  submitting: boolean;
};

export const InputBar = forwardRef<HTMLInputElement, InputBarProps>(function InputBar(
  { value, onChange, onKeyDown, maxLength, submitting },
  ref,
) {
  return (
    <div className="flex flex-col gap-1">
      <input
        ref={ref}
        type="text"
        className="w-full rounded-md bg-white/10 px-2 py-1 text-[12px] text-white outline-none placeholder:text-white/40 focus:bg-white/20"
        placeholder="我现在在做什么…（回车开始）"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        maxLength={maxLength}
        disabled={submitting}
        aria-label="任务标题"
      />
      <span className="text-right text-[10px] text-white/40">
        {value.length}/{maxLength}
      </span>
    </div>
  );
});
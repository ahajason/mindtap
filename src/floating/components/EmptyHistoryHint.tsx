type Props = {
  onClickCreate: () => void;
};

export function EmptyHistoryHint({ onClickCreate }: Props) {
  return (
    <button
      type="button"
      aria-label="引导新建任务"
      onClick={onClickCreate}
      className="block w-full rounded-lg border border-dashed border-text-3/30 bg-white/50 px-3 py-3 text-center text-xs text-text-2 hover:bg-white/70"
    >
      <span aria-hidden="true">👋 </span>
      还没有历史任务,先新建一个试试?
    </button>
  );
}

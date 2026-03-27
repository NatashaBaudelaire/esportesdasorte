const LiveBadge = () => {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[0.65rem] font-body font-semibold uppercase tracking-wide">
      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-live" />
      Ao Vivo
    </span>
  );
};

export default LiveBadge;

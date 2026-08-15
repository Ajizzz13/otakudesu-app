export default function SectionHead({ tag, title }: { tag: string; title: string }) {
  return (
    <div className="mb-6">
      <span className="font-mono text-xs text-accent tracking-[0.2em]">{tag}</span>
      <h2 className="font-display text-xl text-paper mt-1">{title}</h2>
      <div className="h-px w-full bg-gradient-to-r from-line to-transparent mt-2" />
    </div>
  );
}
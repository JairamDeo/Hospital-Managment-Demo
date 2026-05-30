export const ComingSoonPage = ({ title }: { title: string }) => (
  <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-card border border-border-sage bg-white p-8 text-center">
    <h2 className="text-xl font-bold text-ink">{title}</h2>
    <p className="mt-2 text-sm text-ink-soft">This section is coming soon.</p>
  </div>
);

export default ComingSoonPage;

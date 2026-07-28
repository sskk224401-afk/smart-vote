export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.10),transparent_60%)]" />
      <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-emerald-500/15 blur-3xl animate-float-slow" />
      <div
        className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl animate-float-slow"
        style={{ animationDelay: '4s' }}
      />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl animate-pulse-glow" />
    </div>
  );
}

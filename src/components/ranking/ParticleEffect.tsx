import { cn } from "@/lib/utils";

const ParticleEffect = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div
      className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full animate-spotlight-pulse"
      style={{
        background: 'radial-gradient(circle, rgba(250,204,21,0.15) 0%, rgba(250,204,21,0.05) 40%, transparent 70%)',
      }}
    />
    <div
      className="absolute top-12 left-[20%] w-48 h-48 rounded-full opacity-30"
      style={{
        background: 'radial-gradient(circle, rgba(148,163,184,0.2) 0%, transparent 70%)',
        animation: 'spotlight-pulse 4s ease-in-out infinite 1s',
      }}
    />
    <div
      className="absolute top-16 right-[20%] w-40 h-40 rounded-full opacity-25"
      style={{
        background: 'radial-gradient(circle, rgba(251,146,60,0.2) 0%, transparent 70%)',
        animation: 'spotlight-pulse 4s ease-in-out infinite 2s',
      }}
    />
    {Array.from({ length: 12 }).map((_, i) => (
      <div
        key={i}
        className={cn(
          "absolute rounded-full",
          i % 4 === 0 ? "w-1 h-1 bg-warning/25" :
          i % 4 === 1 ? "w-0.5 h-0.5 bg-primary/20" :
          i % 4 === 2 ? "w-0.5 h-0.5 bg-success/15" :
          "w-1 h-1 bg-info/20"
        )}
        style={{
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`,
          animation: `float-particle ${5 + Math.random() * 5}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 4}s`,
        }}
      />
    ))}
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={`glow-${i}`}
        className={cn(
          "absolute w-2 h-2 rounded-full blur-sm",
          i % 2 === 0 ? "bg-warning/10" : "bg-primary/10"
        )}
        style={{
          left: `${20 + Math.random() * 60}%`,
          top: `${20 + Math.random() * 60}%`,
          animation: `float-particle ${6 + Math.random() * 4}s ease-in-out infinite`,
          animationDelay: `${Math.random() * 3}s`,
        }}
      />
    ))}
  </div>
);

export default ParticleEffect;

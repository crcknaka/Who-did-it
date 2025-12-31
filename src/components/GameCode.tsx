import { cn } from '@/lib/utils';

interface GameCodeProps {
  code: string;
  className?: string;
}

export const GameCode = ({ code, className }: GameCodeProps) => {
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground uppercase tracking-widest">
        Код игры
      </span>
      <div className="flex gap-2">
        {code.split('').map((char, i) => (
          <div
            key={i}
            className="w-12 h-14 flex items-center justify-center bg-card border-2 border-primary rounded-xl text-2xl font-black text-primary glow-gold animate-bounce-in"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            {char}
          </div>
        ))}
      </div>
    </div>
  );
};

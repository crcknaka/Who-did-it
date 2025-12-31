import { cn } from '@/lib/utils';

interface PlayerAvatarProps {
  name: string;
  isHost?: boolean;
  isReady?: boolean;
  score?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const avatarColors = [
  'from-pink to-purple',
  'from-gold to-pink',
  'from-cyan to-gold',
  'from-purple to-cyan',
  'from-pink to-gold',
  'from-cyan to-pink',
];

export const PlayerAvatar = ({ 
  name, 
  isHost, 
  isReady,
  score,
  className,
  size = 'md' 
}: PlayerAvatarProps) => {
  const colorIndex = name.charCodeAt(0) % avatarColors.length;
  const initials = name.slice(0, 2).toUpperCase();

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-lg',
    lg: 'w-20 h-20 text-2xl',
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative">
        <div 
          className={cn(
            "rounded-full flex items-center justify-center font-black bg-gradient-to-br",
            avatarColors[colorIndex],
            sizeClasses[size],
            isReady && "ring-4 ring-accent ring-offset-2 ring-offset-background"
          )}
        >
          {initials}
        </div>
        {isHost && (
          <span className="absolute -top-2 -right-2 text-xl">👑</span>
        )}
        {score !== undefined && (
          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
            {score}
          </div>
        )}
      </div>
      <span className="text-sm font-semibold text-foreground truncate max-w-20">
        {name}
      </span>
    </div>
  );
};

import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: string;
  roundNumber?: number;
  totalRounds?: number;
  className?: string;
}

export const QuestionCard = ({ 
  question, 
  roundNumber, 
  totalRounds,
  className 
}: QuestionCardProps) => {
  return (
    <div className={cn(
      "relative p-6 md:p-8 bg-card border-2 border-primary/30 rounded-2xl glow-gold animate-bounce-in",
      className
    )}>
      {roundNumber && totalRounds && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-4 py-1 rounded-full text-sm font-bold">
          Раунд {roundNumber}/{totalRounds}
        </div>
      )}
      <p className="text-xl md:text-2xl font-bold text-center leading-relaxed">
        {question}
      </p>
    </div>
  );
};

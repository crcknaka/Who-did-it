import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGame } from '@/hooks/useGame';
import { Snowfall } from '@/components/Snowfall';
import { GameCode } from '@/components/GameCode';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { QuestionCard } from '@/components/QuestionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Send, Check, Trophy, ArrowRight } from 'lucide-react';

const Game = () => {
  const { code } = useParams<{ code: string }>();
  const {
    gameState,
    playerId,
    currentPlayer,
    isHost,
    subscribeToGame,
    startGame,
    submitAnswer,
    moveToVoting,
    submitVote,
    showResults,
    nextRound,
  } = useGame();

  const [answer, setAnswer] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (code) {
      let cleanup: (() => void) | undefined;
      subscribeToGame(code).then((cleanupFn) => {
        cleanup = cleanupFn;
      });
      return () => {
        if (cleanup) cleanup();
      };
    }
  }, [code, subscribeToGame]);

  useEffect(() => {
    // Reset states when round changes
    setAnswer('');
    setHasAnswered(false);
    setSelectedAnswer(null);
    setSelectedPlayer(null);
    setHasVoted(false);
  }, [gameState?.currentRound, gameState?.phase]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) return;
    await submitAnswer(answer.trim());
    setHasAnswered(true);
  };

  const handleVote = async () => {
    if (!selectedAnswer || !selectedPlayer) return;
    await submitVote(selectedAnswer, selectedPlayer);
    setHasVoted(true);
  };

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Snowfall />
        <div className="animate-pulse text-2xl font-bold text-primary">
          Загружаем игру... 🎲
        </div>
      </div>
    );
  }

  // Lobby Phase
  if (gameState.phase === 'lobby') {
    return (
      <div className="min-h-screen flex flex-col p-4 relative">
        <Snowfall />
        <div className="relative z-10 flex-1 flex flex-col max-w-lg mx-auto w-full">
          <div className="text-center space-y-4 py-6">
            <h1 className="text-2xl font-black text-gradient-gold">
              Ждём игроков 🎉
            </h1>
            <GameCode code={gameState.code} />
          </div>

          <div className="flex-1 bg-card/50 rounded-2xl p-4 border border-border">
            <h2 className="text-lg font-bold mb-4 text-center">
              Игроки ({gameState.players.length}/12)
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {gameState.players.map((player, i) => (
                <div key={player.id} className="animate-bounce-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <PlayerAvatar
                    name={player.name}
                    isHost={player.isHost}
                    isReady={player.id === playerId}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="py-6 space-y-4">
            {isHost ? (
              <>
                <Button
                  variant="hero"
                  size="xl"
                  className="w-full"
                  onClick={startGame}
                  disabled={gameState.players.length < 2}
                >
                  <Play className="w-6 h-6" />
                  Начать игру!
                </Button>
                {gameState.players.length < 2 && (
                  <p className="text-center text-muted-foreground text-sm">
                    Нужно минимум 2 игрока
                  </p>
                )}
              </>
            ) : (
              <div className="text-center text-muted-foreground animate-pulse">
                Ждём, пока хост начнёт игру... 🎮
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Answering Phase
  if (gameState.phase === 'answering') {
    return (
      <div className="min-h-screen flex flex-col p-4 relative">
        <Snowfall />
        <div className="relative z-10 flex-1 flex flex-col max-w-lg mx-auto w-full">
          <QuestionCard
            question={gameState.currentQuestion}
            roundNumber={gameState.currentRound}
            totalRounds={gameState.totalRounds}
            className="mt-6"
          />

          <div className="flex-1 flex flex-col justify-center py-8">
            {!hasAnswered ? (
              <div className="space-y-4 animate-slide-up">
                <p className="text-center text-muted-foreground">
                  Напиши имя друга (анонимно!) 🤫
                </p>
                <Input
                  placeholder="Имя игрока..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="text-center text-xl h-16 rounded-xl border-2 border-primary/30 focus:border-primary"
                  maxLength={30}
                />
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full"
                  onClick={handleSubmitAnswer}
                  disabled={!answer.trim()}
                >
                  <Send className="w-5 h-5" />
                  Отправить ответ
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4 animate-bounce-in">
                <div className="text-6xl">✅</div>
                <p className="text-xl font-bold text-primary">
                  Ответ отправлен!
                </p>
                <p className="text-muted-foreground">
                  Ждём остальных игроков...
                </p>
              </div>
            )}
          </div>

          <div className="py-4 space-y-2">
            <div className="flex justify-center gap-2 flex-wrap">
              {gameState.players.map((p) => {
                const answered = gameState.answers.some(a => a.playerId === p.id);
                return (
                  <div
                    key={p.id}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                      answered 
                        ? 'bg-accent text-accent-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {p.name} {answered && '✓'}
                  </div>
                );
              })}
            </div>
            {isHost && gameState.answers.length === gameState.players.length && (
              <Button
                variant="pink"
                size="lg"
                className="w-full mt-4"
                onClick={moveToVoting}
              >
                Перейти к голосованию →
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Voting Phase
  if (gameState.phase === 'voting') {
    const myAnswer = gameState.answers.find(a => a.playerId === playerId);
    const otherAnswers = gameState.answers.filter(a => a.playerId !== playerId);
    const otherPlayers = gameState.players.filter(p => p.id !== playerId);

    return (
      <div className="min-h-screen flex flex-col p-4 relative">
        <Snowfall />
        <div className="relative z-10 flex-1 flex flex-col max-w-lg mx-auto w-full">
          <QuestionCard
            question={gameState.currentQuestion}
            roundNumber={gameState.currentRound}
            totalRounds={gameState.totalRounds}
            className="mt-6"
          />

          {!hasVoted ? (
            <div className="flex-1 py-6 space-y-6 overflow-auto">
              <p className="text-center text-muted-foreground">
                Угадай, кто написал каждый ответ! 🔍
              </p>
              
              {/* Answers to vote on */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                  Выбери ответ:
                </h3>
                {otherAnswers.map((a) => (
                  <button
                    key={a.id}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      selectedAnswer === a.id
                        ? 'bg-primary text-primary-foreground glow-gold'
                        : 'bg-card border border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedAnswer(a.id)}
                  >
                    <span className="text-lg font-semibold">"{a.text}"</span>
                  </button>
                ))}
              </div>

              {selectedAnswer && (
                <div className="space-y-3 animate-slide-up">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                    Кто это написал?
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {otherPlayers.map((p) => (
                      <button
                        key={p.id}
                        className={`p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                          selectedPlayer === p.id
                            ? 'bg-secondary text-secondary-foreground glow-pink'
                            : 'bg-card border border-border hover:border-secondary/50'
                        }`}
                        onClick={() => setSelectedPlayer(p.id)}
                      >
                        <PlayerAvatar name={p.name} size="sm" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedAnswer && selectedPlayer && (
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full animate-bounce-in"
                  onClick={handleVote}
                >
                  <Check className="w-5 h-5" />
                  Подтвердить
                </Button>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 animate-bounce-in">
                <div className="text-6xl">🗳️</div>
                <p className="text-xl font-bold text-primary">
                  Голос принят!
                </p>
                <p className="text-muted-foreground">
                  Ждём остальных...
                </p>
              </div>
            </div>
          )}

          <div className="py-4">
            <div className="flex justify-center gap-2 flex-wrap">
              {gameState.players.map((p) => {
                const voted = gameState.votes.some(v => v.voterId === p.id);
                return (
                  <div
                    key={p.id}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      voted 
                        ? 'bg-accent text-accent-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {p.name} {voted && '✓'}
                  </div>
                );
              })}
            </div>
            {isHost && gameState.votes.length >= gameState.players.length - 1 && (
              <Button
                variant="pink"
                size="lg"
                className="w-full mt-4"
                onClick={showResults}
              >
                Показать результаты 🎯
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Results Phase
  if (gameState.phase === 'results') {
    return (
      <div className="min-h-screen flex flex-col p-4 relative">
        <Snowfall />
        <div className="relative z-10 flex-1 flex flex-col max-w-lg mx-auto w-full">
          <div className="text-center py-6">
            <h1 className="text-3xl font-black text-gradient-hero">
              Результаты раунда! 🎉
            </h1>
          </div>

          <div className="flex-1 space-y-4 overflow-auto">
            {gameState.answers.map((answer, i) => {
              const author = gameState.players.find(p => p.id === answer.playerId);
              return (
                <div
                  key={answer.id}
                  className="bg-card border border-border rounded-xl p-4 animate-slide-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <p className="text-lg font-bold mb-2">"{answer.text}"</p>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Автор:</span>
                    <span className="font-bold text-primary">{author?.name}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {isHost && (
            <div className="py-6">
              <Button
                variant="hero"
                size="lg"
                className="w-full"
                onClick={nextRound}
              >
                {gameState.currentRound >= gameState.totalRounds ? (
                  <>
                    <Trophy className="w-5 h-5" />
                    Финальный счёт
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-5 h-5" />
                    Следующий раунд
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Leaderboard Phase
  if (gameState.phase === 'leaderboard') {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    
    return (
      <div className="min-h-screen flex flex-col p-4 relative overflow-hidden">
        <Snowfall />
        <div className="relative z-10 flex-1 flex flex-col max-w-lg mx-auto w-full">
          <div className="text-center py-8 space-y-4">
            <div className="text-6xl animate-float">🏆</div>
            <h1 className="text-4xl font-black text-gradient-hero">
              Победители!
            </h1>
          </div>

          <div className="flex-1 space-y-4">
            {sortedPlayers.map((player, i) => {
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-4 rounded-xl animate-slide-up ${
                    i === 0 
                      ? 'bg-primary/20 border-2 border-primary glow-gold' 
                      : 'bg-card border border-border'
                  }`}
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <span className="text-3xl w-12 text-center">
                    {medal || `#${i + 1}`}
                  </span>
                  <PlayerAvatar name={player.name} size="md" />
                  <div className="flex-1">
                    <p className="font-bold text-lg">{player.name}</p>
                  </div>
                  <div className="text-2xl font-black text-primary">
                    {player.score}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Спасибо за игру! 🎊
            </p>
            <Button
              variant="outline"
              size="lg"
              onClick={() => window.location.href = '/'}
            >
              Новая игра
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Game;

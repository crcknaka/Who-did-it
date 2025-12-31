import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Snowfall } from '@/components/Snowfall';
import { useGame } from '@/hooks/useGame';
import { Sparkles, Users, PartyPopper } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { createGame, joinGame, loading } = useGame();
  const [mode, setMode] = useState<'home' | 'create' | 'join'>('home');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    const gameCode = await createGame(name.trim());
    if (gameCode) {
      navigate(`/game/${gameCode}`);
    }
  };

  const handleJoin = async () => {
    if (!name.trim() || !code.trim()) return;
    const gameCode = await joinGame(code.trim(), name.trim());
    if (gameCode) {
      navigate(`/game/${gameCode}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <Snowfall />
      
      <div className="relative z-10 w-full max-w-md space-y-8 animate-slide-up">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="Who Did It" 
              className="max-w-full h-auto max-h-64 object-contain animate-bounce-in"
            />
          </div>
          <p className="text-muted-foreground text-lg">
           🕵️Новогодняя игра, где виноват кто-то из вас — вопрос лишь кто именно.<br></br><br></br>

Паша скажет, что был в море,<br></br>
Игорь — что это бус сам,<br></br>
Оля будет защищать яйцо дракона,<br></br>
Артём пошутит… но не смешно,<br></br>
Алина просто ела курочку,<br></br>
Илья всё это придумал,<br></br>
А Сфера… он вообще ещё не спит?<br></br><br></br>

Смех, обвинения и разрушенные алиби гарантированы ( если игра будет работать вообше )🥂😄 <br></br>
И да — кто-то точно это сделал.
          </p>
        </div>

        {/* Home Mode */}
        {mode === 'home' && (
          <div className="space-y-4 animate-bounce-in">
            <Button
              variant="gold"
              size="xl"
              className="w-full"
              onClick={() => setMode('create')}
            >
              <PartyPopper className="w-6 h-6" />
              Создать игру
            </Button>
            <Button
              variant="pink"
              size="xl"
              className="w-full"
              onClick={() => setMode('join')}
            >
              <Users className="w-6 h-6" />
              Присоединиться
            </Button>
          </div>
        )}

        {/* Create Mode */}
        {mode === 'create' && (
          <div className="space-y-4 animate-bounce-in">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-center flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Как тебя зовут?
              </h2>
              <Input
                placeholder="Твоё имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-center text-lg h-14 rounded-xl border-2 border-primary/30 focus:border-primary"
                maxLength={20}
              />
              <Button
                variant="gold"
                size="lg"
                className="w-full"
                onClick={handleCreate}
                disabled={!name.trim() || loading}
              >
                {loading ? 'Создаём...' : 'Создать игру 🚀'}
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setMode('home')}
            >
              ← Назад
            </Button>
          </div>
        )}

        {/* Join Mode */}
        {mode === 'join' && (
          <div className="space-y-4 animate-bounce-in">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-center">Присоединиться</h2>
              <Input
                placeholder="Твоё имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-center text-lg h-14 rounded-xl border-2 border-primary/30 focus:border-primary"
                maxLength={20}
              />
              <Input
                placeholder="Код игры (4 символа)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-2xl font-mono h-14 rounded-xl border-2 border-secondary/30 focus:border-secondary tracking-widest"
                maxLength={4}
              />
              <Button
                variant="pink"
                size="lg"
                className="w-full"
                onClick={handleJoin}
                disabled={!name.trim() || code.length !== 4 || loading}
              >
                {loading ? 'Подключаемся...' : 'Войти 🎯'}
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setMode('home')}
            >
              ← Назад
            </Button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-muted-foreground text-sm">
          2–12 игроков • Новогодняя party-игра by cRc^ 🎄
        </p>
      </div>
    </div>
  );
};

export default Index;

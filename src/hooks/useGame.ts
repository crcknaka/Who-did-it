import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getRandomQuestions, generateGameCode } from '@/lib/questions';
import { useToast } from '@/hooks/use-toast';

export type GamePhase = 'lobby' | 'answering' | 'voting' | 'results' | 'leaderboard';

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

export interface Answer {
  id: string;
  playerId: string;
  playerName: string;
  text: string;
}

export interface Vote {
  voterId: string;
  answerId: string;
  guessedPlayerId: string;
}

export interface GameState {
  id: string;
  code: string;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  currentQuestion: string;
  players: Player[];
  answers: Answer[];
  votes: Vote[];
  questions: string[];
}

export const useGame = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Restore playerId from localStorage on mount
  useEffect(() => {
    const savedPlayerId = localStorage.getItem('playerId');
    if (savedPlayerId) {
      setPlayerId(savedPlayerId);
    }
  }, []);

  // Create a new game
  const createGame = useCallback(async (hostName: string) => {
    setLoading(true);
    try {
      const code = generateGameCode();
      const questions = getRandomQuestions(5);
      const newPlayerId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('games')
        .insert({
          code,
          phase: 'lobby',
          current_round: 0,
          total_rounds: 5,
          current_question: questions[0],
          questions,
          host_id: newPlayerId,
        })
        .select()
        .single();

      if (error) throw error;

      // Add host as first player
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          id: newPlayerId,
          game_id: data.id,
          name: hostName,
          score: 0,
          is_host: true,
        });

      if (playerError) throw playerError;

      setPlayerId(newPlayerId);
      localStorage.setItem('playerId', newPlayerId);
      
      return data.code;
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Join existing game
  const joinGame = useCallback(async (code: string, playerName: string) => {
    setLoading(true);
    try {
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (gameError || !game) {
        throw new Error('Игра не найдена');
      }

      if (game.phase !== 'lobby') {
        throw new Error('Игра уже началась');
      }

      const newPlayerId = crypto.randomUUID();
      
      const { error: playerError } = await supabase
        .from('players')
        .insert({
          id: newPlayerId,
          game_id: game.id,
          name: playerName,
          score: 0,
          is_host: false,
        });

      if (playerError) throw playerError;

      setPlayerId(newPlayerId);
      localStorage.setItem('playerId', newPlayerId);
      
      return game.code;
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Subscribe to game updates
  const subscribeToGame = useCallback(async (code: string) => {
    const gameCode = code.toUpperCase();

    // Fetch initial data
    const fetchGameData = async () => {
      // Always refetch the game to get the latest data
      const { data: game } = await supabase
        .from('games')
        .select('*')
        .eq('code', gameCode)
        .single();

      if (!game) return;

      const { data: players } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', game.id);

      const { data: answers } = await supabase
        .from('answers')
        .select('*')
        .eq('game_id', game.id)
        .eq('round', game.current_round);

      const { data: votes } = await supabase
        .from('votes')
        .select('*')
        .eq('game_id', game.id)
        .eq('round', game.current_round);

      setGameState({
        id: game.id,
        code: game.code,
        phase: game.phase as GamePhase,
        currentRound: game.current_round,
        totalRounds: game.total_rounds,
        currentQuestion: game.current_question,
        players: (players || []).map(p => ({
          id: p.id,
          name: p.name,
          score: p.score,
          isHost: p.is_host,
        })),
        answers: (answers || []).map(a => ({
          id: a.id,
          playerId: a.player_id,
          playerName: a.player_name,
          text: a.text,
        })),
        votes: (votes || []).map(v => ({
          voterId: v.voter_id,
          answerId: v.answer_id,
          guessedPlayerId: v.guessed_player_id,
        })),
        questions: game.questions || [],
      });
    };

    // Fetch initial data
    await fetchGameData();

    // Get game ID for subscription
    const { data: game } = await supabase
      .from('games')
      .select('id')
      .eq('code', gameCode)
      .single();

    if (!game) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`game-${game.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${game.id}` }, fetchGameData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${game.id}` }, fetchGameData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'answers', filter: `game_id=eq.${game.id}` }, fetchGameData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `game_id=eq.${game.id}` }, fetchGameData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Start the game
  const startGame = useCallback(async () => {
    if (!gameState) return;
    
    // Minimum 2 players required to start
    if (gameState.players.length < 2) {
      toast({
        title: 'Недостаточно игроков',
        description: 'Нужно минимум 2 игрока для начала игры',
        variant: 'destructive',
      });
      return;
    }
    
    await supabase
      .from('games')
      .update({ 
        phase: 'answering', 
        current_round: 1,
        current_question: gameState.questions[0]
      })
      .eq('id', gameState.id);
  }, [gameState, toast]);

  // Submit answer
  const submitAnswer = useCallback(async (text: string) => {
    if (!gameState || !playerId) return;
    
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;

    await supabase.from('answers').insert({
      game_id: gameState.id,
      player_id: playerId,
      player_name: player.name,
      round: gameState.currentRound,
      text,
    });
  }, [gameState, playerId]);

  // Move to voting phase
  const moveToVoting = useCallback(async () => {
    if (!gameState) return;
    
    await supabase
      .from('games')
      .update({ phase: 'voting' })
      .eq('id', gameState.id);
  }, [gameState]);

  // Submit vote
  const submitVote = useCallback(async (answerId: string, guessedPlayerId: string) => {
    if (!gameState || !playerId) return;

    await supabase.from('votes').insert({
      game_id: gameState.id,
      voter_id: playerId,
      answer_id: answerId,
      guessed_player_id: guessedPlayerId,
      round: gameState.currentRound,
    });
  }, [gameState, playerId]);

  // Calculate and show results
  const showResults = useCallback(async () => {
    if (!gameState) return;

    // Calculate scores based on correct guesses
    const correctGuesses: Record<string, number> = {};
    
    for (const vote of gameState.votes) {
      const answer = gameState.answers.find(a => a.id === vote.answerId);
      if (answer && vote.guessedPlayerId === answer.playerId) {
        correctGuesses[vote.voterId] = (correctGuesses[vote.voterId] || 0) + 100;
      }
    }

    // Update player scores
    for (const [pid, points] of Object.entries(correctGuesses)) {
      const player = gameState.players.find(p => p.id === pid);
      if (player) {
        await supabase
          .from('players')
          .update({ score: player.score + points })
          .eq('id', pid);
      }
    }

    await supabase
      .from('games')
      .update({ phase: 'results' })
      .eq('id', gameState.id);
  }, [gameState]);

  // Move to next round or leaderboard
  const nextRound = useCallback(async () => {
    if (!gameState) return;

    if (gameState.currentRound >= gameState.totalRounds) {
      await supabase
        .from('games')
        .update({ phase: 'leaderboard' })
        .eq('id', gameState.id);
    } else {
      const nextRoundNum = gameState.currentRound + 1;
      await supabase
        .from('games')
        .update({ 
          phase: 'answering',
          current_round: nextRoundNum,
          current_question: gameState.questions[nextRoundNum - 1]
        })
        .eq('id', gameState.id);
    }
  }, [gameState]);

  // Get current player
  const currentPlayer = gameState?.players.find(p => p.id === playerId);
  const isHost = currentPlayer?.isHost ?? false;

  return {
    gameState,
    playerId,
    currentPlayer,
    isHost,
    loading,
    createGame,
    joinGame,
    subscribeToGame,
    startGame,
    submitAnswer,
    moveToVoting,
    submitVote,
    showResults,
    nextRound,
  };
};

"use client";

import { useState } from 'react';
import { Player, MonkeyType, MONKEY_NAMES } from '@/types/player';
import { Difficulty } from '@/types/congress';
import PlayerDisplay from './PlayerDisplay';

interface AddRoundFormProps {
  congressId: number;
  players: Player[];
  onClose: () => void;
  onSuccess: () => void;
}

interface PlayerScore {
  player_tag: string;
  stage_reached: number;
  lives_lost: number;
  extra_stages: number;
  monkey_used: MonkeyType;
  tiebreaker_points: number | null;
}

interface MonkeyAssignment {
  player: Player;
  assignedMonkey: MonkeyType;
  gotPreference: boolean;
}

const STAGE_COUNTS = {
  [Difficulty.Beginner]: { main: 10, extra: 10 },
  [Difficulty.Advanced]: { main: 30, extra: 10 },
  [Difficulty.Expert]: { main: 50, extra: 10 },
  [Difficulty.Master]: { main: 10, extra: 10 }
};

export default function AddRoundForm({ congressId, players, onClose, onSuccess }: AddRoundFormProps) {
  // Step management
  const [currentStep, setCurrentStep] = useState<'select-players' | 'configure-round'>('select-players');
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  
  // Round configuration state
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Beginner);
  const [isSmb1, setIsSmb1] = useState(false);
  const [showDistributor, setShowDistributor] = useState(false);
  const [isDistributing, setIsDistributing] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [distributionMessage, setDistributionMessage] = useState<string>('');
  const [monkeyAssignments, setMonkeyAssignments] = useState<MonkeyAssignment[]>([]);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadingMessages = [
    'Initializing Monkey Distribution System...',
    'Analyzing player preferences...',
    'Resolving monkey conflicts...',
    'Calculating optimal assignments...',
    'Finalizing distribution...'
  ];

  const maxStages = STAGE_COUNTS[difficulty];
  const extraStagesCount = isSmb1 ? 5 : 10;

  const handlePlayerToggle = (player: Player) => {
    setSelectedPlayers(current => {
      const isSelected = current.some(p => p.player_tag === player.player_tag);
      if (isSelected) {
        return current.filter(p => p.player_tag !== player.player_tag);
      } else if (current.length < 4) {
        return [...current, player];
      }
      return current;
    });
  };

  const handleProceedToRound = () => {
    if (selectedPlayers.length < 2) {
      setError('Please select at least 2 players');
      return;
    }
    setError(null);
    // Initialize player scores for selected players
    setPlayerScores(selectedPlayers.map(p => ({
      player_tag: p.player_tag,
      stage_reached: 0,
      lives_lost: 0,
      extra_stages: 0,
      monkey_used: p.monkey_preference,
      tiebreaker_points: null
    })));
    setCurrentStep('configure-round');
  };

  const distributeMonkeys = () => {
    setIsDistributing(true);
    setShowDistributor(true);
    setLoadingStage(0);

    // Cycle through loading messages
    const messageInterval = setInterval(() => {
      setLoadingStage(stage => (stage + 1) % loadingMessages.length);
    }, 600);

    // Start the distribution process with a delay for suspense
    setTimeout(() => {
      clearInterval(messageInterval);
      // Count preferences for each monkey
      const preferences = new Map<MonkeyType, Player[]>();
      const monkeyTypes = [MonkeyType.AiAi, MonkeyType.MeeMee, MonkeyType.Baby, MonkeyType.GonGon];
      for (const monkey of monkeyTypes) {
        preferences.set(monkey, players.filter(p => p.monkey_preference === monkey));
      }

      // 1. First pass: Assign uncontested preferences
      const assignments: MonkeyAssignment[] = [];
      const contestedGroups = new Map<MonkeyType, Player[]>();
      const availableMonkeys = new Set(monkeyTypes);

      for (const [monkey, preferringPlayers] of preferences) {
        if (preferringPlayers.length === 1) {
          // Uncontested preference - assign immediately
          assignments.push({
            player: preferringPlayers[0],
            assignedMonkey: monkey,
            gotPreference: true
          });
          availableMonkeys.delete(monkey);
        } else if (preferringPlayers.length > 1) {
          // Store contested groups for next pass
          contestedGroups.set(monkey, preferringPlayers);
        }
      }

      // 2. Second pass: Handle contested preferences
      for (const [monkey, contestants] of contestedGroups) {
        if (!availableMonkeys.has(monkey)) continue; // Monkey already assigned

        // Randomly select one player from the contestants to get their preference
        const luckyIndex = Math.floor(Math.random() * contestants.length);
        const luckyPlayer = contestants[luckyIndex];
        
        assignments.push({
          player: luckyPlayer,
          assignedMonkey: monkey,
          gotPreference: true
        });
        availableMonkeys.delete(monkey);

        // Remove the lucky player from contestants and add others to remaining pool
        const remainingPlayers = contestants.filter((_, index) => index !== luckyIndex);
        contestedGroups.set(monkey, remainingPlayers);
      }

      // 3. Final pass: Randomly assign remaining players to remaining monkeys
      const remainingPlayers: Player[] = Array.from(contestedGroups.values()).flat();
      const remainingMonkeys = Array.from(availableMonkeys);
      
      // Shuffle remaining monkeys
      for (let i = remainingMonkeys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingMonkeys[i], remainingMonkeys[j]] = [remainingMonkeys[j], remainingMonkeys[i]];
      }

      // Assign remaining players to shuffled monkeys
      remainingPlayers.forEach((player, index) => {
        assignments.push({
          player,
          assignedMonkey: remainingMonkeys[index],
          gotPreference: remainingMonkeys[index] === player.monkey_preference
        });
      });

      // Update player scores with new assignments
      const newScores = [...playerScores];
      assignments.forEach(assignment => {
        const scoreIndex = newScores.findIndex(s => s.player_tag === assignment.player.player_tag);
        if (scoreIndex !== -1) {
          newScores[scoreIndex].monkey_used = assignment.assignedMonkey;
        }
      });

      // Generate distribution message
      const gotPreference = assignments.filter(a => a.gotPreference).length;
      let message = '';
      if (gotPreference === players.length) {
        message = '🎉 Perfect! Everyone got their preferred monkey!';
      } else {
        message = `✨ ${gotPreference} player${gotPreference > 1 ? 's' : ''} got their preferred monkey!`;
      }

      // Update state with results
      setTimeout(() => {
        setMonkeyAssignments(assignments);
        setPlayerScores(newScores);
        setDistributionMessage(message);
        setIsDistributing(false);
        setLoadingStage(0);
      }, 1000);
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/congresses/${congressId}/rounds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          difficulty,
          players: playerScores
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create round');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {currentStep === 'select-players' ? 'Select Players' : 'Add New Round'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {currentStep === 'select-players' ? (
          <div>
            <p className="text-gray-600 mb-4">
              Select 2-4 players for this round
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {players.map((player) => {
                const isSelected = selectedPlayers.some(p => p.player_tag === player.player_tag);
                return (
                  <button
                    key={player.player_tag}
                    onClick={() => handlePlayerToggle(player)}
                    className={`p-4 border rounded-lg transition-colors ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <PlayerDisplay player={player} showMonkey size="md" />
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="text-red-500 text-sm mb-4">{error}</div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleProceedToRound}
                disabled={selectedPlayers.length < 2}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Continue with {selectedPlayers.length} Player{selectedPlayers.length !== 1 ? 's' : ''}
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {Object.values(Difficulty).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isSmb1"
                  checked={isSmb1}
                  onChange={(e) => setIsSmb1(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="isSmb1" className="text-sm font-medium text-gray-700">
                  SMB1 Mode
                </label>
              </div>
              <button
                type="button"
                onClick={distributeMonkeys}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
              >
                🍌 MDS 🎲
              </button>
            </div>

            <div className="space-y-4">
              {playerScores.map((score, index) => {
                const player = selectedPlayers.find(p => p.player_tag === score.player_tag)!;
                return (
                  <div key={score.player_tag} className="border rounded-lg p-4">
                    <div className="flex items-center gap-4 mb-4">
                      <PlayerDisplay player={player} size="sm" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Monkey Used
                        </label>
                        <select
                          value={score.monkey_used}
                          onChange={(e) => {
                            const newScores = [...playerScores];
                            newScores[index].monkey_used = Number(e.target.value) as MonkeyType;
                            setPlayerScores(newScores);
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          {Object.entries(MONKEY_NAMES).map(([value, name]) => (
                            <option key={value} value={value}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stage Reached (0-{maxStages.main})
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={maxStages.main}
                          value={score.stage_reached}
                          onChange={(e) => {
                            const newScores = [...playerScores];
                            newScores[index].stage_reached = Math.min(
                              Math.max(0, parseInt(e.target.value) || 0),
                              maxStages.main
                            );
                            setPlayerScores(newScores);
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Lives Lost
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={score.lives_lost}
                          onChange={(e) => {
                            const newScores = [...playerScores];
                            newScores[index].lives_lost = Math.max(0, parseInt(e.target.value) || 0);
                            setPlayerScores(newScores);
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Extra Stages (0-{extraStagesCount})
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={extraStagesCount}
                          value={score.extra_stages}
                          onChange={(e) => {
                            const newScores = [...playerScores];
                            newScores[index].extra_stages = Math.min(
                              Math.max(0, parseInt(e.target.value) || 0),
                              extraStagesCount
                            );
                            setPlayerScores(newScores);
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tiebreaker Points
                        </label>
                        <input
                          type="number"
                          value={score.tiebreaker_points ?? ''}
                          onChange={(e) => {
                            const newScores = [...playerScores];
                            const value = e.target.value === '' ? null : parseInt(e.target.value);
                            newScores[index].tiebreaker_points = value;
                            setPlayerScores(newScores);
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add Round'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep('select-players')}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Back to Player Selection
              </button>
            </div>
          </form>
        )}

        {showDistributor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Monkey Distribution System</h3>
                <button
                  onClick={() => setShowDistributor(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {isDistributing ? (
                <div className="text-center py-8">
                  <div className="relative mx-auto w-24 h-24 mb-8">
                    {/* Outer ring with gradient effect */}
                    <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
                  </div>

                  {/* Animated text */}
                  <div className="h-16">
                    <p className="text-lg font-semibold animate-fade-in">
                      {loadingMessages[loadingStage]}
                    </p>
                    <div className="mt-2 flex justify-center gap-1">
                      <span className="animate-bounce delay-0">•</span>
                      <span className="animate-bounce delay-100">•</span>
                      <span className="animate-bounce delay-200">•</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center text-lg font-semibold mb-6">
                    {distributionMessage}
                  </div>

                  <div className="space-y-4 mb-6">
                    {monkeyAssignments.map((assignment) => (
                      <div key={assignment.player.player_tag} 
                        className={`flex items-center gap-4 p-4 rounded-lg ${
                          assignment.gotPreference ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                      >
                        <PlayerDisplay player={assignment.player} size="md" />
                        <span className="text-lg">→</span>
                        <div className="flex-1">
                          <span className="text-lg font-semibold">
                            {MONKEY_NAMES[assignment.assignedMonkey]}
                          </span>
                          {assignment.gotPreference && (
                            <span className="ml-2 text-green-500">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={distributeMonkeys}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex-1"
                    >
                      🎲 Try Different Luck
                    </button>
                    <button
                      onClick={() => setShowDistributor(false)}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                    >
                      ✅ Accept Assignments
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
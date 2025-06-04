"use client";

import { useState, useEffect} from 'react';
import { Congress, Round } from '@/types/congress';
import { Player, MONKEY_NAMES, MonkeyType } from '@/types/player';
import PlayerDisplay from '@/components/PlayerDisplay';
import AddRoundForm from '@/components/AddRoundForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useParams } from 'next/navigation'
interface CongressWithPlayers extends Omit<Congress, 'players'> {
  players: Player[];
}

export default function CongressDetail() {
  const [congress, setCongress] = useState<CongressWithPlayers | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddRound, setShowAddRound] = useState(false);
  const [editingRound, setEditingRound] = useState<Round | null>(null);
  const {id} = useParams<{id: string}>()

  const fetchCongressData = async () => {
    try {
      // Fetch congress data
      const congressResponse = await fetch(`/api/congresses/${id}`);
      if (!congressResponse.ok) throw new Error('Failed to fetch congress');
      const congressData = await congressResponse.json();

      // Fetch all players
      const playersResponse = await fetch('/api/players');
      if (!playersResponse.ok) throw new Error('Failed to fetch players');
      const allPlayers = await playersResponse.json();

      // Filter and attach full player objects to congress
      const congressPlayers = allPlayers.filter((p: Player) => 
        congressData.players.includes(p.player_tag)
      );

      setCongress({
        ...congressData,
        players: congressPlayers
      });


      const roundsResponse = await fetch(`/api/congresses/${id}/rounds`);
      if (!roundsResponse.ok) throw new Error('Failed to fetch rounds');
      const roundsData = await roundsResponse.json();
      setRounds(roundsData);
    } catch (err) {
      setError('Failed to load congress data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCongressData();
  }, [id]);

  const handleRoundAdded = () => {
    // Refresh congress data to show new round
    setLoading(true);
    fetchCongressData();
  };

  const getPlayerById = (playerTag: string) => {
    return congress?.players.find(p => p.player_tag === playerTag);
  };

  const getPlayerCrownCount = (playerTag: string) => {
    return rounds.reduce((count, round) => {
      const playerInRound = round.players.find(p => p.player_tag === playerTag);
      return count + (playerInRound?.final_rank === 1 ? 1 : 0);
    }, 0);
  };

  if (loading) return (
    <div className="p-4">
      <LoadingSpinner size="lg" className="py-8" />
    </div>
  );
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!congress) return <div className="p-4">Congress not found</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{congress.name}</h1>
        <div className="text-gray-600">
          <p>Date: {new Date(congress.date).toLocaleDateString()}</p>
          {congress.location && <p>Location: {congress.location}</p>}
          {congress.notes && <p className="mt-2">{congress.notes}</p>}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Players</h2>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <span className="text-yellow-500">👑</span>
            Round winners
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {congress.players
            .map(player => ({
              ...player,
              crownCount: getPlayerCrownCount(player.player_tag)
            }))
            .sort((a, b) => b.crownCount - a.crownCount) // Sort by crown count (most wins first)
            .map((player, index, sortedPlayers) => {
              const isLeader = player.crownCount > 0 && player.crownCount === sortedPlayers[0].crownCount;
              return (
                <div 
                  key={player.player_tag} 
                  className={`p-4 border rounded-lg ${
                    isLeader ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200'
                  }`}
                >
                  <PlayerDisplay player={player} showMonkey size="md" />
                  {player.crownCount > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-yellow-600">
                      <span className="text-yellow-500">👑</span>
                      <span className="font-semibold">{player.crownCount}</span>
                      <span className="text-gray-500">
                        {player.crownCount === 1 ? 'win' : 'wins'}
                      </span>
                      {isLeader && (
                        <span className="ml-1 text-xs bg-yellow-200 text-yellow-800 px-1 rounded">
                          LEADER
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      <div className="mb-8">
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Rounds</h2>
            <button
              onClick={() => setShowAddRound(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Create Live Round
            </button>
          </div>

          {rounds.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No rounds yet. Create your first live round to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rounds.map((round) => (
                <div key={round.round_id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">
                      Round {round.round_order} - {round.difficulty}
                      {round.players.every(p => p.final_rank === null) && (
                        <span className="ml-2 text-sm px-2 py-1 rounded animate-pulse-fade font-semibold">
                          LIVE
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-500">
                        {round.players.length} players
                      </div>
                      {round.players.every(p => p.final_rank === null) && (
                        <button
                          onClick={() => setEditingRound(round)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 text-sm rounded"
                        >
                          Finish Round
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Rank</th>
                          <th className="text-left py-2">Player</th>
                          <th className="text-left py-2">Monkey</th>
                          <th className="text-left py-2">Stage</th>
                          <th className="text-left py-2">Lives Lost</th>
                          <th className="text-left py-2">Extra Stages</th>
                          <th className="text-left py-2">Tiebreaker</th>
                        </tr>
                      </thead>
                      <tbody>
                        {round.players
                          .sort((a, b) => (a.final_rank || 999) - (b.final_rank || 999))
                          .map((player) => {
                            const playerInfo = getPlayerById(player.player_tag);
                            return (
                              <tr key={player.player_tag} className="border-b">
                                <td className="py-2">
                                  {player.final_rank ? (
                                    <span className="flex items-center gap-1">
                                      #{player.final_rank}
                                      {player.final_rank === 1 && <span className="text-yellow-500">👑</span>}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="py-2">
                                  {playerInfo && (
                                    <PlayerDisplay player={playerInfo} size="sm" />
                                  )}
                                </td>
                                <td className="py-2">
                                  {MONKEY_NAMES[player.monkey_used as MonkeyType]}
                                </td>
                                <td className="py-2">{player.stage_reached}</td>
                                <td className="py-2">{player.lives_lost}</td>
                                <td className="py-2">{player.extra_stages}</td>
                                <td className="py-2">
                                  {player.tiebreaker_points ?? '-'}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {(showAddRound || editingRound) && (
        <AddRoundForm
          congressId={congress.congress_id}
          players={congress.players}
          onClose={() => {
            setShowAddRound(false);
            setEditingRound(null);
          }}
          onSuccess={handleRoundAdded}
          editRound={editingRound ? {
            round_id: editingRound.round_id,
            difficulty: editingRound.difficulty,
            round_order: editingRound.round_order,
            players: editingRound.players.map(p => ({
              player_tag: p.player_tag,
              monkey_used: p.monkey_used
            }))
          } : undefined}
        />
      )}
    </div>
  );
} 
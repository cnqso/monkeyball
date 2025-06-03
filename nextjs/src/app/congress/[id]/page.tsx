"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Congress, Difficulty, Round } from '@/types/congress';
import { Player, MONKEY_NAMES } from '@/types/player';
import PlayerDisplay from '@/components/PlayerDisplay';
import AddRoundForm from '@/components/AddRoundForm';

interface CongressWithPlayers extends Omit<Congress, 'players'> {
  players: Player[];
}

export default function CongressDetail({ params }: { params: { id: string } }) {
  const [congress, setCongress] = useState<CongressWithPlayers | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddRound, setShowAddRound] = useState(false);

  const fetchCongressData = async () => {
    try {
      // Fetch congress data
      const congressResponse = await fetch(`/api/congresses/${params.id}`);
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

      // Fetch rounds
      const roundsResponse = await fetch(`/api/congresses/${params.id}/rounds`);
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
  }, [params.id]);

  const handleRoundAdded = () => {
    // Refresh congress data to show new round
    setLoading(true);
    fetchCongressData();
  };

  const getPlayerById = (playerTag: string) => {
    return congress?.players.find(p => p.player_tag === playerTag);
  };

  if (loading) return <div className="p-4">Loading...</div>;
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
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {congress.players.map((player) => (
            <div key={player.player_tag} className="p-4 border rounded-lg">
              <PlayerDisplay player={player} showMonkey size="md" />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Rounds</h2>
          <button
            onClick={() => setShowAddRound(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add Round
          </button>
        </div>

        <div className="space-y-6">
          {rounds.map((round) => (
            <div key={round.round_id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">
                  Round {round.round_order} - {round.difficulty}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Rank</th>
                      <th className="text-left py-2">Player</th>
                      <th className="text-left py-2">Monkey</th>
                      <th className="text-left py-2">Stage</th>
                      <th className="text-left py-2">Lives Lost</th>
                      <th className="text-left py-2">Extra Stages</th>
                      {round.players.some(p => p.tiebreaker_points !== null) && (
                        <th className="text-left py-2">Tiebreaker</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {round.players.map((player) => {
                      const playerData = getPlayerById(player.player_tag);
                      return (
                        <tr key={player.player_tag} className="border-b last:border-0">
                          <td className="py-2">{player.final_rank}</td>
                          <td className="py-2">
                            {playerData && <PlayerDisplay player={playerData} size="sm" />}
                          </td>
                          <td className="py-2">{MONKEY_NAMES[player.monkey_used]}</td>
                          <td className="py-2">{player.stage_reached}</td>
                          <td className="py-2">{player.lives_lost}</td>
                          <td className="py-2">{player.extra_stages}</td>
                          {round.players.some(p => p.tiebreaker_points !== null) && (
                            <td className="py-2">{player.tiebreaker_points ?? '-'}</td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {rounds.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No rounds yet. Click "Add Round" to start the competition!
            </p>
          )}
        </div>
      </div>

      {showAddRound && (
        <AddRoundForm
          congressId={congress.congress_id}
          players={congress.players}
          onClose={() => setShowAddRound(false)}
          onSuccess={handleRoundAdded}
        />
      )}
    </div>
  );
} 
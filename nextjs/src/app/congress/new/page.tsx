"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Player } from '@/types/player';
import PlayerDisplay from '@/components/PlayerDisplay';

export default function NewCongress() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    notes: '',
    player_tags: [] as string[]
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch available players
    const fetchPlayers = async () => {
      try {
        const response = await fetch('/api/players');
        if (!response.ok) throw new Error('Failed to fetch players');
        const data = await response.json();
        setPlayers(data);
      } catch (err) {
        setError('Failed to load players');
        console.error(err);
      }
    };

    fetchPlayers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/congresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create congress');
      }

      router.push(`/congress/${data.congress_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePlayer = (player_tag: string) => {
    setFormData(prev => ({
      ...prev,
      player_tags: prev.player_tags.includes(player_tag)
        ? prev.player_tags.filter(tag => tag !== player_tag)
        : [...prev.player_tags, player_tag]
    }));
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Create New Congress</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Congress Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location (Optional)
          </label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 border rounded-md"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Players
          </label>
          <div className="grid grid-cols-2 gap-4">
            {players.map((player) => (
              <div
                key={player.player_tag}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  formData.player_tags.includes(player.player_tag)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
                onClick={() => togglePlayer(player.player_tag)}
              >
                <PlayerDisplay player={player} showMonkey size="sm" />
              </div>
            ))}
          </div>
          {players.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No players found. Please add some players first.
            </p>
          )}
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting || formData.player_tags.length === 0}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Congress'}
          </button>
          <Link
            href="/"
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
} 
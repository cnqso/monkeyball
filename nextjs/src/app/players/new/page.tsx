"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MonkeyType, MONKEY_NAMES } from '@/types/player';
import ProfilePictureSelector from '@/components/ProfilePictureSelector';

export default function NewPlayer() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    player_tag: '',
    real_name: '',
    monkey_preference: MonkeyType.AiAi,
    profile_picture_id: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create player');
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-3xl font-bold mb-6">Add New Player</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-6">
          <div className="flex-shrink-0">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Profile Picture
            </label>
            <ProfilePictureSelector
              selectedId={formData.profile_picture_id}
              onChange={(id) => setFormData(prev => ({ ...prev, profile_picture_id: id }))}
            />
          </div>

          <div className="flex-grow space-y-4">
            <div>
              <label htmlFor="player_tag" className="block text-sm font-medium text-gray-700 mb-1">
                Player Tag
              </label>
              <input
                type="text"
                id="player_tag"
                value={formData.player_tag}
                onChange={(e) => setFormData(prev => ({ ...prev, player_tag: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                required
                maxLength={50}
              />
            </div>

            <div>
              <label htmlFor="real_name" className="block text-sm font-medium text-gray-700 mb-1">
                Real Name
              </label>
              <input
                type="text"
                id="real_name"
                value={formData.real_name}
                onChange={(e) => setFormData(prev => ({ ...prev, real_name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md"
                required
                maxLength={100}
              />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="monkey_preference" className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Monkey
          </label>
          <select
            id="monkey_preference"
            value={formData.monkey_preference}
            onChange={(e) => setFormData(prev => ({ ...prev, monkey_preference: Number(e.target.value) }))}
            className="w-full px-3 py-2 border rounded-md"
          >
            {Object.entries(MONKEY_NAMES).map(([value, name]) => (
              <option key={value} value={value}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add Player'}
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
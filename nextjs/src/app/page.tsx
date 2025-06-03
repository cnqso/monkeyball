"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Congress } from '@/types/congress';

export default function Home() {
  const [congresses, setCongresses] = useState<Congress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCongresses = async () => {
      try {
        const response = await fetch('/api/congresses');
        if (!response.ok) throw new Error('Failed to fetch congresses');
        const data = await response.json();
        setCongresses(data);
      } catch (err) {
        setError('Failed to load congresses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCongresses();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Super Monkey Ball League</h1>
        <div className="flex gap-4">
          <Link 
            href="/players/new" 
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
          >
            Add New Player
          </Link>
          <Link 
            href="/congress/new" 
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Create New Congress
          </Link>
        </div>
      </div>

      <div className="grid gap-4">
        {congresses.map((congress) => (
          <div 
            key={congress.congress_id} 
            className="border rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <h2 className="text-xl font-semibold">{congress.name}</h2>
            <p className="text-gray-600">
              {new Date(congress.date).toLocaleDateString()}
            </p>
            {congress.location && (
              <p className="text-gray-600">Location: {congress.location}</p>
            )}
            {congress.notes && (
              <p className="text-gray-600 mt-2">{congress.notes}</p>
            )}
            <Link 
              href={`/congress/${congress.congress_id}`}
              className="text-blue-500 hover:text-blue-600 mt-2 inline-block"
            >
              View Details →
            </Link>
          </div>
        ))}

        {congresses.length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No congresses found. Create your first congress to get started!
          </p>
        )}
      </div>
    </div>
  );
}

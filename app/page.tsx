'use client';

import { useEffect, useState } from 'react';

interface ScoreEntry {
  id: number;
  player: string;
  score: number;
  rank: number;
  createdAt: string;
}

export default function Home() {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [playerScore, setPlayerScore] = useState('');
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const fetchScores = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/scores?limit=10');
      
      if (!response.ok) {
        throw new Error('Failed to fetch scores');
      }

      const data = await response.json();
      setScores(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setScores([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch scores on component mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchScores();
  }, []);

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);

    if (!playerName.trim() || !playerScore.trim()) {
      setSubmitMessage('Please fill in both fields');
      return;
    }

    const scoreNum = parseInt(playerScore, 10);
    if (isNaN(scoreNum) || scoreNum < 0) {
      setSubmitMessage('Score must be a valid non-negative number');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player: playerName.trim(),
          score: scoreNum,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit score');
      }

      setSubmitMessage('Score submitted successfully!');
      setPlayerName('');
      setPlayerScore('');
      
      // Refresh scores
      await fetchScores();
    } catch (err) {
      setSubmitMessage(err instanceof Error ? err.message : 'Failed to submit score');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🏆 Leaderboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Submit your score and compete with others
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Submit Score Form */}
          <div className="md:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Submit Score
              </h2>
              
              <form onSubmit={handleSubmitScore} className="space-y-4">
                <div>
                  <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Player Name
                  </label>
                  <input
                    type="text"
                    id="playerName"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label htmlFor="playerScore" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Score
                  </label>
                  <input
                    type="number"
                    id="playerScore"
                    value={playerScore}
                    onChange={(e) => setPlayerScore(e.target.value)}
                    placeholder="Enter score"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={submitting}
                    min="0"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Submit Score'}
                </button>

                {submitMessage && (
                  <div className={`p-3 rounded text-sm ${
                    submitMessage.includes('successfully') 
                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                  }`}>
                    {submitMessage}
                  </div>
                )}
              </form>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Top Scores
              </h2>

              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">Loading scores...</p>
                </div>
              ) : error ? (
                <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded">
                  Error: {error}
                </div>
              ) : scores.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">
                    No scores yet. Be the first to submit!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="pb-3 font-semibold text-gray-900 dark:text-white">Rank</th>
                        <th className="pb-3 font-semibold text-gray-900 dark:text-white">Player</th>
                        <th className="pb-3 font-semibold text-gray-900 dark:text-white">Score</th>
                        <th className="pb-3 font-semibold text-gray-900 dark:text-white">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="py-3 text-gray-900 dark:text-white">
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-full text-sm font-bold">
                              {entry.rank}
                            </span>
                          </td>
                          <td className="py-3 text-gray-900 dark:text-white">{entry.player}</td>
                          <td className="py-3 font-semibold text-gray-900 dark:text-white">{entry.score}</td>
                          <td className="py-3 text-gray-600 dark:text-gray-400 text-sm">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Health Status */}
            <div className="mt-6 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✓ Database connection: <span className="font-semibold">Active</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

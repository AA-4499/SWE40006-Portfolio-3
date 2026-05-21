'use client';

import { useState, useEffect } from 'react';

// ============================================================================
// Constants & Types
// ============================================================================

interface User {
  id: number;
  name: string;
  createdAt: string;
}

interface Score {
  id: number;
  userId: number;
  player: string;
  score: number;
  rank: number;
  createdAt: string;
}

export default function LeaderboardApp() {
  const [users, setUsers] = useState<User[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [scoreValue, setScoreValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  // Fetch users and scores on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [usersRes, scoresRes] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/scores'),
        ]);

        const usersData = await usersRes.json();
        const scoresData = await scoresRes.json();

        setUsers(usersData.data || []);
        setScores(scoresData.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage('Failed to load data');
        setMessageType('error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUserName.trim()) {
      showMessage('Please enter a user name', 'error');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.error || 'Failed to create user', 'error');
        return;
      }

      setUsers([...users, data.data]);
      setSelectedUserId(data.data.id);
      setNewUserName('');
      showMessage(`User "${data.data.name}" created successfully!`, 'success');
    } catch (error) {
      console.error('Error creating user:', error);
      showMessage('Failed to create user', 'error');
    }
  };

  const handleSubmitScore = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      showMessage('Please select or create a user first', 'error');
      return;
    }

    const score = parseInt(scoreValue, 10);
    if (isNaN(score) || score < 0) {
      showMessage('Please enter a valid score (0 or higher)', 'error');
      return;
    }

    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, score }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.error || 'Failed to submit score', 'error');
        return;
      }

      setScores([data.data, ...scores].sort((a, b) => b.score - a.score));
      setScoreValue('');
      showMessage('Score submitted successfully! 🎉', 'success');
    } catch (error) {
      console.error('Error submitting score:', error);
      showMessage('Failed to submit score', 'error');
    }
  };

  const selectedUserName = users.find((u) => u.id === selectedUserId)?.name;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-700 text-lg">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-blue-900 mb-2">🏆 Leaderboard</h1>
          <p className="text-xl text-blue-700">Submit your score and compete!</p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg text-center font-semibold ${
              messageType === 'success'
                ? 'bg-green-200 text-green-800'
                : 'bg-red-200 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: User Management & Score Submission */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Registration */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">👤 New User?</h2>
              <form onSubmit={handleCreateUser} className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  maxLength={50}
                />
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
                >
                  Register
                </button>
              </form>
            </div>

            {/* User Selection */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">👥 Select User</h2>
              {users.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No users yet. Register above!</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors ${
                        selectedUserId === user.id
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {user.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Score Submission */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-4">📊 Submit Score</h2>
              {selectedUserName ? (
                <form onSubmit={handleSubmitScore} className="space-y-3">
                  <div className="bg-blue-50 px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-600">Playing as:</p>
                    <p className="text-lg font-bold text-blue-900">{selectedUserName}</p>
                  </div>
                  <input
                    type="number"
                    placeholder="Enter your score"
                    value={scoreValue}
                    onChange={(e) => setScoreValue(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    min="0"
                    max="999999"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                  >
                    Submit Score
                  </button>
                </form>
              ) : (
                <p className="text-gray-600 text-center py-4">Select or create a user first</p>
              )}
            </div>
          </div>

          {/* Right Column: Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-3xl font-bold text-blue-900 mb-6">🎯 Top Scores</h2>

              {scores.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📈</div>
                  <p className="text-gray-600 text-lg">No scores yet. Be the first!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-blue-200 bg-blue-50">
                        <th className="text-left py-3 px-4 font-bold text-blue-900">#</th>
                        <th className="text-left py-3 px-4 font-bold text-blue-900">Player</th>
                        <th className="text-right py-3 px-4 font-bold text-blue-900">Score</th>
                        <th className="text-right py-3 px-4 font-bold text-blue-900">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scores.map((score, index) => (
                        <tr
                          key={score.id}
                          className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                            index < 3 ? 'font-semibold' : ''
                          }`}
                        >
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                                index === 0
                                  ? 'bg-yellow-400 text-yellow-900'
                                  : index === 1
                                    ? 'bg-gray-400 text-gray-900'
                                    : index === 2
                                      ? 'bg-orange-400 text-orange-900'
                                      : 'bg-gray-200 text-gray-700'
                              }`}
                            >
                              {score.rank}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-900">{score.player}</td>
                          <td className="py-3 px-4 text-right text-blue-600 font-bold text-lg">
                            {score.score}
                          </td>
                          <td className="py-3 px-4 text-right text-gray-600 text-sm">
                            {new Date(score.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * Spelling Star Game Component
 *
 * A complete spelling-practice game for primary school children with 4 screens:
 * - Home: Grade selection (Easy/Medium/Harder) with Start Quiz and Custom List options
 * - Custom List: User-defined word list with minimum 3-word validation
 * - Quiz: 10-word interactive quiz with speech synthesis, input validation, and feedback
 * - Results: Score display with pie chart visualization (using recharts)
 *
 * All game state managed via React useState — no localStorage or database writes.
 * Uses Web Speech API for word playback (rate 0.85, pitch 1.0, 400ms delay).
 * Styled entirely with Tailwind CSS v4 utilities.
 */

import { useState, useEffect, useRef, useMemo, KeyboardEvent, JSX } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';

// ============================================================================
// Constants & Types
// ============================================================================

interface WordList {
  grade: number;
  label: string;
  words: string[];
}

interface ScoreEntry {
  id: number;
  player: string;
  score: number;
  grade: number;
  rank: number;
}

type Screen = 'home' | 'custom-list' | 'playing' | 'results';
type Feedback = 'correct' | 'wrong' | null;

const WORD_LISTS: WordList[] = [
  {
    grade: 1,
    label: 'Grade 1 – Easy',
    words: [
      'cat', 'dog', 'hat', 'run', 'big', 'red', 'sun', 'map', 'box', 'cup',
      'bed', 'sit', 'hop', 'fan', 'leg', 'win', 'net', 'bug', 'top', 'kit',
    ],
  },
  {
    grade: 2,
    label: 'Grade 2 – Medium',
    words: [
      'apple', 'bread', 'chair', 'drink', 'every', 'floor', 'green', 'house',
      'juice', 'knife', 'light', 'mouse', 'night', 'ocean', 'plant', 'queen',
      'river', 'storm', 'tiger', 'uncle',
    ],
  },
  {
    grade: 3,
    label: 'Grade 3 – Harder',
    words: [
      'animal', 'butter', 'castle', 'dinner', 'engine', 'finger', 'garden',
      'hammer', 'island', 'jungle', 'kitten', 'ladder', 'magnet', 'napkin',
      'oyster', 'pillow', 'rabbit', 'silver', 'tunnel', 'velvet',
    ],
  },
];

const ROUNDS = 10;

// ============================================================================
// Utility Functions
// ============================================================================

function shuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function parseWords(rawInput: string): string[] {
  return rawInput
    .split(/[\n,]+/)
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 0)
    .filter((word, index, allWords) => allWords.indexOf(word) === index);
}

function speakWord(word: string): void {
  if (typeof window === 'undefined') return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

function getGradeMessage(percent: number): string {
  if (percent === 100) return "🏆 Perfect score! You're a spelling champion!";
  if (percent >= 80) return '🌟 Amazing work! Almost perfect!';
  if (percent >= 60) return '👍 Good effort! Keep practising!';
  return '💪 Keep going! Practice makes perfect!';
}

function getGradeLabel(grade: number): string {
  const list = WORD_LISTS.find((wordList) => wordList.grade === grade);
  return list ? list.label : 'Custom';
}

// ============================================================================
// Sub-Components
// ============================================================================

interface HomeScreenProps {
  onStart: (grade: number) => void;
  onOpenCustomList: () => void;
}

function HomeScreen({ onStart, onOpenCustomList }: HomeScreenProps): JSX.Element {
  const [selectedGrade, setSelectedGrade] = useState(1);
  const [leaderboards, setLeaderboards] = useState<Record<number, ScoreEntry[]>>({
    1: [],
    2: [],
    3: [],
  });
  const [leaderboardError, setLeaderboardError] = useState('');
  const [isLoadingLeaderboards, setIsLoadingLeaderboards] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadLeaderboards = async (): Promise<void> => {
      try {
        setIsLoadingLeaderboards(true);
        setLeaderboardError('');

        const results = await Promise.all(
          [1, 2, 3].map(async (grade) => {
            const response = await fetch(`/api/scores?grade=${grade}&limit=5`);
            if (!response.ok) {
              throw new Error(`Failed to load grade ${grade} rankings`);
            }

            const payload = await response.json();
            return [grade, (payload.data || []) as ScoreEntry[]] as const;
          })
        );

        if (!isMounted) return;

        setLeaderboards(Object.fromEntries(results) as Record<number, ScoreEntry[]>);
      } catch (error) {
        console.error('Error loading leaderboards:', error);
        if (isMounted) {
          setLeaderboardError('Ranking dashboard is unavailable right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingLeaderboards(false);
        }
      }
    };

    void loadLeaderboards();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 px-4 py-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        <aside className="bg-white/95 dark:bg-gray-900/95 rounded-3xl shadow-2xl ring-1 ring-blue-100 dark:ring-blue-900 p-5 lg:p-6 sticky top-6 h-fit">
          <div className="flex items-center gap-3 mb-5">
            <div className="text-4xl">🏅</div>
            <div>
              <h2 className="text-2xl font-bold text-blue-950 dark:text-blue-100">Ranking Dashboard</h2>
              <p className="text-sm text-blue-700 dark:text-blue-300">Top players by grade</p>
            </div>
          </div>

          {isLoadingLeaderboards ? (
            <div className="space-y-4">
              {[1, 2, 3].map((grade) => (
                <div key={grade} className="rounded-2xl bg-blue-50 dark:bg-gray-800 p-4 animate-pulse">
                  <div className="h-5 w-32 rounded bg-blue-200 dark:bg-gray-700 mb-3" />
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded bg-blue-100 dark:bg-gray-700" />
                    <div className="h-4 w-5/6 rounded bg-blue-100 dark:bg-gray-700" />
                    <div className="h-4 w-2/3 rounded bg-blue-100 dark:bg-gray-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : leaderboardError ? (
            <div className="rounded-2xl bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-200 p-4 text-sm">
              {leaderboardError}
            </div>
          ) : (
            <div className="space-y-4">
              {[1, 2, 3].map((grade) => {
                const entries = leaderboards[grade] || [];

                return (
                  <section key={grade} className="rounded-2xl bg-blue-50 dark:bg-gray-800 p-4 border border-blue-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-blue-950 dark:text-blue-100">
                          {getGradeLabel(grade)}
                        </h3>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Best scores this week</p>
                      </div>
                      <span className="rounded-full bg-blue-600 text-white text-xs font-bold px-3 py-1">
                        Grade {grade}
                      </span>
                    </div>

                    {entries.length === 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-300">No scores yet.</p>
                    ) : (
                      <ol className="space-y-2">
                        {entries.map((entry) => (
                          <li key={entry.id} className="flex items-center justify-between rounded-xl bg-white dark:bg-gray-900 px-3 py-2 shadow-sm">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-sm font-bold">
                                {entry.rank}
                              </span>
                              <span className="truncate font-semibold text-gray-900 dark:text-gray-100">
                                {entry.player}
                              </span>
                            </div>
                            <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                              {entry.score}/10
                            </span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </aside>

        <main className="flex flex-col items-center justify-center py-6 lg:py-10">
          <div className="text-center mb-10">
            <div className="text-6xl mb-4">📚</div>
            <h1 className="text-5xl font-bold text-blue-900 dark:text-blue-100 mb-2">
              Spelling Star
            </h1>
            <p className="text-xl text-blue-700 dark:text-blue-300">
              Practice your spelling and become a star!
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full mb-6 ring-1 ring-blue-100 dark:ring-gray-700">
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Choose your level:
            </p>
            <div className="flex flex-col gap-3 mb-8">
              {WORD_LISTS.map((wl) => (
                <button
                  key={wl.grade}
                  onClick={() => setSelectedGrade(wl.grade)}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                    selectedGrade === wl.grade
                      ? 'bg-blue-600 text-white scale-105 shadow-md'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {wl.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => onStart(selectedGrade)}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-lg"
              >
                ▶ Start Quiz
              </button>
              <button
                onClick={onOpenCustomList}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition-colors text-lg"
              >
                📝 Create Custom List
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

interface CustomListScreenProps {
  onBack: () => void;
  onStart: (words: string[]) => void;
}

function CustomListScreen({ onBack, onStart }: CustomListScreenProps): JSX.Element {
  const [rawInput, setRawInput] = useState('');

  const parsedWords = useMemo(() => parseWords(rawInput), [rawInput]);
  const canStart = parsedWords.length >= 3;

  const handleStart = (): void => {
    if (canStart) {
      onStart(parsedWords);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">📝</div>
        <h1 className="text-5xl font-bold text-purple-900 dark:text-purple-100 mb-2">
          Create Custom List
        </h1>
        <p className="text-lg text-purple-700 dark:text-purple-300">
          Add at least 3 words. Use commas or new lines.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl w-full mb-6">
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="Example: apple, banana, cherry"
          className="w-full h-48 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:border-purple-500 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400"
        />

        <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
          {canStart
            ? `✓ ${parsedWords.length} words ready`
            : `Add ${3 - parsedWords.length} more word${3 - parsedWords.length === 1 ? '' : 's'}`}
        </p>
      </div>

      <div className="flex gap-3 max-w-2xl w-full">
        <button
          onClick={onBack}
          className="flex-1 py-3 px-4 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
        >
          ← Back to Home
        </button>
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`flex-1 py-3 px-4 font-bold rounded-lg transition-colors text-white ${
            canStart
              ? 'bg-green-600 hover:bg-green-700 cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          ▶ Start Custom Quiz
        </button>
      </div>
    </div>
  );
}

interface QuizScreenProps {
  words: string[];
  onComplete: (score: number) => void;
}

function QuizScreen({ words, onComplete }: QuizScreenProps): JSX.Element {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-speak on word change
  useEffect(() => {
    if (words.length > 0 && feedback === null) {
      const timeout = setTimeout(() => {
        speakWord(words[currentIndex]);
      }, 400);
      inputRef.current?.focus();
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, feedback, words]);

  const submitAnswer = (): void => {
    if (!input.trim() || feedback !== null) return;
    const correct = input.trim().toLowerCase() === words[currentIndex].toLowerCase();
    setFeedback(correct ? 'correct' : 'wrong');
    if (correct) {
      setScore((prev) => prev + 1);
    }
  };

  const nextWord = (): void => {
    if (currentIndex + 1 >= words.length) {
      onComplete(score);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setInput('');
      setFeedback(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      if (feedback === null) {
        submitAnswer();
      } else {
        nextWord();
      }
    }
  };

  const isLast = currentIndex + 1 >= words.length;
  const progressPercent = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 flex flex-col items-center justify-center px-4 py-8">
      {/* Progress Bar */}
      <div className="w-full max-w-2xl mb-8">
        <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl w-full">
        {/* Word Counter */}
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 text-center mb-6">
          Word {currentIndex + 1} of {words.length}
        </p>

        {/* Instruction & Hear Again Button */}
        <div className="text-center mb-8">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            Listen carefully and type what you hear
          </p>
          <button
            onClick={() => speakWord(words[currentIndex])}
            className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
            🔊 Hear Again
          </button>
        </div>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          placeholder="Type your answer..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={feedback !== null}
          autoComplete="off"
          spellCheck="false"
          className="w-full py-3 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-green-500 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600 mb-6 text-lg"
        />

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`p-4 rounded-lg mb-6 text-center font-bold text-lg ${
              feedback === 'correct'
                ? 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-100'
                : 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-100'
            } animate-pulse`}
          >
            {feedback === 'correct'
              ? '✓ Correct!'
              : `✗ Wrong! It's "${words[currentIndex]}"`}
          </div>
        )}

        {/* Submit / Next Button */}
        {feedback === null ? (
          <button
            onClick={submitAnswer}
            className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors text-lg"
          >
            Submit
          </button>
        ) : (
          <button
            onClick={nextWord}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-lg"
          >
            {isLast ? 'See Results' : 'Next Word'}
          </button>
        )}
      </div>
    </div>
  );
}

interface ResultsScreenProps {
  score: number;
  totalWords: number;
  grade: number;
  onRestart: () => void;
}

function ResultsScreen({ score, totalWords, grade, onRestart }: ResultsScreenProps): JSX.Element {
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const percent = Math.round((score / totalWords) * 100);
  const incorrect = totalWords - score;

  const chartData = [
    { name: 'Correct', value: score, fill: '#4ade80' },
    { name: 'Incorrect', value: incorrect, fill: '#ef4444' },
  ];

  const handleSaveScore = async (): Promise<void> => {
    if (!username.trim()) {
      setSaveMessage({ type: 'error', text: 'Please enter your name' });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player: username.trim(),
          score: score,
          grade,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save score');
      }

      setSaveMessage({ type: 'success', text: `🎉 Score saved for ${username}!` });
      setUsername('');
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving score:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save score. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 flex flex-col items-center justify-center px-4 py-8">
      <div className="text-center mb-8">
        <div className="text-7xl mb-4">🎉</div>
        <h1 className="text-5xl font-bold text-yellow-900 dark:text-yellow-100 mb-2">
          Quiz Complete!
        </h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-2xl w-full mb-8">
        {/* Score Circle */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-40 h-40 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex flex-col items-center justify-center shadow-lg">
            <span className="text-5xl font-bold text-white">
              {score}/{totalWords}
            </span>
            <span className="text-2xl font-bold text-white">{percent}%</span>
          </div>
        </div>

        {/* Grade Message */}
        <p className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-200 mb-8">
          {getGradeMessage(percent)}
        </p>

        {/* Pie Chart */}
        <div className="w-full h-80 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <RechartsTooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Save Score Section */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            💾 Save Your Score - {getGradeLabel(grade)}
          </p>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && username.trim()) {
                handleSaveScore();
              }
            }}
            disabled={isSaving}
            className="w-full py-2 px-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-green-500 dark:bg-gray-600 dark:text-gray-100 disabled:bg-gray-200 dark:disabled:bg-gray-500 mb-3"
          />
          <button
            onClick={handleSaveScore}
            disabled={isSaving || !username.trim()}
            className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-colors text-lg"
          >
            {isSaving ? '⏳ Saving...' : '✓ Save Score'}
          </button>

          {/* Save Message */}
          {saveMessage && (
            <div
              className={`mt-3 p-3 rounded-lg text-center font-semibold ${
                saveMessage.type === 'success'
                  ? 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-100'
                  : 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-100'
              }`}
            >
              {saveMessage.text}
            </div>
          )}
        </div>

        {/* Try Again Button */}
        <button
          onClick={onRestart}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-lg"
        >
          ↻ Try Again
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main App Component
// ============================================================================

export default function SpellingStarApp(): JSX.Element {
  const [screen, setScreen] = useState<Screen>('home');
  const [words, setWords] = useState<string[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [currentGrade, setCurrentGrade] = useState(0);

  const handleStartGame = (selectedGrade: number): void => {
    const list = WORD_LISTS.find((wl) => wl.grade === selectedGrade);
    if (!list) return;
    const picked = shuffle(list.words).slice(0, ROUNDS);
    setWords(picked);
    setCurrentGrade(selectedGrade);
    setScreen('playing');
  };

  const handleOpenCustomList = (): void => {
    setScreen('custom-list');
  };

  const handleStartCustomGame = (customWords: string[]): void => {
    const picked = shuffle(customWords).slice(0, ROUNDS);
    setWords(picked);
    setCurrentGrade(0);
    setScreen('playing');
  };

  const handleBackToHome = (): void => {
    setScreen('home');
  };

  const handleQuizComplete = (score: number): void => {
    setFinalScore(score);
    setScreen('results');
  };

  const handleRestart = (): void => {
    setScreen('home');
    setWords([]);
    setFinalScore(0);
    setCurrentGrade(0);
  };

  if (screen === 'home') {
    return (
      <HomeScreen
        onStart={handleStartGame}
        onOpenCustomList={handleOpenCustomList}
      />
    );
  }

  if (screen === 'custom-list') {
    return (
      <CustomListScreen
        onBack={handleBackToHome}
        onStart={handleStartCustomGame}
      />
    );
  }

  if (screen === 'playing') {
    return <QuizScreen words={words} onComplete={handleQuizComplete} />;
  }

  if (screen === 'results') {
    return (
      <ResultsScreen
        score={finalScore}
        totalWords={words.length}
        grade={currentGrade}
        onRestart={handleRestart}
      />
    );
  }

  return <HomeScreen onStart={handleStartGame} onOpenCustomList={handleOpenCustomList} />;
}

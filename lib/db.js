import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client with singleton pattern to avoid multiple instances
const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Get all scores sorted by score descending, limited to top 10
 */
export async function getScores(limit = 10) {
  try {
    const scores = await prisma.score.findMany({
      orderBy: {
        score: 'desc',
      },
      take: limit,
    });

    // Add rank (1-based index)
    return scores.map((score, index) => ({
      ...score,
      rank: index + 1,
    }));
  } catch (error) {
    console.error('Error fetching scores:', error);
    throw new Error('Failed to fetch scores from database');
  }
}

/**
 * Create a new score entry
 */
export async function createScore(playerName, scoreValue) {
  // Validation
  if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
    throw new Error('Player name is required and must be a non-empty string');
  }

  if (typeof scoreValue !== 'number' || scoreValue < 0 || !Number.isInteger(scoreValue)) {
    throw new Error('Score must be a non-negative integer');
  }

  try {
    const score = await prisma.score.create({
      data: {
        player: playerName.trim(),
        score: scoreValue,
      },
    });

    return score;
  } catch (error) {
    console.error('Error creating score:', error);
    throw new Error('Failed to create score in database');
  }
}

/**
 * Get score statistics
 */
export async function getScoreStats() {
  try {
    const stats = await prisma.score.aggregate({
      _avg: { score: true },
      _max: { score: true },
      _min: { score: true },
      _count: true,
    });

    return {
      average: stats._avg.score ? Math.round(stats._avg.score) : 0,
      highest: stats._max.score || 0,
      lowest: stats._min.score || 0,
      total: stats._count,
    };
  } catch (error) {
    console.error('Error fetching score statistics:', error);
    throw new Error('Failed to fetch score statistics');
  }
}

export default prisma;

import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client with singleton pattern to avoid multiple instances
const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Create a new user
 */
export async function createUser(userName) {
  // Validation
  if (!userName || typeof userName !== 'string' || userName.trim().length === 0) {
    throw new Error('User name is required and must be a non-empty string');
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: userName.trim(),
      },
    });

    return user;
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'P2002') {
      throw new Error('User name already exists');
    }
    throw new Error('Failed to create user in database');
  }
}

/**
 * Get all users
 */
export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'asc',
      },
    });

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    if (error.code === 'P2021' || error.code === 'P1000' || error.code === 'P1001' || error.code === 'ECONNREFUSED') {
      console.warn('Database not ready yet, returning empty users');
      return [];
    }
    throw new Error('Failed to fetch users from database');
  }
}

/**
 * Get user by name
 */
export async function getUserByName(userName) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        name: userName.trim(),
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

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
      include: {
        user: true,
      },
    });

    // Add rank (1-based index) and flatten user name into response
    return scores.map((score, index) => ({
      id: score.id,
      userId: score.userId,
      player: score.user.name,
      score: score.score,
      createdAt: score.createdAt,
      rank: index + 1,
    }));
  } catch (error) {
    console.error('Error fetching scores:', error);
    // If table doesn't exist yet or DB is unreachable, return empty array instead of throwing
    if (error.code === 'P2021' || error.code === 'P1000' || error.code === 'P1001' || error.code === 'ECONNREFUSED') {
      console.warn('Database not ready yet, returning empty scores');
      return [];
    }
    throw new Error('Failed to fetch scores from database');
  }
}

/**
 * Create a new score entry
 */
export async function createScore(userId, scoreValue) {
  // Validation
  if (typeof userId !== 'number' || userId <= 0 || !Number.isInteger(userId)) {
    throw new Error('User ID is required and must be a positive integer');
  }

  if (typeof scoreValue !== 'number' || scoreValue < 0 || !Number.isInteger(scoreValue)) {
    throw new Error('Score must be a non-negative integer');
  }

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const score = await prisma.score.create({
      data: {
        userId,
        score: scoreValue,
      },
      include: {
        user: true,
      },
    });

    // Return score with user name flattened
    return {
      id: score.id,
      userId: score.userId,
      player: score.user.name,
      score: score.score,
      createdAt: score.createdAt,
    };
  } catch (error) {
    console.error('Error creating score:', error);
    throw new Error(error.message || 'Failed to create score in database');
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

import { getScores, createScore } from '@/lib/db';

/**
 * GET /api/scores - Fetch top scores leaderboard
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const gradeParam = url.searchParams.get('grade');
    const grade = gradeParam === null ? undefined : parseInt(gradeParam, 10);

    if (limit < 1 || limit > 100) {
      return Response.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    if (gradeParam !== null && (Number.isNaN(grade) || grade < 0 || grade > 3)) {
      return Response.json(
        { error: 'Grade must be between 0 and 3' },
        { status: 400 }
      );
    }

    const scores = await getScores(limit, grade);
    return Response.json({
      success: true,
      data: scores,
      count: scores.length,
      note: scores.length === 0 ? 'No scores yet' : undefined,
    });
  } catch (error) {
    console.error('Error in GET /api/scores:', error);
    // Return empty scores instead of 500 error if database is not ready
    return Response.json(
      {
        success: true,
        data: [],
        count: 0,
        note: 'Database not ready yet',
      },
      { status: 200 }
    );
  }
}

/**
 * POST /api/scores - Submit a new score
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { player, score, grade = 0 } = body;

    // Validate input
    if (!player || score === undefined) {
      return Response.json(
        { error: 'Both player name and score are required' },
        { status: 400 }
      );
    }

    const newScore = await createScore(player, score, grade);

    return Response.json(
      {
        success: true,
        data: newScore,
        message: 'Score submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/scores:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to create score - database may not be ready yet',
      },
      { status: 503 }
    );
  }
}

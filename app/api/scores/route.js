import { getScores, createScore } from '@/lib/db';

/**
 * GET /api/scores - Fetch top scores leaderboard
 */
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    if (limit < 1 || limit > 100) {
      return Response.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    const scores = await getScores(limit);
    return Response.json({
      success: true,
      data: scores,
      count: scores.length,
    });
  } catch (error) {
    console.error('Error in GET /api/scores:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to fetch scores',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/scores - Submit a new score
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { player, score } = body;

    // Validate input
    if (!player || score === undefined) {
      return Response.json(
        { error: 'Both player name and score are required' },
        { status: 400 }
      );
    }

    const newScore = await createScore(player, score);

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
        error: error.message || 'Failed to create score',
      },
      { status: 400 }
    );
  }
}

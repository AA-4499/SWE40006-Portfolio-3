import { createUser, getUsers, getUserByName } from '@/lib/db';

/**
 * GET /api/users - Fetch all registered users
 */
export async function GET(request) {
  try {
    const users = await getUsers();
    return Response.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('Error in GET /api/users:', error);
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
 * POST /api/users - Create a new user
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name } = body;

    // Validate input
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json(
        { error: 'User name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByName(name);
    if (existingUser) {
      return Response.json(
        { error: 'User name already exists' },
        { status: 400 }
      );
    }

    const newUser = await createUser(name);

    return Response.json(
      {
        success: true,
        data: newUser,
        message: 'User created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to create user - database may not be ready yet',
      },
      { status: 503 }
    );
  }
}

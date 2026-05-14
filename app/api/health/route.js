export async function GET() {
  try {
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Prisma 7.8.0 Configuration
 * Defines database connection from environment variable DATABASE_URL
 */

module.exports = {
  datasources: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL,
    },
  },
};

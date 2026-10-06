const dotenv = require('dotenv');
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const isSsl =
  process.env.DB_SSL === 'true' ||
  process.env.DATABASE_SSL === 'true' ||
  (databaseUrl && databaseUrl.includes('sslmode=require'));

const connectionOptions = databaseUrl
  ? {
      type: 'postgres',
      url: databaseUrl,
      ssl: isSsl ? { rejectUnauthorized: false } : false,
    }
  : {
      type: 'postgres',
      host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.DB_PORT || process.env.POSTGRES_PORT || 5432),
      username:
        process.env.DB_USER ||
        process.env.POSTGRES_USER ||
        process.env.DB_USERNAME ||
        'postgres',
      password:
        process.env.DB_PASSWORD ||
        process.env.POSTGRES_PASSWORD ||
        process.env.DB_PASS ||
        'postgres',
      database:
        process.env.DB_NAME ||
        process.env.POSTGRES_DB ||
        process.env.DB_DATABASE ||
        'postgres',
      ssl: isSsl ? { rejectUnauthorized: false } : false,
    };

module.exports = {
  ...connectionOptions,
  entities: ['./src/modules/**/typeorm/entities/*.ts'],
  migrations: ['./src/shared/typeorm/migrations/*.ts'],
  cli: {
    migrationsDir: './src/shared/typeorm/migrations',
  },
};

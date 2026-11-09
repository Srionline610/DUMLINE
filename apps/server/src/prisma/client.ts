import * as path from 'path';
import * as dotenv from 'dotenv';

// Load root .env regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

export interface DatabasePoolOptions {
  host: string;
  port: number;
  user?: string;
  password?: string;
  database: string;
  prepareCacheLength: number;
  ssl?: boolean | { rejectUnauthorized?: boolean };
  connectTimeout?: number;
}

/**
 * Robustly parses and validates database connection parameters.
 * Handles both connection strings (DATABASE_URL / MYSQL_URL) and individual connection fields.
 * Sanitizes wrapping quotes, whitespace, and URI-encodes special characters in credentials.
 */
export function resolveDatabaseConfig(overrideUrl?: string): DatabasePoolOptions {
  const isProduction = (process.env.NODE_ENV || 'development') === 'production';
  let str = (overrideUrl || process.env.DATABASE_URL || process.env.MYSQL_URL || '').trim();

  // Strip enclosing quotes if user copied from a formatted .env file
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1).trim();
  }

  // Fallback to individual connection parameters if present
  if (!str && process.env.MYSQL_HOST && process.env.MYSQL_DATABASE) {
    return {
      host: process.env.MYSQL_HOST.trim(),
      port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
      user: process.env.MYSQL_USER?.trim() || undefined,
      password: process.env.MYSQL_PASSWORD || undefined,
      database: process.env.MYSQL_DATABASE.trim(),
      prepareCacheLength: 0,
    };
  }

  if (!str) {
    if (isProduction) {
      throw new Error(
        'FATAL DATABASE CONFIGURATION: Neither DATABASE_URL nor MYSQL_URL is configured in environment variables. ' +
        'Configure DATABASE_URL in Render Environment settings with a valid MySQL/MariaDB connection string: ' +
        'mysql://<user>:<password>@<host>:<port>/<database>'
      );
    }
    // Default development fallback for local MySQL
    str = 'mysql://dumline_user:DumlineTemp2026!@127.0.0.1:3306/dumline_dev';
  }

  // Detect PostgreSQL connection string (common misconfiguration when creating Render Postgres)
  if (str.startsWith('postgres://') || str.startsWith('postgresql://')) {
    throw new Error(
      'FATAL DATABASE CONFIGURATION: PostgreSQL connection string detected. ' +
      'Dumline requires a MySQL or MariaDB database instance (scheme must be "mysql://" or "mariadb://"). ' +
      'Please provision a MySQL or MariaDB instance (e.g. Aiven, PlanetScale, Railway, or Clever Cloud).'
    );
  }

  let scheme = '';
  let username = '';
  let password = '';
  let host = '';
  let port = 3306;
  let database = '';
  let ssl: boolean | { rejectUnauthorized?: boolean } | undefined;
  let connectTimeout: number | undefined;

  try {
    const parsed = new URL(str);
    scheme = parsed.protocol.replace(':', '');
    username = parsed.username ? decodeURIComponent(parsed.username) : '';
    password = parsed.password ? decodeURIComponent(parsed.password) : '';
    host = parsed.hostname;
    port = parsed.port ? parseInt(parsed.port, 10) : 3306;
    database = parsed.pathname ? decodeURIComponent(parsed.pathname.replace(/^\//, '')) : '';

    // Handle SSL options from search parameters
    const sslParam = parsed.searchParams.get('ssl') || parsed.searchParams.get('sslmode') || parsed.searchParams.get('ssl-mode');
    if (sslParam) {
      if (sslParam.startsWith('{')) {
        try {
          ssl = JSON.parse(sslParam);
        } catch {
          ssl = true;
        }
      } else {
        const lower = sslParam.toLowerCase();
        if (lower === 'false' || lower === 'disable' || lower === 'disabled') {
          ssl = false;
        } else {
          ssl = true;
        }
      }
    }

    if (parsed.searchParams.has('connectTimeout')) {
      connectTimeout = parseInt(parsed.searchParams.get('connectTimeout')!, 10);
    }
  } catch {
    // Regex fallback parser for non-standard URLs (e.g. unescaped '#', '?', or '@' inside password)
    const match = str.match(/^(mysql|mariadb):\/\/(?:([^:]+)(?::([^@]+))?@)?([^:\/?#]+)(?::(\d+))?(?:\/([^?#]+))?(?:\?(.*))?$/);
    if (!match) {
      throw new Error(
        'FATAL DATABASE CONFIGURATION: Malformed database connection string format. ' +
        'Expected format: mysql://[user[:password]@]host[:port]/database[?options]'
      );
    }
    scheme = match[1];
    username = match[2] ? decodeURIComponent(match[2]) : '';
    password = match[3] ? decodeURIComponent(match[3]) : '';
    host = match[4];
    port = match[5] ? parseInt(match[5], 10) : 3306;
    database = match[6] ? decodeURIComponent(match[6]) : '';
  }

  if (scheme !== 'mysql' && scheme !== 'mariadb') {
    throw new Error(
      `FATAL DATABASE CONFIGURATION: Unsupported database scheme "${scheme}://". Scheme must be "mysql://" or "mariadb://".`
    );
  }

  if (!host) {
    throw new Error('FATAL DATABASE CONFIGURATION: Database host is missing in connection string.');
  }

  if (!database) {
    throw new Error(
      'FATAL DATABASE CONFIGURATION: Database name is missing in connection string path. ' +
      'Ensure the URL specifies a database name, e.g.: mysql://user:password@host:3306/dumline_prod'
    );
  }

  return {
    host,
    port,
    user: username || undefined,
    password: password || undefined,
    database,
    prepareCacheLength: 0,
    ...(ssl !== undefined ? { ssl } : {}),
    ...(connectTimeout !== undefined ? { connectTimeout } : {}),
  };
}

// Runtime Prisma client used across the application.
const poolOptions = resolveDatabaseConfig();
const adapter = new PrismaMariaDb(poolOptions);
export const prisma = new PrismaClient({ adapter });

export default prisma;

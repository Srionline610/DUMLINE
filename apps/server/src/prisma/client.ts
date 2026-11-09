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
  ssl?: boolean | { rejectUnauthorized?: boolean; servername?: string };
  connectTimeout?: number;
  acquireTimeout?: number;
  connectionLimit?: number;
}

/**
 * Robustly parses and validates database connection parameters for MySQL, MariaDB,
 * and distributed cloud instances such as TiDB Cloud.
 * Handles complex passwords containing reserved characters (#, @, !, ?, %),
 * enforces secure TLS with Server Name Indication (SNI) on cloud hosts,
 * and configures resilient pool timeouts.
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
    const host = process.env.MYSQL_HOST.trim();
    const isCloud = host.includes('tidbcloud.com') || host.includes('aivencloud.com') || (host !== 'localhost' && host !== '127.0.0.1');
    return {
      host,
      port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : (isCloud ? 4000 : 3306),
      user: process.env.MYSQL_USER?.trim() || undefined,
      password: process.env.MYSQL_PASSWORD || undefined,
      database: process.env.MYSQL_DATABASE.trim(),
      prepareCacheLength: 0,
      ...(isCloud ? { ssl: { rejectUnauthorized: true, servername: host } } : {}),
      connectTimeout: 30000,
      acquireTimeout: 30000,
      connectionLimit: 10,
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
      'Dumline requires a MySQL or MariaDB-compatible database (scheme must be "mysql://" or "mariadb://"). ' +
      'Please configure your MySQL/TiDB Cloud instance in DATABASE_URL.'
    );
  }

  // Extract scheme
  const schemeMatch = str.match(/^([a-zA-Z0-9]+):\/\//);
  if (!schemeMatch) {
    throw new Error(
      'FATAL DATABASE CONFIGURATION: Malformed database connection string format. Scheme missing.'
    );
  }
  const scheme = schemeMatch[1].toLowerCase();
  if (scheme !== 'mysql' && scheme !== 'mariadb') {
    throw new Error(
      `FATAL DATABASE CONFIGURATION: Unsupported database scheme "${scheme}://". Scheme must be "mysql://" or "mariadb://".`
    );
  }

  let rest = str.slice(schemeMatch[0].length);

  // Extract search query (?...)
  let search = '';
  const questionIdx = rest.indexOf('?');
  if (questionIdx !== -1) {
    search = rest.slice(questionIdx);
    rest = rest.slice(0, questionIdx);
  }

  // Extract database name (/...)
  let database = '';
  const slashIdx = rest.indexOf('/');
  if (slashIdx !== -1) {
    database = decodeURIComponent(rest.slice(slashIdx + 1));
    rest = rest.slice(0, slashIdx);
  }

  // Separate credentials from host:port
  // The last '@' before host is the delimiter to support passwords containing '@'
  let username = '';
  let password = '';
  let host = '';
  let port = 3306;

  const atIdx = rest.lastIndexOf('@');
  let hostPortPart = rest;
  if (atIdx !== -1) {
    const credPart = rest.slice(0, atIdx);
    hostPortPart = rest.slice(atIdx + 1);

    const colonIdx = credPart.indexOf(':');
    if (colonIdx !== -1) {
      username = decodeURIComponent(credPart.slice(0, colonIdx));
      password = decodeURIComponent(credPart.slice(colonIdx + 1));
    } else {
      username = decodeURIComponent(credPart);
    }
  }

  // Parse hostPortPart: host[:port]
  if (hostPortPart.startsWith('[')) {
    const closeBracket = hostPortPart.indexOf(']');
    host = hostPortPart.slice(1, closeBracket);
    const after = hostPortPart.slice(closeBracket + 1);
    if (after.startsWith(':')) {
      port = parseInt(after.slice(1), 10);
    }
  } else {
    const colonIdx = hostPortPart.lastIndexOf(':');
    if (colonIdx !== -1) {
      host = hostPortPart.slice(0, colonIdx);
      port = parseInt(hostPortPart.slice(colonIdx + 1), 10);
    } else {
      host = hostPortPart;
      // Default to 4000 for TiDB Cloud if omitted, else 3306
      if (host.includes('tidbcloud.com')) {
        port = 4000;
      }
    }
  }

  if (!host) {
    throw new Error('FATAL DATABASE CONFIGURATION: Database host is missing in connection string.');
  }

  if (!database || database === 'sys') {
    if (!database) {
      throw new Error(
        'FATAL DATABASE CONFIGURATION: Database name is missing in connection string path. ' +
        'Ensure the URL specifies the database name (e.g., mysql://user:password@host:port/dumline).'
      );
    }
    // Warn if connecting to internal system schema
    console.warn(`[DUMLINE DB] Warning: Connection specifies '${database}' database. Ensure this is intentional.`);
  }

  // Parse TLS/SSL settings
  const searchParams = new URLSearchParams(search);
  const sslParam =
    searchParams.get('ssl') ||
    searchParams.get('sslmode') ||
    searchParams.get('ssl-mode') ||
    searchParams.get('sslaccept') ||
    searchParams.get('ssl_mode');

  const isCloudHost =
    host.includes('tidbcloud.com') ||
    host.includes('aivencloud.com') ||
    host.includes('railway') ||
    (host !== 'localhost' && host !== '127.0.0.1' && !host.endsWith('.local'));

  let ssl: boolean | { rejectUnauthorized?: boolean; servername?: string } | undefined = undefined;

  if (sslParam) {
    const lower = sslParam.toLowerCase();
    if (lower === 'false' || lower === 'disable' || lower === 'disabled') {
      ssl = false;
    } else if (sslParam.startsWith('{')) {
      try {
        const parsedJson = JSON.parse(sslParam);
        ssl = {
          rejectUnauthorized: parsedJson.rejectUnauthorized !== false,
          servername: host,
        };
      } catch {
        ssl = { rejectUnauthorized: true, servername: host };
      }
    } else {
      // Handles strict, require, verify-ca, verify-full, true
      ssl = {
        rejectUnauthorized: lower !== 'accept_invalid_certs',
        servername: host,
      };
    }
  } else if (isCloudHost) {
    // Cloud database hosts (e.g. TiDB Cloud) mandate secure TLS with SNI servername
    ssl = { rejectUnauthorized: true, servername: host };
  }

  const connectTimeout = searchParams.has('connectTimeout')
    ? parseInt(searchParams.get('connectTimeout')!, 10)
    : 30000;
  const acquireTimeout = searchParams.has('acquireTimeout')
    ? parseInt(searchParams.get('acquireTimeout')!, 10)
    : 30000;

  return {
    host,
    port,
    user: username || undefined,
    password: password || undefined,
    database,
    prepareCacheLength: 0,
    ...(ssl !== undefined ? { ssl } : {}),
    connectTimeout,
    acquireTimeout,
    connectionLimit: 10,
  };
}

// Runtime Prisma client used across the application.
const poolOptions = resolveDatabaseConfig();
const adapter = new PrismaMariaDb(poolOptions);
export const prisma = new PrismaClient({ adapter });

export default prisma;

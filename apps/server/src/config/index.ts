import * as path from 'path';
import * as dotenv from 'dotenv';

// Load root .env regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const isProduction = (process.env.NODE_ENV || 'development') === 'production';
const rawJwtSecret = process.env.JWT_SECRET?.trim() || '';
const rawCorsOrigin = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || '').trim();

if (isProduction) {
  if (!rawJwtSecret || rawJwtSecret.includes('change_in_production') || rawJwtSecret.length < 32) {
    throw new Error(
      'FATAL SECURITY CONFIGURATION: JWT_SECRET must be set in production to a secure random string of at least 32 characters.'
    );
  }
  if (!rawCorsOrigin || rawCorsOrigin === '*' || rawCorsOrigin.split(',').some((o) => o.trim() === '*')) {
    throw new Error(
      'FATAL SECURITY CONFIGURATION: CORS_ORIGIN must be set in production to specific frontend origin(s) and cannot be missing or wildcard (*).'
    );
  }
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: rawJwtSecret || 'dumline_dev_secret_key_change_in_production',
  corsOrigin: rawCorsOrigin || '*',
  jwtExpiresInSeconds: 24 * 60 * 60, // 24 hours
  gstRate: 0.05, // 5% restaurant GST (all displayed prices are GST-inclusive)
  defaultMinPrepMinutes: 20,
  overdueThresholdMinutes: 10,
  delivery: {
    defaultRadiusKm: 7.0,
    baseFee: 30.0,
    freeDistanceKm: 3.0,
    perKmFee: 10.0,
  },
  mockPayment: {
    successVpa: 'success@upi',
    failVpa: 'fail@upi',
    successCardLast4: '4242',
    failCardLast4: '0002',
  },
};

export const ORDER_STATE_TRANSITIONS: Record<string, string[]> = {
  PLACED: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

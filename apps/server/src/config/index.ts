import * as path from 'path';
import * as dotenv from 'dotenv';

// Load root .env regardless of current working directory
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dumline_dev_secret_key_change_in_production',
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

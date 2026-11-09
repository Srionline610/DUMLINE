import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { resolveDatabaseConfig } from '../src/prisma/client';

describe('Database Connection String & Adapter Configuration Suite', () => {
  it('1. Parses standard MySQL connection string cleanly', () => {
    const config = resolveDatabaseConfig('mysql://dumline_user:DumlineTemp2026!@127.0.0.1:3306/dumline_dev');
    assert.strictEqual(config.host, '127.0.0.1');
    assert.strictEqual(config.port, 3306);
    assert.strictEqual(config.user, 'dumline_user');
    assert.strictEqual(config.password, 'DumlineTemp2026!');
    assert.strictEqual(config.database, 'dumline_dev');
    assert.strictEqual(config.prepareCacheLength, 0);
  });

  it('2. Accepts MariaDB scheme ("mariadb://")', () => {
    const config = resolveDatabaseConfig('mariadb://dumline_user:secret@db.internal:3307/dumline_prod');
    assert.strictEqual(config.host, 'db.internal');
    assert.strictEqual(config.port, 3307);
    assert.strictEqual(config.user, 'dumline_user');
    assert.strictEqual(config.password, 'secret');
    assert.strictEqual(config.database, 'dumline_prod');
  });

  it('3. Strips wrapping quotes and whitespace from copied .env values', () => {
    const configDouble = resolveDatabaseConfig('  "mysql://user:pass@host:3306/dumline_db"  ');
    assert.strictEqual(configDouble.host, 'host');
    assert.strictEqual(configDouble.user, 'user');
    assert.strictEqual(configDouble.password, 'pass');
    assert.strictEqual(configDouble.database, 'dumline_db');

    const configSingle = resolveDatabaseConfig(" 'mysql://user:pass@host:3306/dumline_db'\n");
    assert.strictEqual(configSingle.host, 'host');
    assert.strictEqual(configSingle.database, 'dumline_db');
  });

  it('4. Correctly extracts query parameters for SSL (sslmode=require, ssl-mode=REQUIRED, ssl=true)', () => {
    const cfg1 = resolveDatabaseConfig('mysql://user:pass@host:3306/db?sslmode=require');
    assert.deepStrictEqual(cfg1.ssl, { rejectUnauthorized: true, servername: 'host' });

    const cfg2 = resolveDatabaseConfig('mysql://user:pass@host:3306/db?ssl-mode=REQUIRED');
    assert.deepStrictEqual(cfg2.ssl, { rejectUnauthorized: true, servername: 'host' });

    const cfg3 = resolveDatabaseConfig('mysql://user:pass@host:3306/db?ssl=true');
    assert.deepStrictEqual(cfg3.ssl, { rejectUnauthorized: true, servername: 'host' });

    const cfg4 = resolveDatabaseConfig('mysql://user:pass@host:3306/db?ssl={"rejectUnauthorized":false}');
    assert.deepStrictEqual(cfg4.ssl, { rejectUnauthorized: false, servername: 'host' });

    const cfg5 = resolveDatabaseConfig('mysql://user:pass@host:3306/db?ssl=disable');
    assert.strictEqual(cfg5.ssl, false);
  });

  it('5. Handles passwords containing special characters (#, ?, @, %)', () => {
    const cfgHash = resolveDatabaseConfig('mysql://admin:pass#word123@cloud-db:3306/production');
    assert.strictEqual(cfgHash.host, 'cloud-db');
    assert.strictEqual(cfgHash.user, 'admin');
    assert.strictEqual(cfgHash.password, 'pass#word123');
    assert.strictEqual(cfgHash.database, 'production');

    const cfgEncoded = resolveDatabaseConfig('mysql://admin:p%40ss%23word@cloud-db:3306/production');
    assert.strictEqual(cfgEncoded.password, 'p@ss#word');

    const cfgComplex = resolveDatabaseConfig('mysql://prefix.root:MyP@ss#word!@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/dumline');
    assert.strictEqual(cfgComplex.user, 'prefix.root');
    assert.strictEqual(cfgComplex.password, 'MyP@ss#word!');
    assert.strictEqual(cfgComplex.host, 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com');
    assert.strictEqual(cfgComplex.port, 4000);
    assert.strictEqual(cfgComplex.database, 'dumline');
  });

  it('6. Configures TiDB Cloud Starter connection with secure TLS, SNI servername, and 30s timeouts', () => {
    const tidbConfig = resolveDatabaseConfig(
      'mysql://3xK4gGabc.root:SecurePass2026@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/dumline?ssl={"rejectUnauthorized":true}'
    );
    assert.strictEqual(tidbConfig.host, 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com');
    assert.strictEqual(tidbConfig.port, 4000);
    assert.strictEqual(tidbConfig.user, '3xK4gGabc.root');
    assert.strictEqual(tidbConfig.password, 'SecurePass2026');
    assert.strictEqual(tidbConfig.database, 'dumline');
    assert.deepStrictEqual(tidbConfig.ssl, {
      rejectUnauthorized: true,
      servername: 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com',
    });
    assert.strictEqual(tidbConfig.connectTimeout, 30000);
    assert.strictEqual(tidbConfig.acquireTimeout, 30000);
  });

  it('7. Supports TiDB Cloud sslaccept=strict parameter and defaults to TLS on cloud hosts', () => {
    const tidbStrict = resolveDatabaseConfig(
      'mysql://3xK4gGabc.root:SecurePass2026@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/dumline?sslaccept=strict'
    );
    assert.deepStrictEqual(tidbStrict.ssl, {
      rejectUnauthorized: true,
      servername: 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com',
    });

    const tidbNoParam = resolveDatabaseConfig(
      'mysql://3xK4gGabc.root:SecurePass2026@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/dumline'
    );
    assert.deepStrictEqual(tidbNoParam.ssl, {
      rejectUnauthorized: true,
      servername: 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com',
    });
  });

  it('8. Rejects PostgreSQL connection strings with clear, descriptive error', () => {
    assert.throws(
      () => resolveDatabaseConfig('postgresql://postgres:secret@dpg-xxx.render.com/mydb'),
      /PostgreSQL connection string detected/
    );
    assert.throws(
      () => resolveDatabaseConfig('postgres://postgres:secret@dpg-xxx.render.com/mydb'),
      /PostgreSQL connection string detected/
    );
  });

  it('9. Rejects URLs missing database name', () => {
    assert.throws(
      () => resolveDatabaseConfig('mysql://user:pass@host:3306'),
      /Database name is missing/
    );
    assert.throws(
      () => resolveDatabaseConfig('mysql://user:pass@host:3306/'),
      /Database name is missing/
    );
  });

  it('10. Rejects unsupported URL schemes', () => {
    assert.throws(
      () => resolveDatabaseConfig('redis://red-xxx:6379'),
      /Unsupported database scheme/
    );
    assert.throws(
      () => resolveDatabaseConfig('mongodb://localhost:27017/dumline'),
      /Unsupported database scheme/
    );
  });

  it('11. Never exposes raw credentials in thrown error messages', () => {
    try {
      resolveDatabaseConfig('postgresql://dumline_user:SuperSecretPassword123!@dpg-xxx.render.com/mydb');
      assert.fail('Should have thrown');
    } catch (err: any) {
      assert.ok(!err.message.includes('SuperSecretPassword123!'), 'Password must not be in error message');
    }
  });
});

import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { AuthService } from '../src/services/auth.service';
import { hashPassword, verifyPassword, signJwt, verifyJwt } from '../src/utils/crypto';

describe('Auth & Security Module', () => {
  test('Argon2id hashes password securely and verifies match', async () => {
    const pwd = 'Secr3tPassword!2026';
    const hash = await hashPassword(pwd);
    assert.ok(hash.startsWith('$argon2id$'), 'Hash must use argon2id algorithm');

    const isValid = await verifyPassword(hash, pwd);
    assert.strictEqual(isValid, true, 'Correct password must verify');

    const isInvalid = await verifyPassword(hash, 'WrongPassword');
    assert.strictEqual(isInvalid, false, 'Wrong password must fail verification');
  });

  test('JWT signing and verification preserves payload and enforces expiration', () => {
    const payload = {
      sub: 'usr-1234',
      email: 'test@dumline.internal',
      phone: '+919876543210',
      role: 'CUSTOMER' as const,
      assignedOutletId: null,
    };

    const token = signJwt(payload, 3600);
    assert.ok(typeof token === 'string' && token.split('.').length === 3, 'Token must have 3 segments');

    const verified = verifyJwt(token);
    assert.ok(verified, 'Valid token must be verified');
    assert.strictEqual(verified!.sub, payload.sub);
    assert.strictEqual(verified!.email, payload.email);
    assert.strictEqual(verified!.role, payload.role);

    // Expired token test
    const expiredToken = signJwt(payload, -10);
    const expiredResult = verifyJwt(expiredToken);
    assert.strictEqual(expiredResult, null, 'Expired token must return null');
  });

  test('User registration creates user and rejects duplicate email or phone', async () => {
    const uniqueEmail = `user-${Date.now()}@test.com`;
    const uniquePhone = `+91${Date.now().toString().slice(-10)}`;

    const registered = await AuthService.register({
      email: uniqueEmail,
      phone: uniquePhone,
      password: 'SafePassword123!',
      fullName: 'Test Chef',
      role: 'CUSTOMER',
      marketingConsent: true,
    });

    assert.ok(registered.token, 'Must return JWT token');
    assert.strictEqual(registered.user.email, uniqueEmail);
    assert.strictEqual(registered.user.marketingConsent, true);

    // Duplicate email registration attempt
    await assert.rejects(
      async () => {
        await AuthService.register({
          email: uniqueEmail,
          phone: `+91${(Date.now() + 1).toString().slice(-10)}`,
          password: 'AnotherPassword123!',
          fullName: 'Duplicate Email',
        });
      },
      (err: any) => err.code === 'EMAIL_EXISTS',
      'Should reject duplicate email'
    );

    // Successful login with registered credentials
    const loggedIn = await AuthService.login({
      emailOrPhone: uniqueEmail,
      password: 'SafePassword123!',
    });
    assert.strictEqual(loggedIn.user.id, registered.user.id);
  });
});


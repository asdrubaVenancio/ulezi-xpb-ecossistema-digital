/**
 * Testes unitários da camada JWT.
 * Validam emissão e leitura de access token e refresh token.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
} = require('../src/config/jwt');

test('deve gerar e validar access token', () => {
  const payload = { id: 10, email: 'teste@ulezi.ao', role: 'student' };
  const token = generateToken(payload);
  const decoded = verifyToken(token);

  assert.equal(typeof token, 'string');
  assert.equal(decoded.id, payload.id);
  assert.equal(decoded.email, payload.email);
  assert.equal(decoded.role, payload.role);
});

test('deve gerar e validar refresh token', () => {
  const payload = { id: 22, email: 'investidor@ulezi.ao', role: 'investor' };
  const token = generateRefreshToken(payload);
  const decoded = verifyRefreshToken(token);

  assert.equal(typeof token, 'string');
  assert.equal(decoded.id, payload.id);
  assert.equal(decoded.email, payload.email);
  assert.equal(decoded.role, payload.role);
});

test('não deve validar refresh token como access token', () => {
  const token = generateRefreshToken({ id: 1, email: 'erro@ulezi.ao', role: 'company' });

  assert.throws(() => verifyToken(token));
});

/**
 * Testes de smoke da API principal.
 * Garantem que o servidor responde e mantém o contrato básico.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const { app } = require('../src/server');

let server;
let baseUrl;

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test('deve responder no health check', async () => {
  const response = await fetch(`${baseUrl}/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message, 'Ulezi XPB API está operacional.');
  assert.equal(body.version, '1.0.0');
});

test('deve devolver 404 em rota inexistente', async () => {
  const response = await fetch(`${baseUrl}/rota-que-nao-existe`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.ok(body.message);
});

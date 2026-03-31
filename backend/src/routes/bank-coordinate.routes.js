/**
 * Rotas de coordenadas bancárias
 * Público: apenas visualização de coordenadas ativas
 * Admin: CRUD completo
 */
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const bankCoordinateController = require('../controllers/bank-coordinate.controller');

// Rotas públicas - acessíveis a todos
router.get('/', bankCoordinateController.listarCoordenadasPublico);

// Rotas administrativas - requerem autenticação e papel admin
router.get('/admin', auth.authenticate, bankCoordinateController.listarCoordenadasAdmin);
router.get('/admin/:id', auth.authenticate, bankCoordinateController.obterCoordenada);
router.post('/admin', auth.authenticate, bankCoordinateController.criarCoordenada);
router.put('/admin/:id', auth.authenticate, bankCoordinateController.atualizarCoordenada);
router.delete('/admin/:id', auth.authenticate, bankCoordinateController.desativarCoordenada);
router.delete('/admin/:id/permanente', auth.authenticate, bankCoordinateController.excluirCoordenadaPermanente);

module.exports = router;

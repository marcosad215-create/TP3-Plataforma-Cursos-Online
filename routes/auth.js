const express = require('express');
const router = express.Router();
// Importamos las funciones desde el único archivo de controladores[cite: 1]
const { registrarUsuario, loginUsuario } = require('../controllers/controllers');

router.post('/register', registrarUsuario);
router.post('/login', loginUsuario);

module.exports = router;
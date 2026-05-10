const express = require('express');
const router = express.Router();
const verificarToken = require('../middleware/auth');

const { 
    obtenerCursos, 
    obtenerCursoPorId, 
    crearCurso, 
    actualizarCurso, 
    eliminarCurso,
    inscribirEnCurso,
    cancelarInscripcion 
} = require('../controllers/controllers');

// ==========================================
// RUTAS DE ESTUDIANTES / PÚBLICAS
// ==========================================
// ¡ACÁ ESTÁ LA MAGIA! Le agregamos verificarToken a esta ruta
router.get('/', verificarToken, obtenerCursos); 
router.get('/:id', obtenerCursoPorId);
router.post('/inscribirse', verificarToken, inscribirEnCurso);
router.post('/cancelar', verificarToken, cancelarInscripcion);

// ==========================================
// RUTAS DE ADMINISTRADOR
// ==========================================
router.post('/', verificarToken, crearCurso);
router.put('/:id', verificarToken, actualizarCurso);
router.delete('/:id', verificarToken, eliminarCurso);

module.exports = router;
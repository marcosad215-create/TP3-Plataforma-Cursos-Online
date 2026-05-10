const pool = require('../db/index');
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para generar los tokens

// ==========================================
// CONTROLADORES DE AUTENTICACIÓN (Registro/Login)
// ==========================================

// Función para REGISTRAR un nuevo usuario
const registrarUsuario = async (req, res) => {
    try {
        const { nombre, email, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Agregamos 'estudiante' explícitamente al INSERT
        await pool.query(
            'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, "estudiante")',
            [nombre, email, password_hash]
        );
        res.status(201).json({ mensaje: 'Usuario registrado como estudiante' });
    } catch (error) {
        res.status(500).json({ error: 'Error al registrarse.' });
    }
};

// Función para INICIAR SESIÓN
const loginUsuario = async (req, res) => {
    try {
        const { email, password } = req.body;

        const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = rows[0];
        const validPassword = await bcrypt.compare(password, usuario.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol }, 
            process.env.JWT_SECRET,               
            { expiresIn: '2h' }                   
        );

        res.json({ mensaje: 'Login exitoso', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
};


// ==========================================
// CONTROLADORES DE RECURSO (Cursos)
// ==========================================

// 1. Obtener todos los cursos (con verificación de inscriptos)
const obtenerCursos = async (req, res) => {
    try {
        const [cursos] = await pool.query('SELECT * FROM cursos');

        if (req.usuario) {
            const [inscripciones] = await pool.query(
                'SELECT id_curso FROM inscripciones WHERE id_usuario = ?', 
                [req.usuario.id]
            );
            
            const misCursosIds = inscripciones.map(ins => ins.id_curso);

            cursos.forEach(curso => {
                curso.ya_inscripto = misCursosIds.includes(curso.id);
            });
        }

        res.json(cursos);
    } catch (error) {
        console.error("Error en obtenerCursos:", error);
        res.status(500).json({ error: 'Error al obtener los cursos' });
    }
};

// 2. Obtener un curso por su ID 
const obtenerCursoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM cursos WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Curso no encontrado' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el curso' });
    }
};

// 3. Crear un nuevo curso
const crearCurso = async (req, res) => {
    try {
        const { titulo, id_instructor, id_categoria, cupo_maximo, fecha_limite } = req.body;
        
        if (req.usuario.rol !== 'admin') {
            return res.status(403).json({ error: 'No tienes permisos de administrador' });
        }

        await pool.query(
            'INSERT INTO cursos (titulo, id_instructor, id_categoria, cupo_maximo, fecha_limite) VALUES (?, ?, ?, ?, ?)',
            [titulo, id_instructor, id_categoria, cupo_maximo, fecha_limite]
        );
        res.status(201).json({ mensaje: 'Curso creado con éxito' });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el curso' });
    }
};

// 4. Actualizar un curso
const actualizarCurso = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, cupo_maximo } = req.body;
        await pool.query(
            'UPDATE cursos SET titulo = ?, cupo_maximo = ? WHERE id = ?',
            [titulo, cupo_maximo, id]
        );
        res.json({ mensaje: 'Curso actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el curso' });
    }
};

// 5. Eliminar un curso usando una TRANSACCIÓN
const eliminarCurso = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id } = req.params;
        await connection.beginTransaction();
        await connection.query('DELETE FROM inscripciones WHERE id_curso = ?', [id]);
        const [result] = await connection.query('DELETE FROM cursos WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ mensaje: 'Curso no encontrado' });
        }

        await connection.commit();
        res.json({ mensaje: 'Curso eliminado con éxito' });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: 'Error al eliminar el curso, se canceló la operación' });
    } finally {
        connection.release();
    }
};

// 6. Inscribirse en un curso (Con bloqueo de duplicados)
const inscribirEnCurso = async (req, res) => {
    try {
        const { id_curso } = req.body;
        const id_usuario = req.usuario.id; 

        const [existente] = await pool.query(
            'SELECT * FROM inscripciones WHERE id_usuario = ? AND id_curso = ?', 
            [id_usuario, id_curso]
        );

        if (existente.length > 0) {
            return res.status(400).json({ error: 'Ya te encuentras inscripto en este curso.' });
        }

        await pool.query('CALL registrar_inscripcion(?, ?)', [id_usuario, id_curso]);
        
        res.json({ mensaje: 'Inscripción exitosa' });

    } catch (error) {
        console.error("Error al inscribir:", error);
        res.status(400).json({ error: 'No se pudo realizar la inscripción. ' + (error.sqlMessage || '') });
    }
};

// 7. Cancelar inscripción
const cancelarInscripcion = async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const { id_curso } = req.body;
        const id_usuario = req.usuario.id;

        await connection.beginTransaction();

        const [curso] = await connection.query('SELECT fecha_limite FROM cursos WHERE id = ?', [id_curso]);
        
        if (new Date() > new Date(curso[0].fecha_limite)) {
            await connection.rollback();
            return res.status(400).json({ error: 'La fecha límite para cancelar ya pasó.' });
        }

        const [result] = await connection.query(
            'DELETE FROM inscripciones WHERE id_usuario = ? AND id_curso = ?',
            [id_usuario, id_curso]
        );

        if (result.affectedRows > 0) {
            await connection.query('UPDATE cursos SET inscritos_actuales = inscritos_actuales - 1 WHERE id = ?', [id_curso]);
            await connection.commit();
            res.json({ mensaje: 'Inscripción cancelada con éxito.' });
        } else {
            await connection.rollback();
            res.status(404).json({ error: 'No estás inscripto en este curso.' });
        }

    } catch (error) {
        await connection.rollback();
        console.error('Error detallado al cancelar:', error); 
        res.status(500).json({ error: 'Error interno al cancelar.' });
    } finally {
        connection.release();
    }
};

// EXPORTAMOS TODO JUNTOS
module.exports = { 
    registrarUsuario, 
    loginUsuario,
    obtenerCursos, 
    obtenerCursoPorId, 
    crearCurso, 
    actualizarCurso, 
    eliminarCurso,
    inscribirEnCurso,
    cancelarInscripcion
};
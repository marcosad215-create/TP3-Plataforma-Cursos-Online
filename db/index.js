// Importamos el módulo mysql2 (usamos la versión "promise" para poder manejar respuestas asíncronas más fácil)
const mysql = require('mysql2/promise');

// Importamos dotenv para poder leer los datos secretos desde nuestro archivo .env
require('dotenv').config();

// Creamos un "pool" de conexiones. 
// Un pool administra varias conexiones a la vez automáticamente, para que el servidor no colapse si entran muchos usuarios.
const pool = mysql.createPool({
    host: process.env.DB_HOST,         // Saca el host (localhost) del archivo .env
    user: process.env.DB_USER,         // Saca el usuario (root) del archivo .env
    password: process.env.DB_PASSWORD, // Saca la contraseña (seguramente vacía) del archivo .env
    database: process.env.DB_NAME,     // Saca el nombre de la base de datos (cursos_db) del archivo .env
    port: process.env.DB_PORT          // Saca el puerto (3306) del archivo .env
});

// Hacemos una prueba rápida: intentamos conseguir una conexión del pool
pool.getConnection()
    .then(connection => {
        // Si sale bien, mostramos un mensaje de éxito en la consola
        console.log('¡Conexión exitosa a la base de datos MySQL!');
        // Soltamos la conexión para que vuelva al pool y quede libre
        connection.release(); 
    })
    .catch(err => {
        // Si hay un error (ej. contraseña mal puesta), mostramos el error en rojo
        console.error('Error conectando a la base de datos:', err.message);
    });

// Exportamos el "pool" para poder importarlo y usarlo en nuestros controladores más adelante
module.exports = pool;
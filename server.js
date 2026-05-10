// Importamos el framework Express para crear el servidor[cite: 1]
const express = require('express');
// Importamos la conexión a la base de datos para que se ejecute y pruebe la conexión
require('./db/index.js');

// Importamos dotenv para poder leer las variables del archivo .env[cite: 1]
require('dotenv').config();

// Inicializamos la aplicación de Express
const app = express();

// Middleware para que nuestro servidor pueda entender los datos que lleguen en formato JSON
app.use(express.json());

// Le decimos a Express que sirva los archivos estáticos de la carpeta "public" (HTML, CSS, JS)[cite: 1]
app.use(express.static('public'));

// Definimos el puerto. Va a intentar leer el puerto del archivo .env, y si no lo encuentra, usa el 3000
const PORT = process.env.PORT || 3000;

// Creamos una ruta básica de prueba para ver si el servidor responde
app.get('/', (req, res) => {
    // Cuando alguien entre a la raíz ('/'), respondemos con este mensaje
    res.send('¡Servidor del TP3 funcionando correctamente!');
});

// Rutas de autenticación
app.use('/api/auth', require('./routes/auth'));

// Le decimos a nuestra app que use las rutas de cursos
// Todas estas rutas van a empezar con el prefijo /api/cursos[cite: 1]
app.use('/api/cursos', require('./routes/cursos'));

// Le decimos a la aplicación que se quede "escuchando" en el puerto definido
app.listen(PORT, () => {
    // Imprimimos en la consola un mensaje para saber que arrancó bien
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
# Plataforma de Cursos Online

Aplicación web para la gestión de cursos e inscripciones, desarrollada con Node.js, Express y MySQL. Permite administrar cursos y gestionar los estudiantes.

## Cómo levantar el proyecto localmente

1. Clonar este repositorio en tu computadora.
2. Abrir la terminal en la carpeta del proyecto y ejecutar `npm install` para instalar las dependencias.
3. Renombrar el archivo `.env.example` a `.env`. Configurar ahí el puerto de MySQL (generalmente 3306) y el usuario (ejemplo: root sin contraseña para XAMPP).
4. Abrir phpMyAdmin (o cualquier gestor de MySQL) e importar el archivo `database.sql` que está en la raíz del proyecto.
5. Iniciar el servidor ejecutando `npm start` (o `npx nodemon server.js`). El proyecto correrá en http://localhost:3000.

## Lógica Avanzada de Base de Datos

Para asegurar la integridad de la información, se implementaron las siguientes lógicas:

* **Procedimiento Almacenado:** Se encarga de gestionar la inscripción de los estudiantes.
* **Transacción:** Se utiliza al momento de eliminar un curso desde el panel de administrador. Primero elimina las inscripciones asociadas en la tabla intermedia y luego el curso. Si ocurre un error, hace un `ROLLBACK` para no dejar datos huérfanos.
* **Trigger:** Se creó un disparador (`AFTER INSERT`) en la tabla de cursos. Cada vez que el administrador crea un curso nuevo, el Trigger guarda automáticamente un registro en la tabla `historial_cursos` con el nombre del curso y la fecha exacta de creación.
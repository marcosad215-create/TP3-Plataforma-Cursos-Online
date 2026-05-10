-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 09-05-2026 a las 23:25:41
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `cursos_db`
--

DELIMITER $$
--
-- Procedimientos
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `registrar_inscripcion` (IN `p_id_usuario` INT, IN `p_id_curso` INT)   BEGIN
    DECLARE v_cupo_maximo INT;
    DECLARE v_inscritos INT;
    
    -- Buscamos el cupo y los inscritos actuales
    SELECT cupo_maximo, inscritos_actuales INTO v_cupo_maximo, v_inscritos 
    FROM cursos WHERE id = p_id_curso;
    
    -- Verificamos si hay lugar
    IF v_inscritos >= v_cupo_maximo THEN
        -- Así se lanza un error en MySQL
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El curso ya no tiene cupo disponible.';
    ELSE
        INSERT INTO inscripciones (id_usuario, id_curso, estado) VALUES (p_id_usuario, p_id_curso, 'activa');
    END IF;
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Programación Frontend', 'Cursos orientados al desarrollo de interfaces de usuario');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cursos`
--

CREATE TABLE `cursos` (
  `id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `id_instructor` int(11) DEFAULT NULL,
  `id_categoria` int(11) DEFAULT NULL,
  `cupo_maximo` int(11) DEFAULT 50,
  `inscritos_actuales` int(11) DEFAULT 0,
  `fecha_limite` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `cursos`
--

INSERT INTO `cursos` (`id`, `titulo`, `id_instructor`, `id_categoria`, `cupo_maximo`, `inscritos_actuales`, `fecha_limite`) VALUES
(4, 'Base de Datos', 2, 1, 3, 1, '2026-05-10 23:59:00'),
(5, 'Curso de Python Avanzado', 2, 1, 5, 1, '2026-05-11 00:00:00'),
(8, 'Desarrollo Web', 2, 1, 5, 0, '2026-05-20 22:50:00'),
(9, 'Java Script', 2, 1, 5, 1, '2026-05-15 23:45:00'),
(10, 'Analisis de Datos', 2, 1, 3, 0, '2026-05-20 23:00:00'),
(11, 'Seguridad Informatica', 2, 1, 5, 0, '2026-05-11 21:00:00'),
(12, 'Programaión Avanzada', 2, 1, 3, 0, '2026-05-10 00:59:00');

--
-- Disparadores `cursos`
--
DELIMITER $$
CREATE TRIGGER `despues_de_crear_curso` AFTER INSERT ON `cursos` FOR EACH ROW BEGIN
    INSERT INTO historial_cursos (mensaje) 
    VALUES (CONCAT('Se agregó un nuevo curso al sistema: ', NEW.titulo));
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_cursos`
--

CREATE TABLE `historial_cursos` (
  `id` int(11) NOT NULL,
  `mensaje` varchar(255) DEFAULT NULL,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inscripciones`
--

CREATE TABLE `inscripciones` (
  `id` int(11) NOT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `id_curso` int(11) DEFAULT NULL,
  `fecha_inscripcion` timestamp NOT NULL DEFAULT current_timestamp(),
  `estado` varchar(20) DEFAULT 'activa'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `inscripciones`
--

INSERT INTO `inscripciones` (`id`, `id_usuario`, `id_curso`, `fecha_inscripcion`, `estado`) VALUES
(18, 4, 5, '2026-05-08 02:37:29', 'activa'),
(19, 4, 9, '2026-05-08 03:19:20', 'activa');

--
-- Disparadores `inscripciones`
--
DELIMITER $$
CREATE TRIGGER `trigger_nueva_inscripcion` AFTER INSERT ON `inscripciones` FOR EACH ROW BEGIN
    -- NEW.id_curso obtiene el ID de la inscripción recién insertada
    UPDATE cursos SET inscritos_actuales = inscritos_actuales + 1 WHERE id = NEW.id_curso;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `rol` enum('admin','estudiante') DEFAULT 'estudiante',
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `password_hash`, `rol`, `fecha_registro`) VALUES
(1, 'Emmanuel', 'emma@gmail.com', '$2a$10$UnHashDeEjemplo123', 'estudiante', '2026-05-04 04:30:06'),
(2, 'Profe Carlos', 'carlos@universidad.com', '$2a$10$UnHashDeEjemplo456', 'estudiante', '2026-05-04 04:30:06'),
(3, 'Emmanuel Gramajo Roldán', 'emanuelgramajo32@gmail.com', '$2b$10$wXr3zEyVgLVBHOoRHArN8.wdmb5wyqQI5IH9mkeOx6wPXwokFLyAu', 'admin', '2026-05-04 05:20:35'),
(4, 'Juan Perez', 'JuanP@gmail.com', '$2b$10$FjfHHt7rCLWWQP4fjk1YbehY9B1hlANTaByGobI9Gjt0CJMnCkOKC', 'estudiante', '2026-05-04 05:56:57'),
(5, 'Ana Gramajo', 'jey123@gmail.com', '$2b$10$/AAr43I9GoBmntRhWo.5mONiIr/3QAECb8UiMqme4vvI6T49vKO2G', 'estudiante', '2026-05-09 02:27:57'),
(6, 'gramajo elias', 'gramajoe769@gmail.com', '$2b$10$LXG/87kMnHsMxHKkTiGUpeRMucVhAzXYmK1wqmKXI36EKcRRYlRyu', 'estudiante', '2026-05-09 02:34:33');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `cursos`
--
ALTER TABLE `cursos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_instructor` (`id_instructor`),
  ADD KEY `id_categoria` (`id_categoria`);

--
-- Indices de la tabla `historial_cursos`
--
ALTER TABLE `historial_cursos`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `id_usuario` (`id_usuario`),
  ADD KEY `id_curso` (`id_curso`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `cursos`
--
ALTER TABLE `cursos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `historial_cursos`
--
ALTER TABLE `historial_cursos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `cursos`
--
ALTER TABLE `cursos`
  ADD CONSTRAINT `cursos_ibfk_1` FOREIGN KEY (`id_instructor`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `cursos_ibfk_2` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id`);

--
-- Filtros para la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  ADD CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id`),
  ADD CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`id_curso`) REFERENCES `cursos` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

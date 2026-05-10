const jwt = require('jsonwebtoken');

    const verificarToken = (req, res, next) => {
        const tokenHeader = req.header('Authorization');

        if (!tokenHeader) {
            return res.status(401).json({ error: 'Acceso denegado. No enviaste un token.' });
        }

        try {
            const token = tokenHeader.split(' ')[1]; 
            const verificado = jwt.verify(token, process.env.JWT_SECRET);
            req.usuario = verificado; 
            next(); // Permite pasar a la ruta[cite: 1]
        } catch (error) {
            res.status(400).json({ error: 'El token no es válido o ya expiró.' });
        }
    };

    module.exports = verificarToken;

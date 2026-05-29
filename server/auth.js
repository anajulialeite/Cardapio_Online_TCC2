// =============================================
// MÓDULO DE AUTENTICAÇÃO JWT - CARDÁPIO ONLINE
// =============================================
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cardapio-online-jwt-secret-2026-fallback';

/**
 * Middleware para proteger rotas administrativas
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1]; // Formato: "Bearer <token>"
  
  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token inválido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Salva os dados do admin decodificados na requisição
    next();
  } catch (error) {
    console.error('Erro na validação do JWT:', error.message);
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
}

module.exports = {
  authMiddleware,
  JWT_SECRET,
};

// =============================================
// TOKEN DE SEGURANÇA - HMAC-SHA256
// =============================================
// Gera e valida tokens para proteger o valor da
// transação contra adulteração no front-end.
// =============================================

const crypto = require('crypto');

// Chave secreta do servidor (configurável via .env)
const SECRET_KEY = process.env.TOKEN_SECRET || 'cardapio-online-secret-key-2026';

// Tempo de expiração do token (30 minutos, em milissegundos)
const TOKEN_EXPIRY_MS = 30 * 60 * 1000;

/**
 * Gera um token HMAC-SHA256 assinado com o valor da transação.
 * 
 * O token inclui:
 * - O valor (amount) em centavos para evitar problemas de ponto flutuante
 * - Um timestamp para expiração
 * - Um identificador único (nonce) para evitar reutilização
 * 
 * @param {number} amount - Valor da transação em reais (ex: 45.90)
 * @returns {{ token: string, timestamp: number, nonce: string }}
 */
function gerarToken(amount) {
  // Converter para centavos (inteiro) para evitar problemas de float
  const amountCents = Math.round(amount * 100);
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');

  // Dados que serão assinados
  const payload = `${amountCents}:${timestamp}:${nonce}`;

  // Gerar HMAC-SHA256
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  // Token final = payload codificado em base64 + "." + assinatura
  const payloadBase64 = Buffer.from(payload).toString('base64');
  const token = `${payloadBase64}.${signature}`;

  return { token, timestamp, nonce };
}

/**
 * Valida um token e verifica se o valor corresponde.
 * 
 * Verificações:
 * 1. Formato do token é válido
 * 2. Assinatura HMAC corresponde (não foi adulterado)
 * 3. Token não expirou (30 minutos)
 * 4. Valor no token bate com o valor informado
 * 
 * @param {string} token - Token recebido do front-end
 * @param {number} amount - Valor da transação para comparar
 * @returns {{ valid: boolean, error?: string }}
 */
function validarToken(token, amount) {
  try {
    // 1. Separar payload e assinatura
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Formato de token inválido' };
    }

    const [payloadBase64, receivedSignature] = parts;

    // 2. Decodificar payload
    const payload = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const [amountCentsStr, timestampStr, nonce] = payload.split(':');

    if (!amountCentsStr || !timestampStr || !nonce) {
      return { valid: false, error: 'Payload do token incompleto' };
    }

    // 3. Verificar assinatura HMAC (proteção contra adulteração)
    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    // Comparação segura contra timing attacks
    if (!crypto.timingSafeEqual(
      Buffer.from(receivedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )) {
      return { valid: false, error: 'Token inválido - assinatura não confere' };
    }

    // 4. Verificar expiração
    const timestamp = parseInt(timestampStr, 10);
    const elapsed = Date.now() - timestamp;
    if (elapsed > TOKEN_EXPIRY_MS) {
      return { valid: false, error: 'Token expirado' };
    }

    // 5. Verificar valor
    const tokenAmountCents = parseInt(amountCentsStr, 10);
    const expectedAmountCents = Math.round(amount * 100);

    if (tokenAmountCents !== expectedAmountCents) {
      return {
        valid: false,
        error: `Valor adulterado! Token: R$ ${(tokenAmountCents / 100).toFixed(2)}, Recebido: R$ ${amount.toFixed(2)}`
      };
    }

    // ✅ Token válido
    return { valid: true };

  } catch (err) {
    return { valid: false, error: `Erro ao validar token: ${err.message}` };
  }
}

module.exports = {
  gerarToken,
  validarToken,
};

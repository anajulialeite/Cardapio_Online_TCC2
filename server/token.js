const crypto = require('crypto');

const SECRET_KEY = process.env.TOKEN_SECRET || 'cardapio-online-secret-key-2026';
const TOKEN_EXPIRY_MS = 30 * 60 * 1000;

// Gera um token HMAC contendo o valor, timestamp e um nonce único
function gerarToken(amount) {
  // Converte para centavos para evitar problemas com ponto flutuante
  const amountCents = Math.round(amount * 100);
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');

  const payload = `${amountCents}:${timestamp}:${nonce}`;

  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const signature = hmac.digest('hex');

  const payloadBase64 = Buffer.from(payload).toString('base64');
  return {
    token: `${payloadBase64}.${signature}`,
    timestamp,
    nonce
  };
}

// Valida o token e verifica se o valor recebido bate com o assinado
function validarToken(token, amount) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Formato de token inválido' };
    }

    const [payloadBase64, receivedSignature] = parts;
    const payload = Buffer.from(payloadBase64, 'base64').toString('utf-8');
    const [amountCentsStr, timestampStr, nonce] = payload.split(':');

    if (!amountCentsStr || !timestampStr || !nonce) {
      return { valid: false, error: 'Payload incompleto' };
    }

    const hmac = crypto.createHmac('sha256', SECRET_KEY);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    // Comparação segura contra timing attacks
    if (!crypto.timingSafeEqual(
      Buffer.from(receivedSignature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )) {
      return { valid: false, error: 'Assinatura inválida' };
    }

    // Verifica expiração (30 min)
    const timestamp = parseInt(timestampStr, 10);
    if (Date.now() - timestamp > TOKEN_EXPIRY_MS) {
      return { valid: false, error: 'Token expirado' };
    }

    // Confere se o valor é o mesmo assinado
    const tokenAmountCents = parseInt(amountCentsStr, 10);
    const expectedAmountCents = Math.round(amount * 100);

    if (tokenAmountCents !== expectedAmountCents) {
      return {
        valid: false,
        error: `Valor adulterado! Token: R$ ${(tokenAmountCents / 100).toFixed(2)}, Recebido: R$ ${amount.toFixed(2)}`
      };
    }

    return { valid: true };
  } catch (err) {
    return { valid: false, error: `Erro ao validar token: ${err.message}` };
  }
}

module.exports = {
  gerarToken,
  validarToken,
};


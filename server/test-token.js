// Testes do sistema de token de segurança

require('dotenv').config();
const { gerarToken, validarToken } = require('./token');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [OK] ${name}`);
    passed++;
  } catch (err) {
    console.log(`  [FALHA] ${name}`);
    console.log(`     -> ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

console.log('\n--- Teste do Sistema de Token ---\n');
console.log('1. Geração de Token');

test('Deve gerar token com formato válido', () => {
  const { token } = gerarToken(45.90);
  assert(token, 'Token não foi gerado');
  assert(token.includes('.'), 'Token deve conter "." separando payload e assinatura');
  const parts = token.split('.');
  assert(parts.length === 2, 'Token deve ter exatamente 2 partes');
});

test('Deve gerar tokens diferentes para mesmo valor (nonce)', () => {
  const { token: token1 } = gerarToken(45.90);
  const { token: token2 } = gerarToken(45.90);
  assert(token1 !== token2, 'Tokens devem ser diferentes (nonce único)');
});

test('Deve gerar tokens para valores com centavos', () => {
  const { token } = gerarToken(0.01);
  assert(token, 'Deve gerar token para R$ 0,01');
  const { token: token2 } = gerarToken(9999.99);
  assert(token2, 'Deve gerar token para R$ 9.999,99');
});

console.log('\n2. Validação com Valor Correto');

test('Deve validar token com valor inteiro (R$ 50,00)', () => {
  const { token } = gerarToken(50.00);
  const result = validarToken(token, 50.00);
  assert(result.valid === true, `Esperado valid=true, recebeu: ${JSON.stringify(result)}`);
});

test('Deve validar token com centavos (R$ 45,90)', () => {
  const { token } = gerarToken(45.90);
  const result = validarToken(token, 45.90);
  assert(result.valid === true, `Esperado valid=true, recebeu: ${JSON.stringify(result)}`);
});

test('Deve validar token com valor pequeno (R$ 0,01)', () => {
  const { token } = gerarToken(0.01);
  const result = validarToken(token, 0.01);
  assert(result.valid === true, `Esperado valid=true, recebeu: ${JSON.stringify(result)}`);
});

test('Deve validar token com valor grande (R$ 999,99)', () => {
  const { token } = gerarToken(999.99);
  const result = validarToken(token, 999.99);
  assert(result.valid === true, `Esperado valid=true, recebeu: ${JSON.stringify(result)}`);
});

console.log('\n3. Rejeitar Valor Adulterado');

test('Deve RECUSAR se valor foi alterado de R$ 85,00 para R$ 0,01', () => {
  const { token } = gerarToken(85.00);
  const result = validarToken(token, 0.01);
  assert(result.valid === false, 'Deveria recusar valor adulterado!');
  assert(result.error.includes('adulterado'), `Erro deveria mencionar adulteração: ${result.error}`);
});

test('Deve RECUSAR se valor foi alterado de R$ 150,00 para R$ 1,00', () => {
  const { token } = gerarToken(150.00);
  const result = validarToken(token, 1.00);
  assert(result.valid === false, 'Deveria recusar valor adulterado!');
});

test('Deve RECUSAR se valor foi alterado por 1 centavo (R$ 50,00 → R$ 49,99)', () => {
  const { token } = gerarToken(50.00);
  const result = validarToken(token, 49.99);
  assert(result.valid === false, 'Deveria recusar diferença de 1 centavo!');
});

test('Deve RECUSAR se valor foi aumentado (R$ 10,00 → R$ 100,00)', () => {
  const { token } = gerarToken(10.00);
  const result = validarToken(token, 100.00);
  assert(result.valid === false, 'Deveria recusar valor aumentado!');
});

console.log('\n4. Token Adulterado ou Inválido');

test('Deve RECUSAR token com formato inválido (sem ponto)', () => {
  const result = validarToken('tokeninvalido', 50.00);
  assert(result.valid === false, 'Deveria recusar token sem ponto');
});

test('Deve RECUSAR token vazio', () => {
  const result = validarToken('', 50.00);
  assert(result.valid === false, 'Deveria recusar token vazio');
});

test('Deve RECUSAR token com assinatura alterada', () => {
  const { token } = gerarToken(50.00);
  // Alterar último caractere da assinatura
  const tampered = token.slice(0, -1) + (token.slice(-1) === 'a' ? 'b' : 'a');
  const result = validarToken(tampered, 50.00);
  assert(result.valid === false, 'Deveria recusar assinatura adulterada!');
});

test('Deve RECUSAR token com payload alterado (tentativa de forjar valor)', () => {
  const { token } = gerarToken(85.00);
  const [, signature] = token.split('.');
  // Tentar criar payload falso com valor diferente
  const fakePayload = Buffer.from('100:' + Date.now() + ':fake').toString('base64');
  const forgedToken = `${fakePayload}.${signature}`;
  const result = validarToken(forgedToken, 1.00);
  assert(result.valid === false, 'Deveria recusar token forjado!');
});

console.log('\n5. Expiração do Token');

test('Token recém-criado NÃO deve estar expirado', () => {
  const { token } = gerarToken(50.00);
  const result = validarToken(token, 50.00);
  assert(result.valid === true, 'Token recente deve ser válido');
});

test('Deve RECUSAR token expirado (simulação com timestamp antigo)', () => {
  // Simular token com timestamp de 31 minutos atrás
  const crypto = require('crypto');
  const SECRET_KEY = process.env.TOKEN_SECRET || 'cardapio-online-secret-key-2026';
  const amountCents = 5000;
  const oldTimestamp = Date.now() - (31 * 60 * 1000); // 31 min atrás
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${amountCents}:${oldTimestamp}:${nonce}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  const expiredToken = `${Buffer.from(payload).toString('base64')}.${signature}`;

  const result = validarToken(expiredToken, 50.00);
  assert(result.valid === false, 'Deveria recusar token expirado');
  assert(result.error.includes('expirado'), `Erro deveria mencionar expiração: ${result.error}`);
});

console.log('\n----------------------------------------');
console.log(`RESULTADO: ${passed} passou, ${failed} falhou`);
console.log('----------------------------------------');

if (failed === 0) {
  console.log('Todos os testes passaram.\n');
} else {
  console.log('Alguns testes falharam!\n');
  process.exit(1);
}

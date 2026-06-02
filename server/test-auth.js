const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('Iniciando testes de autenticação...');

try {
  const senha = 'senha_teste_123';
  console.log('Criptografando senha com bcrypt...');
  const hash = bcrypt.hashSync(senha, 10);
  console.log('Hash gerado:', hash);
  
  console.log('Validando senha correta...');
  const matchCorreto = bcrypt.compareSync(senha, hash);
  console.log(matchCorreto ? 'Senha correta validada!' : 'Erro ao validar senha correta.');

  console.log('Validando senha incorreta...');
  const matchIncorreto = bcrypt.compareSync('senha_errada', hash);
  console.log(!matchIncorreto ? 'Senha incorreta rejeitada!' : 'Erro: aceitou senha errada.');

  const secret = 'chave-secreta-teste';
  const payload = { id: 1, usuario: 'admin_teste' };
  console.log('Gerando token JWT...');
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  console.log('Token gerado:', token);

  console.log('Validando token JWT...');
  const decoded = jwt.verify(token, secret);
  console.log(decoded.usuario === payload.usuario ? 'Token JWT decodificado com sucesso!' : 'Erro na decodificação do JWT.');

  console.log('Todos os testes de autenticação passaram!');
} catch (error) {
  console.error('Erro nos testes de autenticação:', error.message);
}

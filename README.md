# Cardápio Online TCC II

<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-plain.svg" align="left" width="50" height="50"/>
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-plain.svg" align="left" width="50" height="50"/>
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-plain.svg" align="left" width="50" height="50"/>
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg" align="left" width="50" height="50"/>
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/express/express-original.svg" align="left" width="50" height="50"/>
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/vscode/vscode-original.svg" align="left" width="50" height="50"/>
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/microsoftsqlserver/microsoftsqlserver-original.svg" align="center" width="50" height="50"/>

<br>

Projeto desenvolvido como Trabalho de Conclusão de Curso (TCC II) em Sistemas de Informação, com o objetivo de criar uma solução web para gerenciamento de cardápio e realização de pedidos online.

A aplicação possui cardápio responsivo, carrinho de compras, montagem de pizzas, busca de produtos, pagamento via PIX, painel administrativo e integração com banco de dados SQL Server.

## Funcionalidades

- Cardápio digital responsivo para desktop e dispositivos móveis
- Modo claro e escuro
- Busca de produtos em tempo real
- Carrinho de compras com cálculo automático dos valores
- Seleção de complementos obrigatórios, opcionais e adicionais
- Montagem de pizzas com escolha de sabores, tamanhos e bordas
- Exibição de imagens dos produtos e sabores de pizza
- Controle do horário de funcionamento da loja
- Geração de pagamento PIX com QR Code e código Copia e Cola via Mercado Pago
- Atualização do status do pagamento
- Validação de integridade dos valores utilizando HMAC-SHA256
- Painel administrativo protegido por autenticação JWT
- Gerenciamento de pedidos pelo painel administrativo
- Alteração de preços e disponibilidade dos produtos
- Exibição de informações de faturamento
- Upload e gerenciamento de imagens de produtos e sabores de pizza
- Monitoramento automático de pedidos pendentes com controle de tentativas
- Fallback de dados utilizando o arquivo `data.js` caso os dados dinâmicos não possam ser carregados

## Tecnologias Utilizadas

### Front-end

- HTML5
- CSS3
- JavaScript

### Back-end

- Node.js
- Express.js

### Banco de Dados

- Microsoft SQL Server

### Integrações e Segurança

- Mercado Pago
- WhatsApp
- JWT
- HMAC-SHA256
- Multer
- node-cron

## Banco de Dados

O projeto utiliza SQL Server para armazenamento dos dados do cardápio e dos pedidos.

O banco possui relacionamentos entre as tabelas, chaves estrangeiras, restrições para evitar registros duplicados, triggers para atualização automática das datas e índices para otimização das consultas.

## Estrutura do Projeto

O frontend está localizado na raiz do projeto e o backend na pasta `server`.

```text
Raiz do projeto
│
├── index.html
├── app.js
├── style.css
├── admin.html
├── admin.js
├── admin.css
├── data.js
│
└── server/
    ├── index.js
    ├── db.js
    ├── auth.js
    ├── token.js
    ├── queue.js
    ├── seed-db.js
    ├── database.sql
    └── package.json
```

- `index.html`, `app.js` e `style.css`: interface principal do cardápio.
- `admin.html`, `admin.js` e `admin.css`: painel administrativo.
- `data.js`: dados utilizados como fallback.
- `server/index.js`: servidor Express e rotas da API.
- `server/db.js`: conexão e consultas ao SQL Server.
- `server/auth.js`: validação da autenticação JWT.
- `server/token.js`: geração e validação das assinaturas HMAC-SHA256.
- `server/queue.js`: monitoramento dos pedidos pendentes.
- `server/seed-db.js`: criação e inserção inicial dos dados.
- `server/database.sql`: estrutura do banco de dados.

## Como Executar

### Pré-requisitos

- Node.js
- Microsoft SQL Server

Clone este repositório:

```bash
git clone https://github.com/anajulialeite/Cardapio_Online_TCC_II.git
```

Acesse a pasta do servidor:

```bash
cd Cardapio_Online_TCC_II/server
```

Instale as dependências:

```bash
npm install
```

Crie um arquivo `.env` dentro da pasta `server` e configure as variáveis necessárias:

```env
ACCESS_TOKEN=seu_access_token_do_mercado_pago
PORT=3001
DB_SERVER=localhost\SQLEXPRESS
DB_DATABASE=CardapioOnline
DB_USER=seu_usuario_sql
DB_PASSWORD=sua_senha_sql
TOKEN_SECRET=sua_chave_hmac
JWT_SECRET=sua_chave_jwt
```

Crie no SQL Server um banco chamado:

```text
CardapioOnline
```

Para criar as tabelas e inserir os dados iniciais:

```bash
node seed-db.js
```

Para iniciar o servidor:

```bash
npm start
```

O frontend pode ser executado abrindo o arquivo `index.html` no navegador ou utilizando uma extensão como Live Server.

## Demonstração

### Página Inicial

<img src="Logo/Index.png" alt="Página inicial do Cardápio Online" align="center" width="800">

### Carrinho de Compras

<img src="Logo/Carrinho de compras.png" alt="Carrinho de compras" align="center" width="500">

### Pagamento PIX

<img src="Logo/pix.png" alt="Pagamento PIX" align="center" width="400">

### Painel Administrativo

<img src="Logo/Painel Administrativo.png" alt="Painel administrativo" align="center" width="800">

## Documentação e Testes

[![Relatório de Testes](https://img.shields.io/badge/Documentação-Relatório%20de%20Testes-%231C003F?style=for-the-badge)](./RELAT%C3%93RIOS%20DE%20TESTES%20E%20HOMOLOGA%C3%87%C3%83O%20-%20TCC%20II.pdf)

## Autora

Ana Júlia de Lima Aguiar Leite

<a href="https://www.linkedin.com/in/anajulialimaleite/" style="text-decoration:none" target="_blank" rel="noopener noreferrer">
    <img src="https://img.shields.io/badge/Linkedin-%231C003F?style=for-the-badge&logo=LinkedIn&logoColor=white" alt="LinkedIn"/>
</a>

## Licença

Este projeto está licenciado sob a Licença Proprietária AJ - Criar e Desenvolver.

O código-fonte não pode ser redistribuído, comercializado ou utilizado para fins comerciais sem autorização prévia da autora.

[![AJ - Criar e Desenvolver](https://img.shields.io/badge/AJ%20Criar%20e%20Desenvolver-Licença%20Proprietária-FF1493?labelColor=1C003F)](./LICENSE)

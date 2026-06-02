const cron = require('node-cron');
const db = require('./db');

const MAX_TENTATIVAS = 3;

// Monitora e reenvia pedidos pendentes que falharam temporariamente
function iniciarFilaDeReenvio() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const pendentes = await db.buscarPendentes();
      const apenasNovos = pendentes.filter(p => p.Status === 'pendente');

      if (apenasNovos.length === 0) return;

      console.log(`[Fila] Verificando ${apenasNovos.length} pedido(s) pendente(s)...`);

      for (const pedido of apenasNovos) {
        const tentativas = await db.incrementarTentativa(pedido.Id);

        if (tentativas >= MAX_TENTATIVAS) {
          // Marca como erro após atingir limite de tentativas
          await db.atualizarStatus(pedido.Id, 'erro');
          console.log(`[Fila] Limite excedido para o pedido #${pedido.Id}`);
          console.log(`Cliente: ${pedido.NomeCliente} | Tel: ${pedido.Telefone} | Total: R$ ${pedido.Total}`);
        } else {
          console.log(`[Fila] Pedido #${pedido.Id} - tentativa ${tentativas}/${MAX_TENTATIVAS}`);
        }
      }
    } catch (err) {
      console.error('Erro ao processar fila de reenvio:', err.message);
    }
  });

  console.log('Fila de reenvio de pedidos ativa');
}

module.exports = { iniciarFilaDeReenvio };

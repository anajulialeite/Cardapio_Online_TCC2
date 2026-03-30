// =============================================
// FILA DE REENVIO DE PEDIDOS
// =============================================
const cron = require('node-cron');
const db = require('./db');

const MAX_TENTATIVAS = 3;

function iniciarFilaDeReenvio() {
  // Verifica pedidos pendentes a cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    try {
      const pendentes = await db.buscarPendentes();
      const apenasNovos = pendentes.filter(p => p.Status === 'pendente');

      if (apenasNovos.length === 0) return;

      console.log(`\n⏰ [FILA] Verificando ${apenasNovos.length} pedido(s) pendente(s)...`);

      for (const pedido of apenasNovos) {
        const tentativas = await db.incrementarTentativa(pedido.Id);

        if (tentativas >= MAX_TENTATIVAS) {
          // Marca como erro após máximo de tentativas
          await db.atualizarStatus(pedido.Id, 'erro');
          console.log(`🚨 [ALERTA] Pedido #${pedido.Id} falhou após ${MAX_TENTATIVAS} tentativas!`);
          console.log(`   Cliente: ${pedido.NomeCliente} | Tel: ${pedido.Telefone} | Total: R$ ${pedido.Total}`);
          console.log(`   ⚠️  AÇÃO NECESSÁRIA: Verifique GET /orders/pending para detalhes\n`);
        } else {
          console.log(`🔄 [FILA] Pedido #${pedido.Id} - tentativa ${tentativas}/${MAX_TENTATIVAS}`);
        }
      }
    } catch (err) {
      console.error('❌ [FILA] Erro ao processar fila:', err.message);
    }
  });

  console.log('⏰ Fila de reenvio ativa (verifica a cada 5 minutos)');
}

module.exports = { iniciarFilaDeReenvio };

/**
 * Projeto: Cardápio Online
 * Desenvolvido por Ana Júlia de Lima Aguiar Leite
 * Copyright © 2026 AJ - Criar e Desenvolver. Todos os direitos reservados.
 *
 * Este código é destinado exclusivamente para fins acadêmicos e comerciais
 * da autora. A reprodução, distribuição, modificação, comercialização ou
 * utilização deste código, total ou parcial, sem autorização expressa da
 * autora é proibida.
 */

// Dados de configuração e itens do cardápio

const STORE_INFO = {
  name: "Menu Online",
  slogan: "Pedido Online",
  address: "Rua dos Confeiteiros do Brasil, 3121 - Centro, Luzânia/GO",
  phone: "(61) 3621-1084",
  phone2: "(61) 3621-3833",
  whatsapp: "(61) 99677-3513",
  minOrder: 10,
  deliveryTypes: ["delivery", "balcao"],
  schedule: [
    { day: "Domingo", open: "14:00", close: "21:40" },
    { day: "Segunda", open: "07:00", close: "21:40" },
    { day: "Terça", open: "07:00", close: "21:40" },
    { day: "Quarta", open: "07:00", close: "21:40" },
    { day: "Quinta", open: "07:00", close: "21:40" },
    { day: "Sexta", open: "07:00", close: "21:40" },
    { day: "Sábado", open: "07:00", close: "21:40" },
  ],
  paymentMethods: [
    { name: "Dinheiro", accepted: true, icon: "💵" },
    { name: "Cartão de Débito", accepted: true, icon: "💳" },
    { name: "Cartão de Crédito", accepted: true, icon: "💳" },
    { name: "Pix", accepted: true, icon: "📱" },
  ],
};

let CATEGORIES = [
  {
    id: "sushi",
    name: "Sushi",
    icon: "🍣",
    products: [
      { id: "p1", name: "Temaki de Salmão", desc: "Arroz e salmão", price: 38.9, available: true, image: "images/products/temaki_salmao.webp" },
      { id: "p2", name: "Temaki Philadelphia", desc: "Arroz, salmão, cream cheese e cebolinha", price: 38.9, available: true, image: "images/products/temaki_philadelphia.webp" },
      { id: "p3", name: "Temaki Samarão", desc: "Arroz, salmão, camarão e cream cheese", price: 41.9, available: true, image: "images/products/temaki_samarao.webp" },
      { id: "p4", name: "Temaki Camarão", desc: "Arroz, camarão, cream cheese e alho poró", price: 41.9, available: true, image: "images/products/temaki_camarao.webp" },
      { id: "p5", name: "Temaki Hot", desc: "Arroz, salmão e cream cheese", price: 41.9, available: true, image: "images/products/temaki_hot.webp" },
      { id: "p6", name: "Temaki Bombado (sem arroz)", desc: "Salmão, cream cheese e cebolinha", price: 49.9, available: true, image: "images/products/temaki_bombado.webp" },
      { id: "p7", name: "Temaki da Casa", desc: "Arroz, salmão, cream cheese, gengibre, alho poró e pimenta japonesa", price: 46.9, available: true, image: "images/products/temaki_casa.webp" },
      { id: "p8", name: "Hot Philadelphia (10 peças)", desc: "Salmão e cream cheese", price: 34.9, available: true, image: "images/products/hot_philadelphia.webp" },
      { id: "p9", name: "Hot de Camarão (10 peças)", desc: "Camarão e cream cheese", price: 35.9, available: true, image: "images/products/hot_camarao.webp" },
      { id: "p10", name: "Hot Especial (10 peças)", desc: "Salmão, camarão, cream cheese e cebolinha", price: 35.9, available: true, image: "images/products/hot_especial.webp" },
      {
        id: "p11", name: "Hossomaki (10 peças)", desc: "Cream cheese com salmão ou camarão (alga por fora)", price: 33.9, available: true, image: "images/products/hossomaki.webp",
        complements: [{ title: "Tipo", type: "radio", required: true, options: ["Salmão", "Camarão", "Kani", "Peixe Branco"] }]
      },
      {
        id: "p12", name: "Uramaki (10 peças)", desc: "Cream cheese com salmão ou camarão (arroz por fora)", price: 33.9, available: true, image: "images/products/uramaki.webp",
        complements: [{ title: "Tipo", type: "radio", required: true, options: ["Salmão", "Camarão"] }]
      },
      { id: "p13", name: "Joy (8 unidades)", desc: "Arroz, cream cheese e salmão", price: 41.9, available: true, image: "images/products/joy_sushi.webp" },
      { id: "p14", name: "Philadelphia Maçaricado (8 peças)", desc: "Salmão, cream cheese, cebolinha e crispy de alho poró", price: 35.9, available: true, image: "images/products/philadelphia_macaricado.webp" },
      { id: "p15", name: "Gunkan (8 unidades)", desc: "Camarão empanado, salmão maçaricado, cream cheese e molho especial", price: 47.9, available: true, image: "images/products/gunkan_sushi.webp" },
      {
        id: "p16", name: "Sashimi (10 peças)", desc: "Salmão ou Peixe branco", price: 37.9, available: true, image: "images/products/sashimi.webp",
        complements: [{ title: "Tipo", type: "radio", required: true, options: ["Salmão", "Peixe Branco"] }]
      },
      { id: "p17", name: "Sashimi (20 peças)", desc: "Salmão ou Peixe branco", price: 69.9, available: false },
      { id: "p18", name: "Combinado 16 peças", desc: "4 sashimis de salmão, 4 uramakis, 4 philadelphia, 4 califórnia", price: 55.9, available: true, image: "images/products/combinado_16.webp" },
      { id: "p19", name: "Combinado 24 peças", desc: "4 sashimis de salmão, 4 sashimis de peixe branco com limão, 4 shakimakis, 4 philadelphia, 4 califórnia, 4 joys com alho poró", price: 81.9, available: true, image: "images/products/combinado_24.webp" },
      { id: "p20", name: "Combinado 36 peças", desc: "4 sashimis de salmão, 4 sashimis de peixe branco, 3 niguiris de salmão, 3 niguiris de peixe branco, 6 philadelphia, 6 uramakis, 6 shakimakis, 4 hot philadelphia", price: 118.9, available: true, image: "images/products/combinado_36.webp" },
      { id: "p21", name: "Combinado 48 peças", desc: "8 sashimis salmão, 8 peixe branco, 6 niguiris salmão, 6 peixe branco, 4 uramakis, 4 shakimakis, 4 philadelphia, 4 hot, 4 joys", price: 153.9, available: false },
      { id: "p22", name: "Combinado 60 Peças (somente sushi)", desc: "8 niguiris salmão, 6 peixe branco, 10 philadelphia, 10 uramakis, 10 shakimakis, 10 hot, 6 joys", price: 159.9, available: false, tag: "Não é possível a troca de peças" },
      { id: "p23", name: "Combinado 72 peças", desc: "10 sashimis salmão, 8 peixe branco, 8 niguiris salmão, 6 peixe branco, 10 philadelphia, 10 uramakis, 10 shakimakis, 10 hot", price: 223.9, available: false },
      { id: "p24", name: "Combinado 100 peças", desc: "18 sashimis salmão, 12 peixe branco, 8 niguiris salmão, 8 peixe branco, 10 uramakis, 10 shakimakis, 10 philadelphia, 10 hot, 5 joys alho poró, 5 joys couve, 4 joys camarão", price: 299.9, available: false },
      {
        id: "p25", name: "Rolinho Primavera", desc: "Salmão, camarão, chocolate ou banana", price: 14.9, available: true, image: "images/products/rolinho_primavera.webp",
        complements: [{ title: "Sabor", type: "radio", required: true, options: ["Salmão", "Camarão", "Chocolate", "Banana"] }]
      },
      { id: "p26", name: "Camarão Empanado 10 peças", desc: null, price: 35.9, available: true, image: "images/products/camarao_empanado.webp" },
      { id: "p27", name: "Acarajapa de Camarão (01 unidade)", desc: "Acompanha crispy de alho poró", price: 29.9, available: true, image: "images/products/acarajapa_camarao.webp" },
      { id: "p28", name: "Acarajapa de Salmão (01 unidade)", desc: "Acompanha crispy de alho poró", price: 29.9, available: true, image: "images/products/acarajapa_salmao.webp" },
      { id: "p29", name: "Ceviche de Peixe Branco (Porção)", desc: "Acompanha chips de batata", price: 39.9, available: true, image: "images/products/ceviche_peixe_branco.webp" },
      { id: "p30", name: "Carpaccio de Salmão", desc: null, price: 44.9, available: true, image: "images/products/carpaccio_salmao.webp" },
      { id: "p31", name: "Ceviche Fusion (Porção)", desc: "Salmão, peixe branco, camarão e chips de batata", price: 44.9, available: true, image: "images/products/ceviche_fusion.webp" },
      { id: "p32", name: "Ceviche de Salmão (Porção)", desc: "Acompanha chips de batata", price: 41.9, available: false },
      { id: "p33", name: "Tataki de Salmão", desc: null, price: 34.9, available: true, image: "images/products/tataki_salmao.webp" },
    ],
    extras: [{ name: "Molho Teriyaki", price: 2.00 }, { name: "Molho Shoyu", price: 1.00 }]
  },
  {
    id: "massas",
    name: "Massas",
    icon: "🍝",
    products: [
      {
        id: "m1", name: "Massa 8 Ingredientes", desc: "Escolha a massa, acompanhamentos e molho", price: 33.9, available: true, image: "images/products/massa.webp",
        complements: [
          { title: "Tipo", type: "radio", required: true, options: ["Penne", "Talharim", "Spaguetti", "Linguine"] },
          { title: "Acompanhamentos", type: "checkbox", required: true, min: 1, max: 8, options: ["Frango", "Carne Moída", "Bacon", "Calabresa", "Milho", "Presunto", "Muçarela", "Ervilha", "Parmesão", "Tomate", "Alho Frito", "Azeitona", "Cebola", "Ovo de Codorna", "Champignon"] },
          { title: "Molho", type: "radio", required: true, options: ["Branco", "Vermelho", "1/2 Branco e 1/2 Vermelho", "Molho de Ervas com Vinho Branco"] }
        ]
      },
    ],
    extras: [
      { name: "Alho Frito", price: 3.00 }, { name: "Azeitona", price: 3.00 }, { name: "Bacon", price: 3.00 },
      { name: "Calabresa", price: 3.00 }, { name: "Carne Moída", price: 3.00 }, { name: "Cebola", price: 3.00 },
      { name: "Champignon", price: 3.00 }, { name: "Ervilha", price: 3.00 }, { name: "Frango", price: 3.00 },
      { name: "Milho", price: 3.00 }, { name: "Muçarela", price: 3.00 }, { name: "Ovo de Codorna", price: 3.00 },
      { name: "Parmesão", price: 3.00 }, { name: "Presunto", price: 3.00 }, { name: "Tomate", price: 3.00 }
    ]
  },
  {
    id: "salgados",
    name: "Salgados",
    icon: "🥟",
    products: [
      { id: "s1", name: "Coxinha", desc: null, price: 1.40, available: true, image: "images/products/coxinha.webp" },
      { id: "s2", name: "Pastel de Queijo", desc: null, price: 1.40, available: true, image: "images/products/pastel_queijo.webp" },
      { id: "s3", name: "Enroladinho de Salsicha Frito", desc: null, price: 1.40, available: true, image: "images/products/enroladinho_salsicha.webp" },
      { id: "s4", name: "Enroladinho de Presunto e Queijo Frito", desc: null, price: 1.40, available: true, image: "images/products/enroladinho_presunto_queijo.webp" },
      { id: "s5", name: "Quibe", desc: null, price: 1.40, available: true, image: "images/products/quibe.webp" },
      { id: "s6", name: "Empada", desc: null, price: 1.40, available: true, image: "images/products/empada.webp" },
      { id: "s7", name: "Enroladinho de Presunto e Queijo Assado", desc: null, price: 1.40, available: true, image: "images/products/enroladinho_assado.webp" },
    ],
    extras: [{ name: "Ketchup", price: 0.10 }, { name: "Maionese", price: 0.10 }]
  },
  {
    id: "tapiocas",
    name: "Tapiocas",
    icon: "🫓",
    products: [
      { id: "t1", name: "Tapioca Manteiga", desc: null, price: 12.90, available: false },
      { id: "t2", name: "Tapioca Frango e Muçarela", desc: null, price: 20.90, available: true, image: "images/products/tapioca_frango.webp" },
      { id: "t3", name: "Tapioca Frango e Requeijão", desc: null, price: 20.90, available: true, image: "images/products/tapioca_frango_requeijao.webp" },
      { id: "t4", name: "Tapioca Queijo Coalho", desc: null, price: 20.90, available: false },
      { id: "t5", name: "Tapioca Queijo Minas", desc: null, price: 20.90, available: false },
      { id: "t6", name: "Tapioca Presunto e Queijo", desc: null, price: 20.90, available: true, image: "images/products/tapioca_presunto_queijo.webp" },
      { id: "t7", name: "Tapioca Presunto, Queijo e Ovo", desc: null, price: 21.90, available: true, image: "images/products/tapioca_presunto_queijo_ovo.webp" },
      { id: "t8", name: "Tapioca Presunto, Queijo, Tomate e Orégano", desc: null, price: 21.90, available: true, image: "images/products/tapioca_presunto_queijo_tomate.webp" },
      { id: "t9", name: "Tapioca Carne Seca e Muçarela", desc: null, price: 21.90, available: true, image: "images/products/tapioca_carne_seca.webp" },
      { id: "t10", name: "Tapioca Carne Seca e Requeijão", desc: null, price: 21.90, available: true, image: "images/products/tapioca_carne_seca_requeijao.webp" },
      { id: "t11", name: "Tapioca Banana, Muçarela, Açúcar e Canela", desc: null, price: 20.90, available: true, image: "images/products/tapioca_banana_canela.webp", extras: [{ name: "Banana", price: 3.00 }, { name: "Queijo", price: 3.00 }] },
      { id: "t12", name: "Tapioca com carne de panela", desc: null, price: 21.90, available: true, tag: "Novidade", image: "images/products/tapioca_carne_panela.webp" },
    ],
    extras: [
      { name: "Bacon", price: 3.00 }, { name: "Ketchup", price: 0.10 }, { name: "Maionese", price: 0.10 },
      { name: "Massa Crepioca (com ovo)", price: 3.00 }, { name: "Milho", price: 3.00 },
      { name: "Ovo", price: 3.00 }, { name: "Presunto", price: 3.00 }, { name: "Queijo", price: 3.00 }
    ]
  },
  {
    id: "omeletes",
    name: "Omeletes",
    icon: "🍳",
    products: [
      { id: "o1", name: "Omelete Presunto e Muçarela", desc: null, price: 20.90, available: true, image: "images/products/omelete_presunto_queijo.webp" },
      { id: "o2", name: "Omelete Presunto, Muçarela e Azeitona", desc: null, price: 21.90, available: true, image: "images/products/omelete_presunto_queijo_azeitona.webp" },
      { id: "o3", name: "Omelete Peito de Peru, Muçarela, Azeitona e Orégano", desc: null, price: 21.90, available: false },
      { id: "o4", name: "Omelete Queijo Coalho, Carne Seca e Orégano", desc: null, price: 21.90, available: true, image: "images/products/omelete_carne_seca_coalho.webp" },
      { id: "o5", name: "Omelete Muçarela, Tomate, Azeitona e Orégano", desc: null, price: 21.90, available: true, image: "images/products/omelete_mucarela_tomate.webp" },
      { id: "o6", name: "Omelete Calabresa, Bacon e Muçarela", desc: null, price: 21.90, available: true, image: "images/products/omelete_especial.webp" },
    ],
    extras: [
      { name: "Bacon", price: 3.00 }, { name: "Ketchup", price: 0.10 }, { name: "Maionese", price: 0.10 },
      { name: "Milho", price: 3.00 }, { name: "Presunto", price: 3.00 }, { name: "Queijo", price: 3.00 }
    ]
  },
  {
    id: "cuscuz",
    name: "Cuscuz e Pamonhas",
    icon: "🌽",
    products: [
      { id: "c1", name: "Cuscuz Manteiga", desc: null, price: 13.90, available: true, image: "images/products/cuscuz_manteiga.webp" },
      { id: "c2", name: "Cuscuz Queijo Coalho com Ovo", desc: null, price: 19.90, available: true, image: "images/products/cuscuz_coalho_ovo.webp" },
      { id: "c3", name: "Cuscuz Muçarela", desc: null, price: 19.90, available: true, image: "images/products/cuscuz_mucarela.webp" },
      { id: "c4", name: "Cuscuz Muçarela com Ovo", desc: null, price: 19.90, available: true, image: "images/products/cuscuz_ovo.webp" },
      { id: "c5", name: "Pamonha Sal", desc: null, price: 9.00, available: true, image: "images/products/pamonha.webp" },
      { id: "c6", name: "Cuscuz Carne Seca com Muçarela", desc: null, price: 22.90, available: true, image: "images/products/cuscuz_carne_seca_mucarela.webp" },
      { id: "c7", name: "Cuscuz Calabresa, bacon e muçarela", desc: null, price: 22.90, available: true, image: "images/products/cuscuz_calabresa.webp" },
      { id: "c8", name: "Pamonha Doce", desc: null, price: 9.00, available: false },
    ],
    extras: [{ name: "Maionese", price: 0.10 }]
  },
  {
    id: "panquecas",
    name: "Panquecas",
    icon: "🥞",
    products: [
      { id: "pq1", name: "Panqueca Carne Moída", desc: null, price: 19.90, available: true, image: "images/products/panqueca_carne.webp" },
      { id: "pq2", name: "Panqueca Presunto e Queijo", desc: null, price: 19.90, available: true, image: "images/products/panqueca_presunto_queijo.webp" },
      { id: "pq3", name: "Panqueca Presunto, Queijo, Tomate e Orégano", desc: null, price: 20.90, available: true, image: "images/products/panqueca_presunto_queijo_tomate.webp" },
      { id: "pq4", name: "Panqueca Frango e Muçarela", desc: null, price: 19.90, available: true, image: "images/products/panqueca_frango.webp" },
      { id: "pq5", name: "Panqueca Frango e Requeijão", desc: null, price: 19.90, available: true, image: "images/products/panqueca_frango_requeijao.webp" },
      { id: "pq6", name: "Panqueca Carne Seca e Muçarela", desc: null, price: 22.90, available: true, image: "images/products/panqueca_carne_seca.webp" },
      { id: "pq7", name: "Panqueca Carne Seca e Requeijão", desc: null, price: 22.90, available: true, image: "images/products/panqueca_carne_seca_requeijao.webp" },
    ],
    extras: [
      { name: "Bacon", price: 3.00 }, { name: "Ketchup", price: 0.10 }, { name: "Maionese", price: 0.10 },
      { name: "Milho", price: 3.00 }, { name: "Ovo", price: 3.00 }, { name: "Presunto", price: 3.00 }, { name: "Queijo", price: 3.00 }
    ]
  },
  {
    id: "sanduiches",
    name: "Sanduíches",
    icon: "🍔",
    products: [
      { id: "sd1", name: "Cachorro Quente na Chapa", desc: "Salsicha, milho, queijo, batata palha e ervilha", price: 15.90, available: true, image: "images/products/cachorro_quente.webp" },
      { id: "sd2", name: "Cheese Búrguer", desc: "Hambúrguer e Queijo", price: 20.90, available: true, image: "images/products/cheese_burguer.webp" },
      { id: "sd3", name: "Cheese Bacon Salada", desc: "Hambúrguer, Bacon, Queijo e Salada", price: 22.90, available: true, image: "images/products/cheese_bacon_salada.webp" },
      { id: "sd4", name: "Cheese Tudo", desc: "Hambúrguer, Bacon, Queijo, Presunto, Ovo e Salada", price: 24.90, available: true, image: "images/products/cheese_tudo.webp" },
      { id: "sd5", name: "Cheese Frango", desc: "Frango e Queijo", price: 19.90, available: true, image: "images/products/cheese_frango.webp" },
      { id: "sd6", name: "Cheese Frango Salada", desc: "Frango, Queijo, Bacon e Salada", price: 21.90, available: true, image: "images/products/cheese_frango_salada.webp" },
      { id: "sd7", name: "Cheese Frango Tudo", desc: "Frango, Bacon, Ovo, Presunto, Queijo e Salada", price: 23.90, available: true, image: "images/products/cheese_frango_tudo.webp" },
    ],
    extras: [
      { name: "Bacon", price: 3.00 }, { name: "Ketchup", price: 0.10 }, { name: "Maionese", price: 0.10 },
      { name: "Milho", price: 3.00 }, { name: "Ovo", price: 3.00 }, { name: "Presunto", price: 3.00 },
      { name: "Queijo", price: 3.00 }, { name: "Salada", price: 3.00 }
    ]
  },
  {
    id: "paes",
    name: "Pão",
    icon: "🥖",
    products: [
      { id: "pm1", name: "Pão na Chapa", desc: null, price: 4.50, available: true, image: "images/products/pao_na_chapa.webp" },
      { id: "pm2", name: "Pão com Ovo", desc: null, price: 6.90, available: true, image: "images/products/pao_com_ovo.webp" },
      { id: "pm3", name: "Pão com Mortadela", desc: null, price: 7.90, available: false },
      { id: "pm4", name: "Pão com Presunto", desc: null, price: 7.90, available: false },
      { id: "pm5", name: "Misto Tradicional", desc: "Presunto e queijo", price: 8.90, available: true, image: "images/products/misto_quente.webp" },
      { id: "pm6", name: "Misto com Ovo", desc: "Presunto, queijo e ovo", price: 10.90, available: true, image: "images/products/misto_com_ovo.webp" },
      { id: "pm7", name: "Misto Duplo", desc: "2 fatias de queijo e 2 fatias de presunto", price: 10.90, available: true, image: "images/products/misto_duplo.webp" },
      { id: "pm8", name: "Misto Integral", desc: "Peito de peru e queijo minas", price: 10.90, available: true, image: "images/products/misto_integral.webp" },
      { id: "pm9", name: "Misto Integral com Ovo", desc: "Peito de peru, queijo minas e ovo", price: 11.90, available: true, image: "images/products/misto_integral_ovo.webp" },
      {
        id: "pm10", name: "Queijo Quente", desc: "Muçarela ou queijo minas", price: 9.90, available: true, image: "images/products/queijo_quente.webp",
        complements: [{ title: "Tipo", type: "radio", required: true, options: ["Muçarela", "Queijo Minas"] }]
      },
      { id: "pm11", name: "Pão francês com carne de panela", desc: null, price: 15.90, available: true, tag: "Novidade", image: "images/products/pao_carne_panela.webp" },
      { id: "pm12", name: "Queijo Quente com Ovo", desc: null, price: 11.90, available: true, image: "images/products/queijo_quente_ovo.webp" },
    ],
    extras: [{ name: "Ketchup", price: 0.10 }, { name: "Maionese", price: 0.10 }, { name: "Salada", price: 3.00 }]
  },
  {
    id: "bolos",
    name: "Bolos",
    icon: "🎂",
    products: [
      { id: "b1", name: "Bolo de Laranja (sem leite) und.", desc: "Sem leite", price: 14.00, available: false },
      { id: "b2", name: "Bolo Formigueiro und.", desc: null, price: 14.00, available: true, image: "images/products/bolo_formigueiro.webp" },
      { id: "b3", name: "Bolo de Chocolate und.", desc: null, price: 14.00, available: true, image: "images/products/bolo_chocolate.webp" },
      { id: "b4", name: "Bolo Mesclado und.", desc: null, price: 14.00, available: false },
      { id: "b5", name: "Bolo de Limão c/ Cobertura und.", desc: null, price: 18.00, available: true, image: "images/products/bolo_limao.webp" },
    ],
    extras: []
  },
  {
    id: "docinhos",
    name: "Sobremesa",
    icon: "🍫",
    products: [
      { id: "d1", name: "Brigadeiro", desc: null, price: 1.10, available: true, image: "images/products/brigadeiro.webp" },
      {
        id: "d2", name: "Bombom Grande", desc: null, price: 3.00, available: true, image: "images/products/bombom_grande.webp",
        complements: [{ title: "Sabores", type: "radio", required: true, options: ["Avelã", "Nozes", "Pistache", "Cereja", "Uva", "Ameixa", "Coco", "Prestígio", "Brigadeiro"] }]
      },
      {
        id: "d3", name: "Fatia de Torta Doce (Trunch)", desc: null, price: 7.00, available: true, image: "images/products/torta_doce.webp",
        complements: [{ title: "Sabores", type: "radio", required: true, options: ["Morango", "Ninho", "Limão", "Chocolate", "Abacaxi", "Beijinho de Coco", "Chocolate Branco", "Prestígio"] }]
      },
    ],
    extras: []
  },
  {
    id: "pao-frances",
    name: "Pães e Embalados",
    icon: "🍞",
    products: [
      { id: "pf1", name: "Pão Francês", desc: null, price: 1.10, available: true, image: "images/products/pao_frances.webp" },
      { id: "pf2", name: "Pão Francês Integral", desc: null, price: 1.20, available: true, image: "images/products/pao_frances_integral.webp" },
      { id: "pf3", name: "Pão de Hamburguer c/6 und", desc: null, price: 8.00, available: true, image: "images/products/pao_hamburguer.webp" },
      { id: "pf4", name: "Pão de Cachorro Quente c/5", desc: null, price: 6.00, available: true, image: "images/products/pao_cachorro_quente.webp" },
      { id: "pf5", name: "Brioche c/6 und", desc: null, price: 5.00, available: true, image: "images/products/pao_brioche.webp" },
      { id: "pf6", name: "Pão Sovado Und", desc: null, price: 14.00, available: true, image: "images/products/pao_sovado.webp" },
      { id: "pf7", name: "Pão de Leite Und", desc: null, price: 7.00, available: true, image: "images/products/pao_de_leite.webp" },
      { id: "pf8", name: "Pão de Forma Und", desc: null, price: 14.00, available: true, image: "images/products/pao_de_forma.webp" },
      { id: "pf9", name: "Rosca Trançada 5 und", desc: null, price: 5.00, available: true, image: "images/products/rosca_trancada.webp" },
    ],
    extras: []
  },
  {
    id: "pao-queijo",
    name: "Biscoitos de Queijo",
    icon: "🧀",
    products: [
      { id: "pq1b", name: "Pão de Queijo (Embalagem com 100g)", desc: "aprox. 3 unidades", price: 3.40, available: true, image: "images/products/pao_de_queijo.webp" },
      { id: "pq2b", name: "Biscoito de Queijo (Embalagem com 100g)", desc: "aprox. 3 unidades", price: 3.40, available: true, image: "images/products/biscoito_queijo.webp" },
      { id: "pq3b", name: "Peta de Polvilho Doce (Embalagem com 300g)", desc: null, price: 10.50, available: true, image: "images/products/peta_polvilho.webp" },
      { id: "pq4b", name: "Chipa (Embalagem com 250g)", desc: null, price: 9.50, available: true, image: "images/products/chipa.webp" },
      { id: "pq5b", name: "Pão de Queijo Congelado (Embalagem de 1kg)", desc: null, price: 23.90, available: true, image: "images/products/pao_queijo_congelado.webp" },
      { id: "pq6b", name: "Biscoito de Queijo Congelado (Embalagem de 1kg)", desc: null, price: 25.90, available: true, image: "images/products/biscoito_queijo_congelado.webp" },
    ],
    extras: []
  },
  {
    id: "bebidas",
    name: "Bebidas",
    icon: "🥤",
    products: [
      { id: "bb1", name: "Cappuccino Tradicional", desc: null, price: 10.90, available: true, image: "images/products/cappuccino.webp" },
      { id: "bb2", name: "Coca Cola Zero lata 310ml", desc: null, price: 5.90, available: true, image: "images/products/coca_cola_zero_lata.webp" },
      { id: "bb3", name: "Coca Cola lata 310ml", desc: null, price: 5.90, available: true, image: "images/products/refrigerante_lata.webp" },
      { id: "bb4", name: "Guaraná Antarctica Zero lata 350ml", desc: null, price: 5.90, available: true, image: "images/products/guarana_zero_lata.webp" },
      { id: "bb5", name: "Guaraná Antarctica lata 350ml", desc: null, price: 5.90, available: true, image: "images/products/guarana_lata.webp" },
      { id: "bb6", name: "Tampico 450ml", desc: null, price: 5.90, available: true, image: "images/products/tampico_450ml.webp" },
      { id: "bb7", name: "Água Tônica 350ml", desc: null, price: 4.90, available: true, image: "images/products/agua_tonica_lata.webp" },
      { id: "bb8", name: "Coca Cola 600 ml", desc: null, price: 8.50, available: true, image: "images/products/coca_cola_600ml.webp" },
      { id: "bb9", name: "Coca Cola Zero 600ml", desc: null, price: 8.50, available: true, image: "images/products/coca_cola_zero_600ml.webp" },
      { id: "bb10", name: "Guaraná Antarctica 600ml", desc: null, price: 6.90, available: true, image: "images/products/guarana_600ml.webp" },
      { id: "bb11", name: "Coca Cola 1,5L", desc: null, price: 11.90, available: false },
      { id: "bb12", name: "Coca Cola Zero 1,5L", desc: null, price: 11.90, available: false },
      { id: "bb13", name: "Fanta Laranja 1,5L", desc: null, price: 7.90, available: false },
      { id: "bb14", name: "Fanta Uva 1,5L", desc: null, price: 7.90, available: false },
      { id: "bb15", name: "Guaraná Kuat 1,5L", desc: null, price: 6.90, available: false },
      { id: "bb16", name: "Sprite 1,5L", desc: null, price: 7.90, available: false },
      { id: "bb17", name: "Coca Cola 2L", desc: null, price: 13.90, available: false },
      { id: "bb18", name: "Coca Cola Zero 2L", desc: null, price: 13.90, available: false },
      { id: "bb19", name: "Guaraná Antarctica 2L", desc: null, price: 11.90, available: false },
      { id: "bb20", name: "Red Bull 250 ml", desc: null, price: 12.90, available: true, image: "images/products/red_bull_250ml.webp" },
      { id: "bb21", name: "Monster Energy 473ml", desc: null, price: 13.90, available: true, image: "images/products/monster_energy_473ml.webp" },
      { id: "bb22", name: "Agua Mineral com gás 500ml", desc: null, price: 3.50, available: true, image: "images/products/agua_mineral_com_gas.webp" },
      { id: "bb23", name: "Agua Mineral sem gás 500ml", desc: null, price: 3.00, available: true, image: "images/products/agua_mineral_sem_gas.webp" },
      { id: "bb24", name: "Suco Natural de laranja 300ml", desc: null, price: 7.90, available: true, image: "images/products/suco_laranja.webp" },
      { id: "bb25", name: "Suco Natural de laranja 500ml", desc: null, price: 11.90, available: true, image: "images/products/suco_laranja_500ml.webp" },
      { id: "bb26", name: "Suco Natural de laranja 1L", desc: null, price: 19.90, available: true, image: "images/products/suco_laranja_1l.webp" },
      {
        id: "bb27", name: "Suco de Polpa (300ml)", desc: null, price: 7.90, available: false,
        complements: [{ title: "Sabores de Polpa", type: "radio", required: false, options: ["Graviola", "Morango", "Caju", "Acerola", "Goiaba", "Manga", "Maracujá", "Abacaxi", "Cajá"] }]
      },
      {
        id: "bb28", name: "Suco de Polpa (500ml)", desc: null, price: 11.90, available: false,
        complements: [{ title: "Sabores de Polpa", type: "radio", required: false, options: ["Graviola", "Morango", "Caju", "Acerola", "Goiaba", "Manga", "Maracujá", "Abacaxi", "Cajá"] }]
      },
    ],
    extras: []
  },
];

// =============================================
// DADOS DAS PIZZAS
// =============================================
let PIZZAS = {
  name: "Pizzas",
  icon: "🍕",
  sizes: [
    { id: "brotinho", name: "Brotinho", desc: "Até 2 Sabores - 4 Fatias", basePrice: 34.90, maxFlavors: 2 },
    { id: "grande", name: "Grande 8 Fatias", desc: "Até 2 Sabores - 8 Fatias", basePrice: 59.90, maxFlavors: 2 },
  ],
  flavors: [
    { name: "Calabresa", desc: "Muçarela, molho pomodoro, calabresa e cebola", type: "Tradicional", prices: { brotinho: 34.90, grande: 59.90 }, image: "images/products/pizza_calabresa.webp" },
    { name: "Frango", desc: "Muçarela, molho pomodoro, frango, milho e azeitona", type: "Tradicional", prices: { brotinho: 34.90, grande: 59.90 }, image: "images/products/pizza_frango.webp" },
    { name: "Marguerita", desc: "Muçarela, molho pomodoro, tomate cereja, parmesão e manjericão", type: "Tradicional", prices: { brotinho: 34.90, grande: 59.90 }, image: "images/products/pizza_marguerita.webp" },
    { name: "Muçarela", desc: "Muçarela, molho pomodoro e tomate", type: "Tradicional", prices: { brotinho: 34.90, grande: 59.90 }, image: "images/products/pizza_mucarela.webp" },
    { name: "Napolitana", desc: "Muçarela, molho pomodoro, presunto, cebola e azeitona, manjericão e alho frito", type: "Tradicional", prices: { brotinho: 34.90, grande: 59.90 }, image: "images/products/pizza_napolitana.webp" },
    { name: "Peito de Peru", desc: "Muçarela, molho pomodoro, peito de peru e tomate", type: "Tradicional", prices: { brotinho: 34.90, grande: 59.90 }, image: "images/products/pizza_peito_peru.webp" },
    { name: "Pizzaiolo", desc: "Muçarela, molho pomodoro, lombo canadense, bacon, milho, cebola, tomate e azeitona", type: "Especial", prices: { brotinho: 39.90, grande: 69.90 }, image: "images/products/pizza_pizzaiolo.webp" },
    { name: "Abobrinha", desc: "Muçarela, molho pomodoro, abobrinha e tomate", type: "Especial", prices: { brotinho: 39.90, grande: 69.00 }, available: false },
    { name: "Frango Especial", desc: "Muçarela, molho pomodoro, frango, requeijão e cebola", type: "Especial", prices: { brotinho: 39.90, grande: 69.90 }, image: "images/products/pizza_frango_catupiry.webp" },
    { name: "Portuguesa", desc: "Muçarela, molho pomodoro, calabresa, presunto, cebola, pimentão, tomate, azeitona e ovos", type: "Especial", prices: { brotinho: 39.90, grande: 69.90 }, image: "images/products/pizza_portuguesa.webp" },
    { name: "Luziânia", desc: "Muçarela, molho pomodoro, frango, bacon, ovos, milho e cebola", type: "Especial", prices: { brotinho: 39.90, grande: 69.90 }, image: "images/products/pizza_luziania.webp" },
    { name: "Especiale", desc: "Muçarela, molho pomodoro, calabresa, presunto, bacon, milho, azeitona e palmito", type: "Gourmet", prices: { brotinho: 35.90, grande: 64.90 }, image: "images/products/pizza_especiale.webp" },
    { name: "Quitanda", desc: "Muçarela, molho pomodoro, carne seca, azeitona, tomate cereja e manjericão", type: "Gourmet", prices: { brotinho: 38.90, grande: 69.90 }, available: false },
    { name: "Peperoni", desc: "Muçarela, molho pomodoro e peperoni", type: "Gourmet", prices: { brotinho: 37.90, grande: 69.90 }, image: "images/products/pizza_peperoni.webp" },
    { name: "Quatro queijos", desc: "Muçarela, molho pomodoro, parmesão, provolone e gorgonzola", type: "Gourmet", prices: { brotinho: 35.90, grande: 69.90 }, image: "images/products/pizza_quatro_queijos.webp" },
    { name: "Vegetariana", desc: "Muçarela, molho pomodoro, muçarela de búfala, abobrinha grelhada, tomate cereja, palmito e manjericão", type: "Gourmet", prices: { brotinho: 37.90, grande: 69.90 }, image: "images/products/pizza_vegetariana.webp" },
    { name: "Americana", desc: "Muçarela, molho pomodoro, peperoni, frango, requeijão, azeitona e cebola", type: "Gourmet", prices: { brotinho: 42.90, grande: 79.90 }, image: "images/products/pizza_americana.webp" },
    { name: "Tomate seco", desc: "Muçarela, molho pomodoro, muçarela de búfala, tomate seco e rúcula", type: "Gourmet", prices: { brotinho: 36.90, grande: 69.90 }, image: "images/products/pizza_tomate_seco.webp" },
    { name: "Maria bonita", desc: "Muçarela, molho pomodoro, carne seca, requeijão, cebola e pimenta calabresa", type: "Gourmet", prices: { brotinho: 36.90, grande: 69.90 }, available: false },
    { name: "Do chef", desc: "Muçarela, molho pomodoro, lombo canadense, provolone, pimenta calabresa e abacaxi", type: "Gourmet", prices: { brotinho: 37.90, grande: 69.90 }, available: false },
    { name: "Camarão", desc: "Muçarela, molho pomodoro, camarão, tomate cereja e manjericão", type: "Gourmet", prices: { brotinho: 44.90, grande: 84.90 }, image: "images/products/pizza_camarao.webp" },
    { name: "Sonho de pizza", desc: "Muçarela, leite condensado, chocolate meio amargo e bombom sonho de valsa", type: "Doce", prices: { brotinho: 34.90, grande: 59.90 }, available: false },
    { name: "Choconana", desc: "Muçarela, banana e chocolate", type: "Doce", prices: { brotinho: 33.90, grande: 49.90 }, image: "images/products/pizza_choconana.webp" },
    { name: "Morango", desc: "Muçarela, morango e chocolate", type: "Doce", prices: { brotinho: 34.90, grande: 59.90 }, image: "images/products/pizza_morango.webp" },
    { name: "Prestígio", desc: "Muçarela, coco ralado e chocolate", type: "Doce", prices: { brotinho: 34.90, grande: 59.90 }, image: "images/products/pizza_prestigio.webp" },
    { name: "Banana", desc: "Muçarela, banana, leite condensado e canela", type: "Doce", prices: { brotinho: 33.90, grande: 49.90 }, image: "images/products/pizza_banana.webp" },
  ],
  borders: [
    { name: "Sem borda", prices: { brotinho: 0, grande: 0 } },
    { name: "Requeijão", prices: { brotinho: 7, grande: 10 } },
    { name: "Cheddar", prices: { brotinho: 7, grande: 10 } },
    { name: "Muçarela", prices: { brotinho: 7, grande: 10 } },
    { name: "Chocolate", prices: { brotinho: 7, grande: 10 } },
  ]
};

// =============================================
// ÁREAS DE ENTREGA E TAXAS (LUZIÂNIA-GO)
// =============================================
let DELIVERY_AREAS = {
  city: "Luziânia",
  state: "GO",
  neighborhoods: [
    { name: "Bairro Prefeito Caetano", fee: 6.00 },
    { name: "Centro", fee: 5.00 },
    { name: "Jardim Ingá", fee: 12.00 },
    { name: "Jardim Jockey Club", fee: 8.00 },
    { name: "Parque Alvorada", fee: 7.00 },
    { name: "Parque Estrela", fee: 6.00 },
    { name: "Parque Industrial", fee: 9.00 },
    { name: "Setor Leste", fee: 6.00 },
    { name: "Setor Norte", fee: 7.00 },
    { name: "Vila Guará", fee: 8.00 }
  ]
};

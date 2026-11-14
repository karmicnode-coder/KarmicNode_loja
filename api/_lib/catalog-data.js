// Gerado a partir de data/catalog.json — NÃO EDITAR À MÃO.
// Fonte de verdade do preço BASE de cada SKU, usada pelo servidor
// (api/_lib/catalog.js) para nunca confiar no preço que vem do browser.
// Para atualizar: correr de novo o script que gerou isto a partir de
// data/catalog.json sempre que o catálogo mudar.
//
// IMPORTANTE — Black Friday: os preços abaixo já incluem os descontos
// aplicados em public/store/products.js (bloco "Taxonomia v10", var BF),
// para os 5 SKUs com desconto ativo (KN-004, KN-005, KN-014, KN-018,
// KN-CASA-002). Isto é FEITO À MÃO aqui porque o frontend aplica o desconto
// em runtime a partir do preço de catálogo; o servidor precisa do preço
// FINAL já descontado para não cobrar a mais a quem compra com desconto.
// Se a campanha mudar/acabar, atualiza também aqui (e idealmente substitui
// este mecanismo por um campo "price" já final vindo de data/catalog.json).
//
// NOTA: inclui também os produtos da linha "Casa" (KN-CASA-001..005),
// que existem em public/store/products.js mas não em data/catalog.json
// (gerado só a partir dos 29 SKUs "principais"). Sem isto, o checkout
// rejeitava qualquer compra de produtos da Casa com "Produto desconhecido".
export const CATALOG_DATA = [
  {
    "sku": "KN-001",
    "name": "T-Shirt Essencial Algodão",
    "price": 29.99,
    "customizable": true,
    "stock": 32
  },
  {
    "sku": "KN-002",
    "name": "Polo Piqué Clássico",
    "price": 69.9,
    "customizable": true,
    "stock": 22
  },
  {
    "sku": "KN-003",
    "name": "Camisa Trabalho Robusta",
    "price": 79.95,
    "customizable": false,
    "stock": 18
  },
  {
    "sku": "KN-004",
    "name": "Sweatshirt Interior Cardado",
    "price": 43.99,
    "customizable": true,
    "stock": 45
  },
  {
    "sku": "KN-005",
    "name": "Hoodie Algodão Pesado",
    "price": 71.99,
    "customizable": true,
    "stock": 28
  },
  {
    "sku": "KN-006",
    "name": "Casaco Impermeável Outdoor",
    "price": 120,
    "customizable": false,
    "stock": 20
  },
  {
    "sku": "KN-007",
    "name": "Bomber Nylon Aviador",
    "price": 159.9,
    "customizable": false,
    "stock": 8
  },
  {
    "sku": "KN-008",
    "name": "Calças Cargo Multibolsos",
    "price": 99,
    "customizable": false,
    "stock": 25
  },
  {
    "sku": "KN-009",
    "name": "Jeans Corte Direito",
    "price": 99.95,
    "customizable": false,
    "stock": 42
  },
  {
    "sku": "KN-010",
    "name": "Vestido Midi Malha Canelada",
    "price": 39.95,
    "customizable": false,
    "stock": 30
  },
  {
    "sku": "KN-011",
    "name": "Saia Plissada Cetim",
    "price": 35.99,
    "customizable": false,
    "stock": 25
  },
  {
    "sku": "KN-012",
    "name": "Fato de Treino Técnico",
    "price": 69.99,
    "customizable": true,
    "stock": 35
  },
  {
    "sku": "KN-013",
    "name": "Leggings Cintura Alta",
    "price": 45,
    "customizable": false,
    "stock": 48
  },
  {
    "sku": "KN-014",
    "name": "Ténis Clássicos Couro Branco",
    "price": 101.99,
    "customizable": false,
    "stock": 55
  },
  {
    "sku": "KN-015",
    "name": "Ténis Pele T-Toe",
    "price": 120,
    "customizable": false,
    "stock": 48
  },
  {
    "sku": "KN-016",
    "name": "Boné Estruturado 6 Painéis",
    "price": 25.99,
    "customizable": true,
    "stock": 60
  },
  {
    "sku": "KN-017",
    "name": "Carteira Slim Couro RFID",
    "price": 59.95,
    "customizable": false,
    "stock": 35
  },
  {
    "sku": "KN-018",
    "name": "Mochila Clássica 16L Impermeável",
    "price": 67.99,
    "customizable": false,
    "stock": 40
  },
  {
    "sku": "KN-019",
    "name": "Portátil Ultrafino 13\" M-Series",
    "price": 1299,
    "customizable": false,
    "stock": 15
  },
  {
    "sku": "KN-020",
    "name": "Mini PC Core i7 Compacto",
    "price": 589,
    "customizable": false,
    "stock": 12
  },
  {
    "sku": "KN-021",
    "name": "Teclado Mecânico Sem Fios",
    "price": 119,
    "customizable": false,
    "stock": 28
  },
  {
    "sku": "KN-022",
    "name": "Rato Sem Fios Ergonómico 8K DPI",
    "price": 109,
    "customizable": false,
    "stock": 32
  },
  {
    "sku": "KN-023",
    "name": "Tapete Rato XXL Antiderrapante",
    "price": 29.99,
    "customizable": true,
    "stock": 40
  },
  {
    "sku": "KN-024",
    "name": "Auscultadores Wireless ANC",
    "price": 329,
    "customizable": false,
    "stock": 20
  },
  {
    "sku": "KN-025",
    "name": "Webcam HD 1080p com Correção Luz",
    "price": 74.99,
    "customizable": false,
    "stock": 35
  },
  {
    "sku": "KN-026",
    "name": "Power Bank 24.000mAh 140W",
    "price": 129.99,
    "customizable": false,
    "stock": 25
  },
  {
    "sku": "KN-027",
    "name": "Carregador GaN 65W 3 Portas",
    "price": 49.99,
    "customizable": false,
    "stock": 45
  },
  {
    "sku": "KN-028",
    "name": "Capa Transparente MagSafe iPhone",
    "price": 26.99,
    "customizable": true,
    "stock": 60
  },
  {
    "sku": "KN-029",
    "name": "Suporte Auto MagSafe Rotativo",
    "price": 19.99,
    "customizable": false,
    "stock": 50
  },
  {
    "sku": "KN-CASA-001",
    "name": "Almofada em Linho Bordado",
    "price": 49.99,
    "customizable": true,
    "stock": 40
  },
  {
    "sku": "KN-CASA-002",
    "name": "Manta em Lã Merino",
    "price": 103.99,
    "customizable": false,
    "stock": 30
  },
  {
    "sku": "KN-CASA-003",
    "name": "Vela Aromática Ritual",
    "price": 39.99,
    "customizable": false,
    "stock": 80
  },
  {
    "sku": "KN-CASA-004",
    "name": "Roupão Spa em Algodão Egípcio",
    "price": 119,
    "customizable": true,
    "stock": 35
  },
  {
    "sku": "KN-CASA-005",
    "name": "Poster — Impressão Museológica",
    "price": 34.99,
    "customizable": true,
    "stock": 60
  }
];

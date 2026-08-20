// Bring React hooks/APIs into scope (repo originalmente fazia `import from 'react'`)
const { useState, useEffect, useRef, useCallback, useContext, createContext } = React;
type ReactNode = any;

const logoImg = 'assets/logo-karmic-node.png'
// Placeholder — real functions assigned inside mountApp() below
let createT: any = (_lang: any) => (k: any) => String(k);
let getArr: any = (_lang: any, _key: any) => [];
type Lang = 'pt' | 'en';
type TKey = string;
const LangContext = createContext<{ lang: Lang; t: (k: TKey) => string; arr: (k: TKey) => string[] }>({
  lang: 'pt', t: k => k, arr: () => [],
})
const useLang = () => useContext(LangContext)

// Helpers para traduções de campos dos Produtos (fallback para PT se EN não existir)
function useProductI18n() {
  const { lang } = useLang()
  return {
    pName: (p: any): string => (lang === 'en' && p.nameEn) ? p.nameEn : p.name,
    pDesc: (p: any): string => (lang === 'en' && p.descriptionEn) ? p.descriptionEn : p.description,
    pCat: (p: any): string => (lang === 'en' && p.categoryEn) ? p.categoryEn : p.category,
    pSub: (p: any): string => (lang === 'en' && p.subcategoryEn) ? p.subcategoryEn : (p.subcategory || p.category),
    pBadge: (p: any): string | null => {
      if (!p.badge) return null
      if (lang === 'en') {
        const map: Record<string, string> = { 'Bestseller': 'Bestseller', 'Popular': 'Popular', 'Novo': 'New', 'Premium': 'Premium', 'Últimas unidades': 'Last units' }
        return map[p.badge] || p.badge
      }
      return p.badge
    },
    pSpecs: (p: any): { label: string; value: string }[] => (lang === 'en' && p.specsEn) ? p.specsEn : p.specs,
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Page = 'home' | 'shop' | 'product' | 'contact' | 'about' | 'blog' | 'custom' | 'vestuario' | 'it'
type Vertical = 'vestuario' | 'it' | 'all'

interface Product {
  id: number
  sku?: string
  nameEn?: string
  descriptionEn?: string
  categoryEn?: string
  subcategoryEn?: string
  specsEn?: { label: string; value: string }[]
  badgeEn?: string
  stripeId?: string
  name: string
  category: string
  subcategory?: string
  vertical?: 'vestuario' | 'it'
  customizable?: boolean
  tags: string[]
  price: number
  originalPrice: number | null
  badge: string | null
  badgeColor: 'bordo' | 'gold'
  rating: number
  reviews: number
  image: string
  images: string[]
  stock: number
  description: string
  specs: { label: string; value: string }[]
}

interface CartItem extends Product { qty: number }

interface BlogPost {
  id: number
  title: string
  titleEn?: string
  excerptEn?: string
  categoryEn?: string
  slug: string
  category: string
  excerpt: string
  body: string[]
  image: string
  author: string
  date: string
  readTime: number
  featured?: boolean
}

// ─── Blog data ────────────────────────────────────────────────────────────────

const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: 'Como construir um guarda-roupa cápsula em 2026',
    slug: 'guarda-roupa-capsula-2026',
    category: 'Estilo',
    excerpt: 'Menos peças, mais versatilidade. Descobrimos como criar um guarda-roupa funcional com menos de 30 peças que combinam entre si.',
    body: [
      'O conceito de guarda-roupa cápsula surgiu nos anos 70 mas nunca foi tão relevante como hoje. Com o excesso de consumo em debate, muitos optam por uma abordagem mais consciente e inteligente ao vestuário.',
      'A base de qualquer guarda-roupa cápsula são as peças neutras: brancos, pretos, bege, cinzentos e azul-marinho. Estas cores combinam entre si e com qualquer acento de cor que queira adicionar sazonalmente.',
      'Invista em qualidade, não em quantidade. Uma camisola de algodão premium dura anos e mantém a forma. Uma peça barata pode sair mais cara a longo prazo — desbota, perde forma, e acaba substituída em meses.',
      'As peças essenciais para começar: 3 camisas básicas (branca, preta, cinzenta), 2 calças de corte clássico (uma azul escuro, uma bege), 1 casaco de qualidade, 2 camisolas, 1 vestido versátil e 2 pares de sapatos (um casual, um mais formal).',
      'Adicione 3 a 5 peças de acento por estação — uma cor vibrante, um padrão, um acessório especial. Estas peças dão personalidade ao look sem comprometer a versatilidade do conjunto.',
    ],
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=85',
    author: 'Karmic Node',
    date: '18 Jul 2026',
    readTime: 6,
    titleEn: 'How to build a capsule wardrobe in 2026',
    excerptEn: 'Fewer pieces, more versatility. We share how to build a functional wardrobe with under 30 pieces that mix and match.',
    categoryEn: 'Style',
    featured: true,
  },
  {
    id: 2,
    title: 'Tendências de moda para o outono/inverno 2026',
    slug: 'tendencias-moda-outono-inverno-2026',
    category: 'Tendências',
    excerpt: 'Os tons terrosos, os tecidos texturados e o regresso do oversized dominam a estação mais elegante do ano.',
    body: [
      'O outono/inverno 2026 traz um retorno à substância. Após anos de minimalismo extremo, os criadores apostam em texturas ricas, volumes generosos e paletas de cor que evocam a natureza.',
      'Os tons terrosos são a grande aposta: camel, terracota, mostarda e chocolate substituem os cinzentos neutros das últimas temporadas. Combinados com tecidos como tweed, veludo e lã grossa, criam looks de grande impacto visual.',
      'O oversized mantém-se relevante, mas desta vez com mais estrutura. Casacos de ombros marcados, blazers largos com cinto e blusões de grandes proporções definem a silhueta da estação.',
      'Os acessórios ganham protagonismo: chapéus de aba larga, botas de cano alto e malas com textura animal print (mas em versão eco-friendly) são os complementos do momento.',
      'A dica principal: misture texturas. Veludo com lã, couro com algodão, seda com tweed. É nesse contraste que reside a sofisticação desta temporada.',
    ],
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85',
    author: 'Karmic Node',
    date: '12 Jul 2026',
    readTime: 5,
    titleEn: 'Fashion trends for fall/winter 2026',
    excerptEn: 'Earthy tones, textured fabrics and the return of oversized dominate the most elegant season of the year.',
    categoryEn: 'Trends',
  },
  {
    id: 3,
    title: 'Guia completo de cuidados com tecidos premium',
    slug: 'cuidados-tecidos-premium',
    category: 'Cuidados',
    excerpt: 'Lã merino, cashmere, linho, seda — cada tecido tem as suas regras. Aprenda a fazer as suas peças durarem anos.',
    body: [
      'Investir em peças de qualidade é apenas metade da equação. A outra metade é saber tratá-las corretamente. Um cashmere mal lavado nunca mais volta ao estado original.',
      'A lã merino e o cashmere devem ser lavados à mão em água fria com detergente neutro, ou em programa de lã a 30°C. Nunca torcer — pressione suavemente e seque na horizontal para manter a forma.',
      'O linho é um dos tecidos mais resistentes mas amassa facilmente. Lave a 40°C, estenda logo após a lavagem para minimizar amarrotamento, e passe a ferro com vapor enquanto ainda ligeiramente húmido.',
      'A seda exige cuidado redobrado. Lave à mão em água fria, nunca use lixívia, e seque à sombra. O calor direto do sol desbota e fragiliza as fibras. Passe a ferro pelo lado errado com temperatura baixa.',
      'Para guardar peças fora de estação: dobre (não pendure) as malhas para não deformar, use sacos de tecido respirável para peças delicadas, e adicione sachets de lavanda para repelir traças de forma natural.',
    ],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85',
    author: 'Karmic Node',
    date: '5 Jul 2026',
    readTime: 4,
    titleEn: 'Complete guide to caring for premium fabrics',
    excerptEn: 'Merino wool, cashmere, linen, silk — each fabric has its rules. Learn how to make your pieces last for years.',
    categoryEn: 'Care',
  },
  {
    id: 4,
    title: 'Como vestir bem sem gastar muito: o guia definitivo',
    slug: 'vestir-bem-sem-gastar-muito',
    category: 'Estilo',
    excerpt: 'Elegância não é sinónimo de preço elevado. Com estratégia e alguns princípios básicos, é possível ter um estilo impecável com orçamento controlado.',
    body: [
      'O maior mito da moda é que é preciso gastar muito para vestir bem. A realidade é que o estilo é uma questão de proporcionalidade, qualidade de corte e coerência — não de marcas ou preços.',
      'Priorize o corte acima de tudo. Uma peça de preço médio bem ajustada ao seu corpo supera sempre uma peça de marca cara que não assenta bem. Se necessário, invista em pequeñas alterações de costura — valem cada cêntimo.',
      'Compre menos e melhor. Em vez de 10 peças a 20€, opte por 3 a 60€. Vai usar mais, durar mais, e sentir-se melhor. A equação económica também favorece a qualidade a longo prazo.',
      'Aproveite as épocas de saldos para comprar peças clássicas — não tendências. Um casaco de lã, uma camisa oxford, umas calças de corte reto — estas peças não ficam desatualizadas e valem o investimento em desconto.',
      'As lojas de segunda mão e vintage são aliadas fantásticas. É possível encontrar peças de marcas premium em excelente estado por uma fração do preço original. Requer paciência, mas as descobertas compensam.',
    ],
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=85',
    author: 'Karmic Node',
    date: '28 Jun 2026',
    readTime: 7,
    titleEn: 'Como vestir bem sem gastar muito: o guia definitivo',
    excerptEn: 'Elegância não é sinónimo de preço elevado. Com estratégia e alguns princípios básicos, é possível ter um estilo impecável com orçamento controlado.',
    categoryEn: 'Style',
  },
  {
    id: 5,
    title: 'Moda sustentável: como fazer escolhas mais conscientes',
    slug: 'moda-sustentavel-escolhas-conscientes',
    category: 'Sustentabilidade',
    excerpt: 'A indústria da moda é uma das mais poluentes do mundo. Mostramos como fazer escolhas que fazem diferença sem abdicar do estilo.',
    body: [
      'A moda rápida (fast fashion) tem um custo ambiental enorme: toneladas de roupas descartadas anualmente, poluição de rios por corantes, e emissões de carbono significativas. Mas há alternativas.',
      'Comprar menos é o passo mais impactante. Cada peça que não é comprada é a mais sustentável de todas. Antes de qualquer compra, pergunte: já tenho algo similar? Vou usar isto mais de 30 vezes?',
      'Prefira materiais naturais e certificados: algodão orgânico (GOTS), lã certificada (RWS), linho europeu, ou alternativas inovadoras como Tencel e Modal (fibras de madeira de reflorestação).',
      'A durabilidade é sustentabilidade. Uma peça que dura 10 anos tem muito menor impacto ambiental do que 10 peças que duram 1 ano cada. Invista em qualidade — é uma decisão ambiental tanto quanto estética.',
      'Dê nova vida às peças que já tem: aprenda a fazer pequenas reparações, personalize com bordados ou patches, ou troque com amigos. O melhor guarda-roupa sustentável é o que já existe.',
    ],
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&q=85',
    author: 'Karmic Node',
    date: '20 Jun 2026',
    readTime: 5,
    titleEn: 'Moda sustentável: como fazer escolhas mais conscientes',
    excerptEn: 'A indústria da moda é uma das mais poluentes do mundo. Mostramos como fazer escolhas que fazem diferença sem abdicar do estilo.',
    categoryEn: 'Sustainability',
  },
  {
    id: 6,
    title: 'O regresso do alfaiate: por que o fato voltou',
    slug: 'regresso-alfaiate-fato-voltou',
    category: 'Tendências',
    excerpt: 'Após anos de dominação do casual, o fato bem cortado regressa em força — e desta vez para ficar.',
    body: [
      'Havia uma certa melancolia na morte do fato. A pandemia acelerou a casualização do vestuário, e muitos proclamaram o fim do alfaiate clássico. Estavam enganados.',
      'O fato ressurge em 2026 com uma nova energia: menos formal, mais expressivo. Padrões ousados como o príncipe de Gales e o xadrez coexistem com cortes oversized em cores inesperadas — lilás, mostarda, verde floresta.',
      'A nova regra é quebrar o fato. Calças do fato com sapatilhas e t-shirt básica. Casaco do fato sobre jeans e bota de cowboy. O fato deixou de ser uma armadura rígida e tornou-se uma ferramenta de estilo versátil.',
      'Para o mercado de trabalho, o "smart casual" abriu espaço ao fato sem gravata, ao casaco sem calças combinadas, ao colete como peça isolada. A fronteira entre formal e casual dissolve-se definitivamente.',
      'Invista num bom fato clássico — azul-marinho ou cinzento carvão, corte ligeiramente slim — e terá uma peça para décadas. Com as combinações certas, serve para uma entrevista de emprego, um casamento e um jantar de negócios.',
    ],
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b1df2?w=1200&q=85',
    author: 'Karmic Node',
    date: '10 Jun 2026',
    readTime: 6,
    titleEn: 'O regresso do alfaiate: por que o fato voltou',
    excerptEn: 'Após anos de dominação do casual, o fato bem cortado regressa em força — e desta vez para ficar.',
    categoryEn: 'Trends',
  },
  {
    id: 7,
    title: 'Acessórios que transformam qualquer look',
    slug: 'acessorios-que-transformam-look',
    category: 'Acessórios',
    excerpt: 'Um cinto certo, um lenço bem colocado ou a mala ideal podem elevar um look simples ao patamar seguinte.',
    body: [
      'Os acessórios são o segredo mais subestimado do estilo. São eles que revelam personalidade e transformam um look básico em algo memorável — sem mudar uma única peça de roupa.',
      'O cinto é o acessório mais funcional e estético ao mesmo tempo. Define a cintura, estrutura a silhueta e adiciona um ponto de interesse ao conjunto. Invista em couro genuíno de cor neutra — dura décadas e combina com tudo.',
      'O lenço de seda ou algodão é o acessório mais versátil que existe: no pescoço, no cabelo, na mala, no pulso, ou como lenço de bolso no casaco. É pequeno, fácil de transportar e multiplica as combinações possíveis.',
      'As malas merecem investimento especial — são o acessório mais visível e usado. Prefira couro ou materiais de qualidade, formas clássicas e cores que durem além das temporadas. Uma boa mala é um investimento de décadas.',
      'Bijuteria minimalista e discreta é sempre segura — camadas de correntes finas, brincos pequenos, pulseiras simples. Quando quer impacto, escolha UMA peça statement e deixe o resto limpo.',
    ],
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=85',
    author: 'Karmic Node',
    date: '1 Jun 2026',
    readTime: 5,
    titleEn: 'Acessórios que transformam qualquer look',
    excerptEn: 'Um cinto certo, um lenço bem colocado ou a mala ideal podem elevar um look simples ao patamar seguinte.',
    categoryEn: 'Accessories',
  },
  {
    id: 8,
    title: 'Como combinar padrões sem errar',
    slug: 'como-combinar-padroes-sem-errar',
    category: 'Estilo',
    excerpt: 'Riscas com xadrez, florais com geométrico — misturar padrões parece arriscado mas há regras simples que tornam o resultado sempre elegante.',
    body: [
      'Misturar padrões é um dos gestos de estilo mais ousados e, quando bem feito, mais impressionantes. O truque está em perceber as regras antes de as quebrar.',
      'A regra mais importante: varie a escala. Um padrão grande com um padrão pequeno do mesmo tipo funciona quase sempre. Riscas largas com riscas finas, xadrez grande com xadrez pequeno, floral grande com floral pequeno.',
      'Partilhe uma cor em comum. Se ambos os padrões partilham pelo menos uma cor, a combinação fica automaticamente coesa. Um casaco às riscas azul e branco com uma camisa xadrez azul e verde funciona porque o azul é o elo de ligação.',
      'Use o sólido como árbitro. Entre dois padrões, uma peça sólida (calça, cinto, sapato) na cor dominante de um dos padrões une o conjunto e dá ao olho um ponto de descanso.',
      'Comece com dois padrões máximo. Quando ganhar confiança, experimente três. Mais do que isso raramente funciona fora de contextos muito específicos de alta moda.',
    ],
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=85',
    author: 'Karmic Node',
    date: '22 Mai 2026',
    readTime: 7,
    titleEn: 'Como combinar padrões sem errar',
    excerptEn: 'Riscas com xadrez, florais com geométrico — misturar padrões parece arriscado mas há regras simples que tornam o resultado sempre elegante.',
    categoryEn: 'Style',
  },
]

// ─── Products ────────────────────────────────────────────────────────────────

const ALL_PRODUCTS: Product[] = [
  {
    id: 1, sku: 'KN-001', name: 'T-Shirt Essencial Algodão',
    category: 'Tops', subcategory: 'Tops e Camisaria', vertical: 'vestuario',
    tags: ['tops', 'camisaria'],
    price: 29.99, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.8, reviews: 480, stock: 32,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-90 -10 L-70 20 L-50 10 L-50 60 L50 60 L50 10 L70 20 L90 -10 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Tops e Camisaria</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-90 -10 L-70 20 L-50 10 L-50 60 L50 60 L50 10 L70 20 L90 -10 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Tops e Camisaria</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Algodão 100% premium, corte clássico. Peça base do guarda-roupa moderno, pronta para uso ou personalização.',
    nameEn: 'Essential Cotton T-Shirt',
    descriptionEn: 'Premium 100% cotton, classic cut. Wardrobe staple ready to wear or customize.',
    categoryEn: 'Tops',
    subcategoryEn: 'Tops & Shirts',
    specsEn: [{ label: 'Material', value: '100% Cotton' }, { label: 'Cut', value: 'Regular fit' }, { label: 'Sizes', value: 'XS to XXL' }, { label: 'Care', value: 'Machine wash 30°C' }, { label: 'Colors', value: 'White, Black, Beige, Navy' }],
    specs: [{ label: 'Material', value: '100% Algodão' }, { label: 'Corte', value: 'Regular fit' }, { label: 'Tamanhos', value: 'XS ao XXL' }, { label: 'Cuidados', value: 'Lavagem a 30°C' }, { label: 'Cores', value: 'Branco, Preto, Bege, Marinho' }],
  },
  {
    id: 2, sku: 'KN-002', name: 'Polo Piqué Clássico',
    category: 'Tops', subcategory: 'Tops e Camisaria', vertical: 'vestuario',
    tags: ['tops', 'camisaria'],
    price: 69.9, originalPrice: null,
    badge: null, badgeColor: 'gold',
    rating: 4.6, reviews: 210, stock: 22,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-55 -30 L-85 -5 L-65 20 L-50 10 L-50 60 L50 60 L50 10 L65 20 L85 -5 L55 -30 L20 -30 L15 -15 L-15 -15 L-20 -30 Z%22/><path d=%22M-15 -15 L-10 15 L10 15 L15 -15%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Tops e Camisaria</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-55 -30 L-85 -5 L-65 20 L-50 10 L-50 60 L50 60 L50 10 L65 20 L85 -5 L55 -30 L20 -30 L15 -15 L-15 -15 L-20 -30 Z%22/><path d=%22M-15 -15 L-10 15 L10 15 L15 -15%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Tops e Camisaria</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Piqué de algodão respirável com carcela de 2 botões. Elegância descontraída para qualquer momento.',
    nameEn: 'Classic Piqué Polo',
    descriptionEn: 'Breathable cotton piqué with 2-button placket. Effortless elegance for any moment.',
    categoryEn: 'Tops',
    subcategoryEn: 'Tops & Shirts',
    specsEn: [{ label: 'Material', value: '100% Piqué Algodão' }, { label: 'Cut', value: 'Classic fit' }, { label: 'Sizes', value: 'XS to XXL' }, { label: 'Colors', value: 'White, Navy, Burgundy, Black' }],
    specs: [{ label: 'Material', value: '100% Piqué Algodão' }, { label: 'Corte', value: 'Classic fit' }, { label: 'Tamanhos', value: 'XS ao XXL' }, { label: 'Cores', value: 'Branco, Navy, Bordeaux, Preto' }],
  },
  {
    id: 3, sku: 'KN-003', name: 'Camisa Trabalho Robusta',
    category: 'Camisas', subcategory: 'Tops e Camisaria', vertical: 'vestuario',
    tags: ['tops', 'camisaria'],
    price: 79.95, originalPrice: null,
    badge: null, badgeColor: 'gold',
    rating: 4.6, reviews: 145, stock: 18,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-55 -30 L-85 0 L-70 25 L-50 15 L-50 60 L50 60 L50 15 L70 25 L85 0 L55 -30 L20 -30 L0 -10 L-20 -30 Z%22/><path d=%22M-30 0 L-30 55 M30 0 L30 55 M0 -10 L0 55%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Tops e Camisaria</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-55 -30 L-85 0 L-70 25 L-50 15 L-50 60 L50 60 L50 15 L70 25 L85 0 L55 -30 L20 -30 L0 -10 L-20 -30 Z%22/><path d=%22M-30 0 L-30 55 M30 0 L30 55 M0 -10 L0 55%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Tops e Camisaria</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Algodão de alta durabilidade, estilo urbano funcional com bolsos frontais reforçados.',
    nameEn: 'Rugged Work Shirt',
    descriptionEn: 'High-durability cotton, functional urban style with reinforced front pockets.',
    categoryEn: 'Shirts',
    subcategoryEn: 'Tops & Shirts',
    specsEn: [{ label: 'Material', value: 'Algodão sarja pesada' }, { label: 'Cut', value: 'Regular fit' }, { label: 'Sizes', value: 'S to XXL' }, { label: 'Colors', value: 'Beige, Military Green, Black' }],
    specs: [{ label: 'Material', value: 'Algodão sarja pesada' }, { label: 'Corte', value: 'Regular fit' }, { label: 'Tamanhos', value: 'S ao XXL' }, { label: 'Cores', value: 'Bege, Verde militar, Preto' }],
  },
  {
    id: 4, sku: 'KN-004', name: 'Sweatshirt Interior Cardado',
    category: 'Tops', subcategory: 'Malhas e Sweats', vertical: 'vestuario',
    tags: ['malhas', 'sweats'],
    price: 54.99, originalPrice: null,
    badge: 'Popular', badgeColor: 'bordo',
    rating: 4.7, reviews: 390, stock: 45,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-90 -5 L-70 25 L-50 15 L-50 65 L50 65 L50 15 L70 25 L90 -5 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Malhas e Sweats</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-90 -5 L-70 25 L-50 15 L-50 65 L50 65 L50 15 L70 25 L90 -5 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Malhas e Sweats</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Interior cardado suave, tecnologia anti-encolhimento e punhos canelados. O clássico do outono/inverno.',
    nameEn: 'Brushed Interior Sweatshirt',
    descriptionEn: 'Soft brushed interior, anti-shrink tech and ribbed cuffs. The autumn/winter classic.',
    categoryEn: 'Tops',
    subcategoryEn: 'Knits & Sweats',
    specsEn: [{ label: 'Material', value: '80% Cotton, 20% Polyester' }, { label: 'Cut', value: 'Regular fit' }, { label: 'Sizes', value: 'XS to XXL' }, { label: 'Colors', value: 'Grey, Black, Navy, Burgundy' }],
    specs: [{ label: 'Material', value: '80% Algodão, 20% Poliéster' }, { label: 'Corte', value: 'Regular fit' }, { label: 'Tamanhos', value: 'XS ao XXL' }, { label: 'Cores', value: 'Cinzento, Preto, Navy, Bordeaux' }],
  },
  {
    id: 5, sku: 'KN-005', name: 'Hoodie Algodão Pesado',
    category: 'Tops', subcategory: 'Malhas e Sweats', vertical: 'vestuario',
    tags: ['malhas', 'sweats'],
    price: 89, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.9, reviews: 320, stock: 28,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -25 L-90 5 L-70 30 L-50 20 L-50 70 L50 70 L50 20 L70 30 L90 5 L60 -25 C60 -50 -60 -50 -60 -25 Z%22/><path d=%22M-25 -20 L-15 30 L15 30 L25 -20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Malhas e Sweats</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -25 L-90 5 L-70 30 L-50 20 L-50 70 L50 70 L50 20 L70 30 L90 5 L60 -25 C60 -50 -60 -50 -60 -25 Z%22/><path d=%22M-25 -20 L-15 30 L15 30 L25 -20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Malhas e Sweats</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Algodão pesado 13oz com capuz e cordão. Bolso canguru reforçado. Streetwear premium para uso diário.',
    nameEn: 'Heavy Cotton Hoodie',
    descriptionEn: 'Heavy 13oz cotton with hood and drawstring. Reinforced kangaroo pocket. Premium daily streetwear.',
    categoryEn: 'Tops',
    subcategoryEn: 'Knits & Sweats',
    specsEn: [{ label: 'Material', value: '13oz Cotton' }, { label: 'Cut', value: 'Oversized relaxed' }, { label: 'Sizes', value: 'XS to XXL' }, { label: 'Colors', value: 'Black, Grey, Burgundy, Olive' }],
    specs: [{ label: 'Material', value: 'Algodão 13oz' }, { label: 'Corte', value: 'Oversized relaxed' }, { label: 'Tamanhos', value: 'XS ao XXL' }, { label: 'Cores', value: 'Preto, Cinzento, Bordeaux, Verde-oliva' }],
  },
  {
    id: 6, sku: 'KN-006', name: 'Casaco Impermeável Outdoor',
    category: 'Casacos', subcategory: 'Outerwear', vertical: 'vestuario',
    tags: ['outerwear'],
    price: 120, originalPrice: null,
    badge: 'Novo', badgeColor: 'gold',
    rating: 4.8, reviews: 280, stock: 20,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-85 0 L-70 25 L-55 15 L-55 65 L-10 65 L-10 -25 L10 -25 L10 65 L55 65 L55 15 L70 25 L85 0 L60 -30 Z%22/><path d=%22M-10 -25 L0 -15 L10 -25%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Outerwear</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-85 0 L-70 25 L-55 15 L-55 65 L-10 65 L-10 -25 L10 -25 L10 65 L55 65 L55 15 L70 25 L85 0 L60 -30 Z%22/><path d=%22M-10 -25 L0 -15 L10 -25%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Outerwear</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Membrana impermeável e respirável, corta-vento leve. Preparado para as intempéries sem sacrificar estilo.',
    nameEn: 'Waterproof Outdoor Jacket',
    descriptionEn: 'Waterproof breathable membrane, lightweight windbreaker. Weather-ready without sacrificing style.',
    categoryEn: 'Coats',
    subcategoryEn: 'Outerwear',
    specsEn: [{ label: 'Material', value: 'Technical polyester' }, { label: 'Waterproofing', value: '10,000mm' }, { label: 'Sizes', value: 'S to XXL' }, { label: 'Colors', value: 'Black, Navy, Military Green' }],
    specs: [{ label: 'Material', value: 'Poliéster técnico' }, { label: 'Impermeabilidade', value: '10.000mm' }, { label: 'Tamanhos', value: 'S ao XXL' }, { label: 'Cores', value: 'Preto, Navy, Verde militar' }],
  },
  {
    id: 7, sku: 'KN-007', name: 'Bomber Nylon Aviador',
    category: 'Casacos', subcategory: 'Outerwear', vertical: 'vestuario',
    tags: ['outerwear'],
    price: 159.9, originalPrice: null,
    badge: 'Últimas unidades', badgeColor: 'bordo',
    rating: 4.7, reviews: 95, stock: 8,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -25 L-85 -5 L-70 25 L-50 15 L-50 65 L50 65 L50 15 L70 25 L85 -5 L60 -25 L60 -35 L-60 -35 Z%22/><circle cx=%220%22 cy=%22-15%22 r=%224%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Outerwear</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -25 L-85 -5 L-70 25 L-50 15 L-50 65 L50 65 L50 15 L70 25 L85 -5 L60 -25 L60 -35 L-60 -35 Z%22/><circle cx=%220%22 cy=%22-15%22 r=%224%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Outerwear</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Nylon de aviação impermeável, reversível para laranja de emergência. Um ícone urbano atemporal.',
    nameEn: 'Aviator Nylon Bomber',
    descriptionEn: 'Waterproof aviation nylon, reversible to emergency orange. A timeless urban icon.',
    categoryEn: 'Coats',
    subcategoryEn: 'Outerwear',
    specsEn: [{ label: 'Material', value: 'Reinforced nylon' }, { label: 'Cut', value: 'Regular fit' }, { label: 'Sizes', value: 'XS to XL' }, { label: 'Colors', value: 'Black/Orange, Military Green' }],
    specs: [{ label: 'Material', value: 'Nylon reforçado' }, { label: 'Corte', value: 'Regular fit' }, { label: 'Tamanhos', value: 'XS ao XL' }, { label: 'Cores', value: 'Preto/Laranja, Verde militar' }],
  },
  {
    id: 8, sku: 'KN-008', name: 'Calças Cargo Multibolsos',
    category: 'Calças', subcategory: 'Bottoms', vertical: 'vestuario',
    tags: ['bottoms'],
    price: 99, originalPrice: null,
    badge: 'Popular', badgeColor: 'bordo',
    rating: 4.7, reviews: 310, stock: 25,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-35 -25 L-35 70 L-5 70 L-5 -25 Z M5 -25 L5 70 L35 70 L35 -25 Z%22/><path d=%22M-30 0 L-30 20 L-10 20 L-10 0 M10 0 L10 20 L30 20 L30 0%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Bottoms</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-35 -25 L-35 70 L-5 70 L-5 -25 Z M5 -25 L5 70 L35 70 L35 -25 Z%22/><path d=%22M-30 0 L-30 20 L-10 20 L-10 0 M10 0 L10 20 L30 20 L30 0%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Bottoms</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Tecido Ripstop resistente a rasgões, bolsos laterais expansíveis. Funcional e estiloso.',
    nameEn: 'Multi-pocket Cargo Trousers',
    descriptionEn: 'Tear-resistant Ripstop fabric, expandable side pockets. Functional and stylish.',
    categoryEn: 'Trousers',
    subcategoryEn: 'Bottoms',
    specsEn: [{ label: 'Material', value: 'Ripstop cotton' }, { label: 'Cut', value: 'Regular cargo' }, { label: 'Sizes', value: '30 to 40' }, { label: 'Colors', value: 'Black, Beige, Military Green, Grey' }],
    specs: [{ label: 'Material', value: 'Algodão Ripstop' }, { label: 'Corte', value: 'Regular cargo' }, { label: 'Tamanhos', value: '30 ao 40' }, { label: 'Cores', value: 'Preto, Bege, Verde militar, Cinzento' }],
  },
  {
    id: 9, sku: 'KN-009', name: 'Jeans Corte Direito',
    category: 'Calças', subcategory: 'Bottoms', vertical: 'vestuario',
    tags: ['bottoms'],
    price: 99.95, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.9, reviews: 550, stock: 42,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-35 -25 L-40 70 L-8 70 L-3 -25 Z M3 -25 L8 70 L40 70 L35 -25 Z M-35 -25 L35 -25%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Bottoms</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-35 -25 L-40 70 L-8 70 L-3 -25 Z M3 -25 L8 70 L40 70 L35 -25 Z M-35 -25 L35 -25%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Bottoms</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Corte direito em denim de algodão puro. O jeans intemporal que combina com tudo.',
    nameEn: 'Straight Cut Jeans',
    descriptionEn: 'Straight cut in pure cotton denim. The timeless jean that goes with anything.',
    categoryEn: 'Trousers',
    subcategoryEn: 'Bottoms',
    specsEn: [{ label: 'Material', value: '100% Cotton Denim' }, { label: 'Cut', value: 'Straight leg' }, { label: 'Sizes', value: '28 to 40' }, { label: 'Colors', value: 'Mid Blue, Dark Blue, Black' }],
    specs: [{ label: 'Material', value: '100% Denim Algodão' }, { label: 'Corte', value: 'Straight leg' }, { label: 'Tamanhos', value: '28 ao 40' }, { label: 'Cores', value: 'Azul médio, Azul escuro, Preto' }],
  },
  {
    id: 10, sku: 'KN-010', name: 'Vestido Midi Malha Canelada',
    category: 'Vestidos', subcategory: 'Vestidos e Saias', vertical: 'vestuario',
    tags: ['vestidos', 'saias'],
    price: 39.95, originalPrice: null,
    badge: 'Novo', badgeColor: 'gold',
    rating: 4.7, reviews: 260, stock: 30,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-25 -25 L-55 70 L55 70 L25 -25 Z%22/><path d=%22M-25 -25 L25 -25 M-10 -25 L-10 -35 L10 -35 L10 -25%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Vestidos e Saias</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-25 -25 L-55 70 L55 70 L25 -25 Z%22/><path d=%22M-25 -25 L25 -25 M-10 -25 L-10 -35 L10 -35 L10 -25%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Vestidos e Saias</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Malha canelada ajustável de algodão orgânico. Elegante, confortável e versátil.',
    nameEn: 'Ribbed Knit Midi Dress',
    descriptionEn: 'Adjustable ribbed knit in organic cotton. Elegant, comfortable and versatile.',
    categoryEn: 'Dresses',
    subcategoryEn: 'Dresses & Skirts',
    specsEn: [{ label: 'Material', value: 'Ribbed Organic Cotton' }, { label: 'Length', value: 'Midi' }, { label: 'Sizes', value: 'XS to XL' }, { label: 'Colors', value: 'Black, Beige, Old Rose, Olive' }],
    specs: [{ label: 'Material', value: 'Algodão Orgânico Canelado' }, { label: 'Comprimento', value: 'Midi' }, { label: 'Tamanhos', value: 'XS ao XL' }, { label: 'Cores', value: 'Preto, Bege, Rosa antigo, Verde-oliva' }],
  },
  {
    id: 11, sku: 'KN-011', name: 'Saia Plissada Cetim',
    category: 'Saias', subcategory: 'Vestidos e Saias', vertical: 'vestuario',
    tags: ['vestidos', 'saias'],
    price: 35.99, originalPrice: null,
    badge: null, badgeColor: 'gold',
    rating: 4.6, reviews: 180, stock: 25,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-30 -15 L-60 70 L60 70 L30 -15 Z%22/><path d=%22M-30 -15 L30 -15%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Vestidos e Saias</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-30 -15 L-60 70 L60 70 L30 -15 Z%22/><path d=%22M-30 -15 L30 -15%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Vestidos e Saias</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Acabamento acetinado fluido com cintura elástica confortável. Movimento e elegância em cada passo.',
    nameEn: 'Satin Pleated Skirt',
    descriptionEn: 'Fluid satin finish with comfortable elastic waist. Movement and elegance in every step.',
    categoryEn: 'Skirts',
    subcategoryEn: 'Dresses & Skirts',
    specsEn: [{ label: 'Material', value: 'Polyester Satin' }, { label: 'Length', value: 'Midi' }, { label: 'Sizes', value: 'XS to XL' }, { label: 'Colors', value: 'Champagne, Black, Emerald Green, Pink' }],
    specs: [{ label: 'Material', value: 'Cetim Poliéster' }, { label: 'Comprimento', value: 'Midi' }, { label: 'Tamanhos', value: 'XS ao XL' }, { label: 'Cores', value: 'Champagne, Preto, Verde esmeralda, Rosa' }],
  },
  {
    id: 12, sku: 'KN-012', name: 'Fato de Treino Técnico',
    category: 'Desporto', subcategory: 'Athleisure', vertical: 'vestuario',
    tags: ['athleisure'],
    price: 69.99, originalPrice: null,
    badge: 'Popular', badgeColor: 'bordo',
    rating: 4.7, reviews: 420, stock: 35,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-45 -20 L-60 20 L-45 30 L-40 70 L-10 70 L-10 10 L10 10 L10 70 L40 70 L45 30 L60 20 L45 -20 L20 -20 L0 -5 L-20 -20 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Athleisure</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-45 -20 L-60 20 L-45 30 L-40 70 L-10 70 L-10 10 L10 10 L10 70 L40 70 L45 30 L60 20 L45 -20 L20 -20 L0 -5 L-20 -20 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Athleisure</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Tecido de secagem rápida com painéis em rede respiráveis. Do ginásio ao lazer.',
    nameEn: 'Technical Tracksuit',
    descriptionEn: 'Quick-dry fabric with breathable mesh panels. From gym to leisure.',
    categoryEn: 'Sport',
    subcategoryEn: 'Athleisure',
    specsEn: [{ label: 'Material', value: 'Technical polyester' }, { label: 'Includes', value: 'Jacket + Trousers' }, { label: 'Sizes', value: 'XS to XXL' }, { label: 'Colors', value: 'Black, Grey, Navy, Burgundy' }],
    specs: [{ label: 'Material', value: 'Poliéster técnico' }, { label: 'Inclui', value: 'Casaco + Calças' }, { label: 'Tamanhos', value: 'XS ao XXL' }, { label: 'Cores', value: 'Preto, Cinzento, Navy, Bordeaux' }],
  },
  {
    id: 13, sku: 'KN-013', name: 'Leggings Cintura Alta',
    category: 'Desporto', subcategory: 'Athleisure', vertical: 'vestuario',
    tags: ['athleisure'],
    price: 45, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.8, reviews: 490, stock: 48,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-28 -20 L-32 70 L-8 70 L-4 -20 Z M4 -20 L8 70 L32 70 L28 -20 Z%22/><path d=%22M-30 -20 L30 -20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Athleisure</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-28 -20 L-32 70 L-8 70 L-4 -20 Z M4 -20 L8 70 L32 70 L28 -20 Z%22/><path d=%22M-30 -20 L30 -20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Athleisure</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Cintura alta de suporte, tecido sem costuras anti-transparência. Conforto e performance.',
    nameEn: 'High-waist Leggings',
    descriptionEn: 'High-support waist, seamless anti-see-through fabric. Comfort and performance.',
    categoryEn: 'Sport',
    subcategoryEn: 'Athleisure',
    specsEn: [{ label: 'Material', value: '75% Nylon, 25% Spandex' }, { label: 'Cintura', value: 'High seamless' }, { label: 'Sizes', value: 'XS to XL' }, { label: 'Colors', value: 'Black, Beige, Olive, Burgundy' }],
    specs: [{ label: 'Material', value: '75% Nylon, 25% Elastano' }, { label: 'Cintura', value: 'Alta seamless' }, { label: 'Tamanhos', value: 'XS ao XL' }, { label: 'Cores', value: 'Preto, Bege, Verde-oliva, Bordeaux' }],
  },
  {
    id: 14, sku: 'KN-014', name: 'Ténis Clássicos Couro Branco',
    category: 'Calçado', subcategory: 'Calçado', vertical: 'vestuario',
    tags: ['calçado'],
    price: 119.99, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.9, reviews: 850, stock: 55,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 20 L-70 45 L60 45 L70 25 L60 5 L20 5 L-5 -15 L-40 0 L-55 15 Z%22/><path d=%22M-40 0 L-30 20 M-15 -5 L-5 20 M15 5 L20 20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Calçado</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 20 L-70 45 L60 45 L70 25 L60 5 L20 5 L-5 -15 L-40 0 L-55 15 Z%22/><path d=%22M-40 0 L-30 20 M-15 -5 L-5 20 M15 5 L20 20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Calçado</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Couro genuíno com amortecimento premium. O sneaker atemporal que combina com tudo.',
    nameEn: 'Classic White Leather Sneakers',
    descriptionEn: 'Genuine leather with premium cushioning. The timeless sneaker that goes with anything.',
    categoryEn: 'Footwear',
    subcategoryEn: 'Footwear',
    specsEn: [{ label: 'Material', value: 'Genuine bovine leather' }, { label: 'Sole', value: 'Rubber' }, { label: 'Sizes', value: '36 to 46' }, { label: 'Colors', value: 'White, White/Black, Black' }],
    specs: [{ label: 'Material', value: 'Couro genuíno bovino' }, { label: 'Sola', value: 'Borracha' }, { label: 'Tamanhos', value: '36 ao 46' }, { label: 'Cores', value: 'Branco, Branco/Preto, Preto' }],
  },
  {
    id: 15, sku: 'KN-015', name: 'Ténis Pele T-Toe',
    category: 'Calçado', subcategory: 'Calçado', vertical: 'vestuario',
    tags: ['calçado'],
    price: 120, originalPrice: null,
    badge: 'Popular', badgeColor: 'bordo',
    rating: 4.8, reviews: 720, stock: 48,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 20 L-70 45 L60 45 L70 25 L60 5 L20 5 L-5 -15 L-40 0 L-55 15 Z%22/><path d=%22M-40 0 L-30 20 M-15 -5 L-5 20 M15 5 L20 20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Calçado</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 20 L-70 45 L60 45 L70 25 L60 5 L20 5 L-5 -15 L-40 0 L-55 15 Z%22/><path d=%22M-40 0 L-30 20 M-15 -5 L-5 20 M15 5 L20 20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Calçado</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Topo em pele com proteção em camurça T-toe, sola em borracha natural. Estilo retro contemporâneo.',
    nameEn: 'Suede T-Toe Sneakers',
    descriptionEn: 'Leather upper with T-toe suede protection, natural rubber sole. Contemporary retro style.',
    categoryEn: 'Footwear',
    subcategoryEn: 'Footwear',
    specsEn: [{ label: 'Material', value: 'Leather + Suede' }, { label: 'Sole', value: 'Natural rubber' }, { label: 'Sizes', value: '36 to 46' }, { label: 'Colors', value: 'White/Black, Black, Beige' }],
    specs: [{ label: 'Material', value: 'Pele + Camurça' }, { label: 'Sola', value: 'Borracha natural' }, { label: 'Tamanhos', value: '36 ao 46' }, { label: 'Cores', value: 'Branco/Preto, Preto, Bege' }],
  },
  {
    id: 16, sku: 'KN-016', name: 'Boné Estruturado 6 Painéis',
    category: 'Acessórios', subcategory: 'Acessórios', vertical: 'vestuario',
    tags: ['acessórios'],
    price: 25.99, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.7, reviews: 610, stock: 60,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-45 15 L45 15 L45 -5 C45 -30 -45 -30 -45 -5 Z M-45 15 L60 20 L60 30 L-45 30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Acessórios</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-45 15 L45 15 L45 -5 C45 -30 -45 -30 -45 -5 Z M-45 15 L60 20 L60 30 L-45 30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Acessórios</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Sarja de algodão ajustável, estrutura moldada e logótipo 3D. O acessório essencial.',
    nameEn: '6-Panel Structured Cap',
    descriptionEn: 'Adjustable cotton twill, molded structure and 3D logo. The essential accessory.',
    categoryEn: 'Accessories',
    subcategoryEn: 'Accessories',
    specsEn: [{ label: 'Material', value: 'Cotton twill' }, { label: 'Fit', value: 'Rear snapback' }, { label: 'Size', value: 'Adjustable (56-60cm)' }, { label: 'Colors', value: 'Black, Navy, Beige, Burgundy' }],
    specs: [{ label: 'Material', value: 'Sarja Algodão' }, { label: 'Ajuste', value: 'Snapback traseiro' }, { label: 'Tamanho', value: 'Ajustável (56-60cm)' }, { label: 'Cores', value: 'Preto, Navy, Bege, Bordeaux' }],
  },
  {
    id: 17, sku: 'KN-017', name: 'Carteira Slim Couro RFID',
    category: 'Acessórios', subcategory: 'Acessórios', vertical: 'vestuario',
    tags: ['acessórios'],
    price: 59.95, originalPrice: null,
    badge: null, badgeColor: 'gold',
    rating: 4.7, reviews: 230, stock: 35,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-50%22 y=%22-20%22 width=%22100%22 height=%2255%22 rx=%224%22/><path d=%22M-50 -5 L50 -5%22/><circle cx=%2230%22 cy=%2215%22 r=%224%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Acessórios</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-50%22 y=%22-20%22 width=%22100%22 height=%2255%22 rx=%224%22/><path d=%22M-50 -5 L50 -5%22/><circle cx=%2230%22 cy=%2215%22 r=%224%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Acessórios</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Alumínio protetor de cartões e couro europeu com sistema de extração rápida. Proteção RFID incluída.',
    nameEn: 'RFID Slim Leather Wallet',
    descriptionEn: 'Card-protecting aluminum and European leather with quick extraction system. RFID protection included.',
    categoryEn: 'Accessories',
    subcategoryEn: 'Accessories',
    specsEn: [{ label: 'Material', value: 'Leather + Aluminum' }, { label: 'Capacity', value: '6 cards + notes' }, { label: 'Protection', value: 'RFID-blocking' }, { label: 'Colors', value: 'Black, Brown, Cognac, Olive' }],
    specs: [{ label: 'Material', value: 'Couro + Alumínio' }, { label: 'Capacidade', value: '6 cartões + notas' }, { label: 'Proteção', value: 'Anti-RFID' }, { label: 'Cores', value: 'Preto, Castanho, Cognac, Verde-oliva' }],
  },
  {
    id: 18, sku: 'KN-018', name: 'Mochila Clássica 16L Impermeável',
    category: 'Acessórios', subcategory: 'Acessórios', vertical: 'vestuario',
    tags: ['acessórios'],
    price: 89.95, originalPrice: null,
    badge: 'Popular', badgeColor: 'bordo',
    rating: 4.8, reviews: 380, stock: 40,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-45 -10 L-45 60 L45 60 L45 -10 Z M-25 -10 C-25 -35 25 -35 25 -10%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Acessórios</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-45 -10 L-45 60 L45 60 L45 -10 Z M-25 -10 C-25 -35 25 -35 25 -10%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Acessórios</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Tecido impermeável leve e durável com emblema refletor. A mochila que dura anos.',
    nameEn: 'Classic 16L Waterproof Backpack',
    descriptionEn: 'Lightweight durable waterproof fabric with reflective badge. The backpack that lasts.',
    categoryEn: 'Accessories',
    subcategoryEn: 'Accessories',
    specsEn: [{ label: 'Material', value: 'Waterproof technical fabric' }, { label: 'Capacity', value: '16 Liters' }, { label: 'Weight', value: '300g' }, { label: 'Colors', value: 'Black, Navy, Olive, Burgundy, Beige' }],
    specs: [{ label: 'Material', value: 'Tecido técnico impermeável' }, { label: 'Capacidade', value: '16 Litros' }, { label: 'Peso', value: '300g' }, { label: 'Cores', value: 'Preto, Navy, Verde-oliva, Bordeaux, Bege' }],
  },
  {
    id: 19, sku: 'KN-019', name: 'Portátil Ultrafino 13" M-Series',
    category: 'Computadores', subcategory: 'Computadores', vertical: 'it',
    tags: ['computadores'],
    price: 1299, originalPrice: null,
    badge: 'Premium', badgeColor: 'gold',
    rating: 4.9, reviews: 140, stock: 15,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-60%22 y=%22-30%22 width=%22120%22 height=%2275%22 rx=%224%22/><path d=%22M-75 50 L75 50 L70 55 L-70 55 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Computadores</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-60%22 y=%22-30%22 width=%22120%22 height=%2275%22 rx=%224%22/><path d=%22M-75 50 L75 50 L70 55 L-70 55 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Computadores</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Processador de nova geração 8-core CPU / 10-core GPU. Ecrã Liquid Retina 13.6", 16GB RAM, 512GB SSD.',
    nameEn: 'Ultrathin 13" M-Series Laptop',
    descriptionEn: 'Next-gen 8-core CPU / 10-core GPU processor. 13.6" Liquid Retina display, 16GB RAM, 512GB SSD.',
    categoryEn: 'Computers',
    subcategoryEn: 'Computers',
    specsEn: [{ label: 'CPU', value: '8-core M-Series' }, { label: 'RAM', value: '16GB unified' }, { label: 'Storage', value: '512GB SSD' }, { label: 'Display', value: '13.6" Liquid Retina' }, { label: 'Battery life', value: 'Up to 18h' }],
    specs: [{ label: 'CPU', value: '8-core M-Series' }, { label: 'RAM', value: '16GB unificada' }, { label: 'Armazenamento', value: '512GB SSD' }, { label: 'Ecrã', value: '13.6" Liquid Retina' }, { label: 'Autonomia', value: 'Até 18h' }],
  },
  {
    id: 20, sku: 'KN-020', name: 'Mini PC Core i7 Compacto',
    category: 'Computadores', subcategory: 'Computadores', vertical: 'it',
    tags: ['computadores'],
    price: 589, originalPrice: null,
    badge: null, badgeColor: 'gold',
    rating: 4.6, reviews: 85, stock: 12,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-45%22 y=%22-30%22 width=%2290%22 height=%2260%22 rx=%223%22/><circle cx=%220%22 cy=%220%22 r=%223%22/><path d=%22M-30 -20 L-15 -20 M-30 -10 L-15 -10%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Computadores</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-45%22 y=%22-30%22 width=%2290%22 height=%2260%22 rx=%223%22/><circle cx=%220%22 cy=%220%22 r=%223%22/><path d=%22M-30 -20 L-15 -20 M-30 -10 L-15 -10%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Computadores</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Processador Intel Core i7, suporte até 4 ecrãs 4K, WiFi 6E. Poder de secretária num formato compacto.',
    nameEn: 'Compact Core i7 Mini PC',
    descriptionEn: 'Intel Core i7 processor, supports up to 4× 4K displays, WiFi 6E. Desktop power in a compact form.',
    categoryEn: 'Computers',
    subcategoryEn: 'Computers',
    specsEn: [{ label: 'CPU', value: 'Intel Core i7 (13th gen)' }, { label: 'RAM', value: '16GB DDR4' }, { label: 'Storage', value: '512GB NVMe' }, { label: 'Network', value: 'WiFi 6E + BT 5.3' }, { label: 'Outputs', value: '4× 4K display' }],
    specs: [{ label: 'CPU', value: 'Intel Core i7 (13ª gen)' }, { label: 'RAM', value: '16GB DDR4' }, { label: 'Armazenamento', value: '512GB NVMe' }, { label: 'Rede', value: 'WiFi 6E + BT 5.3' }, { label: 'Saídas', value: '4× ecrã 4K' }],
  },
  {
    id: 21, sku: 'KN-021', name: 'Teclado Mecânico Sem Fios',
    category: 'Periféricos', subcategory: 'Periféricos', vertical: 'it',
    tags: ['periféricos'],
    price: 119, originalPrice: null,
    badge: 'Premium', badgeColor: 'gold',
    rating: 4.8, reviews: 340, stock: 28,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-70%22 y=%22-15%22 width=%22140%22 height=%2240%22 rx=%224%22/><path d=%22M-60 -5 L-40 -5 M-30 -5 L-10 -5 M0 -5 L20 -5 M30 -5 L50 -5 M-60 15 L60 15%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Periféricos</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-70%22 y=%22-15%22 width=%22140%22 height=%2240%22 rx=%224%22/><path d=%22M-60 -5 L-40 -5 M-30 -5 L-10 -5 M0 -5 L20 -5 M30 -5 L50 -5 M-60 15 L60 15%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Periféricos</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Teclas côncavas retroiluminadas, digitação fluida e silenciosa. Multi-dispositivo com Bluetooth.',
    nameEn: 'Wireless Mechanical Keyboard',
    descriptionEn: 'Backlit concave keys, fluid quiet typing. Multi-device with Bluetooth.',
    categoryEn: 'Peripherals',
    subcategoryEn: 'Peripherals',
    specsEn: [{ label: 'Connection', value: 'BT / USB-C / 2.4GHz' }, { label: 'Backlight', value: 'Yes, adjustable' }, { label: 'Devices', value: 'Up to 3 simultaneous' }, { label: 'Battery life', value: 'Up to 10 days' }],
    specs: [{ label: 'Ligação', value: 'BT / USB-C / 2.4GHz' }, { label: 'Retroiluminação', value: 'Sim, ajustável' }, { label: 'Dispositivos', value: 'Até 3 simultâneos' }, { label: 'Autonomia', value: 'Até 10 dias' }],
  },
  {
    id: 22, sku: 'KN-022', name: 'Rato Sem Fios Ergonómico 8K DPI',
    category: 'Periféricos', subcategory: 'Periféricos', vertical: 'it',
    tags: ['periféricos'],
    price: 109, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.9, reviews: 410, stock: 32,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-25 -30 C-45 -30 -45 40 -25 40 L25 40 C45 40 45 -30 25 -30 Z%22/><path d=%22M0 -30 L0 5%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Periféricos</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-25 -30 C-45 -30 -45 40 -25 40 L25 40 C45 40 45 -30 25 -30 Z%22/><path d=%22M0 -30 L0 5%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Periféricos</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Sensor 8K DPI silencioso, roda de aço, formato ergonómico para produtividade prolongada.',
    nameEn: '8K DPI Ergonomic Wireless Mouse',
    descriptionEn: 'Quiet 8K DPI sensor, steel wheel, ergonomic form for extended productivity.',
    categoryEn: 'Peripherals',
    subcategoryEn: 'Peripherals',
    specsEn: [{ label: 'Sensor', value: '8000 DPI' }, { label: 'Buttons', value: '7 programmable' }, { label: 'Connection', value: 'BT / USB / 2.4GHz' }, { label: 'Battery life', value: 'Up to 70 days' }],
    specs: [{ label: 'Sensor', value: '8000 DPI' }, { label: 'Botões', value: '7 programáveis' }, { label: 'Ligação', value: 'BT / USB / 2.4GHz' }, { label: 'Autonomia', value: 'Até 70 dias' }],
  },
  {
    id: 23, sku: 'KN-023', name: 'Tapete Rato XXL Antiderrapante',
    category: 'Periféricos', subcategory: 'Periféricos', vertical: 'it',
    tags: ['periféricos'],
    price: 29.99, originalPrice: null,
    badge: null, badgeColor: 'gold',
    rating: 4.7, reviews: 290, stock: 40,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-70%22 y=%22-30%22 width=%22140%22 height=%2260%22 rx=%226%22/><path d=%22M-55 -15 L55 -15 M-55 0 L55 0 M-55 15 L55 15%22 opacity=%22.4%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Periféricos</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-70%22 y=%22-30%22 width=%22140%22 height=%2260%22 rx=%226%22/><path d=%22M-55 -15 L55 -15 M-55 0 L55 0 M-55 15 L55 15%22 opacity=%22.4%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Periféricos</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Base em borracha antiderrapante de 4mm, tecido micro-tecido de alta densidade. Superfície gaming/office.',
    nameEn: 'XXL Non-slip Mousepad',
    descriptionEn: '4mm non-slip rubber base, high-density micro-textile surface. Gaming/office grade.',
    categoryEn: 'Peripherals',
    subcategoryEn: 'Peripherals',
    specsEn: [{ label: 'Dimensions', value: '90×40cm' }, { label: 'Thickness', value: '4mm' }, { label: 'Surface', value: 'Micro-textile' }, { label: 'Colors', value: 'Solid Black, Black/Burgundy, Custom' }],
    specs: [{ label: 'Dimensões', value: '90×40cm' }, { label: 'Espessura', value: '4mm' }, { label: 'Superfície', value: 'Micro-tecido' }, { label: 'Cores', value: 'Preto liso, Preto/Bordeaux, Custom' }],
  },
  {
    id: 24, sku: 'KN-024', name: 'Auscultadores Wireless ANC',
    category: 'Áudio', subcategory: 'Áudio e Imagem', vertical: 'it',
    tags: ['áudio', 'imagem'],
    price: 329, originalPrice: null,
    badge: 'Premium', badgeColor: 'gold',
    rating: 4.9, reviews: 210, stock: 20,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-50 5 C-50 -50 50 -50 50 5%22/><rect x=%22-58%22 y=%220%22 width=%2218%22 height=%2240%22 rx=%226%22/><rect x=%2240%22 y=%220%22 width=%2218%22 height=%2240%22 rx=%226%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Áudio e Imagem</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-50 5 C-50 -50 50 -50 50 5%22/><rect x=%22-58%22 y=%220%22 width=%2218%22 height=%2240%22 rx=%226%22/><rect x=%2240%22 y=%220%22 width=%2218%22 height=%2240%22 rx=%226%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Áudio e Imagem</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Cancelamento de Ruído líder de mercado, som Hi-Res e 30h de bateria. Silêncio, ao teu comando.',
    nameEn: 'ANC Wireless Headphones',
    descriptionEn: 'Market-leading noise cancellation, Hi-Res audio and 30h battery. Silence, on command.',
    categoryEn: 'Audio',
    subcategoryEn: 'Audio & Video',
    specsEn: [{ label: 'ANC', value: 'Adaptive, market leader' }, { label: 'Audio', value: 'Hi-Res LDAC' }, { label: 'Battery life', value: '30h with ANC' }, { label: 'Fast charge', value: '3min = 3h' }],
    specs: [{ label: 'ANC', value: 'Adaptativo, líder mercado' }, { label: 'Áudio', value: 'Hi-Res LDAC' }, { label: 'Autonomia', value: '30h com ANC' }, { label: 'Carga rápida', value: '3min = 3h' }],
  },
  {
    id: 25, sku: 'KN-025', name: 'Webcam HD 1080p com Correção Luz',
    category: 'Imagem', subcategory: 'Áudio e Imagem', vertical: 'it',
    tags: ['áudio', 'imagem'],
    price: 74.99, originalPrice: null,
    badge: 'Popular', badgeColor: 'bordo',
    rating: 4.7, reviews: 360, stock: 35,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><circle cx=%220%22 cy=%220%22 r=%2230%22/><circle cx=%220%22 cy=%220%22 r=%2215%22/><circle cx=%220%22 cy=%220%22 r=%225%22 fill=%22currentColor%22/><path d=%22M-40 -30 L-50 -40 M40 -30 L50 -40%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Áudio e Imagem</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><circle cx=%220%22 cy=%220%22 r=%2230%22/><circle cx=%220%22 cy=%220%22 r=%2215%22/><circle cx=%220%22 cy=%220%22 r=%225%22 fill=%22currentColor%22/><path d=%22M-40 -30 L-50 -40 M40 -30 L50 -40%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Áudio e Imagem</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Vídeo Full HD 1080p a 30fps, microfones estéreo duplos, correção automática de luz.',
    nameEn: '1080p HD Webcam with Light Correction',
    descriptionEn: 'Full HD 1080p video at 30fps, dual stereo microphones, automatic light correction.',
    categoryEn: 'Video',
    subcategoryEn: 'Audio & Video',
    specsEn: [{ label: 'Resolution', value: '1080p @ 30fps' }, { label: 'Focus', value: 'Autofocus' }, { label: 'Audio', value: 'Dual stereo' }, { label: 'Compatibility', value: 'Windows / macOS / Linux' }],
    specs: [{ label: 'Resolução', value: '1080p @ 30fps' }, { label: 'Foco', value: 'Autofoco' }, { label: 'Áudio', value: 'Estéreo duplo' }, { label: 'Compatibilidade', value: 'Windows / macOS / Linux' }],
  },
  {
    id: 26, sku: 'KN-026', name: 'Power Bank 24.000mAh 140W',
    category: 'Energia', subcategory: 'Energia e Conectividade', vertical: 'it',
    tags: ['energia', 'conectividade'],
    price: 129.99, originalPrice: null,
    badge: 'Premium', badgeColor: 'gold',
    rating: 4.8, reviews: 250, stock: 25,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-30%22 y=%22-45%22 width=%2260%22 height=%2290%22 rx=%226%22/><path d=%22M-15 -25 L-15 -15 L-5 -15 L-15 5 L-15 -5 L-25 -5 Z%22 fill=%22currentColor%22/><rect x=%22-15%22 y=%2230%22 width=%2230%22 height=%226%22 rx=%221%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Energia e Conectividade</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-30%22 y=%22-45%22 width=%2260%22 height=%2290%22 rx=%226%22/><path d=%22M-15 -25 L-15 -15 L-5 -15 L-15 5 L-15 -5 L-25 -5 Z%22 fill=%22currentColor%22/><rect x=%22-15%22 y=%2230%22 width=%2230%22 height=%226%22 rx=%221%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Energia e Conectividade</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Carregamento bidirecional ultra-rápido Power Delivery 3.1, ecrã digital Smart. Alimenta um portátil.',
    nameEn: '24,000mAh 140W Power Bank',
    descriptionEn: 'Ultra-fast bidirectional Power Delivery 3.1 charging, Smart digital display. Powers a laptop.',
    categoryEn: 'Power',
    subcategoryEn: 'Power & Connectivity',
    specsEn: [{ label: 'Capacity', value: '24,000mAh' }, { label: 'Power', value: '140W in/out' }, { label: 'Ports', value: '2× USB-C + 1× USB-A' }, { label: 'Display', value: 'Digital LCD' }],
    specs: [{ label: 'Capacidade', value: '24.000mAh' }, { label: 'Potência', value: '140W in/out' }, { label: 'Portas', value: '2× USB-C + 1× USB-A' }, { label: 'Ecrã', value: 'Digital LCD' }],
  },
  {
    id: 27, sku: 'KN-027', name: 'Carregador GaN 65W 3 Portas',
    category: 'Energia', subcategory: 'Energia e Conectividade', vertical: 'it',
    tags: ['energia', 'conectividade'],
    price: 49.99, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.8, reviews: 430, stock: 45,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-30%22 y=%22-30%22 width=%2260%22 height=%2255%22 rx=%226%22/><path d=%22M-10 25 L-10 40 M10 25 L10 40%22/><path d=%22M-15 -15 L-15 -5 L-5 -5 L-15 15 L-15 5 L-25 5 Z%22 fill=%22currentColor%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Energia e Conectividade</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-30%22 y=%22-30%22 width=%2260%22 height=%2255%22 rx=%226%22/><path d=%22M-10 25 L-10 40 M10 25 L10 40%22/><path d=%22M-15 -15 L-15 -5 L-5 -5 L-15 15 L-15 5 L-25 5 Z%22 fill=%22currentColor%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Energia e Conectividade</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Tecnologia GaN compacta para carregar portátil, tablet e smartphone em simultâneo.',
    nameEn: '65W GaN 3-Port Charger',
    descriptionEn: 'Compact GaN tech to charge laptop, tablet and smartphone simultaneously.',
    categoryEn: 'Power',
    subcategoryEn: 'Power & Connectivity',
    specsEn: [{ label: 'Total power', value: '65W' }, { label: 'Ports', value: '2× USB-C + 1× USB-A' }, { label: 'Technology', value: 'GaNPrime' }, { label: 'Compatibility', value: 'PD 3.0 / QC 4+' }],
    specs: [{ label: 'Potência total', value: '65W' }, { label: 'Portas', value: '2× USB-C + 1× USB-A' }, { label: 'Tecnologia', value: 'GaNPrime' }, { label: 'Compatibilidade', value: 'PD 3.0 / QC 4+' }],
  },
  {
    id: 28, sku: 'KN-028', name: 'Capa Transparente MagSafe iPhone',
    category: 'Capas', subcategory: 'Energia e Conectividade', vertical: 'it',
    tags: ['energia', 'conectividade'],
    price: 26.99, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.8, reviews: 680, stock: 60,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-30%22 y=%22-50%22 width=%2260%22 height=%22100%22 rx=%2210%22/><rect x=%22-15%22 y=%22-38%22 width=%2230%22 height=%226%22 rx=%222%22 opacity=%22.5%22/><rect x=%2210%22 y=%22-30%22 width=%2215%22 height=%2215%22 rx=%222%22 opacity=%22.6%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Energia e Conectividade</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-30%22 y=%22-50%22 width=%2260%22 height=%22100%22 rx=%2210%22/><rect x=%22-15%22 y=%22-38%22 width=%2230%22 height=%226%22 rx=%222%22 opacity=%22.5%22/><rect x=%2210%22 y=%22-30%22 width=%2215%22 height=%2215%22 rx=%222%22 opacity=%22.6%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Energia e Conectividade</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Traseira transparente rígida com para-choques em TPU e ímanes MagSafe fortes. Personalizável com o teu design.',
    nameEn: 'Clear iPhone MagSafe Case',
    descriptionEn: 'Rigid clear back with TPU bumpers and strong MagSafe magnets. Customizable with your design.',
    categoryEn: 'Cases',
    subcategoryEn: 'Power & Connectivity',
    specsEn: [{ label: 'Compatibility', value: 'iPhone 13/14/15/16 (all)' }, { label: 'MagSafe', value: '100% Compatible' }, { label: 'Material', value: 'PC + TPU' }, { label: 'Customizable', value: 'Printed design' }],
    specs: [{ label: 'Compatibilidade', value: 'iPhone 13/14/15/16 (todos)' }, { label: 'MagSafe', value: 'Compatível 100%' }, { label: 'Material', value: 'PC + TPU' }, { label: 'Personalizável', value: 'Design impresso' }],
  },
  {
    id: 29, sku: 'KN-029', name: 'Suporte Auto MagSafe Rotativo',
    category: 'Acessórios IT', subcategory: 'Energia e Conectividade', vertical: 'it',
    tags: ['energia', 'conectividade'],
    price: 19.99, originalPrice: null,
    badge: 'Popular', badgeColor: 'bordo',
    rating: 4.7, reviews: 520, stock: 50,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-35%22 y=%22-30%22 width=%2270%22 height=%2255%22 rx=%228%22/><path d=%22M0 25 L0 45 L-15 55 M0 45 L15 55%22/><circle cx=%220%22 cy=%220%22 r=%228%22 opacity=%22.6%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Energia e Conectividade</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%238B1E2D%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%238B1E2D%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%238B1E2D%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-35%22 y=%22-30%22 width=%2270%22 height=%2255%22 rx=%228%22/><path d=%22M0 25 L0 45 L-15 55 M0 45 L15 55%22/><circle cx=%220%22 cy=%220%22 r=%228%22 opacity=%22.6%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%238B1E2D%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Energia e Conectividade</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Fixação magnética ultra-forte para grelha de ventilação com rotação 360°. Instalação em segundos.',
    nameEn: 'Rotating MagSafe Car Mount',
    descriptionEn: 'Ultra-strong magnetic mount for air vent with 360° rotation. Installs in seconds.',
    categoryEn: 'IT Accessories',
    subcategoryEn: 'Power & Connectivity',
    specsEn: [{ label: 'Mount', value: 'Air vent' }, { label: 'Rotation', value: '360° free' }, { label: 'MagSafe', value: 'Compatible' }, { label: 'Max weight', value: '500g' }],
    specs: [{ label: 'Fixação', value: 'Grelha de ventilação' }, { label: 'Rotação', value: '360° livre' }, { label: 'MagSafe', value: 'Compatível' }, { label: 'Peso máximo', value: '500g' }],
  }
]

const CATEGORIES_LIST = ['Todos', 'Tops', 'Camisas', 'Calças', 'Vestidos', 'Saias', 'Casacos', 'Calçado', 'Desporto', 'Acessórios', 'Computadores', 'Periféricos', 'Áudio', 'Imagem', 'Energia', 'Capas', 'Acessórios IT']





// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })
}

function Stars({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <span className="kn-stars">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 12 12" fill={i <= Math.round(rating) ? 'var(--gold)' : 'var(--bg-3)'}>
          <path d="M6 1l1.3 3h3.2l-2.6 1.9.9 3.1L6 7.3l-2.8 1.7.9-3.1L1.5 4H4.7z" />
        </svg>
      ))}
    </span>
  )
}

function Eyebrow({ text }: { text: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
      <span style={{ width: 28, height: 1, background: 'linear-gradient(90deg,transparent,var(--gold))', flexShrink: 0 }} />
      {text}
    </div>
  )
}

function SectionHead({ eyebrow, title, lead, cta }: { eyebrow: string; title: string; lead?: string; cta?: ReactNode }) {
  return (
    <div className="kn-section-head">
      <div>
        <Eyebrow text={eyebrow} />
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(30px,3.5vw,52px)', fontWeight: 500, margin: '16px 0 0', lineHeight: 1.08 }} dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      {(lead || cta) && (
        <div style={{ paddingBottom: 6 }}>
          {lead && <p style={{ color: 'var(--fg-dim)', fontSize: 'clamp(15px,1.1vw,17px)', maxWidth: '46ch', lineHeight: 1.65 }}>{lead}</p>}
          {cta && <div style={{ marginTop: 28 }}>{cta}</div>}
        </div>
      )}
    </div>
  )
}

function GhostBtn({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 22px', background: 'transparent', border: `1px solid ${hov ? 'var(--gold)' : 'var(--gold-3)'}`, color: hov ? 'var(--fg)' : 'var(--gold-2)', fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 500, transition: 'all .2s ease' }}>
      {children}
      <svg width="12" height="8" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h12M9 1l4 4-4 4" /></svg>
    </button>
  )
}

function PrimaryBtn({ children, onClick, full, disabled }: { children: ReactNode; onClick?: () => void; full?: boolean; disabled?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={disabled ? undefined : onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 28px', background: disabled ? 'var(--border)' : hov ? 'var(--bordo-2)' : 'var(--bordo)', border: 'none', color: disabled ? 'var(--fg-mute)' : '#F5F2ED', fontFamily: 'var(--f-sans)', fontSize: 12, letterSpacing: '.24em', textTransform: 'uppercase', fontWeight: 500, transition: 'background .2s ease', width: full ? '100%' : 'auto', cursor: disabled ? 'not-allowed' : 'pointer' }}>
      {children}
      {!disabled && <svg width="13" height="9" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h12M9 1l4 4-4 4" /></svg>}
    </button>
  )
}

// ─── ProductCard ─────────────────────────────────────────────────────────────

function ProductCard({ p, onAdd, onOpen, wishlist, toggleWish }: {
  p: Product
  onAdd: (p: Product) => void
  onOpen: (p: Product) => void
  wishlist: Set<number>
  toggleWish: (id: number) => void
}) {
  const { t } = useLang()
  const pi = useProductI18n()
  const [hov, setHov] = useState(false)
  const disc = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'var(--bg-1)', border: `1px solid ${hov ? 'var(--gold-3)' : 'var(--border)'}`, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', transition: 'border-color .3s, transform .3s, box-shadow .3s', transform: hov ? 'translateY(-4px)' : 'none', boxShadow: hov ? '0 16px 48px rgba(0,0,0,.45)' : 'none', cursor: 'pointer' }}
    >
      {/* Badge */}
      {p.badge && (
        <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 3, padding: '4px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase' }} className={p.badgeColor === 'bordo' ? 'kn-badge-bordo' : 'kn-badge-gold'}>
          {pi.pBadge(p)}
        </div>
      )}

      {/* Wishlist */}
      <button onClick={e => { e.stopPropagation(); toggleWish(p.id) }}
        style={{ position: 'absolute', top: 12, right: 12, zIndex: 3, width: 32, height: 32, background: 'rgba(11,11,12,.7)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" stroke={wishlist.has(p.id) ? 'var(--bordo)' : 'var(--fg-mute)'} strokeWidth="2" className={`kn-heart${wishlist.has(p.id) ? ' active' : ''}`} fill={wishlist.has(p.id) ? 'var(--bordo)' : 'none'}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'var(--bg-2)' }} onClick={() => onOpen(p)}>
        <img src={p.image} alt={pi.pName(p)} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s ease', transform: hov ? 'scale(1.06)' : 'scale(1)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,11,12,.52)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hov ? 1 : 0, transition: 'opacity .3s ease', zIndex: 2 }}>
          <button onClick={e => { e.stopPropagation(); onOpen(p) }}
            style={{ padding: '10px 20px', background: 'var(--bg-1)', border: '1px solid var(--gold-3)', color: 'var(--fg)', fontFamily: 'var(--f-sans)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 500 }}>
            {t('card_view_product')}
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '18px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>{pi.pCat(p)}</div>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.25, cursor: 'pointer' }} onClick={() => onOpen(p)}>{pi.pName(p)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Stars rating={p.rating} />
          <span style={{ fontSize: 11, color: 'var(--fg-mute)' }}>({p.reviews})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 21, fontWeight: 600 }}>{fmt(p.price)}</span>
          {p.originalPrice && <span style={{ fontSize: 12, color: 'var(--fg-mute)', textDecoration: 'line-through' }}>{fmt(p.originalPrice)}</span>}
          {disc > 0 && <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>−{disc}%</span>}
        </div>
      </div>

      {/* Add to cart */}
      <button onClick={() => onAdd(p)}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bordo-2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-3)')}
        style={{ margin: '0 18px 18px', padding: '11px', background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--f-sans)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .2s ease' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L4 7v13h16V7L18 2Z" /><path d="M8 10c0 2 1.8 4 4 4s4-2 4-4" /></svg>
        {t('card_add_cart')}
      </button>

      {/* Bottom hover accent */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'var(--bordo)', transform: hov ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: 'transform .4s ease' }} />
    </div>
  )
}

// ─── ProductCarousel ──────────────────────────────────────────────────────────

function NavArrow({ dir, disabled, onClick }: { dir: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 46, height: 46, border: `1px solid ${hov && !disabled ? 'var(--gold)' : 'var(--border)'}`, background: 'transparent', color: disabled ? 'var(--bg-3)' : hov ? 'var(--gold)' : 'var(--fg-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? .35 : 1, transition: 'all .2s ease' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {dir === 'prev' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  )
}

function ProductCarousel({ eyebrow, title, products, onAdd, onOpen, wishlist, toggleWish }: {
  eyebrow: string; title: string; products: Product[]
  onAdd: (p: Product) => void; onOpen: (p: Product) => void
  wishlist: Set<number>; toggleWish: (id: number) => void
}) {
  const [idx, setIdx] = useState(0)
  const hoverRef = useRef(false)
  const timerRef = useRef<number | null>(null)
  const VISIBLE = 4
  const max = Math.max(0, products.length - VISIBLE)

  const next = useCallback(() => setIdx(p => Math.min(p + 1, max)), [max])
  const prev = useCallback(() => setIdx(p => Math.max(p - 1, 0)), [])

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      if (!hoverRef.current) setIdx(p => p >= max ? 0 : p + 1)
    }, 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [max])

  const cardW = `calc((100% - ${(VISIBLE - 1) * 20}px) / ${VISIBLE})`

  return (
    <section style={{ padding: 'clamp(64px,8vw,110px) 0', borderTop: '1px solid var(--border)' }}>
      <div className="wrap">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 44, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Eyebrow text={eyebrow} />
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(30px,3.5vw,52px)', fontWeight: 500, margin: '14px 0 0', lineHeight: 1.08 }} dangerouslySetInnerHTML={{ __html: title }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <NavArrow dir="prev" disabled={idx === 0} onClick={prev} />
            <NavArrow dir="next" disabled={idx >= max} onClick={next} />
          </div>
        </div>

        <div style={{ overflow: 'hidden' }} onMouseEnter={() => { hoverRef.current = true }} onMouseLeave={() => { hoverRef.current = false }}>
          <div style={{ display: 'flex', gap: 20, transition: 'transform .6s cubic-bezier(.25,.1,.25,1)', transform: `translateX(calc(-${idx} * (${cardW} + 20px)))` }}>
            {products.map(p => (
              <div key={p.id} style={{ width: cardW, flexShrink: 0 }}>
                <ProductCard p={p} onAdd={onAdd} onOpen={onOpen} wishlist={wishlist} toggleWish={toggleWish} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
          {Array.from({ length: max + 1 }).map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{ width: i === idx ? 28 : 8, height: 8, background: i === idx ? 'var(--gold)' : 'var(--bg-3)', border: 'none', borderRadius: 4, padding: 0, transition: 'all .35s ease' }} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CartDrawer ───────────────────────────────────────────────────────────────

const SHIPPING_THRESHOLD = 150
const SHIPPING_COST = 4.99

function CartDrawer({ open, onClose, items, updateQty, remove }: {
  open: boolean; onClose: () => void; items: CartItem[]
  updateQty: (id: number, qty: number) => void; remove: (id: number) => void
}) {
  const { t } = useLang()
  const pi = useProductI18n()
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const total = subtotal + shipping
  const freeShippingRemaining = SHIPPING_THRESHOLD - subtotal
  const [loading, setLoading] = React.useState(false)
  const [checkoutError, setCheckoutError] = React.useState('')

  async function handleCheckout() {
    setLoading(true)
    setCheckoutError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, origin: window.location.origin }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error || 'Erro ao iniciar pagamento. Tente novamente.')
      }
    } catch {
      setCheckoutError('Erro de rede. Verifique a ligação e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={`cart-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`cart-drawer ${open ? 'open' : ''}`}>

        {/* Header */}
        <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Eyebrow text={t('cart_title')} />
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 24, fontWeight: 500, marginTop: 8 }}>
              {items.length} {items.length === 1 ? t('cart_article') : t('cart_articles')}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 38, height: 38, border: '1px solid var(--border)', background: 'transparent', color: 'var(--fg-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Free shipping progress */}
        {items.length > 0 && (
          <div style={{ padding: '12px 26px', background: subtotal >= SHIPPING_THRESHOLD ? 'rgba(176,141,87,.1)' : 'var(--bg-1)', borderBottom: '1px solid var(--border)' }}>
            {subtotal >= SHIPPING_THRESHOLD ? (
              <div style={{ fontSize: 12, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                {t('cart_free_achieved')}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginBottom: 7 }}>
                  <b style={{ color: 'var(--fg)' }}>{fmt(freeShippingRemaining)}</b> {t('cart_free_progress')}
                </div>
                <div style={{ height: 3, background: 'var(--border)', borderRadius: 2 }}>
                  <div style={{ height: '100%', background: 'var(--gold)', borderRadius: 2, width: `${Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100)}%`, transition: 'width .4s ease' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--fg-mute)' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ margin: '0 auto 16px', display: 'block', opacity: .4 }}>
                <path d="M6 2L4 7v13h16V7L18 2Z" /><path d="M8 10c0 2 1.8 4 4 4s4-2 4-4" />
              </svg>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 20 }}>{t('cart_empty')}</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>{t('cart_empty_sub')}</div>
            </div>
          ) : items.map(item => (
            <div key={item.id} style={{ display: 'flex', gap: 12, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 72, height: 72, flexShrink: 0, background: 'var(--bg-2)', overflow: 'hidden' }}>
                {item.image ? (
                  <img src={item.image} alt={pi.pName(item)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--border-2)" strokeWidth="1.2"><path d="M6 2L4 7v13h16V7L18 2Z" /><path d="M8 10c0 2 1.8 4 4 4s4-2 4-4" /></svg>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, fontWeight: 500, lineHeight: 1.3 }}>{pi.pName(item)}</div>
                <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '.16em', textTransform: 'uppercase', marginTop: 3 }}>{pi.pCat(item)}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
                  <div className="kn-qty">
                    <button onClick={() => item.qty === 1 ? remove(item.id) : updateQty(item.id, item.qty - 1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 600 }}>{fmt(item.price * item.qty)}</span>
                    <button onClick={() => remove(item.id)} title="Remover"
                      style={{ background: 'transparent', border: 'none', color: 'var(--fg-mute)', cursor: 'pointer', padding: 4, lineHeight: 0, transition: 'color .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--bordo)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-mute)')}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '20px 26px', borderTop: '1px solid var(--border)' }}>

            {/* Price breakdown */}
            <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--fg-mute)' }}>{t('cart_subtotal')}</span>
                <span style={{ fontSize: 15 }}>{fmt(subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--fg-mute)' }}>{t('cart_shipping')}</span>
                <span style={{ fontSize: 15, color: shipping === 0 ? 'var(--gold)' : 'var(--fg)' }}>
                  {shipping === 0 ? t('cart_free') : fmt(shipping)}
                </span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--fg-mute)' }}>{t('cart_total')}</span>
                <span style={{ fontFamily: 'var(--f-display)', fontSize: 26, fontWeight: 600 }}>{fmt(total)}</span>
              </div>
            </div>

            {/* Error */}
            {checkoutError && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(139,30,45,.12)', border: '1px solid rgba(139,30,45,.3)', fontSize: 13, color: '#e06070', lineHeight: 1.5 }}>
                ⚠ {checkoutError}
              </div>
            )}

            <PrimaryBtn full onClick={handleCheckout} disabled={loading}>
              {loading ? t('cart_processing') : t('cart_checkout')}
            </PrimaryBtn>

            {/* Trust row */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
              {[['🔒', t('cart_trust1')], ['↩', t('cart_trust2')], ['🚚', t('cart_trust3')]].map(([icon, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-mute)' }}>
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </div>

            {/* Payment icons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
              {['VISA', 'MC', 'MB', 'MBWay', 'PayPal'].map(m => (
                <span key={m} style={{ fontSize: 9, letterSpacing: '.1em', color: 'var(--fg-mute)', border: '1px solid var(--border)', padding: '3px 6px' }}>{m}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function HeaderNavLink({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <a href="#" onClick={e => { e.preventDefault(); onClick() }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: active ? 'var(--gold)' : hov ? 'var(--fg)' : 'var(--fg-mute)', fontWeight: 400, padding: '4px 0', position: 'relative', transition: 'color .2s ease' }}>
      {label}
      {active && <span style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 1, background: 'var(--gold)' }} />}
    </a>
  )
}

// Sub-categorias por vertical, extraídas dos produtos reais
const VESTUARIO_SUBS = ['Tops e Camisaria', 'Malhas e Sweats', 'Outerwear', 'Bottoms', 'Vestidos e Saias', 'Athleisure', 'Calçado', 'Acessórios']
const IT_SUBS = ['Computadores', 'Periféricos', 'Áudio e Imagem', 'Energia e Conectividade']

function NavDropdown({ label, active, subs, navigate, page, accent }: {
  label: string; active: boolean; subs: string[]; navigate: (p: Page, filter?: string) => void; page: Page; accent?: string
}) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [hov, setHov] = useState(false)
  const timer = useRef<number | null>(null)
  const enter = () => { if (timer.current) clearTimeout(timer.current); setOpen(true); setHov(true) }
  const leave = () => { timer.current = window.setTimeout(() => { setOpen(false); setHov(false) }, 120) }
  return (
    <div style={{ position: 'relative' }} onMouseEnter={enter} onMouseLeave={leave}>
      <a href="#" onClick={e => { e.preventDefault(); navigate(page) }}
        style={{ fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: active ? 'var(--gold)' : hov ? 'var(--fg)' : 'var(--fg-mute)', fontWeight: 400, padding: '4px 0', position: 'relative', transition: 'color .2s ease', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {label}
        <svg width="9" height="6" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M1 1.5l5 5 5-5" />
        </svg>
        {active && <span style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 1, background: 'var(--gold)' }} />}
      </a>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: -20, marginTop: 14, background: 'rgba(11,11,12,.98)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', minWidth: 240, padding: '10px 0', zIndex: 60, boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
          <div style={{ padding: '6px 20px 10px', borderBottom: '1px solid var(--border)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent || 'var(--gold)' }} />
            <span style={{ fontSize: 10, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--fg-mute)' }}>{t('shop_subcategories')}</span>
          </div>
          {subs.map(s => (
            <a key={s} href="#" onClick={e => { e.preventDefault(); navigate(page, s) }}
              style={{ display: 'block', padding: '8px 20px', color: 'var(--fg-dim)', fontSize: 13, transition: 'all .18s ease', letterSpacing: '.02em' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(176,141,87,.08)'; el.style.color = 'var(--gold)'; el.style.paddingLeft = '26px' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--fg-dim)'; el.style.paddingLeft = '20px' }}>
              {s}
            </a>
          ))}
          <div style={{ padding: '8px 20px 4px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
            <a href="#" onClick={e => { e.preventDefault(); navigate(page) }}
              style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {t('cats_shop')}
              <svg width="10" height="8" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h12M9 1l4 4-4 4" /></svg>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function Header({ activePage, navigate, cartCount, openCart, lang, setLang }: {
  activePage: Page; navigate: (page: Page, filter?: string) => void; cartCount: number; openCart: () => void; lang: Lang; setLang: (l: Lang) => void
}) {
  const { t } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const navLinks: { label: string; page: Page }[] = [
    { label: t('nav_home'), page: 'home' },
    { label: t('nav_blog'), page: 'blog' },
    { label: t('nav_contact'), page: 'contact' },
  ]

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  return (
    <>
      {/* Announcement */}
      <div style={{ background: 'var(--bordo)', padding: '9px 20px', textAlign: 'center', fontFamily: 'var(--f-sans)', fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ color: 'rgba(245,242,237,.7)' }}>🚚</span>
        <span style={{ color: '#F5F2ED' }} dangerouslySetInnerHTML={{ __html: t('announcement_shipping') }} />
        <span style={{ color: 'var(--gold-2)' }}>·</span>
        <span style={{ color: 'var(--gold-2)' }}>{t('announcement_payment')}</span>
      </div>

      {/* Header bar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, padding: `${scrolled ? 11 : 17}px var(--pad-x)`, background: scrolled ? 'rgba(11,11,12,.96)' : 'rgba(11,11,12,.72)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 28, transition: 'all .3s ease' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('home')}>
          <img src={logoImg} alt="Karmic Node" style={{ width: 56, height: 56, objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 20, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500 }}>
            Karmic<span style={{ color: 'var(--gold)' }}>·</span>Node
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="kn-header-nav">
          <HeaderNavLink label={t('nav_home')} active={activePage === 'home'} onClick={() => navigate('home')} />
          <NavDropdown label={t('vert_vestuario')} active={activePage === 'vestuario'} subs={VESTUARIO_SUBS} navigate={navigate} page="vestuario" accent="var(--gold)" />
          <NavDropdown label={t('vert_it')} active={activePage === 'it'} subs={IT_SUBS} navigate={navigate} page="it" accent="var(--bordo-3)" />
          {/* Personalizar destacado */}
          <a href="#" onClick={e => { e.preventDefault(); navigate('custom') }}
            style={{ fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 600, padding: '5px 14px', border: `1px solid ${activePage === 'custom' ? 'var(--gold)' : 'var(--gold-3)'}`, color: activePage === 'custom' ? '#0B0B0C' : 'var(--gold)', background: activePage === 'custom' ? 'var(--gold)' : 'transparent', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .2s ease' }}>
            <span style={{ fontSize: 12, lineHeight: 1 }}>✦</span>
            {t('header_customize')}
          </a>
          <HeaderNavLink label={t('nav_blog')} active={activePage === 'blog'} onClick={() => navigate('blog')} />
          <HeaderNavLink label={t('nav_contact')} active={activePage === 'contact'} onClick={() => navigate('contact')} />
        </nav>

        {/* Right actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
            {(['pt', 'en'] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                style={{ padding: '6px 10px', background: lang === l ? 'var(--gold)' : 'transparent', border: 'none', color: lang === l ? '#0B0B0C' : 'var(--fg-mute)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}>
                {l}
              </button>
            ))}
          </div>
          <IconBtn onClick={() => navigate('contact')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          </IconBtn>

          <button onClick={openCart}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bordo-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bordo)')}
            style={{ padding: '9px 16px', background: 'var(--bordo)', border: 'none', color: '#F5F2ED', fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 7, transition: 'background .2s ease', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L4 7v13h16V7L18 2Z" /><path d="M8 10c0 2 1.8 4 4 4s4-2 4-4" /></svg>
            <span>{t('nav_cart')}</span>
            {cartCount > 0 && (
              <span style={{ background: 'var(--gold)', color: '#0B0B0C', width: 17, height: 17, borderRadius: '50%', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button onClick={() => setNavOpen(v => !v)} className="kn-mobile-toggle"
            style={{ width: 38, height: 38, border: '1px solid var(--border)', background: 'transparent', color: 'var(--fg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <span style={{ width: 16, height: 1, background: 'currentColor', display: 'block', transition: 'transform .3s ease', transform: navOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
            <span style={{ width: 16, height: 1, background: 'currentColor', display: 'block', opacity: navOpen ? 0 : 1, transition: 'opacity .2s ease' }} />
            <span style={{ width: 16, height: 1, background: 'currentColor', display: 'block', transition: 'transform .3s ease', transform: navOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className={`kn-nav-mobile ${navOpen ? 'open' : ''}`}>
        {navLinks.map(({ label, page }) => (
          <a key={page} href="#" onClick={e => { e.preventDefault(); navigate(page); setNavOpen(false) }}
            style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 500, color: 'var(--fg)', letterSpacing: '.04em' }}>
            {label}
          </a>
        ))}
        <div style={{ marginTop: 16, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a href="#" onClick={e => { e.preventDefault(); navigate('about'); setNavOpen(false) }} style={{ fontSize: 14, color: 'var(--fg-mute)', letterSpacing: '.14em', textTransform: 'uppercase' }}>{t('nav_about')}</a>
          <a href="#" onClick={e => { e.preventDefault(); navigate('contact'); setNavOpen(false) }} style={{ fontSize: 14, color: 'var(--fg-mute)', letterSpacing: '.14em', textTransform: 'uppercase' }}>{t('nav_contact')}</a>
          <a href="#" onClick={e => { e.preventDefault(); navigate('custom'); setNavOpen(false) }} style={{ fontSize: 14, color: 'var(--gold)', letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 600 }}>✦ {t('nav_custom')}</a>
        </div>
      </nav>
    </>
  )
}

function IconBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 38, height: 38, border: `1px solid ${hov ? 'var(--gold)' : 'var(--border)'}`, background: 'transparent', color: hov ? 'var(--gold)' : 'var(--fg-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease' }}>
      {children}
    </button>
  )
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

function HomeCatCard({ cat, onClick }: { cat: { name: string; count: number; icon: ReactNode }; onClick: () => void }) {
  const { t } = useLang()
  const [hov, setHov] = useState(false)
  return (
    <a href="#" onClick={e => { e.preventDefault(); onClick() }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '28px 16px', border: `1px solid ${hov ? 'var(--gold-3)' : 'var(--border)'}`, background: hov ? 'var(--bg-1)' : 'transparent', textAlign: 'center', transition: 'all .3s ease', transform: hov ? 'translateY(-2px)' : 'none' }}>
      <div style={{ color: hov ? 'var(--gold)' : 'var(--fg-mute)', transition: 'color .3s ease' }}>{cat.icon}</div>
      <div>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 500 }}>{cat.name}</div>
        <div style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--fg-mute)', marginTop: 3 }}>{cat.count} {t('home_articles')}</div>
      </div>
    </a>
  )
}

function HomeTesti({ t }: { t: { q: string; name: string; role: string; rating: number } }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '36px 30px', border: `1px solid ${hov ? 'var(--gold-3)' : 'var(--border)'}`, background: 'var(--bg)', display: 'flex', flexDirection: 'column', transition: 'border-color .3s, transform .3s', transform: hov ? 'translateY(-4px)' : 'none' }}>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 60, lineHeight: 1, color: 'var(--gold)', opacity: .3, marginBottom: -12 }}>"</div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontStyle: 'italic', lineHeight: 1.55, flex: 1 }}>{t.q}</div>
      <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
          <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg-mute)', marginTop: 2 }}>{t.role}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}><Stars rating={t.rating} /></div>
      </div>
    </div>
  )
}

function HomePage({ onAdd, onOpen, wishlist, toggleWish, setPage, products }: {
  onAdd: (p: Product) => void; onOpen: (p: Product) => void
  wishlist: Set<number>; toggleWish: (id: number) => void
  setPage: (p: Page) => void; products: Product[]
}) {
  const { t } = useLang()
  const CATS = [
    { name: 'Tops', count: 38, icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" /></svg> },
    { name: 'Calças', count: 24, icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 2h12l2 6-4 14H8L4 8z" /><path d="M8 8h8M12 8v12" /></svg> },
    { name: 'Vestidos', count: 19, icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 2c0 0-3 4-6 5l2 15h8l2-15c-3-1-6-5-6-5z" /></svg> },
    { name: 'Casacos', count: 16, icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 6l3-3 6 3 6-3 3 3v14H3z" /><path d="M12 6v15" /></svg> },
    { name: 'Calçado', count: 22, icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 18h18v2H3zM3 14c0-4 3-8 6-9l4 5 5-1 3 4H3z" /></svg> },
    { name: 'Acessórios', count: 41, icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M20 12V6H4v6a8 8 0 0 0 16 0z" /><path d="M12 6V2M8 6V3M16 6V3" /></svg> },
  ]

  const TESTIMONIALS = [
    { q: t('testi1_q'), name: t('testi1_name'), role: t('testi1_role'), rating: 5 },
    { q: t('testi2_q'), name: t('testi2_name'), role: t('testi2_role'), rating: 5 },
    { q: t('testi3_q'), name: t('testi3_name'), role: t('testi3_role'), rating: 5 },
  ]

  return (
    <>
      {/* HERO */}
      <section style={{ minHeight: '86vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', background: 'var(--bg-1)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(900px 600px at 72% 50%, rgba(139,30,45,0.24), transparent 65%), radial-gradient(500px 400px at 8% 80%, rgba(176,141,87,0.08), transparent 60%)', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(43,41,38,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(43,41,38,.35) 1px,transparent 1px)', backgroundSize: '80px 80px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,#000 40%,transparent 100%)', zIndex: 0 }} />

        <div className="wrap" style={{ position: 'relative', zIndex: 2, width: '100%', padding: '80px var(--pad-x)' }}>
          <div className="kn-hero-grid">
            <div className="reveal">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 30, padding: '6px 16px', border: '1px solid var(--gold-3)', color: 'var(--gold)', fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 10px var(--gold)', animation: 'pulse 2s ease-in-out infinite' }} />
                {t('home_hero_badge')}
              </div>

              <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(48px,6.5vw,100px)', fontWeight: 500, lineHeight: 1.05, margin: 0 }}>
                {t('home_hero_title1')}<br />
                {t('home_hero_title2_pre')} <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{t('home_hero_title1_em')}</em>.<br />
                <span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(245,242,237,.3)' }}>{t('home_hero_title3_1')}</span><br />
                <em style={{ color: 'var(--bordo-3)', fontStyle: 'italic' }}>{t('home_hero_title3_em')}</em>.
              </h1>

              <p style={{ fontFamily: 'var(--f-sans)', fontSize: 'clamp(15px,1.2vw,19px)', color: 'var(--fg-dim)', maxWidth: '44ch', marginTop: 26, lineHeight: 1.65 }}>
                {t('home_hero_desc')}
              </p>

              <div style={{ display: 'flex', gap: 14, marginTop: 42, flexWrap: 'wrap' }}>
                <PrimaryBtn onClick={() => setPage('shop')}>{t('home_hero_cta1')}</PrimaryBtn>
                <GhostBtn onClick={() => setPage('shop')}>{t('home_hero_cta2')}</GhostBtn>
              </div>

              <div style={{ display: 'flex', gap: 40, marginTop: 52, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
                {[['500+', t('home_hero_stat1_label')], ['48h', t('home_hero_stat2_label')], ['100%', t('home_hero_stat3_label')]].map(([n, l]) => (
                  <div key={l}>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 500, color: 'var(--gold)', lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--fg-mute)', marginTop: 6 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="kn-hero-right" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative', maxWidth: 480, width: '100%' }}>
                <div style={{ position: 'absolute', top: -1, left: -1, width: 20, height: 20, borderTop: '1px solid var(--gold)', borderLeft: '1px solid var(--gold)', zIndex: 3 }} />
                <div style={{ position: 'absolute', top: -1, right: -1, width: 20, height: 20, borderTop: '1px solid var(--gold)', borderRight: '1px solid var(--gold)', zIndex: 3 }} />
                <div style={{ position: 'absolute', bottom: -1, left: -1, width: 20, height: 20, borderBottom: '1px solid var(--gold)', borderLeft: '1px solid var(--gold)', zIndex: 3 }} />
                <div style={{ position: 'absolute', bottom: -1, right: -1, width: 20, height: 20, borderBottom: '1px solid var(--gold)', borderRight: '1px solid var(--gold)', zIndex: 3 }} />
                <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=960&q=85" alt="Moda premium" style={{ width: '100%', display: 'block', filter: 'brightness(.82) saturate(.9)', border: '1px solid var(--border)' }} />
                <div style={{ position: 'absolute', bottom: 22, left: 22, right: 22, background: 'rgba(11,11,12,.88)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)', padding: '15px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>{t('home_hero_feat_label')}</div>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 500 }}>{products[0]?.name || 'T-Shirt Essencial Algodão'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Stars rating={4.9} />
                      <span style={{ fontSize: 10, color: 'var(--fg-mute)' }}>({products[0]?.reviews || 214} {t('home_hero_feat_reviews')})</span>
                    </div>
                  </div>
                  <button onClick={() => products[0] && onAdd(products[0])}
                    style={{ padding: '9px 14px', background: 'var(--bordo)', border: 'none', color: '#F5F2ED', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {fmt(49)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ padding: 'clamp(52px,6vw,80px) 0', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap">
          <SectionHead eyebrow={t('home_cats_eyebrow')} title={t('home_cats_title').replace('<em>', "<em class='gold-text'>")}
            lead={t('home_cats_lead')}
            cta={<GhostBtn onClick={() => setPage('shop')}>{t('home_cats_cta')}</GhostBtn>} />
          <div className="kn-cat-grid">
            {CATS.map(cat => (
              <HomeCatCard key={cat.name} cat={cat} onClick={() => setPage('shop')} />
            ))}
          </div>
        </div>
      </section>

      {/* BESTSELLERS CAROUSEL */}
      <ProductCarousel eyebrow={t('home_bestsellers_eyebrow')} title={t('home_bestsellers_title').replace('<em>', "<em class='gold-text'>")} products={products} onAdd={onAdd} onOpen={onOpen} wishlist={wishlist} toggleWish={toggleWish} />

      {/* PROMO BANNER */}
      <section style={{ position: 'relative', overflow: 'hidden', background: `radial-gradient(900px 500px at 25% 50%, rgba(139,30,45,0.45), transparent 65%), var(--bg-2)`, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: 'clamp(56px,7vw,96px) 0' }}>
        <div className="wrap">
          <div className="kn-promo-grid">
            <div>
              <div style={{ display: 'inline-block', padding: '4px 14px', background: 'var(--bordo)', color: '#F5F2ED', fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 22 }}>{t('home_promo_eyebrow')}</div>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(34px,4vw,64px)', fontWeight: 500, margin: '0 0 22px', lineHeight: 1.05 }}
                dangerouslySetInnerHTML={{ __html: t('home_promo_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
              <p style={{ color: 'var(--fg-dim)', fontSize: 16, maxWidth: '40ch', lineHeight: 1.65, marginBottom: 34 }}>
                {t('home_promo_desc')}
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={() => setPage('shop')} style={{ padding: '13px 28px', background: 'var(--gold)', border: 'none', color: '#0B0B0C', fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 700 }}>{t('home_promo_cta1')}</button>
                <GhostBtn onClick={() => setPage('contact')}>{t('home_promo_cta2')}</GhostBtn>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Countdown />
            </div>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section style={{ padding: 'clamp(64px,8vw,110px) 0', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap">
          <SectionHead eyebrow={t('home_new_eyebrow')} title={t('home_new_title').replace('<em>', "<em class='gold-text'>")}
            lead={t('home_new_lead')}
            cta={<GhostBtn onClick={() => setPage('shop')}>{t('home_new_cta')}</GhostBtn>} />
          <div className="kn-products-4">
            {ALL_PRODUCTS.slice(0, 4).map(p => <ProductCard key={p.id} p={p} onAdd={onAdd} onOpen={onOpen} wishlist={wishlist} toggleWish={toggleWish} />)}
          </div>
        </div>
      </section>

      {/* ACCESSORIES CAROUSEL */}
      <ProductCarousel eyebrow={t('home_acc_eyebrow')} title={t('home_acc_title').replace('<em>', "<em class='gold-text'>")} products={[...products].reverse()} onAdd={onAdd} onOpen={onOpen} wishlist={wishlist} toggleWish={toggleWish} />

      {/* BRAND TICKER */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)', overflow: 'hidden', padding: '16px 0' }}>
        <div className="ticker-track">
          {[...Array(2)].flatMap((_, ri) =>
            ['Zara', 'H&M', 'Mango', 'Pull&Bear', 'Massimo Dutti', "Levi's", 'Nike', 'Adidas', 'Stradivarius', 'Reserved', 'COS', 'Arket', 'Weekday', 'Monki', 'Bershka'].map(brand => (
              <div key={`${brand}-${ri}`} style={{ display: 'flex', alignItems: 'center', gap: 24, paddingRight: 40 }}>
                <span style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontStyle: 'italic', color: 'var(--fg-mute)', whiteSpace: 'nowrap', letterSpacing: '.08em' }}>{brand}</span>
                <span style={{ width: 4, height: 4, background: 'var(--gold)', borderRadius: '50%', flexShrink: 0 }} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* TRUST BADGES */}
      <section style={{ padding: 'clamp(48px,5vw,70px) 0', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap">
          <div className="kn-trust-grid" style={{ border: '1px solid var(--border)' }}>
            {[
              { icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>, title: t('trust_shipping_title'), desc: t('trust_shipping_desc') },
              { icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>, title: t('trust_returns_title'), desc: t('trust_returns_desc') },
              { icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, title: t('trust_payment_title'), desc: t('trust_payment_desc') },
              { icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M21 15a2 2 0 0 1-2 2H7l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, title: t('trust_support_title'), desc: t('trust_support_desc') },
            ].map((b, i) => (
              <div key={b.title} style={{ padding: '32px 24px', borderRight: i < 3 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }}>{b.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 5 }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-mute)', lineHeight: 1.5 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: 'clamp(64px,8vw,110px) 0', background: 'var(--bg-1)', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap">
          <SectionHead eyebrow="Avaliações" title="O que dizem os nossos <em class='gold-text'>clientes</em>." lead="Mais de 500 clientes satisfeitos em Portugal. Leia as suas experiências." />
          <div className="kn-tst-grid">
            {TESTIMONIALS.map(t => (
              <HomeTesti key={t.name} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section style={{ padding: 'clamp(64px,7vw,100px) 0', background: `radial-gradient(700px 400px at 50% 0%, rgba(139,30,45,0.28), transparent 70%), var(--bg)`, borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="wrap" style={{ maxWidth: 580 }}>
          <Eyebrow text={t('newsletter_eyebrow')} />
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(30px,3.5vw,50px)', fontWeight: 500, margin: '20px 0 14px', lineHeight: 1.1 }}
            dangerouslySetInnerHTML={{ __html: t('newsletter_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
          <p style={{ color: 'var(--fg-mute)', fontSize: 15, marginBottom: 34 }}>
            {t('newsletter_desc')}
          </p>
          <NewsletterForm />
          <p style={{ fontSize: 11, color: 'var(--fg-mute)', marginTop: 14, letterSpacing: '.06em' }}>{t('newsletter_fine')}</p>
        </div>
      </section>
    </>
  )
}

// ─── ShopPage ─────────────────────────────────────────────────────────────────

function ShopPage({ onAdd, onOpen, wishlist, toggleWish, initialCategory, products, vertical }: {
  onAdd: (p: Product) => void; onOpen: (p: Product) => void
  wishlist: Set<number>; toggleWish: (id: number) => void
  initialCategory?: string; products: Product[]
  vertical?: 'vestuario' | 'it' | 'all'
}) {
  const { t } = useLang()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(
    initialCategory && initialCategory !== 'promo' ? initialCategory : 'Todos'
  )
  const [showPromoOnly, setShowPromoOnly] = useState(initialCategory === 'promo')
  const [sort, setSort] = useState('relevance')
  const [maxPrice, setMaxPrice] = useState(2200)

  // Se vertical estiver definido, filtrar produtos por vertical primeiro
  const verticalProducts = vertical && vertical !== 'all'
    ? products.filter(p => p.vertical === vertical)
    : products

  // Sub-categorias disponíveis nesta vertical
  const availableSubs = vertical === 'vestuario' ? VESTUARIO_SUBS
    : vertical === 'it' ? IT_SUBS
    : []

  const filtered = verticalProducts
    .filter(p => {
      if (activeCategory !== 'Todos') {
        // activeCategory pode ser uma subcategory (dos dropdowns) ou category (do sidebar antigo)
        if (p.subcategory !== activeCategory && p.category !== activeCategory) return false
      }
      if (showPromoOnly && !p.originalPrice) return false
      if (p.price > maxPrice) return false
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.category.toLowerCase().includes(search.toLowerCase()) && !(p.subcategory || '').toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'rating') return b.rating - a.rating
      return 0
    })

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Page hero */}
      <div style={{ background: vertical === 'it' ? `radial-gradient(700px 400px at 80% 20%, rgba(139,30,45,.18), transparent 60%), var(--bg-1)` : `radial-gradient(700px 400px at 80% 20%, rgba(176,141,87,.14), transparent 60%), var(--bg-1)`, borderBottom: '1px solid var(--border)', padding: '52px var(--pad-x) 36px' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--fg-mute)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            Karmic Node
            <span style={{ color: 'var(--border-2)' }}>·</span>
            <span style={{ color: vertical === 'it' ? 'var(--bordo-3)' : 'var(--gold)' }}>
              {vertical === 'vestuario' ? t('vert_vestuario') : vertical === 'it' ? t('vert_it') : t('nav_shop')}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(40px,5vw,72px)', fontWeight: 500, margin: '0 0 20px', lineHeight: 1.05 }}
            dangerouslySetInnerHTML={{ __html: (vertical === 'vestuario' ? t('vert_vestuario_title') : vertical === 'it' ? t('vert_it_title') : t('shop_all_title'))
              .replace('<em>', `<em style="color:${vertical === 'it' ? 'var(--bordo-3)' : 'var(--gold)'};font-style:italic">`) }} />
          {vertical && vertical !== 'all' && (
            <p style={{ color: 'var(--fg-dim)', fontSize: 16, maxWidth: '48ch', lineHeight: 1.6, marginBottom: 24 }}>
              {vertical === 'vestuario' ? t('vert_vestuario_lead') : t('vert_it_lead')}
            </p>
          )}

          {/* Search bar */}
          <div style={{ position: 'relative', maxWidth: 480 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fg-mute)" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('shop_search')}
              style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '13px 14px 13px 40px', fontFamily: 'var(--f-sans)', fontSize: 14, outline: 'none', transition: 'border-color .2s' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold-3)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
          </div>
        </div>
      </div>

      <div className="wrap" style={{ padding: '40px var(--pad-x) 80px' }}>
        <div className="kn-shop-layout">
          {/* Sidebar filters */}
          <aside className="kn-shop-sidebar" style={{ position: 'sticky', top: 100 }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 28 }}>
              <div style={{ fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: vertical === 'it' ? 'var(--bordo-3)' : 'var(--gold)', fontWeight: 500, marginBottom: 16 }}>
                {vertical && vertical !== 'all' ? t('shop_subcategories') : t('shop_categories')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Botão "Todos" */}
                <button onClick={() => { setActiveCategory('Todos'); setShowPromoOnly(false) }}
                  style={{ background: 'none', border: 'none', textAlign: 'left', color: activeCategory === 'Todos' && !showPromoOnly ? (vertical === 'it' ? 'var(--bordo-3)' : 'var(--gold)') : 'var(--fg-dim)', fontSize: 14, padding: '5px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: activeCategory === 'Todos' && !showPromoOnly ? 500 : 300, transition: 'color .2s ease' }}>
                  {activeCategory === 'Todos' && !showPromoOnly && <span style={{ width: 16, height: 1, background: vertical === 'it' ? 'var(--bordo-3)' : 'var(--gold)', flexShrink: 0 }} />}
                  {t('shop_all')}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-mute)' }}>({verticalProducts.length})</span>
                </button>
                {/* Lista dinâmica de sub-categorias */}
                {(availableSubs.length > 0 ? availableSubs : Array.from(new Set(verticalProducts.map(p => p.category)))).map(cat => {
                  const count = availableSubs.length > 0
                    ? verticalProducts.filter(p => p.subcategory === cat).length
                    : verticalProducts.filter(p => p.category === cat).length
                  const isActive = activeCategory === cat && !showPromoOnly
                  const accentCol = vertical === 'it' ? 'var(--bordo-3)' : 'var(--gold)'
                  return (
                    <button key={cat} onClick={() => { setActiveCategory(cat); setShowPromoOnly(false) }}
                      style={{ background: 'none', border: 'none', textAlign: 'left', color: isActive ? accentCol : 'var(--fg-dim)', fontSize: 14, padding: '5px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: isActive ? 500 : 300, transition: 'color .2s ease' }}>
                      {isActive && <span style={{ width: 16, height: 1, background: accentCol, flexShrink: 0 }} />}
                      {cat}
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-mute)' }}>({count})</span>
                    </button>
                  )
                })}
                {/* Botão só personalizáveis */}
                {verticalProducts.some(p => p.customizable) && (
                  <button onClick={() => { setActiveCategory('Todos'); setShowPromoOnly(false); /* toggle-simulado via search */ setSearch(search === '__custom' ? '' : '__custom') }}
                    style={{ marginTop: 8, background: 'none', border: '1px dashed var(--gold-3)', textAlign: 'left', color: 'var(--gold)', fontSize: 12, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s' }}>
                    <span style={{ fontSize: 13 }}>✦</span>
                    {t('shop_only_customizable')}
                    <span style={{ marginLeft: 'auto', fontSize: 10 }}>({verticalProducts.filter(p => p.customizable).length})</span>
                  </button>
                )}
              </div>
            </div>

            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 28 }}>
              <div style={{ fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, marginBottom: 16 }}>{t('shop_price_max')}</div>
              <input type="range" min={50} max={2200} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-mute)', marginTop: 8 }}>
                <span>50€</span><span style={{ color: 'var(--gold)', fontWeight: 500 }}>{fmt(maxPrice)}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, marginBottom: 16 }}>{t('shop_sort_by')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['relevance', t('shop_sort_relevance')], ['price-asc', t('shop_sort_price_asc')], ['price-desc', t('shop_sort_price_desc')], ['rating', t('shop_sort_rating')]].map(([v, l]) => (
                  <button key={v} onClick={() => setSort(v)} style={{ background: 'none', border: 'none', textAlign: 'left', color: sort === v ? 'var(--gold)' : 'var(--fg-dim)', fontSize: 14, padding: '4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: sort === v ? 500 : 300, transition: 'color .2s' }}>
                    {sort === v && <span style={{ width: 16, height: 1, background: 'var(--gold)', flexShrink: 0 }} />}
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main grid */}
          <div>
            {/* Mobile filter chips — só mostra se houver várias sub-categorias */}
            {availableSubs.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                <button onClick={() => { setActiveCategory('Todos'); setShowPromoOnly(false) }} className={`kn-filter-chip${activeCategory === 'Todos' && !showPromoOnly ? ' active' : ''}`}>{t('shop_all')}</button>
                {availableSubs.map(cat => (
                  <button key={cat} onClick={() => { setActiveCategory(cat); setShowPromoOnly(false) }} className={`kn-filter-chip${activeCategory === cat && !showPromoOnly ? ' active' : ''}`}>{cat}</button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontSize: 13, color: 'var(--fg-mute)' }}>{filtered.length} {filtered.length === 1 ? t('shop_products_found') : t('shop_products_found_pl')}</span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--fg-mute)' }}>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, marginBottom: 12 }}>{t('shop_no_results')}</div>
                <div style={{ fontSize: 14 }}>{t('shop_no_results_sub')}</div>
              </div>
            ) : (
              <div className="kn-products-3">
                {filtered.map(p => <ProductCard key={p.id} p={p} onAdd={onAdd} onOpen={onOpen} wishlist={wishlist} toggleWish={toggleWish} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ProductPage ──────────────────────────────────────────────────────────────

function ProductPage({ product, onAdd, onBack, wishlist, toggleWish, allProducts, onOpen }: {
  product: Product; onAdd: (p: Product) => void; onBack: () => void
  wishlist: Set<number>; toggleWish: (id: number) => void
  allProducts: Product[]; onOpen: (p: Product) => void
}) {
  const { t } = useLang()
  const pi = useProductI18n()
  const [activeImg, setActiveImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<'desc' | 'specs' | 'reviews'>('desc')
  const [added, setAdded] = useState(false)
  const related = allProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4)
  const disc = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '14px var(--pad-x)' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-mute)', letterSpacing: '.12em' }}>
          <span style={{ cursor: 'pointer', color: 'var(--fg-mute)', transition: 'color .2s' }} onClick={onBack}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-mute)')}>{t('product_back')}</span>
          <span style={{ color: 'var(--border-2)' }}>/</span>
          <span style={{ color: 'var(--gold)' }}>{pi.pCat(product)}</span>
          <span style={{ color: 'var(--border-2)' }}>/</span>
          <span style={{ color: 'var(--fg-dim)' }}>{pi.pName(product)}</span>
        </div>
      </div>

      <div className="wrap" style={{ padding: '48px var(--pad-x) 80px' }}>
        <div className="kn-product-detail">
          {/* Gallery */}
          <div>
            <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'var(--bg-2)', border: '1px solid var(--border)', marginBottom: 12 }}>
              <img src={product.images[activeImg] || product.image} alt={pi.pName(product)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {product.badge && (
                <div style={{ position: 'absolute', top: 16, left: 16, padding: '5px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase' }} className={product.badgeColor === 'bordo' ? 'kn-badge-bordo' : 'kn-badge-gold'}>
                  {pi.pBadge(product)}
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: 10 }}>
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    style={{ width: 72, aspectRatio: '4/3', overflow: 'hidden', border: `1px solid ${i === activeImg ? 'var(--gold)' : 'var(--border)'}`, background: 'var(--bg-2)', padding: 0, transition: 'border-color .2s' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, marginBottom: 10 }}>{pi.pCat(product)}</div>
              <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 500, margin: '0 0 16px', lineHeight: 1.1 }}>{pi.pName(product)}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Stars rating={product.rating} size={13} />
                <span style={{ fontSize: 13, color: 'var(--fg-mute)' }}>{product.rating} ({product.reviews} {t('product_reviews')})</span>
                <span style={{ fontSize: 12, color: product.stock > 5 ? '#4caf50' : 'var(--bordo-3)', marginLeft: 8, fontWeight: 500 }}>
                  {product.stock > 5 ? `✓ ${t('product_in_stock')} (${product.stock})` : product.stock > 0 ? `⚠ ${t('product_last_units').replace('{n}', String(product.stock))}` : `✗ ${t('product_out_of_stock')}`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(32px,3.5vw,48px)', fontWeight: 600 }}>{fmt(product.price)}</span>
                {product.originalPrice && <span style={{ fontSize: 16, color: 'var(--fg-mute)', textDecoration: 'line-through' }}>{fmt(product.originalPrice)}</span>}
                {disc > 0 && <span style={{ padding: '3px 10px', background: 'var(--gold)', color: '#0B0B0C', fontSize: 12, fontWeight: 700 }}>−{disc}%</span>}
              </div>
              {product.originalPrice && (
                <div style={{ fontSize: 13, color: 'var(--fg-mute)' }}>{t('product_save')} <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{fmt(product.originalPrice - product.price)}</span></div>
              )}
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Qty + add */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="kn-qty">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
              </div>
              <button onClick={() => { onAdd({ ...product, qty } as unknown as Product); setAdded(true); setTimeout(() => setAdded(false), 2000) }}
                style={{ flex: 1, padding: '14px 20px', background: added ? '#2e7d32' : 'var(--bordo)', border: 'none', color: '#F5F2ED', fontFamily: 'var(--f-sans)', fontSize: 12, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .3s ease' }}>
                {added
                  ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> {t('product_added')}</>
                  : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L4 7v13h16V7L18 2Z" /><path d="M8 10c0 2 1.8 4 4 4s4-2 4-4" /></svg> {t('product_add_cart')}</>
                }
              </button>
              <button onClick={() => toggleWish(product.id)}
                style={{ width: 50, height: 50, border: `1px solid ${wishlist.has(product.id) ? 'var(--bordo)' : 'var(--border)'}`, background: wishlist.has(product.id) ? 'rgba(139,30,45,.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" stroke={wishlist.has(product.id) ? 'var(--bordo)' : 'var(--fg-mute)'} strokeWidth="2" fill={wishlist.has(product.id) ? 'var(--bordo)' : 'none'}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {/* Trust mini */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['🚚', t('product_trust1')], ['↩', t('product_trust2')], ['🔒', t('product_trust3')], ['📏', t('product_trust4')]].map(([icon, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--bg-1)' }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: 'var(--fg-dim)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs: description / specs / reviews */}
        <div style={{ marginTop: 60, borderTop: '1px solid var(--border)' }}>
          <div className="kn-tabs">
            {(['desc', 'specs', 'reviews'] as const).map(tabKey => (
              <button key={tabKey} onClick={() => setTab(tabKey)} className={`kn-tab${tab === tabKey ? ' active' : ''}`}>
                {tabKey === 'desc' ? t('product_tab_desc') : tabKey === 'specs' ? t('product_tab_specs') : t('product_tab_reviews')}
              </button>
            ))}
          </div>

          <div style={{ padding: '36px 0' }}>
            {tab === 'desc' && (
              <div style={{ maxWidth: 760 }}>
                <p style={{ fontSize: 16, color: 'var(--fg-dim)', lineHeight: 1.75 }}>{pi.pDesc(product)}</p>
              </div>
            )}
            {tab === 'specs' && (
              <div style={{ maxWidth: 640 }}>
                {pi.pSpecs(product).map((s, i) => (
                  <div key={s.label} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 20, padding: '14px 0', borderBottom: i < pi.pSpecs(product).length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontSize: 14, color: 'var(--fg-dim)' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
            {tab === 'reviews' && (
              <div style={{ maxWidth: 680 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 36, padding: '28px', background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 56, fontWeight: 500, lineHeight: 1, color: 'var(--fg)' }}>{product.rating}</div>
                    <Stars rating={product.rating} size={14} />
                    <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 6 }}>{product.reviews} {t('product_reviews')}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {[5, 4, 3, 2, 1].map(s => {
                      const pct = s === 5 ? 72 : s === 4 ? 20 : s === 3 ? 6 : s === 2 ? 1 : 1
                      return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: 'var(--fg-mute)', width: 12 }}>{s}</span>
                          <div style={{ flex: 1, height: 6, background: 'var(--bg-3)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gold)' }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--fg-mute)', width: 28 }}>{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <p style={{ color: 'var(--fg-mute)', fontSize: 14, textAlign: 'center' }}>As avaliações verificadas serão exibidas aqui em breve.</p>
              </div>
            )}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ marginTop: 60, paddingTop: 48, borderTop: '1px solid var(--border)' }}>
            <SectionHead eyebrow={t('product_related')} title={t('product_related_title').replace('{cat}', pi.pCat(product)).replace('<em>', "<em class='gold-text'>")} />
            <div className="kn-products-4">
              {related.map(p => <ProductCard key={p.id} p={p} onAdd={onAdd} onOpen={onOpen} wishlist={wishlist} toggleWish={toggleWish} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ContactPage ──────────────────────────────────────────────────────────────

const FORMSPREE_URL = 'https://formspree.io/f/xeeyzlvb'

async function submitToFormspree(data: Record<string, string>) {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => fd.append(k, v))
  const r = await fetch(FORMSPREE_URL, { method: 'POST', headers: { Accept: 'application/json' }, body: fd })
  if (!r.ok) throw new Error('Formspree error')
}

function ContactPage() {
  const { t, arr } = useLang()
  const [form, setForm] = useState({ nome: '', email: '', area: arr('contact_form_areas')[0] || 'Roupa & Moda', msg: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')

  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{ background: 'radial-gradient(700px 400px at 85% 20%, rgba(139,30,45,.18), transparent 60%), var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '80px var(--pad-x) 60px' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
          <Eyebrow text={t('contact_eyebrow')} />
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(44px,6vw,88px)', fontWeight: 500, margin: '20px 0 24px', lineHeight: 1.05 }}
            dangerouslySetInnerHTML={{ __html: t('contact_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
          <p style={{ color: 'var(--fg-dim)', fontSize: 17, maxWidth: '56ch', lineHeight: 1.65 }}>
            {t('contact_desc')}
          </p>
        </div>
      </div>

      <div className="wrap" style={{ padding: '60px var(--pad-x) 80px' }}>
        <div className="kn-contact-grid">
          {/* Info */}
          <div>
            {[
              { label: t('contact_label_email'), value: 'karmicnode@gmail.com', href: 'mailto:karmicnode@gmail.com' },
              { label: t('contact_label_location'), value: 'Cartaxo · Portugal', href: null },
              { label: t('contact_label_hours'), value: t('contact_hours_val'), href: null },
              { label: t('contact_label_support'), value: t('contact_support_val'), href: null },
            ].map(row => (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 20, padding: '20px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                <span style={{ fontSize: 10, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>{row.label}</span>
                {row.href ? (
                  <a href={row.href} style={{ fontFamily: 'var(--f-display)', fontSize: 18, color: 'var(--fg)', transition: 'color .2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg)')}>{row.value}</a>
                ) : (
                  <span style={{ fontFamily: 'var(--f-display)', fontSize: 18 }}>{row.value}</span>
                )}
              </div>
            ))}

            <div style={{ marginTop: 32 }}>
              <div style={{ fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16, fontWeight: 500 }}>{t('contact_social')}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {['instagram', 'facebook', 'linkedin'].map(s => (
                  <a key={s} href="#" style={{ width: 40, height: 40, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-mute)', transition: 'all .2s ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--fg-mute)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      {s === 'instagram' && <><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></>}
                      {s === 'facebook' && <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />}
                      {s === 'linkedin' && <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></>}
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', padding: '40px 36px' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" style={{ margin: '0 auto 20px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 28, marginBottom: 12 }}>{t('contact_sent_title')}</h3>
                <p style={{ color: 'var(--fg-mute)', fontSize: 15 }}>{t('contact_sent_sub')}</p>
              </div>
            ) : (
              <>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 26, margin: '0 0 6px' }}
                  dangerouslySetInnerHTML={{ __html: t('contact_form_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
                <p style={{ color: 'var(--fg-mute)', fontSize: 14, marginBottom: 28 }}>{t('contact_form_sub')}</p>

                {[
                  { id: 'nome', label: t('contact_form_name'), type: 'text', ph: t('contact_form_name_ph') },
                  { id: 'email', label: t('contact_label_email'), type: 'email', ph: t('contact_form_email_ph') },
                ].map(f => (
                  <div key={f.id} style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, fontWeight: 500 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.ph} value={form[f.id as 'nome' | 'email']} onChange={e => setForm(prev => ({ ...prev, [f.id]: e.target.value }))}
                      style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', padding: '10px 0', color: 'var(--fg)', fontSize: 15, outline: 'none', transition: 'border-color .2s' }}
                      onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--gold)')}
                      onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--border)')} />
                  </div>
                ))}

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, fontWeight: 500 }}>{t('contact_form_area')}</label>
                  <select value={form.area} onChange={e => setForm(prev => ({ ...prev, area: e.target.value }))}
                    style={{ width: '100%', background: 'var(--bg-1)', border: 'none', borderBottom: '1px solid var(--border)', padding: '10px 0', color: 'var(--fg)', fontSize: 15, outline: 'none', appearance: 'none' }}>
                    {arr('contact_form_areas').map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, fontWeight: 500 }}>{t('contact_form_msg')}</label>
                  <textarea value={form.msg} onChange={e => setForm(prev => ({ ...prev, msg: e.target.value }))} placeholder={t('contact_form_msg_ph')} rows={4}
                    style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', padding: '10px 0', color: 'var(--fg)', fontSize: 15, outline: 'none', resize: 'vertical', transition: 'border-color .2s' }}
                    onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--gold)')}
                    onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--border)')} />
                </div>

                {fieldError && <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--bordo)', lineHeight: 1.5 }}>⚠ {fieldError}</p>}
                <PrimaryBtn full onClick={async () => {
                  if (!form.nome) { setFieldError('Por favor preencha o seu nome.'); return }
                  if (!form.email) { setFieldError('Por favor preencha o seu email.'); return }
                  if (!form.msg) { setFieldError('Por favor escreva uma mensagem.'); return }
                  setFieldError(''); setLoading(true); setError('')
                  try {
                    await submitToFormspree({ nome: form.nome, email: form.email, area: form.area, mensagem: form.msg })
                    setSent(true)
                  } catch { setError('Erro ao enviar. Tente novamente ou contacte karmicnode@gmail.com') }
                  setLoading(false)
                }}>{loading ? t('contact_form_sending') : t('contact_form_btn')}</PrimaryBtn>
                {error && <p style={{ marginTop: 12, fontSize: 13, color: 'var(--bordo)', lineHeight: 1.5 }}>⚠ {error}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AboutPage ────────────────────────────────────────────────────────────────

function AboutPage({ setPage }: { setPage: (p: Page) => void }) {
  const { t } = useLang()
  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{ background: 'radial-gradient(700px 400px at 85% 20%, rgba(139,30,45,.18), transparent 60%), var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '80px var(--pad-x) 60px' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
          <Eyebrow text={t('about_eyebrow')} />
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(44px,6vw,88px)', fontWeight: 500, margin: '20px 0 24px', lineHeight: 1.05 }}
            dangerouslySetInnerHTML={{ __html: t('about_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
          <p style={{ color: 'var(--fg-dim)', fontSize: 17, maxWidth: '60ch', lineHeight: 1.7 }}>
            {t('about_desc')}
          </p>
        </div>
      </div>

      <div className="wrap" style={{ padding: '60px var(--pad-x) 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginBottom: 60 }}>
          {[[t('about_mission_k'), t('about_mission_title'), t('about_mission_desc')],
            [t('about_vision_k'), t('about_vision_title'), t('about_vision_desc')],
            [t('about_values_k'), t('about_values_title'), t('about_values_desc')],
          ].map(([k, h, p]) => (
            <div key={h} style={{ padding: '36px 28px', border: '1px solid var(--border)', background: 'linear-gradient(180deg,var(--bg-1) 0%,var(--bg) 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -1, left: 24, right: 24, height: 1, background: 'var(--gold)' }} />
              <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 40, color: 'var(--gold)', marginBottom: 16, lineHeight: 1 }}>{k}</div>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 24, fontWeight: 500, marginBottom: 14 }}>{h}</h3>
              <p style={{ color: 'var(--fg-dim)', fontSize: 15, lineHeight: 1.7 }}>{p}</p>
            </div>
          ))}
        </div>

        <div style={{ background: `radial-gradient(700px 400px at 50% 0%, rgba(139,30,45,.3), transparent 70%), var(--bg-1)`, border: '1px solid var(--border)', padding: 'clamp(48px,6vw,80px)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
          <Eyebrow text={t('about_cta_eyebrow')} />
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 500, margin: '20px 0 16px' }}
            dangerouslySetInnerHTML={{ __html: t('about_cta_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
          <p style={{ color: 'var(--fg-dim)', fontSize: 16, maxWidth: '44ch', margin: '0 auto 34px' }}>
            {t('about_cta_desc')}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryBtn onClick={() => setPage('shop')}>{t('about_cta_shop')}</PrimaryBtn>
            <GhostBtn onClick={() => setPage('contact')}>{t('about_cta_contact')}</GhostBtn>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── BlogPage ─────────────────────────────────────────────────────────────────

// Mapeamento PT<->EN de categorias do blog
const BLOG_CAT_KEYS = ['blog_cat_all', 'blog_cat_style', 'blog_cat_trends', 'blog_cat_care', 'blog_cat_sustainability', 'blog_cat_accessories'] as const
// Mantém a lista PT como source of truth para filtragem
const BLOG_CATS = ['Todos', 'Estilo', 'Tendências', 'Cuidados', 'Sustentabilidade', 'Acessórios']
const BLOG_CATS_EN = ['All', 'Style', 'Trends', 'Care', 'Sustainability', 'Accessories']
function blogCatLabel(pt: string, lang: string): string {
  const i = BLOG_CATS.indexOf(pt)
  if (i < 0) return pt
  return lang === 'en' ? BLOG_CATS_EN[i] : pt
}

function BlogCard({ post, onClick }: { post: BlogPost; onClick: () => void }) {
  const { t, lang } = useLang()
  const [hov, setHov] = useState(false)
  const title = (lang === 'en' && post.titleEn) ? post.titleEn : post.title
  const excerpt = (lang === 'en' && post.excerptEn) ? post.excerptEn : post.excerpt
  const category = (lang === 'en' && post.categoryEn) ? post.categoryEn : post.category
  return (
    <article onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'var(--bg-1)', border: `1px solid ${hov ? 'var(--gold-3)' : 'var(--border)'}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'border-color .3s, transform .3s, box-shadow .3s', transform: hov ? 'translateY(-4px)' : 'none', boxShadow: hov ? '0 16px 48px rgba(0,0,0,.4)' : 'none' }}>
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--bg-2)' }}>
        <img src={post.image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s ease', transform: hov ? 'scale(1.06)' : 'scale(1)' }} />
        <div style={{ position: 'absolute', top: 14, left: 14, padding: '4px 10px', background: 'var(--bordo)', fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#F5F2ED' }}>{category}</div>
      </div>
      <div style={{ padding: '22px 24px 26px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--fg-mute)', letterSpacing: '.08em' }}>
          <span>{post.date}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border-2)', flexShrink: 0 }} />
          <span>{post.readTime} {t('blog_read_time')}</span>
        </div>
        <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 500, lineHeight: 1.25, margin: 0, color: hov ? 'var(--gold-2)' : 'var(--fg)', transition: 'color .2s' }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--fg-dim)', lineHeight: 1.65, margin: 0, flex: 1 }}>{excerpt}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--gold)', letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 500, marginTop: 6 }}>
          {t('blog_read')}
          <svg width="10" height="8" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h12M9 1l4 4-4 4" /></svg>
        </div>
      </div>
    </article>
  )
}

function BlogArticle({ post, onBack }: { post: BlogPost; onBack: () => void }) {
  const { t, lang } = useLang()
  const title = (lang === 'en' && post.titleEn) ? post.titleEn : post.title
  const excerpt = (lang === 'en' && post.excerptEn) ? post.excerptEn : post.excerpt
  const category = (lang === 'en' && post.categoryEn) ? post.categoryEn : post.category
  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 'clamp(320px,45vh,500px)', overflow: 'hidden' }}>
        <img src={post.image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(11,11,12,.3) 0%, rgba(11,11,12,.85) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(24px,4vw,48px) var(--pad-x)' }}>
          <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'var(--bordo)', fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 16 }}>{category}</div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(28px,4vw,56px)', fontWeight: 500, lineHeight: 1.1, margin: '0 0 16px', maxWidth: '18ch' }}>{title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 13, color: 'rgba(245,242,237,.7)' }}>
              <span>{post.author}</span>
              <span>·</span>
              <span>{post.date}</span>
              <span>·</span>
              <span>{post.readTime} {t('blog_read_time')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '14px var(--pad-x)' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-mute)' }}>
          <span style={{ cursor: 'pointer', transition: 'color .2s' }} onClick={onBack}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-mute)')}>{t('blog_back')}</span>
          <span style={{ color: 'var(--border-2)' }}>/</span>
          <span style={{ color: 'var(--gold)' }}>{category}</span>
          <span style={{ color: 'var(--border-2)' }}>/</span>
          <span style={{ color: 'var(--fg-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        </div>
      </div>

      {/* Body */}
      <div className="wrap" style={{ padding: '60px var(--pad-x) 100px' }}>
        <div style={{ maxWidth: '72ch', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(18px,1.6vw,22px)', fontStyle: 'italic', color: 'var(--fg-dim)', lineHeight: 1.65, marginBottom: 40, paddingBottom: 40, borderBottom: '1px solid var(--border)' }}>
            {excerpt}
          </p>
          {post.body.map((para, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--fg-dim)', marginBottom: 24, fontWeight: 300 }}>{para}</p>
          ))}

          <div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--fg-mute)' }}>{t('blog_category')}</span>
            <span style={{ padding: '5px 14px', border: '1px solid var(--gold-3)', color: 'var(--gold)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' }}>{post.category}</span>
          </div>

          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, background: 'var(--bordo)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              <img src={logoImg} alt="Karmic Node" style={{ width: 44, height: 44, objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 500 }}>{post.author}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 2 }}>Equipa Karmic Node · {t('blog_author_role')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BlogPage() {
  const { t, lang } = useLang()
  const [activePost, setActivePost] = useState<BlogPost | null>(null)
  const [activeCat, setActiveCat] = useState('Todos')
  const [search, setSearch] = useState('')

  if (activePost) {
    return <BlogArticle post={activePost} onBack={() => { setActivePost(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
  }

  const featured = BLOG_POSTS.find(p => p.featured)
  const filtered = BLOG_POSTS.filter(p => {
    if (activeCat !== 'Todos' && p.category !== activeCat) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.excerpt.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  const rest = filtered.filter(p => !p.featured || activeCat !== 'Todos' || search)

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Hero */}
      <div style={{ background: 'radial-gradient(900px 500px at 70% 50%, rgba(139,30,45,.22), transparent 65%), var(--bg-1)', borderBottom: '1px solid var(--border)', padding: 'clamp(64px,8vw,100px) var(--pad-x) clamp(48px,6vw,72px)' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
          <Eyebrow text={t('blog_eyebrow')} />
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(44px,6vw,88px)', fontWeight: 500, margin: '20px 0 20px', lineHeight: 1.05 }}
            dangerouslySetInnerHTML={{ __html: t('blog_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
          <p style={{ color: 'var(--fg-dim)', fontSize: 17, maxWidth: '52ch', lineHeight: 1.65, marginBottom: 36 }}>
            {t('blog_desc')}
          </p>
          {/* Search */}
          <div style={{ display: 'flex', border: '1px solid var(--border)', background: 'var(--bg-2)', maxWidth: 440 }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--gold-3)')}
            onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--fg-mute)" strokeWidth="1.8" style={{ margin: '0 12px', flexShrink: 0, alignSelf: 'center' }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('blog_search')}
              style={{ flex: 1, background: 'transparent', border: 'none', padding: '13px 0', color: 'var(--fg)', fontFamily: 'var(--f-sans)', fontSize: 14, outline: 'none' }} />
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '16px var(--pad-x)', overflowX: 'auto' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {BLOG_CATS.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)} className={`kn-filter-chip${activeCat === cat ? ' active' : ''}`}>{blogCatLabel(cat, lang)}</button>
          ))}
        </div>
      </div>

      <div className="wrap" style={{ padding: 'clamp(48px,6vw,80px) var(--pad-x)' }}>
        {/* Featured post */}
        {featured && activeCat === 'Todos' && !search && (
          <div style={{ marginBottom: 64 }}>
            <Eyebrow text={t('blog_featured')} />
            <article onClick={() => { setActivePost(featured); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid var(--border)', background: 'var(--bg-1)', cursor: 'pointer', overflow: 'hidden', transition: 'border-color .3s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold-3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ position: 'relative', minHeight: 340, overflow: 'hidden' }}>
                <img src={featured.image} alt={(lang === 'en' && featured.titleEn) ? featured.titleEn : featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s ease', position: 'absolute', inset: 0 }}
                  onMouseEnter={e => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1)')} />
              </div>
              <div style={{ padding: 'clamp(32px,4vw,52px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'var(--bordo)', fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', width: 'fit-content' }}>{(lang === 'en' && featured.categoryEn) ? featured.categoryEn : featured.category}</div>
                <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(22px,2.5vw,34px)', fontWeight: 500, lineHeight: 1.2, margin: 0 }}>{(lang === 'en' && featured.titleEn) ? featured.titleEn : featured.title}</h2>
                <p style={{ color: 'var(--fg-dim)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>{(lang === 'en' && featured.excerptEn) ? featured.excerptEn : featured.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--fg-mute)' }}>
                  <span>{featured.date}</span>
                  <span>·</span>
                  <span>{featured.readTime} {t('blog_read_time')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--gold)', letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 500 }}>
                  {t('blog_read')}
                  <svg width="10" height="8" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h12M9 1l4 4-4 4" /></svg>
                </div>
              </div>
            </article>
          </div>
        )}

        {/* Grid */}
        {rest.length > 0 ? (
          <>
            {(activeCat !== 'Todos' || search) ? null : <Eyebrow text={t('blog_all')} />}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginTop: activeCat === 'Todos' && !search ? 28 : 0 }}>
              {rest.map(post => (
                <BlogCard key={post.id} post={post} onClick={() => { setActivePost(post); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
              ))}
            </div>
          </>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--fg-mute)' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 24, marginBottom: 12 }}>{t('blog_none')}</div>
            <div style={{ fontSize: 14 }}>{t('blog_none_sub')}</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ─── CustomPage ───────────────────────────────────────────────────────────────

const CUSTOM_GARMENTS = [
  { id: 'tshirt', label: 'T-Shirt', icon: '👕', desc: 'Corte reto, unissexo ou fit' },
  { id: 'hoodie', label: 'Hoodie', icon: '🧥', desc: 'Com capuz, bolso canguru' },
  { id: 'polo', label: 'Polo', icon: '👔', desc: 'Elegante, com gola' },
  { id: 'sweat', label: 'Sweatshirt', icon: '🥋', desc: 'Sem capuz, clássica' },
  { id: 'cap', label: 'Boné', icon: '🧢', desc: 'Snapback ou strapback' },
  { id: 'bag', label: 'Tote Bag', icon: '👜', desc: 'Algodão 100%, resistente' },
]

const CUSTOM_FABRICS = [
  { id: 'cotton', label: 'Algodão 100%', note: 'Respirável · Durável' },
  { id: 'cotton_poly', label: 'Algodão/Poliéster', note: 'Anti-rugas · Económico' },
  { id: 'organic', label: 'Algodão Orgânico', note: 'Sustentável · Certificado' },
  { id: 'premium', label: 'Premium Pima', note: 'Suave · Luxo' },
]

const CUSTOM_PRINTS = [
  { id: 'embroidery', label: 'Bordado', note: 'Elegante · Alta durabilidade' },
  { id: 'dtg', label: 'Impressão DTG', note: 'Cores vivas · Foto-realismo' },
  { id: 'screen', label: 'Serigrafia', note: 'Ideal ≥ 20 unidades' },
  { id: 'heat', label: 'Vinil Térmico', note: 'Acabamento premium' },
  { id: 'patch', label: 'Patch / Etiqueta', note: 'Look exclusivo' },
]

const CUSTOM_COLORS = [
  '#F5F2ED', '#0B0B0C', '#8B1E2D', '#B08D57',
  '#1a3a5c', '#2d5a27', '#5c3317', '#6b4f7e',
  '#c94b2d', '#e8c84a', '#2a7a8c', '#808080',
]

const GALLERY_ITEMS = [
  { img: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&h=700&fit=crop', label: 'T-Shirt Bordada', cat: 'Bordado' },
  { img: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&h=700&fit=crop', label: 'Hoodie Personalizado', cat: 'Impressão DTG' },
  { img: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=600&h=700&fit=crop', label: 'Polo Premium', cat: 'Bordado' },
  { img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&h=700&fit=crop', label: 'Sweatshirt Equipa', cat: 'Serigrafia' },
  { img: 'https://images.unsplash.com/photo-1618932260643-eee4a2f652a6?w=600&h=700&fit=crop', label: 'Boné Personalizado', cat: 'Bordado' },
  { img: 'https://images.unsplash.com/photo-1597248374161-426f0d6d2fc9?w=600&h=700&fit=crop', label: 'Tote Bag Exclusiva', cat: 'Impressão DTG' },
]

const CUSTOM_FAQS = [
  { q: 'Qual o mínimo de unidades?', a: 'Para a maioria das técnicas aceitamos a partir de 1 unidade. Para serigrafia, o mínimo são 20 unidades para manter o preço competitivo.' },
  { q: 'Que formatos de ficheiro aceitam?', a: 'Aceitamos ficheiros vetoriais (AI, EPS, SVG, PDF) e raster de alta resolução (PNG/JPG a 300dpi no mínimo). Para bordado, utilizamos os seus ficheiros e fazemos a digitalização incluída no serviço.' },
  { q: 'Qual é o prazo de produção?', a: 'O prazo standard é de 10 a 15 dias úteis após aprovação da prova. Temos serviço urgente (5-7 dias úteis) com acréscimo de 30%.' },
  { q: 'É possível ver uma prova antes da produção?', a: 'Sim. Enviamos sempre uma prova digital para aprovação antes de iniciarmos a produção. Para encomendas ≥ 50 unidades, podemos enviar uma amostra física.' },
  { q: 'Fazem envio para todo o Portugal?', a: 'Sim, enviamos para Portugal Continental e Ilhas. Para encomendas empresariais, disponibilizamos envio para a Europa.' },
]

// ─── CUSTOMIZER V2 ────────────────────────────────────────────────────────────
// Configurador split-screen com live preview + kit builder + sparkles

// ─── Product catalog for customizer (independent of shop) ──────────────────
type CustGroup = 'vestuario' | 'it'

interface CustProduct {
  id: string
  group: CustGroup
  label: string
  icon: string  // SVG path/content centered at 0,0 within viewBox -100..100
  basePrice: number
  hasSize?: boolean
  hasFabric?: boolean
  hasTechnique?: boolean
  hasPosition?: boolean
  hasModel?: boolean
  hasMaterial?: boolean  // IT: capa material
  hasFinish?: boolean    // IT: mate/brilhante
}

const CUST_PRODUCTS: CustProduct[] = [
  // Vestuário
  { id: 'tshirt', group: 'vestuario', label: 'T-Shirt', basePrice: 12,
    icon: 'M-70 -35 L-95 -10 L-70 20 L-50 10 L-50 65 L50 65 L50 10 L70 20 L95 -10 L70 -35 L45 -35 C45 -12 22 0 0 0 C-22 0 -45 -12 -45 -35 Z',
    hasSize: true, hasFabric: true, hasTechnique: true, hasPosition: true },
  { id: 'hoodie', group: 'vestuario', label: 'Hoodie', basePrice: 28,
    icon: 'M-65 -30 L-95 5 L-75 35 L-55 25 L-55 75 L55 75 L55 25 L75 35 L95 5 L65 -30 C65 -60 -65 -60 -65 -30 Z M-30 -25 L-18 32 L18 32 L30 -25',
    hasSize: true, hasFabric: true, hasTechnique: true, hasPosition: true },
  { id: 'polo', group: 'vestuario', label: 'Polo', basePrice: 18,
    icon: 'M-60 -35 L-90 -8 L-70 22 L-50 12 L-50 65 L50 65 L50 12 L70 22 L90 -8 L60 -35 L22 -35 L18 -18 L-18 -18 L-22 -35 Z M-18 -18 L-12 18 L12 18 L18 -18',
    hasSize: true, hasFabric: true, hasTechnique: true, hasPosition: true },
  { id: 'sweat', group: 'vestuario', label: 'Sweatshirt', basePrice: 22,
    icon: 'M-65 -35 L-95 -5 L-75 25 L-55 15 L-55 70 L55 70 L55 15 L75 25 L95 -5 L65 -35 L45 -35 C45 -12 22 0 0 0 C-22 0 -45 -12 -45 -35 Z',
    hasSize: true, hasFabric: true, hasTechnique: true, hasPosition: true },
  { id: 'tracksuit', group: 'vestuario', label: 'Fato Treino', basePrice: 32,
    icon: 'M-50 -25 L-65 25 L-50 35 L-45 80 L-12 80 L-12 12 L12 12 L12 80 L45 80 L50 35 L65 25 L50 -25 L22 -25 L0 -8 L-22 -25 Z',
    hasSize: true, hasFabric: true, hasTechnique: true, hasPosition: true },
  { id: 'cap', group: 'vestuario', label: 'Boné', basePrice: 9,
    icon: 'M-50 20 L50 20 L50 -8 C50 -38 -50 -38 -50 -8 Z M-50 20 L65 25 L65 38 L-50 38 Z',
    hasTechnique: true, hasPosition: true },
  { id: 'tote', group: 'vestuario', label: 'Tote Bag', basePrice: 7,
    icon: 'M-50 -12 L-50 68 L50 68 L50 -12 Z M-28 -12 C-28 -42 28 -42 28 -12',
    hasTechnique: true, hasPosition: true },
  { id: 'mousepad', group: 'vestuario', label: 'Tapete Rato XL', basePrice: 8,
    icon: 'M-85 -35 L85 -35 L85 35 L-85 35 Z M-70 -20 L70 -20 M-70 0 L70 0 M-70 20 L70 20',
    hasTechnique: true },
  // IT
  { id: 'phonecase', group: 'it', label: 'Capa Telemóvel', basePrice: 15,
    icon: 'M-35 -60 L35 -60 L35 60 L-35 60 Z M-15 -48 L15 -48 M18 -38 L28 -38 L28 -28 L18 -28 Z',
    hasModel: true, hasMaterial: true, hasFinish: true },
  { id: 'popsocket', group: 'it', label: 'PopSocket / Grip', basePrice: 8,
    icon: 'M0 0 m-40 0 a40 40 0 1 0 80 0 a40 40 0 1 0 -80 0 M0 0 m-15 0 a15 15 0 1 0 30 0 a15 15 0 1 0 -30 0',
    hasFinish: true },
  { id: 'airpods', group: 'it', label: 'Case AirPods', basePrice: 12,
    icon: 'M-40 -25 C-40 -55 40 -55 40 -25 L40 30 C40 55 -40 55 -40 30 Z M-40 -10 L40 -10',
    hasModel: true, hasFinish: true },
  { id: 'laptop-skin', group: 'it', label: 'Skin Portátil', basePrice: 18,
    icon: 'M-70 -40 L70 -40 L70 40 L-70 40 Z M-70 -25 L70 -25 M-45 5 L45 5',
    hasModel: true, hasFinish: true },
  { id: 'phonemount', group: 'it', label: 'Suporte Auto', basePrice: 10,
    icon: 'M-35 -30 L35 -30 L35 25 L-35 25 Z M0 25 L0 42 L-12 52 M0 42 L12 52 M-15 -5 L15 -5 M-15 5 L15 5',
    hasFinish: true },
  { id: 'cable', group: 'it', label: 'Cabo Personalizado', basePrice: 6,
    icon: 'M-70 -8 L-70 8 L-55 8 L-55 -8 Z M-55 0 C-30 -30 30 30 55 0 M55 -8 L55 8 L70 8 L70 -8 Z',
    hasFinish: true },
]

// Cores base disponíveis
const CUST_COLORS = [
  { hex: '#F5F2ED', key: 'ivory', label: 'Marfim' },
  { hex: '#0B0B0C', key: 'black', label: 'Preto' },
  { hex: '#8B1E2D', key: 'bordo', label: 'Bordo' },
  { hex: '#B08D57', key: 'gold', label: 'Gold' },
  { hex: '#1a3a5c', key: 'navy', label: 'Navy' },
  { hex: '#2d5a27', key: 'olive', label: 'Verde-oliva' },
  { hex: '#5c3317', key: 'brown', label: 'Castanho' },
  { hex: '#808080', key: 'gray', label: 'Cinzento' },
  { hex: '#c94b2d', key: 'terracotta', label: 'Terracota' },
  { hex: '#e8c84a', key: 'yellow', label: 'Amarelo' },
]

const CUST_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const CUST_FABRICS = [
  { id: 'cotton', label: 'Algodão 100%', mult: 1, note: 'Respirável · Durável' },
  { id: 'cotton_poly', label: 'Algodão/Poliéster', mult: 0.9, note: 'Anti-rugas · Económico' },
  { id: 'organic', label: 'Algodão Orgânico', mult: 1.25, note: 'Sustentável · Certificado GOTS' },
  { id: 'premium', label: 'Premium Pima', mult: 1.55, note: 'Suave · Luxo' },
]
const CUST_TECHNIQUES = [
  { id: 'embroidery', label: 'Bordado', add: 6, note: 'Elegante · Alta durabilidade' },
  { id: 'dtg', label: 'Impressão DTG', add: 4, note: 'Cores vivas · Foto-realismo' },
  { id: 'screen', label: 'Serigrafia', add: 3, note: 'Ideal ≥ 20 unidades' },
  { id: 'vinyl', label: 'Vinil Térmico', add: 5, note: 'Acabamento premium' },
]
const CUST_POSITIONS = [
  { id: 'chest', label: 'Peito', x: 0, y: -8 },
  { id: 'back', label: 'Costas', x: 0, y: 15 },
  { id: 'sleeve', label: 'Manga', x: -60, y: 0 },
  { id: 'center', label: 'Centro', x: 0, y: 5 },
]
const IT_MATERIALS = [
  { id: 'silicone', label: 'Silicone', mult: 1, note: 'Flexível · Anti-choque' },
  { id: 'hard', label: 'Rígida (PC)', mult: 1.1, note: 'Resistente · Fina' },
  { id: 'clear', label: 'Transparente', mult: 1.05, note: 'Mostra o design do telemóvel' },
  { id: 'leather', label: 'Couro Sintético', mult: 1.6, note: 'Premium · Elegante' },
]
const IT_FINISHES = [
  { id: 'matte', label: 'Mate', mult: 1 },
  { id: 'glossy', label: 'Brilhante', mult: 1.05 },
]
const IT_MODELS = [
  'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13',
  'Samsung S24 Ultra', 'Samsung S24', 'Samsung S23', 'Samsung A54',
  'Xiaomi 13 Pro', 'Google Pixel 8', 'Outro (indicar nas notas)',
]

// ─── Sparkles component ───────────────────────────────────────────────────
function Sparkles({ trigger }: { trigger: number }) {
  const [items, setItems] = useState<{ id: number; x: number; y: number; dx: number; dy: number; rot: number }[]>([])
  useEffect(() => {
    if (trigger === 0) return
    const now = Date.now()
    const arr: any[] = []
    for (let i = 0; i < 12; i++) {
      arr.push({
        id: now + i,
        x: 50 + (Math.random() - 0.5) * 20,
        y: 50 + (Math.random() - 0.5) * 20,
        dx: (Math.random() - 0.5) * 200,
        dy: (Math.random() - 0.5) * 200 - 60,
        rot: Math.random() * 720 - 360,
      })
    }
    setItems(arr)
    const t = setTimeout(() => setItems([]), 1100)
    return () => clearTimeout(t)
  }, [trigger])
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 20 }}>
      {items.map(s => (
        <div key={s.id} style={{
          position: 'absolute', left: s.x + '%', top: s.y + '%',
          width: 12, height: 12,
          animation: 'kn-spark 1s cubic-bezier(.2,.7,.2,1) forwards',
          ['--dx' as any]: s.dx + 'px', ['--dy' as any]: s.dy + 'px', ['--rot' as any]: s.rot + 'deg',
        }}>
          <svg viewBox="0 0 12 12" width="12" height="12">
            <path d="M6 0 L7.5 4.5 L12 6 L7.5 7.5 L6 12 L4.5 7.5 L0 6 L4.5 4.5 Z" fill="#B08D57" />
          </svg>
        </div>
      ))}
    </div>
  )
}

// ─── Live Preview ─────────────────────────────────────────────────────────
function LivePreview({ product, baseColor, uploadUrl, textOverlay, position, group, t }: {
  product: CustProduct | null; baseColor: string; uploadUrl: string; textOverlay: string;
  position: string; group: CustGroup; t: (k: TKey) => string
}) {
  const accent = group === 'it' ? '#8B1E2D' : '#B08D57'
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const pos = CUST_POSITIONS.find(p => p.id === position) || CUST_POSITIONS[0]
  const isLight = ['#F5F2ED', '#B08D57', '#e8c84a', '#808080'].includes(baseColor)

  return (
    <div style={{
      position: 'sticky', top: 100, minHeight: 520, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `radial-gradient(600px 400px at 50% 40%, ${accent}22, transparent 70%), var(--bg-2)`,
      border: '1px solid var(--border)', overflow: 'hidden', borderRadius: 4,
    }}>
      {/* Grain */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
        <filter id="cust-grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" /><feColorMatrix values="0 0 0 0 0.75 0 0 0 0 0.6 0 0 0 0 0.4 0 0 0 0.15 0" /></filter>
        <rect width="100%" height="100%" filter="url(#cust-grain)" />
      </svg>

      {/* Corner brackets */}
      {[{ t: 12, l: 12, b: 'B', b2: 'L' }, { t: 12, r: 12, b: 'B', b2: 'R' }, { b: 12, l: 12, b1: 'T', b2: 'L' }, { b: 12, r: 12, b1: 'T', b2: 'R' }].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', width: 24, height: 24, pointerEvents: 'none',
          top: c.t as any, bottom: c.b as any, left: c.l as any, right: c.r as any,
          borderTop: c.b1 !== 'T' && (c.b === 'B' || c.t) ? `1px solid ${accent}` : 'none',
          borderBottom: c.b === 12 ? `1px solid ${accent}` : 'none',
          borderLeft: c.b2 === 'L' ? `1px solid ${accent}` : 'none',
          borderRight: c.b2 === 'R' ? `1px solid ${accent}` : 'none',
        } as any} />
      ))}

      {product ? (
        <div style={{
          position: 'relative',
          animation: mounted ? 'kn-float 4s ease-in-out infinite, kn-fadeUp .6s var(--ease) both' : 'none',
          filter: 'drop-shadow(0 20px 30px rgba(0,0,0,.4))',
        }}>
          <svg viewBox="-120 -100 240 220" width="380" height="360" style={{ maxWidth: '100%' }}>
            {/* Produto — cor base viva */}
            <g transform="translate(0 5)">
              <path d={product.icon} fill={baseColor} stroke={isLight ? '#00000030' : '#ffffff20'} strokeWidth="1.2" />
              {/* Design/upload sobreposto */}
              {uploadUrl && product.hasPosition && (
                <image href={uploadUrl} x={pos.x - 20} y={pos.y - 20} width={40} height={40} preserveAspectRatio="xMidYMid meet" />
              )}
              {uploadUrl && !product.hasPosition && (
                <image href={uploadUrl} x={-30} y={-15} width={60} height={30} preserveAspectRatio="xMidYMid meet" />
              )}
              {/* Texto */}
              {textOverlay && (
                <text
                  x={product.hasPosition ? pos.x : 0}
                  y={product.hasPosition ? pos.y + (uploadUrl ? 12 : 0) : (uploadUrl ? 12 : 5)}
                  textAnchor="middle"
                  fontFamily="Inter, sans-serif"
                  fontSize={product.hasPosition ? 8 : 10}
                  fontWeight="600"
                  fill={isLight ? '#0B0B0C' : '#F5F2ED'}
                >
                  {textOverlay.slice(0, 20)}
                </text>
              )}
            </g>
          </svg>

          {/* Label do produto */}
          <div style={{
            position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
            padding: '4px 14px', background: 'rgba(11,11,12,.85)', border: `1px solid ${accent}55`, backdropFilter: 'blur(8px)',
            fontSize: 10, letterSpacing: '.24em', textTransform: 'uppercase', color: accent, whiteSpace: 'nowrap',
          }}>
            {t(('cust_prod_' + product.id.replace('-', '_')) as TKey)}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--fg-mute)', padding: 40 }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, marginBottom: 8, color: accent, opacity: .7 }}>{t('cust_preview_title')}</div>
          <div style={{ fontSize: 13 }}>{t('cust_preview_sub')}</div>
        </div>
      )}
    </div>
  )
}

// ─── Kit Card ─────────────────────────────────────────────────────────────
function KitCard({ n, title, subtitle, done, active, onToggle, children, accent }: {
  n: number; title: string; subtitle?: string; done: boolean; active: boolean; onToggle: () => void; children: ReactNode; accent: string
}) {
  return (
    <div style={{
      border: `1px solid ${done ? accent : 'var(--border)'}`,
      background: active ? 'rgba(176,141,87,.05)' : 'var(--bg-1)',
      transition: 'all .3s var(--ease)',
      transform: active ? 'translateX(-4px)' : 'none',
      position: 'relative',
    }}>
      <button onClick={onToggle} style={{
        width: '100%', padding: '16px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: '50%',
          background: done ? accent : 'var(--bg-3)',
          border: done ? 'none' : `1px solid var(--border-2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: done ? '#0B0B0C' : 'var(--fg-mute)', flexShrink: 0,
        }}>
          {done ? '✓' : n}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 500, color: active || done ? 'var(--fg)' : 'var(--fg-dim)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: done ? accent : 'var(--fg-mute)', marginTop: 2, letterSpacing: '.06em' }}>{subtitle}</div>}
        </div>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--fg-mute)', transition: 'transform .3s', transform: active ? 'rotate(180deg)' : 'none' }}>
          <path d="M1 1.5l5 5 5-5" />
        </svg>
      </button>
      {active && (
        <div style={{ padding: '0 18px 18px', animation: 'kn-fadeUp .3s var(--ease) both' }}>{children}</div>
      )}
    </div>
  )
}

// ─── Estimativa Sticky ────────────────────────────────────────────────────
function EstimativaSticky({ total, unit, qty, hint, accent, t }: { total: number; unit: number; qty: number; hint: string; accent: string; t: (k: TKey) => string }) {
  const [pulse, setPulse] = useState(0)
  useEffect(() => { setPulse(p => p + 1) }, [total])
  return (
    <div style={{
      position: 'sticky', top: 100, marginTop: 20,
      padding: '20px 22px', border: `1px solid ${accent}55`, background: 'rgba(11,11,12,.85)', backdropFilter: 'blur(12px)',
      borderRadius: 4,
    }}>
      <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: accent, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, boxShadow: `0 0 10px ${accent}` }} />
        {t('cust_estimate_label')}
      </div>
      {total > 0 ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-mute)' }}>{t('cust_price_unit')}</span>
            <span style={{ fontSize: 15, color: 'var(--fg)' }}>{unit.toFixed(2)} €</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-mute)' }}>{t('cust_price_qty')}</span>
            <span style={{ fontSize: 15, color: 'var(--fg)' }}>× {qty}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--fg-mute)' }}>{t('cust_price_total')}</span>
            <span key={pulse} style={{
              fontFamily: 'var(--f-display)', fontSize: 32, fontWeight: 500, color: accent,
              animation: 'kn-priceFlash .35s ease-out',
            }}>{total.toFixed(2)} €</span>
          </div>
          {hint && <div style={{ marginTop: 10, padding: '6px 10px', background: `${accent}11`, border: `1px solid ${accent}44`, fontSize: 10, letterSpacing: '.06em', color: accent, textAlign: 'center' }}>✓ {hint}</div>}
        </>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--fg-mute)', textAlign: 'center', padding: '8px 0' }}>
          {t('cust_price_empty')}
        </div>
      )}
    </div>
  )
}

// ─── Customizer V2 Main ───────────────────────────────────────────────────
function CustomizerV2({ setPage, onAddToCart }: { setPage: (p: Page) => void; onAddToCart: (item: any) => void }) {
  const { t } = useLang()
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [group, setGroup] = useState<CustGroup>('vestuario')
  const [product, setProduct] = useState<CustProduct | null>(null)
  const [color, setColor] = useState('#F5F2ED')
  const [size, setSize] = useState('M')
  const [fabric, setFabric] = useState('cotton')
  const [technique, setTechnique] = useState('dtg')
  const [material, setMaterial] = useState('silicone')
  const [finish, setFinish] = useState('matte')
  const [model, setModel] = useState('iPhone 15 Pro')
  const [position, setPosition] = useState('chest')
  const [textOverlay, setTextOverlay] = useState('')
  const [uploadUrl, setUploadUrl] = useState('')
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [activeCard, setActiveCard] = useState<string | null>('color')
  const [sparkleTick, setSparkleTick] = useState(0)
  const [sent, setSent] = useState<'quote' | 'cart' | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const accent = group === 'it' ? '#8B1E2D' : '#B08D57'

  // Estimativa
  const estimate = (() => {
    if (!product) return { unit: 0, total: 0, hint: '' }
    let unit = product.basePrice
    if (product.hasFabric) unit *= (CUST_FABRICS.find(f => f.id === fabric)?.mult || 1)
    if (product.hasMaterial) unit *= (IT_MATERIALS.find(m => m.id === material)?.mult || 1)
    if (product.hasFinish) unit *= (IT_FINISHES.find(f => f.id === finish)?.mult || 1)
    if (product.hasTechnique) unit += (CUST_TECHNIQUES.find(t => t.id === technique)?.add || 0)
    if (uploadUrl) unit += 3
    // Desconto por quantidade
    let discountMult = 1; let hint = ''
    if (qty >= 100) { discountMult = 0.75; hint = 'Desconto 25% (100+ un.)' }
    else if (qty >= 50) { discountMult = 0.82; hint = 'Desconto 18% (50+ un.)' }
    else if (qty >= 20) { discountMult = 0.9; hint = 'Desconto 10% (20+ un.)' }
    else if (qty >= 10) { discountMult = 0.95; hint = 'Desconto 5% (10+ un.)' }
    unit = +(unit * discountMult).toFixed(2)
    return { unit, total: +(unit * qty).toFixed(2), hint }
  })()

  // Progresso
  const isStep1Done = !!product
  const isStep2Done = !!product && !!color && (!product.hasSize || !!size) && (!product.hasFabric || !!fabric)
  const isStep3Done = !!name && !!email

  // Helpers de tradução para labels de dados
  const colorLabel = (hex: string): string => {
    const c = CUST_COLORS.find(cc => cc.hex === hex)
    return c ? t(('cust_color_' + c.key) as TKey) : hex
  }
  const fabricLabel = (id: string): string => {
    const f = CUST_FABRICS.find(ff => ff.id === id); if (!f) return id
    return t(('cust_fabric_' + f.id) as TKey)
  }
  const materialLabel = (id: string): string => {
    const m = IT_MATERIALS.find(mm => mm.id === id); if (!m) return id
    return t(('cust_material_' + m.id) as TKey)
  }
  const finishLabel = (id: string): string => t(('cust_finish_' + id) as TKey)
  const techniqueLabel = (id: string): string => {
    const tk = CUST_TECHNIQUES.find(tt => tt.id === id); if (!tk) return id
    return t(('cust_tech_' + tk.id) as TKey)
  }
  const positionLabel = (id: string): string => t(('cust_position_' + id) as TKey)
  const productLabel = (p: CustProduct): string => t(('cust_prod_' + p.id.replace('-', '_')) as TKey)

  // Sub-etapa 2: cartas
  const cards: { id: string; title: string; sub?: string; when: () => boolean }[] = []
  if (product) {
    cards.push({ id: 'color', title: t('cust_card_color'), sub: colorLabel(color), when: () => true })
    if (product.hasModel) cards.push({ id: 'model', title: t('cust_card_model'), sub: model, when: () => true })
    if (product.hasSize) cards.push({ id: 'size', title: t('cust_card_size'), sub: size, when: () => true })
    if (product.hasFabric) cards.push({ id: 'fabric', title: t('cust_card_fabric'), sub: fabricLabel(fabric), when: () => true })
    if (product.hasMaterial) cards.push({ id: 'material', title: t('cust_card_material'), sub: materialLabel(material), when: () => true })
    if (product.hasFinish) cards.push({ id: 'finish', title: t('cust_card_finish'), sub: finishLabel(finish), when: () => true })
    if (product.hasTechnique) cards.push({ id: 'technique', title: t('cust_card_technique'), sub: techniqueLabel(technique), when: () => true })
    cards.push({ id: 'design', title: t('cust_card_design'), sub: uploadUrl ? t('cust_image_loaded') : t('cust_none'), when: () => true })
    if (product.hasPosition) cards.push({ id: 'position', title: t('cust_card_position'), sub: positionLabel(position), when: () => true })
    cards.push({ id: 'text', title: t('cust_card_text'), sub: textOverlay || t('cust_none'), when: () => true })
    cards.push({ id: 'qty', title: t('cust_card_qty'), sub: qty + ' ' + t('cust_units'), when: () => true })
    cards.push({ id: 'notes', title: t('cust_card_notes'), sub: notes ? notes.slice(0, 30) + (notes.length > 30 ? '…' : '') : t('cust_none_f'), when: () => true })
  }

  function fireSparkle() { setSparkleTick(v => v + 1) }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = ev => { setUploadUrl(String(ev.target?.result || '')); fireSparkle() }
    reader.readAsDataURL(f)
  }

  async function handleSubmit(mode: 'quote' | 'cart') {
    if (!name.trim() || !email.trim()) { setErr(t('cust_err_contacts')); return }
    setErr(''); setLoading(true)
    const payload = {
      formulario: 'Personalização V2',
      artigo: product ? productLabel(product) : '', vertical: group,
      cor: colorLabel(color),
      ...(product?.hasSize ? { tamanho: size } : {}),
      ...(product?.hasFabric ? { material: fabricLabel(fabric) } : {}),
      ...(product?.hasMaterial ? { material_capa: materialLabel(material) } : {}),
      ...(product?.hasModel ? { modelo: model } : {}),
      ...(product?.hasFinish ? { acabamento: finishLabel(finish) } : {}),
      ...(product?.hasTechnique ? { tecnica: techniqueLabel(technique) } : {}),
      ...(product?.hasPosition ? { posicao: positionLabel(position) } : {}),
      texto: textOverlay || '—',
      tem_upload: uploadUrl ? 'Sim' : 'Não',
      quantidade: qty + ' ' + t('cust_units'),
      estimativa_unit: estimate.unit + '€',
      estimativa_total: estimate.total + '€',
      notas: notes || '—',
      nome: name, email, telefone: phone || '—',
      metodo: mode === 'quote' ? 'Pedido de orçamento' : 'Pagamento direto (estimativa)',
    }
    try {
      if (mode === 'quote') {
        // Formspree
        const fd = new FormData()
        Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)))
        await fetch('https://formspree.io/f/xeeyzlvb', { method: 'POST', headers: { Accept: 'application/json' }, body: fd })
      } else {
        // Adicionar ao carrinho
        onAddToCart({
          id: Date.now(),
          name: `${product ? productLabel(product) : ''} ${t('cust_customized')}`,
          category: t('cust_cat_personalization'),
          price: estimate.unit,
          image: '',
          qty,
          _customization: payload,
        })
      }
      setSent(mode); fireSparkle()
    } catch { setErr(t('cust_err_network')) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: `radial-gradient(1000px 500px at 20% -10%, ${accent}18, transparent 60%), radial-gradient(800px 400px at 80% 100%, ${accent}12, transparent 60%), var(--bg)` }}>
      {/* Grão subtle */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.14, mixBlendMode: 'overlay', pointerEvents: 'none', zIndex: 0 }}>
        <filter id="page-grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" /><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.3 0" /></filter>
        <rect width="100%" height="100%" filter="url(#page-grain)" />
      </svg>

      <Sparkles trigger={sparkleTick} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* HERO / progress */}
        <div style={{ padding: 'clamp(48px,6vw,80px) var(--pad-x) 32px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
            <Eyebrow text={t('cust_eyebrow')} />
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(40px,5vw,72px)', fontWeight: 500, margin: '18px 0 14px', lineHeight: 1.05 }}
              dangerouslySetInnerHTML={{ __html: t('cust_title').replace('<em>', `<em style="color:${accent};font-style:italic">`) }} />
            <p style={{ color: 'var(--fg-dim)', fontSize: 16, maxWidth: '54ch', lineHeight: 1.65, marginBottom: 32 }}>
              {t('cust_desc')}
            </p>

            {/* Progress steps */}
            <div style={{ display: 'flex', gap: 4, marginTop: 24, maxWidth: 640 }}>
              {[t('cust_step_1'), t('cust_step_2'), t('cust_step_3'), t('cust_step_4')].map((label, i) => (
                <div key={label} style={{ flex: 1, position: 'relative' }}>
                  <div style={{
                    height: 4, background: i <= step ? accent : 'var(--bg-3)',
                    transition: 'background .4s ease', borderRadius: 2,
                  }} />
                  <div style={{ marginTop: 8, fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: i === step ? accent : i < step ? 'var(--fg)' : 'var(--fg-mute)', fontWeight: i === step ? 600 : 400 }}>
                    {i < step ? '✓ ' : ''}{i + 1}. {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STEP CONTENT */}
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: 'clamp(40px,5vw,72px) var(--pad-x)' }}>
          {/* STEP 0 - Categoria */}
          {step === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, animation: 'kn-fadeUp .5s var(--ease) both' }}>
              {([
                { g: 'vestuario' as CustGroup, label: t('vert_vestuario'), desc: t('cust_step0_vestuario_desc'), acc: '#B08D57', icon: 'M-60 -25 L-90 0 L-70 30 L-50 20 L-50 65 L50 65 L50 20 L70 30 L90 0 L60 -25 L40 -25 C40 -5 20 5 0 5 C-20 5 -40 -5 -40 -25 Z' },
                { g: 'it' as CustGroup, label: t('vert_it'), desc: t('cust_step0_it_desc'), acc: '#8B1E2D', icon: 'M-70 -40 L70 -40 L70 30 L-70 30 Z M-90 30 L90 30 L82 42 L-82 42 Z' },
              ]).map(opt => (
                <button key={opt.g} onClick={() => { setGroup(opt.g); setStep(1); fireSparkle() }} style={{
                  padding: '48px 32px', background: 'rgba(11,11,12,.65)', border: `1px solid ${opt.acc}55`, cursor: 'pointer', textAlign: 'left',
                  transition: 'all .3s var(--ease)', position: 'relative', overflow: 'hidden', minHeight: 320,
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = opt.acc; el.style.transform = 'translateY(-6px)'
                    el.style.boxShadow = `0 24px 60px ${opt.acc}30`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = `${opt.acc}55`; el.style.transform = 'none'; el.style.boxShadow = 'none'
                  }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${opt.acc}, transparent)` }} />
                  <svg viewBox="-100 -60 200 130" width="140" height="80" style={{ display: 'block', marginBottom: 20 }}>
                    <path d={opt.icon} fill="none" stroke={opt.acc} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: opt.acc, marginBottom: 12 }}>{t('cust_step0_vert_label')}</div>
                  <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 36, fontWeight: 500, margin: '0 0 12px' }}>{opt.label}</h2>
                  <p style={{ color: 'var(--fg-dim)', fontSize: 14, lineHeight: 1.65, marginBottom: 24 }}>{opt.desc}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: opt.acc, fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 600 }}>
                    {t('cust_choose')}
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h12M9 1l4 4-4 4" /></svg>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 1 - Produto base */}
          {step === 1 && (
            <div style={{ animation: 'kn-fadeUp .5s var(--ease) both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button onClick={() => setStep(0)} style={{ background: 'transparent', border: 'none', color: 'var(--fg-mute)', fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 5H1M5 1L1 5l4 4" /></svg>
                  {t('cust_back')}
                </button>
                <span style={{ color: 'var(--border-2)' }}>·</span>
                <span style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: accent }}>
                  {group === 'vestuario' ? t('vert_vestuario') : t('vert_it')}
                </span>
              </div>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 32, fontWeight: 500, margin: '0 0 8px' }}>{t('cust_step1_title')}</h2>
              <p style={{ color: 'var(--fg-mute)', fontSize: 14, marginBottom: 32 }}>{t('cust_step1_sub')}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
                {CUST_PRODUCTS.filter(p => p.group === group).map(p => (
                  <button key={p.id} onClick={() => { setProduct(p); setStep(2); fireSparkle() }} style={{
                    padding: '24px 16px', background: 'rgba(11,11,12,.6)', border: `1px solid ${accent}33`, cursor: 'pointer',
                    transition: 'all .25s var(--ease)', textAlign: 'center', position: 'relative', minHeight: 200,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = accent; el.style.transform = 'translateY(-4px)'; el.style.background = 'rgba(11,11,12,.85)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = `${accent}33`; el.style.transform = 'none'; el.style.background = 'rgba(11,11,12,.6)'
                    }}>
                    <svg viewBox="-100 -80 200 180" width="90" height="80">
                      <path d={p.icon} fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div>
                      <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, fontWeight: 500 }}>{productLabel(p)}</div>
                      <div style={{ fontSize: 11, color: accent, marginTop: 4, letterSpacing: '.08em' }}>{t('cust_from')} {p.basePrice}€</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 - Kit builder + preview */}
          {step === 2 && product && (
            <div style={{ animation: 'kn-fadeUp .5s var(--ease) both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <button onClick={() => setStep(1)} style={{ background: 'transparent', border: 'none', color: 'var(--fg-mute)', fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 5H1M5 1L1 5l4 4" /></svg>
                  {t('cust_change_product')}
                </button>
                <span style={{ color: 'var(--border-2)' }}>·</span>
                <span style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: accent }}>{productLabel(product)}</span>
              </div>

              <div className="kn-cust-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 32, alignItems: 'start' }}>
                {/* PREVIEW */}
                <LivePreview product={product} baseColor={color} uploadUrl={uploadUrl} textOverlay={textOverlay} position={position} group={group} t={t} />

                {/* KIT BUILDER */}
                <div>
                  <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 24, fontWeight: 500, margin: '0 0 4px' }}>{t('cust_kit_builder')}</h2>
                  <p style={{ color: 'var(--fg-mute)', fontSize: 12, marginBottom: 20, letterSpacing: '.06em' }}>{t('cust_kit_builder_sub')}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {cards.map((c, i) => (
                      <KitCard key={c.id} n={i + 1} title={c.title} subtitle={c.sub} done={!!c.sub && c.sub !== t('cust_none') && c.sub !== t('cust_none_f') && c.sub !== '—'} active={activeCard === c.id} onToggle={() => setActiveCard(activeCard === c.id ? null : c.id)} accent={accent}>
                        {c.id === 'color' && (
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {CUST_COLORS.map(cc => (
                              <button key={cc.hex} onClick={() => { setColor(cc.hex); fireSparkle() }} title={colorLabel(cc.hex)} style={{
                                width: 36, height: 36, borderRadius: '50%', background: cc.hex,
                                border: color === cc.hex ? `3px solid ${accent}` : `2px solid ${cc.hex === '#F5F2ED' ? 'var(--border)' : 'transparent'}`,
                                cursor: 'pointer', transition: 'transform .15s', outline: 'none',
                                transform: color === cc.hex ? 'scale(1.15)' : 'scale(1)',
                              }} />
                            ))}
                          </div>
                        )}
                        {c.id === 'model' && (
                          <select value={model} onChange={e => setModel(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--f-sans)', fontSize: 14 }}>
                            {IT_MODELS.map(m => <option key={m}>{m}</option>)}
                          </select>
                        )}
                        {c.id === 'size' && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {CUST_SIZES.map(s => (
                              <button key={s} onClick={() => setSize(s)} style={{
                                minWidth: 46, height: 40, background: size === s ? accent : 'transparent',
                                border: `1px solid ${size === s ? accent : 'var(--border)'}`,
                                color: size === s ? '#0B0B0C' : 'var(--fg)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                              }}>{s}</button>
                            ))}
                          </div>
                        )}
                        {c.id === 'fabric' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {CUST_FABRICS.map(f => (
                              <button key={f.id} onClick={() => setFabric(f.id)} style={{
                                padding: '12px 14px', background: fabric === f.id ? `${accent}18` : 'transparent',
                                border: `1px solid ${fabric === f.id ? accent : 'var(--border)'}`,
                                textAlign: 'left', cursor: 'pointer', transition: 'all .15s',
                              }}>
                                <div style={{ fontSize: 13, color: fabric === f.id ? accent : 'var(--fg)', fontWeight: 500 }}>{fabricLabel(f.id)}</div>
                                <div style={{ fontSize: 11, color: 'var(--fg-mute)', marginTop: 2 }}>{t(('cust_fabric_' + f.id + '_note') as TKey)}</div>
                              </button>
                            ))}
                          </div>
                        )}
                        {c.id === 'material' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {IT_MATERIALS.map(m => (
                              <button key={m.id} onClick={() => setMaterial(m.id)} style={{
                                padding: '12px 14px', background: material === m.id ? `${accent}18` : 'transparent',
                                border: `1px solid ${material === m.id ? accent : 'var(--border)'}`,
                                textAlign: 'left', cursor: 'pointer', transition: 'all .15s',
                              }}>
                                <div style={{ fontSize: 13, color: material === m.id ? accent : 'var(--fg)', fontWeight: 500 }}>{materialLabel(m.id)}</div>
                                <div style={{ fontSize: 11, color: 'var(--fg-mute)', marginTop: 2 }}>{t(('cust_material_' + m.id + '_note') as TKey)}</div>
                              </button>
                            ))}
                          </div>
                        )}
                        {c.id === 'finish' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            {IT_FINISHES.map(f => (
                              <button key={f.id} onClick={() => setFinish(f.id)} style={{
                                flex: 1, padding: '10px', background: finish === f.id ? accent : 'transparent',
                                border: `1px solid ${finish === f.id ? accent : 'var(--border)'}`,
                                color: finish === f.id ? '#0B0B0C' : 'var(--fg)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                              }}>{finishLabel(f.id)}</button>
                            ))}
                          </div>
                        )}
                        {c.id === 'technique' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            {CUST_TECHNIQUES.map(tk => (
                              <button key={tk.id} onClick={() => setTechnique(tk.id)} style={{
                                padding: '12px', background: technique === tk.id ? `${accent}18` : 'transparent',
                                border: `1px solid ${technique === tk.id ? accent : 'var(--border)'}`,
                                textAlign: 'left', cursor: 'pointer', transition: 'all .15s',
                              }}>
                                <div style={{ fontSize: 12, color: technique === tk.id ? accent : 'var(--fg)', fontWeight: 600 }}>{techniqueLabel(tk.id)}</div>
                                <div style={{ fontSize: 10, color: 'var(--fg-mute)', marginTop: 2 }}>+{tk.add}€</div>
                              </button>
                            ))}
                          </div>
                        )}
                        {c.id === 'design' && (
                          <div>
                            <label style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              padding: '14px', border: `1px dashed ${uploadUrl ? accent : 'var(--border-2)'}`,
                              background: uploadUrl ? `${accent}08` : 'transparent',
                              cursor: 'pointer', transition: 'all .2s',
                            }}>
                              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={uploadUrl ? accent : 'var(--fg-mute)'} strokeWidth="1.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                              </svg>
                              <span style={{ fontSize: 12, color: uploadUrl ? accent : 'var(--fg-mute)', letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500 }}>
                                {uploadUrl ? t('cust_image_loaded_check') : t('cust_upload_hint')}
                              </span>
                            </label>
                            {uploadUrl && (
                              <button onClick={() => setUploadUrl('')} style={{ marginTop: 8, background: 'transparent', border: 'none', color: 'var(--fg-mute)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                                {t('cust_remove')}
                              </button>
                            )}
                          </div>
                        )}
                        {c.id === 'position' && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
                            {CUST_POSITIONS.map(p => (
                              <button key={p.id} onClick={() => setPosition(p.id)} style={{
                                padding: '10px', background: position === p.id ? accent : 'transparent',
                                border: `1px solid ${position === p.id ? accent : 'var(--border)'}`,
                                color: position === p.id ? '#0B0B0C' : 'var(--fg)', fontSize: 12, cursor: 'pointer',
                              }}>{positionLabel(p.id)}</button>
                            ))}
                          </div>
                        )}
                        {c.id === 'text' && (
                          <input type="text" value={textOverlay} onChange={e => setTextOverlay(e.target.value)} placeholder={t('cust_text_placeholder')} maxLength={30} style={{
                            width: '100%', padding: '10px 12px', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', fontSize: 14, boxSizing: 'border-box',
                          }} />
                        )}
                        {c.id === 'qty' && (
                          <div>
                            <input type="range" min={1} max={500} value={qty} onChange={e => setQty(+e.target.value)} style={{ width: '100%', accentColor: accent }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-mute)', marginTop: 4 }}>
                              <span>1 un.</span>
                              <span style={{ color: accent, fontWeight: 600 }}>{qty} un.</span>
                              <span>500 un.</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                              {[1, 10, 25, 50, 100, 250].map(n => (
                                <button key={n} onClick={() => setQty(n)} style={{
                                  padding: '5px 12px', fontSize: 11,
                                  border: `1px solid ${qty === n ? accent : 'var(--border)'}`,
                                  background: qty === n ? `${accent}18` : 'transparent',
                                  color: qty === n ? accent : 'var(--fg-mute)', cursor: 'pointer',
                                }}>{n}</button>
                              ))}
                            </div>
                          </div>
                        )}
                        {c.id === 'notes' && (
                          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('cust_notes_placeholder')} rows={3} style={{
                            width: '100%', padding: '10px 12px', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', fontSize: 13, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'var(--f-sans)',
                          }} />
                        )}
                      </KitCard>
                    ))}
                  </div>

                  {/* Estimativa sticky (inline aqui abaixo do kit) */}
                  <EstimativaSticky total={estimate.total} unit={estimate.unit} qty={qty} hint={estimate.hint} accent={accent} t={t} />

                  {/* Next */}
                  <button onClick={() => { setStep(3); fireSparkle() }} style={{
                    marginTop: 20, width: '100%', padding: '18px', background: accent, border: 'none', color: '#0B0B0C',
                    fontFamily: 'var(--f-sans)', fontSize: 12, letterSpacing: '.24em', textTransform: 'uppercase', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'transform .2s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                    {t('cust_continue')}
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 5h12M9 1l4 4-4 4" /></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 - Enviar */}
          {step === 3 && product && (
            <div style={{ animation: 'kn-fadeUp .5s var(--ease) both', maxWidth: 780, margin: '0 auto' }}>
              {sent ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', border: `1px solid ${accent}`, background: `${accent}0f` }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.2" style={{ margin: '0 auto 24px' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 36, margin: '0 0 12px' }}>
                    {sent === 'quote' ? t('cust_sent_quote') : t('cust_sent_cart')}
                  </h2>
                  <p style={{ color: 'var(--fg-dim)', fontSize: 15, marginBottom: 32, maxWidth: '40ch', margin: '0 auto 32px' }}>
                    {sent === 'quote' ? t('cust_sent_quote_desc') : t('cust_sent_cart_desc')}
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => { setStep(0); setSent(null); setProduct(null); setUploadUrl(''); setTextOverlay(''); setNotes(''); setName(''); setEmail(''); setPhone('') }} style={{
                      padding: '14px 28px', background: 'transparent', border: `1px solid ${accent}`, color: accent,
                      fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer',
                    }}>{t('cust_new_piece')}</button>
                    <button onClick={() => setPage('home')} style={{
                      padding: '14px 28px', background: accent, border: 'none', color: '#0B0B0C',
                      fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer',
                    }}>{t('cust_back_shop')}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <button onClick={() => setStep(2)} style={{ background: 'transparent', border: 'none', color: 'var(--fg-mute)', fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <svg width="12" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 5H1M5 1L1 5l4 4" /></svg>
                      {t('cust_edit_config')}
                    </button>
                  </div>

                  <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 36, fontWeight: 500, margin: '0 0 8px' }}>{t('cust_step4_title')}</h2>
                  <p style={{ color: 'var(--fg-mute)', fontSize: 14, marginBottom: 32 }}>{t('cust_step4_sub')}</p>

                  {/* Resumo */}
                  <div style={{ background: 'var(--bg-1)', border: `1px solid ${accent}44`, padding: 24, marginBottom: 24 }}>
                    <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: accent, marginBottom: 16, fontWeight: 600 }}>{t('cust_summary')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginBottom: 16 }}>
                      {[
                        [t('cust_col_article'), productLabel(product)],
                        [t('cust_col_color'), colorLabel(color)],
                        ...(product.hasModel ? [[t('cust_card_model'), model]] : []),
                        ...(product.hasSize ? [[t('cust_card_size'), size]] : []),
                        ...(product.hasFabric ? [[t('cust_card_fabric'), fabricLabel(fabric)]] : []),
                        ...(product.hasMaterial ? [[t('cust_card_material'), materialLabel(material)]] : []),
                        ...(product.hasFinish ? [[t('cust_card_finish'), finishLabel(finish)]] : []),
                        ...(product.hasTechnique ? [[t('cust_card_technique'), techniqueLabel(technique)]] : []),
                        ...(product.hasPosition ? [[t('cust_card_position'), positionLabel(position)]] : []),
                        [t('cust_col_design'), uploadUrl ? t('cust_image_loaded') : '—'],
                        [t('cust_col_text'), textOverlay || '—'],
                        [t('cust_card_qty'), qty + ' ' + t('cust_units')],
                      ].map(([k, v]) => (
                        <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--fg-mute)', textTransform: 'uppercase' }}>{k}</span>
                          <span style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500 }}>{v as string}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 12, borderTop: `1px solid ${accent}55` }}>
                      <span style={{ fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--fg-mute)' }}>{t('cust_estimate_total')}</span>
                      <span style={{ fontFamily: 'var(--f-display)', fontSize: 36, fontWeight: 500, color: accent }}>{estimate.total.toFixed(2)} €</span>
                    </div>
                    {estimate.hint && <div style={{ marginTop: 8, fontSize: 11, color: accent, textAlign: 'right' }}>✓ {estimate.hint}</div>}
                  </div>

                  {/* Contactos */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: accent, marginBottom: 14, fontWeight: 600 }}>{t('cust_contact_title')}</div>
                    <div style={{ display: 'grid', gap: 14 }}>
                      <input type="text" placeholder={t('cust_name_ph')} value={name} onChange={e => setName(e.target.value)} style={{ padding: '13px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', fontSize: 14, boxSizing: 'border-box' }} />
                      <input type="email" placeholder={t('cust_email_ph')} value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '13px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', fontSize: 14, boxSizing: 'border-box' }} />
                      <input type="tel" placeholder={t('cust_phone_ph')} value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: '13px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', fontSize: 14, boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  {err && <div style={{ marginBottom: 16, padding: 12, background: 'rgba(139,30,45,.12)', border: '1px solid rgba(139,30,45,.3)', fontSize: 13, color: '#e06070' }}>⚠ {err}</div>}

                  {/* Dupla CTA */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button onClick={() => handleSubmit('quote')} disabled={loading} style={{
                      padding: '20px', background: 'transparent', border: `1px solid ${accent}`, color: accent,
                      fontFamily: 'var(--f-sans)', fontSize: 12, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 600,
                      cursor: loading ? 'wait' : 'pointer', transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: 6,
                    }}>
                      <span style={{ fontSize: 20 }}>🧾</span>
                      {t('cust_cta_quote')}
                      <span style={{ fontSize: 10, opacity: .7, letterSpacing: '.06em', textTransform: 'none' }}>{t('cust_cta_quote_sub')}</span>
                    </button>
                    <button onClick={() => handleSubmit('cart')} disabled={loading} style={{
                      padding: '20px', background: accent, border: 'none', color: '#0B0B0C',
                      fontFamily: 'var(--f-sans)', fontSize: 12, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 700,
                      cursor: loading ? 'wait' : 'pointer', transition: 'transform .2s', display: 'flex', flexDirection: 'column', gap: 6,
                    }}
                      onMouseEnter={e => !loading && ((e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'none')}>
                      <span style={{ fontSize: 20 }}>💳</span>
                      {t('cust_cta_pay')}
                      <span style={{ fontSize: 10, opacity: .7, letterSpacing: '.06em', textTransform: 'none', fontWeight: 500 }}>{t('cust_cta_pay_sub')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Keyframes CSS */}
      <style>{`
        @keyframes kn-fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes kn-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes kn-priceFlash { 0% { transform: scale(1); filter: brightness(1); } 40% { transform: scale(1.1); filter: brightness(1.4); } 100% { transform: scale(1); filter: brightness(1); } }
        @keyframes kn-spark {
          0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 0; }
          20% { opacity: 1; transform: translate(calc(var(--dx) * .2), calc(var(--dy) * .2)) rotate(calc(var(--rot) * .2)) scale(1); }
          100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0); opacity: 0; }
        }
        @media (max-width: 780px) {
          .kn-cust-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}


// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ setPage }: { setPage: (p: Page) => void }) {
  const { t, arr } = useLang()
  return (
    <footer style={{ background: '#08080a', borderTop: '1px solid var(--border)', padding: 'clamp(56px,6vw,80px) var(--pad-x) 36px' }}>
      <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
        <div className="kn-footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <img src={logoImg} alt="Karmic Node" style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--f-display)', fontSize: 19, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500 }}>
                Karmic<span style={{ color: 'var(--gold)' }}>·</span>Node
              </span>
            </div>
            <p style={{ color: 'var(--fg-mute)', fontSize: 14, lineHeight: 1.7, maxWidth: '30ch', marginBottom: 22 }}>
              {t('footer_desc')}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['instagram', 'facebook', 'linkedin'].map(s => (
                <a key={s} href="#" style={{ width: 36, height: 36, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-mute)', transition: 'all .2s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--fg-mute)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {s === 'instagram' && <><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></>}
                    {s === 'facebook' && <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />}
                    {s === 'linkedin' && <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></>}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {[
            { title: t('footer_shop'), links: arr('footer_shop_links').map((l) => ({ l, p: 'shop' as Page })) },
            { title: t('footer_company'), links: arr('footer_company_links').map((l, i) => ({ l, p: (['about', 'custom', 'blog', 'about', 'contact', 'contact'] as Page[])[i] })) },
            { title: t('footer_support'), links: arr('footer_support_links').map((l) => ({ l, p: 'home' as Page })) },
          ].map(col => (
            <div key={col.title}>
              <h5 style={{ fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, margin: '0 0 18px' }}>{col.title}</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(({ l, p }) => (
                  <li key={l}>
                    <a href="#" onClick={e => { e.preventDefault(); setPage(p) }}
                      style={{ color: 'var(--fg-dim)', fontSize: 14, transition: 'color .2s ease, padding-left .2s ease', display: 'inline-block' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; (e.currentTarget as HTMLElement).style.paddingLeft = '6px' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--fg-dim)'; (e.currentTarget as HTMLElement).style.paddingLeft = '0' }}>
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--fg-mute)', letterSpacing: '.04em' }}>
            {t('footer_copyright')}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {['MB', 'VISA', 'MC', 'PayPal', 'MBWay'].map(m => (
              <span key={m} style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--fg-mute)', border: '1px solid var(--border)', padding: '4px 8px' }}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Misc components ──────────────────────────────────────────────────────────

function Countdown() {
  const { t } = useLang()
  const [time, setTime] = useState({ h: 11, m: 42, s: 17 })
  useEffect(() => {
    const t = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev
        s--; if (s < 0) { s = 59; m-- } if (m < 0) { m = 59; h-- } if (h < 0) { h = 23; m = 59; s = 59 }
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 18 }}>{t('countdown_label')}</div>
      <div className="kn-promo-countdown" style={{ display: 'flex', gap: 14 }}>
        {[['h', pad(time.h), t('countdown_hours')], ['m', pad(time.m), t('countdown_minutes')], ['s', pad(time.s), t('countdown_seconds')]].map(([, val, label]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(44px,5.5vw,80px)', fontWeight: 500, lineHeight: 1, background: 'rgba(11,11,12,.5)', border: '1px solid var(--border)', padding: '12px 20px', minWidth: 80 }}>{val}</div>
            <div style={{ fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--fg-mute)', marginTop: 8 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NewsletterForm() {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  return done ? (
    <div style={{ padding: '18px 28px', border: '1px solid var(--gold-3)', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', color: 'var(--gold)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
      <span style={{ fontSize: 14 }}>{t('newsletter_success')}</span>
    </div>
  ) : (
    <form onSubmit={e => { e.preventDefault(); if (email) setDone(true) }} style={{ display: 'flex', border: '1px solid var(--gold-3)' }}>
      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t('newsletter_placeholder')}
        style={{ flex: 1, background: 'transparent', border: 'none', padding: '14px 18px', color: 'var(--fg)', fontFamily: 'var(--f-sans)', fontSize: 14, outline: 'none' }} />
      <button type="submit" style={{ padding: '14px 22px', background: 'var(--gold)', border: 'none', color: '#0B0B0C', fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 700, flexShrink: 0 }}>
        {t('newsletter_btn')}
      </button>
    </form>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

function App() {
  const [lang, setLang] = useState<Lang>('pt')
  const t = createT(lang)
  const arr = (k: TKey) => getArr(lang, k)
  const [activePage, setActivePage] = useState<Page>('home')
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [shopFilter, setShopFilter] = useState('Todos')
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [backTop, setBackTop] = useState(false)
  const [liveProducts, setLiveProducts] = useState<Product[]>([...ALL_PRODUCTS])
  const toastTimer = useRef<number | null>(null)

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.products?.length) setLiveProducts(data.products) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const h = () => setBackTop(window.scrollY > 400)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('pagamento')
    if (status === 'sucesso') {
      setToast(t('payment_success'))
      setCartItems([])
      window.history.replaceState({}, '', '/')
    } else if (status === 'cancelado') {
      setToast(t('payment_cancelled'))
      window.history.replaceState({}, '', '/')
    }
  }, [])

  const navigate = useCallback((p: Page, filter?: string) => {
    setActivePage(p)
    setActiveProduct(null)
    if (p === 'shop' || p === 'vestuario' || p === 'it') setShopFilter(filter ?? 'Todos')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const setPage = useCallback((p: Page) => navigate(p), [navigate])

  const openProduct = useCallback((p: Product) => {
    setActiveProduct(p)
    setActivePage('product')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const addToCart = useCallback((p: Product) => {
    setCartItems(prev => {
      const ex = prev.find(i => i.id === p.id)
      return ex ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }]
    })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(p.name)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }, [])

  const updateQty = useCallback((id: number, qty: number) => {
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }, [])

  const removeFromCart = useCallback((id: number) => {
    setCartItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const toggleWish = useCallback((id: number) => {
    setWishlist(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }, [])

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

  const sharedProps = { onAdd: addToCart, onOpen: openProduct, wishlist, toggleWish, products: liveProducts }

  return (
    <LangContext.Provider value={{ lang, t, arr }}>
    <div style={{ background: 'var(--bg)', color: 'var(--fg)', minHeight: '100vh' }}>
      <Header activePage={activePage} navigate={navigate} cartCount={cartCount} openCart={() => setCartOpen(true)} lang={lang} setLang={setLang} />

      {activePage === 'home' && <HomePage {...sharedProps} setPage={setPage} />}
      {activePage === 'shop' && <ShopPage key={shopFilter} {...sharedProps} initialCategory={shopFilter} vertical="all" />}
      {activePage === 'vestuario' && <ShopPage key={'v-' + shopFilter} {...sharedProps} initialCategory={shopFilter} vertical="vestuario" />}
      {activePage === 'it' && <ShopPage key={'it-' + shopFilter} {...sharedProps} initialCategory={shopFilter} vertical="it" />}
      {activePage === 'product' && activeProduct && (
        <ProductPage product={activeProduct} {...sharedProps} onBack={() => setPage(activeProduct.vertical === 'it' ? 'it' : 'vestuario')} allProducts={liveProducts} />
      )}
      {activePage === 'contact' && <ContactPage />}
      {activePage === 'about' && <AboutPage setPage={setPage} />}
      {activePage === 'blog' && <BlogPage />}
      {activePage === 'custom' && <CustomizerV2 setPage={setPage} onAddToCart={(item) => { setCartItems(prev => [...prev, item]); setToast(item.name); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 2400); }} />}

      <Footer setPage={setPage} />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} items={cartItems} updateQty={updateQty} remove={removeFromCart} />

      {toast && (
        <div className="kn-toast">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          <span><b style={{ color: 'var(--fg)' }}>{toast.length > 30 ? toast.slice(0, 30) + '…' : toast}</b> {t('added_cart')}</span>
        </div>
      )}

      <button className={`kn-back-top ${backTop ? 'visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
      </button>
    </div>
    </LangContext.Provider>
  )
}


// ─── Mount (guard against Babel Standalone double-execution + i18n race) ────
function mountApp() {
  const KI = (window as any).KarmicI18n;
  if (!KI) {
    setTimeout(mountApp, 30);
    return;
  }
  createT = KI.createT;
  getArr = KI.getArr;
  if ((window as any).__karmicMounted) return;
  (window as any).__karmicMounted = true;
  const rootEl = document.getElementById('root')!;
  const root = ReactDOM.createRoot(rootEl);
  root.render(<App />);
}
mountApp();

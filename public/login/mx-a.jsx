// ============================================================
// KARMIC NODE · 12 LOGINS v2 · 01–06  (linguagem karmicnode.com)
// ============================================================
const MX_LOGO = (window.__resources && window.__resources.knLogo) || '../assets/logo-karmicnode-oficial.png';
const MX_KIN = '../kin-brand/01-avatar-circular-512.png';
const MX_M = '../store-collection/mockups/';
const MX_PRODUCTS = [
  { n: 'T-Shirt Essencial', p: '29,99 €', img: MX_M + '02-tshirt-analog-digital.png', tag: 'Bestseller' },
  { n: 'Hoodie Algodão Pesado', p: '71,99 €', img: MX_M + '01-hoodie-terminal-poetry.png', tag: '−19%' },
  { n: 'Joggers Algodão', p: '59,00 €', img: MX_M + '03-joggers-signal.png' },
  { n: 'Capa PCB · iPhone', p: '24,00 €', img: MX_M + '04-iphone-pcb.png' },
  { n: 'Sleeve Hello, World.', p: '39,00 €', img: MX_M + '05-macbook-helloworld.png' },
  { n: 'Desk Mat Modular', p: '34,00 €', img: MX_M + '06-mousepad-synth.png', tag: 'Novo' },
];

function useMx() {
  const [done, setDone] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const go = () => { if (busy || done) return; setBusy(true); setTimeout(() => { setBusy(false); setDone(true); }, 900); };
  return { done, busy, go, reset: () => setDone(false) };
}
function MxCTA({ s, label = 'Entrar', cls = '', okText = 'Sessão iniciada', style }) {
  if (s.done) return <div className="mx-ok" style={style}><span className="mx-dot" />{okText}<button type="button" className="mx-link" onClick={s.reset}>Sair</button></div>;
  return <button type="button" className={'mx-btn ' + cls} onClick={s.go} style={style}>{s.busy ? 'A verificar…' : <>{label} <span>→</span></>}</button>;
}
function MxBrand({ sub = 'Cartaxo · PT' }) {
  return <span className="mx-brand"><span className="mx-mark"><img src={MX_LOGO} alt="" /></span><span className="mx-brand-t"><b>Karmic Node</b><small>{sub}</small></span></span>;
}
function MxF({ label, type = 'text', ph, u, value, onChange, style }) {
  return <label className={'mx-f' + (u ? ' u' : '')}><span>{label}</span><input type={type} placeholder={ph} value={value} onChange={onChange} style={style} /></label>;
}
function MxSocial() { return <div className="mx-soc"><button type="button">Google</button><button type="button">Apple</button></div>; }
function MxTicker({ items }) {
  const list = items || [['Envio hoje', '33 min'], ['Portes grátis', 'acima de 60 €'], ['Devoluções', '30 dias'], ['Bordado', 'desde +8 €'], ['Black Friday', 'até −24%'], ['Feito no', 'Cartaxo']];
  const row = [...list, ...list];
  return <div className="mx-ticker" style={{ padding: '14px 0' }}><div className="mx-track">{row.map(([a, b], i) => <span key={i}>{a} <b>{b}</b> <i style={{ marginLeft: 50 }}>✕</i></span>)}</div></div>;
}

// ---------- 01 · MAISON — o herói do site, mas para entrar ----------
function Mx01() {
  const s = useMx();
  return (
    <div className="mx" style={{ background: 'radial-gradient(ellipse at 50% 68%,#3A1C21 0%,#140C0E 48%,#0A0708 100%)' }}>
      <div className="mx-glow" /><div className="mx-floor" />
      <div style={{ position: 'absolute', top: 32, left: 48, right: 48 }} className="mx-row">
        <MxBrand />
        <span className="mx-row" style={{ gap: 28 }}><span className="mx-lbl">Loja</span><span className="mx-lbl">Estúdio</span><span className="mx-lbl" style={{ color: '#B12A3E' }}>Black Friday</span><span className="mx-lbl" style={{ color: '#F4EEE6', borderBottom: '1px solid #C9A15B', paddingBottom: 4 }}>Conta</span></span>
      </div>
      <div style={{ position: 'absolute', left: 48, top: 150 }}>
        <div className="mx-row" style={{ gap: 12, justifyContent: 'flex-start', marginBottom: 26 }}><span className="mx-dot" /><span className="mx-lbl">Área de cliente</span><span className="mx-lbl" style={{ color: '#251C1D' }}>/</span><span className="mx-lbl">N°00/26</span></div>
        <h1 className="mx-h" style={{ fontSize: 132 }}>Bem-vindo<br /><span className="mx-s" style={{ color: '#E4D8C6', fontSize: 150 }}>de volta.</span></h1>
        <p style={{ maxWidth: 420, color: '#8F8579', fontSize: 16, lineHeight: 1.55, marginTop: 26 }}>As tuas encomendas, os teus designs do estúdio e os favoritos. Tudo guardado, peça a peça.</p>
      </div>
      <div style={{ position: 'absolute', right: 48, top: 150, width: 380, padding: 32, background: 'rgba(10,7,8,.72)', backdropFilter: 'blur(14px)', border: '1px solid #251C1D' }}>
        <div className="mx-lbl g" style={{ marginBottom: 20 }}>— Entrar</div>
        <MxF label="Email" ph="tu@email.com" />
        <MxF label="Palavra-passe" type="password" ph="••••••••" />
        <div className="mx-row" style={{ margin: '4px 0 22px' }}><span className="mx-small">Novo? <button type="button" className="mx-link">Criar conta</button></span><button type="button" className="mx-link">Esqueci-me</button></div>
        <MxCTA s={s} />
      </div>
      <div style={{ position: 'absolute', bottom: 40, left: 48, right: 48, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 30 }}>
        {[['Portes grátis', '60€', '— acima de, em Portugal'], ['Devoluções', '30', 'dias · grátis, sem perguntas'], ['Personalização', '+8€', '— bordado ou impressão'], ['Envio hoje', '33', 'min · para encomendas de hoje']].map(([l, v, a]) => (
          <div key={l} style={{ borderTop: '1px solid #251C1D', paddingTop: 16 }}><div className="mx-lbl">{l}</div><div style={{ fontSize: 38, letterSpacing: '-.03em', fontWeight: 500, marginTop: 10 }}>{v}</div><div className="mx-m" style={{ fontSize: 11, color: '#C9A15B', marginTop: 4 }}>{a}</div></div>
        ))}
      </div>
    </div>
  );
}

// ---------- 02 · BASTIDOR — o teu nome é bordado enquanto escreves ----------
function Mx02() {
  const s = useMx();
  const [name, setName] = React.useState('');
  const shown = name.trim() || 'O teu nome';
  return (
    <div className="mx light mx-linen">
      <div style={{ position: 'absolute', top: 32, left: 48 }}><MxBrand sub="Estúdio de bordado" /></div>
      <div style={{ position: 'absolute', left: 90, top: 110, width: 580, height: 580 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(145deg,#d8b886,#a8844e 45%,#7a5a2c)', boxShadow: '0 30px 60px rgba(60,30,20,.3)' }} />
        <div style={{ position: 'absolute', inset: 22, borderRadius: '50%', background: 'linear-gradient(145deg,#c9a675,#8b6a3a)' }} />
        <div style={{ position: 'absolute', inset: 34, borderRadius: '50%', background: '#1a1315', overflow: 'hidden' }} className="mx-cotton">
          <svg viewBox="0 0 512 512" style={{ position: 'absolute', inset: 0 }}><circle className={'mx-stitch' + (name ? ' run' : '')} cx="256" cy="256" r="214" /></svg>
          <img src={MX_LOGO} alt="" style={{ position: 'absolute', left: '50%', top: 110, width: 74, transform: 'translateX(-50%)', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.6))' }} />
          <div className="mx-p" style={{ position: 'absolute', left: 30, right: 30, top: 200, textAlign: 'center', fontSize: shown.length > 14 ? 54 : 74, lineHeight: 1.1, color: '#C9A15B', textShadow: '0 1px 0 #7a5a2c, 0 2px 3px rgba(0,0,0,.7)', opacity: name ? 1 : .35, transition: 'opacity .3s' }}>{shown}</div>
          <div className="mx-m" style={{ position: 'absolute', left: 0, right: 0, bottom: 120, textAlign: 'center', fontSize: 10, letterSpacing: '.3em', color: '#8F8579' }}>BORDADO A OURO · FIO 40</div>
        </div>
        <div style={{ position: 'absolute', right: 26, top: 40, width: 38, height: 70, borderRadius: 6, background: 'linear-gradient(90deg,#8b6a3a,#d8b886,#8b6a3a)' }} />
      </div>
      <div style={{ position: 'absolute', right: 90, top: 150, width: 400 }}>
        <div className="mx-lbl g" style={{ color: '#9C7536' }}>Capítulo 03 — O estúdio</div>
        <h1 className="mx-h" style={{ fontSize: 64, margin: '16px 0 0' }}>A tua</h1>
        <div className="mx-s" style={{ fontSize: 74, lineHeight: .95, color: '#8B1E2D' }}>assinatura.</div>
        <p className="mx-small" style={{ fontSize: 14.5, lineHeight: 1.55, margin: '18px 0 28px' }}>Entra para recuperar os teus designs guardados no estúdio. O teu nome já está na agulha.</p>
        <MxF label="Nome" ph="Como queres ser chamado" value={name} onChange={(e) => setName(e.target.value.slice(0, 18))} />
        <MxF label="Email" ph="tu@email.com" />
        <MxF label="Palavra-passe" type="password" ph="••••••••" />
        <div style={{ height: 6 }} />
        <MxCTA s={s} label="Entrar no estúdio" cls="ink" okText="Designs carregados" />
      </div>
    </div>
  );
}

// ---------- 03 · ETIQUETA — uma etiqueta cosida a balançar ----------
function Mx03() {
  const s = useMx();
  return (
    <div className="mx" style={{ background: 'radial-gradient(800px 600px at 35% 30%,#2A1418 0%,#0A0708 70%)' }}>
      <div style={{ position: 'absolute', top: 32, left: 48 }}><MxBrand /></div>
      <div style={{ position: 'absolute', left: 300, top: 0, width: 2, height: 120, background: 'linear-gradient(#C9A15B,#8b6a3a)' }} />
      <div style={{ position: 'absolute', left: 140, top: 110, width: 320, transformOrigin: '161px 12px', animation: 'mxsway 6s ease-in-out infinite' }}>
        <div className="mx-woven" style={{ position: 'relative', padding: '64px 34px 40px', textAlign: 'center', color: '#F4EEE6', clipPath: 'polygon(14% 0,86% 0,100% 7%,100% 100%,0 100%,0 7%)', boxShadow: '0 30px 60px rgba(0,0,0,.6)' }}>
          <span style={{ position: 'absolute', left: '50%', top: 18, width: 22, height: 22, marginLeft: -11, borderRadius: '50%', background: '#0A0708', boxShadow: 'inset 0 0 0 3px #C9A15B' }} />
          <div style={{ position: 'absolute', inset: 10, top: 52, border: '1px dashed rgba(201,161,91,.55)', pointerEvents: 'none' }} />
          <img src={MX_LOGO} alt="" style={{ width: 70, margin: '8px auto 16px', display: 'block' }} />
          <div style={{ fontWeight: 700, letterSpacing: '.24em', fontSize: 18 }}>KARMIC NODE</div>
          <div className="mx-s" style={{ fontSize: 26, color: '#E4D8C6', margin: '6px 0 22px' }}>Feito para durar</div>
          <div className="mx-m" style={{ fontSize: 10.5, letterSpacing: '.16em', lineHeight: 2, color: '#E4D8C6', borderTop: '1px solid rgba(201,161,91,.4)', paddingTop: 16 }}>100% ALGODÃO · 13 OZ<br />LAVAR A 30° · NÃO SECAR<br />ACABADO À MÃO NO CARTAXO</div>
          <div className="mx-m" style={{ fontSize: 11, letterSpacing: '.3em', color: '#C9A15B', marginTop: 18 }}>N° 00126 · MMXXVI</div>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 110, top: 160, width: 440 }}>
        <div className="mx-lbl g">— Área de cliente</div>
        <h1 className="mx-h" style={{ fontSize: 88, margin: '18px 0 0' }}>Feito</h1>
        <div className="mx-s" style={{ fontSize: 104, lineHeight: .9, color: '#E4D8C6' }}>para durar.</div>
        <p className="mx-small" style={{ fontSize: 15, lineHeight: 1.55, margin: '18px 0 30px', maxWidth: 380 }}>Tal como a tua conta: encomendas, devoluções e garantias, tudo num só sítio.</p>
        <MxF label="Email" ph="tu@email.com" />
        <MxF label="Palavra-passe" type="password" ph="••••••••" />
        <div className="mx-row" style={{ margin: '2px 0 22px' }}><span className="mx-small">Novo? <button type="button" className="mx-link">Criar conta</button></span><button type="button" className="mx-link">Esqueci-me</button></div>
        <MxCTA s={s} />
      </div>
    </div>
  );
}

// ---------- 04 · MONTRA — duas filas de produtos a deslizar ----------
function Mx04() {
  const s = useMx();
  const row = [...MX_PRODUCTS, ...MX_PRODUCTS];
  const row2 = [...MX_PRODUCTS.slice(3), ...MX_PRODUCTS.slice(0, 3), ...MX_PRODUCTS.slice(3), ...MX_PRODUCTS.slice(0, 3)];
  const Rail = ({ items, r, top }) => (
    <div style={{ position: 'absolute', left: 0, top, width: '100%', overflow: 'hidden' }}>
      <div className={'mx-rail' + (r ? ' r' : '')}>{items.map((p, i) => <div key={i} className="mx-pcard"><div className="ph"><img src={p.img} alt="" />{p.tag && <span className="tag">{p.tag}</span>}</div><div className="mt"><b style={{ fontWeight: 500 }}>{p.n}</b><span>{p.p}</span></div></div>)}</div>
    </div>
  );
  return (
    <div className="mx">
      <Rail items={row} top={40} />
      <Rail items={row2} r top={420} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(460px 400px at 50% 50%, rgba(10,7,8,.97) 0%, rgba(10,7,8,.88) 55%, rgba(10,7,8,.4) 100%)' }} />
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 400, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 26 }}><MxBrand /></div>
        <div className="mx-lbl">Capítulo 02 — Os eleitos</div>
        <h1 className="mx-h" style={{ fontSize: 60, margin: '14px 0 0' }}>A loja</h1>
        <div className="mx-s" style={{ fontSize: 66, lineHeight: .95, color: '#E4D8C6', marginBottom: 22 }}>guarda-te lugar.</div>
        <MxSocial />
        <div className="mx-or">ou com email</div>
        <div style={{ textAlign: 'left' }}><MxF label="Email" ph="tu@email.com" /><MxF label="Palavra-passe" type="password" ph="••••••••" /></div>
        <div style={{ height: 6 }} />
        <MxCTA s={s} />
        <p className="mx-small" style={{ marginTop: 16 }}>Novo? <button type="button" className="mx-link">Criar conta</button></p>
      </div>
    </div>
  );
}

// ---------- 05 · CLUBE KN — cartão de membro com monograma bordado ----------
function Mx05() {
  const s = useMx();
  const [name, setName] = React.useState('');
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });
  const ini = (name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2) || 'KN').toUpperCase();
  return (
    <div className="mx" style={{ background: 'radial-gradient(800px 600px at 30% 50%, #2A1418 0%, #0A0708 75%)' }}>
      <div style={{ position: 'absolute', top: 32, left: 48 }}><MxBrand sub="Clube KN" /></div>
      <div style={{ position: 'absolute', top: 40, right: 48 }} className="mx-row"><span className="mx-dot" /><span className="mx-lbl">Black Friday · acesso antecipado para membros</span></div>
      <div style={{ position: 'absolute', left: 80, top: 200, perspective: 1400 }} onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setTilt({ x: ((e.clientY - r.top) / r.height - .5) * -12, y: ((e.clientX - r.left) / r.width - .5) * 16 }); }} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
        <div style={{ position: 'relative', width: 540, aspectRatio: '1.586/1', borderRadius: 20, padding: '30px 34px', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'linear-gradient(135deg,#1c1416,#0a0708 60%,#2a1418)', boxShadow: '0 50px 90px rgba(0,0,0,.7), inset 0 0 0 1px rgba(201,161,91,.5)', transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: 'transform .2s' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg,transparent 30%,rgba(255,240,210,.08) 45%,transparent 60%)' }} />
          <div className="mx-row" style={{ position: 'relative' }}><span className="mx-m" style={{ fontSize: 11, letterSpacing: '.3em', color: '#C9A15B' }}>CLUBE · KARMIC NODE</span><img src={MX_LOGO} alt="" style={{ width: 34 }} /></div>
          <div style={{ position: 'relative', margin: 'auto 0', display: 'flex', alignItems: 'center', gap: 26 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', display: 'grid', placeItems: 'center', border: '2px dashed rgba(201,161,91,.7)', background: 'radial-gradient(circle,#2a1418,#120d0e)' }}>
              <span className="mx-s" style={{ fontSize: 64, color: '#C9A15B', textShadow: '0 1px 0 #7a5a2c,0 2px 4px rgba(0,0,0,.8)' }}>{ini}</span>
            </div>
            <div><div className="mx-m" style={{ fontSize: 10, letterSpacing: '.24em', color: '#8F8579' }}>MONOGRAMA BORDADO</div><div style={{ fontSize: 24, fontWeight: 600, letterSpacing: '.04em', marginTop: 6 }}>{name.trim() || 'O teu nome'}</div><div className="mx-m" style={{ fontSize: 11, color: '#C9A15B', marginTop: 6 }}>Membro desde 2026</div></div>
          </div>
          <div className="mx-row" style={{ position: 'relative' }}><span className="mx-m" style={{ fontSize: 13, letterSpacing: '.28em', color: '#E4D8C6' }}>KN · 0126 · 2026</span><span className="mx-s" style={{ fontSize: 22, color: '#C9A15B' }}>Feito para durar</span></div>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 96, top: 170, width: 400 }}>
        <div className="mx-lbl g">— O teu cartão</div>
        <h1 className="mx-h" style={{ fontSize: 70, margin: '16px 0 0' }}>Entra</h1>
        <div className="mx-s" style={{ fontSize: 80, lineHeight: .95, color: '#E4D8C6' }}>no clube.</div>
        <p className="mx-small" style={{ fontSize: 14.5, lineHeight: 1.55, margin: '16px 0 26px' }}>Membros veem os descontos primeiro e têm o monograma bordado de oferta.</p>
        <MxF label="Nome" ph="Nome e apelido" value={name} onChange={(e) => setName(e.target.value.slice(0, 24))} />
        <MxF label="Email" ph="tu@email.com" />
        <MxF label="Palavra-passe" type="password" ph="••••••••" />
        <MxCTA s={s} label="Validar cartão" okText="Bem-vindo ao clube" />
      </div>
    </div>
  );
}

// ---------- 06 · CAIXA DE ENCOMENDA — o formulário é a etiqueta de envio ----------
function Mx06() {
  const s = useMx();
  return (
    <div className="mx" style={{ background: 'radial-gradient(900px 700px at 50% 60%,#2A1418 0%,#0A0708 70%)' }}>
      <div style={{ position: 'absolute', top: 32, left: 48 }}><MxBrand /></div>
      <div style={{ position: 'absolute', top: 40, right: 48 }} className="mx-row"><span className="mx-dot" /><span className="mx-lbl">Envio hoje · 33 min</span></div>
      <div className="mx-kraft" style={{ position: 'absolute', left: 120, top: 150, width: 1040, height: 560, border: '1px solid #3A2D2E', boxShadow: '0 50px 100px rgba(0,0,0,.6)' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 90, marginLeft: -45, background: 'linear-gradient(90deg,rgba(201,161,91,.12),rgba(201,161,91,.22),rgba(201,161,91,.12))', borderLeft: '1px solid rgba(201,161,91,.25)', borderRight: '1px solid rgba(201,161,91,.25)' }}>
          <div className="mx-m" style={{ writingMode: 'vertical-rl', margin: '30px auto', fontSize: 11, letterSpacing: '.5em', color: '#C9A15B', opacity: .8 }}>KARMIC NODE · FEITO PARA DURAR · KARMIC NODE · FEITO PARA DURAR</div>
        </div>
        <div style={{ position: 'absolute', left: 50, top: 50, width: 380 }}>
          <img src={MX_LOGO} alt="" style={{ width: 66, opacity: .9 }} />
          <h1 className="mx-h" style={{ fontSize: 58, marginTop: 24 }}>A tua</h1>
          <div className="mx-s" style={{ fontSize: 70, lineHeight: .95, color: '#E4D8C6' }}>encomenda.</div>
          <p className="mx-small" style={{ fontSize: 14.5, lineHeight: 1.55, marginTop: 16 }}>Embalada à mão no Cartaxo. Entra para acompanhar o caminho até tua casa.</p>
          <div className="mx-m" style={{ display: 'flex', gap: 22, marginTop: 34, fontSize: 30, color: '#8F8579' }}><span>↑↑</span><span style={{ fontSize: 22 }}>☂</span><span style={{ fontSize: 24 }}>◇</span></div>
          <div className="mx-m" style={{ fontSize: 10, letterSpacing: '.2em', color: '#8F8579', marginTop: 8 }}>ESTE LADO PARA CIMA · MANTER SECO · FRÁGIL</div>
        </div>
        <div style={{ position: 'absolute', right: 50, top: 46, width: 400, background: '#F7F2E9', color: '#17110F', padding: '22px 26px 26px', transform: 'rotate(1.2deg)', boxShadow: '0 10px 30px rgba(0,0,0,.4)' }}>
          <div className="mx-row" style={{ borderBottom: '2px solid #17110F', paddingBottom: 10 }}><b style={{ fontSize: 18, letterSpacing: '.18em' }}>KN EXPRESS</b><span className="mx-m" style={{ fontSize: 11 }}>PRIORIDADE · 24H</span></div>
          <div className="mx-m" style={{ fontSize: 10, letterSpacing: '.16em', color: '#7A6F66', margin: '12px 0 4px' }}>DE: KARMIC NODE · 2070 CARTAXO · PT</div>
          <div className="mx-m" style={{ fontSize: 10, letterSpacing: '.16em', color: '#8B1E2D', margin: '10px 0 2px' }}>PARA:</div>
          <MxF u label="Email do destinatário" ph="tu@email.com" style={{ color: '#17110F', borderColor: '#17110F' }} />
          <MxF u label="Palavra-passe" type="password" ph="••••••••" style={{ color: '#17110F', borderColor: '#17110F' }} />
          <div style={{ height: 46, margin: '6px 0 12px', background: 'repeating-linear-gradient(90deg,#17110F 0 2px,transparent 2px 4px,#17110F 4px 5px,transparent 5px 8px,#17110F 8px 11px,transparent 11px 12px)' }} />
          {s.done ? <div style={{ position: 'relative', height: 54 }}><span style={{ position: 'absolute', right: 10, top: -70, padding: '10px 18px', border: '4px double #8B1E2D', color: '#8B1E2D', fontWeight: 700, fontSize: 28, letterSpacing: '.2em', mixBlendMode: 'multiply', animation: 'mxstamp .5s both' }}>ENTREGUE</span><button type="button" className="mx-btn out" onClick={s.reset} style={{ color: '#17110F', borderColor: '#17110F' }}>Sair</button></div>
            : <button type="button" className="mx-btn ink" onClick={s.go}>{s.busy ? 'A localizar…' : 'Abrir a minha conta →'}</button>}
          <p className="mx-small" style={{ color: '#7A6F66', marginTop: 12 }}>Primeira encomenda? <button type="button" className="mx-link" style={{ color: '#8B1E2D' }}>Criar conta</button></p>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MX_LOGO, MX_KIN, MX_M, MX_PRODUCTS, useMx, MxCTA, MxBrand, MxF, MxSocial, MxTicker, Mx01, Mx02, Mx03, Mx04, Mx05, Mx06 });

// ============================================================
// KARMIC NODE · SÉRIE G · kit comum (Clube KN + Disco/Teclado)
// Depende de: mx-a, v4-a, v5-kit, v6-kit, f-a (FTop)
// ============================================================
const gName = (k) => k.name.trim() || 'O teu nome';
const gHash = (s, mod = 1e6) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % mod; return h; };
const gUid = () => 'g' + React.useId().replace(/[^a-z0-9]/gi, '');

// true durante ~ms depois de cada alteração (a agulha só se mexe enquanto escreves)
function useGTyping(v, ms = 750) {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => { if (!v) return; setOn(true); const t = setTimeout(() => setOn(false), ms); return () => clearTimeout(t); }, [v]);
  return on;
}
function useGDebounce(v, ms = 450) {
  const [d, setD] = React.useState(v);
  React.useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v]);
  return d;
}

// Paletas de fio
const G_PAL = {
  gold: ['#f3dc9e', '#c9a15b', '#7a5a2c'],
  bordo: ['#d9475c', '#8B1E2D', '#3d0812'],
  silver: ['#ffffff', '#cfc6ba', '#6e665c'],
  ink: ['#4a3418', '#2a1c08', '#000000'],
  glass: ['rgba(255,255,255,.9)', 'rgba(255,255,255,.25)', 'rgba(255,255,255,.5)'],
};

// Monograma bordado em SVG: o contorno é cosido, depois o cetim enche
function GMono({ ini, size = 140, pal = 'gold', dur = 1.5, style }) {
  const id = gUid(); const [c1, c2, c3] = G_PAL[pal];
  const fs = ini.length > 1 ? 112 : 140;
  const t = { x: 100, y: 140, textAnchor: 'middle' };
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: 'visible', flex: 'none', ...style }}>
      <defs><pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="5" height="5" fill={c2} /><rect width="2.2" height="5" fill={c1} /></pattern></defs>
      <g key={ini} style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontStyle: 'italic', fontWeight: 500, fontSize: fs }}>
        <text {...t} fill="none" stroke={c1} strokeWidth="1.3" style={{ strokeDasharray: 900, strokeDashoffset: 900, animation: `gdraw ${dur}s ease-out forwards` }}>{ini}</text>
        <text {...t} fill={`url(#${id})`} style={{ animation: `gfill ${dur * 1.25}s ease-out both`, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,.6))' }}>{ini}</text>
        <text {...t} fill="none" stroke={c3} strokeWidth=".8" strokeDasharray="3 2.4" style={{ animation: `gfill ${dur * 1.25}s ease-out both` }}>{ini}</text>
      </g>
    </svg>
  );
}

// Agulha com fio de ouro
function GNeedle({ on, style }) {
  return (
    <div style={{ position: 'absolute', width: 6, height: 70, pointerEvents: 'none', zIndex: 4, ...style }}>
      <svg width="60" height="140" style={{ position: 'absolute', left: 3, top: -128, overflow: 'visible' }}><path d="M0 138 C 40 90 -30 50 30 0" stroke="#E0C179" strokeWidth="1.2" fill="none" /></svg>
      <div style={{ position: 'absolute', inset: 0, animation: on ? 'v4needle .16s linear infinite' : 'none' }}>
        <div style={{ width: 4, height: 70, margin: '0 auto', borderRadius: '2px 2px 0 50%', background: 'linear-gradient(90deg,#6e665c,#f4eee6,#8f8579)', clipPath: 'polygon(0 0,100% 0,100% 85%,50% 100%,0 85%)' }} />
        <div style={{ position: 'absolute', left: '50%', top: 6, width: 1.6, height: 11, marginLeft: -.8, background: '#0A0708', borderRadius: 1 }} />
      </div>
    </div>
  );
}

// Cartão Clube base
const G_TONES = {
  obsidian: { bg: 'linear-gradient(135deg,#1e1517,#0a0708)', fg: '#F4EEE6', acc: '#C9A15B' },
  bordo: { bg: 'linear-gradient(135deg,#86202f,#2a0709)', fg: '#F4EEE6', acc: '#E0C179' },
  cream: { bg: 'linear-gradient(135deg,#fdf9f0,#e8dcc6)', fg: '#17110F', acc: '#8B1E2D' },
  gold: { bg: 'linear-gradient(135deg,#f6e2a6,#c9a15b 45%,#8b6a2a)', fg: '#2a1c08', acc: '#3a2a10' },
  silver: { bg: 'linear-gradient(135deg,#f4eee6,#b9b0a4 50%,#7d756b)', fg: '#141213', acc: '#3a3335' },
};
function GCard({ w = 560, h, tone = 'obsidian', children, style, pad = '28px 34px', sheen = true, bg, onMouseMove, onMouseLeave }) {
  const T = G_TONES[tone] || G_TONES.obsidian;
  return (
    <div onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} style={{ position: 'relative', width: w, height: h, aspectRatio: h ? undefined : '1.586/1', borderRadius: 20, padding: pad, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: bg || T.bg, color: T.fg, boxShadow: '0 50px 90px rgba(0,0,0,.55), inset 0 0 0 1px rgba(201,161,91,.5)', ...style }}>
      {sheen && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg,transparent 25%,rgba(255,240,210,.09) 42%,transparent 58%)', animation: 'v5sheen 6s ease-in-out infinite', pointerEvents: 'none' }} />}
      {children}
    </div>
  );
}
const GHead = ({ label = 'CLUBE · KARMIC NODE', acc = '#C9A15B', logo = true, right }) => (
  <div className="mx-row" style={{ position: 'relative' }}><span className="mx-m" style={{ fontSize: 11, letterSpacing: '.3em', color: acc }}>{label}</span>{right || (logo && <img src={MX_LOGO} alt="" style={{ width: 32 }} />)}</div>
);
const GFoot = ({ acc = '#C9A15B', fg = '#E4D8C6', left = 'KN · 0126 · 2026', right = 'Feito para durar' }) => (
  <div className="mx-row" style={{ position: 'relative' }}><span className="mx-m" style={{ fontSize: 12, letterSpacing: '.28em', color: fg }}>{left}</span><span className="mx-s" style={{ fontSize: 22, color: acc }}>{right}</span></div>
);
const GChip = ({ style }) => <span style={{ width: 52, height: 40, borderRadius: 7, background: 'linear-gradient(135deg,#f3dc9e,#c9a15b 45%,#8b6a2a)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.25)', position: 'relative', display: 'inline-block', flex: 'none', ...style }}><i style={{ position: 'absolute', left: 8, right: 8, top: '50%', height: 1, background: 'rgba(0,0,0,.3)' }} /><i style={{ position: 'absolute', top: 6, bottom: 6, left: '50%', width: 1, background: 'rgba(0,0,0,.3)' }} /></span>;

// Máscara de texto (para lantejoulas / tear / pontos)
function gMask(text, cols, rows) {
  const c = document.createElement('canvas'); c.width = cols; c.height = rows; const x = c.getContext('2d');
  x.fillStyle = '#000'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = `italic 600 ${Math.round(rows * (text.length > 1 ? .95 : 1.05))}px 'Cormorant Garamond', Georgia, serif`;
  x.fillText(text, cols / 2, rows * .54);
  const d = x.getImageData(0, 0, cols, rows).data; const out = [];
  for (let i = 0; i < cols * rows; i++) out.push(d[i * 4 + 3] > 90);
  return out;
}
// Roseta guilloché (SVG path)
const gRose = (cx, cy, R, a, n, m = 7) => { let d = ''; for (let i = 0; i <= 720; i++) { const th = i / 720 * Math.PI * 2, r = R + a * Math.sin(n * th) + a * .6 * Math.sin((n + m) * th); d += (i ? 'L' : 'M') + (cx + Math.cos(th) * r).toFixed(1) + ' ' + (cy + Math.sin(th) * r).toFixed(1); } return d + 'Z'; };

// Posição do rato relativa ao artboard (funciona com o canvas em zoom)
function useGMouse(W = 1280, H = 800) {
  const [p, setP] = React.useState({ x: W * .3, y: H * .5, on: false });
  const bind = {
    onMouseMove: (e) => { const r = e.currentTarget.getBoundingClientRect(); setP({ x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H, on: true }); },
    onMouseLeave: () => setP((q) => ({ ...q, on: false })),
  };
  return [p, bind];
}

// Formulário lateral com PIN + nome opcional
function GSidePin({ k, kicker, title, sub, hint, len = 6, name = false, style, extra }) {
  return (
    <div style={{ position: 'absolute', right: 96, top: 160, width: 400, zIndex: 3, ...style }}>
      <div className="mx-lbl g">{kicker}</div>
      <h1 className="mx-h" style={{ fontSize: 64, margin: '16px 0 0' }}>{title[0]}</h1>
      <div className="mx-s" style={{ fontSize: 74, lineHeight: .95, color: 'var(--silver)' }}>{title[1]}</div>
      <p className="mx-small" style={{ fontSize: 14.5, lineHeight: 1.55, margin: '14px 0 22px' }}>{sub}</p>
      {name && <V4In label="Nome" ph="Nome e apelido" value={k.name} onChange={(e) => k.setName(e.target.value.slice(0, 24))} />}
      <V4In label="Email" ph="tu@email.com" />
      {extra}
      {k.s.done ? <div className="mx-ok"><span className="mx-dot" />Acesso concedido<button type="button" className="mx-link" onClick={k.reset}>Sair</button></div>
        : <div className="mx-row" style={{ height: 54, padding: '0 16px', border: '1px solid var(--line2)' }}><span className="mx-m" style={{ fontSize: 11, letterSpacing: '.16em', color: 'var(--dim)', textTransform: 'uppercase' }}>{k.s.busy ? 'A verificar…' : hint || `PIN · ${len} dígitos`}</span><span className="mx-m" style={{ fontSize: 15, letterSpacing: '.3em', color: 'var(--gold)' }}>{k.code.replace(/./g, '•').padEnd(len, '·')}</span></div>}
      <div className="mx-row" style={{ marginTop: 18 }}><button type="button" className="mx-link">Usar palavra-passe</button><button type="button" className="mx-link">Esqueci o PIN</button></div>
    </div>
  );
}

Object.assign(window, { gName, gHash, useGTyping, useGDebounce, G_PAL, GMono, GNeedle, G_TONES, GCard, GHead, GFoot, GChip, gMask, gRose, useGMouse, GSidePin });

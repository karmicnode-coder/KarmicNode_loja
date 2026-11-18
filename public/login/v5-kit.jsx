// ============================================================
// KARMIC NODE · LOGINS v5 · KIT (peças dos 3 favoritos)
// Clube KN (monograma bordado) · Metal gravado · Cadeado de rodas + LED
// Depende de mx-a.jsx e v4-a.jsx (V4Tilt, V4In, V4Form, V4Top, v4Ini)
// ============================================================

// Dígitos determinísticos a partir da palavra-passe (rodam a cada tecla)
function v5Digits(pw, n = 4, solved) {
  if (solved) return Array.from({ length: n }, (_, i) => [0, 1, 2, 6, 2, 0][i % 6]);
  return Array.from({ length: n }, (_, i) => pw.length ? (pw.charCodeAt((pw.length - 1 - i + 32) % pw.length) * (i + 3) + pw.length * (7 + i)) % 10 : (i * 3 + 5) % 10);
}

// Roda de cadeado — material: 'dark' | 'gold' | 'steel' | 'led'
function V5Wheel({ d, h = 150, w, mat = 'dark', ok, size = 36, letters }) {
  const step = h / 3;
  const glyphs = letters || '0123456789';
  const bg = {
    dark: 'linear-gradient(180deg,#0a0708,#2a2021 20%,#3a2d2e 50%,#2a2021 80%,#0a0708)',
    gold: 'linear-gradient(180deg,#5a4420,#c9a15b 25%,#f3dc9e 50%,#c9a15b 75%,#5a4420)',
    steel: 'linear-gradient(180deg,#141213,#4a4244 22%,#8f8579 50%,#4a4244 78%,#141213)',
    led: 'linear-gradient(180deg,#050304,#0d0a0b 50%,#050304)',
  }[mat];
  const col = (k) => {
    if (mat === 'led') return k === d ? (ok ? '#7FC79B' : '#B12A3E') : 'rgba(177,42,62,.18)';
    if (mat === 'gold') return k === d ? '#2a1c08' : 'rgba(42,28,8,.35)';
    if (mat === 'steel') return k === d ? '#0e0c0d' : 'rgba(14,12,13,.35)';
    return k === d ? (ok ? '#7FC79B' : '#F4EEE6') : '#5a4f48';
  };
  return (
    <div style={{ position: 'relative', width: w, height: h, borderRadius: 10, overflow: 'hidden', background: bg, boxShadow: mat === 'gold' ? 'inset 0 0 0 1px #5a4420' : 'inset 0 0 0 2px rgba(0,0,0,.4)' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, transform: `translateY(${-d * step + step}px)`, transition: 'transform .45s cubic-bezier(.2,1.3,.4,1)' }}>
        {glyphs.split('').map((g, k) => <div key={k} className="mx-m" style={{ height: step, display: 'grid', placeItems: 'center', fontSize: size, fontWeight: 500, color: col(k), textShadow: mat === 'led' && k === d ? `0 0 12px ${ok ? '#7FC79B' : '#B12A3E'}` : mat === 'steel' && k === d ? '0 1px 0 rgba(255,255,255,.25)' : 'none' }}>{g}</div>)}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,.55),transparent 30%,transparent 70%,rgba(0,0,0,.55))', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: step, height: step, borderTop: '1px solid rgba(201,161,91,.25)', borderBottom: '1px solid rgba(201,161,91,.25)', pointerEvents: 'none' }} />
    </div>
  );
}

// Fila de rodas
function V5Wheels({ pw, n = 4, solved, mat, h = 150, gap = 12, size, w }) {
  const ds = v5Digits(pw, n, solved);
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n},${w ? w + 'px' : '1fr'})`, gap }}>{ds.map((d, i) => <V5Wheel key={i} d={d} h={h} mat={mat} ok={solved} size={size} />)}</div>;
}

// Texto em matriz LED 5×7 (A–Z, 0–9, alguns símbolos)
const V5_FONT = {
  A: '01110100011000111111100011000110001', B: '11110100011000111110100011000111110', C: '01110100011000010000100001000101110', D: '11110100011000110001100011000111110',
  E: '11111100001000011110100001000011111', F: '11111100001000011110100001000010000', G: '01110100011000010111100011000101111', H: '10001100011000111111100011000110001',
  I: '01110001000010000100001000010001110', J: '00111000100001000010000101001001100', K: '10001100101010011000101001001010001', L: '10000100001000010000100001000011111',
  M: '10001110111010110101100011000110001', N: '10001110011010110011100011000110001', O: '01110100011000110001100011000101110', P: '11110100011000111110100001000010000',
  Q: '01110100011000110001101011001001101', R: '11110100011000111110101001001010001', S: '01111100001000001110000010000111110', T: '11111001000010000100001000010000100',
  U: '10001100011000110001100011000101110', V: '10001100011000110001100010101000100', W: '10001100011000110101101011010101010', X: '10001100010101000100010101000110001',
  Y: '10001100010101000100001000010000100', Z: '11111000010001000100010001000011111', '0': '01110100011001110101110011000101110', '1': '00100011000010000100001000010001110',
  '2': '01110100010000100010001000100011111', '3': '11111000100010000010000011000101110', '4': '00010001100101010010111110001000010', '5': '11111100001111000001000011000101110',
  '6': '00110010001000011110100011000101110', '7': '11111000010001000100010000100001000', '8': '01110100011000101110100011000101110', '9': '01110100011000101111000010001001100',
  ' ': '00000000000000000000000000000000000', '·': '00000000000000000100000000000000000', '-': '00000000000000011111000000000000000', '%': '11001110010001000100010001001110011',
  '!': '00100001000010000100001000000000100', '•': '00000000000111001110011100000000000', '€': '00111010001111001000111100100000111',
};
function V5Led({ text, px = 6, gap = 1.5, on = '#B12A3E', off = 'rgba(177,42,62,.1)', glow = true }) {
  const chars = (text || '').toUpperCase().split('');
  return (
    <div style={{ display: 'flex', gap: px * 1.2 }} aria-label={text}>
      {chars.map((c, ci) => { const m = V5_FONT[c] || V5_FONT[' ']; return (
        <div key={ci} style={{ display: 'grid', gridTemplateColumns: `repeat(5,${px}px)`, gap }}>
          {m.split('').map((b, i) => <i key={i} style={{ width: px, height: px, borderRadius: '50%', background: b === '1' ? on : off, boxShadow: b === '1' && glow ? `0 0 ${px}px ${on}` : 'none' }} />)}
        </div>
      ); })}
    </div>
  );
}

// Fita LED a deslizar
function V5LedTicker({ text, px = 4, width = 600, speed = 14, on }) {
  return (
    <div style={{ width, overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 60, width: 'max-content', animation: `mxscroll ${speed}s linear infinite` }}>
        <V5Led text={text} px={px} on={on} /><V5Led text={text} px={px} on={on} />
      </div>
    </div>
  );
}

// Superfície de metal escovado com brilho que segue o rato
function V5Metal({ children, tone = 'steel', radius = 20, style, glare = true }) {
  const [g, setG] = React.useState({ x: 30, y: 30 });
  const base = {
    steel: 'repeating-linear-gradient(90deg,#1b1819 0 1px,#232021 1px 2px,#1d1a1b 2px 4px)',
    silver: 'repeating-linear-gradient(90deg,#b8b0a6 0 1px,#cfc7bc 1px 2px,#c2bab0 2px 4px)',
    gold: 'repeating-linear-gradient(90deg,#a8844e 0 1px,#c9a15b 1px 2px,#b8934f 2px 4px)',
    bordo: 'repeating-linear-gradient(90deg,#4a0d17 0 1px,#5e1320 1px 2px,#52101b 2px 4px)',
    black: 'repeating-linear-gradient(90deg,#0b0a0a 0 1px,#121010 1px 2px,#0e0c0c 2px 4px)',
  }[tone];
  const edge = { steel: '#4a4244', silver: '#efe8dc', gold: '#f3dc9e', bordo: '#8B1E2D', black: '#2a2426' }[tone];
  return (
    <div onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setG({ x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 }); }}
      style={{ position: 'relative', overflow: 'hidden', borderRadius: radius, background: base, boxShadow: `0 50px 90px rgba(0,0,0,.65), inset 0 0 0 1px ${edge}, inset 0 2px 0 rgba(255,255,255,.08)`, ...style }}>
      {glare && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(420px 260px at ${g.x}% ${g.y}%, rgba(255,250,240,${tone === 'silver' || tone === 'gold' ? .35 : .16}), transparent 60%)`, pointerEvents: 'none' }} />}
      {children}
    </div>
  );
}

// Texto gravado (engraved) em metal
function V5Engrave({ children, tone = 'steel', size = 30, mono, style }) {
  const c = { steel: '#141213', silver: '#6e665c', gold: '#5a4420', bordo: '#240509', black: '#050404' }[tone];
  const hi = tone === 'silver' || tone === 'gold' ? 'rgba(255,255,255,.55)' : 'rgba(255,255,255,.14)';
  return <div className={mono ? 'mx-m' : ''} style={{ fontSize: size, fontWeight: mono ? 500 : 600, letterSpacing: '.08em', color: c, textShadow: `0 1px 0 ${hi}, 0 -1px 0 rgba(0,0,0,.6)`, ...style }}>{children}</div>;
}

// Monograma bordado a ouro (Clube KN)
function V5Mono({ ini, size = 120, ring = true, live, style }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, borderRadius: '50%', display: 'grid', placeItems: 'center', border: ring ? '2px dashed rgba(201,161,91,.75)' : 'none', background: 'radial-gradient(circle,rgba(42,20,24,.85),rgba(10,7,8,.6))', flex: 'none', ...style }}>
      <span key={ini} className="mx-s" style={{ fontSize: size * .53, lineHeight: 1, backgroundImage: 'repeating-linear-gradient(45deg,#f3dc9e 0 2px,#c9a15b 2px 4px,#a8844e 4px 5px)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 1px 0 #5a4420) drop-shadow(0 2px 3px rgba(0,0,0,.8))', animation: live ? 'v5stitch .9s steps(10) both' : 'none' }}>{ini}</span>
    </div>
  );
}

// Hook comum: nome + palavra-passe + estado
function useV5() {
  const s = useMx();
  const [name, setName] = React.useState('');
  const [pw, setPw] = React.useState('');
  return { s, name, setName, pw, setPw, ini: v4Ini(name) };
}

// Formulário lateral padrão (aceita onPw e nome)
function V5Side({ k, kicker, title, sub, label = 'Entrar', cls = '', okText, withName = true, extra, style }) {
  return <V4Form s={k.s} kicker={kicker} title={title} sub={sub} label={label} cls={cls} okText={okText} nameField={withName ? [k.name, k.setName] : null} pw={k.pw} setPw={k.setPw} extra={extra} style={style} />;
}

Object.assign(window, { v5Digits, V5Wheel, V5Wheels, V5_FONT, V5Led, V5LedTicker, V5Metal, V5Engrave, V5Mono, useV5, V5Side });

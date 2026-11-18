// ============================================================
// KARMIC NODE · LOGINS FINAIS · KIT v6
// Teclas, teclado, disco arrastável, cartão-chave, luzes de estado
// Depende de: mx-a.jsx, v4-a.jsx, v5-kit.jsx
// ============================================================
const V6C = { red: '#B12A3E', gold: '#E0C179', ok: '#7FC79B' };
const v6St = (s) => (s.done ? 'ok' : s.busy ? 'busy' : 'idle');
const v6Col = (st) => (st === 'ok' ? V6C.ok : st === 'busy' ? V6C.gold : V6C.red);

// Estado comum: nome, palavra-passe, PIN
function useV6(len = 6) {
  const k = useV5();
  const [code, setCode] = React.useState('');
  const press = (d) => {
    if (k.s.done || k.s.busy) return;
    if (d === '⌫' || d === '←') { setCode((c) => c.slice(0, -1)); return; }
    if (d === 'C' || d === '✕') { setCode(''); return; }
    if (d === 'OK' || d === '✓') { if (code.length >= 4) k.s.go(); return; }
    setCode((c) => { const n = (c + d).slice(0, len); if (n.length === len) setTimeout(() => k.s.go(), 200); return n; });
  };
  const reset = () => { setCode(''); k.s.reset(); };
  return { ...k, code, press, reset, st: v6St(k.s) };
}

function V6Lamp({ st, size = 12, style }) {
  const c = v6Col(st);
  return <span style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', background: c, boxShadow: `0 0 ${size}px ${c}`, transition: 'background .3s, box-shadow .3s', flex: 'none', ...style }} />;
}

// ---------- Teclas ----------
const V6_LOOKS = {
  metal: { background: 'repeating-linear-gradient(90deg,#1b1819 0 1px,#232021 1px 2px)', color: '#E4D8C6', boxShadow: 'inset 0 0 0 1px #3a3335, inset 0 2px 0 rgba(255,255,255,.08), 0 4px 0 #050304', borderRadius: 12 },
  brass: { background: 'radial-gradient(circle at 35% 30%,#f7e4ad,#c9a15b 45%,#7a5a2c)', color: '#2a1c08', boxShadow: '0 5px 0 #4a3418, inset 0 -3px 6px rgba(60,40,10,.45), inset 0 2px 0 rgba(255,255,255,.4)', borderRadius: '50%' },
  glass: { background: 'rgba(255,255,255,.06)', color: '#F4EEE6', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.2), inset 0 1px 0 rgba(255,255,255,.25)', borderRadius: '50%', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' },
  smart: { background: 'transparent', color: '#E0C179', boxShadow: 'none', borderRadius: '50%', textShadow: '0 0 12px rgba(224,193,121,.85)' },
  cream: { background: 'linear-gradient(180deg,#f6efe3,#ddd2c0)', color: '#17110F', boxShadow: '0 4px 0 #a89c88, inset 0 1px 0 #fff', borderRadius: 10 },
  steel: { background: 'radial-gradient(circle at 35% 30%,#e4d8c6,#8f8579 60%,#4a4244)', color: '#141213', boxShadow: '0 4px 0 #2a2426, inset 0 2px 0 rgba(255,255,255,.5)', borderRadius: '50%' },
};
function V6Key({ label, onPress, look = 'metal', h = 64, size = 22, sub, accent, style }) {
  const [p, setP] = React.useState(false);
  const acc = accent === 'ok' ? { background: 'linear-gradient(180deg,#3f9a62,#2E7D4F)', color: '#fff', textShadow: 'none' }
    : accent === 'del' ? { background: 'linear-gradient(180deg,#B12A3E,#6E1622)', color: '#fff', textShadow: 'none' } : {};
  return (
    <button type="button" onClick={() => onPress && onPress(label)} onPointerDown={() => setP(true)} onPointerUp={() => setP(false)} onPointerLeave={() => setP(false)}
      style={{ width: '100%', height: h, border: 'none', display: 'grid', placeItems: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: size, fontWeight: 500, cursor: 'pointer', transition: 'transform .08s, filter .15s', ...V6_LOOKS[look], ...acc, transform: p ? 'translateY(3px)' : 'none', filter: p ? 'brightness(1.3)' : 'none', ...style }}>
      <span style={{ lineHeight: 1 }}>{label}{sub && <small style={{ display: 'block', fontSize: 8.5, letterSpacing: '.2em', opacity: .6, marginTop: 4 }}>{sub}</small>}</span>
    </button>
  );
}
const V6_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', 'OK'];
const V6_SUBS = { 2: 'ABC', 3: 'DEF', 4: 'GHI', 5: 'JKL', 6: 'MNO', 7: 'PQRS', 8: 'TUV', 9: 'WXYZ' };
function V6Pad({ onPress, look = 'metal', keys = V6_KEYS, cols = 3, gap = 12, h = 64, size = 22, subs, colored = true }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap }}>
      {keys.map((d) => <V6Key key={d} label={d} onPress={onPress} look={look} h={h} size={size} sub={subs ? V6_SUBS[d] : null} accent={colored ? (d === 'OK' || d === '✓' ? 'ok' : d === '⌫' || d === '✕' ? 'del' : null) : null} />)}
    </div>
  );
}
// Visor de PIN em LED
function V6PinLed({ code, len = 6, st, px = 6, done = 'ABERTO' }) {
  const txt = st === 'ok' ? done : code.replace(/./g, '•').padEnd(len, '-');
  return <V5Led text={txt} px={px} on={st === 'ok' ? V6C.ok : st === 'busy' ? V6C.gold : V6C.red} />;
}

// ---------- Disco (arrastável com o rato) ----------
function V6Dial({ rot = 0, size = 460, tone = 'steel', ticks = 100, every = 10, labelFn, labelColor = '#E4D8C6', tickColor = '#4a4244', majorColor = '#C9A15B', inset, children, drag = true, ringStyle, onTurn }) {
  const [extra, setExtra] = React.useState(0);
  const ref = React.useRef(null);
  const st = React.useRef(null);
  const ang = (e) => { const r = ref.current.getBoundingClientRect(); return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180 / Math.PI; };
  const down = (e) => { if (!drag) return; e.currentTarget.setPointerCapture(e.pointerId); st.current = { a: ang(e), x: extra }; };
  const move = (e) => { if (!st.current) return; let d = ang(e) - st.current.a; if (d > 180) d -= 360; if (d < -180) d += 360; const nx = st.current.x + d; setExtra(nx); onTurn && onTurn(nx); };
  const up = () => { st.current = null; };
  const ins = inset ?? size * .08, D = size - ins * 2, lo = size * .07;
  return (
    <div ref={ref} style={{ position: 'relative', width: size, height: size, cursor: drag ? 'grab' : 'default', touchAction: 'none' }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <V5Metal tone={tone} radius={size / 2} style={{ position: 'absolute', inset: 0 }}>
        <div style={{ position: 'absolute', inset: ins, borderRadius: '50%', transform: `rotate(${rot + extra}deg)`, transition: st.current ? 'none' : 'transform .6s cubic-bezier(.2,1.2,.4,1)', ...ringStyle }}>
          {Array.from({ length: ticks }, (_, i) => <span key={i} style={{ position: 'absolute', left: '50%', top: 0, width: 2, height: i % every ? D * .025 : D * .06, background: i % every ? tickColor : majorColor, transformOrigin: `1px ${D / 2}px`, transform: `rotate(${i * 360 / ticks}deg)` }} />)}
          {labelFn && Array.from({ length: ticks / every }, (_, i) => <span key={'l' + i} className="mx-m" style={{ position: 'absolute', left: '50%', top: lo, width: 40, marginLeft: -20, textAlign: 'center', fontSize: size * .032, color: labelColor, transformOrigin: `20px ${D / 2 - lo}px`, transform: `rotate(${i * 360 / (ticks / every)}deg)` }}>{labelFn(i)}</span>)}
        </div>
        {children}
      </V5Metal>
    </div>
  );
}

// ---------- Cartão-chave vertical ----------
function V6Keycard({ ini, name, w = 200, h = 310, tone = 'black', room = '0126', style }) {
  const bg = { black: 'linear-gradient(160deg,#231b1c,#0a0708)', bordo: 'linear-gradient(160deg,#8B1E2D,#3d0812)', gold: 'linear-gradient(160deg,#f3dc9e,#c9a15b 40%,#8b6a2a)', cream: 'linear-gradient(160deg,#fbf6ea,#e9dfcc)' }[tone];
  const fg = tone === 'gold' || tone === 'cream' ? '#2a1c08' : '#F4EEE6';
  return (
    <div style={{ position: 'relative', width: w, height: h, borderRadius: 14, padding: w * .09, display: 'flex', flexDirection: 'column', alignItems: 'center', background: bg, color: fg, boxShadow: '0 24px 50px rgba(0,0,0,.6), inset 0 0 0 1px rgba(201,161,91,.55)', overflow: 'hidden', ...style }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg,transparent 30%,rgba(255,240,210,.1) 45%,transparent 60%)' }} />
      <div className="mx-row" style={{ width: '100%', position: 'relative' }}><img src={MX_LOGO} alt="" style={{ width: w * .16 }} /><span className="mx-m" style={{ fontSize: w * .045, letterSpacing: '.2em', color: tone === 'gold' || tone === 'cream' ? '#5a4420' : '#C9A15B' }}>SUITE</span></div>
      <V5Mono ini={ini} size={w * .48} style={{ marginTop: h * .08 }} />
      <div style={{ position: 'relative', fontSize: w * .07, fontWeight: 600, marginTop: h * .05, textAlign: 'center' }}>{name || 'O teu nome'}</div>
      <div className="mx-m" style={{ position: 'relative', fontSize: w * .05, letterSpacing: '.24em', marginTop: 'auto', color: tone === 'gold' || tone === 'cream' ? '#5a4420' : '#C9A15B' }}>QUARTO {room}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: h * .2, height: h * .06, background: 'rgba(0,0,0,.55)' }} />
    </div>
  );
}

// ---------- Anel de LEDs ----------
function V6LedRing({ n = 48, lit = 0, r = 140, st, dot = 6 }) {
  return (
    <div style={{ position: 'absolute', left: '50%', top: '50%', width: 0, height: 0 }}>
      {Array.from({ length: n }, (_, i) => { const on = i < lit; const c = st === 'ok' ? V6C.ok : on ? V6C.gold : 'rgba(177,42,62,.25)'; const a = i / n * Math.PI * 2 - Math.PI / 2; return <i key={i} style={{ position: 'absolute', left: Math.cos(a) * r - dot / 2, top: Math.sin(a) * r - dot / 2, width: dot, height: dot, borderRadius: '50%', background: c, boxShadow: on || st === 'ok' ? `0 0 ${dot * 1.5}px ${c}` : 'none', transition: `background .2s ${i * .008}s` }} />; })}
    </div>
  );
}

// Formulário lateral com PIN (sem palavra-passe) ou normal
function V6SidePin({ k, kicker, title, sub, hint, style }) {
  return (
    <div style={{ position: 'absolute', right: 96, top: 170, width: 400, zIndex: 3, ...style }}>
      <div className="mx-lbl g">{kicker}</div>
      <h1 className="mx-h" style={{ fontSize: 66, margin: '16px 0 0' }}>{title[0]}</h1>
      <div className="mx-s" style={{ fontSize: 76, lineHeight: .95, color: 'var(--silver)' }}>{title[1]}</div>
      <p className="mx-small" style={{ fontSize: 14.5, lineHeight: 1.55, margin: '14px 0 22px' }}>{sub}</p>
      <V4In label="Email" ph="tu@email.com" />
      {k.s.done ? <div className="mx-ok"><span className="mx-dot" />Acesso concedido<button type="button" className="mx-link" onClick={k.reset}>Sair</button></div>
        : <div className="mx-row" style={{ height: 54, padding: '0 16px', border: '1px solid var(--line2)' }}><span className="mx-m" style={{ fontSize: 11, letterSpacing: '.16em', color: 'var(--dim)', textTransform: 'uppercase' }}>{hint || 'PIN · 6 dígitos'}</span><span className="mx-m" style={{ fontSize: 15, letterSpacing: '.3em', color: 'var(--gold)' }}>{k.code.replace(/./g, '•').padEnd(6, '·')}</span></div>}
      <div className="mx-row" style={{ marginTop: 18 }}><button type="button" className="mx-link">Usar palavra-passe</button><button type="button" className="mx-link">Esqueci o PIN</button></div>
    </div>
  );
}

Object.assign(window, { V6C, v6St, v6Col, useV6, V6Lamp, V6_LOOKS, V6Key, V6_KEYS, V6Pad, V6PinLed, V6Dial, V6Keycard, V6LedRing, V6SidePin });

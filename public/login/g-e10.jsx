// ============================================================
// KARMIC NODE · E10 II · Vista explodida — versão fluida e limpa
// Fundo: caleidoscópio reativo (o mesmo do F20)
// ============================================================
const GE10_L = [
  { n: 'Base', d: 'Algodão reciclado' },
  { n: 'Núcleo', d: 'Aço · 0,8 mm' },
  { n: 'Chip', d: 'NFC + antena' },
  { n: 'Monograma', d: 'Folha de ouro' },
  { n: 'Laminado', d: 'Vidro mate' },
];

function GE10b() {
  const k = useV5();
  const [m, bind] = useGMouse();
  const [hov, setHov] = React.useState(-1);
  const p = k.s.done ? 1 : Math.min(1, k.pw.length / 8);
  const sealed = k.s.done ? 5 : Math.floor(p * 5 + .001);
  const gap = 6 + 54 * Math.pow(1 - p, 1.4);
  const rx = 56 + (m.on ? (m.y / 800 - .5) * -10 : 0);
  const rz = -32 + (m.on ? (m.x / 1280 - .5) * 14 : 0);
  const ease = 'cubic-bezier(.22,1,.36,1)';

  const face = (i) => {
    const base = { position: 'absolute', inset: 0, borderRadius: 18, overflow: 'hidden' };
    if (i === 0) return <div style={{ ...base, background: 'linear-gradient(135deg,#7d1c2b,#2a0709)', boxShadow: '0 40px 60px rgba(0,0,0,.55)' }} />;
    if (i === 1) return <div style={{ ...base, background: 'linear-gradient(135deg,#4a4244,#1a1617 60%,#3a3335)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)' }}><div style={{ position: 'absolute', inset: 0, opacity: .5, background: 'repeating-linear-gradient(90deg,rgba(255,255,255,.04) 0 1px,transparent 1px 3px)' }} /></div>;
    if (i === 2) return (
      <div style={{ ...base, boxShadow: 'inset 0 0 0 1px rgba(224,193,121,.35)' }}>
        <svg viewBox="0 0 440 277" style={{ position: 'absolute', inset: 0 }}>
          {[0, 1, 2, 3].map((j) => <rect key={j} x={170 + j * 11} y={46 + j * 11} width={230 - j * 22} height={186 - j * 22} rx={14} fill="none" stroke="rgba(224,193,121,.55)" strokeWidth="1" />)}
          <path d="M96 138 H170" stroke="rgba(224,193,121,.55)" strokeWidth="1" />
        </svg>
        <GChip style={{ position: 'absolute', left: 44, top: 118 }} />
      </div>
    );
    if (i === 3) return (
      <div style={{ ...base }}>
        <GMono ini={k.ini} size={150} style={{ position: 'absolute', left: 145, top: 54 }} />
        <img src={MX_LOGO} alt="" style={{ position: 'absolute', right: 24, top: 20, width: 28, opacity: .9 }} />
        <div className="mx-m" style={{ position: 'absolute', left: 26, bottom: 22, fontSize: 12, letterSpacing: '.28em', color: '#E0C179' }}>{gName(k).toUpperCase()}</div>
        <div className="mx-m" style={{ position: 'absolute', right: 26, bottom: 22, fontSize: 10, letterSpacing: '.24em', color: 'rgba(224,193,121,.7)' }}>Nº 0126</div>
      </div>
    );
    return <div style={{ ...base, background: 'linear-gradient(125deg,rgba(255,255,255,.14),rgba(255,255,255,.02) 40%,rgba(255,255,255,.08) 60%,rgba(255,255,255,0))', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.22)' }} />;
  };

  return (
    <div className="mx" style={{ background: '#030203' }} {...bind}>
      <KnBg kind="kaleido" opt={{ cx: 370, cy: 400 }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 60% at 30% 50%,transparent,rgba(3,2,3,.55) 80%)', pointerEvents: 'none' }} />
      <FTop sub="Clube KN · Construção" />

      {/* pilha 3D */}
      <div style={{ position: 'absolute', left: 150, top: 300, width: 440, height: 277, perspective: 2200 }}>
        <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(${rx}deg) rotateZ(${rz}deg)`, transition: `transform 1.2s ${ease}` }}>
          {GE10_L.map((L, i) => {
            const lift = hov === i ? 34 : 0;
            const dim = hov >= 0 && hov !== i;
            return (
              <div key={i} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', animation: `ge10float ${6 + i * .7}s ${-i * 1.3}s ease-in-out infinite`, animationPlayState: k.s.done ? 'paused' : 'running' }}>
                <div style={{ position: 'absolute', inset: 0, transform: `translateZ(${i * gap + lift}px)`, opacity: dim ? .35 : 1, transition: `transform 1s ${ease} ${i * .04}s, opacity .4s` }}>
                  {face(i)}
                  {hov === i && <div style={{ position: 'absolute', inset: -1, borderRadius: 19, boxShadow: '0 0 0 1px #E0C179, 0 0 30px rgba(224,193,121,.35)' }} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* legenda */}
      <div style={{ position: 'absolute', left: 80, right: 620, bottom: 64 }}>
        <div style={{ position: 'relative', height: 1, background: 'rgba(228,216,198,.12)', marginBottom: 18 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: 1, width: `${p * 100}%`, background: '#E0C179', boxShadow: '0 0 10px #E0C179', transition: `width .8s ${ease}` }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
          {GE10_L.map((L, i) => {
            const ok = i < sealed;
            return (
              <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(-1)} style={{ cursor: 'default', opacity: hov >= 0 && hov !== i ? .45 : 1, transition: 'opacity .3s' }}>
                <div className="mx-m" style={{ fontSize: 10, letterSpacing: '.22em', color: ok ? '#E0C179' : '#8F8579', transition: 'color .4s' }}>{String(i + 1).padStart(2, '0')}{ok ? ' ·  ✓' : ''}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6, color: '#F4EEE6' }}>{L.n}</div>
                <div className="mx-small" style={{ fontSize: 11.5, marginTop: 2 }}>{L.d}</div>
              </div>
            );
          })}
        </div>
      </div>

      <V5Side k={k} kicker="— Como é feito" title={['Cinco', 'camadas.']} sub="O cartão Clube KN desmontado. Cada letra da palavra-passe aproxima as camadas até ficarem numa só. Passa o rato pela legenda para isolar cada camada." label="Montar e entrar" okText="Cartão montado" />
    </div>
  );
}

Object.assign(window, { GE10b });

// ============================================================
// KARMIC NODE · LOGINS v4 · helpers + 01–05 (cartões & passes, passaporte)
// Depende de mx.css, mx-a.jsx (useMx, MxCTA, MxBrand, MX_*), kn-bg(+plus).jsx
// ============================================================

function V4Tilt({ children, max = 12, style }) {
  const [t, setT] = React.useState({ x: 0, y: 0 });
  return (
    <div style={{ perspective: 1400, ...style }}
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setT({ x: ((e.clientY - r.top) / r.height - .5) * -max, y: ((e.clientX - r.left) / r.width - .5) * max * 1.3 }); }}
      onMouseLeave={() => setT({ x: 0, y: 0 })}>
      <div style={{ transform: `rotateX(${t.x}deg) rotateY(${t.y}deg)`, transition: 'transform .25s ease-out', transformStyle: 'preserve-3d' }}>{children}</div>
    </div>
  );
}
function V4In({ label, type = 'text', ph, value, onChange, onFocus, onBlur }) {
  return <label className="mx-f"><span>{label}</span><input type={type} placeholder={ph} value={value} onChange={onChange} onFocus={onFocus} onBlur={onBlur} /></label>;
}
function V4Form({ s, kicker, title, sub, label = 'Entrar', cls = '', okText, nameField, pw, setPw, onPwFocus, onPwBlur, extra, children, style }) {
  return (
    <div style={{ position: 'absolute', right: 96, top: 150, width: 400, zIndex: 3, ...style }}>
      <div className="mx-lbl g">{kicker}</div>
      <h1 className="mx-h" style={{ fontSize: 68, margin: '16px 0 0' }}>{title[0]}</h1>
      <div className="mx-s" style={{ fontSize: 78, lineHeight: .95, color: 'var(--silver)' }}>{title[1]}</div>
      <p className="mx-small" style={{ fontSize: 14.5, lineHeight: 1.55, margin: '14px 0 24px' }}>{sub}</p>
      {children}
      {nameField && <V4In label="Nome" ph="Nome e apelido" value={nameField[0]} onChange={(e) => nameField[1](e.target.value.slice(0, 24))} />}
      <V4In label="Email" ph="tu@email.com" />
      <V4In label="Palavra-passe" type="password" ph="••••••••" value={pw} onChange={setPw ? (e) => setPw(e.target.value.slice(0, 16)) : undefined} onFocus={onPwFocus} onBlur={onPwBlur} />
      <div style={{ height: 6 }} />
      <MxCTA s={s} label={label} cls={cls} okText={okText} />
      {extra || <div className="mx-row" style={{ marginTop: 18 }}><span className="mx-small">Novo? <button type="button" className="mx-link">Criar conta</button></span><button type="button" className="mx-link">Esqueci-me</button></div>}
    </div>
  );
}
const V4Top = ({ right, sub }) => <div style={{ position: 'absolute', top: 32, left: 48, right: 48, zIndex: 5 }} className="mx-row"><MxBrand sub={sub} />{right}</div>;
const v4Ini = (n) => (n.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2) || 'KN').toUpperCase();
const V4Stamp = ({ text, style }) => <span style={{ position: 'absolute', padding: '8px 16px', border: '4px double #8B1E2D', color: '#8B1E2D', fontWeight: 700, fontSize: 28, letterSpacing: '.18em', mixBlendMode: 'multiply', animation: 'mxstamp .5s both', whiteSpace: 'nowrap', ...style }}>{text}</span>;

// ---------- 01 · CARTÃO DUPLO — vira sozinho quando escreves a palavra-passe ----------
function V401() {
  const s = useMx();
  const [name, setName] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [back, setBack] = React.useState(false);
  const face = { position: 'absolute', inset: 0, borderRadius: 22, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', overflow: 'hidden', padding: '30px 34px', display: 'flex', flexDirection: 'column', boxShadow: '0 50px 90px rgba(0,0,0,.6), inset 0 0 0 1px rgba(201,161,91,.45)' };
  return (
    <div className="mx" style={{ background: '#0A0708' }}>
      <KnBg kind="liquid" />
      <V4Top right={<span className="mx-lbl">Frente: quem és · Verso: a tua chave</span>} />
      <V4Tilt style={{ position: 'absolute', left: 96, top: 220 }}>
        <div style={{ position: 'relative', width: 560, aspectRatio: '1.586/1', transformStyle: 'preserve-3d', transform: back ? 'rotateY(180deg)' : 'none', transition: 'transform .85s cubic-bezier(.2,.7,.2,1)' }}>
          <div style={{ ...face, background: 'linear-gradient(135deg,rgba(28,20,22,.94),rgba(10,7,8,.97))', opacity: back ? 0 : 1, transition: 'opacity 0s .42s' }}>
            <div className="mx-row"><span className="mx-m" style={{ fontSize: 11, letterSpacing: '.3em', color: '#C9A15B' }}>CLUBE KN · FRENTE</span><img src={MX_LOGO} alt="" style={{ width: 34 }} /></div>
            <div style={{ margin: 'auto 0', display: 'flex', alignItems: 'center', gap: 26 }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', display: 'grid', placeItems: 'center', border: '2px dashed rgba(201,161,91,.75)' }}><span className="mx-s" style={{ fontSize: 64, color: '#C9A15B' }}>{v4Ini(name)}</span></div>
              <div><div className="mx-m" style={{ fontSize: 10, letterSpacing: '.24em', color: '#8F8579' }}>TITULAR</div><div style={{ fontSize: 26, fontWeight: 600, marginTop: 6 }}>{name.trim() || 'O teu nome'}</div></div>
            </div>
            <div className="mx-row"><span className="mx-m" style={{ fontSize: 13, letterSpacing: '.28em', color: '#E4D8C6' }}>KN · 0126</span><span className="mx-s" style={{ fontSize: 22, color: '#C9A15B' }}>Feito para durar</span></div>
          </div>
          <div style={{ ...face, transform: 'rotateY(180deg)', background: 'linear-gradient(160deg,#3d0812,#140709 70%)', opacity: back ? 1 : 0, transition: 'opacity 0s .42s' }}>
            <div style={{ height: 50, margin: '-4px -34px 24px', background: '#050304' }} />
            <div className="mx-row" style={{ alignItems: 'stretch', gap: 14 }}>
              <div style={{ flex: 1, height: 52, background: 'repeating-linear-gradient(-45deg,#e8dfcf 0 6px,#d9cdb8 6px 12px)', display: 'flex', alignItems: 'center', paddingLeft: 14 }}><span className="mx-p" style={{ fontSize: 30, color: '#17110F' }}>{name.trim() || 'Assinatura'}</span></div>
              <div style={{ width: 120, background: '#F4EEE6', color: '#17110F', display: 'grid', placeItems: 'center', textAlign: 'center' }}><div><div className="mx-m" style={{ fontSize: 9, letterSpacing: '.2em', color: '#8B1E2D' }}>CHAVE</div><div className="mx-m" style={{ fontSize: 18, letterSpacing: '.18em' }}>{pw ? '•'.repeat(Math.min(8, pw.length)) : '— — —'}</div></div></div>
            </div>
            <div className="mx-row" style={{ marginTop: 'auto' }}><span className="mx-m" style={{ fontSize: 10, letterSpacing: '.22em', color: '#C9A15B' }}>NÃO PARTILHES O VERSO</span><span style={{ width: 54, height: 36, borderRadius: 6, background: 'linear-gradient(135deg,#e0c179,#f5efe6 30%,#c9a24b 50%,#7a1520 75%,#e0c179)' }} /></div>
          </div>
        </div>
      </V4Tilt>
      <V4Form s={s} kicker="— Dois lados" title={['Quem és,', 'e a tua chave.']} sub="Escreve o nome e vês a frente. Toca na palavra-passe e o cartão vira-se." label="Validar cartão" okText="Cartão validado" nameField={[name, setName]} pw={pw} setPw={setPw} onPwFocus={() => setBack(true)} onPwBlur={() => setBack(false)} />
    </div>
  );
}

// ---------- 02 · CARTÃO DE METAL — nome gravado a laser, brilho segue o rato ----------
function V402() {
  const s = useMx();
  const [name, setName] = React.useState('');
  const [g, setG] = React.useState({ x: 30, y: 30 });
  return (
    <div className="mx" style={{ background: 'radial-gradient(900px 700px at 30% 50%,#1a1012 0%,#050304 75%)' }}>
      <KnBg kind="constell" opt={{ ox: 1010, oy: 640, s: .55 }} />
      <V4Top right={<span className="mx-lbl">Aço inox · gravado no Cartaxo</span>} />
      <V4Tilt max={14} style={{ position: 'absolute', left: 96, top: 230 }}>
        <div onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setG({ x: (e.clientX - r.left) / r.width * 100, y: (e.clientY - r.top) / r.height * 100 }); }}
          style={{ position: 'relative', width: 560, aspectRatio: '1.586/1', borderRadius: 20, padding: '30px 34px', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'repeating-linear-gradient(90deg,#1b1819 0 1px,#232021 1px 2px,#1d1a1b 2px 4px)', boxShadow: '0 50px 90px rgba(0,0,0,.7), inset 0 0 0 1px #4a4244, inset 0 2px 0 rgba(255,255,255,.08)' }}>
          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(420px 260px at ${g.x}% ${g.y}%, rgba(255,250,240,.16), transparent 60%)`, pointerEvents: 'none' }} />
          <div className="mx-row" style={{ position: 'relative' }}>
            <img src={MX_LOGO} alt="" style={{ width: 40, filter: 'grayscale(1) brightness(.5) contrast(1.5) drop-shadow(0 1px 0 rgba(255,255,255,.18))' }} />
            <span className="mx-m" style={{ fontSize: 11, letterSpacing: '.34em', color: '#6a6264', textShadow: '0 1px 0 rgba(255,255,255,.1), 0 -1px 0 rgba(0,0,0,.8)' }}>KARMIC NODE · STEEL</span>
          </div>
          <div style={{ position: 'relative', marginTop: 'auto', fontSize: 34, fontWeight: 600, letterSpacing: '.08em', color: '#141213', textShadow: '0 1px 0 rgba(255,255,255,.14), 0 -1px 0 rgba(0,0,0,.9)' }}>{(name.trim() || 'O TEU NOME').toUpperCase()}</div>
          <div className="mx-row" style={{ position: 'relative', marginTop: 14 }}>
            <span className="mx-m" style={{ fontSize: 13, letterSpacing: '.3em', color: '#5d5557', textShadow: '0 1px 0 rgba(255,255,255,.1)' }}>0126 · 2026</span>
            <span className="mx-s" style={{ fontSize: 22, color: '#C9A15B' }}>Feito para durar</span>
          </div>
        </div>
      </V4Tilt>
      <V4Form s={s} kicker="— Edição metal" title={['Gravado', 'com o teu nome.']} sub="O laser grava o nome enquanto escreves. Passa o rato no cartão para ver o brilho do aço." label="Entrar" okText="Gravação concluída" nameField={[name, setName]} />
    </div>
  );
}

// ---------- 03 · CARTEIRA — três cartões empilhados, escolhe o teu ----------
function V403() {
  const s = useMx();
  const [sel, setSel] = React.useState(1);
  const cards = [
    { k: 'Passe', bg: 'linear-gradient(135deg,#8B1E2D,#3d0812)', fg: '#F4EEE6', sub: 'Membro · envio grátis acima de 60 €' },
    { k: 'Gold', bg: 'linear-gradient(135deg,#f3dc9e,#c9a15b 35%,#8b6a2a 70%,#d8b886)', fg: '#1a1006', sub: 'Portes grátis · bordado de oferta' },
    { k: 'Obsidiana', bg: 'linear-gradient(135deg,#231b1c,#0a0708)', fg: '#F4EEE6', sub: 'Acesso antecipado a cada drop' },
  ];
  return (
    <div className="mx" style={{ background: '#0A0708' }}>
      <KnBg kind="orbs" />
      <V4Top right={<span className="mx-lbl">Toca num cartão para o escolher</span>} />
      <div style={{ position: 'absolute', left: 110, top: 130, width: 500, height: 560 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 30, background: 'rgba(18,13,14,.55)', backdropFilter: 'blur(20px)', boxShadow: 'inset 0 0 0 1px rgba(228,216,198,.14)' }} />
        <div className="mx-m" style={{ position: 'absolute', left: 30, top: 26, fontSize: 11, letterSpacing: '.28em', color: '#8F8579' }}>CARTEIRA · KARMIC NODE</div>
        {cards.map((c, i) => {
          const on = i === sel, order = on ? 3 : i;
          const top = on ? 250 : 70 + i * 62;
          return (
            <button key={c.k} type="button" onClick={() => setSel(i)} style={{ position: 'absolute', left: 30, right: 30, top, height: 280, border: 'none', borderRadius: 18, padding: '24px 26px', textAlign: 'left', background: c.bg, color: c.fg, zIndex: order, boxShadow: on ? '0 -20px 50px rgba(0,0,0,.5)' : '0 -6px 20px rgba(0,0,0,.35)', transition: 'top .6s cubic-bezier(.2,.9,.3,1.1), box-shadow .4s', display: 'flex', flexDirection: 'column' }}>
              <span className="mx-row" style={{ width: '100%' }}><b style={{ fontSize: 15, letterSpacing: '.24em', fontFamily: 'Syne' }}>KARMIC NODE</b><span className="mx-m" style={{ fontSize: 11, letterSpacing: '.24em' }}>{c.k.toUpperCase()}</span></span>
              <span style={{ marginTop: 'auto', fontFamily: 'Cormorant Garamond', fontStyle: 'italic', fontSize: 40, lineHeight: 1 }}>{c.k}</span>
              <span className="mx-m" style={{ fontSize: 11, letterSpacing: '.12em', marginTop: 8, opacity: .8 }}>{c.sub}</span>
            </button>
          );
        })}
      </div>
      <V4Form s={s} kicker="— A tua carteira" title={['Escolhe', 'o teu cartão.']} sub={`Vais entrar com o cartão ${cards[sel].k}. Os três ficam guardados na tua conta.`} label={'Entrar com ' + cards[sel].k} okText={cards[sel].k + ' ativo'} />
    </div>
  );
}

// ---------- 04 · PASSE NO TELEMÓVEL — ecrã de bloqueio com o passe ----------
function V404() {
  const s = useMx();
  return (
    <div className="mx" style={{ background: 'radial-gradient(1000px 700px at 30% 40%,#1c0f12 0%,#0A0708 70%)' }}>
      <KnBg kind="waves" />
      <V4Top />
      <V4Tilt max={8} style={{ position: 'absolute', left: 190, top: 90 }}>
        <div style={{ width: 320, height: 650, borderRadius: 52, padding: 12, background: 'linear-gradient(160deg,#2a2426,#0a0809)', boxShadow: '0 50px 90px rgba(0,0,0,.7), inset 0 0 0 1px rgba(201,161,91,.35)' }}>
          <div style={{ position: 'relative', height: '100%', borderRadius: 41, overflow: 'hidden', background: 'radial-gradient(400px 400px at 50% 0%,#5a0f1a,#140709 70%)', color: '#F4EEE6', padding: '58px 16px 16px' }}>
            <div style={{ position: 'absolute', top: 11, left: '50%', width: 100, height: 28, marginLeft: -50, borderRadius: 16, background: '#000' }} />
            <div style={{ textAlign: 'center' }}><div className="mx-m" style={{ fontSize: 12, letterSpacing: '.1em', opacity: .8 }}>Domingo, 16 de novembro</div><div style={{ fontSize: 76, fontWeight: 600, letterSpacing: '-.03em', lineHeight: 1 }}>9:41</div></div>
            <div style={{ marginTop: 24, padding: '12px 14px', borderRadius: 18, background: 'rgba(245,239,230,.1)', backdropFilter: 'blur(10px)', display: 'flex', gap: 10, alignItems: 'center', animation: 'mxin .5s .3s both' }}>
              <img src={MX_LOGO} alt="" style={{ width: 30 }} /><div style={{ fontSize: 12.5, lineHeight: 1.35 }}><b>Karmic Node</b><br /><span style={{ opacity: .8 }}>{s.done ? 'Passe ativo. Bem-vindo de volta.' : 'O teu passe está pronto a usar.'}</span></div>
            </div>
            <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, borderRadius: 18, overflow: 'hidden', background: '#120d0e', boxShadow: 'inset 0 0 0 1px rgba(201,161,91,.4)' }}>
              <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg,#8B1E2D,#3d0812)' }} className="mx-row"><b style={{ fontSize: 12, letterSpacing: '.2em' }}>KARMIC NODE</b><span className="mx-m" style={{ fontSize: 10, color: '#E0C179' }}>GOLD</span></div>
              <div style={{ padding: 16, display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 96, height: 96, background: '#F4EEE6', padding: 7, display: 'grid', gridTemplateColumns: 'repeat(9,1fr)', gap: 1 }}>{Array.from({ length: 81 }, (_, i) => <i key={i} style={{ background: ((i * 37) % 7) % 2 === 0 || [0, 1, 2, 9, 11, 18, 19, 20, 6, 7, 8, 15, 17, 24, 25, 26, 54, 55, 56, 63, 65, 72, 73, 74].includes(i) ? '#17110F' : 'transparent' }} />)}</div>
                <div><div className="mx-m" style={{ fontSize: 9, letterSpacing: '.2em', color: '#8F8579' }}>PONTOS</div><div style={{ fontSize: 20, fontWeight: 600 }}>1 240</div><div className="mx-m" style={{ fontSize: 9, letterSpacing: '.2em', color: s.done ? '#7FC79B' : '#C9A15B', marginTop: 8 }}>{s.done ? '● ATIVO' : '● PRONTO'}</div></div>
              </div>
            </div>
          </div>
        </div>
      </V4Tilt>
      <V4Form s={s} kicker="— Passe de membro" title={['No bolso,', 'sempre.']} sub="Entra e o teu passe vai para a carteira do telemóvel. Funciona online e na loja do Cartaxo." okText="Passe na carteira" extra={<div className="mx-row" style={{ marginTop: 18 }}><button type="button" className="mx-link">Apple Wallet</button><button type="button" className="mx-link">Google Wallet</button></div>} />
    </div>
  );
}

// ---------- 05 · PASSAPORTE (livro) — a capa abre e mostra os carimbos ----------
function V405() {
  const s = useMx();
  const open = s.done;
  const stamps = [['CARTAXO', '16·11·26', '#8B1E2D', -12], ['LISBOA', '24H', '#7a5a2c', 8], ['PORTO', '48H', '#3d4a6b', -4], ['MADRID', 'EU', '#8B1E2D', 14]];
  return (
    <div className="mx" style={{ background: '#0A0708' }}>
      <KnBg kind="topo" opt={{ cx: 360, cy: 420 }} />
      <V4Top sub="Passaporte de membro" />
      <div style={{ position: 'absolute', left: 120, top: 160, width: 520, height: 500, perspective: 1800 }}>
        <div style={{ position: 'absolute', left: 260, top: 0, width: 260, height: 500, background: '#efe6d6', backgroundImage: 'repeating-linear-gradient(0deg,transparent 0 23px,rgba(139,30,45,.07) 23px 24px)', boxShadow: '0 40px 80px rgba(0,0,0,.6)', padding: 18, color: '#17110F' }}>
          <div className="mx-m" style={{ fontSize: 9, letterSpacing: '.24em', color: '#8B1E2D' }}>VISTOS · PÁG. 04</div>
          {stamps.map(([c, d, col, r], i) => (
            <div key={c} style={{ position: 'absolute', left: 22 + (i % 2) * 110, top: 50 + Math.floor(i / 2) * 200, width: 100, height: 100, borderRadius: i % 2 ? 6 : '50%', border: `3px double ${col}`, color: col, display: 'grid', placeItems: 'center', textAlign: 'center', transform: `rotate(${r}deg)`, opacity: open ? .9 : 0, transition: `opacity .3s ${.6 + i * .25}s`, mixBlendMode: 'multiply' }}>
              <div><div className="mx-m" style={{ fontSize: 8, letterSpacing: '.2em' }}>ENTRADA</div><b style={{ fontSize: 14 }}>{c}</b><div className="mx-m" style={{ fontSize: 9 }}>{d}</div></div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 260, top: 0, width: 260, height: 500, transformOrigin: 'left center', transform: open ? 'rotateY(-178deg)' : 'rotateY(-8deg)', transition: 'transform 1.2s cubic-bezier(.6,0,.2,1)', transformStyle: 'preserve-3d' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg,#6E1622,#3d0812 70%)', boxShadow: '0 40px 80px rgba(0,0,0,.6), inset 0 0 0 1px rgba(201,161,91,.3)', backfaceVisibility: 'hidden', opacity: open ? 0 : 1, transition: 'opacity 0s .6s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#E0C179', borderRadius: '0 8px 8px 0' }}>
            <div className="mx-m" style={{ fontSize: 9, letterSpacing: '.4em' }}>REPÚBLICA DO</div>
            <img src={MX_LOGO} alt="" style={{ width: 84, margin: '22px 0', filter: 'sepia(1) saturate(3) hue-rotate(-10deg) brightness(.95)' }} />
            <b style={{ fontSize: 18, letterSpacing: '.26em' }}>KARMIC NODE</b>
            <div className="mx-s" style={{ fontSize: 18, marginTop: 6, color: '#F4EEE6' }}>Passaporte</div>
          </div>
          <div style={{ position: 'absolute', inset: 0, background: '#e6dcc9', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', opacity: open ? 1 : 0, transition: 'opacity 0s .6s', padding: 22, color: '#17110F', borderRadius: '8px 0 0 8px' }}>
            <div className="mx-m" style={{ fontSize: 9, letterSpacing: '.24em', color: '#8B1E2D' }}>TITULAR</div>
            <div style={{ width: 90, height: 110, margin: '12px 0', background: 'radial-gradient(circle at 50% 38%,#c9b8a0 18%,transparent 19%),radial-gradient(ellipse at 50% 100%,#c9b8a0 40%,transparent 41%),#ddd2bf' }} />
            <div style={{ fontSize: 18, fontWeight: 600 }}>Membro KN</div>
            <div className="mx-m" style={{ fontSize: 10, lineHeight: 2, color: '#4E443D', marginTop: 8 }}>Nº KN0126<br />EMITIDO · CARTAXO<br />VÁLIDO · SEMPRE</div>
          </div>
        </div>
      </div>
      <V4Form s={s} kicker="— Controlo de entrada" title={['Mostra', 'o passaporte.']} sub="Entra e o passaporte abre nos teus carimbos: cada cidade para onde já enviámos uma peça tua." label="Carimbar entrada" cls="bordo" okText="Entrada carimbada" />
    </div>
  );
}

Object.assign(window, { V4Tilt, V4In, V4Form, V4Top, v4Ini, V4Stamp, V401, V402, V403, V404, V405 });

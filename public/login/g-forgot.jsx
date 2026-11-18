// ============================================================
// KARMIC NODE · LOGIN · "Esqueci-me" — 5 variantes
// 1 Ligação + contagem · 2 Código de 6 dígitos (3 passos, mexe no cartão)
// 3 Carta selada · 4 Ligação mágica (entra sem chave) · 5 Escolhe o método
// ============================================================
const GR_EASE = 'cubic-bezier(.22,1,.36,1)';
const grMask = (e) => {
  const v = (e || '').trim(); if (!v.includes('@')) return v ? v[0] + '•••••' : 'o teu email';
  const [u, d] = v.split('@'); return (u.length <= 2 ? u[0] + '•' : u[0] + '•'.repeat(Math.min(6, u.length - 2)) + u.slice(-1)) + '@' + d;
};
const grMailApp = (e) => {
  const d = ((e || '').split('@')[1] || '').toLowerCase();
  if (d.includes('gmail')) return ['Abrir Gmail', 'https://mail.google.com/'];
  if (/(outlook|hotmail|live|msn)/.test(d)) return ['Abrir Outlook', 'https://outlook.live.com/'];
  if (/(icloud|me\.com|mac\.com)/.test(d)) return ['Abrir iCloud Mail', 'https://www.icloud.com/mail'];
  if (d.includes('sapo')) return ['Abrir SAPO Mail', 'https://mail.sapo.pt/'];
  return ['Abrir o email', 'mailto:'];
};

function GRHead({ kicker, t, sub, top }) {
  return (
    <>
      {top}
      <div className="mx-lbl g">{kicker}</div>
      <h1 className="mx-h" style={{ fontSize: 58, margin: '14px 0 0' }}>{t[0]}</h1>
      <div className="mx-s" style={{ fontSize: 66, lineHeight: .95, color: 'var(--silver)' }}>{t[1]}</div>
      {sub && <p className="mx-small" style={{ fontSize: 14, lineHeight: 1.55, margin: '12px 0 22px', maxWidth: 380 }}>{sub}</p>}
    </>
  );
}
const GRFoot = ({ onBack, right }) => (
  <div className="mx-row" style={{ marginTop: 18, minHeight: 20 }}>
    <button type="button" className="mx-link" onClick={onBack}>← Voltar</button>
    {right || <span className="mx-small">Precisas de ajuda? <a className="mx-link" href="/#/ajuda" target="_top" style={{ textDecoration: 'none' }}>Contacto</a></span>}
  </div>
);
const GRBtn = ({ children, onClick, busy, disabled, gold, href }) => href
  ? <a href={href} target="_top" className="mx-btn" style={{ textDecoration: 'none', animation: `mxin .6s ${GR_EASE} both`, background: '#C9A15B', borderColor: '#C9A15B', color: '#0A0708' }}>{children} <span>→</span></a>
  : <button type="button" className="mx-btn" onClick={onClick} disabled={disabled} style={{ opacity: disabled ? .45 : 1, ...(gold ? { background: '#C9A15B', borderColor: '#C9A15B' } : {}) }}>{busy ? 'A verificar…' : <>{children} <span>→</span></>}</button>;
const grFake = (set, ms = 900) => new Promise((r) => { set(true); setTimeout(() => { set(false); r(); }, ms); });
const GREnter = ({ k }) => <GRBtn href={KN_STORE}>Entrar</GRBtn>;

// ---------- 1 · Ligação + contagem (o clássico, mais útil) ----------
function GRec1({ k, email, setEmail, onBack }) {
  const [busy, setBusy] = React.useState(false); const [sent, setSent] = React.useState(false); const [left, setLeft] = React.useState(60);
  React.useEffect(() => { if (!sent || left <= 0) return; const t = setTimeout(() => setLeft((v) => v - 1), 1000); return () => clearTimeout(t); }, [sent, left]);
  const send = async () => { if (busy) return; await grFake(setBusy); setSent(true); setLeft(60); };
  const [app, url] = grMailApp(email);
  if (sent) return (
    <div style={{ animation: `mxin .5s ${GR_EASE} both` }}>
      <GRHead kicker="— Ligação enviada" t={['Vê o teu', 'email.']} />
      <div className="mx-m" style={{ fontSize: 10, letterSpacing: '.22em', color: '#8F8579', marginTop: 22 }}>ENVIÁMOS PARA</div>
      <div className="mx-s" style={{ fontSize: 30, color: '#F4EEE6', margin: '4px 0 6px' }}>{grMask(email)}</div>
      <p className="mx-small" style={{ fontSize: 13.5, lineHeight: 1.55, margin: '0 0 22px' }}>A ligação é válida durante 30 minutos. Se não a vires, procura na pasta de spam.</p>
      <a href={url} target="_blank" rel="noreferrer" className="mx-btn" style={{ textDecoration: 'none' }}>{app} <span>↗</span></a>
      <div style={{ position: 'relative', height: 1, background: '#251C1D', marginTop: 22 }}><div style={{ position: 'absolute', left: 0, top: 0, height: 1, width: `${left / 60 * 100}%`, background: '#C9A15B', transition: 'width 1s linear' }} /></div>
      <div className="mx-row" style={{ marginTop: 12 }}>
        <button type="button" className="mx-link" onClick={() => setSent(false)}>Mudar email</button>
        {left > 0 ? <span className="mx-m" style={{ fontSize: 11, letterSpacing: '.14em', color: '#8F8579' }}>REENVIAR EM 0:{String(left).padStart(2, '0')}</span> : <button type="button" className="mx-link" onClick={send}>Reenviar</button>}
      </div>
    </div>
  );
  return (
    <>
      <GRHead kicker="— Recuperar acesso" t={['Perdeste', 'a chave?']} sub="Indica o email da tua conta. Enviamos-te uma ligação para criares uma chave nova." />
      <V4In label="Email" type="email" ph="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div style={{ height: 6 }} />
      <GRBtn onClick={send} busy={busy}>Enviar ligação</GRBtn>
      <GRFoot onBack={onBack} />
    </>
  );
}

// ---------- 2 · Código de 6 dígitos (o código monta o cartão) ----------
function GRSteps({ step }) {
  const S = ['Email', 'Código', 'Nova chave'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
      {S.map((s, i) => (
        <React.Fragment key={s}>
          <span className="mx-m" style={{ fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: i === step ? '#F4EEE6' : i < step ? '#C9A15B' : '#5d5450', transition: 'color .4s', whiteSpace: 'nowrap' }}>{String(i + 1).padStart(2, '0')} {s}{i < step ? ' ✓' : ''}</span>
          {i < 2 && <span style={{ flex: 1, height: 1, background: i < step ? '#C9A15B' : '#251C1D', transition: 'background .4s' }} />}
        </React.Fragment>
      ))}
    </div>
  );
}
function GROtp({ value, onChange }) {
  const refs = React.useRef([]);
  const set = (v) => onChange(v.replace(/\D/g, '').slice(0, 6));
  React.useEffect(() => { const i = Math.min(5, value.length); refs.current[i] && refs.current[i].focus({ preventScroll: true }); }, [value.length]);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 10 }} onPaste={(e) => { e.preventDefault(); set(e.clipboardData.getData('text')); }}>
      {Array.from({ length: 6 }, (_, i) => (
        <input key={i} ref={(el) => (refs.current[i] = el)} inputMode="numeric" maxLength={1} value={value[i] || ''}
          onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(-1); if (!d) return; set((value.slice(0, i) + d).slice(0, 6)); }}
          onKeyDown={(e) => { if (e.key === 'Backspace') { e.preventDefault(); set(value.slice(0, Math.max(0, value.length - 1))); } }}
          className="mx-m" style={{ height: 64, textAlign: 'center', fontSize: 26, background: '#110C0D', color: '#F4EEE6', border: `1px solid ${value[i] ? '#C9A15B' : i === value.length ? '#5d5450' : '#3A2D2E'}`, outline: 'none', transition: 'border-color .2s', caretColor: '#C9A15B' }} />
      ))}
    </div>
  );
}
function GRec2({ k, email, setEmail, onBack }) {
  const [step, setStep] = React.useState(0); const [busy, setBusy] = React.useState(false); const [code, setCode] = React.useState(''); const [pw2, setPw2] = React.useState('');
  React.useEffect(() => { if (step === 1) k.setPw('•'.repeat(Math.round(code.length / 6 * 5))); }, [code, step]);
  React.useEffect(() => { if (step === 1 && code.length === 6) { const t = setTimeout(() => { setStep(2); k.setPw(''); }, 500); return () => clearTimeout(t); } }, [code, step]);
  const strength = Math.min(4, Math.floor(k.pw.length / 3)), match = pw2 && pw2 === k.pw;
  const top = <GRSteps step={k.s.done ? 3 : step} />;
  if (k.s.done) return (
    <div key="d" style={{ animation: `mxin .5s ${GR_EASE} both` }}>
      <GRHead top={top} kicker="— Chave nova guardada" t={['Tudo', 'pronto.']} sub="A tua chave foi atualizada e o cartão está montado." />
      <GREnter k={k} />
    </div>
  );
  return (
    <div key={step} style={{ animation: `mxin .5s ${GR_EASE} both` }}>
      {step === 0 && <>
        <GRHead top={top} kicker="— Recuperar acesso" t={['Perdeste', 'a chave?']} sub="Enviamos-te um código de 6 dígitos. Cada dígito que escreves junta uma camada do cartão." />
        <V4In label="Email" type="email" ph="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div style={{ height: 6 }} />
        <GRBtn onClick={async () => { if (busy) return; await grFake(setBusy); setStep(1); }} busy={busy}>Enviar código</GRBtn>
        <GRFoot onBack={onBack} />
      </>}
      {step === 1 && <>
        <GRHead top={top} kicker="— Verificação" t={['Confirma', 'o código.']} sub={<>Enviámos 6 dígitos para <span style={{ color: '#E4D8C6' }}>{grMask(email)}</span>.</>} />
        <GROtp value={code} onChange={setCode} />
        <div className="mx-row" style={{ marginTop: 18 }}><button type="button" className="mx-link" onClick={() => { setStep(0); setCode(''); k.setPw(''); }}>← Mudar email</button><button type="button" className="mx-link" onClick={() => setCode('')}>Reenviar código</button></div>
        <div className="mx-m" style={{ fontSize: 9.5, letterSpacing: '.16em', color: '#5d5450', marginTop: 16 }}>DEMONSTRAÇÃO · QUALQUER CÓDIGO SERVE</div>
      </>}
      {step === 2 && <>
        <GRHead top={top} kicker="— Último passo" t={['Nova', 'chave.']} />
        <div style={{ height: 18 }} />
        <GLPw label="Nova palavra-passe" value={k.pw} onChange={(e) => k.setPw(e.target.value.slice(0, 16))} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, margin: '-4px 0 16px' }}>{[0, 1, 2, 3].map((i) => <span key={i} style={{ height: 2, background: i < strength ? (strength > 2 ? '#C9A15B' : '#8B1E2D') : '#251C1D', transition: 'background .3s' }} />)}</div>
        <V4In label="Repete a palavra-passe" type="password" ph="••••••••" value={pw2} onChange={(e) => setPw2(e.target.value.slice(0, 16))} />
        <GRBtn onClick={() => k.s.go()} busy={k.s.busy} disabled={!match || k.pw.length < 8}>Guardar e entrar</GRBtn>
        <div className="mx-m" style={{ fontSize: 10, letterSpacing: '.14em', color: pw2 && !match ? '#B12A3E' : '#5d5450', marginTop: 12 }}>{pw2 && !match ? 'AS CHAVES NÃO COINCIDEM' : 'MÍNIMO 8 CARACTERES'}</div>
      </>}
    </div>
  );
}

// ---------- 3 · Carta selada (a ligação vai num envelope) ----------
function GRec3({ k, email, setEmail, onBack }) {
  const [ph, setPh] = React.useState(0); // 0 form · 1 envelope desenha · 2 fecha · 3 selo · 4 sai · 5 texto
  const send = () => { if (ph) return; setPh(1); [[700, 2], [1400, 3], [2200, 4], [2800, 5]].forEach(([t, p]) => setTimeout(() => setPh(p), t)); };
  if (ph === 5) return (
    <div style={{ animation: `mxin .6s ${GR_EASE} both` }}>
      <GRHead kicker="— Carta enviada" t={['Está a', 'caminho.']} sub={<>Selámos a tua ligação de recuperação e enviámo-la para <span style={{ color: '#E4D8C6' }}>{grMask(email)}</span>. Chega em poucos minutos.</>} />
      <GRBtn onClick={onBack}>Voltar a entrar</GRBtn>
      <div className="mx-row" style={{ marginTop: 18 }}><span className="mx-small">Não chegou?</span><button type="button" className="mx-link" onClick={() => setPh(0)}>Enviar outra vez</button></div>
    </div>
  );
  return (
    <>
      <GRHead kicker="— Recuperar acesso" t={['Perdeste', 'a chave?']} sub="Escreve o teu email. Selamos uma ligação nova e enviamo-la para ti." />
      {ph === 0 ? <>
        <V4In label="Email" type="email" ph="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div style={{ height: 6 }} />
        <GRBtn onClick={send}>Selar e enviar</GRBtn>
        <GRFoot onBack={onBack} />
      </> : (
        <div style={{ height: 210, display: 'grid', placeItems: 'center' }}>
          <svg viewBox="0 0 400 220" width="400" height="210" style={{ overflow: 'visible', transform: ph >= 4 ? 'translate(90px,-30px) rotate(6deg)' : 'none', opacity: ph >= 4 ? 0 : 1, transition: `transform .8s ${GR_EASE}, opacity .7s` }}>
            <rect x="40" y="50" width="320" height="160" fill="#0b0809" stroke="#C9A15B" strokeWidth="1" pathLength="100" style={{ strokeDasharray: 100, strokeDashoffset: 100, animation: `ge10trace .7s ${GR_EASE} forwards` }} />
            <path d="M40 210 L170 120 M360 210 L230 120" stroke="rgba(201,161,91,.45)" strokeWidth="1" fill="none" />
            <text x="200" y="168" textAnchor="middle" className="mx-m" style={{ fontSize: 12, letterSpacing: '.12em', fill: '#E4D8C6', opacity: ph >= 2 ? 0 : 1, transition: 'opacity .3s .3s' }}>{(email || 'tu@email.com').trim()}</text>
            <polygon points="40,50 200,-40 360,50" fill="#0b0809" stroke="#C9A15B" strokeWidth="1" style={{ transformOrigin: '200px 50px', transform: ph >= 2 ? 'scaleY(-1.1)' : 'none', transition: `transform .7s cubic-bezier(.65,0,.35,1)` }} />
            <g style={{ transformOrigin: '200px 149px', transform: ph >= 3 ? 'scale(1)' : 'scale(1.6)', opacity: ph >= 3 ? 1 : 0, transition: `transform .45s cubic-bezier(.3,1.4,.5,1), opacity .2s` }}>
              <circle cx="200" cy="149" r="22" fill="#6E1622" stroke="#3d0812" strokeWidth="2" />
              <circle cx="200" cy="149" r="15" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth="1" />
              <text x="200" y="155" textAnchor="middle" style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: 17, fill: '#3d0812' }}>KN</text>
            </g>
          </svg>
          <div className="mx-m" style={{ marginTop: -6, fontSize: 10, letterSpacing: '.22em', color: '#8F8579' }}>{ph < 3 ? 'A SELAR…' : 'ENVIADA'}</div>
        </div>
      )}
    </>
  );
}

// ---------- 4 · Ligação mágica (entra sem chave) ----------
function GRec4({ k, email, setEmail, onBack }) {
  const [mode, setMode] = React.useState('magic'); const [busy, setBusy] = React.useState(false); const [sent, setSent] = React.useState(false); const [left, setLeft] = React.useState(8);
  React.useEffect(() => { if (!sent || k.s.done || mode !== 'magic') return; if (left <= 0) { k.s.go(); return; } const t = setTimeout(() => setLeft((v) => v - 1), 1000); return () => clearTimeout(t); }, [sent, left, k.s.done]);
  const send = async () => { if (busy) return; await grFake(setBusy); setSent(true); setLeft(8); };
  if (k.s.done) return (
    <div style={{ animation: `mxin .5s ${GR_EASE} both` }}>
      <GRHead kicker="— Ligação confirmada" t={['Estás', 'dentro.']} sub="Abriste a ligação e o teu cartão foi validado. Não precisaste da chave." />
      <GREnter k={k} />
    </div>
  );
  if (sent) return (
    <div style={{ animation: `mxin .5s ${GR_EASE} both` }}>
      <GRHead kicker={mode === 'magic' ? '— Ligação mágica enviada' : '— Ligação enviada'} t={mode === 'magic' ? ['Abre', 'o email.'] : ['Vê o teu', 'email.']} sub={<>{mode === 'magic' ? 'Toca na ligação que enviámos para ' : 'Enviámos a ligação para criares uma chave nova para '}<span style={{ color: '#E4D8C6' }}>{grMask(email)}</span>.{mode === 'magic' ? ' Esta página entra sozinha assim que a abrires.' : ''}</>} />
      {mode === 'magic' && <>
        <div style={{ position: 'relative', height: 1, background: '#251C1D', overflow: 'hidden', marginBottom: 14 }}><span style={{ position: 'absolute', top: 0, height: 1, width: '30%', background: '#C9A15B', animation: 'grwait 1.8s cubic-bezier(.65,0,.35,1) infinite' }} /></div>
        <div className="mx-row"><span className="mx-m" style={{ fontSize: 10.5, letterSpacing: '.2em', color: '#C9A15B' }}>À ESPERA QUE ABRAS O EMAIL…</span><span className="mx-m" style={{ fontSize: 9.5, letterSpacing: '.14em', color: '#5d5450' }}>DEMO · {left} S</span></div>
      </>}
      <div style={{ height: 22 }} />
      <a href={grMailApp(email)[1]} target="_blank" rel="noreferrer" className="mx-btn out" style={{ textDecoration: 'none' }}>{grMailApp(email)[0]} <span>↗</span></a>
      <div className="mx-row" style={{ marginTop: 18 }}><button type="button" className="mx-link" onClick={() => setSent(false)}>← Mudar email</button><button type="button" className="mx-link" onClick={onBack}>Usar a minha chave</button></div>
    </div>
  );
  return (
    <>
      {mode === 'magic'
        ? <GRHead kicker="— Sem palavra-passe" t={['Entra', 'sem chave.']} sub="Enviamos-te uma ligação de acesso único. Abres o email, tocas, e estás dentro. Válida 15 minutos." />
        : <GRHead kicker="— Recuperar acesso" t={['Perdeste', 'a chave?']} sub="Indica o email da tua conta. Enviamos-te uma ligação para criares uma chave nova." />}
      <V4In label="Email" type="email" ph="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div style={{ height: 6 }} />
      <GRBtn onClick={send} busy={busy}>{mode === 'magic' ? 'Enviar ligação mágica' : 'Enviar ligação'}</GRBtn>
      <div className="mx-row" style={{ marginTop: 18 }}>
        <button type="button" className="mx-link" onClick={onBack}>← Voltar</button>
        <button type="button" className="mx-link" onClick={() => setMode((m) => (m === 'magic' ? 'reset' : 'magic'))}>{mode === 'magic' ? 'Prefiro criar chave nova' : 'Entrar sem chave'}</button>
      </div>
    </>
  );
}

// ---------- 5 · Escolhe o método ----------
const GR5_M = [
  { id: 'email', l: 'Email', d: (e) => grMask(e), btn: 'Enviar por email', ok: (e) => <>Enviámos a ligação para <b>{grMask(e)}</b>.</> },
  { id: 'sms', l: 'SMS', d: () => '+351 ••• ••• 412', btn: 'Enviar SMS', ok: () => <>Enviámos um código para <b>+351 ••• ••• 412</b>. Chega em segundos.</> },
  { id: 'help', l: 'Apoio do clube', d: () => 'Falamos contigo em 24 h', btn: 'Pedir ajuda', ok: (e) => <>Pedido registado. A equipa Karmic Node vai contactar-te em <b>{grMask(e)}</b> nas próximas 24 h.</> },
];
function GRec5({ k, email, setEmail, onBack }) {
  const [m, setM] = React.useState(0); const [busy, setBusy] = React.useState(false); const [sent, setSent] = React.useState(false);
  const M = GR5_M[m];
  if (sent) return (
    <div style={{ animation: `mxin .5s ${GR_EASE} both` }}>
      <GRHead kicker={`— ${M.l} · enviado`} t={m === 2 ? ['Pedido', 'recebido.'] : ['Já', 'seguiu.']} />
      <div style={{ height: 1, background: 'rgba(201,161,91,.5)', transformOrigin: 'left', animation: `ge10line .9s ${GR_EASE} both`, marginTop: 24 }} />
      <p style={{ fontSize: 15, lineHeight: 1.55, color: '#E4D8C6', margin: '16px 0 26px', fontWeight: 400 }}>{M.ok(email)}</p>
      <GRBtn onClick={onBack}>Voltar a entrar</GRBtn>
      <div className="mx-row" style={{ marginTop: 18 }}><button type="button" className="mx-link" onClick={() => setSent(false)}>Escolher outro método</button></div>
    </div>
  );
  return (
    <>
      <GRHead kicker="— Recuperar acesso" t={['Recupera', 'o acesso.']} sub="Escolhe por onde queres receber ajuda." />
      <V4In label="Email da conta" type="email" ph="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        {GR5_M.map((o, i) => {
          const on = i === m;
          return (
            <button key={o.id} type="button" onClick={() => setM(i)} style={{ height: 52, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 14, background: on ? 'rgba(201,161,91,.06)' : 'transparent', border: `1px solid ${on ? '#C9A15B' : '#3A2D2E'}`, color: '#F4EEE6', textAlign: 'left', transition: 'border-color .25s, background .25s' }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${on ? '#C9A15B' : '#5d5450'}`, display: 'grid', placeItems: 'center', flex: 'none' }}>{on && <i style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9A15B' }} />}</span>
              <span className="mx-m" style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', width: 120, flex: 'none' }}>{o.l}</span>
              <span style={{ fontSize: 13, color: '#8F8579', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.d(email)}</span>
            </button>
          );
        })}
      </div>
      <GRBtn onClick={async () => { if (busy) return; await grFake(setBusy); setSent(true); }} busy={busy}>{M.btn}</GRBtn>
      <GRFoot onBack={onBack} />
    </>
  );
}

function GRec({ v, ...p }) { const C = v <= 5 ? [null, GRec1, GRec2, GRec3, GRec4, GRec5][v] : window['GRec' + v]; return C ? <C {...p} /> : null; }

Object.assign(window, { GRec, GRec1, GRec2, GRec3, GRec4, GRec5, grMask, GRHead, GRBtn, GRFoot, grFake, GR_EASE, GROtp, grMailApp });

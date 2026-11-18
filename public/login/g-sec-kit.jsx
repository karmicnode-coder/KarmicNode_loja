// ============================================================
// KARMIC NODE · Recuperação segura · kit comum (16–27)
// Todas as variantes: resposta neutra · código único · 2.º fator forte (sem SMS)
// · chave 12+ verificada contra fugas · todas as sessões terminadas · 24 h de proteção
// ============================================================
const GK_E = 'cubic-bezier(.22,1,.36,1)';
const GK_LEAKED = ['password1', 'password123', 'karmic123', 'qwerty123', 'benfica123', 'portugal123', 'karmicnode1', 'Password123'];
const gkValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((e || '').trim());
const gkDots = (k, n) => k.setPw('•'.repeat(Math.max(0, Math.min(7, n))));
const gkClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const gkHMS = (s) => [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((v) => String(v).padStart(2, '0')).join(':');

function useGKTimer(start, active) {
  const [s, setS] = React.useState(start);
  React.useEffect(() => { if (!active || s <= 0) return; const t = setTimeout(() => setS((v) => v - 1), 1000); return () => clearTimeout(t); }, [s, active]);
  return [s, setS];
}
function useGKMatch() { return React.useMemo(() => 10 + Math.floor(Math.random() * 89), []); }

const GKTitle = ({ kicker, t, sub, size = 44 }) => (
  <>
    <div className="mx-lbl g">{kicker}</div>
    <div className="mx-s" style={{ fontSize: size, lineHeight: 1.02, color: '#F4EEE6', margin: '10px 0 0' }}>{t}</div>
    {sub && <p className="mx-small" style={{ fontSize: 13.5, lineHeight: 1.55, margin: '10px 0 18px', maxWidth: 390 }}>{sub}</p>}
  </>
);
const GKIn = ({ value, onChange, ph = 'tu@email.com', type = 'email', style, autoFocus }) => (
  <label className="mx-f" style={{ marginBottom: 12 }}><input type={type} placeholder={ph} value={value} onChange={onChange} autoFocus={autoFocus} style={style} /></label>
);
const GKStrip = ({ items, style }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 14, ...style }}>
    <svg width="11" height="11" viewBox="0 0 24 24" style={{ flex: 'none' }}><rect x="5" y="10.5" width="14" height="10" rx="1.5" fill="none" stroke="#5d5450" strokeWidth="1.6" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="#5d5450" strokeWidth="1.6" /></svg>
    {items.filter(Boolean).map((t, i) => <React.Fragment key={i}>{i > 0 && <span style={{ color: '#3A2D2E' }}>·</span>}<span className="mx-m" style={{ fontSize: 9.5, letterSpacing: '.14em', color: '#5d5450', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{t}</span></React.Fragment>)}
  </div>
);
const GKCheck = ({ children, d = 0 }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #1c1516', animation: `mxin .5s ${d}s ${GK_E} both` }}>
    <span style={{ width: 14, height: 14, marginTop: 2, borderRadius: '50%', border: '1px solid #C9A15B', display: 'grid', placeItems: 'center', fontSize: 8, color: '#C9A15B', flex: 'none' }}>✓</span>
    <span style={{ fontSize: 13, lineHeight: 1.45, color: '#CBBFB1' }}>{children}</span>
  </div>
);
// Número anti-phishing (o email verdadeiro mostra o mesmo)
const GKMatch = ({ n, compact }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: compact ? '8px 14px' : '11px 16px', border: '1px solid #251C1D', marginBottom: 12 }}>
    <span style={{ flex: 1, fontSize: 12, lineHeight: 1.45, color: '#8F8579' }}>O email verdadeiro mostra este número. Se for outro, <span style={{ color: '#E4D8C6' }}>ignora-o</span>.</span>
    <span className="mx-s" style={{ fontSize: compact ? 32 : 40, lineHeight: 1, color: '#E0C179', width: 54, textAlign: 'center' }}>{n}</span>
  </div>
);
const GKFoot = ({ onBack, label = 'Voltar a entrar', right }) => (
  <div className="mx-row" style={{ marginTop: 14, minHeight: 20 }}>
    <button type="button" className="mx-link" onClick={onBack}>← {label}</button>
    {right || <span className="mx-small" style={{ fontSize: 12 }}>Ajuda? <a className="mx-link" href="/#/ajuda" target="_top" style={{ textDecoration: 'none' }}>Contacto</a></span>}
  </div>
);
const GKDemo = () => null; // botões de demonstração removidos

// Chave nova (12+ · Aa · número/símbolo · fugas de dados)
function GKNewPw({ k, cta = 'Guardar e terminar sessões' }) {
  const pw = k.pw;
  const req = [pw.length >= 12, /[A-ZÀ-Ý]/.test(pw) && /[a-zà-ý]/.test(pw), /\d/.test(pw) || /[^\w\s]/.test(pw)], ok = req.every(Boolean);
  const [b, setB] = React.useState('idle');
  React.useEffect(() => { if (!ok) { setB('idle'); return; } setB('checking'); const t = setTimeout(() => setB(GK_LEAKED.map((x) => x.toLowerCase()).includes(pw.toLowerCase()) ? 'leaked' : 'clean'), 600); return () => clearTimeout(t); }, [pw, ok]);
  return (
    <>
      <GLPw label="Nova palavra-passe" value={pw} onChange={(e) => k.setPw(e.target.value.slice(0, 64))} />
      <div style={{ display: 'flex', gap: 14, margin: '-4px 0 10px', flexWrap: 'wrap' }}><GXReq ok={req[0]}>12 caracteres</GXReq><GXReq ok={req[1]}>Aa</GXReq><GXReq ok={req[2]}>Número ou símbolo</GXReq></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 20, marginBottom: 14 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: b === 'clean' ? '#C9A15B' : b === 'leaked' ? '#B12A3E' : '#3A2D2E', transition: 'background .3s', animation: b === 'checking' ? 'mxpulse 1s infinite' : 'none' }} />
        <span style={{ fontSize: 12, color: b === 'leaked' ? '#d9475c' : b === 'clean' ? '#CBBFB1' : '#5d5450' }}>
          {b === 'idle' && 'Verificamos se a chave aparece em fugas de dados'}{b === 'checking' && 'A verificar em fugas de dados…'}{b === 'clean' && 'Não aparece em nenhuma fuga conhecida'}{b === 'leaked' && 'Esta chave apareceu numa fuga de dados. Escolhe outra.'}
        </span>
      </div>
      <GRBtn onClick={() => k.s.go()} busy={k.s.busy} disabled={b !== 'clean'}>{cta}</GRBtn>
    </>
  );
}
// Fecho comum
function GKDone({ email, title = ['Acesso', 'recuperado.'], extra }) {
  return (
    <div style={{ animation: `mxin .5s ${GK_E} both` }}>
      <GXHead kicker="— Conta protegida" t={title} />
      <div style={{ margin: '16px 0 20px' }}>
        <GKCheck d={.1}>Sessão terminada em <b style={{ color: '#E4D8C6', fontWeight: 500 }}>todos os dispositivos</b>.</GKCheck>
        <GKCheck d={.2}>Aviso enviado para <b style={{ color: '#E4D8C6', fontWeight: 500 }}>{grMask(email)}</b>.</GKCheck>
        <GKCheck d={.3}>Alterações sensíveis bloqueadas durante <b style={{ color: '#E4D8C6', fontWeight: 500 }}>24 h</b>.</GKCheck>
        {extra}
      </div>
      <GRBtn href={KN_STORE}>Entrar</GRBtn>
      <div className="mx-row" style={{ marginTop: 14 }}><span className="mx-small" style={{ fontSize: 12 }}>Não foste tu?</span><a className="mx-link" href="/#/ajuda" target="_top" style={{ textDecoration: 'none', color: '#B12A3E', borderColor: '#5a1a24' }}>Bloquear conta</a></div>
    </div>
  );
}
// Secção que abre/fecha suavemente
const GKReveal = ({ open, children }) => (
  <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: `grid-template-rows .55s ${GK_E}` }}>
    <div style={{ overflow: 'hidden' }}><div style={{ opacity: open ? 1 : 0, transition: 'opacity .35s .1s' }}>{children}</div></div>
  </div>
);
// Envio de email com verificação humana invisível
function useGKSend(email) {
  const [busy, setBusy] = React.useState(false);
  const send = (fn, ms = 800) => { if (busy || !gkValid(email)) return; setBusy(true); setTimeout(() => { setBusy(false); fn(); }, ms); };
  return [busy, send];
}

// Bloco comum Email → Código (resposta neutra, código único, nº anti-phishing, 5 tentativas)
function GKEmailCode({ k, email, setEmail, onVerified, onBack, kick = '— Recuperação segura', title = 'Perdeste a chave?', sub = 'Escreve o email da conta. A resposta é sempre a mesma, tenha ou não conta.', dots = 3, btn = 'Continuar', strip = true }) {
  const [st, setSt] = React.useState('email'); const [code, setCode] = React.useState(''); const [tries, setTries] = React.useState(5);
  const [busy, send] = useGKSend(email); const n = useGKMatch(); const [exp] = useGKTimer(600, st === 'code');
  React.useEffect(() => { if (st === 'code') gkDots(k, Math.round(code.length / 6 * dots)); }, [code, st]);
  React.useEffect(() => { if (st === 'code' && code.length === 6) { const t = setTimeout(onVerified, 450); return () => clearTimeout(t); } }, [code, st]);
  if (st === 'email') return (
    <div key="e" style={{ animation: `mxin .5s ${GK_E} both` }}>
      <GKTitle kicker={kick} t={title} sub={sub} />
      <GKIn value={email} onChange={(e) => setEmail(e.target.value)} />
      <GRBtn onClick={() => send(() => setSt('code'))} busy={busy} disabled={!gkValid(email)}>{btn}</GRBtn>
      {strip && <GKStrip items={['Verificação humana invisível', 'Ligação cifrada']} />}
      {onBack && <GKFoot onBack={onBack} />}
    </div>
  );
  return (
    <div key="c" style={{ animation: `mxin .5s ${GK_E} both` }}>
      <GKTitle kicker="— Confirma no email" t="Código único." sub={<>Se <span style={{ color: '#E4D8C6' }}>{grMask(email)}</span> tiver conta, recebe 6 dígitos.</>} />
      <GKMatch n={n} compact />
      <GROtp value={code} onChange={setCode} />
      <div className="mx-row" style={{ marginTop: 8 }}><GKStrip style={{ marginTop: 0 }} items={[`Expira ${gkClock(exp)}`, 'Uso único', `${tries}/5`]} /><GKDemo onClick={() => { setTries((t) => Math.max(1, t - 1)); setCode(''); }}>ERRADO</GKDemo></div>
      <GKFoot onBack={() => { setSt('email'); setCode(''); k.setPw(''); }} label="Mudar email" />
    </div>
  );
}

Object.assign(window, { GKEmailCode, GK_E, gkValid, gkDots, gkClock, gkHMS, useGKTimer, useGKMatch, GKTitle, GKIn, GKStrip, GKCheck, GKMatch, GKFoot, GKDemo, GKNewPw, GKDone, GKReveal, useGKSend });

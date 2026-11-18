// ============================================================
// KARMIC NODE · Recuperação REAL (Supabase) · visual "Mira fina" com números
// Email → código do Supabase (só dígitos) → chave nova → feito
// Carrega depois de g-code3.jsx e substitui window.GRec62.
// ============================================================
const KF_E = 'cubic-bezier(.22,1,.36,1)';
const KF_SHOP = KN_STORE;
const KF_HELP = '/#/ajuda';

// Casas "Mira fina" — cantos finos, só números, campo invisível por cima (colar / autopreencher)
function KFMira({ v, setV, len, bad, busy }) {
  const ref = React.useRef(null); const [fo, setFo] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => ref.current && ref.current.focus({ preventScroll: true }), 300); return () => clearTimeout(t); }, []);
  React.useEffect(() => { if (bad && ref.current) ref.current.focus({ preventScroll: true }); }, [bad]);
  const corner = (c) => ({ position: 'absolute', width: 7, height: 7, borderColor: c, borderStyle: 'solid', borderWidth: 0, transition: 'border-color .3s' });
  const half = Math.ceil(len / 2);
  const order = []; for (let i = 0; i < len; i++) { if (i === half) order.push(-1); order.push(i); }
  const cols = `repeat(${half},1fr) 18px repeat(${len - half},1fr)`;
  return (
    <div onClick={() => ref.current && ref.current.focus()} style={{ position: 'relative', display: 'grid', gridTemplateColumns: cols, gap: 6, height: 70, animation: bad ? 'gsshake .4s' : 'none', opacity: busy ? .55 : 1, transition: 'opacity .3s' }}>
      {order.map((i, j) => i < 0 ? <span key={j} style={{ display: 'grid', placeItems: 'center', color: '#5d5450' }}>–</span> : (() => {
        const act = fo && i === v.length, has = !!v[i];
        const c = bad ? '#8B1E2D' : v.length === len ? '#C9A15B' : act ? '#E4D8C6' : has ? '#8a6e3e' : '#2a2122';
        return (
          <span key={j} style={{ position: 'relative', display: 'grid', placeItems: 'center', background: act ? 'rgba(228,216,198,.03)' : 'transparent', transition: 'background .3s' }}>
            <i style={{ ...corner(c), left: 0, top: 0, borderLeftWidth: 1, borderTopWidth: 1 }} /><i style={{ ...corner(c), right: 0, top: 0, borderRightWidth: 1, borderTopWidth: 1 }} />
            <i style={{ ...corner(c), left: 0, bottom: 0, borderLeftWidth: 1, borderBottomWidth: 1 }} /><i style={{ ...corner(c), right: 0, bottom: 0, borderRightWidth: 1, borderBottomWidth: 1 }} />
            {has ? <span key={v[i] + i} className="mx-m" style={{ fontSize: 26, color: '#F4EEE6', animation: `mxin .22s ${KF_E} both` }}>{v[i]}</span>
              : act ? <i style={{ display: 'inline-block', width: 1.5, height: 22, background: '#E4D8C6', animation: 'g8blink 1.05s steps(1) infinite' }} />
              : <i style={{ width: 3, height: 3, borderRadius: '50%', background: '#3A2D2E' }} />}
          </span>
        );
      })())}
      <input ref={ref} value={v} onChange={(e) => setV(e.target.value.replace(/\D/g, '').slice(0, len))} onFocus={() => setFo(true)} onBlur={() => setFo(false)}
        inputMode="numeric" autoComplete="one-time-code" maxLength={len} disabled={busy} aria-label={'Código de ' + len + ' dígitos'}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'text', fontSize: 16, border: 0 }} />
    </div>
  );
}

const KFErr = ({ children }) => children ? <div role="alert" style={{ padding: '11px 14px', margin: '0 0 14px', border: '1px solid rgba(177,42,62,.55)', background: 'rgba(177,42,62,.08)', fontSize: 13, color: '#F4EEE6', lineHeight: 1.45 }}>{children}</div> : null;
const KFFoot = ({ onBack, label = 'Voltar a entrar', right }) => (
  <div className="mx-row" style={{ marginTop: 14, minHeight: 20 }}>
    <button type="button" className="mx-link" onClick={onBack}>← {label}</button>
    {right || <span className="mx-small" style={{ fontSize: 12 }}>Ajuda? <a className="mx-link" href={KF_HELP} target="_top" style={{ textDecoration: 'none' }}>Contacto</a></span>}
  </div>
);

// Chave nova (12+ · Aa · número/símbolo · verificação em fugas de dados reais)
function KFNewPw({ k, onSaved }) {
  const pw = k.pw;
  const req = [pw.length >= 12, /[A-ZÀ-Ý]/.test(pw) && /[a-zà-ý]/.test(pw), /\d/.test(pw) || /[^\w\s]/.test(pw)], ok = req.every(Boolean);
  const [b, setB] = React.useState('idle'); const [busy, setBusy] = React.useState(false); const [err, setErr] = React.useState('');
  React.useEffect(() => {
    if (!ok) { setB('idle'); return; }
    setB('checking'); let live = true;
    const t = setTimeout(async () => { const l = await KN_AUTH.leaked(pw); if (live) setB(l ? 'leaked' : 'clean'); }, 450);
    return () => { live = false; clearTimeout(t); };
  }, [pw, ok]);
  const save = async () => {
    if (busy || b !== 'clean') return;
    setBusy(true); setErr('');
    try { await KN_AUTH.setPassword(pw); await KN_AUTH.signOutOthers(); onSaved(); }
    catch (e) { setErr(String(e && e.message || '').toLowerCase().includes('different') ? 'A chave nova tem de ser diferente da anterior.' : KN_AUTH.msg(e)); }
    setBusy(false);
  };
  return (
    <>
      <GLPw label="Nova palavra-passe" value={pw} onChange={(e) => k.setPw(e.target.value.slice(0, 64))} auto="new-password" onEnter={save} />
      <div style={{ display: 'flex', gap: 14, margin: '-4px 0 10px', flexWrap: 'wrap' }}><GXReq ok={req[0]}>12 caracteres</GXReq><GXReq ok={req[1]}>Aa</GXReq><GXReq ok={req[2]}>Número ou símbolo</GXReq></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 20, marginBottom: 14 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: b === 'clean' ? '#C9A15B' : b === 'leaked' ? '#B12A3E' : '#3A2D2E', transition: 'background .3s', animation: b === 'checking' ? 'mxpulse 1s infinite' : 'none' }} />
        <span style={{ fontSize: 12, color: b === 'leaked' ? '#d9475c' : b === 'clean' ? '#CBBFB1' : '#5d5450' }}>
          {b === 'idle' && 'Verificamos se a chave aparece em fugas de dados'}{b === 'checking' && 'A verificar em fugas de dados…'}{b === 'clean' && 'Não aparece em nenhuma fuga conhecida'}{b === 'leaked' && 'Esta chave apareceu numa fuga de dados. Escolhe outra.'}
        </span>
      </div>
      <KFErr>{err}</KFErr>
      <GRBtn onClick={save} busy={busy} disabled={b !== 'clean'}>Guardar e terminar outras sessões</GRBtn>
    </>
  );
}

function KFDone({ email }) {
  return (
    <div style={{ animation: `mxin .5s ${KF_E} both` }}>
      <GXHead kicker="— Conta protegida" t={['Acesso', 'recuperado.']} />
      <div style={{ margin: '16px 0 20px' }}>
        <GKCheck d={.1}>Chave nova guardada para <b style={{ color: '#E4D8C6', fontWeight: 500 }}>{grMask(email)}</b>.</GKCheck>
        <GKCheck d={.2}>Sessão terminada nos <b style={{ color: '#E4D8C6', fontWeight: 500 }}>outros dispositivos</b>.</GKCheck>
      </div>
      <GRBtn href={KF_SHOP}>Entrar na loja</GRBtn>
      <div className="mx-row" style={{ marginTop: 14 }}><span className="mx-small" style={{ fontSize: 12 }}>Não foste tu?</span><a className="mx-link" href={KF_HELP} target="_top" style={{ textDecoration: 'none', color: '#B12A3E', borderColor: '#5a1a24' }}>Fala connosco</a></div>
    </div>
  );
}

function KFRecover({ k, email, setEmail, onBack }) {
  const len = window.KN_OTP_LEN || 6;
  const [st, setSt] = React.useState('email'); // email · code · pw · done
  const [v, setV] = React.useState(''); const [err, setErr] = React.useState(''); const [bad, setBad] = React.useState(false);
  const [busy, setBusy] = React.useState(false); const [wait, setWait] = React.useState(0);
  const [exp, setExp] = useGKTimer(600, st === 'code');
  React.useEffect(() => { if (wait <= 0) return; const t = setTimeout(() => setWait((w) => w - 1), 1000); return () => clearTimeout(t); }, [wait]);
  React.useEffect(() => { if (st === 'code') gkDots(k, Math.round(v.length / len * 5)); }, [v, st]);

  const rate = (e) => { const m = String(e && e.message || '').toLowerCase(); const s = m.match(/after (\d+) second/); if (s) { setWait(+s[1]); return true; } if (e && e.status === 429 || m.includes('rate')) { setWait(60); return true; } return false; };
  const send = async () => {
    if (busy || wait > 0) return;
    if (!gkValid(email)) { setErr('Confirma o email (ex.: tu@email.com).'); return; }
    setBusy(true); setErr('');
    try { await KN_AUTH.sendCode(email); try { localStorage.setItem('kn5-last-email', email.trim()); } catch (e) {} setV(''); setExp(600); setWait(45); setSt('code'); }
    catch (e) { setErr(rate(e) ? 'Já te enviámos um código há instantes.' : KN_AUTH.msg(e)); }
    setBusy(false);
  };
  const verify = async (code) => {
    setBusy(true); setErr('');
    try { await KN_AUTH.verifyCode(email, code); k.setPw(''); setSt('pw'); }
    catch (e) { setErr('Código errado ou expirado. Confirma o email ou pede outro.'); setBad(true); setTimeout(() => setBad(false), 450); setV(''); }
    setBusy(false);
  };
  React.useEffect(() => { if (st === 'code' && v.length === len && !busy) verify(v); }, [v, st]);

  if (st === 'done') return <KFDone email={email} />;
  if (st === 'pw') return (
    <div style={{ animation: `mxin .5s ${KF_E} both` }}>
      <GKTitle kicker="— Código confirmado" t="Chave nova." sub="Já estás dentro. Define uma chave nova para as próximas vezes." />
      <KFNewPw k={k} onSaved={() => { k.s.win(); setSt('done'); }} />
      <div className="mx-row" style={{ marginTop: 14 }}><a className="mx-link" href={KF_SHOP} target="_top" style={{ textDecoration: 'none' }}>Fazer isto depois</a><span /></div>
    </div>
  );
  if (st === 'email') return (
    <div style={{ animation: `mxin .5s ${KF_E} both` }}>
      <GKTitle kicker="— Recuperação segura" t="Mira fina." sub={<>Escreve o email da conta. Enviamos um código de {len} dígitos, que vais introduzir em casas de cantos finos.</>} />
      <GKIn value={email} onChange={(e) => { setEmail(e.target.value); setErr(''); }} />
      <KFErr>{err ? <>{err}{wait > 0 ? <> Podes pedir outro em <b>{gkClock(wait)}</b>.</> : null}</> : null}</KFErr>
      <GRBtn onClick={send} busy={busy} disabled={!gkValid(email) || wait > 0}>{wait > 0 ? 'Aguarda ' + gkClock(wait) : 'Enviar código'}</GRBtn>
      {wait > 0 && <button type="button" className="mx-link" onClick={() => { setErr(''); setSt('code'); }} style={{ marginTop: 14 }}>Já tenho o código</button>}
      <GKStrip items={['Resposta neutra', 'Código de uso único', 'Expira em 10 min']} />
      <KFFoot onBack={onBack} />
    </div>
  );
  return (
    <div style={{ animation: `mxin .5s ${KF_E} both` }}>
      <div className="mx-lbl g">— Código de confirmação</div>
      <p className="mx-small" style={{ fontSize: 13, lineHeight: 1.5, margin: '8px 0 16px' }}>Se <span style={{ color: '#E4D8C6' }}>{grMask(email)}</span> tiver conta, recebe o código. Vê também o spam.</p>
      <KFMira v={v} setV={(x) => { setV(x); setErr(''); }} len={len} bad={bad} busy={busy} />
      <div className="mx-row" style={{ marginTop: 10, minHeight: 16 }}>
        <span className="mx-m" style={{ fontSize: 9.5, letterSpacing: '.12em', textTransform: 'uppercase', color: err ? '#d9475c' : '#5d5450' }}>{err || (busy ? 'A confirmar…' : exp > 0 ? 'Expira ' + gkClock(exp) : 'Código expirado · pede outro')}</span>
        {wait > 0 ? <span className="mx-m" style={{ fontSize: 9.5, letterSpacing: '.12em', color: '#5d5450' }}>REENVIAR {gkClock(wait)}</span> : <button type="button" className="mx-link" onClick={send}>Reenviar</button>}
      </div>
      <div style={{ marginTop: 16 }}><a href={grMailApp(email)[1]} target="_blank" rel="noreferrer" className="mx-btn out" style={{ textDecoration: 'none' }}>{grMailApp(email)[0]} <span>↗</span></a></div>
      <KFFoot onBack={() => { setSt('email'); setV(''); setErr(''); k.setPw(''); }} label="Mudar email" />
    </div>
  );
}

window.GRec62 = KFRecover;
Object.assign(window, { KFRecover, KFMira, KFNewPw, KFDone });

// ============================================================
// KARMIC NODE · LOGIN FINAL — formulário com 3 vistas
// Entrar · Criar conta · Esqueci-me  (o cartão E10-B4 reage em todas)
// ============================================================
const GL_SHOP = KN_STORE;
const GL_EASE = 'cubic-bezier(.22,1,.36,1)';

const GL_VIEWS = {
  login: { kicker: '— Clube KN', t: ['Bem-vindo', 'de volta.'], sub: 'Escreve a tua chave e as camadas do cartão juntam-se, peça a peça.', cta: 'Iniciar sessão' },
  signup: { kicker: '— Novo membro', t: ['Cria o', 'teu cartão.'], sub: 'O teu nome dá as iniciais ao monograma. A chave monta o cartão.', cta: 'Criar cartão' },
  forgot: { kicker: '— Recuperar acesso', t: ['Perdeste', 'a chave?'], sub: 'Indica o email da tua conta. Enviamos-te uma ligação para criares uma chave nova.', cta: 'Enviar ligação' },
};

function GLPw({ label = 'Palavra-passe', value, onChange, ph = '••••••••', err, auto = 'current-password', onEnter }) {
  const [show, setShow] = React.useState(false);
  const [caps, setCaps] = React.useState(false);
  return (
    <label className="mx-f" style={{ position: 'relative' }}>
      <span>{label}{caps ? <em style={{ fontStyle: 'normal', color: '#C9A15B', marginLeft: 10 }}>· Caps Lock ligado</em> : null}</span>
      <input type={show ? 'text' : 'password'} placeholder={ph} value={value} onChange={onChange} autoComplete={auto} aria-invalid={!!err}
        onKeyDown={(e) => { setCaps(e.getModifierState && e.getModifierState('CapsLock')); if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); } }}
        style={{ paddingRight: 78, borderColor: err ? '#B12A3E' : undefined }} />
      <button type="button" onClick={() => setShow((v) => !v)} className="mx-link" style={{ position: 'absolute', right: 14, top: 34, border: 'none', fontSize: 10 }}>{show ? 'Ocultar' : 'Mostrar'}</button>
      {err ? <em className="kn-ferr">{err}</em> : null}
    </label>
  );
}

const GLIn = ({ label, type = 'text', ph, value, onChange, err, auto, onEnter }) => (
  <label className="mx-f">
    <span>{label}</span>
    <input type={type} placeholder={ph} value={value} onChange={onChange} autoComplete={auto} inputMode={type === 'email' ? 'email' : undefined} aria-invalid={!!err}
      onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); } }} style={{ borderColor: err ? '#B12A3E' : undefined }} />
    {err ? <em className="kn-ferr">{err}</em> : null}
  </label>
);

function GLSide({ k, forgotV = 0, startView = 'login' }) {
  const [view, setView] = React.useState(startView);
  const [email, setEmail] = React.useState(() => { try { return localStorage.getItem('kn5-last-email') || ''; } catch (e) { return ''; } });
  const [terms, setTerms] = React.useState(true);
  const [sent, setSent] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const V = GL_VIEWS[view];
  const s = k.s, done = s.done, busy = s.busy, fe = s.fieldErr || {};
  KN_AUTH.form = { view, email, password: k.pw, name: k.name, terms };

  const go = (v) => { if (busy || done) return; k.setPw(''); setSent(false); s.clear && s.clear(); setView(v); history.replaceState(null, '', v === 'signup' ? '#criar' : v === 'forgot' ? '#recuperar' : '#'); };
  const submit = () => {
    if (view === 'forgot') { if (sending || sent) return; setSending(true); setTimeout(() => { setSending(false); setSent(true); }, 900); return; }
    try { localStorage.setItem('kn5-last-email', email.trim()); } catch (e) {}
    s.go();
  };
  const pwLen = k.pw.length;
  const strength = Math.min(4, (pwLen >= 8) + (/[A-Z]/.test(k.pw) && /[a-z]/.test(k.pw)) + /\d/.test(k.pw) + (/[^A-Za-z0-9]/.test(k.pw) || pwLen >= 12));
  const strengthLbl = ['Muito fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'][strength];

  return (
    <div style={{ position: 'absolute', right: 96, top: 128, width: 400, zIndex: 3 }}>
      {/* separadores */}
      <div style={{ display: 'flex', gap: 22, marginBottom: 30, opacity: done ? 0 : 1, transition: 'opacity .5s', pointerEvents: done ? 'none' : 'auto' }}>
        {[['login', 'Entrar'], ['signup', 'Criar conta']].map(([id, l]) => (
          <button key={id} type="button" onClick={() => go(id)} className="mx-m" style={{ background: 'none', border: 'none', padding: '0 0 8px', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: view === id ? '#F4EEE6' : '#8F8579', borderBottom: `1px solid ${view === id ? '#C9A15B' : 'transparent'}`, transition: 'color .3s, border-color .3s' }}>{l}</button>
        ))}
      </div>

      {view === 'forgot' && forgotV ? (
        <div key={'f' + forgotV} style={{ animation: `mxin .55s ${GL_EASE} both` }}><GRec v={forgotV} k={k} email={email} setEmail={setEmail} onBack={() => { k.s.reset(); go('login'); }} /></div>
      ) : (
      <div key={view} style={{ animation: `mxin .55s ${GL_EASE} both` }}>
        <div className="mx-lbl g">{V.kicker}</div>
        <h1 className="mx-h" style={{ fontSize: 58, margin: '14px 0 0' }}>{V.t[0]}</h1>
        <div className="mx-s" style={{ fontSize: 66, lineHeight: .95, color: 'var(--silver)' }}>{V.t[1]}</div>
        <p className="mx-small" style={{ fontSize: 14, lineHeight: 1.55, margin: '12px 0 22px', maxWidth: 380 }}>{V.sub}</p>

        {s.info ? (
          <div style={{ animation: `mxin .5s ${GL_EASE} both` }}>
            <div style={{ height: 1, background: 'rgba(201,161,91,.5)', transformOrigin: 'left', animation: `ge10line .9s ${GL_EASE} both` }} />
            <div className="mx-m" style={{ fontSize: 10.5, letterSpacing: '.22em', color: '#C9A15B', marginTop: 18 }}>CONFIRMA O TEU EMAIL</div>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: '#E4D8C6', margin: '8px 0 26px' }}>{s.info} Vê também a pasta de spam.</p>
            <button type="button" className="mx-btn" onClick={() => go('login')}>Já confirmei · entrar <span>→</span></button>
          </div>
        ) : view === 'forgot' && sent ? (
          <div style={{ animation: `mxin .5s ${GL_EASE} both` }}>
            <div style={{ height: 1, background: 'rgba(201,161,91,.5)', transformOrigin: 'left', animation: `ge10line .9s ${GL_EASE} both` }} />
            <div className="mx-m" style={{ fontSize: 10.5, letterSpacing: '.22em', color: '#C9A15B', marginTop: 18 }}>LIGAÇÃO ENVIADA</div>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: '#E4D8C6', margin: '8px 0 26px' }}>Se existir uma conta para <b style={{ fontWeight: 600 }}>{email.trim() || 'esse email'}</b>, vais receber a ligação nos próximos minutos. Vê também a pasta de spam.</p>
            <button type="button" className="mx-btn" onClick={() => go('login')}>Voltar a entrar <span>→</span></button>
            <div className="mx-row" style={{ marginTop: 18 }}><span className="mx-small">Não chegou?</span><button type="button" className="mx-link" onClick={() => { setSent(false); }}>Reenviar</button></div>
          </div>
        ) : (
          <>
            {view === 'signup' && <GLIn label="Nome" ph="Nome e apelido" auto="name" value={k.name} onChange={(e) => k.setName(e.target.value.slice(0, 24))} err={fe.name} />}
            <GLIn label="Email" type="email" ph="tu@email.com" auto="email" value={email} onChange={(e) => setEmail(e.target.value)} err={fe.email} onEnter={submit} />
            {view !== 'forgot' && <GLPw label={view === 'signup' ? 'Cria uma chave' : 'Palavra-passe'} auto={view === 'signup' ? 'new-password' : 'current-password'} value={k.pw} onChange={(e) => k.setPw(e.target.value.slice(0, 64))} err={fe.password} onEnter={submit} />}

            {view === 'signup' && (
              <div style={{ margin: '-4px 0 14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>{[0, 1, 2, 3].map((i) => <span key={i} style={{ height: 2, background: i < strength ? (strength > 2 ? '#C9A15B' : '#8B1E2D') : '#251C1D', transition: 'background .3s' }} />)}</div>
                <div className="mx-m" style={{ fontSize: 10, letterSpacing: '.14em', color: '#8F8579', marginTop: 8, textTransform: 'uppercase' }}>{pwLen ? strengthLbl + ' · mín. 8, letras e números' : 'Mín. 8 caracteres, letras e números'}</div>
                <label className="mx-row" style={{ justifyContent: 'flex-start', gap: 10, marginTop: 14, cursor: 'pointer' }}>
                  <span onClick={() => setTerms((v) => !v)} style={{ width: 16, height: 16, border: '1px solid ' + (terms ? '#C9A15B' : '#3A2D2E'), display: 'grid', placeItems: 'center', color: '#C9A15B', fontSize: 11, flex: 'none' }}>{terms ? '✓' : ''}</span>
                  <span className="mx-small" style={{ fontSize: 12 }} onClick={() => setTerms((v) => !v)}>Aceito os termos e quero receber os drops do clube.</span>
                </label>
                {fe.terms ? <em className="kn-ferr">{fe.terms}</em> : null}
              </div>
            )}

            {s.error ? <div role="alert" style={{ padding: '12px 14px', margin: '6px 0 14px', border: '1px solid rgba(177,42,62,.55)', background: 'rgba(177,42,62,.08)', fontSize: 13.5, color: '#F4EEE6', lineHeight: 1.45 }}>{s.error}</div> : <div style={{ height: 6 }} />}
            {done ? (
              <a href={GL_SHOP} target="_top" className="mx-btn" style={{ textDecoration: 'none', animation: `mxin .6s ${GL_EASE} both`, background: '#C9A15B', borderColor: '#C9A15B', color: '#0A0708' }}>Entrar <span>→</span></a>
            ) : (
              <button type="button" className="mx-btn" onClick={submit} disabled={busy} style={{ opacity: busy ? .8 : 1 }}>
                {busy || sending ? 'A verificar…' : <>{V.cta} <span>→</span></>}
              </button>
            )}

            <div className="mx-row" style={{ marginTop: 18, minHeight: 20, opacity: done ? 0 : 1, transition: 'opacity .4s', pointerEvents: done ? 'none' : 'auto' }}>
              {view === 'login' && <><span className="mx-small">Novo? <button type="button" className="mx-link" onClick={() => go('signup')}>Criar conta</button></span><button type="button" className="mx-link" onClick={() => go('forgot')}>Esqueci-me</button></>}
              {view === 'signup' && <><span className="mx-small">Já és membro? <button type="button" className="mx-link" onClick={() => go('login')}>Entrar</button></span><span className="mx-m" style={{ fontSize: 10, letterSpacing: '.18em', color: '#8F8579' }}>NÃO PEDIMOS CARTÃO</span></>}
              {view === 'forgot' && <><button type="button" className="mx-link" onClick={() => go('login')}>← Voltar</button><span className="mx-small">Precisas de ajuda? <a className="mx-link" href="/#/ajuda" target="_top" style={{ textDecoration: 'none' }}>Contacto</a></span></>}
            </div>
          </>
        )}
      </div>
      )}
    </div>
  );
}

const GL_START = location.hash === '#criar' ? 'signup' : location.hash === '#recuperar' ? 'forgot' : 'login';
const GLogin = ({ forgotV = 0, startView = GL_START }) => <GE10x bg="studio" bgOpt={{ surface: 'stone', lava: true }} studio mode="drift" finale="slot" quiet renderSide={(k) => <GLSide k={k} forgotV={forgotV} startView={startView} />} />;

Object.assign(window, { GLSide, GLogin, GLPw });

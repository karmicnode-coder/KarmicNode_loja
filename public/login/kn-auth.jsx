// ============================================================
// KARMIC NODE · Autenticação real (Supabase) para o Login Clube KN
// Substitui o useMx de demonstração. O formulário põe os dados em KN_AUTH.form
// antes de chamar s.go(); aqui fazemos o pedido verdadeiro.
// Projeto Supabase: wfqvofnneaewgfwcvqcx (a mesma conta usada pela loja).
// ============================================================
const KN_SB_URL = 'https://wfqvofnneaewgfwcvqcx.supabase.co';
const KN_SB_KEY = 'sb_publishable_qIdt7lw7JKSN9bCrH076gg_UINkj8vW'; // chave pública (anon): pode estar no navegador
const KN_STORE = '/#/conta';   // para onde vai depois de entrar (trocar pelo domínio em produção)

const KN_AUTH = {
  form: { view: 'login', email: '', password: '', name: '', terms: true },
  client: null,
  sb() {
    if (this.client) return this.client;
    if (window.supabase && window.supabase.createClient) this.client = window.supabase.createClient(KN_SB_URL, KN_SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
    return this.client;
  },
  emailOk: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim()),
  // Mensagens claras em PT-PT (nunca revelam se o email existe)
  msg(err) {
    const m = String((err && (err.message || err.error_description)) || err || '').toLowerCase();
    if (m.includes('invalid login') || m.includes('invalid credentials')) return 'Email ou palavra-passe incorretos.';
    if (m.includes('email not confirmed')) return 'Confirma primeiro o teu email: enviámos-te uma ligação.';
    if (m.includes('already registered') || m.includes('already exists')) return 'Já existe uma conta com este email. Experimenta entrar.';
    if (m.includes('password') && m.includes('characters')) return 'A chave tem de ter pelo menos 8 caracteres.';
    if (m.includes('rate') || m.includes('too many')) return 'Demasiadas tentativas. Espera um minuto e tenta de novo.';
    if (m.includes('network') || m.includes('fetch')) return 'Sem ligação. Verifica a internet e tenta de novo.';
    return 'Não foi possível continuar. Tenta de novo.';
  },
  validate(f) {
    const e = {};
    if (!this.emailOk(f.email)) e.email = 'Confirma o email (ex.: tu@email.com).';
    if (f.view === 'login' && !f.password) e.password = 'Escreve a tua palavra-passe.';
    if (f.view === 'signup') {
      if (String(f.name || '').trim().split(/\s+/).length < 2) e.name = 'Nome e apelido.';
      if (String(f.password || '').length < 8) e.password = 'Pelo menos 8 caracteres.';
      else if (!/[A-Za-zÀ-ÿ]/.test(f.password) || !/\d/.test(f.password)) e.password = 'Junta letras e números.';
      if (!f.terms) e.terms = 'Aceita os termos para continuar.';
    }
    return e;
  },
  async run(f) {
    const sb = this.sb();
    if (!sb) throw new Error('network');
    const email = String(f.email).trim().toLowerCase();
    if (f.view === 'signup') {
      const { data, error } = await sb.auth.signUp({
        email, password: f.password,
        options: { data: { full_name: String(f.name).trim().slice(0, 60), newsletter: !!f.terms }, emailRedirectTo: new URL(KN_STORE, location.href).href },
      });
      if (error) throw error;
      // Com confirmação de email ativa, não há sessão até a cliente clicar na ligação
      return { needsConfirm: !data.session };
    }
    const { error } = await sb.auth.signInWithPassword({ email, password: f.password });
    if (error) throw error;
    return { needsConfirm: false };
  },
  // Entrar com código de 6 dígitos (sem mudar a chave). Não cria contas novas.
  async sendCode(email) {
    const sb = this.sb();
    if (!sb) throw new Error('network');
    const { error } = await sb.auth.signInWithOtp({ email: String(email).trim().toLowerCase(), options: { shouldCreateUser: false } });
    const m = String((error && error.message) || '').toLowerCase();
    if (error && !(m.includes('signup') || m.includes('not found') || m.includes('not allowed'))) throw error; // não revelar se o email existe
  },
  async verifyCode(email, token) {
    const sb = this.sb();
    if (!sb) throw new Error('network');
    const { error } = await sb.auth.verifyOtp({ email: String(email).trim().toLowerCase(), token: String(token), type: 'email' });
    if (error) throw error;
  },
  // Atalho para a caixa de correio da cliente
  webmail(email) {
    const d = String(email || '').split('@')[1] || '';
    const M = { 'gmail.com': ['Gmail', 'https://mail.google.com/mail/u/0/#search/from%3Asupabase+OR+karmic'], 'googlemail.com': ['Gmail', 'https://mail.google.com/'], 'outlook.com': ['Outlook', 'https://outlook.live.com/mail/'], 'outlook.pt': ['Outlook', 'https://outlook.live.com/mail/'], 'hotmail.com': ['Outlook', 'https://outlook.live.com/mail/'], 'live.com': ['Outlook', 'https://outlook.live.com/mail/'], 'live.com.pt': ['Outlook', 'https://outlook.live.com/mail/'], 'yahoo.com': ['Yahoo Mail', 'https://mail.yahoo.com/'], 'icloud.com': ['iCloud Mail', 'https://www.icloud.com/mail'], 'me.com': ['iCloud Mail', 'https://www.icloud.com/mail'], 'sapo.pt': ['SAPO Mail', 'https://mail.sapo.pt/'] };
    return M[d.toLowerCase()] || null;
  },
  mask(email) { const [u, d] = String(email || '').trim().split('@'); if (!d) return email; return (u.length <= 2 ? u[0] + '•' : u[0] + '•••' + u.slice(-1)) + '@' + d; },
  async reset(email) {
    const sb = this.sb();
    if (!sb) throw new Error('network');
    const { error } = await sb.auth.resetPasswordForEmail(String(email).trim().toLowerCase(), { redirectTo: new URL('index.html#reset', location.href).href });
    if (error && !String(error.message || '').toLowerCase().includes('not found')) throw error; // não revelar se o email existe
  },
};

// Substitui o mock: o mesmo formato { done, busy, go, reset } + error/info
function useMx() {
  const [done, setDone] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [fieldErr, setFieldErr] = React.useState({});
  const [info, setInfo] = React.useState('');
  const tries = React.useRef([]);
  const go = async () => {
    if (busy || done) return;
    const f = { ...KN_AUTH.form };
    const fe = KN_AUTH.validate(f);
    setFieldErr(fe); setError(''); setInfo('');
    if (Object.keys(fe).length) return;
    const now = Date.now(); tries.current = tries.current.filter((t) => now - t < 60000);
    if (tries.current.length >= 5) { setError('Demasiadas tentativas. Espera um minuto e tenta de novo.'); return; }
    tries.current.push(now);
    setBusy(true);
    const t0 = Date.now();
    try {
      const r = await KN_AUTH.run(f);
      await new Promise((ok) => setTimeout(ok, Math.max(0, 900 - (Date.now() - t0)))); // deixa as camadas juntarem-se
      setBusy(false);
      if (r.needsConfirm) { setInfo('Conta criada. Enviámos uma ligação para ' + f.email.trim() + ' — confirma para entrares.'); return; }
      setDone(true);
    } catch (e) {
      setBusy(false); setError(KN_AUTH.msg(e));
    }
  };
  return { done, busy, go, win: () => setDone(true), error, fieldErr, info, clear: () => { setError(''); setFieldErr({}); setInfo(''); }, reset: async () => { try { await KN_AUTH.sb().auth.signOut(); } catch (e) {} setDone(false); } };
}

Object.assign(window, { KN_AUTH, KN_STORE, useMx });

// Comprimento do código enviado pelo Supabase (Authentication → Providers → Email → "Email OTP Length"; por defeito 6)
const KN_OTP_LEN = 6;
Object.assign(KN_AUTH, {
  async setPassword(pw) { const { error } = await this.sb().auth.updateUser({ password: pw }); if (error) throw error; },
  async signOutOthers() { try { await this.sb().auth.signOut({ scope: 'others' }); } catch (e) {} },
  // Have I Been Pwned (k-anonimato): só os 5 primeiros caracteres do SHA-1 saem do browser
  async leaked(pw) {
    try {
      const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw));
      const hex = [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      const r = await fetch('https://api.pwnedpasswords.com/range/' + hex.slice(0, 5), { headers: { 'Add-Padding': 'true' } });
      if (!r.ok) return false;
      const t = await r.text();
      return t.split('\n').some((l) => { const [suf, n] = l.trim().split(':'); return suf === hex.slice(5) && +n > 0; });
    } catch (e) { return false; } // sem rede: não bloqueia
  },
});
Object.assign(window, { KN_OTP_LEN });

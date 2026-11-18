// ============================================================
// KARMIC NODE · FINAIS · A01–A08 · família CARTÃO-CHAVE (19)
// ============================================================
const FTop = ({ sub, right }) => <V4Top sub={sub} right={right} />;
const fName = (k) => k.name.trim();

// A01 · Suite Bordô — evolução direta: porta de veludo, leitor, cartão desce
function FA01() {
  const k = useV5(); const st = v6St(k.s); const inn = k.s.busy || k.s.done;
  return (
    <div className="mx" style={{ background: '#0A0708' }}>
      <KnBg kind="cloth" />
      <FTop sub="Atelier · Suite 0126" />
      <div style={{ position: 'absolute', left: 120, top: 110, width: 560, height: 640 }}>
        <div className="mx-woven" style={{ position: 'absolute', inset: 0, borderRadius: 4, boxShadow: '0 40px 80px rgba(0,0,0,.6), inset 0 0 0 12px #3d0812, inset 0 0 0 14px rgba(201,161,91,.45)' }} />
        <div className="mx-m" style={{ position: 'absolute', left: 0, right: 0, top: 42, textAlign: 'center', fontSize: 38, letterSpacing: '.3em', color: '#E0C179', textShadow: '0 1px 0 #5a4420, 0 2px 6px rgba(0,0,0,.6)' }}>0126</div>
        <div style={{ position: 'absolute', right: 64, top: 300, width: 16, height: 84, borderRadius: 8, background: 'linear-gradient(90deg,#8b6a2a,#f3dc9e,#8b6a2a)', boxShadow: '0 4px 10px rgba(0,0,0,.5)' }} />
        <V5Metal tone="black" radius={14} style={{ position: 'absolute', left: 150, top: 130, width: 260, height: 400, padding: 24 }} glare={false}>
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', gap: 10, marginTop: 4 }}>{[0, 1, 2].map((i) => <V6Lamp key={i} st={i === 0 || st !== 'idle' ? st : 'off'} style={i && st === 'idle' ? { background: '#2a2426', boxShadow: 'none' } : {}} />)}</div>
          <div style={{ position: 'relative', margin: '26px auto 0', width: 210, height: 12, borderRadius: 6, background: '#000', boxShadow: 'inset 0 2px 4px rgba(0,0,0,.9)' }} />
          <div style={{ position: 'absolute', left: 30, top: inn ? 70 : -268, transition: 'top .8s cubic-bezier(.3,1,.5,1)' }}><V6Keycard ini={k.ini} name={fName(k)} /></div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 22, display: 'flex', justifyContent: 'center' }}><V5Led text={k.s.done ? 'ENTRE' : k.s.busy ? 'A LER' : 'KN'} px={4} on={v6Col(st)} /></div>
        </V5Metal>
      </div>
      <V5Side k={k} kicker="— A tua suite no atelier" title={['Insere', 'a chave.']} sub="O cartão Clube KN, com o teu monograma, desce no leitor da porta. A luz fica verde e a porta abre." label="Abrir porta" okText="Bem-vindo à suite" />
    </div>
  );
}

// A02 · Porta que abre — a porta de veludo abre de facto e revela a loja
function FA02() {
  const k = useV5(); const st = v6St(k.s); const open = k.s.done;
  return (
    <div className="mx" style={{ background: '#050304' }}>
      <KnBg kind="rays" opt={{ cx: 400, cy: 420, k: open ? 2.4 : .5 }} />
      <FTop sub="Suite 0126" />
      <div style={{ position: 'absolute', left: 120, top: 110, width: 560, height: 640, perspective: 1800, overflow: 'visible' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%,#3A1C21,#0a0708 70%)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, padding: '110px 30px 30px', alignItems: 'end', boxShadow: 'inset 0 0 0 6px #1a1214' }}>
          {MX_PRODUCTS.slice(0, 3).map((p, i) => <img key={i} src={p.img} alt="" style={{ width: '100%', height: i === 1 ? 320 : 260, objectFit: 'cover', boxShadow: '0 20px 40px rgba(0,0,0,.6)' }} />)}
          <div className="mx-s" style={{ position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', fontSize: 40, color: '#E0C179' }}>Bem-vindo, {fName(k).split(' ')[0] || 'membro'}.</div>
        </div>
        <div className="mx-woven" style={{ position: 'absolute', inset: 0, transformOrigin: 'left center', transform: open ? 'rotateY(-100deg)' : 'none', transition: 'transform 1.8s .3s cubic-bezier(.6,0,.2,1)', boxShadow: '0 40px 80px rgba(0,0,0,.6), inset 0 0 0 12px #3d0812, inset 0 0 0 14px rgba(201,161,91,.45)' }}>
          <div className="mx-m" style={{ position: 'absolute', left: 0, right: 0, top: 42, textAlign: 'center', fontSize: 38, letterSpacing: '.3em', color: '#E0C179' }}>0126</div>
          <div style={{ position: 'absolute', right: 64, top: 300, width: 16, height: 84, borderRadius: 8, background: 'linear-gradient(90deg,#8b6a2a,#f3dc9e,#8b6a2a)' }} />
          <V5Metal tone="black" radius={12} style={{ position: 'absolute', right: 120, top: 250, width: 120, height: 190, padding: 14 }} glare={false}>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}><V6Lamp st={st} /></div>
            <div style={{ position: 'relative', margin: '14px auto 0', width: 90, height: 8, borderRadius: 4, background: '#000' }} />
            <div style={{ position: 'absolute', left: 20, top: k.s.busy || k.s.done ? 46 : -150, transition: 'top .7s cubic-bezier(.3,1,.5,1)' }}><V6Keycard ini={k.ini} name="" w={80} h={124} /></div>
          </V5Metal>
        </div>
      </div>
      <V5Side k={k} kicker="— Suite 0126" title={['A porta', 'abre-se.']} sub="Insere a chave e a porta de veludo abre-se mesmo, com luz dourada a sair do quarto. Lá dentro estão as tuas peças." label="Abrir porta" cls="bordo" okText="Porta aberta" />
    </div>
  );
}

// A03 · Cartão-chave de ouro — o cartão balança como no favorito, leitor redondo
function FA03() {
  const k = useV5(); const st = v6St(k.s); const tap = k.s.busy || k.s.done;
  return (
    <div className="mx" style={{ background: 'radial-gradient(800px 600px at 34% 50%,#2A1418 0%,#0A0708 75%)' }}>
      <KnBg kind="dust" opt={{ n: 160 }} />
      <FTop sub="Contactless · Suite" />
      <div style={{ position: 'absolute', left: 190, top: 210, width: 380, height: 380 }}>
        <V5Metal tone="black" radius={190} style={{ position: 'absolute', inset: 0 }} glare={false}>
          <V6LedRing n={60} lit={tap ? 60 : 0} r={168} st={st} dot={5} />
          <div style={{ position: 'absolute', inset: 70, borderRadius: '50%', boxShadow: 'inset 0 0 0 1px rgba(201,161,91,.4)', display: 'grid', placeItems: 'center' }}>
            <svg viewBox="0 0 60 60" width="80" height="80" fill="none" stroke={v6Col(st)} strokeWidth="3" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${v6Col(st)})`, transition: 'stroke .3s' }}><path d="M22 20a14 14 0 0 1 0 20M30 14a22 22 0 0 1 0 32M38 8a30 30 0 0 1 0 44" /></svg>
          </div>
        </V5Metal>
        <div style={{ position: 'absolute', left: 90, top: tap ? 40 : -150, transform: tap ? 'rotate(-4deg)' : 'rotate(-14deg)', transition: 'all .7s cubic-bezier(.3,1.2,.5,1)', animation: tap ? 'none' : 'mxsway 4s ease-in-out infinite', transformOrigin: '100px 0' }}>
          <V6Keycard ini={k.ini} name={fName(k)} tone="gold" w={200} h={300} />
        </div>
      </div>
      <V5Side k={k} kicker="— Aproxima e entra" title={['Toca', 'para abrir.']} sub="O cartão de ouro aproxima-se do leitor sem contacto e o anel de luzes acende de vermelho para dourado e verde." label="Aproximar cartão" okText="Leitura concluída" />
    </div>
  );
}

// A04 · Chave de hotel clássica — chave de latão com etiqueta + cartão
function FA04() {
  const k = useV5(); const st = v6St(k.s); const turned = k.s.done;
  return (
    <div className="mx" style={{ background: '#0A0708' }}>
      <KnBg kind="threads" />
      <FTop sub="Receção · Atelier" />
      <div style={{ position: 'absolute', left: 90, top: 120, width: 640, height: 600 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 640, height: 600, background: 'linear-gradient(180deg,#2a1e18,#140e0b)', boxShadow: '0 40px 80px rgba(0,0,0,.6), inset 0 0 0 1px #4a3a30' }} />
        <div style={{ position: 'absolute', left: 30, top: 30, right: 30, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {Array.from({ length: 10 }, (_, i) => { const me = i === 6; return (
            <div key={i} style={{ height: 110, background: '#0e0a08', boxShadow: 'inset 0 6px 12px rgba(0,0,0,.8)', position: 'relative', display: 'grid', placeItems: 'start center', paddingTop: 8 }}>
              <span className="mx-m" style={{ fontSize: 11, color: '#C9A15B' }}>{String(120 + i).padStart(4, '0')}</span>
              {(!me || !turned) && <div style={{ position: 'absolute', top: 30, width: 6, height: 50, background: 'linear-gradient(90deg,#8b6a2a,#f3dc9e,#8b6a2a)', borderRadius: 3, animation: me ? 'mxsway 2.6s ease-in-out infinite' : 'none', transformOrigin: '3px 0' }}><div style={{ position: 'absolute', left: -14, top: 46, width: 34, height: 44, borderRadius: '6px 6px 16px 16px', background: me ? '#8B1E2D' : '#3d0812', boxShadow: 'inset 0 0 0 1px rgba(201,161,91,.5)' }} /></div>}
            </div>
          ); })}
        </div>
        <V5Metal tone="black" radius={12} style={{ position: 'absolute', left: 60, right: 60, bottom: 40, height: 210, padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 26 }} glare={false}>
          <V6Keycard ini={k.ini} name={fName(k)} w={120} h={180} tone="bordo" style={{ transform: turned ? 'rotate(-6deg) translateY(-8px)' : 'none', transition: 'transform .6s' }} />
          <div style={{ position: 'relative', flex: 1 }}>
            <div className="mx-m" style={{ fontSize: 10, letterSpacing: '.28em', color: '#8F8579' }}>RECEÇÃO · CHECK-IN</div>
            <div style={{ fontSize: 24, fontWeight: 600, marginTop: 6 }}>{fName(k) || 'Hóspede'}</div>
            <div className="mx-m" style={{ fontSize: 12, color: '#C9A15B', marginTop: 6 }}>Suite 0126 · 1 noite · peças à espera</div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}><V6Lamp st={st} /><span className="mx-m" style={{ fontSize: 11, letterSpacing: '.2em', color: v6Col(st) }}>{turned ? 'CHECK-IN FEITO' : k.s.busy ? 'A PROCESSAR' : 'A AGUARDAR'}</span></div>
          </div>
        </V5Metal>
      </div>
      <V5Side k={k} kicker="— Receção do atelier" title={['Faz', 'o check-in.']} sub="A tua chave está no cacifo 0126, a balançar. Faz o check-in e o cartão de quarto é teu." label="Check-in" okText="Check-in feito" />
    </div>
  );
}

// A05 · Cartão-chave de cristal — cartão translúcido em leitor de vidro, aurora
function FA05() {
  const k = useV5(); const st = v6St(k.s); const inn = k.s.busy || k.s.done;
  return (
    <div className="mx" style={{ background: '#0A0708' }}>
      <KnBg kind="aurora" />
      <FTop sub="Suite Cristal" />
      <div style={{ position: 'absolute', left: 200, top: 120, width: 360, height: 600 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 26, background: 'rgba(255,255,255,.05)', backdropFilter: 'blur(18px) saturate(1.5)', WebkitBackdropFilter: 'blur(18px) saturate(1.5)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.22), inset 0 2px 0 rgba(255,255,255,.3), 0 40px 80px rgba(0,0,0,.5)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 40, display: 'flex', justifyContent: 'center' }}><V5Led text={k.s.done ? 'ABERTO' : '0126'} px={5} on={v6Col(st)} /></div>
        <div style={{ position: 'absolute', left: 50, right: 50, top: 130, height: 14, borderRadius: 7, background: 'rgba(0,0,0,.6)', boxShadow: `0 0 20px ${v6Col(st)}`, transition: 'box-shadow .3s' }} />
        <div style={{ position: 'absolute', left: 80, top: inn ? 140 : -200, transition: 'top .9s cubic-bezier(.3,1,.5,1)' }}>
          <div style={{ position: 'relative', width: 200, height: 310, borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'linear-gradient(160deg,rgba(255,255,255,.18),rgba(255,255,255,.04))', backdropFilter: 'blur(6px)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.4), 0 20px 40px rgba(0,0,0,.4)' }}>
            <img src={MX_LOGO} alt="" style={{ width: 34 }} />
            <span key={k.ini} className="mx-s" style={{ fontSize: 96, marginTop: 20, color: 'rgba(255,255,255,.92)', textShadow: '0 0 20px rgba(224,193,121,.9), 0 0 40px rgba(177,42,62,.6)', animation: 'v5stitch .8s steps(8) both' }}>{k.ini}</span>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,.9)', marginTop: 8 }}>{fName(k) || 'O teu nome'}</div>
            <div className="mx-m" style={{ fontSize: 10, letterSpacing: '.24em', color: 'rgba(255,255,255,.6)', marginTop: 'auto' }}>CRISTAL · 0126</div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, display: 'flex', justifyContent: 'center', gap: 10 }}>{[0, 1, 2, 3].map((i) => <V6Lamp key={i} st={st} size={9} />)}</div>
      </div>
      <V5Side k={k} kicker="— Edição cristal" title={['A luz', 'abre a porta.']} sub="Um cartão translúcido entra num leitor de vidro e o teu monograma acende-se com a aurora bordô." label="Inserir" okText="Suite aberta" />
    </div>
  );
}

// A06 · Elevador privado — cartão no painel do elevador, andar KN
function FA06() {
  const k = useV5(); const st = v6St(k.s); const inn = k.s.busy || k.s.done;
  const [floor, setFloor] = React.useState(0);
  React.useEffect(() => { if (!k.s.done) { setFloor(0); return; } let f = 0; const id = setInterval(() => { f += 1; setFloor(f); if (f >= 26) clearInterval(id); }, 40); return () => clearInterval(id); }, [k.s.done]);
  return (
    <div className="mx" style={{ background: '#050304' }}>
      <KnBg kind="grid" opt={{ hz: 640 }} />
      <FTop sub="Elevador privado" />
      <V5Metal tone="gold" radius={6} style={{ position: 'absolute', left: 150, top: 100, width: 500, height: 660, padding: 34 }}>
        <div style={{ position: 'relative', height: 90, borderRadius: 6, background: '#050304', boxShadow: 'inset 0 0 0 1px #5a4420, inset 0 4px 12px rgba(0,0,0,.9)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <span style={{ color: k.s.done ? V6C.ok : '#5a4420', fontSize: 34, transition: 'color .3s' }}>▲</span>
          <V5Led text={k.s.done ? (floor >= 26 ? 'KN' : String(floor).padStart(2, '0')) : 'L'} px={7} on={v6Col(st)} />
          <span style={{ color: '#5a4420', fontSize: 34 }}>▼</span>
        </div>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 30 }}>
          {['KN', '26', '12', '01', 'L', '⌂'].map((f) => <V6Key key={f} label={f} look="brass" h={78} size={20} style={{ width: 78, justifySelf: 'center', boxShadow: f === 'KN' && k.s.done ? '0 0 0 3px #7FC79B, 0 0 24px #7FC79B' : V6_LOOKS.brass.boxShadow }} />)}
        </div>
        <V5Metal tone="black" radius={10} style={{ position: 'relative', marginTop: 30, height: 130, padding: 16 }} glare={false}>
          <div className="mx-m" style={{ position: 'relative', fontSize: 9.5, letterSpacing: '.24em', color: '#C9A15B' }}>INSERIR CARTÃO · ACESSO AO PISO KN</div>
          <div style={{ position: 'relative', margin: '12px 0 0', width: '100%', height: 10, borderRadius: 5, background: '#000' }} />
          <div style={{ position: 'absolute', left: 150, top: inn ? 54 : -230, transition: 'top .8s cubic-bezier(.3,1,.5,1)' }}><V6Keycard ini={k.ini} name="" w={130} h={200} /></div>
        </V5Metal>
      </V5Metal>
      <V5Side k={k} kicker="— Piso exclusivo" title={['Sobe', 'ao piso KN.']} sub="Só os membros têm acesso ao último piso. Insere o cartão e o elevador sobe andar a andar até KN." label="Subir" okText="Piso KN" />
    </div>
  );
}

// A07 · Cacifo do atelier — cartão abre um cacifo de metal com a peça dentro
function FA07() {
  const k = useV5(); const st = v6St(k.s); const open = k.s.done;
  return (
    <div className="mx" style={{ background: '#0A0708' }}>
      <KnBg kind="nodes" opt={{ n: 60 }} />
      <FTop sub="Cacifos · Atelier" />
      <div style={{ position: 'absolute', left: 70, top: 120, width: 700, height: 600, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gridTemplateRows: 'repeat(3,1fr)', gap: 10, perspective: 1600 }}>
        {Array.from({ length: 12 }, (_, i) => { const me = i === 5; return (
          <div key={i} style={{ position: 'relative' }}>
            {me && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%,#5a0f1a,#140709)', boxShadow: 'inset 0 6px 16px rgba(0,0,0,.9)', display: 'grid', placeItems: 'center' }}><img src={MX_PRODUCTS[1].img} alt="" style={{ width: '80%', height: '80%', objectFit: 'cover', opacity: open ? 1 : 0, transition: 'opacity .5s .7s', boxShadow: '0 0 30px rgba(224,193,121,.4)' }} /></div>}
            <V5Metal tone={me ? 'bordo' : 'steel'} radius={4} style={{ position: 'absolute', inset: 0, transformOrigin: 'left center', transform: me && open ? 'rotateY(-110deg)' : 'none', transition: 'transform 1.2s cubic-bezier(.6,0,.2,1)', padding: 12 }}>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', marginTop: 4 }}>{[0, 1, 2, 3].map((j) => <i key={j} style={{ width: 60, height: 3, borderRadius: 2, background: 'rgba(0,0,0,.5)' }} />)}</div>
              <span className="mx-m" style={{ position: 'absolute', left: 12, bottom: 10, fontSize: 12, color: me ? '#E0C179' : '#4a4244' }}>{String(i + 1).padStart(2, '0')}</span>
              {me && <div style={{ position: 'absolute', right: 10, bottom: 10, width: 46, height: 62, borderRadius: 6, background: '#0a0708', boxShadow: 'inset 0 0 0 1px #5a4420', display: 'grid', placeItems: 'center' }}><V6Lamp st={st} size={8} /></div>}
            </V5Metal>
          </div>
        ); })}
      </div>
      <div style={{ position: 'absolute', left: 520, top: k.s.busy || k.s.done ? 560 : 820, transform: 'rotate(-8deg)', transition: 'top .8s cubic-bezier(.3,1.1,.5,1)' }}><V6Keycard ini={k.ini} name={fName(k)} w={120} h={180} tone="bordo" /></div>
      <V5Side k={k} kicker="— Cacifo 06" title={['A tua peça', 'está guardada.']} sub="Cada membro tem um cacifo no atelier. Passa o cartão e o cacifo 06 abre com a tua encomenda lá dentro." label="Abrir cacifo" okText="Cacifo aberto" />
    </div>
  );
}

// A08 · Mapa do hotel — cartão-chave + planta do atelier com o teu quarto
function FA08() {
  const k = useV5(); const st = v6St(k.s);
  return (
    <div className="mx" style={{ background: '#0A0708' }}>
      <KnBg kind="topo" opt={{ cx: 380, cy: 420 }} />
      <FTop sub="Planta · Atelier" />
      <div style={{ position: 'absolute', left: 70, top: 120, width: 520, height: 600, border: '1px solid rgba(201,161,91,.35)', background: 'rgba(10,7,8,.7)', backdropFilter: 'blur(4px)' }}>
        <svg viewBox="0 0 520 600" style={{ position: 'absolute', inset: 0 }} fill="none" stroke="rgba(201,161,91,.45)" strokeWidth="1.5">
          <rect x="30" y="30" width="460" height="540" /><path d="M30 200 H490 M30 400 H490 M200 30 V200 M330 200 V400 M200 400 V570" />
          <rect x="342" y="212" width="136" height="176" fill={k.s.done ? 'rgba(127,199,155,.18)' : 'rgba(177,42,62,.16)'} stroke={v6Col(st)} strokeWidth="2" style={{ transition: 'all .4s' }} />
          <path d="M60 520 C 160 520, 160 300, 300 300 L 342 300" stroke={v6Col(st)} strokeWidth="2.5" strokeDasharray="8 8" style={{ animation: 'v6dash 1.2s linear infinite' }} />
        </svg>
        {[['Montra', 60, 100], ['Estúdio', 250, 100], ['Atelier de bordado', 60, 290], ['Suite 0126', 352, 290], ['Receção', 60, 480], ['Expedição', 250, 480]].map(([t, x, y]) => <span key={t} className="mx-m" style={{ position: 'absolute', left: x, top: y, fontSize: 11, letterSpacing: '.16em', color: t === 'Suite 0126' ? v6Col(st) : '#8F8579', textTransform: 'uppercase' }}>{t}</span>)}
        <span style={{ position: 'absolute', left: 52, top: 512 }}><V6Lamp st="busy" size={14} /></span>
      </div>
      <div style={{ position: 'absolute', left: 560, top: 300, transform: 'rotate(8deg)' }}><V6Keycard ini={k.ini} name={fName(k)} w={170} h={260} /></div>
      <V5Side k={k} kicker="— Estás aqui" title={['Segue', 'o caminho.']} sub="A planta do atelier mostra o caminho da receção até à tua suite. Entra e o quarto acende a verde." label="Entrar" okText="Chegaste" style={{ right: 70 }} />
    </div>
  );
}

Object.assign(window, { FTop, fName, FA01, FA02, FA03, FA04, FA05, FA06, FA07, FA08 });

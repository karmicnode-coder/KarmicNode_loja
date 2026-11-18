// ============================================================
// KARMIC NODE · E10 II · 3 variantes (fundo + movimento + final de login)
// mode:   'z' (pilha) · 'orbit' (leque em espiral) · 'drift' (camadas deslizam de lado)
// finale: 'sweep' (vira de frente + reflexo) · 'rings' (anéis de ouro) · 'stage' (vai para o centro)
// ============================================================
function gE10Face(i, k) {
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
}

function GE10x({ bg, bgOpt, mode = 'z', finale = 'sweep', quiet = false, studio = false, renderSide, kicker, title, sub, label = 'Montar e entrar', okText = 'Cartão montado' }) {
  const k = useV5();
  const [m, bind] = useGMouse();
  const [hov, setHov] = React.useState(-1);
  const done = k.s.done, busy = k.s.busy;
  const p = done || busy ? 1 : Math.min(1, k.pw.length / 8);
  const sealed = done ? 5 : Math.floor(p * 5 + .001);
  const e = Math.pow(1 - p, 1.4);
  const ease = 'cubic-bezier(.22,1,.36,1)';
  const stage = finale === 'stage' && done;
  const veil = finale === 'veil' && done;
  const hideSide = stage || veil;
  const first = k.name.trim() ? ', ' + k.name.trim().split(' ')[0] : '';

  const rx = done ? 0 : 56 + (m.on ? (m.y / 800 - .5) * -10 : 0);
  const rz = done ? 0 : -32 + (m.on ? (m.x / 1280 - .5) * 14 : 0);
  const cont = stage ? `translate(270px,-60px) rotateX(0deg) rotateZ(0deg) scale(1.22)`
    : done && finale === 'flip' ? `rotateX(0deg) rotateZ(0deg) rotateY(180deg)`
    : done && finale === 'slot' ? `rotateX(0deg) rotateZ(0deg) scale(1)`
    : done ? `rotateX(0deg) rotateZ(0deg) scale(${quiet ? 1.02 : 1.06})` : `rotateX(${rx}deg) rotateZ(${rz}deg)`;

  const layerT = (i, lift) => {
    const c = i - 2;
    if (mode === 'orbit') return `rotateZ(${c * 16 * e}deg) translate(${c * 34 * e}px,${-c * 10 * e}px) translateZ(${i * (6 + 26 * e) + lift}px)`;
    if (mode === 'drift') return `translate(${c * 50 * e}px,${-c * 34 * e}px) translateZ(${i * (6 + 16 * e) + lift}px)`;
    return `translateZ(${i * (6 + 54 * e) + lift}px)`;
  };

  return (
    <div className="mx" style={{ background: '#030203' }} {...bind}>
      <KnBg kind={bg} opt={bgOpt} />
      {!studio && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 50% 60% at 30% 50%,transparent,rgba(3,2,3,.55) 80%)', pointerEvents: 'none' }} />}
      <div style={{ position: 'absolute', inset: 0, background: '#030203', opacity: veil ? .82 : 0, transition: `opacity 1.6s ${ease} .5s`, pointerEvents: 'none', zIndex: 1 }} />
      <FTop sub="Clube KN · Construção" />

      {finale === 'rings' && done && [0, 1, 2].map((i) => (
        <span key={i} style={{ position: 'absolute', left: 370 - 180, top: 438 - 180, width: 360, height: 360, borderRadius: '50%', border: '1px solid rgba(224,193,121,.7)', animation: `ge10ring 2.4s ${.5 + i * .35}s cubic-bezier(.2,.8,.3,1) both`, pointerEvents: 'none' }} />
      ))}

      <div style={{ position: 'absolute', left: 150, top: 300, width: 440, height: 277, perspective: 2200, zIndex: 2, clipPath: finale === 'slot' && done ? 'inset(-400px -400px -16px -400px)' : 'none' }}>
        <div style={{ position: 'absolute', inset: 0, transform: finale === 'slot' && done ? 'translateY(300px)' : 'none', transition: `transform 1.1s cubic-bezier(.65,0,.35,1) 1.3s`, transformStyle: 'preserve-3d' }}>
        <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: cont, transition: `transform ${done ? (finale === 'flip' ? 1.6 : 1.4) : 1.2}s ${ease}` }}>
          {studio && (() => {
            const Lt = KB_STUDIO_LIGHT(m);
            let dx = 370 - Lt.x, dy = 438 - Lt.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
            const lift = 10 + 46 * e, a = -rz * Math.PI / 180, cr = Math.max(.45, Math.cos(rx * Math.PI / 180));
            const ux = (dx * Math.cos(a) - dy * Math.sin(a)), uy = (dx * Math.sin(a) + dy * Math.cos(a)) / cr;
            const T = `transform .9s ${ease}, filter .9s ${ease}, opacity .6s`;
            return (
              <>
                <div style={{ position: 'absolute', inset: -24, borderRadius: 40, background: 'radial-gradient(ellipse at center,rgba(139,30,45,.22),rgba(139,30,45,0) 70%)', transform: `translate(${-ux * 10}px,${-uy * 10}px) translateZ(-3px)`, filter: 'blur(18px)', opacity: done ? 0 : .9, transition: T }} />
                <div style={{ position: 'absolute', inset: 8, borderRadius: 20, background: 'rgba(0,0,0,.8)', transform: `translate(${ux * lift}px,${uy * lift}px) translateZ(-2px)`, filter: `blur(${12 + 26 * e}px)`, opacity: done ? 0 : .95 - .35 * e, transition: T }} />
                <div style={{ position: 'absolute', left: 0, right: 0, top: '100%', height: '100%', borderRadius: 18, overflow: 'hidden', transform: `translateY(${6 + 30 * e}px) translateZ(-1px) scaleY(-1)`, opacity: done ? 0 : .1 * (1 - e * .7), filter: 'blur(2px)', WebkitMaskImage: 'linear-gradient(to top,#000,transparent 55%)', maskImage: 'linear-gradient(to top,#000,transparent 55%)', transition: T, pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#7d1c2b,#2a0709)' }} />
                  <div style={{ position: 'absolute', inset: 0 }}>{gE10Face(3, k)}</div>
                </div>
                <div style={{ position: 'absolute', inset: 4, borderRadius: 18, background: 'rgba(0,0,0,.7)', transform: `translate(${ux * 4}px,${uy * 4}px) translateZ(-1px)`, filter: 'blur(4px)', opacity: done ? 0 : .8 * (1 - e * .8), transition: T }} />
              </>
            );
          })()}
          {finale === 'flip' && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: 18, overflow: 'hidden', transform: 'translateZ(-2px) rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: 'linear-gradient(135deg,#1c1416,#0a0708)', boxShadow: 'inset 0 0 0 1px rgba(228,216,198,.14)' }}>
              <div style={{ height: 44, marginTop: 30, background: '#050304' }} />
              <div style={{ padding: '26px 30px 0' }}>
                <div className="mx-m" style={{ fontSize: 9.5, letterSpacing: '.28em', color: '#8F8579' }}>TITULAR</div>
                <div className="mx-s" style={{ fontSize: 38, color: '#F4EEE6', marginTop: 4 }}>{gName(k)}</div>
              </div>
              <div className="mx-row" style={{ position: 'absolute', left: 30, right: 30, bottom: 24 }}><span className="mx-m" style={{ fontSize: 10, letterSpacing: '.26em', color: '#C9A15B' }}>MEMBRO DESDE 2026</span><span className="mx-m" style={{ fontSize: 10, letterSpacing: '.26em', color: '#8F8579' }}>Nº 0126</span></div>
            </div>
          )}
          {GE10_L.map((L, i) => {
            const lift = hov === i && !done ? 30 : 0;
            const dim = hov >= 0 && hov !== i && !done;
            return (
              <div key={i} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', animation: `ge10float ${6 + i * .7}s ${-i * 1.3}s ease-in-out infinite`, animationPlayState: done || busy ? 'paused' : 'running' }}>
                <div style={{ position: 'absolute', inset: 0, transform: layerT(i, lift), opacity: dim ? .35 : 1, backfaceVisibility: finale === 'flip' ? 'hidden' : 'visible', WebkitBackfaceVisibility: finale === 'flip' ? 'hidden' : 'visible', transition: `transform ${busy ? .7 : 1}s ${ease} ${(busy ? 4 - i : i) * .05}s, opacity .4s` }}>
                  {gE10Face(i, k)}
                  {hov === i && !done && <div style={{ position: 'absolute', inset: -1, borderRadius: 19, boxShadow: '0 0 0 1px #E0C179, 0 0 30px rgba(224,193,121,.35)' }} />}
                  {i === 4 && done && (finale === 'sweep' || finale === 'stage') && <div style={{ position: 'absolute', inset: 0, borderRadius: 18, overflow: 'hidden' }}><span style={{ position: 'absolute', top: -40, bottom: -40, width: 120, background: 'linear-gradient(100deg,transparent,rgba(255,244,214,.55),transparent)', animation: `ge10sweep 1.3s ${stage ? 1.1 : .9}s ${ease} both` }} /></div>}
                  {i === 4 && done && finale === 'rings' && <div style={{ position: 'absolute', inset: -1, borderRadius: 19, animation: 'ge10glow 2.4s .6s ease-out both' }} />}
                </div>
              </div>
            );
          })}
          {finale === 'trace' && done && (
            <svg viewBox="0 0 464 301" style={{ position: 'absolute', left: -12, top: -12, width: 464, height: 301, overflow: 'visible', transform: 'translateZ(30px)', pointerEvents: 'none' }}>
              <rect x="1" y="1" width="462" height="299" rx="26" fill="none" stroke="#E4D8C6" strokeWidth="1" pathLength="100" style={{ strokeDasharray: 100, strokeDashoffset: 100, animation: 'ge10trace 3.2s .9s cubic-bezier(.65,0,.35,1) both' }} />
            </svg>
          )}
        </div>
        </div>
      </div>

      {/* final "settle": linha fina + número por baixo do cartão */}
      {finale === 'settle' && done && (
        <div style={{ position: 'absolute', left: 150, top: 612, width: 440, zIndex: 2 }}>
          <div style={{ height: 1, background: 'rgba(228,216,198,.5)', transformOrigin: 'left', animation: `ge10line 1.2s 1s ${ease} both` }} />
          <div className="mx-row" style={{ marginTop: 12 }}><span className="mx-m" style={{ fontSize: 10, letterSpacing: '.28em', color: '#8F8579', animation: `mxin .8s 1.6s ${ease} both` }}>Nº 0126 · ATIVO</span><span className="mx-s" style={{ fontSize: 22, color: '#E4D8C6', animation: `mxin .8s 1.8s ${ease} both` }}>Bem-vindo{first}.</span></div>
        </div>
      )}

      {/* final "slot": o cartão é guardado na ranhura */}
      {finale === 'slot' && (
        <>
          {studio
            ? <div style={{ position: 'absolute', left: 130, top: 589, width: 480, height: 8, borderRadius: 4, zIndex: 3, background: 'linear-gradient(#000,#0a0607)', boxShadow: 'inset 0 3px 4px rgba(0,0,0,1), 0 1px 0 rgba(255,220,180,.10), 0 -1px 0 rgba(0,0,0,.6)', transformOrigin: 'center', transform: done ? 'scaleX(1)' : 'scaleX(0)', opacity: done ? 1 : 0, transition: `transform 1s ${ease} ${done ? .5 : 0}s, opacity .4s ${done ? .5 : 0}s` }} />
            : <div style={{ position: 'absolute', left: 120, top: 593, width: 500, height: 1, background: 'rgba(228,216,198,.45)', zIndex: 3, transformOrigin: 'center', transform: done ? 'scaleX(1)' : 'scaleX(0)', transition: `transform .9s ${ease} ${done ? .6 : 0}s` }} />}
          {done && <div style={{ position: 'absolute', left: 150, top: 380, width: 440, textAlign: 'center', zIndex: 3 }}><div className="mx-lbl g" style={{ animation: `mxin .8s 2.4s ${ease} both` }}>— Cartão guardado{k.name.trim() ? ' · ' + k.name.trim().split(' ')[0] : ''}</div><div className="mx-s" style={{ fontSize: 52, color: '#F4EEE6', marginTop: 10, animation: `mxin .9s 2.6s ${ease} both` }}>Bem-vindo ao Clube!</div></div>}
        </>
      )}

      {/* final "veil": o resto apaga-se e fica só o cartão e o nome */}
      {veil && (
        <div style={{ position: 'absolute', left: 690, top: 330, width: 460, zIndex: 3 }}>
          <div className="mx-lbl g" style={{ animation: `mxin .8s 1.4s ${ease} both` }}>— Nº 0126</div>
          <div className="mx-s" style={{ fontSize: 64, lineHeight: 1, color: '#F4EEE6', marginTop: 14, animation: `mxin 1s 1.6s ${ease} both` }}>Bem-vindo{first}.</div>
          <div style={{ marginTop: 26, animation: `mxin .8s 2s ${ease} both` }}><button type="button" className="mx-link" onClick={k.s.reset}>Sair</button></div>
        </div>
      )}

      {/* legenda */}
      <div style={{ position: 'absolute', left: 80, right: 620, bottom: 64, opacity: hideSide || (quiet && done) ? 0 : 1, transform: hideSide ? 'translateY(14px)' : 'none', transition: `all .6s ${ease}` }}>
        <div style={{ position: 'relative', height: 1, background: 'rgba(228,216,198,.12)', marginBottom: 18 }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: 1, width: `${p * 100}%`, background: done ? (quiet ? '#E4D8C6' : '#7FC79B') : '#E0C179', boxShadow: quiet ? 'none' : `0 0 10px ${done ? '#7FC79B' : '#E0C179'}`, transition: `width .8s ${ease}, background .6s` }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
          {GE10_L.map((L, i) => {
            const ok = i < sealed;
            return (
              <div key={i} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(-1)} style={{ opacity: hov >= 0 && hov !== i ? .45 : 1, transition: 'opacity .3s' }}>
                <div className="mx-m" style={{ fontSize: 10, letterSpacing: '.22em', color: ok ? '#E0C179' : '#8F8579', transition: 'color .4s' }}>{String(i + 1).padStart(2, '0')}{ok ? ' ·  ✓' : ''}</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 6, color: '#F4EEE6' }}>{L.n}</div>
                <div className="mx-small" style={{ fontSize: 11.5, marginTop: 2 }}>{L.d}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* final "stage": boas-vindas ao centro */}
      {stage && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 590, textAlign: 'center', zIndex: 3 }}>
          <div className="mx-lbl g" style={{ animation: `mxin .8s 1.2s ${ease} both` }}>— Cartão montado · Nº 0126</div>
          <div className="mx-s" style={{ fontSize: 54, color: '#F4EEE6', marginTop: 10, animation: `mxin .9s 1.4s ${ease} both` }}>Bem-vindo{k.name.trim() ? ', ' + k.name.trim().split(' ')[0] : ''}.</div>
          <div style={{ marginTop: 16, animation: `mxin .8s 1.7s ${ease} both` }}><button type="button" className="mx-link" onClick={k.s.reset}>Sair</button></div>
        </div>
      )}

      <div style={{ position: 'absolute', inset: 0, zIndex: 2, opacity: hideSide ? 0 : 1, transform: hideSide ? 'translateX(40px)' : 'none', transition: `all .7s ${ease}`, pointerEvents: hideSide ? 'none' : 'auto' }}>
        {renderSide ? renderSide(k) : <V5Side k={k} kicker={kicker} title={title} sub={sub} label={label} okText={okText} />}
      </div>
    </div>
  );
}

// V1 · Seda + leque em espiral + vira de frente com reflexo
const GE10v1 = () => <GE10x bg="silk" mode="orbit" finale="sweep" kicker="— Como é feito · I" title={['Cinco', 'camadas.']} sub="As camadas abrem-se em leque, como um baralho. Cada letra da palavra-passe fecha o leque; ao entrares, o cartão vira-se de frente e um reflexo passa pelo laminado." label="Fechar e entrar" />;
// V2 · Pirilampos + camadas a deslizar + anéis de ouro
const GE10v2 = () => <GE10x bg="fireflies" bgOpt={{ n: 70 }} mode="drift" finale="rings" kicker="— Como é feito · II" title={['Peça', 'a peça.']} sub="As camadas estão desencontradas e deslizam para o lugar a cada letra. Ao entrares, o cartão assenta de frente e três anéis de ouro espalham-se à volta." label="Selar e entrar" okText="Cartão selado" />;
// V3 · Favos + pilha + o cartão sobe ao centro do palco
const GE10v3 = () => <GE10x bg="hexmesh" bgOpt={{ cx: 370, cy: 440 }} mode="z" finale="stage" kicker="— Como é feito · III" title={['Cinco', 'camadas.']} sub="A pilha junta-se a cada letra. Ao entrares, o formulário sai de cena, o cartão vai para o centro do ecrã e recebe-te pelo nome." label="Montar e entrar" />;

// Finais escolhidos · ambos com o caleidoscópio reativo do F20
const GE10fA = () => <GE10x bg="kaleido" bgOpt={{ cx: 370, cy: 400 }} mode="z" finale="stage" kicker="— Como é feito" title={['Cinco', 'camadas.']} sub="A pilha junta-se a cada letra da palavra-passe. Ao entrares, o formulário sai de cena, o cartão vai para o centro do ecrã e recebe-te pelo nome." label="Montar e entrar" />;
const GE10fB = () => <GE10x bg="kaleido" bgOpt={{ cx: 370, cy: 400 }} mode="drift" finale="rings" kicker="— Como é feito" title={['Peça', 'a peça.']} sub="As camadas estão desencontradas e deslizam para o lugar a cada letra. Ao entrares, o cartão assenta de frente e três anéis de ouro espalham-se à volta." label="Selar e entrar" okText="Cartão selado" />;

// B com 5 finais sóbrios (tudo o resto igual)
const GE10B = ({ finale, bg = 'kaleido', bgOpt = { cx: 370, cy: 400 }, studio = false }) => <GE10x bg={bg} bgOpt={bgOpt} studio={studio} mode="drift" finale={finale} quiet kicker="— Como é feito" title={['Peça', 'a peça.']} sub="As camadas estão desencontradas e deslizam para o lugar a cada letra. Ao entrares, o cartão assenta de frente." label="Selar e entrar" okText="Cartão selado" />;

Object.assign(window, { GE10x, GE10v1, GE10v2, GE10v3, GE10fA, GE10fB, GE10B });

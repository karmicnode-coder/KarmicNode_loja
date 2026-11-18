// ============================================================
// KARMIC NODE · FUNDOS ANIMADOS (canvas)
// <KnBg kind="orbs|dust|waves|ripples|grid|spot|rain|aurora|topo|matrix|rays|nodes" opt={{...}} />
// Pausa fora do ecrã, reage ao rato, respeita prefers-reduced-motion.
// ============================================================
const KB_GOLD = '201,161,91', KB_GOLD2 = '224,193,121', KB_BORDO = '139,30,45', KB_HI = '177,42,62', KB_SILVER = '228,216,198';
const KB_TAU = Math.PI * 2;

const KB_SCENES = {
  // Esferas bordô/ouro a flutuar (bokeh) + faíscas
  orbs(W, H) {
    const pal = [KB_BORDO, KB_HI, KB_GOLD, '90,20,30', KB_GOLD, KB_BORDO, KB_HI, '58,28,33'];
    const b = pal.map((c) => ({ c, x: W * (.08 + .84 * Math.random()), y: H * (.08 + .84 * Math.random()), r: 170 + Math.random() * 230, ph: Math.random() * KB_TAU, s: .1 + Math.random() * .18, ax: 120 + Math.random() * 180, ay: 80 + Math.random() * 120, al: c === KB_GOLD ? .16 : .3 }));
    const sp = Array.from({ length: 46 }, () => ({ x: Math.random() * W, y: Math.random() * H, p: Math.random() * KB_TAU, r: .6 + Math.random() * 1.4 }));
    return (ctx, t, m) => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      b.forEach((q, i) => {
        let x = q.x + Math.cos(t * q.s + q.ph) * q.ax, y = q.y + Math.sin(t * q.s * 1.27 + q.ph) * q.ay;
        if (i === 0 && m.on) { x += (m.x - x) * .45; y += (m.y - y) * .45; }
        const g = ctx.createRadialGradient(x, y, 0, x, y, q.r);
        g.addColorStop(0, `rgba(${q.c},${q.al})`); g.addColorStop(1, `rgba(${q.c},0)`);
        ctx.fillStyle = g; ctx.fillRect(x - q.r, y - q.r, q.r * 2, q.r * 2);
      });
      ctx.globalCompositeOperation = 'source-over';
      sp.forEach((s) => { const a = (Math.sin(t * 1.4 + s.p) + 1) / 2 * .55; ctx.fillStyle = `rgba(${KB_GOLD2},${a})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, KB_TAU); ctx.fill(); });
    };
  },

  // Poeira dourada a subir (afasta-se do rato)
  dust(W, H, o) {
    const col = o.color || KB_GOLD2;
    const mk = (init) => ({ x: Math.random() * W, y: init ? Math.random() * H : H + 10, vy: .15 + Math.random() * .55, r: .5 + Math.random() * 2, ph: Math.random() * KB_TAU, a: .2 + Math.random() * .6 });
    const p = Array.from({ length: o.n || 150 }, () => mk(true));
    return (ctx, t, m) => {
      ctx.clearRect(0, 0, W, H);
      p.forEach((q, i) => {
        q.y -= q.vy; q.x += Math.sin(t * .8 + q.ph) * .3;
        if (m.on) { const dx = q.x - m.x, dy = q.y - m.y, d2 = dx * dx + dy * dy; if (d2 < 14000) { const d = Math.sqrt(d2) + 1; q.x += dx / d * 1.4; q.y += dy / d * 1.4; } }
        if (q.y < -10) p[i] = mk(false);
        const tw = (Math.sin(t * 2 + q.ph) + 1) / 2;
        ctx.fillStyle = `rgba(${col},${q.a * (.4 + .6 * tw)})`; ctx.beginPath(); ctx.arc(q.x, q.y, Math.abs(q.r), 0, KB_TAU); ctx.fill();
        if (q.r > 1.7) { ctx.fillStyle = `rgba(${col},${q.a * .1})`; ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 4.5, 0, KB_TAU); ctx.fill(); }
      });
    };
  },

  // Ondas como fios de bordado (uma bordô, uma em pesponto)
  waves(W, H) {
    return (ctx, t, m) => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < 10; i++) {
        const y0 = H * .18 + i * 58, amp = 26 + i * 5, f = .0038 + i * .00035, sp = .35 + i * .06;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 8) {
          let y = y0 + Math.sin(x * f + t * sp + i) * amp + Math.sin(x * f * 2.3 - t * sp * .7) * amp * .35;
          if (m.on) y += Math.exp(-((x - m.x) ** 2) / 26000) * (m.y - y0) * .18;
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        const hot = i === 4;
        ctx.strokeStyle = hot ? `rgba(${KB_HI},.6)` : `rgba(${KB_GOLD},${.07 + i * .022})`;
        ctx.lineWidth = hot ? 1.8 : 1;
        if (i === 7) { ctx.setLineDash([7, 6]); ctx.lineDashOffset = -t * 34; } else ctx.setLineDash([]);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    };
  },

  // Ondas concêntricas a partir de um ponto (eco do logo)
  ripples(W, H, o) {
    const cx = o.cx ?? W / 2, cy = o.cy ?? H / 2, maxR = Math.hypot(W, H) * .8;
    return (ctx, t) => {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1; ctx.strokeStyle = `rgba(${KB_GOLD},.05)`;
      for (let r = 40; r < maxR; r += 26) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, KB_TAU); ctx.stroke(); }
      for (let k = 0; k < 8; k++) {
        const ph = ((t / 11) + k / 8) % 1, r = Math.max(.1, ph * maxR), a = (1 - ph) * .42;
        ctx.strokeStyle = k % 3 === 0 ? `rgba(${KB_HI},${a})` : `rgba(${KB_GOLD},${a})`;
        ctx.lineWidth = .8 + (1 - ph) * 1.8;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, KB_TAU); ctx.stroke();
      }
    };
  },

  // Chão em grelha a avançar (o herói do site, em movimento)
  grid(W, H, o) {
    const hz = o.hz ?? H * .56;
    return (ctx, t) => {
      ctx.clearRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, hz, 0, W / 2, hz, W * .5);
      g.addColorStop(0, `rgba(${KB_GOLD},.22)`); g.addColorStop(1, `rgba(${KB_GOLD},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const N = 22;
      for (let i = 0; i < N; i++) {
        const p = (i + (t * .45) % 1) / N, y = hz + (H - hz) * p * p;
        ctx.strokeStyle = `rgba(${KB_SILVER},${.02 + p * .16})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.strokeStyle = `rgba(${KB_SILVER},.07)`;
      for (let j = -20; j <= 20; j++) { ctx.beginPath(); ctx.moveTo(W / 2 + j * 12, hz); ctx.lineTo(W / 2 + j * 170, H); ctx.stroke(); }
      ctx.fillStyle = `rgba(${KB_GOLD},.4)`; ctx.fillRect(0, hz, W, 1);
    };
  },

  // Projetores de palco a oscilar + poeira
  spot(W, H) {
    const d = KB_SCENES.dust(W, H, { n: 90 });
    return (ctx, t, m) => {
      d(ctx, t, m);
      ctx.globalCompositeOperation = 'lighter';
      [[.18, .45, 0, .15], [.5, .33, 2, .11], [.82, .4, 4, .15]].forEach(([x0, sp, ph, a]) => {
        const top = W * x0, bot = top + Math.sin(t * sp + ph) * 220;
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, `rgba(${KB_GOLD2},${a})`); g.addColorStop(1, `rgba(${KB_GOLD2},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(top - 24, 0); ctx.lineTo(top + 24, 0); ctx.lineTo(bot + 240, H); ctx.lineTo(bot - 240, H); ctx.closePath(); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    };
  },

  // Chuva no vidro + luzes desfocadas da rua
  rain(W, H) {
    const st = Array.from({ length: 170 }, () => ({ x: Math.random() * W, y: Math.random() * H, l: 10 + Math.random() * 26, v: 8 + Math.random() * 10 }));
    const dr = Array.from({ length: 80 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: 1.4 + Math.random() * 4, v: Math.random() < .3 ? .4 + Math.random() * 1.2 : 0 }));
    const bk = Array.from({ length: 14 }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H * .85, r: 30 + Math.random() * 70, c: i % 3 ? KB_GOLD : KB_HI, p: Math.random() * 6 }));
    return (ctx, t) => {
      ctx.clearRect(0, 0, W, H);
      bk.forEach((b) => { const a = .05 + .04 * Math.sin(t * .8 + b.p); const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r); g.addColorStop(0, `rgba(${b.c},${a * 2})`); g.addColorStop(.7, `rgba(${b.c},${a})`); g.addColorStop(1, `rgba(${b.c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, KB_TAU); ctx.fill(); });
      ctx.strokeStyle = `rgba(${KB_SILVER},.2)`; ctx.lineWidth = 1; ctx.beginPath();
      st.forEach((s) => { s.y += s.v; s.x -= s.v * .15; if (s.y > H + 30) { s.y = -30; s.x = Math.random() * W * 1.1; } ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + s.l * .15, s.y - s.l); });
      ctx.stroke();
      dr.forEach((d) => {
        if (d.v) { d.y += d.v; if (d.y > H + 10) { d.y = -10; d.x = Math.random() * W; } ctx.strokeStyle = `rgba(${KB_SILVER},.06)`; ctx.lineWidth = d.r * .7; ctx.beginPath(); ctx.moveTo(d.x, d.y - d.r); ctx.lineTo(d.x, d.y - d.r - 42); ctx.stroke(); }
        ctx.fillStyle = `rgba(${KB_SILVER},.1)`; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, KB_TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.32)'; ctx.beginPath(); ctx.arc(d.x - d.r * .3, d.y - d.r * .35, d.r * .28, 0, KB_TAU); ctx.fill();
      });
    };
  },

  // Cortinas de luz bordô e ouro
  aurora(W, H) {
    const bands = [{ c: KB_BORDO, y: .36, a: .38, f: .0022, s: .25 }, { c: KB_HI, y: .48, a: .26, f: .003, s: -.18 }, { c: KB_GOLD, y: .3, a: .14, f: .0018, s: .15 }, { c: '90,20,30', y: .58, a: .32, f: .0026, s: .3 }];
    return (ctx, t) => {
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      bands.forEach((b, i) => {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(Math.max(0, b.y - .3), `rgba(${b.c},0)`); g.addColorStop(b.y, `rgba(${b.c},${b.a})`); g.addColorStop(Math.min(1, b.y + .3), `rgba(${b.c},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, H);
        for (let x = 0; x <= W; x += 16) ctx.lineTo(x, H * b.y - 170 + Math.sin(x * b.f + t * b.s + i) * 90 + Math.sin(x * b.f * 2.1 - t * b.s * 1.4) * 40);
        for (let x = W; x >= 0; x -= 16) ctx.lineTo(x, H * b.y + 200 + Math.sin(x * b.f + t * b.s + i + 1) * 90 + Math.sin(x * b.f * 1.7 + t * b.s) * 50);
        ctx.closePath(); ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
    };
  },

  // Curvas de nível a respirar (mapa topográfico)
  topo(W, H, o) {
    const cx = o.cx ?? W * .35, cy = o.cy ?? H * .55;
    return (ctx, t) => {
      ctx.clearRect(0, 0, W, H);
      for (let k = 1; k < 26; k++) {
        const base = k * 34;
        ctx.strokeStyle = k % 5 === 0 ? `rgba(${KB_GOLD},.22)` : `rgba(${KB_GOLD},.085)`;
        ctx.lineWidth = k % 5 === 0 ? 1.3 : 1;
        ctx.beginPath();
        for (let a = 0; a <= KB_TAU + .05; a += .05) {
          const r = base + Math.sin(a * 3 + t * .35 + k * .35) * 14 + Math.sin(a * 5 - t * .25 + k * .2) * 8;
          const x = cx + Math.cos(a) * r * 1.25, y = cy + Math.sin(a) * r;
          a ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
    };
  },

  // Matriz de pontos LED com onda (segue o rato)
  matrix(W, H) {
    const gap = 26;
    return (ctx, t, m) => {
      ctx.clearRect(0, 0, W, H);
      const px = m.on ? m.x : W * .5 + Math.cos(t * .3) * W * .3, py = m.on ? m.y : H * .5 + Math.sin(t * .4) * H * .3;
      for (let y = gap / 2; y < H; y += gap) for (let x = gap / 2; x < W; x += gap) {
        const d = Math.hypot(x - px, y - py), w = (Math.sin(d * .03 - t * 3) + 1) / 2, f = Math.max(0, 1 - d / 540), v = w * f;
        ctx.fillStyle = v > .55 ? `rgba(${KB_HI},${.05 + v * .6})` : `rgba(${KB_GOLD},${.05 + v * .45})`;
        ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      }
    };
  },

  // Raios de luz a rodar a partir de um ponto + poeira
  rays(W, H, o) {
    const cx = o.cx ?? W / 2, cy = o.cy ?? H * .6, k = o.k ?? 1, d = KB_SCENES.dust(W, H, { n: 110 });
    return (ctx, t, m) => {
      d(ctx, t, m);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 14; i++) {
        const a = i / 14 * KB_TAU + t * .06, w = .07 + .04 * Math.sin(t * .7 + i);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 900);
        g.addColorStop(0, `rgba(${KB_GOLD2},${.12 * k})`); g.addColorStop(1, `rgba(${KB_GOLD2},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 900, a, a + w); ctx.closePath(); ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    };
  },

  // Constelação de nós ligados (o nome da marca) — reage ao rato
  nodes(W, H, o) {
    const N = o.n || 80;
    const p = Array.from({ length: N }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .38, vy: (Math.random() - .5) * .38, hot: i % 11 === 0, ph: Math.random() * 6 }));
    return (ctx, t, m) => {
      ctx.clearRect(0, 0, W, H);
      p.forEach((q) => {
        q.x += q.vx; q.y += q.vy;
        if (q.x < 0 || q.x > W) q.vx *= -1;
        if (q.y < 0 || q.y > H) q.vy *= -1;
        if (m.on) { const dx = q.x - m.x, dy = q.y - m.y, d = Math.hypot(dx, dy) + .01; if (d < 110) { q.x += dx / d * .9; q.y += dy / d * .9; } }
      });
      ctx.lineWidth = 1;
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const a = p[i], b = p[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 150) { ctx.strokeStyle = (a.hot || b.hot) ? `rgba(${KB_HI},${(1 - d / 150) * .55})` : `rgba(${KB_GOLD},${(1 - d / 150) * .28})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      if (m.on) p.forEach((q) => { const d = Math.hypot(q.x - m.x, q.y - m.y); if (d < 220) { ctx.strokeStyle = `rgba(${KB_GOLD2},${(1 - d / 220) * .5})`; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(m.x, m.y); ctx.stroke(); } });
      p.forEach((q) => {
        ctx.fillStyle = q.hot ? '#B12A3E' : '#C9A15B';
        ctx.beginPath(); ctx.arc(q.x, q.y, q.hot ? 2.6 + Math.sin(t * 3 + q.ph) * .9 : 1.6, 0, KB_TAU); ctx.fill();
        if (q.hot) { ctx.fillStyle = `rgba(${KB_HI},.14)`; ctx.beginPath(); ctx.arc(q.x, q.y, 11, 0, KB_TAU); ctx.fill(); }
      });
    };
  },
};

function KnBg({ kind, opt = {}, w = 1280, h = 800, style }) {
  const ref = React.useRef(null);
  const key = kind + JSON.stringify(opt);
  React.useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    c.width = w; c.height = h;
    const scene = KB_SCENES[kind](w, h, opt);
    const mouse = { x: w / 2, y: h / 2, on: false };
    const host = c.parentElement;
    const mm = (e) => { const r = c.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width * w; mouse.y = (e.clientY - r.top) / r.height * h; mouse.on = true; };
    const ml = () => { mouse.on = false; };
    host.addEventListener('mousemove', mm); host.addEventListener('mouseleave', ml);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0, visible = true, t0 = performance.now();
    const step = (now) => { if (!visible) return; scene(ctx, Math.max(0, (now - t0) / 1000), mouse); if (!reduce) raf = requestAnimationFrame(step); };
    const io = new IntersectionObserver(([e]) => { const was = visible; visible = e.isIntersecting; if (visible && !was) { cancelAnimationFrame(raf); raf = requestAnimationFrame(step); } });
    io.observe(c);
    raf = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(raf); io.disconnect(); host.removeEventListener('mousemove', mm); host.removeEventListener('mouseleave', ml); };
  }, [key, w, h]);
  return <canvas ref={ref} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', ...style }} />;
}

Object.assign(window, { KB_SCENES, KnBg });

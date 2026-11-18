// ============================================================
// KARMIC NODE · FUNDO "ESTÚDIO" — superfície escura + uma luz quente
// <KnBg kind="studio" opt={{ surface: 'velvet' | 'stone' }} />
// Sem padrões, sem partículas, sem linhas. Só superfície, luz e grão.
// A luz: centro (300,330) + rato × 0,06 / 0,05 (o cartão usa a mesma fórmula para a sombra)
// ============================================================
const KB_STUDIO_LIGHT = (m) => ({ x: 300 + (m.on ? (m.x - 384) * .06 : 0), y: 330 + (m.on ? (m.y - 400) * .05 : 0) });

(function () {
  Object.assign(KB_SCENES, {
    studio(W, Hh, o) {
      const velvet = (o.surface || 'velvet') === 'velvet';
      // camada base pré-desenhada: superfície + profundidade + vinheta + grão
      const base = document.createElement('canvas'); base.width = W; base.height = Hh;
      const b = base.getContext('2d');
      let g = b.createLinearGradient(0, 0, 0, Hh);
      if (velvet) { g.addColorStop(0, '#060304'); g.addColorStop(.45, '#0e0708'); g.addColorStop(1, '#170a0d'); }
      else { g.addColorStop(0, '#050505'); g.addColorStop(.45, '#0c0b0c'); g.addColorStop(1, '#141314'); }
      b.fillStyle = g; b.fillRect(0, 0, W, Hh);
      // textura: veludo = pêlo direcional muito fino · pedra = manchas de baixa frequência quase invisíveis
      const tex = document.createElement('canvas'); tex.width = W / 4; tex.height = Hh / 4;
      const tx = tex.getContext('2d'); const id = tx.createImageData(tex.width, tex.height);
      for (let y = 0; y < tex.height; y++) for (let x = 0; x < tex.width; x++) {
        const i = (y * tex.width + x) * 4;
        const v = velvet ? 128 + Math.sin(x * .9 + Math.sin(y * .05) * 3) * 6 + (Math.random() - .5) * 30
          : 128 + Math.sin(x * .07 + y * .03) * 8 + Math.sin(x * .021 - y * .05 + 2) * 10 + (Math.random() - .5) * 18;
        id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
      }
      tx.putImageData(id, 0, 0);
      b.save(); b.globalAlpha = velvet ? .05 : .045; b.globalCompositeOperation = 'overlay'; b.imageSmoothingEnabled = true; b.drawImage(tex, 0, 0, W, Hh); b.restore();
      // vinheta
      g = b.createRadialGradient(W * .36, Hh * .56, 200, W * .36, Hh * .56, W * .85);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.72)');
      b.fillStyle = g; b.fillRect(0, 0, W, Hh);

      // grão fino (estático)
      const gr = document.createElement('canvas'); gr.width = W; gr.height = Hh;
      const gx = gr.getContext('2d'); const gd = gx.createImageData(W, Hh);
      for (let i = 0; i < gd.data.length; i += 4) { const v = Math.random() * 255; gd.data[i] = gd.data[i + 1] = gd.data[i + 2] = v; gd.data[i + 3] = 255; }
      gx.putImageData(gd, 0, 0);

      // ---- esferas de lava: 6 bolas 3D medianas que fluem À VOLTA do cartão (nunca por cima) ----
      const lava = !!o.lava;
      const CARD = { x: 370, y: 440, rx: 330, ry: 235 };      // zona do cartão (elipse a evitar)
      const LEG = { x0: 60, x1: 680, y0: 640, y1: 760 };      // legenda
      const BOUND = { x0: 40, x1: 770, y0: 96, y1: 770 };     // lado esquerdo; o formulário fica livre
      const mkSprite = (r) => {
        const S = Math.ceil(r * 2.6), c = document.createElement('canvas'); c.width = c.height = S * 2; const x = c.getContext('2d'); const C = S;
        // corpo: bordô muito escuro com luz de cima-esquerda
        let g = x.createRadialGradient(C - r * .38, C - r * .42, r * .05, C, C, r);
        g.addColorStop(0, '#7a1a29'); g.addColorStop(.35, '#4e0d18'); g.addColorStop(.8, '#22050a'); g.addColorStop(1, '#120205');
        x.fillStyle = g; x.beginPath(); x.arc(C, C, r, 0, Math.PI * 2); x.fill();
        // luz de contorno (rim) quente em baixo-direita
        x.save(); x.beginPath(); x.arc(C, C, r, 0, Math.PI * 2); x.clip();
        g = x.createRadialGradient(C + r * .55, C + r * .6, r * .2, C + r * .55, C + r * .6, r * .9); g.addColorStop(0, 'rgba(177,42,62,.32)'); g.addColorStop(1, 'rgba(177,42,62,0)'); x.fillStyle = g; x.fillRect(0, 0, S * 2, S * 2);
        // reflexo especular suave
        g = x.createRadialGradient(C - r * .36, C - r * .44, 0, C - r * .36, C - r * .44, r * .34); g.addColorStop(0, 'rgba(255,226,214,.55)'); g.addColorStop(.4, 'rgba(255,200,190,.14)'); g.addColorStop(1, 'rgba(255,200,190,0)'); x.fillStyle = g; x.fillRect(0, 0, S * 2, S * 2);
        x.restore();
        // aura muito ténue
        g = x.createRadialGradient(C, C, r * .9, C, C, r * 1.6); g.addColorStop(0, 'rgba(139,30,45,.16)'); g.addColorStop(1, 'rgba(139,30,45,0)'); x.globalCompositeOperation = 'destination-over'; x.fillStyle = g; x.fillRect(0, 0, S * 2, S * 2);
        return { c, S };
      };
      const SPEC = [[46, 120, 170], [38, 660, 150], [54, 90, 560], [34, 700, 700], [42, 300, 130], [50, 720, 420]];
      const balls = SPEC.map(([r, x, y], i) => ({ r, x, y, vx: (i % 2 ? .18 : -.16), vy: (i % 3 ? .12 : -.14), ph: i * 1.7, spr: mkSprite(r) }));
      const shadowSpr = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return c; })();
      let lt = 0; const mm = { x: -999, y: -999 };
      const drawLava = (ctx, t, m) => {
        const dt = Math.min(2, (t - lt) * 60 || 1); lt = t;
        if (m.on) { mm.x = m.x; mm.y = m.y; } else { mm.x = -999; mm.y = -999; }
        balls.forEach((q, i) => {
          // corrente suave (fluido) — campo de fluxo lento
          let ax = Math.sin(q.y * .006 + t * .12 + q.ph) * .006, ay = Math.cos(q.x * .006 - t * .1 + q.ph) * .006;
          // a elipse do cartão empurra para fora e faz as bolas contorná-lo (tangente)
          const ex = (q.x - CARD.x) / (CARD.rx + q.r), ey = (q.y - CARD.y) / (CARD.ry + q.r), ed = Math.hypot(ex, ey);
          if (ed < 1.25) { const k = (1.25 - ed) * .05, nx = ex / (ed || 1), ny = ey / (ed || 1); ax += nx * k; ay += ny * k; ax += -ny * k * .5; ay += nx * k * .5; }
          // legenda
          if (q.x > LEG.x0 && q.x < LEG.x1 && q.y + q.r > LEG.y0) ay -= .02;
          // limites (suaves)
          if (q.x - q.r < BOUND.x0) ax += .01; if (q.x + q.r > BOUND.x1) ax -= .012; if (q.y - q.r < BOUND.y0) ay += .01; if (q.y + q.r > BOUND.y1) ay -= .01;
          // rato afasta de leve
          const mdx = q.x - mm.x, mdy = q.y - mm.y, md = Math.hypot(mdx, mdy) || 1; if (md < 160) { ax += mdx / md * .02; ay += mdy / md * .02; }
          // entre bolas
          balls.forEach((o2, j) => { if (j === i) return; const dx = q.x - o2.x, dy = q.y - o2.y, d = Math.hypot(dx, dy) || 1, min = q.r + o2.r + 26; if (d < min) { const k = (min - d) / min * .03; ax += dx / d * k; ay += dy / d * k; } });
          q.vx = (q.vx + ax * dt) * .992; q.vy = (q.vy + ay * dt) * .992;
          const sp = Math.hypot(q.vx, q.vy), max = .42, min = .08;
          if (sp > max) { q.vx *= max / sp; q.vy *= max / sp; } else if (sp < min) { q.vx += Math.cos(t * .3 + q.ph) * .01; q.vy += Math.sin(t * .3 + q.ph) * .01; }
          q.x += q.vx * dt; q.y += q.vy * dt;
        });
        ctx.save();
        // sombras na superfície (deslocadas para baixo-direita, longe da luz)
        balls.forEach((q) => { const w = q.r * 2.6, h = q.r * 1.1; ctx.globalAlpha = .55; ctx.drawImage(shadowSpr, q.x - w / 2 + q.r * .45, q.y + q.r * .75 - h / 2, w, h); });
        ctx.globalAlpha = 1;
        // ordem por y (as de baixo ficam à frente)
        [...balls].sort((p1, p2) => p1.y - p2.y).forEach((q) => {
          const bob = Math.sin(t * .6 + q.ph) * 2.5;
          const S = q.spr.S, sz = S * 2 / 2;
          ctx.drawImage(q.spr.c, q.x - S, q.y - S + bob, S * 2, S * 2);
        });
        ctx.restore();
      };

      const s = { x: 300, y: 330 };
      const warm = velvet ? '255,206,160' : '255,222,186';
      return (ctx, t, m) => {
        const L = KB_STUDIO_LIGHT(m);
        s.x += (L.x - s.x) * .04; s.y += (L.y - s.y) * .04;
        const breathe = 1 + Math.sin(t * .35) * .015;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(base, 0, 0);
        if (lava) drawLava(ctx, t, m);
        // poça de luz (elíptica: a superfície está vista de cima, ligeiramente inclinada)
        ctx.save(); ctx.translate(s.x + 70, s.y + 120); ctx.scale(1.25, .78);
        ctx.globalCompositeOperation = 'screen';
        let g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, 560 * breathe);
        g2.addColorStop(0, `rgba(${warm},${velvet ? .15 : lava ? .07 : .13})`); g2.addColorStop(.35, `rgba(${warm},.06)`); g2.addColorStop(.7, `rgba(${velvet ? '139,30,45' : '120,100,90'},.04)`); g2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g2; ctx.fillRect(-700, -700, 1400, 1400);
        ctx.restore();
        // brilho do veludo: o pêlo apanha a luz numa faixa do lado oposto
        if (velvet) {
          ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(s.x + 260, s.y + 260); ctx.rotate(-.5); ctx.scale(1.8, .5);
          g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, 260); g2.addColorStop(0, 'rgba(177,42,62,.07)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g2; ctx.fillRect(-300, -300, 600, 600); ctx.restore();
        }
        // grão por cima de tudo
        ctx.globalAlpha = .045; ctx.globalCompositeOperation = 'overlay'; ctx.drawImage(gr, 0, 0);
        ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      };
    },
  });
})();

Object.assign(window, { KB_STUDIO_LIGHT });

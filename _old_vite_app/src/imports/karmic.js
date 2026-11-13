/* Karmic Node — App runtime
   Router (hash), tema, cursor, parallax, contadores, cookies, form, mobile menu
------------------------------------------------------------------------ */

/* ==============================================================
   CONFIG — edite estas 2 linhas quando tiver Shopify e Formspree
   ============================================================== */
window.KN_CONFIG = {
  SHOPIFY_URL: "",  // Ex: "https://karmicnode.myshopify.com" — vazio = "Em breve"
  FORMSPREE_ENDPOINT: "https://formspree.io/f/xeeyzlvb",  // Karmic Node — pedidos de orçamento
  CONTACT_EMAIL: "karmicnode@gmail.com",  // fallback do formulário
  MAP_QUERY: "Cartaxo, Portugal",  // usado para OpenStreetMap embed
  GA4_ID: ""  // Ex: "G-XXXXXXXXXX" — vazio = analytics desativado (só carrega quando preenchido)
};

// Google Analytics 4 — só carrega se GA4_ID estiver preenchido E cookies aceites
function initAnalytics(){
  const id = window.KN_CONFIG.GA4_ID;
  if(!id) return;
  let consent = null;
  try { consent = localStorage.getItem('kn:cookies'); } catch(e){}
  if(consent !== 'accepted') return;

  // Injeta gtag.js dinamicamente
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', id, { anonymize_ip: true });
}

/* ==============================================================
   HASH ROUTER
   ============================================================== */
const PAGES = ['inicio','quem-somos','informatica','multimedia','portfolio','contacto','loja','faq','privacidade','termos','cookies'];

function setActive(page){
  if(!PAGES.includes(page)) page = 'inicio';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if(el) el.classList.add('active');

  document.querySelectorAll('nav.primary a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-nav-link') === page);
  });

  window.scrollTo({ top: 0, behavior: 'instant' });
  try { localStorage.setItem('kn:page', page); } catch(e){}
  document.getElementById('primaryNav').classList.remove('open');
  document.getElementById('menuToggle')?.classList.remove('open');

  // Restart counters if landing on home
  if(page === 'inicio') resetCounters();
}

function routeFromHash(){
  const h = (location.hash || '#inicio').replace(/^#/, '');
  setActive(h);
}

/* ==============================================================
   THEME (dark/light)
   ============================================================== */
function setTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('kn:theme', t); } catch(e){}
}
function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  setTheme(cur === 'dark' ? 'light' : 'dark');
}
function initTheme(){
  let saved = 'dark';
  try { saved = localStorage.getItem('kn:theme') || 'dark'; } catch(e){}
  setTheme(saved);
}

/* ==============================================================
   COUNTERS
   ============================================================== */
let counterObserver = null;
function animateCounter(el){
  const target = parseInt(el.getAttribute('data-target'), 10) || 0;
  const dur = 1600;
  const start = performance.now();
  const startVal = 0;
  function frame(now){
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    const v = Math.floor(startVal + (target - startVal) * eased);
    el.textContent = v;
    if(p < 1) requestAnimationFrame(frame);
    else el.textContent = target;
  }
  requestAnimationFrame(frame);
}
function resetCounters(){
  document.querySelectorAll('[data-counter]').forEach(el => {
    el.textContent = '0';
    el.dataset.animated = '';
  });
  setupCounterObserver();
}
function setupCounterObserver(){
  if(counterObserver) counterObserver.disconnect();
  counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting && !e.target.dataset.animated){
        e.target.dataset.animated = '1';
        animateCounter(e.target);
        counterObserver.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('[data-counter]').forEach(el => counterObserver.observe(el));
}

/* ==============================================================
   REVEAL ON SCROLL
   ============================================================== */
function initReveal(){
  const revealSelectors = [
    '.section-head', '.svc-card', '.diff-strip', '.port-grid',
    '.cta-band .wrap > *', '.mvv .card', '.services-detail .sd-card',
    '.process .step', '.contact-grid > *', '.loja-features .feat',
    '.hero-copy > *', '.emblem', '.counters-grid > *', '.map-wrap > *'
  ];
  document.querySelectorAll(revealSelectors.join(',')).forEach(el => {
    if(!el.hasAttribute('data-reveal')) el.setAttribute('data-reveal', '');
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
}

/* ==============================================================
   HERO PARALLAX
   ============================================================== */
function initParallax(){
  const img = document.querySelector('.hero-bg .hero-img');
  if(!img) return;
  let latest = 0, ticking = false;
  window.addEventListener('scroll', () => {
    latest = window.scrollY;
    if(!ticking){
      requestAnimationFrame(() => {
        const y = Math.min(latest * 0.35, 300);
        img.style.transform = `translate3d(0, ${y}px, 0) scale(1.05)`;
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
}

/* ==============================================================
   CUSTOM CURSOR
   ============================================================== */
function initCursor(){
  if(!window.matchMedia('(pointer:fine)').matches) return;
  document.body.classList.add('cursor-on');
  const dot = document.createElement('div'); dot.className = 'cursor-dot';
  const ring = document.createElement('div'); ring.className = 'cursor-ring';
  document.body.appendChild(dot); document.body.appendChild(ring);

  let mx=0, my=0, rx=0, ry=0;
  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
  }, { passive: true });

  function loop(){
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(loop);
  }
  loop();

  const hoverables = 'a, button, .brand, .svc-card, .port-item, .val-pill, input, textarea, select, .goto';
  document.addEventListener('mouseover', (e) => {
    if(e.target.closest(hoverables)) ring.classList.add('hover');
  });
  document.addEventListener('mouseout', (e) => {
    if(e.target.closest(hoverables)) ring.classList.remove('hover');
  });
}

/* ==============================================================
   COOKIES
   ============================================================== */
function initCookies(){
  const banner = document.getElementById('cookieBanner');
  if(!banner) return;
  let accepted = null;
  try { accepted = localStorage.getItem('kn:cookies'); } catch(e){}
  if(!accepted){ setTimeout(() => banner.classList.add('show'), 1600); }
  banner.querySelector('.primary').addEventListener('click', () => {
    try { localStorage.setItem('kn:cookies', 'accepted'); } catch(e){}
    banner.classList.remove('show');
    initAnalytics();
  });
  banner.querySelector('.decline').addEventListener('click', () => {
    try { localStorage.setItem('kn:cookies', 'declined'); } catch(e){}
    banner.classList.remove('show');
  });
}

/* ==============================================================
   CONTACT FORM (Formspree + fallback)
   ============================================================== */
function initContactForm(){
  const form = document.getElementById('contactForm');
  if(!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgBox = form.querySelector('.form-msg');
    const btn = form.querySelector('button[type="submit"]');
    const btnLabel = btn.querySelector('span');
    const original = btnLabel ? btnLabel.textContent : btn.textContent;
    btn.disabled = true;
    if(btnLabel) btnLabel.textContent = window.i18n.t('con.form.sending');
    else btn.textContent = window.i18n.t('con.form.sending');
    msgBox.className = 'form-msg';

    const data = Object.fromEntries(new FormData(form).entries());

    if(window.KN_CONFIG.FORMSPREE_ENDPOINT){
      try{
        const res = await fetch(window.KN_CONFIG.FORMSPREE_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        });
        if(res.ok){
          msgBox.textContent = window.i18n.t('con.form.ok');
          msgBox.className = 'form-msg ok';
          form.reset();
        } else {
          throw new Error('bad response');
        }
      } catch(err){
        msgBox.textContent = window.i18n.t('con.form.err');
        msgBox.className = 'form-msg err';
      }
    } else {
      // Fallback: abre mailto
      const subject = encodeURIComponent(`[Karmic Node] Pedido de orçamento — ${data.nome || ''}`);
      const body = encodeURIComponent(
        `Nome: ${data.nome || ''}\n` +
        `Email: ${data.email || ''}\n` +
        `Área: ${data.area || ''}\n\n` +
        `Mensagem:\n${data.mensagem || ''}`
      );
      window.location.href = `mailto:${window.KN_CONFIG.CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      msgBox.textContent = window.i18n.t('con.form.ok');
      msgBox.className = 'form-msg ok';
      setTimeout(() => form.reset(), 500);
    }

    btn.disabled = false;
    if(btnLabel) btnLabel.textContent = original;
    else btn.textContent = original;
  });
}

/* ==============================================================
   SHOP CTA — usa Shopify se configurado, senão "em breve"
   ============================================================== */
function initShopLinks(){
  const url = window.KN_CONFIG.SHOPIFY_URL;
  document.querySelectorAll('[data-shop-link]').forEach(link => {
    if(url){
      link.setAttribute('href', url);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');
      link.removeAttribute('data-shop-soon');
    } else {
      link.removeAttribute('target');
      link.setAttribute('href', '#loja');
      link.setAttribute('data-nav-link', 'loja');
      link.setAttribute('data-shop-soon', '1');
    }
  });

  // Update loja page primary CTA
  const primaryShopBtn = document.getElementById('shopPrimaryBtn');
  const shopSoonBadge = document.getElementById('shopSoonBadge');
  const shopNote = document.getElementById('shopNote');
  if(primaryShopBtn){
    if(url){
      primaryShopBtn.setAttribute('href', url);
      primaryShopBtn.setAttribute('target', '_blank');
      primaryShopBtn.setAttribute('rel', 'noopener');
      primaryShopBtn.querySelector('[data-i18n]').setAttribute('data-i18n', 'shop.cta');
      if(shopSoonBadge) shopSoonBadge.style.display = 'none';
      if(shopNote) shopNote.setAttribute('data-i18n', 'shop.note');
    } else {
      primaryShopBtn.setAttribute('href', '#contacto');
      primaryShopBtn.setAttribute('data-nav-link', 'contacto');
      primaryShopBtn.removeAttribute('target');
      primaryShopBtn.querySelector('[data-i18n]').setAttribute('data-i18n', 'shop.cta.soon');
      if(shopSoonBadge) shopSoonBadge.style.display = 'inline-flex';
      if(shopNote) shopNote.setAttribute('data-i18n', 'shop.note.soon');
    }
    if(window.i18n) window.i18n.apply();
  }
}

/* ==============================================================
   MAP EMBED
   ============================================================== */
function initMap(){
  const frame = document.getElementById('mapFrame');
  if(!frame) return;
  // Cartaxo, Portugal — aprox 39.163°N, -8.791°W
  // bbox pequena centrada na vila
  const src = 'https://www.openstreetmap.org/export/embed.html?bbox=-8.85,39.13,-8.73,39.20&layer=mapnik&marker=39.163,-8.791';
  frame.setAttribute('src', src);
}

/* ==============================================================
   LOADER
   ============================================================== */
function hideLoader(){
  const l = document.getElementById('loader');
  if(l){
    setTimeout(() => l.classList.add('hide'), 800);
  }
}

/* ==============================================================
   PORTFOLIO FILTER
   ============================================================== */
function initPortfolio(){
  const filters = document.getElementById('portFilters');
  if(!filters) return;
  filters.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if(!b) return;
    filters.querySelectorAll('button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    const f = b.getAttribute('data-filter');
    document.querySelectorAll('#portList .port-item').forEach(item => {
      const t = item.getAttribute('data-type');
      item.style.display = (f === 'all' || f === t) ? '' : 'none';
    });
  });
}

/* ==============================================================
   NAV WIRING
   ============================================================== */
function initNav(){
  // In-page nav clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-nav-link]');
    if(!link) return;
    const href = link.getAttribute('href') || '';
    // Let external URLs go
    if(href.startsWith('http://') || href.startsWith('https://')) return;
    // Let mailto/tel go
    if(href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const target = link.getAttribute('data-nav-link');
    if(!target) return;
    e.preventDefault();
    location.hash = '#' + target;
  });

  // Brand click -> home
  document.querySelectorAll('.brand').forEach(b => {
    b.addEventListener('click', () => location.hash = '#inicio');
  });

  window.addEventListener('hashchange', routeFromHash);

  // Initial route
  const initial = (location.hash || '').replace(/^#/, '');
  if(initial){
    routeFromHash();
  } else {
    let saved = 'inicio';
    try { saved = localStorage.getItem('kn:page') || 'inicio'; } catch(e){}
    location.hash = '#' + saved;
  }

  // Header scroll state
  const header = document.getElementById('siteHeader');
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const toggle = document.getElementById('menuToggle');
  if(toggle){
    toggle.addEventListener('click', () => {
      document.getElementById('primaryNav').classList.toggle('open');
      toggle.classList.toggle('open');
    });
  }

  // Language switch
  document.querySelectorAll('[data-lang-btn]').forEach(b => {
    b.addEventListener('click', () => window.i18n.setLang(b.getAttribute('data-lang-btn')));
  });

  // Theme toggle
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
}

/* ==============================================================
   BOOT
   ============================================================== */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  window.i18n.init();
  initNav();
  initShopLinks();
  initPortfolio();
  initContactForm();
  initCookies();
  initAnalytics();
  initReveal();
  initParallax();
  initMap();
  setupCounterObserver();

  // Register cursor last so DOM is stable
  initCursor();
});

window.addEventListener('load', hideLoader);
// Safety: hide loader after 3s max
setTimeout(hideLoader, 3000);

import React, { useState, useEffect, useRef, useCallback, createContext, useContext, type ReactNode } from 'react'
import logoImg from '@/imports/Logo_KarmicNode_sem_fundo.png'
import { type Lang, type TKey, createT, getArr } from '@/i18n'
import { useAuth } from '@/hooks/useAuth'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { awardKarma, fetchKarmaSummary, type KarmaProfileLite } from '@/lib/karma'
import { isPushSupported, subscribeToPush } from '@/lib/pwa'

const LangContext = createContext<{ lang: Lang; t: (k: TKey) => string; arr: (k: TKey) => string[] }>({
  lang: 'pt', t: k => k, arr: () => [],
})
const useLang = () => useContext(LangContext)

// ─── useTheme hook ───────────────────────────────────────────────────────
// Gere o modo claro/escuro em toda a loja.
// Persiste em localStorage e aplica no <html data-theme="...">
function useTheme(): { theme: 'dark' | 'light'; toggle: () => void; setTheme: (t: 'dark' | 'light') => void } {
  const [theme, setThemeState] = useState<'dark' | 'light'>(() => {
    try {
      const attr = document.documentElement.getAttribute('data-theme')
      if (attr === 'light' || attr === 'dark') return attr
      const stored = localStorage.getItem('kn-theme') as 'dark' | 'light' | null
      if (stored) return stored
    } catch {}
    return 'dark'
  })
  const setTheme = (t: 'dark' | 'light') => {
    setThemeState(t)
    try {
      document.documentElement.setAttribute('data-theme', t)
      localStorage.setItem('kn-theme', t)
    } catch {}
  }
  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')
  return { theme, toggle, setTheme }
}

// Helpers para traduções de campos dos Produtos (fallback para PT se EN não existir)
function useProductI18n() {
  const { lang } = useLang()
  return {
    pName: (p: any): string => (lang === 'en' && p.nameEn) ? p.nameEn : p.name,
    pDesc: (p: any): string => (lang === 'en' && p.descriptionEn) ? p.descriptionEn : p.description,
    pCat: (p: any): string => (lang === 'en' && p.categoryEn) ? p.categoryEn : p.category,
    pSub: (p: any): string => (lang === 'en' && p.subcategoryEn) ? p.subcategoryEn : (p.subcategory || p.category),
    pBadge: (p: any): string | null => {
      if (!p.badge) return null
      if (lang === 'en') {
        const map: Record<string, string> = { 'Bestseller': 'Bestseller', 'Popular': 'Popular', 'Novo': 'New', 'Premium': 'Premium', 'Últimas unidades': 'Last units' }
        return map[p.badge] || p.badge
      }
      return p.badge
    },
    pSpecs: (p: any): { label: string; value: string }[] => (lang === 'en' && p.specsEn) ? p.specsEn : p.specs,
  }
}

// ─── PRODUCT 360°/3D VIEWER ─────────────────────────────────────────────────
// Fake 360°/3D com CSS transforms — pronto para ser substituído por Three.js
// quando houver modelos .glb reais.

// Mapa de ícones SVG por SKU (mesmo path usado nos placeholders das imagens dos produtos)
const PROD_ICONS: Record<string, string> = {
  // Vestuário
  'KN-001': 'M-60 -30 L-90 -10 L-70 20 L-50 10 L-50 60 L50 60 L50 10 L70 20 L90 -10 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z',
  'KN-002': 'M-55 -30 L-85 -5 L-65 20 L-50 10 L-50 60 L50 60 L50 10 L65 20 L85 -5 L55 -30 L20 -30 L15 -15 L-15 -15 L-20 -30 Z M-15 -15 L-10 15 L10 15 L15 -15',
  'KN-003': 'M-55 -30 L-85 0 L-70 25 L-50 15 L-50 60 L50 60 L50 15 L70 25 L85 0 L55 -30 L20 -30 L0 -10 L-20 -30 Z M-30 0 L-30 55 M30 0 L30 55 M0 -10 L0 55',
  'KN-004': 'M-60 -30 L-90 -5 L-70 25 L-50 15 L-50 65 L50 65 L50 15 L70 25 L90 -5 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z',
  'KN-005': 'M-60 -25 L-90 5 L-70 30 L-50 20 L-50 70 L50 70 L50 20 L70 30 L90 5 L60 -25 C60 -50 -60 -50 -60 -25 Z M-25 -20 L-15 30 L15 30 L25 -20',
  'KN-006': 'M-60 -30 L-85 0 L-70 25 L-55 15 L-55 65 L-10 65 L-10 -25 L10 -25 L10 65 L55 65 L55 15 L70 25 L85 0 L60 -30 Z M-10 -25 L0 -15 L10 -25',
  'KN-007': 'M-60 -25 L-85 -5 L-70 25 L-50 15 L-50 65 L50 65 L50 15 L70 25 L85 -5 L60 -25 L60 -35 L-60 -35 Z',
  'KN-008': 'M-35 -25 L-35 70 L-5 70 L-5 -25 Z M5 -25 L5 70 L35 70 L35 -25 Z M-30 0 L-30 20 L-10 20 L-10 0 M10 0 L10 20 L30 20 L30 0',
  'KN-009': 'M-35 -25 L-40 70 L-8 70 L-3 -25 Z M3 -25 L8 70 L40 70 L35 -25 Z M-35 -25 L35 -25',
  'KN-010': 'M-25 -25 L-55 70 L55 70 L25 -25 Z M-25 -25 L25 -25 M-10 -25 L-10 -35 L10 -35 L10 -25',
  'KN-011': 'M-30 -15 L-60 70 L60 70 L30 -15 Z M-30 -15 L30 -15',
  'KN-012': 'M-45 -20 L-60 20 L-45 30 L-40 70 L-10 70 L-10 10 L10 10 L10 70 L40 70 L45 30 L60 20 L45 -20 L20 -20 L0 -5 L-20 -20 Z',
  'KN-013': 'M-28 -20 L-32 70 L-8 70 L-4 -20 Z M4 -20 L8 70 L32 70 L28 -20 Z M-30 -20 L30 -20',
  'KN-014': 'M-60 20 L-70 45 L60 45 L70 25 L60 5 L20 5 L-5 -15 L-40 0 L-55 15 Z',
  'KN-015': 'M-60 20 L-70 45 L60 45 L70 25 L60 5 L20 5 L-5 -15 L-40 0 L-55 15 Z',
  'KN-016': 'M-45 15 L45 15 L45 -5 C45 -30 -45 -30 -45 -5 Z M-45 15 L60 20 L60 30 L-45 30 Z',
  'KN-017': 'M-50 -20 L50 -20 L50 35 L-50 35 Z M-50 -5 L50 -5',
  'KN-018': 'M-45 -10 L-45 60 L45 60 L45 -10 Z M-25 -10 C-25 -35 25 -35 25 -10',
  // Atelier
  'KN-ATL-001': 'M-60 -30 L-90 -10 L-70 20 L-50 10 L-50 60 L50 60 L50 10 L70 20 L90 -10 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z M0 25 m-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0',
  'KN-ATL-002': 'M-55 -30 L-85 -5 L-65 20 L-50 10 L-50 60 L50 60 L50 10 L65 20 L85 -5 L55 -30 L20 -30 L15 -15 L-15 -15 L-20 -30 Z M-15 -15 L-10 15 L10 15 L15 -15',
  'KN-ATL-003': 'M-55 -30 L-85 0 L-70 25 L-50 15 L-50 60 L50 60 L50 15 L70 25 L85 0 L55 -30 L20 -30 L0 -10 L-20 -30 Z M-30 0 L-30 55 M30 0 L30 55 M0 -10 L0 55',
  'KN-ATL-004': 'M-60 -30 L-90 -5 L-70 25 L-50 15 L-50 65 L50 65 L50 15 L70 25 L90 -5 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z',
  'KN-ATL-005': 'M-60 -25 L-90 5 L-70 30 L-50 20 L-50 70 L50 70 L50 20 L70 30 L90 5 L60 -25 C60 -50 -60 -50 -60 -25 Z M-25 -20 L-15 30 L15 30 L25 -20',
  'KN-ATL-006': 'M-60 -30 L-85 0 L-70 25 L-55 15 L-55 65 L-10 65 L-10 -25 L10 -25 L10 65 L55 65 L55 15 L70 25 L85 0 L60 -30 Z M-10 -25 L0 -15 L10 -25',
  // Casa
  'KN-CASA-001': 'M-50 -50 L50 -50 L50 50 L-50 50 Z M-20 0 L0 -18 L20 0 L0 18 Z',
  'KN-CASA-002': 'M-70 -45 L70 -45 L70 45 L-70 45 Z M-70 -25 L70 -25 M-70 -5 L70 -5 M-70 15 L70 15',
  'KN-CASA-003': 'M-30 -20 L30 -20 L30 45 L-30 45 Z M0 -20 L0 -35 M-6 -40 C-6 -46 6 -46 6 -40 C6 -34 -6 -34 -6 -40',
  'KN-CASA-004': 'M-45 -35 L-70 0 L-55 20 L-40 10 L-40 70 L40 70 L40 10 L55 20 L70 0 L45 -35 L20 -35 L0 -20 L-20 -35 Z',
  'KN-CASA-005': 'M-40 -55 L40 -55 L40 55 L-40 55 Z M-25 -30 L25 -30 M-25 -15 L15 -15 M-25 0 L25 0',
}

// ─── PRODUCT 360°/3D VIEWER (Fake 3D com CSS + SVG) ─────────────────────
// Fluido a 60fps: RAF loop escreve transforms direto no DOM, sem React re-render.
// Inércia física (momentum + fricção), snap easing para presets, GPU compositing.


// Product360Viewer — fake 3D fluido a 60fps
function Product360Viewer({
  iconPath, color, accent, overlayImage, overlayText, overlayX, overlayY,
  size = 'large', showPresets = true, showHint = true, autoRotate = false,
  productLabel,
}: {
  iconPath: string
  color: string
  accent?: string
  overlayImage?: string
  overlayText?: string
  overlayX?: number
  overlayY?: number
  size?: 'large' | 'medium' | 'card'
  showPresets?: boolean
  showHint?: boolean
  autoRotate?: boolean
  productLabel?: string
}) {
  const { t } = useLang()
  // Ângulos em refs (não state) — atualizados a cada frame sem re-render
  const rxRef = useRef(-8)
  const ryRef = useRef(-12)
  const vxRef = useRef(0)
  const vyRef = useRef(0)
  const targetRef = useRef<{ rx: number; ry: number } | null>(null)
  const productRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const glossStopsRef = useRef<{ start: SVGStopElement | null; mid: SVGStopElement | null; end: SVGStopElement | null }>({ start: null, mid: null, end: null })
  const draggingRef = useRef(false)
  const dragStart = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null)
  const lastMove = useRef<{ x: number; y: number; time: number } | null>(null)

  const [activePreset, setActivePreset] = useState<'front' | 'left' | 'right' | 'top' | 'bottom' | 'back'>('front')
  const [presetOpen, setPresetOpen] = useState(false)
  const [showHintUi, setShowHintUi] = useState(true)
  const [cardHover, setCardHover] = useState(false)

  const isLight = ['#F5F2ED', '#B08D57', '#e8c84a', '#808080'].includes(color)
  const acc = accent || '#B08D57'

  const sizes = size === 'large'
    ? { minH: 480, svgSize: 380, iconScale: 1.1 }
    : size === 'medium'
    ? { minH: 380, svgSize: 320, iconScale: 1 }
    : { minH: 180, svgSize: 200, iconScale: 1.3 }

  const applyRotation = () => {
    const product = productRef.current
    const shadow = shadowRef.current
    if (!product) return
    const rx = rxRef.current
    const ry = ryRef.current
    product.style.transform = `translate3d(0,0,0) rotateX(${rx}deg) rotateY(${ry}deg)`
    if (shadow) {
      const shadowScale = Math.max(0.4, 1 - Math.abs(rx) / 150)
      const shadowSkew = ry * 0.15
      const blur = 8 + Math.abs(shadowSkew * 0.2)
      shadow.style.transform = `scaleX(${shadowScale}) skewX(${shadowSkew}deg)`
      shadow.style.filter = `blur(${blur}px)`
    }
    const glossX = Math.sin((ry * Math.PI) / 180) * 40 + 50
    if (glossStopsRef.current.start) glossStopsRef.current.start.setAttribute('offset', Math.max(0, glossX - 20) + '%')
    if (glossStopsRef.current.mid) glossStopsRef.current.mid.setAttribute('offset', glossX + '%')
    if (glossStopsRef.current.end) glossStopsRef.current.end.setAttribute('offset', Math.min(100, glossX + 20) + '%')
  }

  useEffect(() => {
    let raf: number
    const FRICTION = 0.94
    const SNAP_EASE = 0.14
    const MIN_V = 0.03

    const tick = () => {
      if (autoRotate && !draggingRef.current && !targetRef.current) {
        ryRef.current += 0.35
      }
      if (size === 'card' && !draggingRef.current) {
        const targetRx = cardHover ? -5 : 0
        const targetRy = cardHover ? 15 : 0
        rxRef.current += (targetRx - rxRef.current) * 0.08
        ryRef.current += (targetRy - ryRef.current) * 0.08
      }
      if (targetRef.current && !draggingRef.current) {
        const tgt = targetRef.current
        rxRef.current += (tgt.rx - rxRef.current) * SNAP_EASE
        ryRef.current += (tgt.ry - ryRef.current) * SNAP_EASE
        if (Math.abs(tgt.rx - rxRef.current) < 0.1 && Math.abs(tgt.ry - ryRef.current) < 0.1) {
          rxRef.current = tgt.rx; ryRef.current = tgt.ry
          targetRef.current = null
        }
      }
      if (!draggingRef.current && !targetRef.current) {
        if (Math.abs(vxRef.current) > MIN_V || Math.abs(vyRef.current) > MIN_V) {
          rxRef.current = Math.max(-89, Math.min(89, rxRef.current + vxRef.current))
          ryRef.current += vyRef.current
          vxRef.current *= FRICTION
          vyRef.current *= FRICTION
        } else {
          vxRef.current = 0; vyRef.current = 0
        }
      }
      applyRotation()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [autoRotate, cardHover, size])

  const onPointerDown = (e: React.PointerEvent) => {
    if (size === 'card') return
    draggingRef.current = true
    setShowHintUi(false)
    targetRef.current = null
    vxRef.current = 0; vyRef.current = 0
    dragStart.current = { x: e.clientX, y: e.clientY, rx: rxRef.current, ry: ryRef.current }
    lastMove.current = { x: e.clientX, y: e.clientY, time: performance.now() }
    try { (e.target as Element).setPointerCapture(e.pointerId) } catch {}
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current || !dragStart.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    rxRef.current = Math.max(-89, Math.min(89, dragStart.current.rx - dy * 0.5))
    ryRef.current = dragStart.current.ry + dx * 0.5
    const now = performance.now()
    if (lastMove.current) {
      const dt = Math.max(1, now - lastMove.current.time)
      vyRef.current = ((e.clientX - lastMove.current.x) / dt) * 0.5 * 16.67
      vxRef.current = -((e.clientY - lastMove.current.y) / dt) * 0.5 * 16.67
    }
    lastMove.current = { x: e.clientX, y: e.clientY, time: now }
  }
  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false
    try { (e.target as Element).releasePointerCapture(e.pointerId) } catch {}
  }

  const applyPreset = (preset: 'front' | 'left' | 'right' | 'top' | 'bottom' | 'back') => {
    setActivePreset(preset)
    setPresetOpen(false)
    vxRef.current = 0; vyRef.current = 0
    const map = {
      front: { rx: 0, ry: 0 },
      left: { rx: 0, ry: -70 },
      right: { rx: 0, ry: 70 },
      top: { rx: -70, ry: 0 },
      bottom: { rx: 70, ry: 0 },
      back: { rx: 0, ry: 180 },
    }
    if (preset === 'back' && ryRef.current < 0) {
      targetRef.current = { rx: 0, ry: -180 }
    } else {
      targetRef.current = map[preset]
    }
  }
  const resetView = () => {
    setActivePreset('front')
    vxRef.current = 0; vyRef.current = 0
    targetRef.current = { rx: -8, ry: -12 }
  }

  const setGlossRef = (which: 'start' | 'mid' | 'end') => (el: SVGStopElement | null) => {
    glossStopsRef.current[which] = el
  }
  const glossId = `viewer-gloss-${size}-${sizes.svgSize}`

  return (
    <div
      onMouseEnter={() => size === 'card' && setCardHover(true)}
      onMouseLeave={() => size === 'card' && setCardHover(false)}
      style={{
        position: 'relative', width: '100%', minHeight: sizes.minH,
        background: size === 'card' ? 'transparent' : `radial-gradient(600px 400px at 50% 40%, ${acc}22, transparent 70%), var(--bg-2)`,
        border: size === 'card' ? 'none' : '1px solid var(--border)',
        overflow: 'hidden', borderRadius: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        userSelect: 'none', touchAction: 'none',
        cursor: size !== 'card' ? 'grab' : 'default',
      }}
    >
      {size !== 'card' && (
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.28, mixBlendMode: 'overlay', pointerEvents: 'none' }}>
          <filter id={`viewer-grain-${size}`}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" /><feColorMatrix values="0 0 0 0 0.75 0 0 0 0 0.6 0 0 0 0 0.4 0 0 0 0.15 0" /></filter>
          <rect width="100%" height="100%" filter={`url(#viewer-grain-${size})`} />
        </svg>
      )}

      {size === 'large' && [
        { t: 12, l: 12, borders: 'top left' },
        { t: 12, r: 12, borders: 'top right' },
        { b: 12, l: 12, borders: 'bottom left' },
        { b: 12, r: 12, borders: 'bottom right' },
      ].map((c, i) => (
        <div key={i} style={{
          position: 'absolute', width: 20, height: 20, pointerEvents: 'none',
          top: c.t as any, bottom: c.b as any, left: c.l as any, right: c.r as any,
          borderTop: c.borders.includes('top') ? `1px solid ${acc}` : 'none',
          borderBottom: c.borders.includes('bottom') ? `1px solid ${acc}` : 'none',
          borderLeft: c.borders.includes('left') ? `1px solid ${acc}` : 'none',
          borderRight: c.borders.includes('right') ? `1px solid ${acc}` : 'none',
        } as any} />
      ))}

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'relative', perspective: 1400, perspectiveOrigin: '50% 40%',
          width: sizes.svgSize + 40, height: sizes.svgSize + 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {size !== 'card' && (
          <div ref={shadowRef} style={{
            position: 'absolute', bottom: '10%',
            width: `${sizes.svgSize * 0.6}px`, height: `${sizes.svgSize * 0.06}px`,
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,.55), transparent 70%)',
            filter: 'blur(10px)', transformOrigin: 'center',
            pointerEvents: 'none', willChange: 'transform, filter',
          }} />
        )}

        <div
          ref={productRef}
          style={{
            transformStyle: 'preserve-3d',
            willChange: 'transform',
            backfaceVisibility: 'visible',
            filter: 'drop-shadow(0 20px 30px rgba(0,0,0,.35))',
          }}
        >
          <svg viewBox="-120 -100 240 220" width={sizes.svgSize} height={sizes.svgSize * (220 / 240)} shapeRendering="geometricPrecision">
            <defs>
              <linearGradient id={glossId} x1="0" y1="0" x2="1" y2="1">
                <stop ref={setGlossRef('start')} offset="30%" stopColor="#fff" stopOpacity="0" />
                <stop ref={setGlossRef('mid')} offset="50%" stopColor="#fff" stopOpacity={isLight ? 0.12 : 0.16} />
                <stop ref={setGlossRef('end')} offset="70%" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <g transform={`translate(0 5) scale(${sizes.iconScale})`}>
              <g transform="translate(1.5 1.5)" opacity="0.35">
                <path d={iconPath} fill={color} stroke="none" />
              </g>
              <path d={iconPath} fill={color} stroke={isLight ? '#00000035' : '#ffffff22'} strokeWidth="1.2" />
              <path d={iconPath} fill={`url(#${glossId})`} />
              {overlayImage && (
                <image href={overlayImage} x={(overlayX ?? 0) - 20} y={(overlayY ?? 0) - 20} width={40} height={40} preserveAspectRatio="xMidYMid meet" />
              )}
              {overlayText && (
                <text x={overlayX ?? 0} y={(overlayY ?? 0) + (overlayImage ? 12 : 0)} textAnchor="middle" fontFamily="Inter, sans-serif" fontSize={8} fontWeight="600" fill={isLight ? '#0B0B0C' : '#F5F2ED'}>
                  {overlayText.slice(0, 20)}
                </text>
              )}
            </g>
          </svg>
        </div>

        {productLabel && size === 'large' && (
          <div style={{
            position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
            padding: '4px 14px', background: 'var(--overlay-heavy)', border: `1px solid ${acc}55`, backdropFilter: 'blur(8px)',
            fontSize: 10, letterSpacing: '.24em', textTransform: 'uppercase', color: acc, whiteSpace: 'nowrap',
          }}>
            {productLabel}
          </div>
        )}
      </div>

      {size === 'large' && showPresets && (
        <>
          <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 5 }}>
            <button onClick={resetView} title={t('viewer_reset')}
              style={{
                width: 40, height: 40, borderRadius: '50%', background: 'var(--overlay-heavy)', border: 'none', color: 'var(--bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,.35)',
                transition: 'transform .2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>
              </svg>
            </button>
            <button onClick={() => setPresetOpen(v => !v)} title={t('viewer_preset_angle')}
              style={{
                width: 40, height: 40, borderRadius: '50%',
                background: presetOpen ? acc : 'var(--overlay-heavy)',
                border: 'none', color: presetOpen ? '#F5F2ED' : '#0B0B0C',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,.35)', transition: 'all .2s',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
              </svg>
            </button>
          </div>

          {presetOpen && (
            <div style={{
              position: 'absolute', bottom: 84, left: '50%', transform: 'translateX(-50%)',
              background: 'var(--overlay-heavy)', backdropFilter: 'blur(16px)',
              border: '1px solid var(--border)', padding: '14px 18px 16px', zIndex: 10,
              boxShadow: '0 20px 60px rgba(0,0,0,.7)', minWidth: 260,
              animation: 'kn-fadeUp .3s var(--ease) both',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--fg-mute)', fontWeight: 500 }}>
                  {t('viewer_preset_angle')}
                </span>
                <button onClick={() => setPresetOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--fg-mute)', cursor: 'pointer', padding: 4, lineHeight: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {(['front','left','top','back','right','bottom'] as const).map(p => (
                  <button key={p} onClick={() => applyPreset(p)}
                    style={{
                      padding: '9px 4px', background: activePreset === p ? 'var(--fg)' : 'transparent',
                      color: activePreset === p ? '#0B0B0C' : 'var(--fg)',
                      border: `1px solid ${activePreset === p ? 'var(--fg)' : 'var(--border-2)'}`,
                      fontSize: 12, cursor: 'pointer', transition: 'all .15s',
                      fontFamily: 'var(--f-sans)', fontWeight: activePreset === p ? 600 : 400,
                    }}>
                    {t(('viewer_' + p) as TKey)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showHint && showHintUi && !presetOpen && (
            <div style={{
              position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
              padding: '5px 12px', background: 'var(--overlay-medium)', backdropFilter: 'blur(6px)',
              border: `1px solid ${acc}44`, fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase',
              color: 'var(--fg-mute)', display: 'flex', alignItems: 'center', gap: 8,
              transition: 'opacity .3s', pointerEvents: 'none',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2M15 5h4v4M20 4l-9 9" />
              </svg>
              {t('viewer_drag_hint')}
            </div>
          )}
        </>
      )}
    </div>
  )
}


// ─── Product3DViewer — wrapper honesto sobre o visualizador 3D ───────────────
// Usa <model-viewer> (@google/model-viewer, motor Three.js real + AR nativo
// via Android Scene Viewer / iOS Quick Look) APENAS quando o produto tem um
// model3dUrl real (.glb/.gltf). Nenhum produto do catálogo estático atual
// (ALL_PRODUCTS) tem esse ficheiro — só existem imagens SVG placeholder — por
// isso, na prática, hoje este componente cai sempre para o Product360Viewer
// (o "fake 3D" CSS existente). Isto evita mostrar uma badge de "AR disponível"
// para produtos sem modelo 3D real. O import do @google/model-viewer é feito
// dinamicamente (side-effect: regista o custom element <model-viewer>) só
// quando um model3dUrl é fornecido, para não engordar o bundle inicial com
// código que, para o catálogo atual, nunca é usado.
let modelViewerRegistered = false
function ensureModelViewerRegistered() {
  if (modelViewerRegistered) return
  modelViewerRegistered = true
  import('@google/model-viewer').catch(() => { modelViewerRegistered = false })
}

function Product3DViewer(props: Parameters<typeof Product360Viewer>[0] & {
  model3dUrl?: string
  model3dIosUrl?: string
}) {
  const { model3dUrl, model3dIosUrl, ...viewerProps } = props
  const { lang } = useLang()
  const isEN = lang === 'en'

  useEffect(() => {
    if (model3dUrl) ensureModelViewerRegistered()
  }, [model3dUrl])

  if (!model3dUrl) {
    // Sem modelo 3D real disponível — usa o visualizador CSS fake existente.
    return <Product360Viewer {...viewerProps} />
  }

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: viewerProps.size === 'large' ? 480 : viewerProps.size === 'medium' ? 380 : 180, background: 'var(--bg-2)', border: viewerProps.size === 'card' ? 'none' : '1px solid var(--border)' }}>
      <model-viewer
        src={model3dUrl}
        ios-src={model3dIosUrl}
        alt={viewerProps.productLabel || 'Produto Karmic Node em 3D'}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate={viewerProps.autoRotate}
        shadow-intensity="1"
        exposure="1"
        loading="lazy"
        reveal="auto"
        style={{ width: '100%', height: '100%', minHeight: viewerProps.size === 'large' ? 480 : viewerProps.size === 'medium' ? 380 : 180, display: 'block' }}
      />
      <div style={{ position: 'absolute', top: 12, left: 12, padding: '4px 10px', background: 'var(--gold)', color: 'var(--bg)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 700, zIndex: 5 }}>
        {isEN ? 'Real 3D · AR' : '3D real · AR'}
      </div>
    </div>
  )
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Page = 'home' | 'shop' | 'product' | 'contact' | 'about' | 'blog' | 'custom' | 'vestuario' | 'atelier' | 'casa' | 'success' | 'login' | 'account'
  | 'giftcards' | 'privacidade' | 'termos' | 'cookies' | 'faq' | 'envio' | 'devolucoes' | 'garantia' | 'parcerias' | 'admin'
  | 'vault' | 'stylist'

interface Product {
  id: number
  sku?: string
  // Visualizador 3D real (Three.js via <model-viewer>) + AR nativo. Opcional —
  // nenhum produto do catálogo estático atual tem um .glb real, por isso este
  // campo fica undefined em toda a ALL_PRODUCTS. Quando um modelo real for
  // fornecido (URL para .glb/.gltf), o Product3DViewer troca automaticamente
  // do visualizador CSS-3D fake (Product360Viewer) para o <model-viewer> real
  // com AR (Android Scene Viewer / iOS Quick Look).
  model3dUrl?: string
  model3dIosUrl?: string
  nameEn?: string
  descriptionEn?: string
  categoryEn?: string
  subcategoryEn?: string
  specsEn?: { label: string; value: string }[]
  badgeEn?: string
  stripeId?: string
  name: string
  category: string
  subcategory?: string
  vertical?: 'vestuario' | 'atelier' | 'casa'
  customizable?: boolean
  tags: string[]
  price: number
  originalPrice: number | null
  badge: string | null
  badgeColor: 'bordo' | 'gold'
  rating: number
  reviews: number
  image: string
  images: string[]
  stock: number
  description: string
  specs: { label: string; value: string }[]
}

interface CartItem extends Product { qty: number }

interface BlogPost {
  id: number
  title: string
  titleEn?: string
  excerptEn?: string
  categoryEn?: string
  slug: string
  category: string
  excerpt: string
  body: string[]
  image: string
  author: string
  date: string
  readTime: number
  featured?: boolean
}

// ─── Blog data ────────────────────────────────────────────────────────────────

const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    title: 'Como construir um guarda-roupa cápsula em 2026',
    slug: 'guarda-roupa-capsula-2026',
    category: 'Estilo',
    excerpt: 'Menos peças, mais versatilidade. Descobrimos como criar um guarda-roupa funcional com menos de 30 peças que combinam entre si.',
    body: [
      'O conceito de guarda-roupa cápsula surgiu nos anos 70 mas nunca foi tão relevante como hoje. Com o excesso de consumo em debate, muitos optam por uma abordagem mais consciente e inteligente ao vestuário.',
      'A base de qualquer guarda-roupa cápsula são as peças neutras: brancos, pretos, bege, cinzentos e azul-marinho. Estas cores combinam entre si e com qualquer acento de cor que queira adicionar sazonalmente.',
      'Invista em qualidade, não em quantidade. Uma camisola de algodão premium dura anos e mantém a forma. Uma peça barata pode sair mais cara a longo prazo — desbota, perde forma, e acaba substituída em meses.',
      'As peças essenciais para começar: 3 camisas básicas (branca, preta, cinzenta), 2 calças de corte clássico (uma azul escuro, uma bege), 1 casaco de qualidade, 2 camisolas, 1 vestido versátil e 2 pares de sapatos (um casual, um mais formal).',
      'Adicione 3 a 5 peças de acento por estação — uma cor vibrante, um padrão, um acessório especial. Estas peças dão personalidade ao look sem comprometer a versatilidade do conjunto.',
    ],
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=85',
    author: 'Karmic Node',
    date: '18 Jul 2026',
    readTime: 6,
    titleEn: 'How to build a capsule wardrobe in 2026',
    excerptEn: 'Fewer pieces, more versatility. We share how to build a functional wardrobe with under 30 pieces that mix and match.',
    categoryEn: 'Style',
    featured: true,
  },
  {
    id: 2,
    title: 'Tendências de moda para o outono/inverno 2026',
    slug: 'tendencias-moda-outono-inverno-2026',
    category: 'Tendências',
    excerpt: 'Os tons terrosos, os tecidos texturados e o regresso do oversized dominam a estação mais elegante do ano.',
    body: [
      'O outono/inverno 2026 traz um retorno à substância. Após anos de minimalismo extremo, os criadores apostam em texturas ricas, volumes generosos e paletas de cor que evocam a natureza.',
      'Os tons terrosos são a grande aposta: camel, terracota, mostarda e chocolate substituem os cinzentos neutros das últimas temporadas. Combinados com tecidos como tweed, veludo e lã grossa, criam looks de grande impacto visual.',
      'O oversized mantém-se relevante, mas desta vez com mais estrutura. Casacos de ombros marcados, blazers largos com cinto e blusões de grandes proporções definem a silhueta da estação.',
      'Os acessórios ganham protagonismo: chapéus de aba larga, botas de cano alto e malas com textura animal print (mas em versão eco-friendly) são os complementos do momento.',
      'A dica principal: misture texturas. Veludo com lã, couro com algodão, seda com tweed. É nesse contraste que reside a sofisticação desta temporada.',
    ],
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=85',
    author: 'Karmic Node',
    date: '12 Jul 2026',
    readTime: 5,
    titleEn: 'Fashion trends for fall/winter 2026',
    excerptEn: 'Earthy tones, textured fabrics and the return of oversized dominate the most elegant season of the year.',
    categoryEn: 'Trends',
  },
  {
    id: 3,
    title: 'Guia completo de cuidados com tecidos premium',
    slug: 'cuidados-tecidos-premium',
    category: 'Cuidados',
    excerpt: 'Lã merino, cashmere, linho, seda — cada tecido tem as suas regras. Aprenda a fazer as suas peças durarem anos.',
    body: [
      'Investir em peças de qualidade é apenas metade da equação. A outra metade é saber tratá-las corretamente. Um cashmere mal lavado nunca mais volta ao estado original.',
      'A lã merino e o cashmere devem ser lavados à mão em água fria com detergente neutro, ou em programa de lã a 30°C. Nunca torcer — pressione suavemente e seque na horizontal para manter a forma.',
      'O linho é um dos tecidos mais resistentes mas amassa facilmente. Lave a 40°C, estenda logo após a lavagem para minimizar amarrotamento, e passe a ferro com vapor enquanto ainda ligeiramente húmido.',
      'A seda exige cuidado redobrado. Lave à mão em água fria, nunca use lixívia, e seque à sombra. O calor direto do sol desbota e fragiliza as fibras. Passe a ferro pelo lado errado com temperatura baixa.',
      'Para guardar peças fora de estação: dobre (não pendure) as malhas para não deformar, use sacos de tecido respirável para peças delicadas, e adicione sachets de lavanda para repelir traças de forma natural.',
    ],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85',
    author: 'Karmic Node',
    date: '5 Jul 2026',
    readTime: 4,
    titleEn: 'Complete guide to caring for premium fabrics',
    excerptEn: 'Merino wool, cashmere, linen, silk — each fabric has its rules. Learn how to make your pieces last for years.',
    categoryEn: 'Care',
  },
  {
    id: 4,
    title: 'Como vestir bem sem gastar muito: o guia definitivo',
    slug: 'vestir-bem-sem-gastar-muito',
    category: 'Estilo',
    excerpt: 'Elegância não é sinónimo de preço elevado. Com estratégia e alguns princípios básicos, é possível ter um estilo impecável com orçamento controlado.',
    body: [
      'O maior mito da moda é que é preciso gastar muito para vestir bem. A realidade é que o estilo é uma questão de proporcionalidade, qualidade de corte e coerência — não de marcas ou preços.',
      'Priorize o corte acima de tudo. Uma peça de preço médio bem ajustada ao seu corpo supera sempre uma peça de marca cara que não assenta bem. Se necessário, invista em pequeñas alterações de costura — valem cada cêntimo.',
      'Compre menos e melhor. Em vez de 10 peças a 20€, opte por 3 a 60€. Vai usar mais, durar mais, e sentir-se melhor. A equação económica também favorece a qualidade a longo prazo.',
      'Aproveite as épocas de saldos para comprar peças clássicas — não tendências. Um casaco de lã, uma camisa oxford, umas calças de corte reto — estas peças não ficam desatualizadas e valem o investimento em desconto.',
      'As lojas de segunda mão e vintage são aliadas fantásticas. É possível encontrar peças de marcas premium em excelente estado por uma fração do preço original. Requer paciência, mas as descobertas compensam.',
    ],
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&q=85',
    author: 'Karmic Node',
    date: '28 Jun 2026',
    readTime: 7,
    titleEn: 'Como vestir bem sem gastar muito: o guia definitivo',
    excerptEn: 'Elegância não é sinónimo de preço elevado. Com estratégia e alguns princípios básicos, é possível ter um estilo impecável com orçamento controlado.',
    categoryEn: 'Style',
  },
  {
    id: 5,
    title: 'Moda sustentável: como fazer escolhas mais conscientes',
    slug: 'moda-sustentavel-escolhas-conscientes',
    category: 'Sustentabilidade',
    excerpt: 'A indústria da moda é uma das mais poluentes do mundo. Mostramos como fazer escolhas que fazem diferença sem abdicar do estilo.',
    body: [
      'A moda rápida (fast fashion) tem um custo ambiental enorme: toneladas de roupas descartadas anualmente, poluição de rios por corantes, e emissões de carbono significativas. Mas há alternativas.',
      'Comprar menos é o passo mais impactante. Cada peça que não é comprada é a mais sustentável de todas. Antes de qualquer compra, pergunte: já tenho algo similar? Vou usar isto mais de 30 vezes?',
      'Prefira materiais naturais e certificados: algodão orgânico (GOTS), lã certificada (RWS), linho europeu, ou alternativas inovadoras como Tencel e Modal (fibras de madeira de reflorestação).',
      'A durabilidade é sustentabilidade. Uma peça que dura 10 anos tem muito menor impacto ambiental do que 10 peças que duram 1 ano cada. Invista em qualidade — é uma decisão ambiental tanto quanto estética.',
      'Dê nova vida às peças que já tem: aprenda a fazer pequenas reparações, personalize com bordados ou patches, ou troque com amigos. O melhor guarda-roupa sustentável é o que já existe.',
    ],
    image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&q=85',
    author: 'Karmic Node',
    date: '20 Jun 2026',
    readTime: 5,
    titleEn: 'Moda sustentável: como fazer escolhas mais conscientes',
    excerptEn: 'A indústria da moda é uma das mais poluentes do mundo. Mostramos como fazer escolhas que fazem diferença sem abdicar do estilo.',
    categoryEn: 'Sustainability',
  },
  {
    id: 6,
    title: 'O regresso do alfaiate: por que o fato voltou',
    slug: 'regresso-alfaiate-fato-voltou',
    category: 'Tendências',
    excerpt: 'Após anos de dominação do casual, o fato bem cortado regressa em força — e desta vez para ficar.',
    body: [
      'Havia uma certa melancolia na morte do fato. A pandemia acelerou a casualização do vestuário, e muitos proclamaram o fim do alfaiate clássico. Estavam enganados.',
      'O fato ressurge em 2026 com uma nova energia: menos formal, mais expressivo. Padrões ousados como o príncipe de Gales e o xadrez coexistem com cortes oversized em cores inesperadas — lilás, mostarda, verde floresta.',
      'A nova regra é quebrar o fato. Calças do fato com sapatilhas e t-shirt básica. Casaco do fato sobre jeans e bota de cowboy. O fato deixou de ser uma armadura rígida e tornou-se uma ferramenta de estilo versátil.',
      'Para o mercado de trabalho, o "smart casual" abriu espaço ao fato sem gravata, ao casaco sem calças combinadas, ao colete como peça isolada. A fronteira entre formal e casual dissolve-se definitivamente.',
      'Invista num bom fato clássico — azul-marinho ou cinzento carvão, corte ligeiramente slim — e terá uma peça para décadas. Com as combinações certas, serve para uma entrevista de emprego, um casamento e um jantar de negócios.',
    ],
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4b1df2?w=1200&q=85',
    author: 'Karmic Node',
    date: '10 Jun 2026',
    readTime: 6,
    titleEn: 'O regresso do alfaiate: por que o fato voltou',
    excerptEn: 'Após anos de dominação do casual, o fato bem cortado regressa em força — e desta vez para ficar.',
    categoryEn: 'Trends',
  },
  {
    id: 7,
    title: 'Acessórios que transformam qualquer look',
    slug: 'acessorios-que-transformam-look',
    category: 'Acessórios',
    excerpt: 'Um cinto certo, um lenço bem colocado ou a mala ideal podem elevar um look simples ao patamar seguinte.',
    body: [
      'Os acessórios são o segredo mais subestimado do estilo. São eles que revelam personalidade e transformam um look básico em algo memorável — sem mudar uma única peça de roupa.',
      'O cinto é o acessório mais funcional e estético ao mesmo tempo. Define a cintura, estrutura a silhueta e adiciona um ponto de interesse ao conjunto. Invista em couro genuíno de cor neutra — dura décadas e combina com tudo.',
      'O lenço de seda ou algodão é o acessório mais versátil que existe: no pescoço, no cabelo, na mala, no pulso, ou como lenço de bolso no casaco. É pequeno, fácil de transportar e multiplica as combinações possíveis.',
      'As malas merecem investimento especial — são o acessório mais visível e usado. Prefira couro ou materiais de qualidade, formas clássicas e cores que durem além das temporadas. Uma boa mala é um investimento de décadas.',
      'Bijuteria minimalista e discreta é sempre segura — camadas de correntes finas, brincos pequenos, pulseiras simples. Quando quer impacto, escolha UMA peça statement e deixe o resto limpo.',
    ],
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1200&q=85',
    author: 'Karmic Node',
    date: '1 Jun 2026',
    readTime: 5,
    titleEn: 'Acessórios que transformam qualquer look',
    excerptEn: 'Um cinto certo, um lenço bem colocado ou a mala ideal podem elevar um look simples ao patamar seguinte.',
    categoryEn: 'Accessories',
  },
  {
    id: 8,
    title: 'Como combinar padrões sem errar',
    slug: 'como-combinar-padroes-sem-errar',
    category: 'Estilo',
    excerpt: 'Riscas com xadrez, florais com geométrico — misturar padrões parece arriscado mas há regras simples que tornam o resultado sempre elegante.',
    body: [
      'Misturar padrões é um dos gestos de estilo mais ousados e, quando bem feito, mais impressionantes. O truque está em perceber as regras antes de as quebrar.',
      'A regra mais importante: varie a escala. Um padrão grande com um padrão pequeno do mesmo tipo funciona quase sempre. Riscas largas com riscas finas, xadrez grande com xadrez pequeno, floral grande com floral pequeno.',
      'Partilhe uma cor em comum. Se ambos os padrões partilham pelo menos uma cor, a combinação fica automaticamente coesa. Um casaco às riscas azul e branco com uma camisa xadrez azul e verde funciona porque o azul é o elo de ligação.',
      'Use o sólido como árbitro. Entre dois padrões, uma peça sólida (calça, cinto, sapato) na cor dominante de um dos padrões une o conjunto e dá ao olho um ponto de descanso.',
      'Comece com dois padrões máximo. Quando ganhar confiança, experimente três. Mais do que isso raramente funciona fora de contextos muito específicos de alta moda.',
    ],
    image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=85',
    author: 'Karmic Node',
    date: '22 Mai 2026',
    readTime: 7,
    titleEn: 'Como combinar padrões sem errar',
    excerptEn: 'Riscas com xadrez, florais com geométrico — misturar padrões parece arriscado mas há regras simples que tornam o resultado sempre elegante.',
    categoryEn: 'Style',
  },
]

// ─── Products ────────────────────────────────────────────────────────────────

const ALL_PRODUCTS: Product[] = [
  {
    id: 1, sku: 'KN-001', name: 'T-Shirt Essencial Algodão',
    category: 'Tops', subcategory: 'Tops e Camisaria', vertical: 'vestuario',
    tags: ['tops', 'camisaria'],
    price: 29.99, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.8, reviews: 480, stock: 32,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-90 -10 L-70 20 L-50 10 L-50 60 L50 60 L50 10 L70 20 L90 -10 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Tops e Camisaria</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-90 -10 L-70 20 L-50 10 L-50 60 L50 60 L50 10 L70 20 L90 -10 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Tops e Camisaria</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Algodão 100% premium, corte clássico. Peça base do guarda-roupa moderno, pronta para uso ou personalização.',
    nameEn: 'Essential Cotton T-Shirt',
    descriptionEn: 'Premium 100% cotton, classic cut. Wardrobe staple ready to wear or customize.',
    categoryEn: 'Tops',
    subcategoryEn: 'Tops & Shirts',
    specsEn: [{ label: 'Material', value: '100% Cotton' }, { label: 'Cut', value: 'Regular fit' }, { label: 'Sizes', value: 'XS to XXL' }, { label: 'Care', value: 'Machine wash 30°C' }, { label: 'Colors', value: 'White, Black, Beige, Navy' }],
    specs: [{ label: 'Material', value: '100% Algodão' }, { label: 'Corte', value: 'Regular fit' }, { label: 'Tamanhos', value: 'XS ao XXL' }, { label: 'Cuidados', value: 'Lavagem a 30°C' }, { label: 'Cores', value: 'Branco, Preto, Bege, Marinho' }],
  },
  {
    id: 2, sku: 'KN-002', name: 'Polo Piqué Clássico',
    category: 'Tops', subcategory: 'Tops e Camisaria', vertical: 'vestuario',
    tags: ['tops', 'camisaria'],
    price: 69.9, originalPrice: null,
    badge: null, badgeColor: 'gold',
    rating: 4.6, reviews: 210, stock: 22,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-55 -30 L-85 -5 L-65 20 L-50 10 L-50 60 L50 60 L50 10 L65 20 L85 -5 L55 -30 L20 -30 L15 -15 L-15 -15 L-20 -30 Z%22/><path d=%22M-15 -15 L-10 15 L10 15 L15 -15%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Tops e Camisaria</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-55 -30 L-85 -5 L-65 20 L-50 10 L-50 60 L50 60 L50 10 L65 20 L85 -5 L55 -30 L20 -30 L15 -15 L-15 -15 L-20 -30 Z%22/><path d=%22M-15 -15 L-10 15 L10 15 L15 -15%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Tops e Camisaria</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Piqué de algodão respirável com carcela de 2 botões. Elegância descontraída para qualquer momento.',
    nameEn: 'Classic Piqué Polo',
    descriptionEn: 'Breathable cotton piqué with 2-button placket. Effortless elegance for any moment.',
    categoryEn: 'Tops',
    subcategoryEn: 'Tops & Shirts',
    specsEn: [{ label: 'Material', value: '100% Piqué Algodão' }, { label: 'Cut', value: 'Classic fit' }, { label: 'Sizes', value: 'XS to XXL' }, { label: 'Colors', value: 'White, Navy, Burgundy, Black' }],
    specs: [{ label: 'Material', value: '100% Piqué Algodão' }, { label: 'Corte', value: 'Classic fit' }, { label: 'Tamanhos', value: 'XS ao XXL' }, { label: 'Cores', value: 'Branco, Navy, Bordeaux, Preto' }],
  },
  {
    id: 3, sku: 'KN-003', name: 'Camisa Trabalho Robusta',
    category: 'Camisas', subcategory: 'Tops e Camisaria', vertical: 'vestuario',
    tags: ['tops', 'camisaria'],
    price: 79.95, originalPrice: null,
    badge: null, badgeColor: 'gold',
    rating: 4.6, reviews: 145, stock: 18,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-55 -30 L-85 0 L-70 25 L-50 15 L-50 60 L50 60 L50 15 L70 25 L85 0 L55 -30 L20 -30 L0 -10 L-20 -30 Z%22/><path d=%22M-30 0 L-30 55 M30 0 L30 55 M0 -10 L0 55%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Tops e Camisaria</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-55 -30 L-85 0 L-70 25 L-50 15 L-50 60 L50 60 L50 15 L70 25 L85 0 L55 -30 L20 -30 L0 -10 L-20 -30 Z%22/><path d=%22M-30 0 L-30 55 M30 0 L30 55 M0 -10 L0 55%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Tops e Camisaria</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Algodão de alta durabilidade, estilo urbano funcional com bolsos frontais reforçados.',
    nameEn: 'Rugged Work Shirt',
    descriptionEn: 'High-durability cotton, functional urban style with reinforced front pockets.',
    categoryEn: 'Shirts',
    subcategoryEn: 'Tops & Shirts',
    specsEn: [{ label: 'Material', value: 'Algodão sarja pesada' }, { label: 'Cut', value: 'Regular fit' }, { label: 'Sizes', value: 'S to XXL' }, { label: 'Colors', value: 'Beige, Military Green, Black' }],
    specs: [{ label: 'Material', value: 'Algodão sarja pesada' }, { label: 'Corte', value: 'Regular fit' }, { label: 'Tamanhos', value: 'S ao XXL' }, { label: 'Cores', value: 'Bege, Verde militar, Preto' }],
  },
  {
    id: 4, sku: 'KN-004', name: 'Sweatshirt Interior Cardado',
    category: 'Tops', subcategory: 'Malhas e Sweats', vertical: 'vestuario',
    tags: ['malhas', 'sweats'],
    price: 54.99, originalPrice: null,
    badge: 'Popular', badgeColor: 'bordo',
    rating: 4.7, reviews: 390, stock: 45,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-90 -5 L-70 25 L-50 15 L-50 65 L50 65 L50 15 L70 25 L90 -5 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Malhas e Sweats</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-90 -5 L-70 25 L-50 15 L-50 65 L50 65 L50 15 L70 25 L90 -5 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Malhas e Sweats</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Interior cardado suave, tecnologia anti-encolhimento e punhos canelados. O clássico do outono/inverno.',
    nameEn: 'Brushed Interior Sweatshirt',
    descriptionEn: 'Soft brushed interior, anti-shrink tech and ribbed cuffs. The autumn/winter classic.',
    categoryEn: 'Tops',
    subcategoryEn: 'Knits & Sweats',
    specsEn: [{ label: 'Material', value: '80% Cotton, 20% Polyester' }, { label: 'Cut', value: 'Regular fit' }, { label: 'Sizes', value: 'XS to XXL' }, { label: 'Colors', value: 'Grey, Black, Navy, Burgundy' }],
    specs: [{ label: 'Material', value: '80% Algodão, 20% Poliéster' }, { label: 'Corte', value: 'Regular fit' }, { label: 'Tamanhos', value: 'XS ao XXL' }, { label: 'Cores', value: 'Cinzento, Preto, Navy, Bordeaux' }],
  },
  {
    id: 5, sku: 'KN-005', name: 'Hoodie Algodão Pesado',
    category: 'Tops', subcategory: 'Malhas e Sweats', vertical: 'vestuario',
    tags: ['malhas', 'sweats'],
    price: 89, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.9, reviews: 320, stock: 28,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -25 L-90 5 L-70 30 L-50 20 L-50 70 L50 70 L50 20 L70 30 L90 5 L60 -25 C60 -50 -60 -50 -60 -25 Z%22/><path d=%22M-25 -20 L-15 30 L15 30 L25 -20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Malhas e Sweats</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -25 L-90 5 L-70 30 L-50 20 L-50 70 L50 70 L50 20 L70 30 L90 5 L60 -25 C60 -50 -60 -50 -60 -25 Z%22/><path d=%22M-25 -20 L-15 30 L15 30 L25 -20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Malhas e Sweats</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Algodão pesado 13oz com capuz e cordão. Bolso canguru reforçado. Streetwear premium para uso diário.',
    nameEn: 'Heavy Cotton Hoodie',
    descriptionEn: 'Heavy 13oz cotton with hood and drawstring. Reinforced kangaroo pocket. Premium daily streetwear.',
    categoryEn: 'Tops',
    subcategoryEn: 'Knits & Sweats',
    specsEn: [{ label: 'Material', value: '13oz Cotton' }, { label: 'Cut', value: 'Oversized relaxed' }, { label: 'Sizes', value: 'XS to XXL' }, { label: 'Colors', value: 'Black, Grey, Burgundy, Olive' }],
    specs: [{ label: 'Material', value: 'Algodão 13oz' }, { label: 'Corte', value: 'Oversized relaxed' }, { label: 'Tamanhos', value: 'XS ao XXL' }, { label: 'Cores', value: 'Preto, Cinzento, Bordeaux, Verde-oliva' }],
  },
  {
    id: 6, sku: 'KN-006', name: 'Casaco Impermeável Outdoor',
    category: 'Casacos', subcategory: 'Outerwear', vertical: 'vestuario',
    tags: ['outerwear'],
    price: 120, originalPrice: null,
    badge: 'Novo', badgeColor: 'gold',
    rating: 4.8, reviews: 280, stock: 20,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-85 0 L-70 25 L-55 15 L-55 65 L-10 65 L-10 -25 L10 -25 L10 65 L55 65 L55 15 L70 25 L85 0 L60 -30 Z%22/><path d=%22M-10 -25 L0 -15 L10 -25%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Outerwear</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-85 0 L-70 25 L-55 15 L-55 65 L-10 65 L-10 -25 L10 -25 L10 65 L55 65 L55 15 L70 25 L85 0 L60 -30 Z%22/><path d=%22M-10 -25 L0 -15 L10 -25%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Outerwear</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Membrana impermeável e respirável, corta-vento leve. Preparado para as intempéries sem sacrificar estilo.',
    nameEn: 'Waterproof Outdoor Jacket',
    descriptionEn: 'Waterproof breathable membrane, lightweight windbreaker. Weather-ready without sacrificing style.',
    categoryEn: 'Coats',
    subcategoryEn: 'Outerwear',
    specsEn: [{ label: 'Material', value: 'Technical polyester' }, { label: 'Waterproofing', value: '10,000mm' }, { label: 'Sizes', value: 'S to XXL' }, { label: 'Colors', value: 'Black, Navy, Military Green' }],
    specs: [{ label: 'Material', value: 'Poliéster técnico' }, { label: 'Impermeabilidade', value: '10.000mm' }, { label: 'Tamanhos', value: 'S ao XXL' }, { label: 'Cores', value: 'Preto, Navy, Verde militar' }],
  },
  {
    id: 7, sku: 'KN-007', name: 'Bomber Nylon Aviador',
    category: 'Casacos', subcategory: 'Outerwear', vertical: 'vestuario',
    tags: ['outerwear'],
    price: 159.9, originalPrice: null,
    badge: 'Últimas unidades', badgeColor: 'bordo',
    rating: 4.7, reviews: 95, stock: 8,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -25 L-85 -5 L-70 25 L-50 15 L-50 65 L50 65 L50 15 L70 25 L85 -5 L60 -25 L60 -35 L-60 -35 Z%22/><circle cx=%220%22 cy=%22-15%22 r=%224%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Outerwear</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -25 L-85 -5 L-70 25 L-50 15 L-50 65 L50 65 L50 15 L70 25 L85 -5 L60 -25 L60 -35 L-60 -35 Z%22/><circle cx=%220%22 cy=%22-15%22 r=%224%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Outerwear</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Nylon de aviação impermeável, reversível para laranja de emergência. Um ícone urbano atemporal.',
    nameEn: 'Aviator Nylon Bomber',
    descriptionEn: 'Waterproof aviation nylon, reversible to emergency orange. A timeless urban icon.',
    categoryEn: 'Coats',
    subcategoryEn: 'Outerwear',
    specsEn: [{ label: 'Material', value: 'Reinforced nylon' }, { label: 'Cut', value: 'Regular fit' }, { label: 'Sizes', value: 'XS to XL' }, { label: 'Colors', value: 'Black/Orange, Military Green' }],
    specs: [{ label: 'Material', value: 'Nylon reforçado' }, { label: 'Corte', value: 'Regular fit' }, { label: 'Tamanhos', value: 'XS ao XL' }, { label: 'Cores', value: 'Preto/Laranja, Verde militar' }],
  },
  {
    id: 8, sku: 'KN-008', name: 'Calças Cargo Multibolsos',
    category: 'Calças', subcategory: 'Bottoms', vertical: 'vestuario',
    tags: ['bottoms'],
    price: 99, originalPrice: null,
    badge: 'Popular', badgeColor: 'bordo',
    rating: 4.7, reviews: 310, stock: 25,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-35 -25 L-35 70 L-5 70 L-5 -25 Z M5 -25 L5 70 L35 70 L35 -25 Z%22/><path d=%22M-30 0 L-30 20 L-10 20 L-10 0 M10 0 L10 20 L30 20 L30 0%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Bottoms</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-35 -25 L-35 70 L-5 70 L-5 -25 Z M5 -25 L5 70 L35 70 L35 -25 Z%22/><path d=%22M-30 0 L-30 20 L-10 20 L-10 0 M10 0 L10 20 L30 20 L30 0%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Bottoms</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Tecido Ripstop resistente a rasgões, bolsos laterais expansíveis. Funcional e estiloso.',
    nameEn: 'Multi-pocket Cargo Trousers',
    descriptionEn: 'Tear-resistant Ripstop fabric, expandable side pockets. Functional and stylish.',
    categoryEn: 'Trousers',
    subcategoryEn: 'Bottoms',
    specsEn: [{ label: 'Material', value: 'Ripstop cotton' }, { label: 'Cut', value: 'Regular cargo' }, { label: 'Sizes', value: '30 to 40' }, { label: 'Colors', value: 'Black, Beige, Military Green, Grey' }],
    specs: [{ label: 'Material', value: 'Algodão Ripstop' }, { label: 'Corte', value: 'Regular cargo' }, { label: 'Tamanhos', value: '30 ao 40' }, { label: 'Cores', value: 'Preto, Bege, Verde militar, Cinzento' }],
  },
  {
    id: 9, sku: 'KN-009', name: 'Jeans Corte Direito',
    category: 'Calças', subcategory: 'Bottoms', vertical: 'vestuario',
    tags: ['bottoms'],
    price: 99.95, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.9, reviews: 550, stock: 42,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-35 -25 L-40 70 L-8 70 L-3 -25 Z M3 -25 L8 70 L40 70 L35 -25 Z M-35 -25 L35 -25%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Bottoms</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-35 -25 L-40 70 L-8 70 L-3 -25 Z M3 -25 L8 70 L40 70 L35 -25 Z M-35 -25 L35 -25%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Bottoms</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Corte direito em denim de algodão puro. O jeans intemporal que combina com tudo.',
    nameEn: 'Straight Cut Jeans',
    descriptionEn: 'Straight cut in pure cotton denim. The timeless jean that goes with anything.',
    categoryEn: 'Trousers',
    subcategoryEn: 'Bottoms',
    specsEn: [{ label: 'Material', value: '100% Cotton Denim' }, { label: 'Cut', value: 'Straight leg' }, { label: 'Sizes', value: '28 to 40' }, { label: 'Colors', value: 'Mid Blue, Dark Blue, Black' }],
    specs: [{ label: 'Material', value: '100% Denim Algodão' }, { label: 'Corte', value: 'Straight leg' }, { label: 'Tamanhos', value: '28 ao 40' }, { label: 'Cores', value: 'Azul médio, Azul escuro, Preto' }],
  },
  {
    id: 10, sku: 'KN-010', name: 'Vestido Midi Malha Canelada',
    category: 'Vestidos', subcategory: 'Vestidos e Saias', vertical: 'vestuario',
    tags: ['vestidos', 'saias'],
    price: 39.95, originalPrice: null,
    badge: 'Novo', badgeColor: 'gold',
    rating: 4.7, reviews: 260, stock: 30,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-25 -25 L-55 70 L55 70 L25 -25 Z%22/><path d=%22M-25 -25 L25 -25 M-10 -25 L-10 -35 L10 -35 L10 -25%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Vestidos e Saias</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-25 -25 L-55 70 L55 70 L25 -25 Z%22/><path d=%22M-25 -25 L25 -25 M-10 -25 L-10 -35 L10 -35 L10 -25%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Vestidos e Saias</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Malha canelada ajustável de algodão orgânico. Elegante, confortável e versátil.',
    nameEn: 'Ribbed Knit Midi Dress',
    descriptionEn: 'Adjustable ribbed knit in organic cotton. Elegant, comfortable and versatile.',
    categoryEn: 'Dresses',
    subcategoryEn: 'Dresses & Skirts',
    specsEn: [{ label: 'Material', value: 'Ribbed Organic Cotton' }, { label: 'Length', value: 'Midi' }, { label: 'Sizes', value: 'XS to XL' }, { label: 'Colors', value: 'Black, Beige, Old Rose, Olive' }],
    specs: [{ label: 'Material', value: 'Algodão Orgânico Canelado' }, { label: 'Comprimento', value: 'Midi' }, { label: 'Tamanhos', value: 'XS ao XL' }, { label: 'Cores', value: 'Preto, Bege, Rosa antigo, Verde-oliva' }],
  },
  {
    id: 11, sku: 'KN-011', name: 'Saia Plissada Cetim',
    category: 'Saias', subcategory: 'Vestidos e Saias', vertical: 'vestuario',
    tags: ['vestidos', 'saias'],
    price: 35.99, originalPrice: null,
    badge: null, badgeColor: 'gold',
    rating: 4.6, reviews: 180, stock: 25,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-30 -15 L-60 70 L60 70 L30 -15 Z%22/><path d=%22M-30 -15 L30 -15%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Vestidos e Saias</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-30 -15 L-60 70 L60 70 L30 -15 Z%22/><path d=%22M-30 -15 L30 -15%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Vestidos e Saias</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Acabamento acetinado fluido com cintura elástica confortável. Movimento e elegância em cada passo.',
    nameEn: 'Satin Pleated Skirt',
    descriptionEn: 'Fluid satin finish with comfortable elastic waist. Movement and elegance in every step.',
    categoryEn: 'Skirts',
    subcategoryEn: 'Dresses & Skirts',
    specsEn: [{ label: 'Material', value: 'Polyester Satin' }, { label: 'Length', value: 'Midi' }, { label: 'Sizes', value: 'XS to XL' }, { label: 'Colors', value: 'Champagne, Black, Emerald Green, Pink' }],
    specs: [{ label: 'Material', value: 'Cetim Poliéster' }, { label: 'Comprimento', value: 'Midi' }, { label: 'Tamanhos', value: 'XS ao XL' }, { label: 'Cores', value: 'Champagne, Preto, Verde esmeralda, Rosa' }],
  },
  {
    id: 12, sku: 'KN-012', name: 'Fato de Treino Técnico',
    category: 'Desporto', subcategory: 'Athleisure', vertical: 'vestuario',
    tags: ['athleisure'],
    price: 69.99, originalPrice: null,
    badge: 'Popular', badgeColor: 'bordo',
    rating: 4.7, reviews: 420, stock: 35,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-45 -20 L-60 20 L-45 30 L-40 70 L-10 70 L-10 10 L10 10 L10 70 L40 70 L45 30 L60 20 L45 -20 L20 -20 L0 -5 L-20 -20 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Athleisure</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-45 -20 L-60 20 L-45 30 L-40 70 L-10 70 L-10 10 L10 10 L10 70 L40 70 L45 30 L60 20 L45 -20 L20 -20 L0 -5 L-20 -20 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Athleisure</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Tecido de secagem rápida com painéis em rede respiráveis. Do ginásio ao lazer.',
    nameEn: 'Technical Tracksuit',
    descriptionEn: 'Quick-dry fabric with breathable mesh panels. From gym to leisure.',
    categoryEn: 'Sport',
    subcategoryEn: 'Athleisure',
    specsEn: [{ label: 'Material', value: 'Technical polyester' }, { label: 'Includes', value: 'Jacket + Trousers' }, { label: 'Sizes', value: 'XS to XXL' }, { label: 'Colors', value: 'Black, Grey, Navy, Burgundy' }],
    specs: [{ label: 'Material', value: 'Poliéster técnico' }, { label: 'Inclui', value: 'Casaco + Calças' }, { label: 'Tamanhos', value: 'XS ao XXL' }, { label: 'Cores', value: 'Preto, Cinzento, Navy, Bordeaux' }],
  },
  {
    id: 13, sku: 'KN-013', name: 'Leggings Cintura Alta',
    category: 'Desporto', subcategory: 'Athleisure', vertical: 'vestuario',
    tags: ['athleisure'],
    price: 45, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.8, reviews: 490, stock: 48,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-28 -20 L-32 70 L-8 70 L-4 -20 Z M4 -20 L8 70 L32 70 L28 -20 Z%22/><path d=%22M-30 -20 L30 -20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Athleisure</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-28 -20 L-32 70 L-8 70 L-4 -20 Z M4 -20 L8 70 L32 70 L28 -20 Z%22/><path d=%22M-30 -20 L30 -20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Athleisure</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Cintura alta de suporte, tecido sem costuras anti-transparência. Conforto e performance.',
    nameEn: 'High-waist Leggings',
    descriptionEn: 'High-support waist, seamless anti-see-through fabric. Comfort and performance.',
    categoryEn: 'Sport',
    subcategoryEn: 'Athleisure',
    specsEn: [{ label: 'Material', value: '75% Nylon, 25% Spandex' }, { label: 'Cintura', value: 'High seamless' }, { label: 'Sizes', value: 'XS to XL' }, { label: 'Colors', value: 'Black, Beige, Olive, Burgundy' }],
    specs: [{ label: 'Material', value: '75% Nylon, 25% Elastano' }, { label: 'Cintura', value: 'Alta seamless' }, { label: 'Tamanhos', value: 'XS ao XL' }, { label: 'Cores', value: 'Preto, Bege, Verde-oliva, Bordeaux' }],
  },
  {
    id: 14, sku: 'KN-014', name: 'Ténis Clássicos Couro Branco',
    category: 'Calçado', subcategory: 'Calçado', vertical: 'vestuario',
    tags: ['calçado'],
    price: 119.99, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.9, reviews: 850, stock: 55,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 20 L-70 45 L60 45 L70 25 L60 5 L20 5 L-5 -15 L-40 0 L-55 15 Z%22/><path d=%22M-40 0 L-30 20 M-15 -5 L-5 20 M15 5 L20 20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Calçado</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 20 L-70 45 L60 45 L70 25 L60 5 L20 5 L-5 -15 L-40 0 L-55 15 Z%22/><path d=%22M-40 0 L-30 20 M-15 -5 L-5 20 M15 5 L20 20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Calçado</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Couro genuíno com amortecimento premium. O sneaker atemporal que combina com tudo.',
    nameEn: 'Classic White Leather Sneakers',
    descriptionEn: 'Genuine leather with premium cushioning. The timeless sneaker that goes with anything.',
    categoryEn: 'Footwear',
    subcategoryEn: 'Footwear',
    specsEn: [{ label: 'Material', value: 'Genuine bovine leather' }, { label: 'Sole', value: 'Rubber' }, { label: 'Sizes', value: '36 to 46' }, { label: 'Colors', value: 'White, White/Black, Black' }],
    specs: [{ label: 'Material', value: 'Couro genuíno bovino' }, { label: 'Sola', value: 'Borracha' }, { label: 'Tamanhos', value: '36 ao 46' }, { label: 'Cores', value: 'Branco, Branco/Preto, Preto' }],
  },
  {
    id: 15, sku: 'KN-015', name: 'Ténis Pele T-Toe',
    category: 'Calçado', subcategory: 'Calçado', vertical: 'vestuario',
    tags: ['calçado'],
    price: 120, originalPrice: null,
    badge: 'Popular', badgeColor: 'bordo',
    rating: 4.8, reviews: 720, stock: 48,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 20 L-70 45 L60 45 L70 25 L60 5 L20 5 L-5 -15 L-40 0 L-55 15 Z%22/><path d=%22M-40 0 L-30 20 M-15 -5 L-5 20 M15 5 L20 20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Calçado</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 20 L-70 45 L60 45 L70 25 L60 5 L20 5 L-5 -15 L-40 0 L-55 15 Z%22/><path d=%22M-40 0 L-30 20 M-15 -5 L-5 20 M15 5 L20 20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Calçado</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Topo em pele com proteção em camurça T-toe, sola em borracha natural. Estilo retro contemporâneo.',
    nameEn: 'Suede T-Toe Sneakers',
    descriptionEn: 'Leather upper with T-toe suede protection, natural rubber sole. Contemporary retro style.',
    categoryEn: 'Footwear',
    subcategoryEn: 'Footwear',
    specsEn: [{ label: 'Material', value: 'Leather + Suede' }, { label: 'Sole', value: 'Natural rubber' }, { label: 'Sizes', value: '36 to 46' }, { label: 'Colors', value: 'White/Black, Black, Beige' }],
    specs: [{ label: 'Material', value: 'Pele + Camurça' }, { label: 'Sola', value: 'Borracha natural' }, { label: 'Tamanhos', value: '36 ao 46' }, { label: 'Cores', value: 'Branco/Preto, Preto, Bege' }],
  },
  {
    id: 16, sku: 'KN-016', name: 'Boné Estruturado 6 Painéis',
    category: 'Acessórios', subcategory: 'Acessórios', vertical: 'vestuario',
    tags: ['acessórios'],
    price: 25.99, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.7, reviews: 610, stock: 60,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-45 15 L45 15 L45 -5 C45 -30 -45 -30 -45 -5 Z M-45 15 L60 20 L60 30 L-45 30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Acessórios</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-45 15 L45 15 L45 -5 C45 -30 -45 -30 -45 -5 Z M-45 15 L60 20 L60 30 L-45 30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Acessórios</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Sarja de algodão ajustável, estrutura moldada e logótipo 3D. O acessório essencial.',
    nameEn: '6-Panel Structured Cap',
    descriptionEn: 'Adjustable cotton twill, molded structure and 3D logo. The essential accessory.',
    categoryEn: 'Accessories',
    subcategoryEn: 'Accessories',
    specsEn: [{ label: 'Material', value: 'Cotton twill' }, { label: 'Fit', value: 'Rear snapback' }, { label: 'Size', value: 'Adjustable (56-60cm)' }, { label: 'Colors', value: 'Black, Navy, Beige, Burgundy' }],
    specs: [{ label: 'Material', value: 'Sarja Algodão' }, { label: 'Ajuste', value: 'Snapback traseiro' }, { label: 'Tamanho', value: 'Ajustável (56-60cm)' }, { label: 'Cores', value: 'Preto, Navy, Bege, Bordeaux' }],
  },
  {
    id: 17, sku: 'KN-017', name: 'Carteira Slim Couro RFID',
    category: 'Acessórios', subcategory: 'Acessórios', vertical: 'vestuario',
    tags: ['acessórios'],
    price: 59.95, originalPrice: null,
    badge: null, badgeColor: 'gold',
    rating: 4.7, reviews: 230, stock: 35,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-50%22 y=%22-20%22 width=%22100%22 height=%2255%22 rx=%224%22/><path d=%22M-50 -5 L50 -5%22/><circle cx=%2230%22 cy=%2215%22 r=%224%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Acessórios</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-50%22 y=%22-20%22 width=%22100%22 height=%2255%22 rx=%224%22/><path d=%22M-50 -5 L50 -5%22/><circle cx=%2230%22 cy=%2215%22 r=%224%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Acessórios</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Alumínio protetor de cartões e couro europeu com sistema de extração rápida. Proteção RFID incluída.',
    nameEn: 'RFID Slim Leather Wallet',
    descriptionEn: 'Card-protecting aluminum and European leather with quick extraction system. RFID protection included.',
    categoryEn: 'Accessories',
    subcategoryEn: 'Accessories',
    specsEn: [{ label: 'Material', value: 'Leather + Aluminum' }, { label: 'Capacity', value: '6 cards + notes' }, { label: 'Protection', value: 'RFID-blocking' }, { label: 'Colors', value: 'Black, Brown, Cognac, Olive' }],
    specs: [{ label: 'Material', value: 'Couro + Alumínio' }, { label: 'Capacidade', value: '6 cartões + notas' }, { label: 'Proteção', value: 'Anti-RFID' }, { label: 'Cores', value: 'Preto, Castanho, Cognac, Verde-oliva' }],
  },
  {
    id: 18, sku: 'KN-018', name: 'Mochila Clássica 16L Impermeável',
    category: 'Acessórios', subcategory: 'Acessórios', vertical: 'vestuario',
    tags: ['acessórios'],
    price: 89.95, originalPrice: null,
    badge: 'Popular', badgeColor: 'bordo',
    rating: 4.8, reviews: 380, stock: 40,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-45 -10 L-45 60 L45 60 L45 -10 Z M-25 -10 C-25 -35 25 -35 25 -10%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Acessórios</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-45 -10 L-45 60 L45 60 L45 -10 Z M-25 -10 C-25 -35 25 -35 25 -10%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Acessórios</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Tecido impermeável leve e durável com emblema refletor. A mochila que dura anos.',
    nameEn: 'Classic 16L Waterproof Backpack',
    descriptionEn: 'Lightweight durable waterproof fabric with reflective badge. The backpack that lasts.',
    categoryEn: 'Accessories',
    subcategoryEn: 'Accessories',
    specsEn: [{ label: 'Material', value: 'Waterproof technical fabric' }, { label: 'Capacity', value: '16 Liters' }, { label: 'Weight', value: '300g' }, { label: 'Colors', value: 'Black, Navy, Olive, Burgundy, Beige' }],
    specs: [{ label: 'Material', value: 'Tecido técnico impermeável' }, { label: 'Capacidade', value: '16 Litros' }, { label: 'Peso', value: '300g' }, { label: 'Cores', value: 'Preto, Navy, Verde-oliva, Bordeaux, Bege' }],
  },
  {
    id: 19, sku: 'KN-ATL-001', name: 'T-shirt Numerada — Karmic Edition',
    category: 'Edições Limitadas', subcategory: 'Atelier', vertical: 'atelier',
    tags: ['atelier', 'limitada', 'numerada'],
    price: 89.99, originalPrice: null,
    badge: 'Edição Limitada', badgeColor: 'gold',
    rating: 5.0, reviews: 42, stock: 20,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-90 -10 L-70 20 L-50 10 L-50 60 L50 60 L50 10 L70 20 L90 -10 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z%22/><circle cx=%220%22 cy=%2225%22 r=%2214%22/><text x=%220%22 y=%2230%22 font-size=%2216%22 text-anchor=%22middle%22 fill=%22currentColor%22>01</text></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Edições Limitadas</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-90 -10 L-70 20 L-50 10 L-50 60 L50 60 L50 10 L70 20 L90 -10 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Edições Limitadas</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Peça numerada 001-020. Algodão pima orgânico 240gsm, bordado à mão, etiqueta de linho com o teu número.',
    nameEn: 'Numbered T-shirt — Karmic Edition',
    descriptionEn: 'Numbered piece 001-020. Organic pima cotton 240gsm, hand embroidery, linen label with your number.',
    categoryEn: 'Limited Editions',
    subcategoryEn: 'Atelier',
    specsEn: [{ label: 'Edition', value: 'Limited to 20 units' }, { label: 'Material', value: 'Organic pima cotton' }, { label: 'Weight', value: '240gsm' }, { label: 'Details', value: 'Hand embroidery' }, { label: 'Certification', value: 'GOTS + Fair Trade' }],
    specs: [{ label: 'Edição', value: 'Limitada a 20 unidades' }, { label: 'Material', value: 'Algodão pima orgânico' }, { label: 'Gramagem', value: '240gsm' }, { label: 'Detalhes', value: 'Bordado à mão' }, { label: 'Certificação', value: 'GOTS + Fair Trade' }],
  },
  {
    id: 20, sku: 'KN-ATL-002', name: 'Casaco Ribatejo — Coleção Cápsula',
    category: 'Edições Limitadas', subcategory: 'Atelier', vertical: 'atelier',
    tags: ['atelier', 'casaco', 'capsula'],
    price: 349, originalPrice: null,
    badge: 'Cápsula Outono', badgeColor: 'bordo',
    rating: 4.9, reviews: 18, stock: 15,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-55 -30 L-85 -5 L-65 20 L-50 10 L-50 60 L50 60 L50 10 L65 20 L85 -5 L55 -30 L20 -30 L15 -15 L-15 -15 L-20 -30 Z M-15 -15 L-10 15 L10 15 L15 -15%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Edições Limitadas</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-55 -30 L-85 -5 L-65 20 L-50 10 L-50 60 L50 60 L50 10 L65 20 L85 -5 L55 -30 L20 -30 L15 -15 L-15 -15 L-20 -30 Z M-15 -15 L-10 15 L10 15 L15 -15%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Edições Limitadas</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Casaco de lã virgem portuguesa, forro de seda. Homenagem ao Ribatejo. Produção artesanal em Cartaxo.',
    nameEn: 'Ribatejo Coat — Capsule Collection',
    descriptionEn: 'Portuguese virgin wool coat, silk lining. Homage to Ribatejo. Artisanal production in Cartaxo.',
    categoryEn: 'Limited Editions',
    subcategoryEn: 'Atelier',
    specs: [{ label: 'Edição', value: '15 peças únicas' }, { label: 'Material', value: 'Lã virgem PT + forro seda' }, { label: 'Origem', value: 'Feito em Cartaxo, Portugal' }, { label: 'Assinatura', value: 'Etiqueta assinada' }],
    specsEn: [{ label: 'Edition', value: '15 unique pieces' }, { label: 'Material', value: 'PT virgin wool + silk lining' }, { label: 'Origin', value: 'Made in Cartaxo, Portugal' }, { label: 'Signature', value: 'Signed label' }],
  },
  {
    id: 21, sku: 'KN-ATL-003', name: 'Vestido Cerimónia — Bordado Artesanal',
    category: 'Edições Limitadas', subcategory: 'Atelier', vertical: 'atelier',
    tags: ['atelier', 'vestido', 'bordado'],
    price: 429, originalPrice: null,
    badge: 'Peça Única', badgeColor: 'gold',
    rating: 5.0, reviews: 12, stock: 8,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-55 -30 L-85 0 L-70 25 L-50 15 L-50 60 L50 60 L50 15 L70 25 L85 0 L55 -30 L20 -30 L0 -10 L-20 -30 Z M-30 0 L-30 55 M30 0 L30 55 M0 -10 L0 55%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Edições Limitadas</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-55 -30 L-85 0 L-70 25 L-50 15 L-50 60 L50 60 L50 15 L70 25 L85 0 L55 -30 L20 -30 L0 -10 L-20 -30 Z M-30 0 L-30 55 M30 0 L30 55 M0 -10 L0 55%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Edições Limitadas</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Vestido midi com bordados à mão inspirados em azulejaria portuguesa. Feito sob encomenda.',
    nameEn: 'Ceremony Dress — Hand Embroidered',
    descriptionEn: 'Midi dress with hand embroidery inspired by Portuguese tile art. Made to order.',
    categoryEn: 'Limited Editions',
    subcategoryEn: 'Atelier',
    specs: [{ label: 'Produção', value: 'Sob encomenda (4-6 sem.)' }, { label: 'Material', value: 'Viscose EcoVero' }, { label: 'Bordado', value: '100% artesanal' }, { label: 'Inspiração', value: 'Azulejaria PT séc. XVIII' }],
    specsEn: [{ label: 'Production', value: 'Made to order (4-6 weeks)' }, { label: 'Material', value: 'EcoVero viscose' }, { label: 'Embroidery', value: '100% handmade' }, { label: 'Inspiration', value: '18th century PT tiles' }],
  },
  {
    id: 22, sku: 'KN-ATL-004', name: 'Camisa de Linho — Signature Collection',
    category: 'Edições Limitadas', subcategory: 'Atelier', vertical: 'atelier',
    tags: ['atelier', 'linho', 'signature'],
    price: 189, originalPrice: null,
    badge: 'Signature', badgeColor: 'gold',
    rating: 4.9, reviews: 34, stock: 25,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-90 -5 L-70 25 L-50 15 L-50 65 L50 65 L50 15 L70 25 L90 -5 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Edições Limitadas</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-90 -5 L-70 25 L-50 15 L-50 65 L50 65 L50 15 L70 25 L90 -5 L60 -30 L40 -30 C40 -10 20 0 0 0 C-20 0 -40 -10 -40 -30 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Edições Limitadas</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Linho europeu de gama alta, corte relaxado. Botões de madeira certificada. Coleção mestre.',
    nameEn: 'Linen Shirt — Signature Collection',
    descriptionEn: 'High-end European linen, relaxed cut. Certified wood buttons. Master collection.',
    categoryEn: 'Limited Editions',
    subcategoryEn: 'Atelier',
    specs: [{ label: 'Material', value: 'Linho europeu 180gsm' }, { label: 'Botões', value: 'Madeira FSC certificada' }, { label: 'Corte', value: 'Relaxado, unissex' }, { label: 'Origem', value: 'Tecelagem em Portugal' }],
    specsEn: [{ label: 'Material', value: 'European linen 180gsm' }, { label: 'Buttons', value: 'FSC certified wood' }, { label: 'Cut', value: 'Relaxed, unisex' }, { label: 'Origin', value: 'Woven in Portugal' }],
  },
  {
    id: 23, sku: 'KN-ATL-005', name: 'Blazer Alfaiataria — Made-to-Measure',
    category: 'Edições Limitadas', subcategory: 'Atelier', vertical: 'atelier',
    tags: ['atelier', 'blazer', 'alfaiataria'],
    price: 549, originalPrice: null,
    badge: 'Sob Medida', badgeColor: 'bordo',
    rating: 5.0, reviews: 8, stock: 10,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -25 L-90 5 L-70 30 L-50 20 L-50 70 L50 70 L50 20 L70 30 L90 5 L60 -25 C60 -50 -60 -50 -60 -25 Z M-25 -20 L-15 30 L15 30 L25 -20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Edições Limitadas</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -25 L-90 5 L-70 30 L-50 20 L-50 70 L50 70 L50 20 L70 30 L90 5 L60 -25 C60 -50 -60 -50 -60 -25 Z M-25 -20 L-15 30 L15 30 L25 -20%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Edições Limitadas</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Blazer feito sob medida por alfaiate português. Lã Loro Piana ou merino, à tua escolha. 3 provas incluídas.',
    nameEn: 'Tailored Blazer — Made-to-Measure',
    descriptionEn: 'Blazer made to measure by Portuguese tailor. Loro Piana or merino wool, your choice. 3 fittings included.',
    categoryEn: 'Limited Editions',
    subcategoryEn: 'Atelier',
    specs: [{ label: 'Confecção', value: 'Sob medida completa' }, { label: 'Provas', value: '3 provas incluídas' }, { label: 'Material', value: 'Loro Piana ou merino' }, { label: 'Prazo', value: '6-8 semanas' }],
    specsEn: [{ label: 'Tailoring', value: 'Full made-to-measure' }, { label: 'Fittings', value: '3 fittings included' }, { label: 'Material', value: 'Loro Piana or merino' }, { label: 'Delivery', value: '6-8 weeks' }],
  },
  {
    id: 24, sku: 'KN-ATL-006', name: 'Kimono Karmic — Colab Artista',
    category: 'Edições Limitadas', subcategory: 'Atelier', vertical: 'atelier',
    tags: ['atelier', 'kimono', 'colaboracao'],
    price: 279, originalPrice: null,
    badge: 'Colaboração', badgeColor: 'gold',
    rating: 4.9, reviews: 22, stock: 30,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-85 0 L-70 25 L-55 15 L-55 65 L-10 65 L-10 -25 L10 -25 L10 65 L55 65 L55 15 L70 25 L85 0 L60 -30 Z M-10 -25 L0 -15 L10 -25%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Edições Limitadas</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-60 -30 L-85 0 L-70 25 L-55 15 L-55 65 L-10 65 L-10 -25 L10 -25 L10 65 L55 65 L55 15 L70 25 L85 0 L60 -30 Z M-10 -25 L0 -15 L10 -25%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Edições Limitadas</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Colaboração com artista visual português. Estampado exclusivo, cada peça numerada. 30 unidades no mundo.',
    nameEn: 'Karmic Kimono — Artist Collab',
    descriptionEn: 'Collaboration with Portuguese visual artist. Exclusive print, each piece numbered. 30 units worldwide.',
    categoryEn: 'Limited Editions',
    subcategoryEn: 'Atelier',
    specs: [{ label: 'Colaboração', value: 'Artista visual PT (Anon.)' }, { label: 'Edição', value: '30 numeradas' }, { label: 'Material', value: 'Viscose crepe' }, { label: 'Estampado', value: 'Sublimação eco-friendly' }],
    specsEn: [{ label: 'Collaboration', value: 'PT visual artist' }, { label: 'Edition', value: '30 numbered' }, { label: 'Material', value: 'Crepe viscose' }, { label: 'Print', value: 'Eco-friendly sublimation' }],
  },
  {
    id: 25, sku: 'KN-CASA-001', name: 'Almofada Karmic — Linho Bordado',
    category: 'Almofadas', subcategory: 'Têxtil Lar', vertical: 'casa',
    tags: ['casa', 'almofada', 'linho'],
    price: 49.99, originalPrice: null,
    badge: null, badgeColor: 'gold',
    rating: 4.8, reviews: 128, stock: 40,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-50%22 y=%22-50%22 width=%22100%22 height=%22100%22 rx=%228%22/><path d=%22M-20 0 L0 -18 L20 0 L0 18 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Têxtil Lar</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-50%22 y=%22-50%22 width=%22100%22 height=%22100%22 rx=%228%22/><path d=%22M-20 0 L0 -18 L20 0 L0 18 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Têxtil Lar</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Capa de almofada em linho natural com bordado Karmic. 50×50cm. Inclui enchimento em pena.',
    nameEn: 'Karmic Cushion — Embroidered Linen',
    descriptionEn: 'Natural linen cushion cover with Karmic embroidery. 50×50cm. Feather insert included.',
    categoryEn: 'Cushions',
    subcategoryEn: 'Home Textile',
    specs: [{ label: 'Tamanho', value: '50×50 cm' }, { label: 'Material', value: 'Linho natural 100%' }, { label: 'Bordado', value: 'Logo Karmic ✦' }, { label: 'Enchimento', value: 'Pena natural incluída' }],
    specsEn: [{ label: 'Size', value: '50×50 cm' }, { label: 'Material', value: '100% natural linen' }, { label: 'Embroidery', value: 'Karmic ✦ logo' }, { label: 'Filling', value: 'Natural feather included' }],
  },
  {
    id: 26, sku: 'KN-CASA-002', name: 'Manta Karmic — Lã Merino',
    category: 'Mantas', subcategory: 'Têxtil Lar', vertical: 'casa',
    tags: ['casa', 'manta', 'la'],
    price: 129, originalPrice: null,
    badge: 'Popular', badgeColor: 'bordo',
    rating: 4.9, reviews: 86, stock: 30,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-70%22 y=%22-45%22 width=%22140%22 height=%2290%22 rx=%224%22/><path d=%22M-70 -25 L70 -25 M-70 -5 L70 -5 M-70 15 L70 15%22 opacity=%22.5%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Têxtil Lar</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-70%22 y=%22-45%22 width=%22140%22 height=%2290%22 rx=%224%22/><path d=%22M-70 -25 L70 -25 M-70 -5 L70 -5 M-70 15 L70 15%22 opacity=%22.5%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Têxtil Lar</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Manta em lã merino portuguesa, tecelagem tradicional. Padrão exclusivo Karmic. 130×180cm.',
    nameEn: 'Karmic Throw — Merino Wool',
    descriptionEn: 'Portuguese merino wool throw, traditional weaving. Exclusive Karmic pattern. 130×180cm.',
    categoryEn: 'Throws',
    subcategoryEn: 'Home Textile',
    specs: [{ label: 'Dimensões', value: '130 × 180 cm' }, { label: 'Material', value: 'Lã merino portuguesa' }, { label: 'Tecelagem', value: 'Artesanal tradicional' }, { label: 'Padrão', value: 'Exclusivo Karmic' }],
    specsEn: [{ label: 'Dimensions', value: '130 × 180 cm' }, { label: 'Material', value: 'Portuguese merino wool' }, { label: 'Weaving', value: 'Traditional artisanal' }, { label: 'Pattern', value: 'Karmic exclusive' }],
  },
  {
    id: 27, sku: 'KN-CASA-003', name: 'Vela Aromática — Ritual Karmic',
    category: 'Aromas', subcategory: 'Ambiente', vertical: 'casa',
    tags: ['casa', 'vela', 'aroma'],
    price: 39.99, originalPrice: null,
    badge: 'Bestseller', badgeColor: 'bordo',
    rating: 4.9, reviews: 340, stock: 80,
    customizable: false,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-30%22 y=%22-20%22 width=%2260%22 height=%2265%22 rx=%224%22/><path d=%22M0 -20 L0 -35 M-6 -40 C-6 -46 6 -46 6 -40 C6 -34 -6 -34 -6 -40%22 fill=%22currentColor%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Ambiente</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-30%22 y=%22-20%22 width=%2260%22 height=%2265%22 rx=%224%22/><path d=%22M0 -20 L0 -35 M-6 -40 C-6 -46 6 -46 6 -40 C6 -34 -6 -34 -6 -40%22 fill=%22currentColor%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Ambiente</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Vela em cera de soja com essências naturais: alfazema, bergamota e sândalo. 250g, 50h de duração.',
    nameEn: 'Aromatic Candle — Karmic Ritual',
    descriptionEn: 'Soy wax candle with natural essences: lavender, bergamot and sandalwood. 250g, 50h burn time.',
    categoryEn: 'Fragrance',
    subcategoryEn: 'Ambience',
    specs: [{ label: 'Cera', value: 'Soja natural 100%' }, { label: 'Notas', value: 'Alfazema · Bergamota · Sândalo' }, { label: 'Peso', value: '250g' }, { label: 'Duração', value: '~50 horas' }],
    specsEn: [{ label: 'Wax', value: '100% natural soy' }, { label: 'Notes', value: 'Lavender · Bergamot · Sandalwood' }, { label: 'Weight', value: '250g' }, { label: 'Burn time', value: '~50 hours' }],
  },
  {
    id: 28, sku: 'KN-CASA-004', name: 'Roupão Spa — Algodão Egípcio',
    category: 'Banho', subcategory: 'Têxtil Lar', vertical: 'casa',
    tags: ['casa', 'roupao', 'banho'],
    price: 119, originalPrice: null,
    badge: 'Premium', badgeColor: 'gold',
    rating: 4.8, reviews: 156, stock: 35,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-45 -35 L-70 0 L-55 20 L-40 10 L-40 70 L40 70 L40 10 L55 20 L70 0 L45 -35 L20 -35 L0 -20 L-20 -35 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Têxtil Lar</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><path d=%22M-45 -35 L-70 0 L-55 20 L-40 10 L-40 70 L40 70 L40 10 L55 20 L70 0 L45 -35 L20 -35 L0 -20 L-20 -35 Z%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Têxtil Lar</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Roupão em algodão egípcio 550gsm, ultra-macio. Bordado Karmic personalizável. Como um SPA em casa.',
    nameEn: 'Spa Robe — Egyptian Cotton',
    descriptionEn: 'Egyptian cotton robe 550gsm, ultra-soft. Customizable Karmic embroidery. SPA at home.',
    categoryEn: 'Bath',
    subcategoryEn: 'Home Textile',
    specs: [{ label: 'Material', value: 'Algodão egípcio 550gsm' }, { label: 'Tamanhos', value: 'S · M · L · XL · XXL' }, { label: 'Cores', value: 'Off-white · Bordô · Preto' }, { label: 'Personalizável', value: 'Bordado até 20 letras' }],
    specsEn: [{ label: 'Material', value: 'Egyptian cotton 550gsm' }, { label: 'Sizes', value: 'S · M · L · XL · XXL' }, { label: 'Colors', value: 'Off-white · Bordeaux · Black' }, { label: 'Customizable', value: 'Embroidery up to 20 letters' }],
  },
  {
    id: 29, sku: 'KN-CASA-005', name: 'Poster Karmic — Impressão Museológica',
    category: 'Arte', subcategory: 'Decoração', vertical: 'casa',
    tags: ['casa', 'poster', 'arte'],
    price: 34.99, originalPrice: null,
    badge: null, badgeColor: 'gold',
    rating: 4.7, reviews: 92, stock: 60,
    customizable: true,
    image: 'data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-40%22 y=%22-55%22 width=%2280%22 height=%22110%22 rx=%222%22/><path d=%22M-25 -30 L25 -30 M-25 -15 L15 -15 M-25 0 L25 0%22 opacity=%22.5%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Decoração</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>',
    images: ['data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 600%22 preserveAspectRatio=%22xMidYMid slice%22><defs><radialGradient id=%22g%22 cx=%2250%%22 cy=%2240%%22 r=%2270%%22><stop offset=%220%%22 stop-color=%22%23B08D57%22 stop-opacity=%22.35%22/><stop offset=%22100%%22 stop-color=%22%230B0B0C%22 stop-opacity=%221%22/></radialGradient><pattern id=%22p%22 width=%2240%22 height=%2240%22 patternUnits=%22userSpaceOnUse%22><path d=%22M0 20 L40 20 M20 0 L20 40%22 stroke=%22%23B08D57%22 stroke-width=%22.5%22 opacity=%22.08%22/></pattern></defs><rect width=%22800%22 height=%22600%22 fill=%22url(%23g)%22/><rect width=%22800%22 height=%22600%22 fill=%22url(%23p)%22/><g transform=%22translate(400 260)%22 fill=%22none%22 stroke=%22%23B08D57%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 opacity=%22.85%22><rect x=%22-40%22 y=%22-55%22 width=%2280%22 height=%22110%22 rx=%222%22/><path d=%22M-25 -30 L25 -30 M-25 -15 L15 -15 M-25 0 L25 0%22 opacity=%22.5%22/></g><text x=%22400%22 y=%22450%22 font-family=%22Georgia, serif%22 font-size=%2230%22 fill=%22%23B08D57%22 opacity=%22.95%22 text-anchor=%22middle%22 font-style=%22italic%22>Decoração</text><text x=%22400%22 y=%22490%22 font-family=%22Inter, sans-serif%22 font-size=%2211%22 fill=%22%23F5F2ED%22 opacity=%22.5%22 text-anchor=%22middle%22 letter-spacing=%224%22>KARMIC · NODE</text></svg>'],
    description: 'Poster em papel Hahnemühle 308gsm, impressão giclée museológica. Design Karmic ou o teu próprio.',
    nameEn: 'Karmic Poster — Museum Print',
    descriptionEn: 'Poster on Hahnemühle 308gsm paper, museum-grade giclée print. Karmic design or your own.',
    categoryEn: 'Art',
    subcategoryEn: 'Decor',
    specs: [{ label: 'Papel', value: 'Hahnemühle 308gsm' }, { label: 'Impressão', value: 'Giclée museológica' }, { label: 'Tamanhos', value: 'A3 · A2 · A1' }, { label: 'Personalizável', value: 'Sim, design próprio' }],
    specsEn: [{ label: 'Paper', value: 'Hahnemühle 308gsm' }, { label: 'Print', value: 'Museum giclée' }, { label: 'Sizes', value: 'A3 · A2 · A1' }, { label: 'Customizable', value: 'Yes, own design' }],
  }
]





// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })
}

function Stars({ rating, size = 11 }: { rating: number; size?: number }) {
  return (
    <span className="kn-stars">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 12 12" fill={i <= Math.round(rating) ? 'var(--gold)' : 'var(--bg-3)'}>
          <path d="M6 1l1.3 3h3.2l-2.6 1.9.9 3.1L6 7.3l-2.8 1.7.9-3.1L1.5 4H4.7z" />
        </svg>
      ))}
    </span>
  )
}

// ─── Sustainability badges ─────────────────────────────────────────────────
// O catálogo estático não tem tags de sustentabilidade próprias (o campo
// `tags` guarda categorias, ex. ['tops','camisaria']). Mapeamos por vertical
// + características conhecidas do produto, em vez de inventar dados falsos
// por SKU: todos são feitos em Portugal; Atelier é feito à mão e por
// encomenda; produtos customizáveis são "made to order".
const SUSTAINABILITY_BADGES: Record<string, { icon: string; labelPt: string; labelEn: string; color: string }> = {
  'made-in-portugal': { icon: '🇵🇹', labelPt: 'Feito em Portugal', labelEn: 'Made in Portugal', color: '#8B1E2D' },
  'handmade': { icon: '✋', labelPt: 'Feito à Mão', labelEn: 'Handmade', color: '#B08D57' },
  'made-to-order': { icon: '⏱', labelPt: 'Feito por Encomenda', labelEn: 'Made to Order', color: '#457B9D' },
  'limited-edition': { icon: '✦', labelPt: 'Edição Limitada', labelEn: 'Limited Edition', color: '#B08D57' },
  'organic-cotton': { icon: '🌱', labelPt: 'Algodão Orgânico', labelEn: 'Organic Cotton', color: '#4caf50' },
}

function sustainabilityTagsFor(p: Product): string[] {
  const tags: string[] = ['made-in-portugal'] // toda a produção é feita em Portugal
  if (p.vertical === 'atelier') tags.push('handmade', 'limited-edition')
  if (p.customizable) tags.push('made-to-order')
  if (p.tags?.includes('tops') || p.tags?.includes('camisaria')) tags.push('organic-cotton')
  return Array.from(new Set(tags))
}

function SustainabilityBadges({ product, size = 'small' }: { product: Product; size?: 'small' | 'large' }) {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const tags = sustainabilityTagsFor(product)
  if (!tags.length) return null
  const fontSize = size === 'small' ? 9 : 11
  const padding = size === 'small' ? '3px 8px' : '5px 12px'
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {tags.map(key => {
        const b = SUSTAINABILITY_BADGES[key]
        if (!b) return null
        return (
          <span key={key} title={isEN ? b.labelEn : b.labelPt}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding, background: b.color + '22', color: b.color, border: `1px solid ${b.color}55`, fontSize, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700 }}>
            <span>{b.icon}</span><span>{isEN ? b.labelEn : b.labelPt}</span>
          </span>
        )
      })}
    </div>
  )
}

function Eyebrow({ text }: { text: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
      <span style={{ width: 28, height: 1, background: 'linear-gradient(90deg,transparent,var(--gold))', flexShrink: 0 }} />
      {text}
    </div>
  )
}

function SectionHead({ eyebrow, title, lead, cta }: { eyebrow: string; title: string; lead?: string; cta?: ReactNode }) {
  return (
    <div className="kn-section-head">
      <div>
        <Eyebrow text={eyebrow} />
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(30px,3.5vw,52px)', fontWeight: 500, margin: '16px 0 0', lineHeight: 1.08 }} dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      {(lead || cta) && (
        <div style={{ paddingBottom: 6 }}>
          {lead && <p style={{ color: 'var(--fg-dim)', fontSize: 'clamp(15px,1.1vw,17px)', maxWidth: '46ch', lineHeight: 1.65 }}>{lead}</p>}
          {cta && <div style={{ marginTop: 28 }}>{cta}</div>}
        </div>
      )}
    </div>
  )
}

function GhostBtn({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 22px', background: 'transparent', border: `1px solid ${hov ? 'var(--gold)' : 'var(--gold-3)'}`, color: hov ? 'var(--fg)' : 'var(--gold-2)', fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 500, transition: 'all .2s ease' }}>
      {children}
      <svg width="12" height="8" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h12M9 1l4 4-4 4" /></svg>
    </button>
  )
}

function PrimaryBtn({ children, onClick, full, disabled }: { children: ReactNode; onClick?: () => void; full?: boolean; disabled?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={disabled ? undefined : onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      disabled={disabled}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 28px', background: disabled ? 'var(--border)' : hov ? 'var(--bordo-2)' : 'var(--bordo)', border: 'none', color: disabled ? 'var(--fg-mute)' : 'var(--btn-primary-fg)', fontFamily: 'var(--f-sans)', fontSize: 12, letterSpacing: '.24em', textTransform: 'uppercase', fontWeight: 500, transition: 'background .2s ease', width: full ? '100%' : 'auto', cursor: disabled ? 'not-allowed' : 'pointer' }}>
      {children}
      {!disabled && <svg width="13" height="9" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h12M9 1l4 4-4 4" /></svg>}
    </button>
  )
}

// ─── ProductCard ─────────────────────────────────────────────────────────────

function ProductCard({ p, onAdd, onOpen, wishlist, toggleWish }: {
  p: Product
  onAdd: (p: Product) => void
  onOpen: (p: Product) => void
  wishlist: Set<number>
  toggleWish: (id: number) => void
}) {
  const { t } = useLang()
  const pi = useProductI18n()
  const [hov, setHov] = useState(false)
  const disc = p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'var(--bg-1)', border: `1px solid ${hov ? 'var(--gold-3)' : 'var(--border)'}`, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', transition: 'border-color .3s, transform .3s, box-shadow .3s', transform: hov ? 'translateY(-4px)' : 'none', boxShadow: hov ? '0 16px 48px rgba(0,0,0,.45)' : 'none', cursor: 'pointer' }}
    >
      {/* Badge */}
      {p.badge && (
        <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 3, padding: '4px 10px', fontSize: 10, fontWeight: 700, letterSpacing: '.16em', textTransform: 'uppercase' }} className={p.badgeColor === 'bordo' ? 'kn-badge-bordo' : 'kn-badge-gold'}>
          {pi.pBadge(p)}
        </div>
      )}

      {/* Wishlist */}
      <button onClick={e => { e.stopPropagation(); toggleWish(p.id) }}
        style={{ position: 'absolute', top: 12, right: 12, zIndex: 3, width: 32, height: 32, background: 'var(--overlay-medium)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" stroke={wishlist.has(p.id) ? 'var(--bordo)' : 'var(--fg-mute)'} strokeWidth="2" className={`kn-heart${wishlist.has(p.id) ? ' active' : ''}`} fill={wishlist.has(p.id) ? 'var(--bordo)' : 'none'}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>

      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'var(--bg-2)' }} onClick={() => onOpen(p)}>
        {/* 360° card preview */}
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `radial-gradient(360px 260px at 50% 45%, ${p.vertical === 'atelier' ? '#8B1E2D' : '#B08D57'}18, transparent 65%), var(--bg-2)` }}>
          <Product3DViewer
            model3dUrl={p.model3dUrl}
            model3dIosUrl={p.model3dIosUrl}
            iconPath={PROD_ICONS[p.sku || '' || 'KN-001'] || PROD_ICONS['KN-001']}
            color={p.vertical === 'atelier' ? '#8B1E2D' : '#B08D57'}
            accent={p.vertical === 'atelier' ? '#8B1E2D' : '#B08D57'}
            size="card"
            showPresets={false}
            showHint={false}
          />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--overlay-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hov ? 1 : 0, transition: 'opacity .3s ease', zIndex: 2 }}>
          <button onClick={e => { e.stopPropagation(); onOpen(p) }}
            style={{ padding: '10px 20px', background: 'var(--bg-1)', border: '1px solid var(--gold-3)', color: 'var(--fg)', fontFamily: 'var(--f-sans)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 500 }}>
            {t('card_view_product')}
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '18px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>{pi.pCat(p)}</div>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.25, cursor: 'pointer' }} onClick={() => onOpen(p)}>{pi.pName(p)}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Stars rating={p.rating} />
          <span style={{ fontSize: 11, color: 'var(--fg-mute)' }}>({p.reviews})</span>
        </div>
        <SustainabilityBadges product={p} size="small" />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 21, fontWeight: 600 }}>{fmt(p.price)}</span>
          {p.originalPrice && <span style={{ fontSize: 12, color: 'var(--fg-mute)', textDecoration: 'line-through' }}>{fmt(p.originalPrice)}</span>}
          {disc > 0 && <span style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>−{disc}%</span>}
        </div>
      </div>

      {/* Add to cart */}
      <button onClick={() => onAdd(p)}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bordo-2)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-3)')}
        style={{ margin: '0 18px 18px', padding: '11px', background: 'var(--bg-3)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--f-sans)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .2s ease' }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L4 7v13h16V7L18 2Z" /><path d="M8 10c0 2 1.8 4 4 4s4-2 4-4" /></svg>
        {t('card_add_cart')}
      </button>

      {/* Bottom hover accent */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'var(--bordo)', transform: hov ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: 'transform .4s ease' }} />
    </div>
  )
}

// ─── ProductCarousel ──────────────────────────────────────────────────────────

function NavArrow({ dir, disabled, onClick }: { dir: 'prev' | 'next'; disabled: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 46, height: 46, border: `1px solid ${hov && !disabled ? 'var(--gold)' : 'var(--border)'}`, background: 'transparent', color: disabled ? 'var(--bg-3)' : hov ? 'var(--gold)' : 'var(--fg-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? .35 : 1, transition: 'all .2s ease' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {dir === 'prev' ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
      </svg>
    </button>
  )
}

function ProductCarousel({ eyebrow, title, products, onAdd, onOpen, wishlist, toggleWish }: {
  eyebrow: string; title: string; products: Product[]
  onAdd: (p: Product) => void; onOpen: (p: Product) => void
  wishlist: Set<number>; toggleWish: (id: number) => void
}) {
  const [idx, setIdx] = useState(0)
  const hoverRef = useRef(false)
  const timerRef = useRef<number | null>(null)
  const VISIBLE = 4
  const max = Math.max(0, products.length - VISIBLE)

  const next = useCallback(() => setIdx(p => Math.min(p + 1, max)), [max])
  const prev = useCallback(() => setIdx(p => Math.max(p - 1, 0)), [])

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      if (!hoverRef.current) setIdx(p => p >= max ? 0 : p + 1)
    }, 4000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [max])

  const cardW = `calc((100% - ${(VISIBLE - 1) * 20}px) / ${VISIBLE})`

  return (
    <section style={{ padding: 'clamp(64px,8vw,110px) 0', borderTop: '1px solid var(--border)' }}>
      <div className="wrap">
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 44, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Eyebrow text={eyebrow} />
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(30px,3.5vw,52px)', fontWeight: 500, margin: '14px 0 0', lineHeight: 1.08 }} dangerouslySetInnerHTML={{ __html: title }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <NavArrow dir="prev" disabled={idx === 0} onClick={prev} />
            <NavArrow dir="next" disabled={idx >= max} onClick={next} />
          </div>
        </div>

        <div style={{ overflow: 'hidden' }} onMouseEnter={() => { hoverRef.current = true }} onMouseLeave={() => { hoverRef.current = false }}>
          <div style={{ display: 'flex', gap: 20, transition: 'transform .6s cubic-bezier(.25,.1,.25,1)', transform: `translateX(calc(-${idx} * (${cardW} + 20px)))` }}>
            {products.map(p => (
              <div key={p.id} style={{ width: cardW, flexShrink: 0 }}>
                <ProductCard p={p} onAdd={onAdd} onOpen={onOpen} wishlist={wishlist} toggleWish={toggleWish} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
          {Array.from({ length: max + 1 }).map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              style={{ width: i === idx ? 28 : 8, height: 8, background: i === idx ? 'var(--gold)' : 'var(--bg-3)', border: 'none', borderRadius: 4, padding: 0, transition: 'all .35s ease' }} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CartDrawer ───────────────────────────────────────────────────────────────

const SHIPPING_THRESHOLD = 150
const SHIPPING_COST = 4.99

function CartDrawer({ open, onClose, items, updateQty, remove }: {
  open: boolean; onClose: () => void; items: CartItem[]
  updateQty: (id: number, qty: number) => void; remove: (id: number) => void
}) {
  const { t, lang } = useLang()
  const pi = useProductI18n()
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const shipping = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const total = subtotal + shipping
  const freeShippingRemaining = SHIPPING_THRESHOLD - subtotal
  const [loading, setLoading] = React.useState(false)
  const [checkoutError, setCheckoutError] = React.useState('')

  const [promoInput, setPromoInput] = React.useState('')
  const [promoApplied, setPromoApplied] = React.useState<any>(null)
  const [promoValidating, setPromoValidating] = React.useState(false)
  const [promoError, setPromoError] = React.useState('')

  async function validatePromo() {
    if (!promoInput.trim()) return
    setPromoValidating(true); setPromoError('')
    try {
      const r = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim(), cart_subtotal: subtotal }),
      })
      const data = await r.json()
      if (data.valid) {
        setPromoApplied(data)
        setPromoError('')
      } else {
        setPromoError(data.error || 'Código inválido')
        setPromoApplied(null)
      }
    } catch {
      setPromoError('Erro de rede')
    } finally { setPromoValidating(false) }
  }

  async function handleCheckout() {
    setLoading(true)
    setCheckoutError('')
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          origin: window.location.origin,
          locale: lang || 'pt',
          promo_code: promoApplied?.code || undefined,
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setCheckoutError(data.error || 'Erro ao iniciar pagamento. Tente novamente.')
      }
    } catch {
      setCheckoutError('Erro de rede. Verifique a ligação e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={`cart-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`cart-drawer ${open ? 'open' : ''}`}>

        {/* Header */}
        <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Eyebrow text={t('cart_title')} />
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 24, fontWeight: 500, marginTop: 8 }}>
              {items.length} {items.length === 1 ? t('cart_article') : t('cart_articles')}
            </div>
          </div>
          <button onClick={onClose} style={{ width: 38, height: 38, border: '1px solid var(--border)', background: 'transparent', color: 'var(--fg-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Free shipping progress */}
        {items.length > 0 && (
          <div style={{ padding: '12px 26px', background: subtotal >= SHIPPING_THRESHOLD ? 'rgba(176,141,87,.1)' : 'var(--bg-1)', borderBottom: '1px solid var(--border)' }}>
            {subtotal >= SHIPPING_THRESHOLD ? (
              <div style={{ fontSize: 12, color: 'var(--gold)', display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                {t('cart_free_achieved')}
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginBottom: 7 }}>
                  <b style={{ color: 'var(--fg)' }}>{fmt(freeShippingRemaining)}</b> {t('cart_free_progress')}
                </div>
                <div style={{ height: 3, background: 'var(--border)', borderRadius: 2 }}>
                  <div style={{ height: '100%', background: 'var(--gold)', borderRadius: 2, width: `${Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100)}%`, transition: 'width .4s ease' }} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 26px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--fg-mute)' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ margin: '0 auto 16px', display: 'block', opacity: .4 }}>
                <path d="M6 2L4 7v13h16V7L18 2Z" /><path d="M8 10c0 2 1.8 4 4 4s4-2 4-4" />
              </svg>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 20 }}>{t('cart_empty')}</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>{t('cart_empty_sub')}</div>
            </div>
          ) : items.map(item => (
            <div key={item.id} style={{ display: 'flex', gap: 12, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 72, height: 72, flexShrink: 0, background: 'var(--bg-2)', overflow: 'hidden' }}>
                {item.image ? (
                  <img src={item.image} alt={pi.pName(item)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--border-2)" strokeWidth="1.2"><path d="M6 2L4 7v13h16V7L18 2Z" /><path d="M8 10c0 2 1.8 4 4 4s4-2 4-4" /></svg>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, fontWeight: 500, lineHeight: 1.3 }}>{pi.pName(item)}</div>
                <div style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '.16em', textTransform: 'uppercase', marginTop: 3 }}>{pi.pCat(item)}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
                  <div className="kn-qty">
                    <button onClick={() => item.qty === 1 ? remove(item.id) : updateQty(item.id, item.qty - 1)}>−</button>
                    <span>{item.qty}</span>
                    <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 600 }}>{fmt(item.price * item.qty)}</span>
                    <button onClick={() => remove(item.id)} title="Remover"
                      style={{ background: 'transparent', border: 'none', color: 'var(--fg-mute)', cursor: 'pointer', padding: 4, lineHeight: 0, transition: 'color .15s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--bordo)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-mute)')}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: '20px 26px', borderTop: '1px solid var(--border)' }}>

            {/* Código promo */}
            <div style={{ marginBottom: 14 }}>
              {!promoApplied ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value.toUpperCase())}
                    placeholder={t('cart_promo_placeholder')}
                    onKeyDown={e => e.key === 'Enter' && validatePromo()}
                    style={{
                      flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border)',
                      color: 'var(--fg)', padding: '9px 12px', fontFamily: 'var(--f-sans)', fontSize: 12,
                      letterSpacing: '.06em', outline: 'none', textTransform: 'uppercase',
                    }}
                  />
                  <button
                    onClick={validatePromo}
                    disabled={promoValidating || !promoInput.trim()}
                    style={{
                      padding: '9px 14px', background: 'transparent', border: '1px solid var(--gold-3)',
                      color: 'var(--gold)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase',
                      fontWeight: 600, cursor: promoInput.trim() ? 'pointer' : 'not-allowed', opacity: promoInput.trim() ? 1 : 0.5,
                    }}
                  >
                    {promoValidating ? '…' : t('cart_promo_apply')}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(176,141,87,.1)', border: '1px solid var(--gold-3)' }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>
                      {promoApplied.is_gift_card ? '🎁 ' : '✦ '}{promoApplied.code}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--fg-mute)', marginTop: 2 }}>
                      -{promoApplied.discount_display} € {promoApplied.discount_type === 'percent' ? `(${promoApplied.discount_value}%)` : ''}
                    </div>
                  </div>
                  <button onClick={() => { setPromoApplied(null); setPromoInput('') }} style={{ background: 'transparent', border: 'none', color: 'var(--fg-mute)', cursor: 'pointer', fontSize: 11 }}>
                    ✕
                  </button>
                </div>
              )}
              {promoError && <div style={{ marginTop: 6, fontSize: 11, color: 'var(--bordo-3)' }}>⚠ {promoError}</div>}
            </div>

            {/* Price breakdown */}
            <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--fg-mute)' }}>{t('cart_subtotal')}</span>
                <span style={{ fontSize: 15 }}>{fmt(subtotal)}</span>
              </div>
              {promoApplied && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--gold)' }}>− {t('cart_promo_discount')}</span>
                  <span style={{ fontSize: 15, color: 'var(--gold)' }}>-{promoApplied.discount_display} €</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--fg-mute)' }}>{t('cart_shipping')}</span>
                <span style={{ fontSize: 15, color: shipping === 0 ? 'var(--gold)' : 'var(--fg)' }}>
                  {shipping === 0 ? t('cart_free') : fmt(shipping)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--fg-mute)', opacity: 0.75 }}>{t('cart_tax_note')}</span>
                <span style={{ fontSize: 11, color: 'var(--fg-mute)', opacity: 0.75 }}>{t('cart_tax_at_checkout')}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--fg-mute)' }}>{t('cart_total')}</span>
                <span style={{ fontFamily: 'var(--f-display)', fontSize: 26, fontWeight: 600 }}>{fmt(total - (promoApplied?.discount_cents ? promoApplied.discount_cents / 100 : 0))}</span>
              </div>
            </div>

            {/* Error */}
            {checkoutError && (
              <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(139,30,45,.12)', border: '1px solid rgba(139,30,45,.3)', fontSize: 13, color: '#e06070', lineHeight: 1.5 }}>
                ⚠ {checkoutError}
              </div>
            )}

            <PrimaryBtn full onClick={handleCheckout} disabled={loading}>
              {loading ? t('cart_processing') : t('cart_checkout')}
            </PrimaryBtn>

            {/* Trust row */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
              {[['🔒', t('cart_trust1')], ['↩', t('cart_trust2')], ['🚚', t('cart_trust3')]].map(([icon, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--fg-mute)' }}>
                  <span>{icon}</span><span>{label}</span>
                </div>
              ))}
            </div>

            {/* Payment icons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
              {['VISA', 'MC', 'MB', 'MBWay', 'PayPal'].map(m => (
                <span key={m} style={{ fontSize: 9, letterSpacing: '.1em', color: 'var(--fg-mute)', border: '1px solid var(--border)', padding: '3px 6px' }}>{m}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ─── KIN — Chatbot IA ────────────────────────────────────────────────────
// Widget flutuante que fala com api/chat.js (LLM server-side, chave nunca
// exposta ao browser). Persona/tom "KIN": direto, discreto, sem emojis
// fofos nem entusiasmo performativo — ver system prompt em api/chat.js.
interface KinMessage { role: 'user' | 'assistant'; content: string }

function KinChatWidget({ userId }: { userId?: string }) {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<KinMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const sessionIdRef = useRef<string>('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      let sid = localStorage.getItem('kn-kin-session')
      if (!sid) { sid = 'kin-' + Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('kn-kin-session', sid) }
      sessionIdRef.current = sid
    } catch { sessionIdRef.current = 'kin-' + Date.now() }
  }, [])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, open])

  const introMsg = isEN ? "I'm KIN. I'll be around." : 'Sou o KIN. Fico por aqui se precisares.'

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const nextMessages: KinMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, sessionId: sessionIdRef.current, userId }),
      })
      const data = await res.json().catch(() => null)
      const reply = data?.reply || (isEN ? 'That escapes me. I\'ll pass you to Rafael or Rodrigo?' : 'Isso escapa-me. Passo-te ao Rafael ou ao Rodrigo?')
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: isEN ? 'That escapes me right now. karmicnode@gmail.com.' : 'Isso escapa-me agora. karmicnode@gmail.com.' }])
    }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(v => !v)} aria-label="KIN"
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 190, width: 54, height: 54, borderRadius: '50%',
          background: 'var(--gold)', color: 'var(--bg)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,.35)',
          fontFamily: 'var(--f-display)', fontSize: 18, fontWeight: 600, transition: 'transform .2s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
        {open ? '×' : 'K'}
      </button>

      {open && (
        <div style={{
          position: 'fixed', bottom: 84, right: 20, zIndex: 190, width: 340, maxWidth: 'calc(100vw - 40px)',
          height: 460, maxHeight: 'calc(100vh - 140px)', background: 'var(--bg-1)', border: '1px solid var(--gold-3)',
          boxShadow: '0 20px 60px rgba(0,0,0,.45)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gold)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: 14 }}>K</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>KIN</div>
              <div style={{ fontSize: 10, color: 'var(--fg-mute)', letterSpacing: '.06em' }}>Karmic Node</div>
            </div>
          </div>

          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ alignSelf: 'flex-start', maxWidth: '85%', background: 'var(--bg-2)', color: 'var(--fg-dim)', padding: '8px 12px', fontSize: 13, lineHeight: 1.5 }}>{introMsg}</div>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%',
                background: m.role === 'user' ? 'var(--gold)' : 'var(--bg-2)', color: m.role === 'user' ? 'var(--bg)' : 'var(--fg-dim)',
                padding: '8px 12px', fontSize: 13, lineHeight: 1.5,
              }}>{m.content}</div>
            ))}
            {loading && <div style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--fg-mute)' }}>{isEN ? 'Thinking...' : 'A pensar...'}</div>}
          </div>

          <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send() }}
              placeholder={isEN ? 'Ask KIN...' : 'Pergunta ao KIN...'}
              style={{ flex: 1, background: 'transparent', border: 'none', padding: '12px 14px', color: 'var(--fg)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            <button onClick={send} disabled={loading || !input.trim()} style={{ padding: '0 18px', background: 'transparent', border: 'none', color: 'var(--gold)', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13 }}>→</button>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function HeaderNavLink({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <a href="#" onClick={e => { e.preventDefault(); onClick() }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: active ? 'var(--gold)' : hov ? 'var(--fg)' : 'var(--fg-mute)', fontWeight: 400, padding: '4px 0', position: 'relative', transition: 'color .2s ease' }}>
      {label}
      {active && <span style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 1, background: 'var(--gold)' }} />}
    </a>
  )
}

// Sub-categorias por vertical, extraídas dos produtos reais
const VESTUARIO_SUBS = ['Tops e Camisaria', 'Malhas e Sweats', 'Outerwear', 'Bottoms', 'Vestidos e Saias', 'Athleisure', 'Calçado', 'Acessórios']
const ATELIER_SUBS = ['Edições Limitadas', 'Alfaiataria', 'Colaborações', 'Bordado à mão']
const CASA_SUBS = ['Têxtil Lar', 'Ambiente', 'Decoração', 'Banho']

function NavDropdown({ label, active, subs, navigate, page, accent }: {
  label: string; active: boolean; subs: string[]; navigate: (p: Page, filter?: string) => void; page: Page; accent?: string
}) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [hov, setHov] = useState(false)
  const timer = useRef<number | null>(null)
  const enter = () => { if (timer.current) clearTimeout(timer.current); setOpen(true); setHov(true) }
  const leave = () => { timer.current = window.setTimeout(() => { setOpen(false); setHov(false) }, 120) }
  return (
    <div style={{ position: 'relative' }} onMouseEnter={enter} onMouseLeave={leave}>
      <a href="#" onClick={e => { e.preventDefault(); navigate(page) }}
        style={{ fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: active ? 'var(--gold)' : hov ? 'var(--fg)' : 'var(--fg-mute)', fontWeight: 400, padding: '4px 0', position: 'relative', transition: 'color .2s ease', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {label}
        <svg width="9" height="6" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M1 1.5l5 5 5-5" />
        </svg>
        {active && <span style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 1, background: 'var(--gold)' }} />}
      </a>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: -20, marginTop: 14, background: 'var(--glass-bg-scrolled)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', minWidth: 240, padding: '10px 0', zIndex: 60, boxShadow: '0 20px 60px rgba(0,0,0,.6)' }}>
          <div style={{ padding: '6px 20px 10px', borderBottom: '1px solid var(--border)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent || 'var(--gold)' }} />
            <span style={{ fontSize: 10, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--fg-mute)' }}>{t('shop_subcategories')}</span>
          </div>
          {subs.map(s => (
            <a key={s} href="#" onClick={e => { e.preventDefault(); navigate(page, s) }}
              style={{ display: 'block', padding: '8px 20px', color: 'var(--fg-dim)', fontSize: 13, transition: 'all .18s ease', letterSpacing: '.02em' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(176,141,87,.08)'; el.style.color = 'var(--gold)'; el.style.paddingLeft = '26px' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = 'var(--fg-dim)'; el.style.paddingLeft = '20px' }}>
              {s}
            </a>
          ))}
          <div style={{ padding: '8px 20px 4px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
            <a href="#" onClick={e => { e.preventDefault(); navigate(page) }}
              style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {t('cats_shop')}
              <svg width="10" height="8" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h12M9 1l4 4-4 4" /></svg>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── ThemeToggle ─────────────────────────────────────────────────────────
function ThemeToggle() {
  const { t } = useLang()
  const { theme, toggle } = useTheme()
  const isLight = theme === 'light'
  return (
    <button onClick={toggle}
      title={t('theme_toggle')}
      aria-label={t('theme_toggle')}
      style={{
        width: 38, height: 38, borderRadius: 0,
        background: 'transparent', border: '1px solid var(--border)',
        color: 'var(--fg-mute)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all .3s var(--ease)', flexShrink: 0, position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'var(--gold)'; el.style.color = 'var(--gold)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'var(--border)'; el.style.color = 'var(--fg-mute)'
      }}>
      {/* Sol (light mode ativo) */}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        style={{
          position: 'absolute', transition: 'all .35s var(--ease)',
          transform: isLight ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0)',
          opacity: isLight ? 1 : 0,
        }}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
      {/* Lua (dark mode ativo) */}
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
        style={{
          position: 'absolute', transition: 'all .35s var(--ease)',
          transform: !isLight ? 'rotate(0) scale(1)' : 'rotate(90deg) scale(0)',
          opacity: !isLight ? 1 : 0,
        }}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  )
}

function Header({ activePage, navigate, cartCount, openCart, lang, setLang, auth }: {
  activePage: Page; navigate: (page: Page, filter?: string) => void; cartCount: number; openCart: () => void; lang: Lang; setLang: (l: Lang) => void; auth: ReturnType<typeof useAuth>
}) {
  const { t } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [headerH, setHeaderH] = useState(0)
  const announceRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  // Mede a altura real da announcement bar + header (varia com quebras de
  // linha em telas estreitas e com o estado "scrolled"), para o painel do
  // menu mobile começar sempre imediatamente abaixo — nunca sobreposto.
  useEffect(() => {
    const measure = () => {
      const a = announceRef.current?.offsetHeight ?? 0
      const hd = headerRef.current?.offsetHeight ?? 0
      setHeaderH(a + hd)
    }
    measure()
    window.addEventListener('resize', measure)
    const id = window.setInterval(measure, 300)
    return () => { window.removeEventListener('resize', measure); window.clearInterval(id) }
  }, [scrolled])

  return (
    <>
      {/* Announcement */}
      <div ref={announceRef} style={{ background: 'var(--bordo)', padding: '9px 20px', textAlign: 'center', fontFamily: 'var(--f-sans)', fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--fg-dim)' }}>🚚</span>
        <span style={{ color: 'var(--btn-primary-fg)' }} dangerouslySetInnerHTML={{ __html: t('announcement_shipping') }} />
        <span style={{ color: 'var(--gold-2)' }}>·</span>
        <span style={{ color: 'var(--gold-2)' }}>{t('announcement_payment')}</span>
      </div>

      {/* Header bar */}
      <header ref={headerRef} style={{ position: 'sticky', top: 0, zIndex: 50, padding: `${scrolled ? 11 : 17}px var(--pad-x)`, background: scrolled ? 'var(--glass-bg-scrolled)' : 'var(--glass-bg)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`, display: 'flex', alignItems: 'center', gap: 28, transition: 'all .3s ease' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('home')}>
          <img src={logoImg} alt="Karmic Node" style={{ width: 56, height: 56, objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--f-display)', fontSize: 20, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500 }}>
            Karmic<span style={{ color: 'var(--gold)' }}>·</span>Node
          </span>
        </div>

        {/* Desktop nav */}
        <nav className="kn-header-nav">
          <HeaderNavLink label={t('nav_home')} active={activePage === 'home'} onClick={() => navigate('home')} />
          <NavDropdown label={t('vert_vestuario')} active={activePage === 'vestuario'} subs={VESTUARIO_SUBS} navigate={navigate} page="vestuario" accent="var(--gold)" />
          <NavDropdown label={t('vert_atelier')} active={activePage === 'atelier'} subs={ATELIER_SUBS} navigate={navigate} page="atelier" accent="var(--bordo-3)" />
          <NavDropdown label={t('vert_casa')} active={activePage === 'casa'} subs={CASA_SUBS} navigate={navigate} page="casa" accent="var(--gold)" />
          {/* Personalizar destacado */}
          <a href="#" onClick={e => { e.preventDefault(); navigate('custom') }}
            style={{ fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 600, padding: '5px 14px', border: `1px solid ${activePage === 'custom' ? 'var(--gold)' : 'var(--gold-3)'}`, color: activePage === 'custom' ? 'var(--bg)' : 'var(--gold)', background: activePage === 'custom' ? 'var(--gold)' : 'transparent', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all .2s ease' }}>
            <span style={{ fontSize: 12, lineHeight: 1 }}>✦</span>
            {t('header_customize')}
          </a>
          <HeaderNavLink label={t('nav_blog')} active={activePage === 'blog'} onClick={() => navigate('blog')} />
          <HeaderNavLink label={t('nav_contact')} active={activePage === 'contact'} onClick={() => navigate('contact')} />
          <HeaderNavLink label={lang === 'en' ? 'Stylist' : 'Estilista'} active={activePage === 'stylist'} onClick={() => navigate('stylist')} />
          {auth.user && <HeaderNavLink label={lang === 'en' ? 'Vault' : 'Cofre'} active={activePage === 'vault'} onClick={() => navigate('vault')} />}
        </nav>

        {/* Right actions */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="kn-header-desktop-only kn-header-lang-toggle" style={{ display: 'flex', border: '1px solid var(--border)', overflow: 'hidden', flexShrink: 0 }}>
            {(['pt', 'en'] as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                style={{ padding: '6px 10px', background: lang === l ? 'var(--gold)' : 'transparent', border: 'none', color: lang === l ? 'var(--bg)' : 'var(--fg-mute)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}>
                {l}
              </button>
            ))}
          </div>
          {/* Theme toggle — à direita do PT/EN (desktop only) */}
          <div className="kn-header-desktop-only" style={{ display: 'flex' }}>
            <ThemeToggle />
          </div>
          <div className="kn-header-desktop-only" style={{ display: 'flex' }}>
            <IconBtn onClick={() => navigate('contact')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            </IconBtn>
          </div>
          {auth.user && (
            <div className="kn-header-desktop-only" style={{ display: 'flex' }}>
              <KarmaHeaderBadge userId={auth.user.id} onClick={() => navigate('account')} />
            </div>
          )}
          <div className="kn-header-desktop-only" style={{ display: 'flex' }}>
            <IconBtn onClick={() => navigate(auth.user ? 'account' : 'login')}>
              {auth.user ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" /></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" /></svg>
              )}
            </IconBtn>
          </div>

          <button onClick={openCart}
            className="kn-cart-btn"
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bordo-2)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bordo)')}
            style={{ padding: '9px 16px', background: 'var(--bordo)', border: 'none', color: 'var(--btn-primary-fg)', fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 7, transition: 'background .2s ease', flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L4 7v13h16V7L18 2Z" /><path d="M8 10c0 2 1.8 4 4 4s4-2 4-4" /></svg>
            <span className="kn-cart-btn-label">{t('nav_cart')}</span>
            {cartCount > 0 && (
              <span style={{ background: 'var(--gold)', color: 'var(--bg)', width: 17, height: 17, borderRadius: '50%', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{cartCount}</span>
            )}
          </button>

          {/* Mobile hamburger */}
          <button onClick={() => setNavOpen(v => !v)} className="kn-mobile-toggle"
            style={{ width: 38, height: 38, border: '1px solid var(--border)', background: 'transparent', color: 'var(--fg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <span style={{ width: 16, height: 1, background: 'currentColor', display: 'block', transition: 'transform .3s ease', transform: navOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
            <span style={{ width: 16, height: 1, background: 'currentColor', display: 'block', opacity: navOpen ? 0 : 1, transition: 'opacity .2s ease' }} />
            <span style={{ width: 16, height: 1, background: 'currentColor', display: 'block', transition: 'transform .3s ease', transform: navOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className={`kn-nav-mobile ${navOpen ? 'open' : ''}`} style={headerH ? { top: headerH } : undefined}>
        <a href="#" onClick={e => { e.preventDefault(); navigate('home'); setNavOpen(false) }}
          style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 500, color: 'var(--fg)', letterSpacing: '.04em' }}>
          {t('nav_home')}
        </a>
        <a href="#" onClick={e => { e.preventDefault(); navigate('vestuario'); setNavOpen(false) }}
          style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 500, color: 'var(--fg)', letterSpacing: '.04em' }}>
          {t('vert_vestuario')}
        </a>
        <a href="#" onClick={e => { e.preventDefault(); navigate('atelier'); setNavOpen(false) }}
          style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 500, color: 'var(--fg)', letterSpacing: '.04em' }}>
          {t('vert_atelier')}
        </a>
        <a href="#" onClick={e => { e.preventDefault(); navigate('casa'); setNavOpen(false) }}
          style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 500, color: 'var(--fg)', letterSpacing: '.04em' }}>
          {t('vert_casa')}
        </a>
        <a href="#" onClick={e => { e.preventDefault(); navigate('custom'); setNavOpen(false) }}
          style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 500, color: 'var(--gold)', letterSpacing: '.04em', fontStyle: 'italic' }}>
          ✦ {t('header_customize')}
        </a>
        <a href="#" onClick={e => { e.preventDefault(); navigate('blog'); setNavOpen(false) }}
          style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 500, color: 'var(--fg)', letterSpacing: '.04em' }}>
          {t('nav_blog')}
        </a>
        <a href="#" onClick={e => { e.preventDefault(); navigate('contact'); setNavOpen(false) }}
          style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 500, color: 'var(--fg)', letterSpacing: '.04em' }}>
          {t('nav_contact')}
        </a>
        <div style={{ marginTop: 16, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <a href="#" onClick={e => { e.preventDefault(); navigate(auth.user ? 'account' : 'login'); setNavOpen(false) }} style={{ fontSize: 14, color: 'var(--fg-mute)', letterSpacing: '.14em', textTransform: 'uppercase' }}>{auth.user ? t('nav_account') : t('login_eyebrow')}</a>
          <a href="#" onClick={e => { e.preventDefault(); navigate('about'); setNavOpen(false) }} style={{ fontSize: 14, color: 'var(--fg-mute)', letterSpacing: '.14em', textTransform: 'uppercase' }}>{t('nav_about')}</a>
          <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', border: '1px solid var(--border)', overflow: 'hidden' }}>
              {(['pt', 'en'] as Lang[]).map(l => (
                <button key={l} onClick={() => setLang(l)}
                  style={{ padding: '6px 12px', background: lang === l ? 'var(--gold)' : 'transparent', border: 'none', color: lang === l ? 'var(--bg)' : 'var(--fg-mute)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}>
                  {l}
                </button>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>
    </>
  )
}

// ─── KarmaHeaderBadge — pill com nível/pontos de karma no header ──────────
function KarmaHeaderBadge({ userId, onClick }: { userId: string; onClick: () => void }) {
  const { lang } = useLang()
  const [karma, setKarma] = useState<KarmaProfileLite | null>(null)
  const [hov, setHov] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchKarmaSummary(userId).then(k => { if (!cancelled) setKarma(k) })
    return () => { cancelled = true }
  }, [userId])

  if (!karma) return null
  const meta = KARMA_LEVEL_META[karma.current_level] || { icon: '🌱', labelPt: '', labelEn: '' }

  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      title={lang === 'en' ? meta.labelEn : meta.labelPt}
      style={{ display: 'flex', alignItems: 'center', gap: 6, height: 38, padding: '0 12px', border: `1px solid ${hov ? 'var(--gold)' : 'var(--border)'}`, background: 'transparent', color: hov ? 'var(--gold)' : 'var(--fg-mute)', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s ease' }}>
      <span style={{ fontSize: 13 }}>{meta.icon}</span>
      <span>{karma.total_points}</span>
    </button>
  )
}

// ─── PushNotificationToggle ──────────────────────────────────────────────
// Botão na aba Perfil da conta para ativar notificações push. Fica inerte
// (mostra aviso, não rebenta) se o navegador não suportar push ou se
// VITE_VAPID_PUBLIC_KEY não estiver configurada.
function PushNotificationToggle({ userId }: { userId: string }) {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const [supported, setSupported] = useState<boolean | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  useEffect(() => { isPushSupported().then(setSupported) }, [])

  if (supported === null) return null

  const activate = async () => {
    setStatus('loading')
    const res = await subscribeToPush(userId)
    if (res.ok) { setStatus('done') } else { setStatus('error'); setErrMsg(res.error || '') }
  }

  return (
    <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
      <label style={{ display: 'block', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 10, fontWeight: 500 }}>
        {isEN ? 'Push Notifications' : 'Notificações Push'}
      </label>
      {!supported ? (
        <p style={{ fontSize: 12, color: 'var(--fg-mute)', lineHeight: 1.6 }}>
          {isEN ? 'Not available on this device/browser yet.' : 'Ainda não disponível neste dispositivo/navegador.'}
        </p>
      ) : status === 'done' ? (
        <p style={{ fontSize: 13, color: 'var(--gold)' }}>✓ {isEN ? 'Notifications activated.' : 'Notificações ativadas.'}</p>
      ) : (
        <>
          <GhostBtn onClick={activate}>{status === 'loading' ? (isEN ? 'Activating...' : 'A ativar...') : (isEN ? 'Enable notifications' : 'Ativar notificações')}</GhostBtn>
          {status === 'error' && <p style={{ marginTop: 10, fontSize: 12, color: 'var(--bordo)' }}>⚠ {errMsg}</p>}
        </>
      )}
    </div>
  )
}

function IconBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  const [hov, setHov] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 38, height: 38, border: `1px solid ${hov ? 'var(--gold)' : 'var(--border)'}`, background: 'transparent', color: hov ? 'var(--gold)' : 'var(--fg-mute)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease' }}>
      {children}
    </button>
  )
}

// ─── PWA Install Prompt ──────────────────────────────────────────────────
// Escuta `beforeinstallprompt` (Chrome/Edge/Android) e mostra um banner
// discreto de instalação. Não faz nada em navegadores sem suporte
// (Safari/iOS) — a instalação aí é feita manualmente via "Adicionar ao
// ecrã principal", que já funciona com o manifest.webmanifest presente.
function PwaInstallPrompt() {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const [deferredEvent, setDeferredEvent] = useState<any>(null)
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('kn-pwa-dismissed') === '1' } catch { return false }
  })

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredEvent(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredEvent || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try { localStorage.setItem('kn-pwa-dismissed', '1') } catch {}
  }

  const install = async () => {
    try {
      deferredEvent.prompt()
      await deferredEvent.userChoice
    } catch {}
    setDeferredEvent(null)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: 20, right: 20, maxWidth: 380, zIndex: 200,
      background: 'var(--bg-1)', border: '1px solid var(--gold-3)', boxShadow: '0 12px 40px rgba(0,0,0,.35)',
      padding: 16, display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <img src={logoImg} alt="Karmic Node" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{isEN ? 'Install the app' : 'Instalar a app'}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-mute)', lineHeight: 1.4 }}>{isEN ? 'Faster access, works offline.' : 'Acesso mais rápido, funciona offline.'}</div>
      </div>
      <button onClick={install} style={{ padding: '8px 14px', background: 'var(--gold)', color: 'var(--bg)', border: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
        {isEN ? 'Install' : 'Instalar'}
      </button>
      <button onClick={dismiss} aria-label="Fechar" style={{ background: 'transparent', border: 'none', color: 'var(--fg-mute)', cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0 }}>×</button>
    </div>
  )
}

// ─── HomePage ─────────────────────────────────────────────────────────────────

function HomeCatCard({ cat, onClick }: { cat: { name: string; count: number; icon: ReactNode }; onClick: () => void }) {
  const { t } = useLang()
  const [hov, setHov] = useState(false)
  return (
    <a href="#" onClick={e => { e.preventDefault(); onClick() }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '28px 16px', border: `1px solid ${hov ? 'var(--gold-3)' : 'var(--border)'}`, background: hov ? 'var(--bg-1)' : 'transparent', textAlign: 'center', transition: 'all .3s ease', transform: hov ? 'translateY(-2px)' : 'none' }}>
      <div style={{ color: hov ? 'var(--gold)' : 'var(--fg-mute)', transition: 'color .3s ease' }}>{cat.icon}</div>
      <div>
        <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 500 }}>{cat.name}</div>
        <div style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--fg-mute)', marginTop: 3 }}>{cat.count} {t('home_articles')}</div>
      </div>
    </a>
  )
}

function HomeTesti({ t }: { t: { q: string; name: string; role: string; rating: number } }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '36px 30px', border: `1px solid ${hov ? 'var(--gold-3)' : 'var(--border)'}`, background: 'var(--bg)', display: 'flex', flexDirection: 'column', transition: 'border-color .3s, transform .3s', transform: hov ? 'translateY(-4px)' : 'none' }}>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 60, lineHeight: 1, color: 'var(--gold)', opacity: .3, marginBottom: -12 }}>"</div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontStyle: 'italic', lineHeight: 1.55, flex: 1 }}>{t.q}</div>
      <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
          <div style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg-mute)', marginTop: 2 }}>{t.role}</div>
        </div>
        <div style={{ marginLeft: 'auto' }}><Stars rating={t.rating} /></div>
      </div>
    </div>
  )
}

function HomePage({ onAdd, onOpen, wishlist, toggleWish, setPage, products }: {
  onAdd: (p: Product) => void; onOpen: (p: Product) => void
  wishlist: Set<number>; toggleWish: (id: number) => void
  setPage: (p: Page) => void; products: Product[]
}) {
  const { t } = useLang()
  const CATS = [
    { name: 'Tops', count: 38, icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" /></svg> },
    { name: 'Calças', count: 24, icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M6 2h12l2 6-4 14H8L4 8z" /><path d="M8 8h8M12 8v12" /></svg> },
    { name: 'Vestidos', count: 19, icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M12 2c0 0-3 4-6 5l2 15h8l2-15c-3-1-6-5-6-5z" /></svg> },
    { name: 'Casacos', count: 16, icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 6l3-3 6 3 6-3 3 3v14H3z" /><path d="M12 6v15" /></svg> },
    { name: 'Calçado', count: 22, icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 18h18v2H3zM3 14c0-4 3-8 6-9l4 5 5-1 3 4H3z" /></svg> },
    { name: 'Acessórios', count: 41, icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M20 12V6H4v6a8 8 0 0 0 16 0z" /><path d="M12 6V2M8 6V3M16 6V3" /></svg> },
  ]

  const TESTIMONIALS = [
    { q: t('testi1_q'), name: t('testi1_name'), role: t('testi1_role'), rating: 5 },
    { q: t('testi2_q'), name: t('testi2_name'), role: t('testi2_role'), rating: 5 },
    { q: t('testi3_q'), name: t('testi3_name'), role: t('testi3_role'), rating: 5 },
  ]

  return (
    <>
      {/* HERO */}
      <section style={{ minHeight: '86vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', background: 'var(--bg-1)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(900px 600px at 72% 50%, rgba(139,30,45,0.24), transparent 65%), radial-gradient(500px 400px at 8% 80%, rgba(176,141,87,0.08), transparent 60%)', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(43,41,38,.35) 1px,transparent 1px),linear-gradient(90deg,rgba(43,41,38,.35) 1px,transparent 1px)', backgroundSize: '80px 80px', maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%,#000 40%,transparent 100%)', zIndex: 0 }} />

        <div className="wrap" style={{ position: 'relative', zIndex: 2, width: '100%', padding: '80px var(--pad-x)' }}>
          <div className="kn-hero-grid">
            <div className="reveal">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 30, padding: '6px 16px', border: '1px solid var(--gold-3)', color: 'var(--gold)', fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 10px var(--gold)', animation: 'pulse 2s ease-in-out infinite' }} />
                {t('home_hero_badge')}
              </div>

              <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(48px,6.5vw,100px)', fontWeight: 500, lineHeight: 1.05, margin: 0 }}>
                {t('home_hero_title1')}<br />
                {t('home_hero_title2_pre')} <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{t('home_hero_title1_em')}</em>.<br />
                <span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(245,242,237,.3)' }}>{t('home_hero_title3_1')}</span><br />
                <em style={{ color: 'var(--bordo-3)', fontStyle: 'italic' }}>{t('home_hero_title3_em')}</em>.
              </h1>

              <p style={{ fontFamily: 'var(--f-sans)', fontSize: 'clamp(15px,1.2vw,19px)', color: 'var(--fg-dim)', maxWidth: '44ch', marginTop: 26, lineHeight: 1.65 }}>
                {t('home_hero_desc')}
              </p>

              <div style={{ display: 'flex', gap: 14, marginTop: 42, flexWrap: 'wrap' }}>
                <PrimaryBtn onClick={() => setPage('shop')}>{t('home_hero_cta1')}</PrimaryBtn>
                <GhostBtn onClick={() => setPage('shop')}>{t('home_hero_cta2')}</GhostBtn>
              </div>

              <div style={{ display: 'flex', gap: 40, marginTop: 52, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
                {[['500+', t('home_hero_stat1_label')], ['48h', t('home_hero_stat2_label')], ['100%', t('home_hero_stat3_label')]].map(([n, l]) => (
                  <div key={l}>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 500, color: 'var(--gold)', lineHeight: 1 }}>{n}</div>
                    <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--fg-mute)', marginTop: 6 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="kn-hero-right" style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              <div style={{ position: 'relative', maxWidth: 480, width: '100%' }}>
                <div style={{ position: 'absolute', top: -1, left: -1, width: 20, height: 20, borderTop: '1px solid var(--gold)', borderLeft: '1px solid var(--gold)', zIndex: 3 }} />
                <div style={{ position: 'absolute', top: -1, right: -1, width: 20, height: 20, borderTop: '1px solid var(--gold)', borderRight: '1px solid var(--gold)', zIndex: 3 }} />
                <div style={{ position: 'absolute', bottom: -1, left: -1, width: 20, height: 20, borderBottom: '1px solid var(--gold)', borderLeft: '1px solid var(--gold)', zIndex: 3 }} />
                <div style={{ position: 'absolute', bottom: -1, right: -1, width: 20, height: 20, borderBottom: '1px solid var(--gold)', borderRight: '1px solid var(--gold)', zIndex: 3 }} />
                <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=960&q=85" alt="Moda premium" style={{ width: '100%', display: 'block', filter: 'brightness(.82) saturate(.9)', border: '1px solid var(--border)' }} />
                <div style={{ position: 'absolute', bottom: 22, left: 22, right: 22, background: 'var(--overlay-heavy)', backdropFilter: 'blur(12px)', border: '1px solid var(--border)', padding: '15px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 4 }}>{t('home_hero_feat_label')}</div>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 500 }}>{products[0]?.name || 'T-Shirt Essencial Algodão'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <Stars rating={4.9} />
                      <span style={{ fontSize: 10, color: 'var(--fg-mute)' }}>({products[0]?.reviews || 214} {t('home_hero_feat_reviews')})</span>
                    </div>
                  </div>
                  <button onClick={() => products[0] && onAdd(products[0])}
                    style={{ padding: '9px 14px', background: 'var(--bordo)', border: 'none', color: 'var(--btn-primary-fg)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 500, flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {fmt(49)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section style={{ padding: 'clamp(52px,6vw,80px) 0', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap">
          <SectionHead eyebrow={t('home_cats_eyebrow')} title={t('home_cats_title').replace('<em>', "<em class='gold-text'>")}
            lead={t('home_cats_lead')}
            cta={<GhostBtn onClick={() => setPage('shop')}>{t('home_cats_cta')}</GhostBtn>} />
          <div className="kn-cat-grid">
            {CATS.map(cat => (
              <HomeCatCard key={cat.name} cat={cat} onClick={() => setPage('shop')} />
            ))}
          </div>
        </div>
      </section>

      {/* BESTSELLERS CAROUSEL */}
      <ProductCarousel eyebrow={t('home_bestsellers_eyebrow')} title={t('home_bestsellers_title').replace('<em>', "<em class='gold-text'>")} products={products} onAdd={onAdd} onOpen={onOpen} wishlist={wishlist} toggleWish={toggleWish} />

      {/* PROMO BANNER */}
      <section style={{ position: 'relative', overflow: 'hidden', background: `radial-gradient(900px 500px at 25% 50%, rgba(139,30,45,0.45), transparent 65%), var(--bg-2)`, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: 'clamp(56px,7vw,96px) 0' }}>
        <div className="wrap">
          <div className="kn-promo-grid">
            <div>
              <div style={{ display: 'inline-block', padding: '4px 14px', background: 'var(--bordo)', color: 'var(--btn-primary-fg)', fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 22 }}>{t('home_promo_eyebrow')}</div>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(34px,4vw,64px)', fontWeight: 500, margin: '0 0 22px', lineHeight: 1.05 }}
                dangerouslySetInnerHTML={{ __html: t('home_promo_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
              <p style={{ color: 'var(--fg-dim)', fontSize: 16, maxWidth: '40ch', lineHeight: 1.65, marginBottom: 34 }}>
                {t('home_promo_desc')}
              </p>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button onClick={() => setPage('shop')} style={{ padding: '13px 28px', background: 'var(--gold)', border: 'none', color: 'var(--bg)', fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 700 }}>{t('home_promo_cta1')}</button>
                <GhostBtn onClick={() => setPage('contact')}>{t('home_promo_cta2')}</GhostBtn>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Countdown />
            </div>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section style={{ padding: 'clamp(64px,8vw,110px) 0', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap">
          <SectionHead eyebrow={t('home_new_eyebrow')} title={t('home_new_title').replace('<em>', "<em class='gold-text'>")}
            lead={t('home_new_lead')}
            cta={<GhostBtn onClick={() => setPage('shop')}>{t('home_new_cta')}</GhostBtn>} />
          <div className="kn-products-4">
            {ALL_PRODUCTS.slice(0, 4).map(p => <ProductCard key={p.id} p={p} onAdd={onAdd} onOpen={onOpen} wishlist={wishlist} toggleWish={toggleWish} />)}
          </div>
        </div>
      </section>

      {/* ACCESSORIES CAROUSEL */}
      <ProductCarousel eyebrow={t('home_acc_eyebrow')} title={t('home_acc_title').replace('<em>', "<em class='gold-text'>")} products={[...products].reverse()} onAdd={onAdd} onOpen={onOpen} wishlist={wishlist} toggleWish={toggleWish} />

      {/* BRAND TICKER */}
      <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)', overflow: 'hidden', padding: '16px 0' }}>
        <div className="ticker-track">
          {[...Array(2)].flatMap((_, ri) =>
            ['Zara', 'H&M', 'Mango', 'Pull&Bear', 'Massimo Dutti', "Levi's", 'Nike', 'Adidas', 'Stradivarius', 'Reserved', 'COS', 'Arket', 'Weekday', 'Monki', 'Bershka'].map(brand => (
              <div key={`${brand}-${ri}`} style={{ display: 'flex', alignItems: 'center', gap: 24, paddingRight: 40 }}>
                <span style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontStyle: 'italic', color: 'var(--fg-mute)', whiteSpace: 'nowrap', letterSpacing: '.08em' }}>{brand}</span>
                <span style={{ width: 4, height: 4, background: 'var(--gold)', borderRadius: '50%', flexShrink: 0 }} />
              </div>
            ))
          )}
        </div>
      </div>

      {/* TRUST BADGES */}
      <section style={{ padding: 'clamp(48px,5vw,70px) 0', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap">
          <div className="kn-trust-grid" style={{ border: '1px solid var(--border)' }}>
            {[
              { icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>, title: t('trust_shipping_title'), desc: t('trust_shipping_desc') },
              { icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>, title: t('trust_returns_title'), desc: t('trust_returns_desc') },
              { icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>, title: t('trust_payment_title'), desc: t('trust_payment_desc') },
              { icon: <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M21 15a2 2 0 0 1-2 2H7l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, title: t('trust_support_title'), desc: t('trust_support_desc') },
            ].map((b, i) => (
              <div key={b.title} style={{ padding: '32px 24px', borderRight: i < 3 ? '1px solid var(--border)' : 'none', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ color: 'var(--gold)', flexShrink: 0, marginTop: 2 }}>{b.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', marginBottom: 5 }}>{b.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-mute)', lineHeight: 1.5 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: 'clamp(64px,8vw,110px) 0', background: 'var(--bg-1)', borderBottom: '1px solid var(--border)' }}>
        <div className="wrap">
          <SectionHead eyebrow="Avaliações" title="O que dizem os nossos <em class='gold-text'>clientes</em>." lead="Mais de 500 clientes satisfeitos em Portugal. Leia as suas experiências." />
          <div className="kn-tst-grid">
            {TESTIMONIALS.map(t => (
              <HomeTesti key={t.name} t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section style={{ padding: 'clamp(64px,7vw,100px) 0', background: `radial-gradient(700px 400px at 50% 0%, rgba(139,30,45,0.28), transparent 70%), var(--bg)`, borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
        <div className="wrap" style={{ maxWidth: 580 }}>
          <Eyebrow text={t('newsletter_eyebrow')} />
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(30px,3.5vw,50px)', fontWeight: 500, margin: '20px 0 14px', lineHeight: 1.1 }}
            dangerouslySetInnerHTML={{ __html: t('newsletter_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
          <p style={{ color: 'var(--fg-mute)', fontSize: 15, marginBottom: 34 }}>
            {t('newsletter_desc')}
          </p>
          <NewsletterForm />
          <p style={{ fontSize: 11, color: 'var(--fg-mute)', marginTop: 14, letterSpacing: '.06em' }}>{t('newsletter_fine')}</p>
        </div>
      </section>
    </>
  )
}

// ─── ShopPage ─────────────────────────────────────────────────────────────────

function ShopPage({ onAdd, onOpen, wishlist, toggleWish, initialCategory, products, vertical }: {
  onAdd: (p: Product) => void; onOpen: (p: Product) => void
  wishlist: Set<number>; toggleWish: (id: number) => void
  initialCategory?: string; products: Product[]
  vertical?: 'vestuario' | 'atelier' | 'casa' | 'all'
}) {
  const { t } = useLang()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(
    initialCategory && initialCategory !== 'promo' ? initialCategory : 'Todos'
  )
  const [showPromoOnly, setShowPromoOnly] = useState(initialCategory === 'promo')
  const [sort, setSort] = useState('relevance')
  const [maxPrice, setMaxPrice] = useState(2200)

  // Se vertical estiver definido, filtrar produtos por vertical primeiro
  const verticalProducts = vertical && vertical !== 'all'
    ? products.filter(p => p.vertical === vertical)
    : products

  // Sub-categorias disponíveis nesta vertical
  const availableSubs = vertical === 'vestuario' ? VESTUARIO_SUBS
    : vertical === 'atelier' ? ATELIER_SUBS
    : vertical === 'casa' ? CASA_SUBS
    : []

  const filtered = verticalProducts
    .filter(p => {
      if (activeCategory !== 'Todos') {
        // activeCategory pode ser uma subcategory (dos dropdowns) ou category (do sidebar antigo)
        if (p.subcategory !== activeCategory && p.category !== activeCategory) return false
      }
      if (showPromoOnly && !p.originalPrice) return false
      if (p.price > maxPrice) return false
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.category.toLowerCase().includes(search.toLowerCase()) && !(p.subcategory || '').toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'rating') return b.rating - a.rating
      return 0
    })

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Page hero */}
      <div style={{ background: (vertical === 'atelier' || vertical === 'casa') ? `radial-gradient(700px 400px at 80% 20%, rgba(139,30,45,.18), transparent 60%), var(--bg-1)` : `radial-gradient(700px 400px at 80% 20%, rgba(176,141,87,.14), transparent 60%), var(--bg-1)`, borderBottom: '1px solid var(--border)', padding: '52px var(--pad-x) 36px' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--fg-mute)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            Karmic Node
            <span style={{ color: 'var(--border-2)' }}>·</span>
            <span style={{ color: vertical === 'atelier' ? 'var(--bordo-3)' : 'var(--gold)' }}>
              {vertical === 'vestuario' ? t('vert_vestuario') : vertical === 'atelier' ? t('vert_atelier') : vertical === 'casa' ? t('vert_casa') : t('nav_shop')}
            </span>
          </div>
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(40px,5vw,72px)', fontWeight: 500, margin: '0 0 20px', lineHeight: 1.05 }}
            dangerouslySetInnerHTML={{ __html: (vertical === 'vestuario' ? t('vert_vestuario_title') : vertical === 'atelier' ? t('vert_atelier_title') : vertical === 'casa' ? t('vert_casa_title') : t('shop_all_title'))
              .replace('<em>', `<em style="color:${vertical === 'atelier' ? 'var(--bordo-3)' : 'var(--gold)'};font-style:italic">`) }} />
          {vertical && vertical !== 'all' && (
            <p style={{ color: 'var(--fg-dim)', fontSize: 16, maxWidth: '48ch', lineHeight: 1.6, marginBottom: 24 }}>
              {vertical === 'vestuario' ? t('vert_vestuario_lead') : vertical === 'atelier' ? t('vert_atelier_lead') : t('vert_casa_lead')}
            </p>
          )}

          {/* Search bar */}
          <div style={{ position: 'relative', maxWidth: 480 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--fg-mute)" strokeWidth="2" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('shop_search')}
              style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '13px 14px 13px 40px', fontFamily: 'var(--f-sans)', fontSize: 14, outline: 'none', transition: 'border-color .2s' }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--gold-3)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')} />
          </div>
        </div>
      </div>

      <div className="wrap" style={{ padding: '40px var(--pad-x) 80px' }}>
        <div className="kn-shop-layout">
          {/* Sidebar filters */}
          <aside className="kn-shop-sidebar" style={{ position: 'sticky', top: 100 }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 28 }}>
              <div style={{ fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: vertical === 'atelier' ? 'var(--bordo-3)' : 'var(--gold)', fontWeight: 500, marginBottom: 16 }}>
                {vertical && vertical !== 'all' ? t('shop_subcategories') : t('shop_categories')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Botão "Todos" */}
                <button onClick={() => { setActiveCategory('Todos'); setShowPromoOnly(false) }}
                  style={{ background: 'none', border: 'none', textAlign: 'left', color: activeCategory === 'Todos' && !showPromoOnly ? (vertical === 'atelier' ? 'var(--bordo-3)' : 'var(--gold)') : 'var(--fg-dim)', fontSize: 14, padding: '5px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: activeCategory === 'Todos' && !showPromoOnly ? 500 : 300, transition: 'color .2s ease' }}>
                  {activeCategory === 'Todos' && !showPromoOnly && <span style={{ width: 16, height: 1, background: vertical === 'atelier' ? 'var(--bordo-3)' : 'var(--gold)', flexShrink: 0 }} />}
                  {t('shop_all')}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-mute)' }}>({verticalProducts.length})</span>
                </button>
                {/* Lista dinâmica de sub-categorias */}
                {(availableSubs.length > 0 ? availableSubs : Array.from(new Set(verticalProducts.map(p => p.category)))).map(cat => {
                  const count = availableSubs.length > 0
                    ? verticalProducts.filter(p => p.subcategory === cat).length
                    : verticalProducts.filter(p => p.category === cat).length
                  const isActive = activeCategory === cat && !showPromoOnly
                  const accentCol = vertical === 'atelier' ? 'var(--bordo-3)' : 'var(--gold)'
                  return (
                    <button key={cat} onClick={() => { setActiveCategory(cat); setShowPromoOnly(false) }}
                      style={{ background: 'none', border: 'none', textAlign: 'left', color: isActive ? accentCol : 'var(--fg-dim)', fontSize: 14, padding: '5px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: isActive ? 500 : 300, transition: 'color .2s ease' }}>
                      {isActive && <span style={{ width: 16, height: 1, background: accentCol, flexShrink: 0 }} />}
                      {cat}
                      <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-mute)' }}>({count})</span>
                    </button>
                  )
                })}
                {/* Botão só personalizáveis */}
                {verticalProducts.some(p => p.customizable) && (
                  <button onClick={() => { setActiveCategory('Todos'); setShowPromoOnly(false); /* toggle-simulado via search */ setSearch(search === '__custom' ? '' : '__custom') }}
                    style={{ marginTop: 8, background: 'none', border: '1px dashed var(--gold-3)', textAlign: 'left', color: 'var(--gold)', fontSize: 12, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all .2s' }}>
                    <span style={{ fontSize: 13 }}>✦</span>
                    {t('shop_only_customizable')}
                    <span style={{ marginLeft: 'auto', fontSize: 10 }}>({verticalProducts.filter(p => p.customizable).length})</span>
                  </button>
                )}
              </div>
            </div>

            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 24, marginBottom: 28 }}>
              <div style={{ fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, marginBottom: 16 }}>{t('shop_price_max')}</div>
              <input type="range" min={50} max={2200} value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--fg-mute)', marginTop: 8 }}>
                <span>50€</span><span style={{ color: 'var(--gold)', fontWeight: 500 }}>{fmt(maxPrice)}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, marginBottom: 16 }}>{t('shop_sort_by')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['relevance', t('shop_sort_relevance')], ['price-asc', t('shop_sort_price_asc')], ['price-desc', t('shop_sort_price_desc')], ['rating', t('shop_sort_rating')]].map(([v, l]) => (
                  <button key={v} onClick={() => setSort(v)} style={{ background: 'none', border: 'none', textAlign: 'left', color: sort === v ? 'var(--gold)' : 'var(--fg-dim)', fontSize: 14, padding: '4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: sort === v ? 500 : 300, transition: 'color .2s' }}>
                    {sort === v && <span style={{ width: 16, height: 1, background: 'var(--gold)', flexShrink: 0 }} />}
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main grid */}
          <div>
            {/* Mobile filter chips — só mostra se houver várias sub-categorias */}
            {availableSubs.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
                <button onClick={() => { setActiveCategory('Todos'); setShowPromoOnly(false) }} className={`kn-filter-chip${activeCategory === 'Todos' && !showPromoOnly ? ' active' : ''}`}>{t('shop_all')}</button>
                {availableSubs.map(cat => (
                  <button key={cat} onClick={() => { setActiveCategory(cat); setShowPromoOnly(false) }} className={`kn-filter-chip${activeCategory === cat && !showPromoOnly ? ' active' : ''}`}>{cat}</button>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <span style={{ fontSize: 13, color: 'var(--fg-mute)' }}>{filtered.length} {filtered.length === 1 ? t('shop_products_found') : t('shop_products_found_pl')}</span>
            </div>

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--fg-mute)' }}>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, marginBottom: 12 }}>{t('shop_no_results')}</div>
                <div style={{ fontSize: 14 }}>{t('shop_no_results_sub')}</div>
              </div>
            ) : (
              <div className="kn-products-3">
                {filtered.map(p => <ProductCard key={p.id} p={p} onAdd={onAdd} onOpen={onOpen} wishlist={wishlist} toggleWish={toggleWish} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── ReviewsSection — avaliações reais (Supabase) ──────────────────────────
// Lê avaliações aprovadas de `reviews` (filtro product_sku + status='approved')
// e permite submeter uma nova (fica 'pending' até moderação no Admin Panel).
// O karma da review (25pt) é atribuído automaticamente por trigger SQL
// (award_karma_for_review) quando a linha tem user_id — não precisa de
// chamada extra aqui.
interface ReviewRow {
  id: string; rating: number; title: string | null; body: string | null
  user_name: string | null; verified_purchase: boolean; created_at: string
}

function ReviewsSection({ product, auth }: { product: Product; auth: ReturnType<typeof useAuth> }) {
  const { t, lang } = useLang()
  const isEN = lang === 'en'
  const [reviews, setReviews] = useState<ReviewRow[] | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')

  const sku = product.sku || String(product.id)

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setReviews([]); return }
    supabase.from('reviews').select('id, rating, title, body, user_name, verified_purchase, created_at')
      .eq('product_sku', sku).eq('status', 'approved').order('created_at', { ascending: false })
      .then(({ data }) => setReviews((data as any) || []), () => setReviews([]))
  }, [sku])

  useEffect(() => { load() }, [load])

  const avg = reviews && reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : product.rating
  const total = reviews && reviews.length ? reviews.length : product.reviews
  const dist = [5, 4, 3, 2, 1].map(s => {
    if (!reviews || !reviews.length) return { s, pct: s === 5 ? 72 : s === 4 ? 20 : s === 3 ? 6 : s === 2 ? 1 : 1 }
    const count = reviews.filter(r => r.rating === s).length
    return { s, pct: Math.round((count / reviews.length) * 100) }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!body.trim()) { setFormError(isEN ? 'Please write a comment.' : 'Escreve um comentário.'); return }
    if (!auth.user && !guestEmail.trim()) { setFormError(isEN ? 'Email required.' : 'Email obrigatório.'); return }
    setSubmitting(true)
    try {
      const { error } = await supabase.from('reviews').insert({
        product_sku: sku,
        user_id: auth.user?.id || null,
        user_name: auth.user ? (auth.profile?.full_name || auth.user.email?.split('@')[0] || null) : (guestName || null),
        user_email: auth.user?.email || guestEmail || null,
        rating, title: title || null, body,
        status: 'pending',
      })
      if (error) throw error
      setSubmitted(true)
      setShowForm(false)
      setTitle(''); setBody(''); setGuestName(''); setGuestEmail(''); setRating(5)
    } catch {
      setFormError(isEN ? 'Something went wrong. Please try again.' : 'Algo correu mal. Tenta novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28, padding: '28px', background: 'var(--bg-1)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 56, fontWeight: 500, lineHeight: 1, color: 'var(--fg)' }}>{avg.toFixed(1)}</div>
          <Stars rating={avg} size={14} />
          <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 6 }}>{total} {t('product_reviews')}</div>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          {dist.map(({ s, pct }) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--fg-mute)', width: 12 }}>{s}</span>
              <div style={{ flex: 1, height: 6, background: 'var(--bg-3)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--gold)' }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--fg-mute)', width: 28 }}>{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {!showForm && !submitted && (
        <button onClick={() => setShowForm(true)} style={{ marginBottom: 28, padding: '11px 22px', background: 'transparent', color: 'var(--gold)', border: '1px solid var(--gold-3)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {isEN ? '✎ Write a review' : '✎ Escrever avaliação'}
        </button>
      )}

      {submitted && (
        <div style={{ marginBottom: 28, padding: '16px 20px', border: '1px solid var(--gold-3)', background: 'rgba(176,141,87,.08)', color: 'var(--gold)', fontSize: 13 }}>
          ✦ {isEN ? 'Thank you! Your review will appear after moderation.' : 'Obrigado! A tua avaliação aparece depois de moderada.'}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 36, padding: 24, background: 'var(--bg-1)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--fg-mute)', marginBottom: 8, fontWeight: 600 }}>{isEN ? 'Your rating' : 'A tua classificação'}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} type="button" onClick={() => setRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, fontSize: 22, color: n <= rating ? 'var(--gold)' : 'var(--border-2)' }}>★</button>
              ))}
            </div>
          </div>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder={isEN ? 'Title (optional)' : 'Título (opcional)'}
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '11px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
          <textarea required value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder={isEN ? 'Share your experience with this product...' : 'Partilha a tua experiência com este produto...'}
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '11px 14px', fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          {!auth.user && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder={isEN ? 'Your name' : 'O teu nome'}
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '11px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
              <input required type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder={isEN ? 'Your email' : 'O teu email'}
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '11px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            </div>
          )}
          {formError && <p style={{ margin: 0, fontSize: 12, color: 'var(--bordo)' }}>⚠ {formError}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" disabled={submitting} style={{ padding: '11px 22px', background: 'var(--bordo)', color: '#fff', border: 'none', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
              {submitting ? (isEN ? 'Sending...' : 'A enviar...') : (isEN ? 'Submit review' : 'Enviar avaliação')}
            </button>
            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '11px 22px', background: 'transparent', color: 'var(--fg-mute)', border: '1px solid var(--border)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              {isEN ? 'Cancel' : 'Cancelar'}
            </button>
          </div>
        </form>
      )}

      {reviews === null ? (
        <p style={{ color: 'var(--fg-mute)', fontSize: 13 }}>{isEN ? 'Loading reviews...' : 'A carregar avaliações...'}</p>
      ) : reviews.length === 0 ? (
        <p style={{ color: 'var(--fg-mute)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
          {isEN ? 'No reviews yet. Be the first to share your experience.' : 'Ainda sem avaliações. Sê o primeiro a partilhar a tua experiência.'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {reviews.map(r => (
            <div key={r.id} style={{ paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <Stars rating={r.rating} size={12} />
                {r.verified_purchase && (
                  <span style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>✓ {isEN ? 'Verified purchase' : 'Compra verificada'}</span>
                )}
                <span style={{ fontSize: 12, color: 'var(--fg-mute)', marginLeft: 'auto' }}>{new Date(r.created_at).toLocaleDateString(isEN ? 'en-GB' : 'pt-PT')}</span>
              </div>
              {r.title && <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{r.title}</div>}
              {r.body && <p style={{ fontSize: 13, color: 'var(--fg-dim)', lineHeight: 1.6, margin: '0 0 6px' }}>{r.body}</p>}
              <div style={{ fontSize: 12, color: 'var(--fg-mute)' }}>{r.user_name || (isEN ? 'Anonymous' : 'Anónimo')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ProductPage ──────────────────────────────────────────────────────────────

function ProductPage({ product, onAdd, onBack, wishlist, toggleWish, allProducts, onOpen, auth }: {
  product: Product; onAdd: (p: Product) => void; onBack: () => void
  wishlist: Set<number>; toggleWish: (id: number) => void
  allProducts: Product[]; onOpen: (p: Product) => void
  auth: ReturnType<typeof useAuth>
}) {
  const { t } = useLang()
  const pi = useProductI18n()
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<'desc' | 'specs' | 'reviews'>('desc')
  const [added, setAdded] = useState(false)
  const related = allProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4)
  const disc = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : 0

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '14px var(--pad-x)' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-mute)', letterSpacing: '.12em' }}>
          <span style={{ cursor: 'pointer', color: 'var(--fg-mute)', transition: 'color .2s' }} onClick={onBack}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-mute)')}>{t('product_back')}</span>
          <span style={{ color: 'var(--border-2)' }}>/</span>
          <span style={{ color: 'var(--gold)' }}>{pi.pCat(product)}</span>
          <span style={{ color: 'var(--border-2)' }}>/</span>
          <span style={{ color: 'var(--fg-dim)' }}>{pi.pName(product)}</span>
        </div>
      </div>

      <div className="wrap" style={{ padding: '48px var(--pad-x) 80px' }}>
        <div className="kn-product-detail">
          {/* Gallery — 360°/3D Viewer */}
          <div>
            <div style={{ position: 'relative' }}>
              <Product3DViewer
                model3dUrl={product.model3dUrl}
                model3dIosUrl={product.model3dIosUrl}
                iconPath={PROD_ICONS[product.sku || '' || 'KN-001'] || PROD_ICONS['KN-001']}
                color={product.vertical === 'atelier' ? '#8B1E2D' : '#B08D57'}
                accent={product.vertical === 'atelier' ? '#8B1E2D' : '#B08D57'}
                size="large"
                showPresets={true}
                showHint={true}
                productLabel={pi.pName(product)}
              />
              {product.badge && (
                <div style={{ position: 'absolute', top: 16, left: 16, padding: '5px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', zIndex: 6 }} className={product.badgeColor === 'bordo' ? 'kn-badge-bordo' : 'kn-badge-gold'}>
                  {pi.pBadge(product)}
                </div>
              )}
            </div>
            {/* Eyebrow "Ver em 360°" */}
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>
              <span style={{ width: 24, height: 1, background: 'var(--gold)' }} />
              {t('viewer_360_title')}
            </div>
          </div>

          {/* Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, marginBottom: 10 }}>{pi.pCat(product)}</div>
              <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 500, margin: '0 0 16px', lineHeight: 1.1 }}>{pi.pName(product)}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <Stars rating={product.rating} size={13} />
                <span style={{ fontSize: 13, color: 'var(--fg-mute)' }}>{product.rating} ({product.reviews} {t('product_reviews')})</span>
                <span style={{ fontSize: 12, color: product.stock > 5 ? '#4caf50' : 'var(--bordo-3)', marginLeft: 8, fontWeight: 500 }}>
                  {product.stock > 5 ? `✓ ${t('product_in_stock')} (${product.stock})` : product.stock > 0 ? `⚠ ${t('product_last_units').replace('{n}', String(product.stock))}` : `✗ ${t('product_out_of_stock')}`}
                </span>
              </div>
              <div style={{ marginBottom: 16 }}>
                <SustainabilityBadges product={product} size="large" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(32px,3.5vw,48px)', fontWeight: 600 }}>{fmt(product.price)}</span>
                {product.originalPrice && <span style={{ fontSize: 16, color: 'var(--fg-mute)', textDecoration: 'line-through' }}>{fmt(product.originalPrice)}</span>}
                {disc > 0 && <span style={{ padding: '3px 10px', background: 'var(--gold)', color: 'var(--bg)', fontSize: 12, fontWeight: 700 }}>−{disc}%</span>}
              </div>
              {product.originalPrice && (
                <div style={{ fontSize: 13, color: 'var(--fg-mute)' }}>{t('product_save')} <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{fmt(product.originalPrice - product.price)}</span></div>
              )}
            </div>

            <div style={{ height: 1, background: 'var(--border)' }} />

            {/* Qty + add */}
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="kn-qty">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}>+</button>
              </div>
              <button onClick={() => { onAdd({ ...product, qty } as unknown as Product); setAdded(true); setTimeout(() => setAdded(false), 2000) }}
                style={{ flex: 1, padding: '14px 20px', background: added ? '#2e7d32' : 'var(--bordo)', border: 'none', color: 'var(--btn-primary-fg)', fontFamily: 'var(--f-sans)', fontSize: 12, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .3s ease' }}>
                {added
                  ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg> {t('product_added')}</>
                  : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L4 7v13h16V7L18 2Z" /><path d="M8 10c0 2 1.8 4 4 4s4-2 4-4" /></svg> {t('product_add_cart')}</>
                }
              </button>
              <button onClick={() => toggleWish(product.id)}
                style={{ width: 50, height: 50, border: `1px solid ${wishlist.has(product.id) ? 'var(--bordo)' : 'var(--border)'}`, background: wishlist.has(product.id) ? 'rgba(139,30,45,.15)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s ease' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" stroke={wishlist.has(product.id) ? 'var(--bordo)' : 'var(--fg-mute)'} strokeWidth="2" fill={wishlist.has(product.id) ? 'var(--bordo)' : 'none'}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {/* Trust mini */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['🚚', t('product_trust1')], ['↩', t('product_trust2')], ['🔒', t('product_trust3')], ['📏', t('product_trust4')]].map(([icon, label]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--bg-1)' }}>
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ fontSize: 12, color: 'var(--fg-dim)' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs: description / specs / reviews */}
        <div style={{ marginTop: 60, borderTop: '1px solid var(--border)' }}>
          <div className="kn-tabs">
            {(['desc', 'specs', 'reviews'] as const).map(tabKey => (
              <button key={tabKey} onClick={() => setTab(tabKey)} className={`kn-tab${tab === tabKey ? ' active' : ''}`}>
                {tabKey === 'desc' ? t('product_tab_desc') : tabKey === 'specs' ? t('product_tab_specs') : t('product_tab_reviews')}
              </button>
            ))}
          </div>

          <div style={{ padding: '36px 0' }}>
            {tab === 'desc' && (
              <div style={{ maxWidth: 760 }}>
                <p style={{ fontSize: 16, color: 'var(--fg-dim)', lineHeight: 1.75 }}>{pi.pDesc(product)}</p>
              </div>
            )}
            {tab === 'specs' && (
              <div style={{ maxWidth: 640 }}>
                {pi.pSpecs(product).map((s, i) => (
                  <div key={s.label} style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 20, padding: '14px 0', borderBottom: i < pi.pSpecs(product).length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontSize: 14, color: 'var(--fg-dim)' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
            {tab === 'reviews' && <ReviewsSection product={product} auth={auth} />}
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ marginTop: 60, paddingTop: 48, borderTop: '1px solid var(--border)' }}>
            <SectionHead eyebrow={t('product_related')} title={t('product_related_title').replace('{cat}', pi.pCat(product)).replace('<em>', "<em class='gold-text'>")} />
            <div className="kn-products-4">
              {related.map(p => <ProductCard key={p.id} p={p} onAdd={onAdd} onOpen={onOpen} wishlist={wishlist} toggleWish={toggleWish} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ContactPage ──────────────────────────────────────────────────────────────

const FORMSPREE_URL = 'https://formspree.io/f/xeeyzlvb'

async function submitToFormspree(data: Record<string, string>) {
  const fd = new FormData()
  Object.entries(data).forEach(([k, v]) => fd.append(k, v))
  const r = await fetch(FORMSPREE_URL, { method: 'POST', headers: { Accept: 'application/json' }, body: fd })
  if (!r.ok) throw new Error('Formspree error')
}

function ContactPage() {
  const { t, arr } = useLang()
  const [form, setForm] = useState({ nome: '', email: '', area: arr('contact_form_areas')[0] || 'Roupa & Moda', msg: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')

  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{ background: 'radial-gradient(700px 400px at 85% 20%, rgba(139,30,45,.18), transparent 60%), var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '80px var(--pad-x) 60px' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
          <Eyebrow text={t('contact_eyebrow')} />
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(44px,6vw,88px)', fontWeight: 500, margin: '20px 0 24px', lineHeight: 1.05 }}
            dangerouslySetInnerHTML={{ __html: t('contact_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
          <p style={{ color: 'var(--fg-dim)', fontSize: 17, maxWidth: '56ch', lineHeight: 1.65 }}>
            {t('contact_desc')}
          </p>
        </div>
      </div>

      <div className="wrap" style={{ padding: '60px var(--pad-x) 80px' }}>
        <div className="kn-contact-grid">
          {/* Info */}
          <div>
            {[
              { label: t('contact_label_email'), value: 'karmicnode@gmail.com', href: 'mailto:karmicnode@gmail.com' },
              { label: t('contact_label_location'), value: 'Cartaxo · Portugal', href: null },
              { label: t('contact_label_hours'), value: t('contact_hours_val'), href: null },
              { label: t('contact_label_support'), value: t('contact_support_val'), href: null },
            ].map(row => (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 20, padding: '20px 0', borderBottom: '1px solid var(--border)', alignItems: 'center' }}>
                <span style={{ fontSize: 10, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500 }}>{row.label}</span>
                {row.href ? (
                  <a href={row.href} style={{ fontFamily: 'var(--f-display)', fontSize: 18, color: 'var(--fg)', transition: 'color .2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg)')}>{row.value}</a>
                ) : (
                  <span style={{ fontFamily: 'var(--f-display)', fontSize: 18 }}>{row.value}</span>
                )}
              </div>
            ))}

            <div style={{ marginTop: 32 }}>
              <div style={{ fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 16, fontWeight: 500 }}>{t('contact_social')}</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {['instagram', 'facebook', 'linkedin'].map(s => (
                  <a key={s} href="#" style={{ width: 40, height: 40, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-mute)', transition: 'all .2s ease' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--fg-mute)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      {s === 'instagram' && <><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></>}
                      {s === 'facebook' && <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />}
                      {s === 'linkedin' && <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></>}
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', padding: '40px 36px' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" style={{ margin: '0 auto 20px' }}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 28, marginBottom: 12 }}>{t('contact_sent_title')}</h3>
                <p style={{ color: 'var(--fg-mute)', fontSize: 15 }}>{t('contact_sent_sub')}</p>
              </div>
            ) : (
              <>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 26, margin: '0 0 6px' }}
                  dangerouslySetInnerHTML={{ __html: t('contact_form_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
                <p style={{ color: 'var(--fg-mute)', fontSize: 14, marginBottom: 28 }}>{t('contact_form_sub')}</p>

                {[
                  { id: 'nome', label: t('contact_form_name'), type: 'text', ph: t('contact_form_name_ph') },
                  { id: 'email', label: t('contact_label_email'), type: 'email', ph: t('contact_form_email_ph') },
                ].map(f => (
                  <div key={f.id} style={{ marginBottom: 20 }}>
                    <label style={{ display: 'block', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, fontWeight: 500 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.ph} value={form[f.id as 'nome' | 'email']} onChange={e => setForm(prev => ({ ...prev, [f.id]: e.target.value }))}
                      style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', padding: '10px 0', color: 'var(--fg)', fontSize: 15, outline: 'none', transition: 'border-color .2s' }}
                      onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--gold)')}
                      onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--border)')} />
                  </div>
                ))}

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, fontWeight: 500 }}>{t('contact_form_area')}</label>
                  <select value={form.area} onChange={e => setForm(prev => ({ ...prev, area: e.target.value }))}
                    style={{ width: '100%', background: 'var(--bg-1)', border: 'none', borderBottom: '1px solid var(--border)', padding: '10px 0', color: 'var(--fg)', fontSize: 15, outline: 'none', appearance: 'none' }}>
                    {arr('contact_form_areas').map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <label style={{ display: 'block', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, fontWeight: 500 }}>{t('contact_form_msg')}</label>
                  <textarea value={form.msg} onChange={e => setForm(prev => ({ ...prev, msg: e.target.value }))} placeholder={t('contact_form_msg_ph')} rows={4}
                    style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', padding: '10px 0', color: 'var(--fg)', fontSize: 15, outline: 'none', resize: 'vertical', transition: 'border-color .2s' }}
                    onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--gold)')}
                    onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--border)')} />
                </div>

                {fieldError && <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--bordo)', lineHeight: 1.5 }}>⚠ {fieldError}</p>}
                <PrimaryBtn full onClick={async () => {
                  if (!form.nome) { setFieldError('Por favor preencha o seu nome.'); return }
                  if (!form.email) { setFieldError('Por favor preencha o seu email.'); return }
                  if (!form.msg) { setFieldError('Por favor escreva uma mensagem.'); return }
                  setFieldError(''); setLoading(true); setError('')
                  try {
                    await submitToFormspree({ nome: form.nome, email: form.email, area: form.area, mensagem: form.msg })
                    setSent(true)
                  } catch { setError('Erro ao enviar. Tente novamente ou contacte karmicnode@gmail.com') }
                  setLoading(false)
                }}>{loading ? t('contact_form_sending') : t('contact_form_btn')}</PrimaryBtn>
                {error && <p style={{ marginTop: 12, fontSize: 13, color: 'var(--bordo)', lineHeight: 1.5 }}>⚠ {error}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AboutPage ────────────────────────────────────────────────────────────────

function AboutPage({ setPage }: { setPage: (p: Page) => void }) {
  const { t } = useLang()
  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{ background: 'radial-gradient(700px 400px at 85% 20%, rgba(139,30,45,.18), transparent 60%), var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '80px var(--pad-x) 60px' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
          <Eyebrow text={t('about_eyebrow')} />
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(44px,6vw,88px)', fontWeight: 500, margin: '20px 0 24px', lineHeight: 1.05 }}
            dangerouslySetInnerHTML={{ __html: t('about_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
          <p style={{ color: 'var(--fg-dim)', fontSize: 17, maxWidth: '60ch', lineHeight: 1.7 }}>
            {t('about_desc')}
          </p>
        </div>
      </div>

      <div className="wrap" style={{ padding: '60px var(--pad-x) 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginBottom: 60 }}>
          {[[t('about_mission_k'), t('about_mission_title'), t('about_mission_desc')],
            [t('about_vision_k'), t('about_vision_title'), t('about_vision_desc')],
            [t('about_values_k'), t('about_values_title'), t('about_values_desc')],
          ].map(([k, h, p]) => (
            <div key={h} style={{ padding: '36px 28px', border: '1px solid var(--border)', background: 'linear-gradient(180deg,var(--bg-1) 0%,var(--bg) 100%)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -1, left: 24, right: 24, height: 1, background: 'var(--gold)' }} />
              <div style={{ fontFamily: 'var(--f-display)', fontStyle: 'italic', fontSize: 40, color: 'var(--gold)', marginBottom: 16, lineHeight: 1 }}>{k}</div>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 24, fontWeight: 500, marginBottom: 14 }}>{h}</h3>
              <p style={{ color: 'var(--fg-dim)', fontSize: 15, lineHeight: 1.7 }}>{p}</p>
            </div>
          ))}
        </div>

        <div style={{ background: `radial-gradient(700px 400px at 50% 0%, rgba(139,30,45,.3), transparent 70%), var(--bg-1)`, border: '1px solid var(--border)', padding: 'clamp(48px,6vw,80px)', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
          <Eyebrow text={t('about_cta_eyebrow')} />
          <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(28px,3vw,44px)', fontWeight: 500, margin: '20px 0 16px' }}
            dangerouslySetInnerHTML={{ __html: t('about_cta_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
          <p style={{ color: 'var(--fg-dim)', fontSize: 16, maxWidth: '44ch', margin: '0 auto 34px' }}>
            {t('about_cta_desc')}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <PrimaryBtn onClick={() => setPage('shop')}>{t('about_cta_shop')}</PrimaryBtn>
            <GhostBtn onClick={() => setPage('contact')}>{t('about_cta_contact')}</GhostBtn>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── BlogPage ─────────────────────────────────────────────────────────────────

// Mantém a lista PT como source of truth para filtragem
const BLOG_CATS = ['Todos', 'Estilo', 'Tendências', 'Cuidados', 'Sustentabilidade', 'Acessórios']
const BLOG_CATS_EN = ['All', 'Style', 'Trends', 'Care', 'Sustainability', 'Accessories']
function blogCatLabel(pt: string, lang: string): string {
  const i = BLOG_CATS.indexOf(pt)
  if (i < 0) return pt
  return lang === 'en' ? BLOG_CATS_EN[i] : pt
}

function BlogCard({ post, onClick }: { post: BlogPost; onClick: () => void }) {
  const { t, lang } = useLang()
  const [hov, setHov] = useState(false)
  const title = (lang === 'en' && post.titleEn) ? post.titleEn : post.title
  const excerpt = (lang === 'en' && post.excerptEn) ? post.excerptEn : post.excerpt
  const category = (lang === 'en' && post.categoryEn) ? post.categoryEn : post.category
  return (
    <article onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'var(--bg-1)', border: `1px solid ${hov ? 'var(--gold-3)' : 'var(--border)'}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'border-color .3s, transform .3s, box-shadow .3s', transform: hov ? 'translateY(-4px)' : 'none', boxShadow: hov ? '0 16px 48px rgba(0,0,0,.4)' : 'none' }}>
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--bg-2)' }}>
        <img src={post.image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s ease', transform: hov ? 'scale(1.06)' : 'scale(1)' }} />
        <div style={{ position: 'absolute', top: 14, left: 14, padding: '4px 10px', background: 'var(--bordo)', fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--btn-primary-fg)' }}>{category}</div>
      </div>
      <div style={{ padding: '22px 24px 26px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: 'var(--fg-mute)', letterSpacing: '.08em' }}>
          <span>{post.date}</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--border-2)', flexShrink: 0 }} />
          <span>{post.readTime} {t('blog_read_time')}</span>
        </div>
        <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 500, lineHeight: 1.25, margin: 0, color: hov ? 'var(--gold-2)' : 'var(--fg)', transition: 'color .2s' }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--fg-dim)', lineHeight: 1.65, margin: 0, flex: 1 }}>{excerpt}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--gold)', letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 500, marginTop: 6 }}>
          {t('blog_read')}
          <svg width="10" height="8" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h12M9 1l4 4-4 4" /></svg>
        </div>
      </div>
    </article>
  )
}

function BlogArticle({ post, onBack }: { post: BlogPost; onBack: () => void }) {
  const { t, lang } = useLang()
  const title = (lang === 'en' && post.titleEn) ? post.titleEn : post.title
  const excerpt = (lang === 'en' && post.excerptEn) ? post.excerptEn : post.excerpt
  const category = (lang === 'en' && post.categoryEn) ? post.categoryEn : post.category
  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Hero */}
      <div style={{ position: 'relative', height: 'clamp(320px,45vh,500px)', overflow: 'hidden' }}>
        <img src={post.image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, var(--overlay-light) 0%, var(--overlay-heavy) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(24px,4vw,48px) var(--pad-x)' }}>
          <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'var(--bordo)', fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 16 }}>{category}</div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(28px,4vw,56px)', fontWeight: 500, lineHeight: 1.1, margin: '0 0 16px', maxWidth: '18ch' }}>{title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 13, color: 'rgba(245,242,237,.7)' }}>
              <span>{post.author}</span>
              <span>·</span>
              <span>{post.date}</span>
              <span>·</span>
              <span>{post.readTime} {t('blog_read_time')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '14px var(--pad-x)' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-mute)' }}>
          <span style={{ cursor: 'pointer', transition: 'color .2s' }} onClick={onBack}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-mute)')}>{t('blog_back')}</span>
          <span style={{ color: 'var(--border-2)' }}>/</span>
          <span style={{ color: 'var(--gold)' }}>{category}</span>
          <span style={{ color: 'var(--border-2)' }}>/</span>
          <span style={{ color: 'var(--fg-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        </div>
      </div>

      {/* Body */}
      <div className="wrap" style={{ padding: '60px var(--pad-x) 100px' }}>
        <div style={{ maxWidth: '72ch', margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(18px,1.6vw,22px)', fontStyle: 'italic', color: 'var(--fg-dim)', lineHeight: 1.65, marginBottom: 40, paddingBottom: 40, borderBottom: '1px solid var(--border)' }}>
            {excerpt}
          </p>
          {post.body.map((para, i) => (
            <p key={i} style={{ fontSize: 16, lineHeight: 1.85, color: 'var(--fg-dim)', marginBottom: 24, fontWeight: 300 }}>{para}</p>
          ))}

          <div style={{ marginTop: 56, paddingTop: 40, borderTop: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--fg-mute)' }}>{t('blog_category')}</span>
            <span style={{ padding: '5px 14px', border: '1px solid var(--gold-3)', color: 'var(--gold)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase' }}>{post.category}</span>
          </div>

          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, background: 'var(--bordo)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              <img src={logoImg} alt="Karmic Node" style={{ width: 44, height: 44, objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 500 }}>{post.author}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginTop: 2 }}>Equipa Karmic Node · {t('blog_author_role')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BlogPage() {
  const { t, lang } = useLang()
  const [activePost, setActivePost] = useState<BlogPost | null>(null)
  const [activeCat, setActiveCat] = useState('Todos')
  const [search, setSearch] = useState('')

  if (activePost) {
    return <BlogArticle post={activePost} onBack={() => { setActivePost(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
  }

  const featured = BLOG_POSTS.find(p => p.featured)
  const filtered = BLOG_POSTS.filter(p => {
    if (activeCat !== 'Todos' && p.category !== activeCat) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.excerpt.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  const rest = filtered.filter(p => !p.featured || activeCat !== 'Todos' || search)

  return (
    <div style={{ minHeight: '80vh' }}>
      {/* Hero */}
      <div style={{ background: 'radial-gradient(900px 500px at 70% 50%, rgba(139,30,45,.22), transparent 65%), var(--bg-1)', borderBottom: '1px solid var(--border)', padding: 'clamp(64px,8vw,100px) var(--pad-x) clamp(48px,6vw,72px)' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
          <Eyebrow text={t('blog_eyebrow')} />
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(44px,6vw,88px)', fontWeight: 500, margin: '20px 0 20px', lineHeight: 1.05 }}
            dangerouslySetInnerHTML={{ __html: t('blog_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
          <p style={{ color: 'var(--fg-dim)', fontSize: 17, maxWidth: '52ch', lineHeight: 1.65, marginBottom: 36 }}>
            {t('blog_desc')}
          </p>
          {/* Search */}
          <div style={{ display: 'flex', border: '1px solid var(--border)', background: 'var(--bg-2)', maxWidth: 440 }}
            onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--gold-3)')}
            onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--fg-mute)" strokeWidth="1.8" style={{ margin: '0 12px', flexShrink: 0, alignSelf: 'center' }}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('blog_search')}
              style={{ flex: 1, background: 'transparent', border: 'none', padding: '13px 0', color: 'var(--fg)', fontFamily: 'var(--f-sans)', fontSize: 14, outline: 'none' }} />
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div style={{ background: 'var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '16px var(--pad-x)', overflowX: 'auto' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {BLOG_CATS.map(cat => (
            <button key={cat} onClick={() => setActiveCat(cat)} className={`kn-filter-chip${activeCat === cat ? ' active' : ''}`}>{blogCatLabel(cat, lang)}</button>
          ))}
        </div>
      </div>

      <div className="wrap" style={{ padding: 'clamp(48px,6vw,80px) var(--pad-x)' }}>
        {/* Featured post */}
        {featured && activeCat === 'Todos' && !search && (
          <div style={{ marginBottom: 64 }}>
            <Eyebrow text={t('blog_featured')} />
            <article onClick={() => { setActivePost(featured); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid var(--border)', background: 'var(--bg-1)', cursor: 'pointer', overflow: 'hidden', transition: 'border-color .3s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold-3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <div style={{ position: 'relative', minHeight: 340, overflow: 'hidden' }}>
                <img src={featured.image} alt={(lang === 'en' && featured.titleEn) ? featured.titleEn : featured.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .7s ease', position: 'absolute', inset: 0 }}
                  onMouseEnter={e => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLImageElement).style.transform = 'scale(1)')} />
              </div>
              <div style={{ padding: 'clamp(32px,4vw,52px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'var(--bordo)', fontSize: 9, fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', width: 'fit-content' }}>{(lang === 'en' && featured.categoryEn) ? featured.categoryEn : featured.category}</div>
                <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(22px,2.5vw,34px)', fontWeight: 500, lineHeight: 1.2, margin: 0 }}>{(lang === 'en' && featured.titleEn) ? featured.titleEn : featured.title}</h2>
                <p style={{ color: 'var(--fg-dim)', fontSize: 15, lineHeight: 1.7, margin: 0 }}>{(lang === 'en' && featured.excerptEn) ? featured.excerptEn : featured.excerpt}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--fg-mute)' }}>
                  <span>{featured.date}</span>
                  <span>·</span>
                  <span>{featured.readTime} {t('blog_read_time')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--gold)', letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 500 }}>
                  {t('blog_read')}
                  <svg width="10" height="8" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h12M9 1l4 4-4 4" /></svg>
                </div>
              </div>
            </article>
          </div>
        )}

        {/* Grid */}
        {rest.length > 0 ? (
          <>
            {(activeCat !== 'Todos' || search) ? null : <Eyebrow text={t('blog_all')} />}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginTop: activeCat === 'Todos' && !search ? 28 : 0 }}>
              {rest.map(post => (
                <BlogCard key={post.id} post={post} onClick={() => { setActivePost(post); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
              ))}
            </div>
          </>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--fg-mute)' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 24, marginBottom: 12 }}>{t('blog_none')}</div>
            <div style={{ fontSize: 14 }}>{t('blog_none_sub')}</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
// ─── CUSTOMIZER V2 ────────────────────────────────────────────────────────────
// Configurador split-screen com live preview + kit builder + sparkles

// ─── Product catalog for customizer (independent of shop) ──────────────────
type CustGroup = 'vestuario' | 'casa'

interface CustProduct {
  id: string
  group: CustGroup
  label: string
  icon: string  // SVG path/content centered at 0,0 within viewBox -100..100
  basePrice: number
  hasSize?: boolean
  hasFabric?: boolean
  hasTechnique?: boolean
  hasPosition?: boolean
  hasModel?: boolean
  hasMaterial?: boolean  // Casa: material do tecido
  hasFinish?: boolean    // Casa: mate/brilhante
}

const CUST_PRODUCTS: CustProduct[] = [
  // Vestuário
  { id: 'tshirt', group: 'vestuario', label: 'T-Shirt', basePrice: 12,
    icon: 'M-70 -35 L-95 -10 L-70 20 L-50 10 L-50 65 L50 65 L50 10 L70 20 L95 -10 L70 -35 L45 -35 C45 -12 22 0 0 0 C-22 0 -45 -12 -45 -35 Z',
    hasSize: true, hasFabric: true, hasTechnique: true, hasPosition: true },
  { id: 'hoodie', group: 'vestuario', label: 'Hoodie', basePrice: 28,
    icon: 'M-65 -30 L-95 5 L-75 35 L-55 25 L-55 75 L55 75 L55 25 L75 35 L95 5 L65 -30 C65 -60 -65 -60 -65 -30 Z M-30 -25 L-18 32 L18 32 L30 -25',
    hasSize: true, hasFabric: true, hasTechnique: true, hasPosition: true },
  { id: 'polo', group: 'vestuario', label: 'Polo', basePrice: 18,
    icon: 'M-60 -35 L-90 -8 L-70 22 L-50 12 L-50 65 L50 65 L50 12 L70 22 L90 -8 L60 -35 L22 -35 L18 -18 L-18 -18 L-22 -35 Z M-18 -18 L-12 18 L12 18 L18 -18',
    hasSize: true, hasFabric: true, hasTechnique: true, hasPosition: true },
  { id: 'sweat', group: 'vestuario', label: 'Sweatshirt', basePrice: 22,
    icon: 'M-65 -35 L-95 -5 L-75 25 L-55 15 L-55 70 L55 70 L55 15 L75 25 L95 -5 L65 -35 L45 -35 C45 -12 22 0 0 0 C-22 0 -45 -12 -45 -35 Z',
    hasSize: true, hasFabric: true, hasTechnique: true, hasPosition: true },
  { id: 'tracksuit', group: 'vestuario', label: 'Fato Treino', basePrice: 32,
    icon: 'M-50 -25 L-65 25 L-50 35 L-45 80 L-12 80 L-12 12 L12 12 L12 80 L45 80 L50 35 L65 25 L50 -25 L22 -25 L0 -8 L-22 -25 Z',
    hasSize: true, hasFabric: true, hasTechnique: true, hasPosition: true },
  { id: 'cap', group: 'vestuario', label: 'Boné', basePrice: 9,
    icon: 'M-50 20 L50 20 L50 -8 C50 -38 -50 -38 -50 -8 Z M-50 20 L65 25 L65 38 L-50 38 Z',
    hasTechnique: true, hasPosition: true },
  { id: 'tote', group: 'vestuario', label: 'Tote Bag', basePrice: 7,
    icon: 'M-50 -12 L-50 68 L50 68 L50 -12 Z M-28 -12 C-28 -42 28 -42 28 -12',
    hasTechnique: true, hasPosition: true },
  { id: 'mousepad', group: 'vestuario', label: 'Tapete Rato XL', basePrice: 8,
    icon: 'M-85 -35 L85 -35 L85 35 L-85 35 Z M-70 -20 L70 -20 M-70 0 L70 0 M-70 20 L70 20',
    hasTechnique: true },
  // Casa
  { id: 'cushion', group: 'casa', label: 'Almofada', basePrice: 20,
    icon: 'M-50 -40 L50 -40 L60 -30 L60 30 L50 40 L-50 40 L-60 30 L-60 -30 Z',
    hasTechnique: true, hasPosition: true, hasMaterial: true },
  { id: 'throw', group: 'casa', label: 'Manta', basePrice: 45,
    icon: 'M-70 -50 L70 -50 L70 50 L-70 50 Z M-70 -30 L70 -30 M-70 -10 L70 -10 M-70 10 L70 10 M-70 30 L70 30',
    hasTechnique: true, hasMaterial: true },
  { id: 'towel', group: 'casa', label: 'Toalha', basePrice: 18,
    icon: 'M-40 -60 L40 -60 L40 60 L-40 60 Z M-40 -45 L40 -45 M-40 45 L40 45',
    hasTechnique: true, hasPosition: true },
  { id: 'robe', group: 'casa', label: 'Roupão', basePrice: 55,
    icon: 'M-45 -50 L-25 -55 L25 -55 L45 -50 L50 60 L-50 60 Z M0 -50 L0 60 M-30 -20 L-30 10 M30 -20 L30 10',
    hasTechnique: true, hasPosition: true, hasSize: true },
  { id: 'apron', group: 'casa', label: 'Avental', basePrice: 22,
    icon: 'M-30 -50 L30 -50 L45 -30 L45 55 L-45 55 L-45 -30 Z M-25 -55 L25 -55 M0 -50 L0 -35',
    hasTechnique: true, hasPosition: true },
  { id: 'placemat', group: 'casa', label: 'Individual de Mesa', basePrice: 12,
    icon: 'M-70 -35 L70 -35 L70 35 L-70 35 Z M-55 -20 L55 -20 M-55 20 L55 20',
    hasTechnique: true, hasPosition: true },
]

// Cores base disponíveis
const CUST_COLORS = [
  { hex: '#F5F2ED', key: 'ivory', label: 'Marfim' },
  { hex: '#0B0B0C', key: 'black', label: 'Preto' },
  { hex: '#8B1E2D', key: 'bordo', label: 'Bordo' },
  { hex: '#B08D57', key: 'gold', label: 'Gold' },
  { hex: '#1a3a5c', key: 'navy', label: 'Navy' },
  { hex: '#2d5a27', key: 'olive', label: 'Verde-oliva' },
  { hex: '#5c3317', key: 'brown', label: 'Castanho' },
  { hex: '#808080', key: 'gray', label: 'Cinzento' },
  { hex: '#c94b2d', key: 'terracotta', label: 'Terracota' },
  { hex: '#e8c84a', key: 'yellow', label: 'Amarelo' },
]

const CUST_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const CUST_FABRICS = [
  { id: 'cotton', label: 'Algodão 100%', mult: 1, note: 'Respirável · Durável' },
  { id: 'cotton_poly', label: 'Algodão/Poliéster', mult: 0.9, note: 'Anti-rugas · Económico' },
  { id: 'organic', label: 'Algodão Orgânico', mult: 1.25, note: 'Sustentável · Certificado GOTS' },
  { id: 'premium', label: 'Premium Pima', mult: 1.55, note: 'Suave · Luxo' },
]
const CUST_TECHNIQUES = [
  { id: 'embroidery', label: 'Bordado', add: 6, note: 'Elegante · Alta durabilidade' },
  { id: 'dtg', label: 'Impressão DTG', add: 4, note: 'Cores vivas · Foto-realismo' },
  { id: 'screen', label: 'Serigrafia', add: 3, note: 'Ideal ≥ 20 unidades' },
  { id: 'vinyl', label: 'Vinil Térmico', add: 5, note: 'Acabamento premium' },
]
const CUST_POSITIONS = [
  { id: 'chest', label: 'Peito', x: 0, y: -8 },
  { id: 'back', label: 'Costas', x: 0, y: 15 },
  { id: 'sleeve', label: 'Manga', x: -60, y: 0 },
  { id: 'center', label: 'Centro', x: 0, y: 5 },
]
const IT_MATERIALS = [
  { id: 'linen', label: 'Linho Natural', mult: 1, note: 'Respirável · Textura orgânica' },
  { id: 'cotton_home', label: 'Algodão Egípcio', mult: 1.2, note: 'Suave · Durável' },
  { id: 'velvet', label: 'Veludo', mult: 1.5, note: 'Luxo · Toque aveludado' },
  { id: 'wool_home', label: 'Lã Merino', mult: 1.7, note: 'Quente · Premium' },
]
const IT_FINISHES = [
  { id: 'matte', label: 'Mate', mult: 1 },
  { id: 'glossy', label: 'Brilhante', mult: 1.05 },
]
const IT_MODELS: string[] = [] // legado: nenhum CUST_PRODUCT usa hasModel após pivot Atelier/Casa

// ─── Sparkles component ───────────────────────────────────────────────────
function Sparkles({ trigger }: { trigger: number }) {
  const [items, setItems] = useState<{ id: number; x: number; y: number; dx: number; dy: number; rot: number }[]>([])
  useEffect(() => {
    if (trigger === 0) return
    const now = Date.now()
    const arr: any[] = []
    for (let i = 0; i < 12; i++) {
      arr.push({
        id: now + i,
        x: 50 + (Math.random() - 0.5) * 20,
        y: 50 + (Math.random() - 0.5) * 20,
        dx: (Math.random() - 0.5) * 200,
        dy: (Math.random() - 0.5) * 200 - 60,
        rot: Math.random() * 720 - 360,
      })
    }
    setItems(arr)
    const t = setTimeout(() => setItems([]), 1100)
    return () => clearTimeout(t)
  }, [trigger])
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible', zIndex: 20 }}>
      {items.map(s => (
        <div key={s.id} style={{
          position: 'absolute', left: s.x + '%', top: s.y + '%',
          width: 12, height: 12,
          animation: 'kn-spark 1s cubic-bezier(.2,.7,.2,1) forwards',
          ['--dx' as any]: s.dx + 'px', ['--dy' as any]: s.dy + 'px', ['--rot' as any]: s.rot + 'deg',
        }}>
          <svg viewBox="0 0 12 12" width="12" height="12">
            <path d="M6 0 L7.5 4.5 L12 6 L7.5 7.5 L6 12 L4.5 7.5 L0 6 L4.5 4.5 Z" fill="#B08D57" />
          </svg>
        </div>
      ))}
    </div>
  )
}

// ─── Live Preview ─────────────────────────────────────────────────────────
function LivePreview({ product, baseColor, uploadUrl, textOverlay, position, group, t }: {
  product: CustProduct | null; baseColor: string; uploadUrl: string; textOverlay: string;
  position: string; group: CustGroup; t: (k: TKey) => string
}) {
  const accent = group === 'casa' ? '#8B1E2D' : '#B08D57'
  const pos = CUST_POSITIONS.find(p => p.id === position) || CUST_POSITIONS[0]

  return (
    <div style={{ position: 'sticky', top: 100 }}>
      {product ? (
        <Product360Viewer
          iconPath={product.icon}
          color={baseColor}
          accent={accent}
          overlayImage={uploadUrl || undefined}
          overlayText={textOverlay || undefined}
          overlayX={product.hasPosition ? pos.x : 0}
          overlayY={product.hasPosition ? pos.y : 0}
          size="large"
          showPresets={true}
          showHint={true}
          productLabel={t(('cust_prod_' + product.id.replace('-', '_')) as TKey)}
        />
      ) : (
        <div style={{
          minHeight: 480, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `radial-gradient(600px 400px at 50% 40%, ${accent}22, transparent 70%), var(--bg-2)`,
          border: '1px solid var(--border)', borderRadius: 4,
          textAlign: 'center', color: 'var(--fg-mute)', padding: 40,
        }}>
          <div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 22, marginBottom: 8, color: accent, opacity: .7 }}>{t('cust_preview_title')}</div>
            <div style={{ fontSize: 13 }}>{t('cust_preview_sub')}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Kit Card ─────────────────────────────────────────────────────────────
function KitCard({ n, title, subtitle, done, active, onToggle, children, accent }: {
  n: number; title: string; subtitle?: string; done: boolean; active: boolean; onToggle: () => void; children: ReactNode; accent: string
}) {
  return (
    <div style={{
      border: `1px solid ${done ? accent : 'var(--border)'}`,
      background: active ? 'rgba(176,141,87,.05)' : 'var(--bg-1)',
      transition: 'all .3s var(--ease)',
      transform: active ? 'translateX(-4px)' : 'none',
      position: 'relative',
    }}>
      <button onClick={onToggle} style={{
        width: '100%', padding: '16px 18px', background: 'transparent', border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: '50%',
          background: done ? accent : 'var(--bg-3)',
          border: done ? 'none' : `1px solid var(--border-2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: done ? '#0B0B0C' : 'var(--fg-mute)', flexShrink: 0,
        }}>
          {done ? '✓' : n}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, fontWeight: 500, color: active || done ? 'var(--fg)' : 'var(--fg-dim)' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: done ? accent : 'var(--fg-mute)', marginTop: 2, letterSpacing: '.06em' }}>{subtitle}</div>}
        </div>
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--fg-mute)', transition: 'transform .3s', transform: active ? 'rotate(180deg)' : 'none' }}>
          <path d="M1 1.5l5 5 5-5" />
        </svg>
      </button>
      {active && (
        <div style={{ padding: '0 18px 18px', animation: 'kn-fadeUp .3s var(--ease) both' }}>{children}</div>
      )}
    </div>
  )
}

// ─── Estimativa Sticky ────────────────────────────────────────────────────
function EstimativaSticky({ total, unit, qty, hint, accent, t }: { total: number; unit: number; qty: number; hint: string; accent: string; t: (k: TKey) => string }) {
  const [pulse, setPulse] = useState(0)
  useEffect(() => { setPulse(p => p + 1) }, [total])
  return (
    <div style={{
      position: 'sticky', top: 100, marginTop: 20,
      padding: '20px 22px', border: `1px solid ${accent}55`, background: 'var(--overlay-heavy)', backdropFilter: 'blur(12px)',
      borderRadius: 4,
    }}>
      <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: accent, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, boxShadow: `0 0 10px ${accent}` }} />
        {t('cust_estimate_label')}
      </div>
      {total > 0 ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-mute)' }}>{t('cust_price_unit')}</span>
            <span style={{ fontSize: 15, color: 'var(--fg)' }}>{unit.toFixed(2)} €</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--fg-mute)' }}>{t('cust_price_qty')}</span>
            <span style={{ fontSize: 15, color: 'var(--fg)' }}>× {qty}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--fg-mute)' }}>{t('cust_price_total')}</span>
            <span key={pulse} style={{
              fontFamily: 'var(--f-display)', fontSize: 32, fontWeight: 500, color: accent,
              animation: 'kn-priceFlash .35s ease-out',
            }}>{total.toFixed(2)} €</span>
          </div>
          {hint && <div style={{ marginTop: 10, padding: '6px 10px', background: `${accent}11`, border: `1px solid ${accent}44`, fontSize: 10, letterSpacing: '.06em', color: accent, textAlign: 'center' }}>✓ {hint}</div>}
        </>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--fg-mute)', textAlign: 'center', padding: '8px 0' }}>
          {t('cust_price_empty')}
        </div>
      )}
    </div>
  )
}

// ─── Customizer V2 Main ───────────────────────────────────────────────────
function CustomizerV2({ setPage, onAddToCart }: { setPage: (p: Page) => void; onAddToCart: (item: any) => void }) {
  const { t } = useLang()
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0)
  const [group, setGroup] = useState<CustGroup>('vestuario')
  const [product, setProduct] = useState<CustProduct | null>(null)
  const [color, setColor] = useState('#F5F2ED')
  const [size, setSize] = useState('M')
  const [fabric, setFabric] = useState('cotton')
  const [technique, setTechnique] = useState('dtg')
  const [material, setMaterial] = useState('silicone')
  const [finish, setFinish] = useState('matte')
  const [model, setModel] = useState('iPhone 15 Pro')
  const [position, setPosition] = useState('chest')
  const [textOverlay, setTextOverlay] = useState('')
  const [uploadUrl, setUploadUrl] = useState('')
  const [qty, setQty] = useState(1)
  const [notes, setNotes] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [activeCard, setActiveCard] = useState<string | null>('color')
  const [sparkleTick, setSparkleTick] = useState(0)
  const [sent, setSent] = useState<'quote' | 'cart' | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const accent = group === 'casa' ? '#8B1E2D' : '#B08D57'

  // Estimativa
  const estimate = (() => {
    if (!product) return { unit: 0, total: 0, hint: '' }
    let unit = product.basePrice
    if (product.hasFabric) unit *= (CUST_FABRICS.find(f => f.id === fabric)?.mult || 1)
    if (product.hasMaterial) unit *= (IT_MATERIALS.find(m => m.id === material)?.mult || 1)
    if (product.hasFinish) unit *= (IT_FINISHES.find(f => f.id === finish)?.mult || 1)
    if (product.hasTechnique) unit += (CUST_TECHNIQUES.find(t => t.id === technique)?.add || 0)
    if (uploadUrl) unit += 3
    // Desconto por quantidade
    let discountMult = 1; let hint = ''
    if (qty >= 100) { discountMult = 0.75; hint = 'Desconto 25% (100+ un.)' }
    else if (qty >= 50) { discountMult = 0.82; hint = 'Desconto 18% (50+ un.)' }
    else if (qty >= 20) { discountMult = 0.9; hint = 'Desconto 10% (20+ un.)' }
    else if (qty >= 10) { discountMult = 0.95; hint = 'Desconto 5% (10+ un.)' }
    unit = +(unit * discountMult).toFixed(2)
    return { unit, total: +(unit * qty).toFixed(2), hint }
  })()

  // Helpers de tradução para labels de dados
  const colorLabel = (hex: string): string => {
    const c = CUST_COLORS.find(cc => cc.hex === hex)
    return c ? t(('cust_color_' + c.key) as TKey) : hex
  }
  const fabricLabel = (id: string): string => {
    const f = CUST_FABRICS.find(ff => ff.id === id); if (!f) return id
    return t(('cust_fabric_' + f.id) as TKey)
  }
  const materialLabel = (id: string): string => {
    const m = IT_MATERIALS.find(mm => mm.id === id); if (!m) return id
    return t(('cust_material_' + m.id) as TKey)
  }
  const finishLabel = (id: string): string => t(('cust_finish_' + id) as TKey)
  const techniqueLabel = (id: string): string => {
    const tk = CUST_TECHNIQUES.find(tt => tt.id === id); if (!tk) return id
    return t(('cust_tech_' + tk.id) as TKey)
  }
  const positionLabel = (id: string): string => t(('cust_position_' + id) as TKey)
  const productLabel = (p: CustProduct): string => t(('cust_prod_' + p.id.replace('-', '_')) as TKey)

  // Sub-etapa 2: cartas
  const cards: { id: string; title: string; sub?: string; when: () => boolean }[] = []
  if (product) {
    cards.push({ id: 'color', title: t('cust_card_color'), sub: colorLabel(color), when: () => true })
    if (product.hasModel) cards.push({ id: 'model', title: t('cust_card_model'), sub: model, when: () => true })
    if (product.hasSize) cards.push({ id: 'size', title: t('cust_card_size'), sub: size, when: () => true })
    if (product.hasFabric) cards.push({ id: 'fabric', title: t('cust_card_fabric'), sub: fabricLabel(fabric), when: () => true })
    if (product.hasMaterial) cards.push({ id: 'material', title: t('cust_card_material'), sub: materialLabel(material), when: () => true })
    if (product.hasFinish) cards.push({ id: 'finish', title: t('cust_card_finish'), sub: finishLabel(finish), when: () => true })
    if (product.hasTechnique) cards.push({ id: 'technique', title: t('cust_card_technique'), sub: techniqueLabel(technique), when: () => true })
    cards.push({ id: 'design', title: t('cust_card_design'), sub: uploadUrl ? t('cust_image_loaded') : t('cust_none'), when: () => true })
    if (product.hasPosition) cards.push({ id: 'position', title: t('cust_card_position'), sub: positionLabel(position), when: () => true })
    cards.push({ id: 'text', title: t('cust_card_text'), sub: textOverlay || t('cust_none'), when: () => true })
    cards.push({ id: 'qty', title: t('cust_card_qty'), sub: qty + ' ' + t('cust_units'), when: () => true })
    cards.push({ id: 'notes', title: t('cust_card_notes'), sub: notes ? notes.slice(0, 30) + (notes.length > 30 ? '…' : '') : t('cust_none_f'), when: () => true })
  }

  function fireSparkle() { setSparkleTick(v => v + 1) }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const reader = new FileReader()
    reader.onload = ev => { setUploadUrl(String(ev.target?.result || '')); fireSparkle() }
    reader.readAsDataURL(f)
  }

  async function handleSubmit(mode: 'quote' | 'cart') {
    if (!name.trim() || !email.trim()) { setErr(t('cust_err_contacts')); return }
    setErr(''); setLoading(true)
    const payload = {
      formulario: 'Personalização V2',
      artigo: product ? productLabel(product) : '', vertical: group,
      cor: colorLabel(color),
      ...(product?.hasSize ? { tamanho: size } : {}),
      ...(product?.hasFabric ? { material: fabricLabel(fabric) } : {}),
      ...(product?.hasMaterial ? { material_capa: materialLabel(material) } : {}),
      ...(product?.hasModel ? { modelo: model } : {}),
      ...(product?.hasFinish ? { acabamento: finishLabel(finish) } : {}),
      ...(product?.hasTechnique ? { tecnica: techniqueLabel(technique) } : {}),
      ...(product?.hasPosition ? { posicao: positionLabel(position) } : {}),
      texto: textOverlay || '—',
      tem_upload: uploadUrl ? 'Sim' : 'Não',
      quantidade: qty + ' ' + t('cust_units'),
      estimativa_unit: estimate.unit + '€',
      estimativa_total: estimate.total + '€',
      notas: notes || '—',
      nome: name, email, telefone: phone || '—',
      metodo: mode === 'quote' ? 'Pedido de orçamento' : 'Pagamento direto (estimativa)',
    }
    try {
      if (mode === 'quote') {
        // Formspree
        const fd = new FormData()
        Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)))
        await fetch('https://formspree.io/f/xeeyzlvb', { method: 'POST', headers: { Accept: 'application/json' }, body: fd })
      } else {
        // Adicionar ao carrinho
        onAddToCart({
          id: Date.now(),
          name: `${product ? productLabel(product) : ''} ${t('cust_customized')}`,
          category: t('cust_cat_personalization'),
          price: estimate.unit,
          image: '',
          qty,
          _customization: payload,
        })
      }
      setSent(mode); fireSparkle()
    } catch { setErr(t('cust_err_network')) }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: `radial-gradient(1000px 500px at 20% -10%, ${accent}18, transparent 60%), radial-gradient(800px 400px at 80% 100%, ${accent}12, transparent 60%), var(--bg)` }}>
      {/* Grão subtle */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.14, mixBlendMode: 'overlay', pointerEvents: 'none', zIndex: 0 }}>
        <filter id="page-grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="3" /><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.3 0" /></filter>
        <rect width="100%" height="100%" filter="url(#page-grain)" />
      </svg>

      <Sparkles trigger={sparkleTick} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* HERO / progress */}
        <div style={{ padding: 'clamp(48px,6vw,80px) var(--pad-x) 32px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
            <Eyebrow text={t('cust_eyebrow')} />
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(40px,5vw,72px)', fontWeight: 500, margin: '18px 0 14px', lineHeight: 1.05 }}
              dangerouslySetInnerHTML={{ __html: t('cust_title').replace('<em>', `<em style="color:${accent};font-style:italic">`) }} />
            <p style={{ color: 'var(--fg-dim)', fontSize: 16, maxWidth: '54ch', lineHeight: 1.65, marginBottom: 32 }}>
              {t('cust_desc')}
            </p>

            {/* Progress steps */}
            <div style={{ display: 'flex', gap: 4, marginTop: 24, maxWidth: 640 }}>
              {[t('cust_step_1'), t('cust_step_2'), t('cust_step_3'), t('cust_step_4')].map((label, i) => (
                <div key={label} style={{ flex: 1, position: 'relative' }}>
                  <div style={{
                    height: 4, background: i <= step ? accent : 'var(--bg-3)',
                    transition: 'background .4s ease', borderRadius: 2,
                  }} />
                  <div style={{ marginTop: 8, fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: i === step ? accent : i < step ? 'var(--fg)' : 'var(--fg-mute)', fontWeight: i === step ? 600 : 400 }}>
                    {i < step ? '✓ ' : ''}{i + 1}. {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STEP CONTENT */}
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: 'clamp(40px,5vw,72px) var(--pad-x)' }}>
          {/* STEP 0 - Categoria */}
          {step === 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24, animation: 'kn-fadeUp .5s var(--ease) both' }}>
              {([
                { g: 'vestuario' as CustGroup, label: t('vert_vestuario'), desc: t('cust_step0_vestuario_desc'), acc: '#B08D57', icon: 'M-60 -25 L-90 0 L-70 30 L-50 20 L-50 65 L50 65 L50 20 L70 30 L90 0 L60 -25 L40 -25 C40 -5 20 5 0 5 C-20 5 -40 -5 -40 -25 Z' },
                { g: 'casa' as CustGroup, label: t('vert_casa'), desc: t('cust_step0_casa_desc'), acc: '#8B1E2D', icon: 'M-70 -40 L70 -40 L70 30 L-70 30 Z M-90 30 L90 30 L82 42 L-82 42 Z' },
              ]).map(opt => (
                <button key={opt.g} onClick={() => { setGroup(opt.g); setStep(1); fireSparkle() }} style={{
                  padding: '48px 32px', background: 'var(--overlay-medium)', border: `1px solid ${opt.acc}55`, cursor: 'pointer', textAlign: 'left',
                  transition: 'all .3s var(--ease)', position: 'relative', overflow: 'hidden', minHeight: 320,
                }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = opt.acc; el.style.transform = 'translateY(-6px)'
                    el.style.boxShadow = `0 24px 60px ${opt.acc}30`
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.borderColor = `${opt.acc}55`; el.style.transform = 'none'; el.style.boxShadow = 'none'
                  }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${opt.acc}, transparent)` }} />
                  <svg viewBox="-100 -60 200 130" width="140" height="80" style={{ display: 'block', marginBottom: 20 }}>
                    <path d={opt.icon} fill="none" stroke={opt.acc} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: opt.acc, marginBottom: 12 }}>{t('cust_step0_vert_label')}</div>
                  <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 36, fontWeight: 500, margin: '0 0 12px' }}>{opt.label}</h2>
                  <p style={{ color: 'var(--fg-dim)', fontSize: 14, lineHeight: 1.65, marginBottom: 24 }}>{opt.desc}</p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: opt.acc, fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 600 }}>
                    {t('cust_choose')}
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 5h12M9 1l4 4-4 4" /></svg>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 1 - Produto base */}
          {step === 1 && (
            <div style={{ animation: 'kn-fadeUp .5s var(--ease) both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button onClick={() => setStep(0)} style={{ background: 'transparent', border: 'none', color: 'var(--fg-mute)', fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 5H1M5 1L1 5l4 4" /></svg>
                  {t('cust_back')}
                </button>
                <span style={{ color: 'var(--border-2)' }}>·</span>
                <span style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: accent }}>
                  {group === 'vestuario' ? t('vert_vestuario') : t('vert_casa')}
                </span>
              </div>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 32, fontWeight: 500, margin: '0 0 8px' }}>{t('cust_step1_title')}</h2>
              <p style={{ color: 'var(--fg-mute)', fontSize: 14, marginBottom: 32 }}>{t('cust_step1_sub')}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
                {CUST_PRODUCTS.filter(p => p.group === group).map(p => (
                  <button key={p.id} onClick={() => { setProduct(p); setStep(2); fireSparkle() }} style={{
                    padding: '24px 16px', background: 'var(--overlay-medium)', border: `1px solid ${accent}33`, cursor: 'pointer',
                    transition: 'all .25s var(--ease)', textAlign: 'center', position: 'relative', minHeight: 200,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                  }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = accent; el.style.transform = 'translateY(-4px)'; el.style.background = 'var(--overlay-heavy)'
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.borderColor = `${accent}33`; el.style.transform = 'none'; el.style.background = 'var(--overlay-medium)'
                    }}>
                    <svg viewBox="-100 -80 200 180" width="90" height="80">
                      <path d={p.icon} fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div>
                      <div style={{ fontFamily: 'var(--f-display)', fontSize: 15, fontWeight: 500 }}>{productLabel(p)}</div>
                      <div style={{ fontSize: 11, color: accent, marginTop: 4, letterSpacing: '.08em' }}>{t('cust_from')} {p.basePrice}€</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 - Kit builder + preview */}
          {step === 2 && product && (
            <div style={{ animation: 'kn-fadeUp .5s var(--ease) both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <button onClick={() => setStep(1)} style={{ background: 'transparent', border: 'none', color: 'var(--fg-mute)', fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 5H1M5 1L1 5l4 4" /></svg>
                  {t('cust_change_product')}
                </button>
                <span style={{ color: 'var(--border-2)' }}>·</span>
                <span style={{ fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', color: accent }}>{productLabel(product)}</span>
              </div>

              <div className="kn-cust-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 32, alignItems: 'start' }}>
                {/* PREVIEW */}
                <LivePreview product={product} baseColor={color} uploadUrl={uploadUrl} textOverlay={textOverlay} position={position} group={group} t={t} />

                {/* KIT BUILDER */}
                <div>
                  <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 24, fontWeight: 500, margin: '0 0 4px' }}>{t('cust_kit_builder')}</h2>
                  <p style={{ color: 'var(--fg-mute)', fontSize: 12, marginBottom: 20, letterSpacing: '.06em' }}>{t('cust_kit_builder_sub')}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {cards.map((c, i) => (
                      <KitCard key={c.id} n={i + 1} title={c.title} subtitle={c.sub} done={!!c.sub && c.sub !== t('cust_none') && c.sub !== t('cust_none_f') && c.sub !== '—'} active={activeCard === c.id} onToggle={() => setActiveCard(activeCard === c.id ? null : c.id)} accent={accent}>
                        {c.id === 'color' && (
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {CUST_COLORS.map(cc => (
                              <button key={cc.hex} onClick={() => { setColor(cc.hex); fireSparkle() }} title={colorLabel(cc.hex)} style={{
                                width: 36, height: 36, borderRadius: '50%', background: cc.hex,
                                border: color === cc.hex ? `3px solid ${accent}` : `2px solid ${cc.hex === '#F5F2ED' ? 'var(--border)' : 'transparent'}`,
                                cursor: 'pointer', transition: 'transform .15s', outline: 'none',
                                transform: color === cc.hex ? 'scale(1.15)' : 'scale(1)',
                              }} />
                            ))}
                          </div>
                        )}
                        {c.id === 'model' && (
                          <select value={model} onChange={e => setModel(e.target.value)} style={{ width: '100%', padding: '10px 12px', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', fontFamily: 'var(--f-sans)', fontSize: 14 }}>
                            {IT_MODELS.map(m => <option key={m}>{m}</option>)}
                          </select>
                        )}
                        {c.id === 'size' && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {CUST_SIZES.map(s => (
                              <button key={s} onClick={() => setSize(s)} style={{
                                minWidth: 46, height: 40, background: size === s ? accent : 'transparent',
                                border: `1px solid ${size === s ? accent : 'var(--border)'}`,
                                color: size === s ? '#0B0B0C' : 'var(--fg)', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
                              }}>{s}</button>
                            ))}
                          </div>
                        )}
                        {c.id === 'fabric' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {CUST_FABRICS.map(f => (
                              <button key={f.id} onClick={() => setFabric(f.id)} style={{
                                padding: '12px 14px', background: fabric === f.id ? `${accent}18` : 'transparent',
                                border: `1px solid ${fabric === f.id ? accent : 'var(--border)'}`,
                                textAlign: 'left', cursor: 'pointer', transition: 'all .15s',
                              }}>
                                <div style={{ fontSize: 13, color: fabric === f.id ? accent : 'var(--fg)', fontWeight: 500 }}>{fabricLabel(f.id)}</div>
                                <div style={{ fontSize: 11, color: 'var(--fg-mute)', marginTop: 2 }}>{t(('cust_fabric_' + f.id + '_note') as TKey)}</div>
                              </button>
                            ))}
                          </div>
                        )}
                        {c.id === 'material' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {IT_MATERIALS.map(m => (
                              <button key={m.id} onClick={() => setMaterial(m.id)} style={{
                                padding: '12px 14px', background: material === m.id ? `${accent}18` : 'transparent',
                                border: `1px solid ${material === m.id ? accent : 'var(--border)'}`,
                                textAlign: 'left', cursor: 'pointer', transition: 'all .15s',
                              }}>
                                <div style={{ fontSize: 13, color: material === m.id ? accent : 'var(--fg)', fontWeight: 500 }}>{materialLabel(m.id)}</div>
                                <div style={{ fontSize: 11, color: 'var(--fg-mute)', marginTop: 2 }}>{t(('cust_material_' + m.id + '_note') as TKey)}</div>
                              </button>
                            ))}
                          </div>
                        )}
                        {c.id === 'finish' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            {IT_FINISHES.map(f => (
                              <button key={f.id} onClick={() => setFinish(f.id)} style={{
                                flex: 1, padding: '10px', background: finish === f.id ? accent : 'transparent',
                                border: `1px solid ${finish === f.id ? accent : 'var(--border)'}`,
                                color: finish === f.id ? '#0B0B0C' : 'var(--fg)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                              }}>{finishLabel(f.id)}</button>
                            ))}
                          </div>
                        )}
                        {c.id === 'technique' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                            {CUST_TECHNIQUES.map(tk => (
                              <button key={tk.id} onClick={() => setTechnique(tk.id)} style={{
                                padding: '12px', background: technique === tk.id ? `${accent}18` : 'transparent',
                                border: `1px solid ${technique === tk.id ? accent : 'var(--border)'}`,
                                textAlign: 'left', cursor: 'pointer', transition: 'all .15s',
                              }}>
                                <div style={{ fontSize: 12, color: technique === tk.id ? accent : 'var(--fg)', fontWeight: 600 }}>{techniqueLabel(tk.id)}</div>
                                <div style={{ fontSize: 10, color: 'var(--fg-mute)', marginTop: 2 }}>+{tk.add}€</div>
                              </button>
                            ))}
                          </div>
                        )}
                        {c.id === 'design' && (
                          <div>
                            <label style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              padding: '14px', border: `1px dashed ${uploadUrl ? accent : 'var(--border-2)'}`,
                              background: uploadUrl ? `${accent}08` : 'transparent',
                              cursor: 'pointer', transition: 'all .2s',
                            }}>
                              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={uploadUrl ? accent : 'var(--fg-mute)'} strokeWidth="1.5">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                              </svg>
                              <span style={{ fontSize: 12, color: uploadUrl ? accent : 'var(--fg-mute)', letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500 }}>
                                {uploadUrl ? t('cust_image_loaded_check') : t('cust_upload_hint')}
                              </span>
                            </label>
                            {uploadUrl && (
                              <button onClick={() => setUploadUrl('')} style={{ marginTop: 8, background: 'transparent', border: 'none', color: 'var(--fg-mute)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                                {t('cust_remove')}
                              </button>
                            )}
                          </div>
                        )}
                        {c.id === 'position' && (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6 }}>
                            {CUST_POSITIONS.map(p => (
                              <button key={p.id} onClick={() => setPosition(p.id)} style={{
                                padding: '10px', background: position === p.id ? accent : 'transparent',
                                border: `1px solid ${position === p.id ? accent : 'var(--border)'}`,
                                color: position === p.id ? '#0B0B0C' : 'var(--fg)', fontSize: 12, cursor: 'pointer',
                              }}>{positionLabel(p.id)}</button>
                            ))}
                          </div>
                        )}
                        {c.id === 'text' && (
                          <input type="text" value={textOverlay} onChange={e => setTextOverlay(e.target.value)} placeholder={t('cust_text_placeholder')} maxLength={30} style={{
                            width: '100%', padding: '10px 12px', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', fontSize: 14, boxSizing: 'border-box',
                          }} />
                        )}
                        {c.id === 'qty' && (
                          <div>
                            <input type="range" min={1} max={500} value={qty} onChange={e => setQty(+e.target.value)} style={{ width: '100%', accentColor: accent }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-mute)', marginTop: 4 }}>
                              <span>1 un.</span>
                              <span style={{ color: accent, fontWeight: 600 }}>{qty} un.</span>
                              <span>500 un.</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                              {[1, 10, 25, 50, 100, 250].map(n => (
                                <button key={n} onClick={() => setQty(n)} style={{
                                  padding: '5px 12px', fontSize: 11,
                                  border: `1px solid ${qty === n ? accent : 'var(--border)'}`,
                                  background: qty === n ? `${accent}18` : 'transparent',
                                  color: qty === n ? accent : 'var(--fg-mute)', cursor: 'pointer',
                                }}>{n}</button>
                              ))}
                            </div>
                          </div>
                        )}
                        {c.id === 'notes' && (
                          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('cust_notes_placeholder')} rows={3} style={{
                            width: '100%', padding: '10px 12px', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', fontSize: 13, boxSizing: 'border-box', resize: 'vertical', fontFamily: 'var(--f-sans)',
                          }} />
                        )}
                      </KitCard>
                    ))}
                  </div>

                  {/* Estimativa sticky (inline aqui abaixo do kit) */}
                  <EstimativaSticky total={estimate.total} unit={estimate.unit} qty={qty} hint={estimate.hint} accent={accent} t={t} />

                  {/* Next */}
                  <button onClick={() => { setStep(3); fireSparkle() }} style={{
                    marginTop: 20, width: '100%', padding: '18px', background: accent, border: 'none', color: 'var(--bg)',
                    fontFamily: 'var(--f-sans)', fontSize: 12, letterSpacing: '.24em', textTransform: 'uppercase', fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'transform .2s',
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'none' }}>
                    {t('cust_continue')}
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 5h12M9 1l4 4-4 4" /></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 - Enviar */}
          {step === 3 && product && (
            <div style={{ animation: 'kn-fadeUp .5s var(--ease) both', maxWidth: 780, margin: '0 auto' }}>
              {sent ? (
                <div style={{ textAlign: 'center', padding: '60px 40px', border: `1px solid ${accent}`, background: `${accent}0f` }}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.2" style={{ margin: '0 auto 24px' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 36, margin: '0 0 12px' }}>
                    {sent === 'quote' ? t('cust_sent_quote') : t('cust_sent_cart')}
                  </h2>
                  <p style={{ color: 'var(--fg-dim)', fontSize: 15, marginBottom: 32, maxWidth: '40ch', margin: '0 auto 32px' }}>
                    {sent === 'quote' ? t('cust_sent_quote_desc') : t('cust_sent_cart_desc')}
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button onClick={() => { setStep(0); setSent(null); setProduct(null); setUploadUrl(''); setTextOverlay(''); setNotes(''); setName(''); setEmail(''); setPhone('') }} style={{
                      padding: '14px 28px', background: 'transparent', border: `1px solid ${accent}`, color: accent,
                      fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer',
                    }}>{t('cust_new_piece')}</button>
                    <button onClick={() => setPage('home')} style={{
                      padding: '14px 28px', background: accent, border: 'none', color: 'var(--bg)',
                      fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer',
                    }}>{t('cust_back_shop')}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <button onClick={() => setStep(2)} style={{ background: 'transparent', border: 'none', color: 'var(--fg-mute)', fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <svg width="12" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 5H1M5 1L1 5l4 4" /></svg>
                      {t('cust_edit_config')}
                    </button>
                  </div>

                  <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 36, fontWeight: 500, margin: '0 0 8px' }}>{t('cust_step4_title')}</h2>
                  <p style={{ color: 'var(--fg-mute)', fontSize: 14, marginBottom: 32 }}>{t('cust_step4_sub')}</p>

                  {/* Resumo */}
                  <div style={{ background: 'var(--bg-1)', border: `1px solid ${accent}44`, padding: 24, marginBottom: 24 }}>
                    <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: accent, marginBottom: 16, fontWeight: 600 }}>{t('cust_summary')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginBottom: 16 }}>
                      {[
                        [t('cust_col_article'), productLabel(product)],
                        [t('cust_col_color'), colorLabel(color)],
                        ...(product.hasModel ? [[t('cust_card_model'), model]] : []),
                        ...(product.hasSize ? [[t('cust_card_size'), size]] : []),
                        ...(product.hasFabric ? [[t('cust_card_fabric'), fabricLabel(fabric)]] : []),
                        ...(product.hasMaterial ? [[t('cust_card_material'), materialLabel(material)]] : []),
                        ...(product.hasFinish ? [[t('cust_card_finish'), finishLabel(finish)]] : []),
                        ...(product.hasTechnique ? [[t('cust_card_technique'), techniqueLabel(technique)]] : []),
                        ...(product.hasPosition ? [[t('cust_card_position'), positionLabel(position)]] : []),
                        [t('cust_col_design'), uploadUrl ? t('cust_image_loaded') : '—'],
                        [t('cust_col_text'), textOverlay || '—'],
                        [t('cust_card_qty'), qty + ' ' + t('cust_units')],
                      ].map(([k, v]) => (
                        <div key={k as string} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 11, letterSpacing: '.08em', color: 'var(--fg-mute)', textTransform: 'uppercase' }}>{k}</span>
                          <span style={{ fontSize: 13, color: 'var(--fg)', fontWeight: 500 }}>{v as string}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 12, borderTop: `1px solid ${accent}55` }}>
                      <span style={{ fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--fg-mute)' }}>{t('cust_estimate_total')}</span>
                      <span style={{ fontFamily: 'var(--f-display)', fontSize: 36, fontWeight: 500, color: accent }}>{estimate.total.toFixed(2)} €</span>
                    </div>
                    {estimate.hint && <div style={{ marginTop: 8, fontSize: 11, color: accent, textAlign: 'right' }}>✓ {estimate.hint}</div>}
                  </div>

                  {/* Contactos */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: accent, marginBottom: 14, fontWeight: 600 }}>{t('cust_contact_title')}</div>
                    <div style={{ display: 'grid', gap: 14 }}>
                      <input type="text" placeholder={t('cust_name_ph')} value={name} onChange={e => setName(e.target.value)} style={{ padding: '13px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', fontSize: 14, boxSizing: 'border-box' }} />
                      <input type="email" placeholder={t('cust_email_ph')} value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '13px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', fontSize: 14, boxSizing: 'border-box' }} />
                      <input type="tel" placeholder={t('cust_phone_ph')} value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: '13px 14px', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', fontSize: 14, boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  {err && <div style={{ marginBottom: 16, padding: 12, background: 'rgba(139,30,45,.12)', border: '1px solid rgba(139,30,45,.3)', fontSize: 13, color: '#e06070' }}>⚠ {err}</div>}

                  {/* Dupla CTA */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button onClick={() => handleSubmit('quote')} disabled={loading} style={{
                      padding: '20px', background: 'transparent', border: `1px solid ${accent}`, color: accent,
                      fontFamily: 'var(--f-sans)', fontSize: 12, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 600,
                      cursor: loading ? 'wait' : 'pointer', transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: 6,
                    }}>
                      <span style={{ fontSize: 20 }}>🧾</span>
                      {t('cust_cta_quote')}
                      <span style={{ fontSize: 10, opacity: .7, letterSpacing: '.06em', textTransform: 'none' }}>{t('cust_cta_quote_sub')}</span>
                    </button>
                    <button onClick={() => handleSubmit('cart')} disabled={loading} style={{
                      padding: '20px', background: accent, border: 'none', color: 'var(--bg)',
                      fontFamily: 'var(--f-sans)', fontSize: 12, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 700,
                      cursor: loading ? 'wait' : 'pointer', transition: 'transform .2s', display: 'flex', flexDirection: 'column', gap: 6,
                    }}
                      onMouseEnter={e => !loading && ((e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.transform = 'none')}>
                      <span style={{ fontSize: 20 }}>💳</span>
                      {t('cust_cta_pay')}
                      <span style={{ fontSize: 10, opacity: .7, letterSpacing: '.06em', textTransform: 'none', fontWeight: 500 }}>{t('cust_cta_pay_sub')}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Keyframes CSS */}
      <style>{`
        @keyframes kn-fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        @keyframes kn-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes kn-priceFlash { 0% { transform: scale(1); filter: brightness(1); } 40% { transform: scale(1.1); filter: brightness(1.4); } 100% { transform: scale(1); filter: brightness(1); } }
        @keyframes kn-spark {
          0% { transform: translate(0, 0) rotate(0deg) scale(0); opacity: 0; }
          20% { opacity: 1; transform: translate(calc(var(--dx) * .2), calc(var(--dy) * .2)) rotate(calc(var(--rot) * .2)) scale(1); }
          100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(0); opacity: 0; }
        }
        @media (max-width: 780px) {
          .kn-cust-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}


// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ setPage }: { setPage: (p: Page) => void }) {
  const { t, arr } = useLang()
  return (
    <footer style={{ background: 'var(--bg-1)', borderTop: '1px solid var(--border)', padding: 'clamp(56px,6vw,80px) var(--pad-x) 36px' }}>
      <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
        <div className="kn-footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <img src={logoImg} alt="Karmic Node" style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0 }} />
              <span style={{ fontFamily: 'var(--f-display)', fontSize: 19, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500 }}>
                Karmic<span style={{ color: 'var(--gold)' }}>·</span>Node
              </span>
            </div>
            <p style={{ color: 'var(--fg-mute)', fontSize: 14, lineHeight: 1.7, maxWidth: '30ch', marginBottom: 22 }}>
              {t('footer_desc')}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {['instagram', 'facebook', 'linkedin'].map(s => (
                <a key={s} href="#" style={{ width: 36, height: 36, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-mute)', transition: 'all .2s ease' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold)'; (e.currentTarget as HTMLElement).style.color = 'var(--gold)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--fg-mute)' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    {s === 'instagram' && <><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" /></>}
                    {s === 'facebook' && <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />}
                    {s === 'linkedin' && <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></>}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {[
            { title: t('footer_shop'), links: arr('footer_shop_links').map((l) => ({ l, p: 'shop' as Page })) },
            { title: t('footer_company'), links: arr('footer_company_links').map((l, i) => ({ l, p: (['about', 'custom', 'blog', 'about', 'parcerias', 'contact'] as Page[])[i] })) },
            { title: t('footer_support'), links: arr('footer_support_links').map((l, i) => ({ l, p: (['faq', 'envio', 'devolucoes', 'garantia', 'privacidade', 'termos'] as Page[])[i] })) },
          ].map(col => (
            <div key={col.title}>
              <h5 style={{ fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.24em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 500, margin: '0 0 18px' }}>{col.title}</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.links.map(({ l, p }) => (
                  <li key={l}>
                    <a href="#" onClick={e => { e.preventDefault(); setPage(p) }}
                      style={{ color: 'var(--fg-dim)', fontSize: 14, transition: 'color .2s ease, padding-left .2s ease', display: 'inline-block' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--gold)'; (e.currentTarget as HTMLElement).style.paddingLeft = '6px' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--fg-dim)'; (e.currentTarget as HTMLElement).style.paddingLeft = '0' }}>
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--fg-mute)', letterSpacing: '.04em' }}>
            {t('footer_copyright')}
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {['MB', 'VISA', 'MC', 'PayPal', 'MBWay'].map(m => (
              <span key={m} style={{ fontSize: 10, letterSpacing: '.14em', color: 'var(--fg-mute)', border: '1px solid var(--border)', padding: '4px 8px' }}>{m}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Misc components ──────────────────────────────────────────────────────────

function Countdown() {
  const { t } = useLang()
  const [time, setTime] = useState({ h: 11, m: 42, s: 17 })
  useEffect(() => {
    const t = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev
        s--; if (s < 0) { s = 59; m-- } if (m < 0) { m = 59; h-- } if (h < 0) { h = 23; m = 59; s = 59 }
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 18 }}>{t('countdown_label')}</div>
      <div className="kn-promo-countdown" style={{ display: 'flex', gap: 14 }}>
        {[['h', pad(time.h), t('countdown_hours')], ['m', pad(time.m), t('countdown_minutes')], ['s', pad(time.s), t('countdown_seconds')]].map(([, val, label]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(44px,5.5vw,80px)', fontWeight: 500, lineHeight: 1, background: 'var(--overlay-light)', border: '1px solid var(--border)', padding: '12px 20px', minWidth: 80 }}>{val}</div>
            <div style={{ fontSize: 9, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--fg-mute)', marginTop: 8 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NewsletterForm() {
  const { t, lang } = useLang()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    try {
      if (isSupabaseConfigured) {
        await supabase.from('newsletter_subs').upsert({ email, language: lang, is_active: true }, { onConflict: 'email' })
      }
      awardKarma('newsletter_signup')
      setDone(true)
    } catch {
      setDone(true) // não bloqueia a UX por causa de um erro de persistência
    } finally {
      setSubmitting(false)
    }
  }

  return done ? (
    <div style={{ padding: '18px 28px', border: '1px solid var(--gold-3)', display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', color: 'var(--gold)' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
      <span style={{ fontSize: 14 }}>{t('newsletter_success')}</span>
    </div>
  ) : (
    <form onSubmit={handleSubmit} style={{ display: 'flex', border: '1px solid var(--gold-3)' }}>
      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={t('newsletter_placeholder')}
        style={{ flex: 1, background: 'transparent', border: 'none', padding: '14px 18px', color: 'var(--fg)', fontFamily: 'var(--f-sans)', fontSize: 14, outline: 'none' }} />
      <button type="submit" disabled={submitting} style={{ padding: '14px 22px', background: 'var(--gold)', border: 'none', color: 'var(--bg)', fontFamily: 'var(--f-sans)', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', fontWeight: 700, flexShrink: 0, cursor: submitting ? 'wait' : 'pointer' }}>
        {t('newsletter_btn')}
      </button>
    </form>
  )
}

// ─── SuccessPage ───────────────────────────────────────────────────────────────

interface OrderSummary {
  order_id: string
  status: string
  customer_name?: string
  customer_email?: string
  items: { name: string; qty: number; amount: number }[]
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
  currency: string
  shipping_address?: {
    line1?: string; line2?: string; city?: string; postal_code?: string; country?: string
  } | null
}

function SuccessPage({ sessionId, setPage }: { sessionId: string | null; setPage: (p: Page) => void }) {
  const { t } = useLang()
  const [order, setOrder] = useState<OrderSummary | null>(null)
  const [loadState, setLoadState] = useState<'loading' | 'ok' | 'error'>(sessionId ? 'loading' : 'error')

  useEffect(() => {
    if (!sessionId) { setLoadState('error'); return }
    let cancelled = false
    fetch(`/api/order/${encodeURIComponent(sessionId)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { if (!cancelled) { setOrder(data); setLoadState('ok') } })
      .catch(() => { if (!cancelled) setLoadState('error') })
    return () => { cancelled = true }
  }, [sessionId])

  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{ background: 'radial-gradient(700px 400px at 85% 20%, rgba(176,141,87,.16), transparent 60%), var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '80px var(--pad-x) 60px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 22px', borderRadius: '50%', border: '1px solid var(--gold-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <Eyebrow text={t('success_title')} />
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(32px,4.5vw,54px)', fontWeight: 500, margin: '18px 0 14px', lineHeight: 1.1 }}>
            {t('success_title')}
          </h1>
          <p style={{ color: 'var(--fg-dim)', fontSize: 16, lineHeight: 1.7 }}>{t('success_subtitle')}</p>
          {order?.order_id && (
            <div style={{ marginTop: 22, display: 'inline-block', padding: '8px 18px', border: '1px solid var(--border)', background: 'var(--bg)', fontSize: 12, letterSpacing: '.1em' }}>
              {t('success_order_number')}: <b style={{ color: 'var(--gold)' }}>{order.order_id}</b>
            </div>
          )}
        </div>
      </div>

      <div className="wrap" style={{ padding: '56px var(--pad-x) 80px', maxWidth: 720, margin: '0 auto' }}>
        {loadState === 'loading' && (
          <div style={{ textAlign: 'center', color: 'var(--fg-mute)', padding: '40px 0' }}>{t('success_loading')}</div>
        )}

        {loadState === 'error' && (
          <div style={{ textAlign: 'center', padding: '30px 0 10px' }}>
            <p style={{ color: 'var(--fg-mute)', fontSize: 14, marginBottom: 6 }}>{t('success_error')}</p>
            <p style={{ color: 'var(--fg-mute)', fontSize: 13, opacity: .8, maxWidth: '48ch', margin: '0 auto' }}>{t('success_error_sub')}</p>
          </div>
        )}

        {loadState === 'ok' && order && (
          <div style={{ border: '1px solid var(--border)', background: 'var(--bg-1)' }}>
            <div style={{ padding: '22px 26px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--fg-mute)', marginBottom: 10 }}>{t('success_items')}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {order.items?.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span>{it.qty}× {it.name}</span>
                    <span>{fmt(it.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--fg-mute)' }}>
                <span>{t('success_subtotal')}</span><span>{fmt(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--gold)' }}>
                  <span>{t('success_discount')}</span><span>-{fmt(order.discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--fg-mute)' }}>
                <span>{t('success_shipping')}</span><span>{order.shipping === 0 ? t('cart_free') : fmt(order.shipping)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--fg-mute)' }}>
                <span>{t('success_tax')}</span><span>{fmt(order.tax)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--fg-mute)' }}>{t('success_total')}</span>
                <span style={{ fontFamily: 'var(--f-display)', fontSize: 24, fontWeight: 600 }}>{fmt(order.total)}</span>
              </div>
            </div>

            {order.shipping_address && (order.shipping_address.line1 || order.shipping_address.city) && (
              <div style={{ padding: '20px 26px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--fg-mute)', marginBottom: 8 }}>{t('success_shipping_address')}</div>
                <div style={{ fontSize: 14, color: 'var(--fg-dim)', lineHeight: 1.6 }}>
                  {order.shipping_address.line1}{order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ''}<br />
                  {order.shipping_address.postal_code} {order.shipping_address.city}<br />
                  {order.shipping_address.country}
                </div>
              </div>
            )}

            <div style={{ padding: '18px 26px', fontSize: 13, color: 'var(--fg-mute)' }}>
              ✉ {t('success_email_sent')}
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <PrimaryBtn onClick={() => setPage('shop')}>{t('success_back_shop')}</PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

// ─── LoginPage ──────────────────────────────────────────────────────────────
// Autenticação via Magic Link (Supabase) + Google OAuth.

function LoginPage({ setPage, auth }: { setPage: (p: Page) => void; auth: ReturnType<typeof useAuth> }) {
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Se já está autenticado, vai direto para a conta
  useEffect(() => {
    if (auth.user) setPage('account')
  }, [auth.user, setPage])

  const handleMagicLink = async () => {
    if (!email.trim()) { setError(t('login_error_generic')); return }
    if (!auth.isConfigured) { setError(t('login_not_configured')); return }
    setSending(true); setError('')
    const { error: err } = await auth.signInWithMagicLink(email.trim())
    setSending(false)
    if (err) setError(err)
    else setSent(true)
  }

  const handleGoogle = async () => {
    if (!auth.isConfigured) { setError(t('login_not_configured')); return }
    const { error: err } = await auth.signInWithGoogle()
    if (err) setError(err)
  }

  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{ background: 'radial-gradient(700px 400px at 85% 20%, rgba(139,30,45,.18), transparent 60%), var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '80px var(--pad-x) 60px' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto' }}>
          <Eyebrow text={t('login_eyebrow')} />
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(44px,6vw,72px)', fontWeight: 500, margin: '20px 0 24px', lineHeight: 1.05 }}
            dangerouslySetInnerHTML={{ __html: t('login_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
          <p style={{ color: 'var(--fg-dim)', fontSize: 17, maxWidth: '56ch', lineHeight: 1.65 }}>{t('login_desc')}</p>
        </div>
      </div>

      <div className="wrap" style={{ padding: '60px var(--pad-x) 100px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: 'var(--bg-1)', border: '1px solid var(--border)', padding: '40px 36px', maxWidth: 440, width: '100%' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5" style={{ margin: '0 auto 20px' }}><path d="M4 4h16v16H4z" /><path d="M22 6l-10 7L2 6" /></svg>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 26, marginBottom: 12 }}>{t('login_magic_sent_title')}</h3>
              <p style={{ color: 'var(--fg-mute)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                {t('login_magic_sent_sub').replace('{email}', email)}
              </p>
              <button onClick={() => { setSent(false); setEmail('') }}
                style={{ background: 'transparent', border: 'none', color: 'var(--gold)', fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
                {t('login_magic_sent_back')}
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, fontWeight: 500 }}>{t('login_email_label')}</label>
                <input type="email" value={email} placeholder={t('login_email_ph')}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleMagicLink() }}
                  style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', padding: '10px 0', color: 'var(--fg)', fontSize: 15, outline: 'none', transition: 'border-color .2s' }}
                  onFocus={e => (e.currentTarget.style.borderBottomColor = 'var(--gold)')}
                  onBlur={e => (e.currentTarget.style.borderBottomColor = 'var(--border)')} />
              </div>

              {error && <p style={{ marginBottom: 16, fontSize: 13, color: 'var(--bordo)', lineHeight: 1.5 }}>⚠ {error}</p>}

              <PrimaryBtn full onClick={handleMagicLink} disabled={sending}>
                {sending ? t('login_magic_sending') : t('login_magic_btn')}
              </PrimaryBtn>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg-mute)' }}>{t('login_or')}</span>
                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              </div>

              <GhostBtn onClick={handleGoogle}>{t('login_google_btn')}</GhostBtn>

              <p style={{ marginTop: 24, fontSize: 12, color: 'var(--fg-mute)', textAlign: 'center', lineHeight: 1.6 }}>{t('login_terms_note')}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── LiveStorefrontFeed — feed de atividade em tempo real ────────────────────
// Lê a view `live_activity_recent` (últimos 30 min). Insere um evento 'view'
// quando o utilizador abre um produto (chamado externamente via logViewEvent).
// Fica inerte (não mostra nada) sem Supabase configurado — nunca inventa
// atividade falsa quando a BD está vazia/desligada.
interface LiveActivityRow {
  event_type: 'view' | 'add_to_cart' | 'purchase' | 'wishlist'
  product_name: string | null
  location_city: string | null
  created_at: string
  seconds_ago: number
}

export async function logLiveActivity(eventType: LiveActivityRow['event_type'], productName?: string, sessionId?: string) {
  if (!isSupabaseConfigured) return
  try {
    await supabase.from('live_activity').insert({
      event_type: eventType,
      product_name: productName || null,
      session_id: sessionId || null,
      location_country: 'PT',
    })
  } catch { /* silencioso — nunca bloqueia a UI principal */ }
}

function LiveStorefrontFeed() {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const [rows, setRows] = useState<LiveActivityRow[] | null>(null)
  const [viewerCount, setViewerCount] = useState<number | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    const load = () => {
      supabase.from('live_activity_recent').select('*').limit(6)
        .then(({ data }) => setRows((data as any) || []), () => setRows([]))
      // Nº de "viewers" = sessões distintas com atividade nos últimos 5 min
      // (aproximação honesta — não é WebSocket em tempo real, é polling)
      supabase.from('live_activity').select('session_id', { count: 'exact', head: false })
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .then(({ data }) => {
          const distinct = new Set((data || []).map((r: any) => r.session_id).filter(Boolean))
          setViewerCount(distinct.size)
        }, () => setViewerCount(null))
    }
    load()
    const id = window.setInterval(load, 20000)
    return () => window.clearInterval(id)
  }, [])

  if (!isSupabaseConfigured || rows === null || rows.length === 0) return null

  const eventLabel = (r: LiveActivityRow) => {
    const name = r.product_name || (isEN ? 'a product' : 'um produto')
    if (r.event_type === 'purchase') return isEN ? `bought ${name}` : `comprou ${name}`
    if (r.event_type === 'add_to_cart') return isEN ? `added ${name} to cart` : `adicionou ${name} ao carrinho`
    if (r.event_type === 'wishlist') return isEN ? `favourited ${name}` : `adicionou ${name} aos favoritos`
    return isEN ? `is viewing ${name}` : `está a ver ${name}`
  }

  return (
    <div style={{ position: 'fixed', bottom: 100, left: 24, zIndex: 60, maxWidth: 300, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {viewerCount !== null && viewerCount > 0 && (
        <div style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'var(--overlay-heavy)', backdropFilter: 'blur(10px)', border: '1px solid var(--gold-3)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
          {viewerCount} {isEN ? 'people online' : 'pessoas online'}
        </div>
      )}
      {rows.slice(0, 3).map((r, i) => (
        <div key={i} style={{ padding: '9px 13px', background: 'var(--overlay-heavy)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--fg-dim)', animation: 'kn-fadeUp .4s var(--ease) both', animationDelay: `${i * 0.1}s` }}>
          <b style={{ color: 'var(--fg)' }}>{isEN ? 'Someone' : 'Alguém'}</b> {eventLabel(r)}
          {r.location_city && <span style={{ color: 'var(--fg-mute)' }}> · {r.location_city}</span>}
        </div>
      ))}
    </div>
  )
}

// ─── Karmic Vault ────────────────────────────────────────────────────────────
// Área secreta desbloqueada por karma. Regista visitas em `vault_visits`.
// Recompensas mostradas vêm de `karma_rewards` (já seedado em schema.sql).
// Sem karma suficiente (< 100 pts) mostra ecrã de "bloqueado" honesto — sem
// fingir conteúdo que não existe.
const VAULT_UNLOCK_POINTS = 100

interface KarmaRewardRow {
  id: string; name: string; name_en: string | null; description: string | null; description_en: string | null
  cost_points: number; icon: string | null; required_level: string | null
}

function VaultPage({ auth, setPage }: { auth: ReturnType<typeof useAuth>; setPage: (p: Page) => void }) {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const [karma, setKarma] = useState<KarmaProfileLite | null>(null)
  const [rewards, setRewards] = useState<KarmaRewardRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const loggedRef = useRef(false)

  useEffect(() => {
    if (!auth.loading && !auth.user) setPage('login')
  }, [auth.loading, auth.user, setPage])

  useEffect(() => {
    if (!auth.user) { setLoading(false); return }
    fetchKarmaSummary(auth.user.id).then(k => { setKarma(k); setLoading(false) })
  }, [auth.user])

  useEffect(() => {
    if (!isSupabaseConfigured) { setRewards([]); return }
    supabase.from('karma_rewards').select('*').eq('active', true).order('cost_points', { ascending: true })
      .then(({ data }) => setRewards((data as any) || []), () => setRewards([]))
  }, [])

  const unlocked = (karma?.total_points ?? 0) >= VAULT_UNLOCK_POINTS

  // Regista a visita (sucesso ou falha de desbloqueio) uma única vez.
  useEffect(() => {
    if (loggedRef.current || !auth.user || loading || !isSupabaseConfigured) return
    loggedRef.current = true
    supabase.from('vault_visits').insert({ user_id: auth.user.id, had_karma: karma?.total_points ?? 0, unlocked }).then(() => {}, () => {})
  }, [auth.user, loading, karma, unlocked])

  if (auth.loading || loading) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-mute)' }}>{isEN ? 'Loading...' : 'A carregar...'}</div>
  }

  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{ background: 'radial-gradient(900px 500px at 50% 0%, rgba(176,141,87,.22), transparent 65%), var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '70px var(--pad-x) 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <Eyebrow text={isEN ? 'Members Only' : 'Só para Membros'} />
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 500, margin: '18px 0 14px' }}>
            {isEN ? 'The Karmic ' : 'O Cofre '}<em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{isEN ? 'Vault' : 'Karmic'}</em>
          </h1>
          <p style={{ color: 'var(--fg-mute)', fontSize: 15, lineHeight: 1.6 }}>
            {isEN
              ? 'A private space for our most committed members. Unlocked with Karma Points.'
              : 'Um espaço privado para os membros mais empenhados. Desbloqueado com Karma Points.'}
          </p>
        </div>
      </div>

      <div className="wrap" style={{ padding: '56px var(--pad-x) 100px', maxWidth: 900, margin: '0 auto' }}>
        {!unlocked ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', border: '1px dashed var(--border-2)' }}>
            <div style={{ fontSize: 48, marginBottom: 16, filter: 'grayscale(1) opacity(0.6)' }}>🔒</div>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 24, marginBottom: 10 }}>
              {isEN ? 'Vault locked' : 'Cofre trancado'}
            </h3>
            <p style={{ color: 'var(--fg-mute)', fontSize: 14, marginBottom: 24, maxWidth: 420, marginInline: 'auto', lineHeight: 1.6 }}>
              {isEN
                ? `You need ${VAULT_UNLOCK_POINTS} Karma Points to unlock the Vault. You currently have ${karma?.total_points ?? 0}.`
                : `Precisas de ${VAULT_UNLOCK_POINTS} Karma Points para desbloquear o Cofre. Tens atualmente ${karma?.total_points ?? 0}.`}
            </p>
            <div style={{ width: '100%', maxWidth: 320, height: 6, background: 'var(--bg-2)', border: '1px solid var(--border)', margin: '0 auto 24px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--gold)', width: `${Math.min(100, ((karma?.total_points ?? 0) / VAULT_UNLOCK_POINTS) * 100)}%`, transition: 'width .4s ease' }} />
            </div>
            <PrimaryBtn onClick={() => setPage('shop')}>{isEN ? 'Earn Karma shopping' : 'Ganha Karma a comprar'}</PrimaryBtn>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>✦</div>
              <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 26 }}>{isEN ? 'Welcome to the Vault' : 'Bem-vindo ao Cofre'}</h3>
              <p style={{ color: 'var(--gold)', fontSize: 14, marginTop: 8 }}>{karma?.total_points} {isEN ? 'points' : 'pontos'}</p>
            </div>
            {rewards === null ? (
              <p style={{ textAlign: 'center', color: 'var(--fg-mute)' }}>{isEN ? 'Loading rewards...' : 'A carregar recompensas...'}</p>
            ) : rewards.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--fg-mute)' }}>{isEN ? 'No rewards available right now.' : 'Sem recompensas disponíveis agora.'}</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
                {rewards.map(r => {
                  const affordable = (karma?.total_points ?? 0) >= r.cost_points
                  return (
                    <div key={r.id} style={{ border: `1px solid ${affordable ? 'var(--gold-3)' : 'var(--border)'}`, background: 'var(--bg-1)', padding: '24px 20px', opacity: affordable ? 1 : 0.55, textAlign: 'center' }}>
                      <div style={{ fontSize: 34, marginBottom: 10 }}>{r.icon || '🎁'}</div>
                      <div style={{ fontFamily: 'var(--f-display)', fontSize: 17, fontWeight: 500, marginBottom: 6 }}>{isEN ? (r.name_en || r.name) : r.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-mute)', lineHeight: 1.5, marginBottom: 14, minHeight: 34 }}>{isEN ? (r.description_en || r.description) : r.description}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: affordable ? 'var(--gold)' : 'var(--fg-mute)' }}>{r.cost_points} {isEN ? 'pts' : 'pts'}</div>
                    </div>
                  )
                })}
              </div>
            )}
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--fg-mute)', marginTop: 32, lineHeight: 1.6 }}>
              {isEN
                ? 'Contact us at karmicnode@gmail.com to redeem a reward — manual redemption for now.'
                : 'Contacta-nos em karmicnode@gmail.com para resgatar uma recompensa — resgate manual por agora.'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Personal Stylist ────────────────────────────────────────────────────────
// Questionário curto de preferências → sugestão de outfit a partir do
// catálogo estático real (ALL_PRODUCTS), sem inventar produtos. Guarda as
// preferências em `style_preferences` (Supabase) quando configurado; fica
// inerte (não guarda nada) sem Supabase.
interface StylePrefs {
  vertical: 'vestuario' | 'atelier' | 'casa'
  palette: 'neutros' | 'terrosos' | 'vibrantes' | 'monocromatico'
  occasion: 'casual' | 'trabalho' | 'evento' | 'desporto'
  budget: number
}

function StylistPage({ products, onOpen, onAdd }: { products: Product[]; onOpen: (p: Product) => void; onAdd: (p: Product) => void }) {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const auth = useAuth()
  const [step, setStep] = useState(0)
  const [prefs, setPrefs] = useState<StylePrefs>({ vertical: 'vestuario', palette: 'neutros', occasion: 'casual', budget: 200 })
  const [result, setResult] = useState<Product[] | null>(null)

  const PALETTE_LABELS: Record<StylePrefs['palette'], { pt: string; en: string }> = {
    neutros: { pt: 'Neutros', en: 'Neutrals' },
    terrosos: { pt: 'Terrosos', en: 'Earthy' },
    vibrantes: { pt: 'Vibrantes', en: 'Vibrant' },
    monocromatico: { pt: 'Monocromático', en: 'Monochrome' },
  }
  const OCCASION_LABELS: Record<StylePrefs['occasion'], { pt: string; en: string }> = {
    casual: { pt: 'Casual', en: 'Casual' },
    trabalho: { pt: 'Trabalho', en: 'Work' },
    evento: { pt: 'Evento', en: 'Event' },
    desporto: { pt: 'Desporto', en: 'Sport' },
  }

  const generate = async () => {
    // Seleção honesta: filtra pelo vertical + orçamento, ordena por rating,
    // devolve até 4 peças reais do catálogo. Não é um "outfit gerado por IA"
    // — é um motor de recomendação simples baseado em regras, transparente
    // sobre a sua própria natureza.
    const pool = products.filter(p => p.vertical === prefs.vertical && p.price <= prefs.budget)
    const picked = [...pool].sort((a, b) => b.rating - a.rating).slice(0, 4)
    setResult(picked.length ? picked : [...products].sort((a, b) => b.rating - a.rating).slice(0, 4))
    setStep(3)

    if (auth.user && isSupabaseConfigured) {
      try {
        await supabase.from('style_preferences').upsert({
          user_id: auth.user.id,
          preferences: prefs,
          outfits_generated: 1,
        }, { onConflict: 'user_id' })
        try { await supabase.rpc('award_karma', { p_user_id: auth.user.id, p_action: 'design_saved', p_points: 15, p_metadata: { source: 'stylist' } }) } catch { /* silencioso */ }
      } catch { /* silencioso */ }
    }
  }

  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{ background: 'radial-gradient(900px 500px at 50% 0%, rgba(139,30,45,.2), transparent 65%), var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '70px var(--pad-x) 48px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <Eyebrow text={isEN ? 'AI Stylist' : 'Estilista Pessoal'} />
          <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 500, margin: '18px 0 14px' }}>
            {isEN ? 'Find ' : 'Encontra '}<em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>{isEN ? 'your style' : 'o teu estilo'}</em>
          </h1>
          <p style={{ color: 'var(--fg-mute)', fontSize: 15, lineHeight: 1.6 }}>
            {isEN
              ? 'Answer 4 quick questions and we recommend real pieces from our catalogue that match your taste.'
              : 'Responde a 4 perguntas rápidas e recomendamos peças reais do nosso catálogo ajustadas ao teu gosto.'}
          </p>
        </div>
      </div>

      <div className="wrap" style={{ padding: '56px var(--pad-x) 100px', maxWidth: 720, margin: '0 auto' }}>
        {step === 0 && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20, fontWeight: 600 }}>1. {isEN ? 'Category' : 'Categoria'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
              {(['vestuario', 'atelier', 'casa'] as const).map(v => (
                <button key={v} onClick={() => setPrefs(p => ({ ...p, vertical: v }))}
                  style={{ padding: '20px 10px', background: prefs.vertical === v ? 'var(--gold)' : 'var(--bg-1)', color: prefs.vertical === v ? 'var(--bg)' : 'var(--fg)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>
                  {v === 'vestuario' ? (isEN ? 'Fashion' : 'Vestuário') : v === 'atelier' ? 'Atelier' : (isEN ? 'Home' : 'Casa')}
                </button>
              ))}
            </div>
            <PrimaryBtn onClick={() => setStep(1)}>{isEN ? 'Next' : 'Seguinte'}</PrimaryBtn>
          </div>
        )}
        {step === 1 && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20, fontWeight: 600 }}>2. {isEN ? 'Palette' : 'Paleta'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 32 }}>
              {(Object.keys(PALETTE_LABELS) as StylePrefs['palette'][]).map(v => (
                <button key={v} onClick={() => setPrefs(p => ({ ...p, palette: v }))}
                  style={{ padding: '18px 10px', background: prefs.palette === v ? 'var(--gold)' : 'var(--bg-1)', color: prefs.palette === v ? 'var(--bg)' : 'var(--fg)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {isEN ? PALETTE_LABELS[v].en : PALETTE_LABELS[v].pt}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <GhostBtn onClick={() => setStep(0)}>{isEN ? 'Back' : 'Voltar'}</GhostBtn>
              <PrimaryBtn onClick={() => setStep(2)}>{isEN ? 'Next' : 'Seguinte'}</PrimaryBtn>
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20, fontWeight: 600 }}>3. {isEN ? 'Occasion & budget' : 'Ocasião & orçamento'}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 24 }}>
              {(Object.keys(OCCASION_LABELS) as StylePrefs['occasion'][]).map(v => (
                <button key={v} onClick={() => setPrefs(p => ({ ...p, occasion: v }))}
                  style={{ padding: '18px 10px', background: prefs.occasion === v ? 'var(--gold)' : 'var(--bg-1)', color: prefs.occasion === v ? 'var(--bg)' : 'var(--fg)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {isEN ? OCCASION_LABELS[v].en : OCCASION_LABELS[v].pt}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 32 }}>
              <label style={{ fontSize: 13, color: 'var(--fg-mute)', display: 'block', marginBottom: 10 }}>
                {isEN ? 'Max budget:' : 'Orçamento máx.:'} <b style={{ color: 'var(--gold)' }}>{fmt(prefs.budget)}</b>
              </label>
              <input type="range" min={30} max={1000} step={10} value={prefs.budget} onChange={e => setPrefs(p => ({ ...p, budget: Number(e.target.value) }))} style={{ width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <GhostBtn onClick={() => setStep(1)}>{isEN ? 'Back' : 'Voltar'}</GhostBtn>
              <PrimaryBtn onClick={generate}>{isEN ? 'Get my recommendations' : 'Ver as minhas recomendações'}</PrimaryBtn>
            </div>
          </div>
        )}
        {step === 3 && result && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 20, fontWeight: 600 }}>
              {isEN ? 'Recommended for you' : 'Recomendado para ti'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
              {result.map(p => (
                <div key={p.id} style={{ border: '1px solid var(--border)', background: 'var(--bg-1)', cursor: 'pointer' }} onClick={() => onOpen(p)}>
                  <img src={p.image} alt={p.name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} />
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 13, marginBottom: 6 }}>{p.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--f-display)', fontSize: 16, color: 'var(--gold)' }}>{fmt(p.price)}</span>
                      <button onClick={e => { e.stopPropagation(); onAdd(p) }} style={{ background: 'var(--bordo)', border: 'none', color: 'var(--btn-primary-fg)', fontSize: 10, padding: '5px 10px', textTransform: 'uppercase', letterSpacing: '.1em' }}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <GhostBtn onClick={() => { setStep(0); setResult(null) }}>{isEN ? 'Start again' : 'Recomeçar'}</GhostBtn>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── AccountPage ────────────────────────────────────────────────────────────
// Tabs: Encomendas, Wishlist, Moradas, Perfil, Karma Points

type AccountTab = 'orders' | 'wishlist' | 'addresses' | 'profile' | 'karma'

interface AccountOrder {
  id: string; order_number: string | null; status: string; total_cents: number;
  currency: string; created_at: string; items: any[]
}
interface KarmaSummary {
  total_points: number; lifetime_points: number; current_level: string;
  points_to_next_level: number; next_level: string
}

const KARMA_LEVEL_META: Record<string, { icon: string; labelPt: string; labelEn: string }> = {
  iniciante: { icon: '🌱', labelPt: 'Iniciante', labelEn: 'Novice' },
  discipulo: { icon: '⭐', labelPt: 'Discípulo', labelEn: 'Disciple' },
  mestre: { icon: '💎', labelPt: 'Mestre', labelEn: 'Master' },
  guru: { icon: '👑', labelPt: 'Guru', labelEn: 'Guru' },
  karmic: { icon: '✦', labelPt: 'Karmic', labelEn: 'Karmic' },
}

function AccountPage({ auth, setPage, allProducts, onOpen }: {
  auth: ReturnType<typeof useAuth>; setPage: (p: Page) => void
  allProducts: Product[]; onOpen: (p: Product) => void
}) {
  const { t, lang } = useLang()
  const [tab, setTab] = useState<AccountTab>('orders')
  const [orders, setOrders] = useState<AccountOrder[] | null>(null)
  const [wishlistSkus, setWishlistSkus] = useState<string[] | null>(null)
  const [addresses, setAddresses] = useState<any[] | null>(null)
  const [karma, setKarma] = useState<KarmaSummary | null>(null)
  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' })
  const [savedMsg, setSavedMsg] = useState(false)

  // Se não está autenticado, redireciona para login
  useEffect(() => {
    if (!auth.loading && !auth.user) setPage('login')
  }, [auth.loading, auth.user, setPage])

  useEffect(() => {
    if (auth.profile) {
      setProfileForm({ full_name: auth.profile.full_name || '', phone: auth.profile.phone || '' })
    }
  }, [auth.profile])

  useEffect(() => {
    if (!auth.user || !isSupabaseConfigured) return
    supabase.from('orders').select('id, order_number, status, total_cents, currency, created_at, items')
      .eq('user_id', auth.user.id).order('created_at', { ascending: false })
      .then(({ data }) => setOrders((data as any) || []), () => setOrders([]))
  }, [auth.user])

  useEffect(() => {
    if (!auth.user || !isSupabaseConfigured) return
    supabase.from('wishlist').select('product_sku').eq('user_id', auth.user.id)
      .then(({ data }) => setWishlistSkus((data || []).map((r: any) => r.product_sku)), () => setWishlistSkus([]))
  }, [auth.user])

  useEffect(() => {
    if (!auth.user || !isSupabaseConfigured) return
    supabase.from('addresses').select('*').eq('user_id', auth.user.id).order('is_default', { ascending: false })
      .then(({ data }) => setAddresses(data || []), () => setAddresses([]))
  }, [auth.user])

  useEffect(() => {
    if (!auth.user || !isSupabaseConfigured) return
    supabase.from('user_karma_summary').select('*').eq('user_id', auth.user.id).single()
      .then(({ data }) => setKarma(data as any), () => setKarma(null))
  }, [auth.user])

  if (auth.loading || !auth.user) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-mute)' }}>{t('account_loading')}</div>
  }

  const tabs: { id: AccountTab; label: string }[] = [
    { id: 'orders', label: t('account_tab_orders') },
    { id: 'wishlist', label: t('account_tab_wishlist') },
    { id: 'addresses', label: t('account_tab_addresses') },
    { id: 'karma', label: t('account_tab_karma') },
    { id: 'profile', label: t('account_tab_profile') },
  ]

  const wishedProducts = allProducts.filter(p => wishlistSkus?.includes(p.sku || String(p.id)))

  return (
    <div style={{ minHeight: '80vh' }}>
      <div style={{ background: 'radial-gradient(700px 400px at 85% 20%, rgba(139,30,45,.18), transparent 60%), var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '64px var(--pad-x) 40px' }}>
        <div style={{ maxWidth: 'var(--maxw)', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Eyebrow text={t('account_eyebrow')} />
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(36px,5vw,60px)', fontWeight: 500, margin: '16px 0 4px', lineHeight: 1.05 }}
              dangerouslySetInnerHTML={{ __html: t('account_title').replace('<em>', '<em style="color:var(--gold);font-style:italic">') }} />
            <p style={{ color: 'var(--fg-mute)', fontSize: 14 }}>{auth.user.email}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {auth.isAdmin && (
              <button onClick={() => setPage('admin')}
                style={{ background: 'transparent', border: '1px solid var(--gold-3)', color: 'var(--gold)', padding: '10px 18px', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700 }}>
                👑 Admin
              </button>
            )}
            <button onClick={async () => { await auth.signOut(); setPage('home') }}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--fg-mute)', padding: '10px 18px', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', cursor: 'pointer' }}>
              {t('account_signout')}
            </button>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ padding: '40px var(--pad-x) 100px' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid var(--border)', marginBottom: 36 }}>
          {tabs.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)}
              style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === tb.id ? 'var(--gold)' : 'transparent'}`, color: tab === tb.id ? 'var(--fg)' : 'var(--fg-mute)', padding: '12px 4px', marginRight: 24, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: tab === tb.id ? 600 : 400 }}>
              {tb.label}
            </button>
          ))}
        </div>

        {tab === 'orders' && (
          orders === null ? <p style={{ color: 'var(--fg-mute)' }}>{t('account_loading')}</p> :
          orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: 'var(--fg-mute)', marginBottom: 20 }}>{t('account_orders_empty')}</p>
              <PrimaryBtn onClick={() => setPage('shop')}>{t('account_orders_empty_cta')}</PrimaryBtn>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {orders.map(o => (
                <div key={o.id} style={{ border: '1px solid var(--border)', background: 'var(--bg-1)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>
                      {t('account_order_number')} {o.order_number || o.id.slice(0, 8).toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--fg-mute)' }}>{new Date(o.created_at).toLocaleDateString(lang === 'en' ? 'en-GB' : 'pt-PT')}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 600 }}>{fmt(o.total_cents / 100)}</div>
                  <div style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', padding: '4px 10px', border: '1px solid var(--border)', color: 'var(--fg-mute)' }}>
                    {t(`account_order_status_${o.status}` as TKey)}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'wishlist' && (
          wishlistSkus === null ? <p style={{ color: 'var(--fg-mute)' }}>{t('account_loading')}</p> :
          wishedProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: 'var(--fg-mute)', marginBottom: 20 }}>{t('account_wishlist_empty')}</p>
              <PrimaryBtn onClick={() => setPage('shop')}>{t('account_wishlist_empty_cta')}</PrimaryBtn>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {wishedProducts.map(p => (
                <div key={p.id} onClick={() => onOpen(p)} style={{ cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--bg-1)' }}>
                  <img src={p.image} alt={p.name} style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover' }} />
                  <div style={{ padding: 14 }}>
                    <div style={{ fontSize: 14, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontFamily: 'var(--f-display)', fontSize: 16, color: 'var(--gold)' }}>{fmt(p.price)}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'addresses' && (
          addresses === null ? <p style={{ color: 'var(--fg-mute)' }}>{t('account_loading')}</p> :
          addresses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ color: 'var(--fg-mute)' }}>{t('account_addresses_empty')}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {addresses.map(a => (
                <div key={a.id} style={{ border: '1px solid var(--border)', background: 'var(--bg-1)', padding: '20px 24px' }}>
                  <div style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8 }}>{a.label}{a.is_default ? ' ★' : ''}</div>
                  <div style={{ fontSize: 14, color: 'var(--fg-dim)', lineHeight: 1.6 }}>
                    {a.full_name}<br />{a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.postal_code} {a.city}<br />{a.country}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'karma' && (
          <div style={{ maxWidth: 480 }}>
            {karma ? (
              <div style={{ border: '1px solid var(--border)', background: 'var(--bg-1)', padding: '32px 28px', textAlign: 'center' }}>
                <div style={{ fontSize: 44, marginBottom: 8 }}>{KARMA_LEVEL_META[karma.current_level]?.icon || '🌱'}</div>
                <div style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 6 }}>{t('account_karma_level')}</div>
                <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 28, marginBottom: 20 }}>
                  {lang === 'en' ? KARMA_LEVEL_META[karma.current_level]?.labelEn : KARMA_LEVEL_META[karma.current_level]?.labelPt}
                </h3>
                <div style={{ fontFamily: 'var(--f-display)', fontSize: 40, fontWeight: 600, color: 'var(--gold)' }}>{karma.total_points}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-mute)', marginBottom: 20 }}>{t('account_karma_points')}</div>
                {karma.points_to_next_level > 0 && (
                  <div style={{ fontSize: 13, color: 'var(--fg-dim)' }}>
                    {karma.points_to_next_level} {t('account_karma_next')} ({KARMA_LEVEL_META[karma.next_level]?.icon} {lang === 'en' ? KARMA_LEVEL_META[karma.next_level]?.labelEn : KARMA_LEVEL_META[karma.next_level]?.labelPt})
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--fg-mute)' }}>{t('account_loading')}</p>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div style={{ maxWidth: 440 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, fontWeight: 500 }}>{t('account_profile_email')}</label>
              <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', color: 'var(--fg-mute)', fontSize: 15 }}>{auth.user.email}</div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, fontWeight: 500 }}>{t('account_profile_name')}</label>
              <input value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))}
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', padding: '10px 0', color: 'var(--fg)', fontSize: 15, outline: 'none' }} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 8, fontWeight: 500 }}>{t('account_profile_phone')}</label>
              <input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)', padding: '10px 0', color: 'var(--fg)', fontSize: 15, outline: 'none' }} />
            </div>
            {savedMsg && <p style={{ marginBottom: 16, fontSize: 13, color: 'var(--gold)' }}>✓ {t('account_profile_saved')}</p>}
            <PrimaryBtn onClick={async () => {
              if (!isSupabaseConfigured || !auth.user) return
              await supabase.from('profiles').update({ full_name: profileForm.full_name, phone: profileForm.phone }).eq('id', auth.user.id)
              await auth.refreshProfile()
              setSavedMsg(true)
              window.setTimeout(() => setSavedMsg(false), 2400)
            }}>{t('account_profile_save')}</PrimaryBtn>

            <PushNotificationToggle userId={auth.user.id} />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── AdminPanel ─────────────────────────────────────────────────────────────
// Gerido por auth.isAdmin (profiles.is_admin=true OU email=karmicnode@gmail.com,
// ambos já calculados em useAuth()). Todas as tabelas lidas/escritas aqui já
// existem em supabase/schema.sql — nada de novo a criar no backend.
// NOTA sobre "Produtos": o catálogo real da loja é o array estático
// ALL_PRODUCTS em código (arquitetura assumida desde o início do projeto —
// ver comentário SKU-based catalog). A tabela `products` é reservada para
// uma futura migração dinâmica; esta aba edita essa tabela paralela, não o
// catálogo ao vivo, e diz isso explicitamente na UI para não confundir.
type AdminTab = 'dashboard' | 'orders' | 'reviews' | 'partnerships' | 'promos' | 'giftcards' | 'newsletter' | 'products' | 'users'

const ADMIN_TABS: { id: AdminTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'orders', label: 'Encomendas' },
  { id: 'products', label: 'Produtos' },
  { id: 'reviews', label: 'Avaliações' },
  { id: 'users', label: 'Utilizadores' },
  { id: 'partnerships', label: 'Parcerias' },
  { id: 'promos', label: 'Promos' },
  { id: 'giftcards', label: 'Gift Cards' },
  { id: 'newsletter', label: 'Newsletter' },
]

function AdminPanel({ auth, setPage }: { auth: ReturnType<typeof useAuth>; setPage: (p: Page) => void }) {
  const [tab, setTab] = useState<AdminTab>('dashboard')

  useEffect(() => {
    if (!auth.loading && !auth.isAdmin) setPage('home')
  }, [auth.loading, auth.isAdmin, setPage])

  if (auth.loading) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-mute)' }}>A carregar...</div>
  }
  if (!auth.isAdmin) {
    return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--fg-mute)' }}>Acesso restrito.</div>
  }

  return (
    <div style={{ padding: 'clamp(20px, 4vw, 50px)', maxWidth: 1300, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: 6 }}>Área Administrativa</div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(26px, 4vw, 38px)', margin: 0, fontWeight: 500 }}>Painel <em style={{ color: 'var(--gold)' }}>Karmic</em></h1>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 28, flexWrap: 'wrap' }}>
        {ADMIN_TABS.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)}
            style={{ padding: '10px 16px', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === tb.id ? 'var(--gold)' : 'transparent'}`, color: tab === tb.id ? 'var(--gold)' : 'var(--fg-mute)', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && <AdminDashboardTab />}
      {tab === 'orders' && <AdminOrdersTab />}
      {tab === 'products' && <AdminProductsTab />}
      {tab === 'reviews' && <AdminReviewsTab />}
      {tab === 'users' && <AdminUsersTab currentUserId={auth.user?.id} />}
      {tab === 'partnerships' && <AdminPartnershipsTab />}
      {tab === 'promos' && <AdminPromosTab />}
      {tab === 'giftcards' && <AdminGiftCardsTab />}
      {tab === 'newsletter' && <AdminNewsletterTab />}
    </div>
  )
}

function AdminStatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: 18, background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--fg-mute)', marginBottom: 8, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 600, color: 'var(--gold)' }}>{value}</div>
    </div>
  )
}

interface AdminDashboardRow {
  total_revenue_cents: number; paid_orders: number; total_orders: number; pending_orders: number
  total_users: number; avg_rating: number; total_reviews: number; pending_reviews: number
  new_partnerships: number; newsletter_subs: number; active_gift_cards: number; active_promos: number
  active_products: number; total_karma_distributed: number
}

function AdminDashboardTab() {
  const [data, setData] = useState<AdminDashboardRow | null>(null)
  const [err, setErr] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) { setErr(true); return }
    supabase.from('admin_dashboard').select('*').single()
      .then(({ data, error }) => { if (error) setErr(true); else setData(data as any) }, () => setErr(true))
  }, [])

  if (!isSupabaseConfigured) {
    return <p style={{ color: 'var(--fg-mute)', fontSize: 14 }}>Supabase não configurado — o dashboard fica inerte até as credenciais serem definidas.</p>
  }
  if (err) return <p style={{ color: 'var(--fg-mute)', fontSize: 14 }}>Não foi possível carregar as métricas (a view admin_dashboard pode não existir ainda na tua base de dados — corre o schema.sql atualizado).</p>
  if (!data) return <p style={{ color: 'var(--fg-mute)', fontSize: 14 }}>A carregar...</p>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
      <AdminStatCard label="Receita total" value={fmt(data.total_revenue_cents / 100)} />
      <AdminStatCard label="Encomendas pagas" value={data.paid_orders} />
      <AdminStatCard label="Encomendas totais" value={data.total_orders} />
      <AdminStatCard label="Pendentes" value={data.pending_orders} />
      <AdminStatCard label="Utilizadores" value={data.total_users} />
      <AdminStatCard label="Avaliação média" value={data.avg_rating} />
      <AdminStatCard label="Avaliações totais" value={data.total_reviews} />
      <AdminStatCard label="Avaliações pendentes" value={data.pending_reviews} />
      <AdminStatCard label="Parcerias novas" value={data.new_partnerships} />
      <AdminStatCard label="Newsletter (ativos)" value={data.newsletter_subs} />
      <AdminStatCard label="Gift cards ativos" value={data.active_gift_cards} />
      <AdminStatCard label="Promos ativas" value={data.active_promos} />
      <AdminStatCard label="Karma distribuído" value={data.total_karma_distributed} />
    </div>
  )
}

interface AdminOrderRow {
  id: string; order_number: string | null; customer_email: string; customer_name: string | null
  status: string; total_cents: number; currency: string; created_at: string; tracking_number: string | null
}
const ORDER_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']

function AdminOrdersTab() {
  const [orders, setOrders] = useState<AdminOrderRow[] | null>(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setOrders([]); return }
    let q = supabase.from('orders').select('id, order_number, customer_email, customer_name, status, total_cents, currency, created_at, tracking_number').order('created_at', { ascending: false }).limit(100)
    if (filter !== 'all') q = q.eq('status', filter)
    q.then(({ data }) => setOrders((data as any) || []), () => setOrders([]))
  }, [filter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        <button onClick={() => setFilter('all')} style={{ padding: '6px 12px', background: filter === 'all' ? 'var(--gold)' : 'var(--bg-1)', color: filter === 'all' ? 'var(--bg)' : 'var(--fg-mute)', border: '1px solid var(--border)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Todas</button>
        {ORDER_STATUSES.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 12px', background: filter === s ? 'var(--gold)' : 'var(--bg-1)', color: filter === s ? 'var(--bg)' : 'var(--fg-mute)', border: '1px solid var(--border)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>
        ))}
      </div>
      {orders === null ? <p style={{ color: 'var(--fg-mute)' }}>A carregar...</p> : orders.length === 0 ? <p style={{ color: 'var(--fg-mute)' }}>Sem encomendas.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                {['Nº', 'Cliente', 'Total', 'Estado', 'Data', ''].map(h => (
                  <th key={h} style={{ padding: '10px 8px', color: 'var(--fg-mute)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 8px' }}>{o.order_number || o.id.slice(0, 8)}</td>
                  <td style={{ padding: '10px 8px' }}>{o.customer_name || o.customer_email}</td>
                  <td style={{ padding: '10px 8px' }}>{fmt(o.total_cents / 100)}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} style={{ background: 'var(--bg-2)', color: 'var(--fg)', border: '1px solid var(--border)', padding: '4px 6px', fontSize: 12, fontFamily: 'inherit' }}>
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--fg-mute)' }}>{new Date(o.created_at).toLocaleDateString('pt-PT')}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--fg-mute)' }}>{o.tracking_number || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface AdminReviewRow {
  id: string; product_sku: string; user_name: string | null; rating: number
  title: string | null; body: string | null; status: string; created_at: string
}
function AdminReviewsTab() {
  const [reviews, setReviews] = useState<AdminReviewRow[] | null>(null)
  const [filter, setFilter] = useState('pending')

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setReviews([]); return }
    let q = supabase.from('reviews').select('id, product_sku, user_name, rating, title, body, status, created_at').order('created_at', { ascending: false }).limit(100)
    if (filter !== 'all') q = q.eq('status', filter)
    q.then(({ data }) => setReviews((data as any) || []), () => setReviews([]))
  }, [filter])

  useEffect(() => { load() }, [load])

  const moderate = async (id: string, status: string) => {
    await supabase.from('reviews').update({ status, moderated_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {['pending', 'approved', 'rejected', 'flagged', 'all'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 12px', background: filter === s ? 'var(--gold)' : 'var(--bg-1)', color: filter === s ? 'var(--bg)' : 'var(--fg-mute)', border: '1px solid var(--border)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>
        ))}
      </div>
      {reviews === null ? <p style={{ color: 'var(--fg-mute)' }}>A carregar...</p> : reviews.length === 0 ? <p style={{ color: 'var(--fg-mute)' }}>Sem avaliações.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map(r => (
            <div key={r.id} style={{ padding: 16, background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                <div><Stars rating={r.rating} size={12} /> <span style={{ fontSize: 12, color: 'var(--fg-mute)', marginLeft: 8 }}>{r.product_sku} · {r.user_name || 'Anónimo'}</span></div>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>{r.status}</span>
              </div>
              {r.title && <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 14 }}>{r.title}</div>}
              {r.body && <p style={{ fontSize: 13, color: 'var(--fg-dim)', margin: '0 0 10px' }}>{r.body}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => moderate(r.id, 'approved')} style={{ padding: '6px 12px', background: '#2e7d32', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Aprovar</button>
                <button onClick={() => moderate(r.id, 'rejected')} style={{ padding: '6px 12px', background: 'var(--bordo)', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Rejeitar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface AdminPartnershipRow {
  id: string; program: string; program_name: string | null; data: Record<string, string>
  status: string; created_at: string
}
function AdminPartnershipsTab() {
  const [rows, setRows] = useState<AdminPartnershipRow[] | null>(null)
  const [filter, setFilter] = useState('new')

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setRows([]); return }
    let q = supabase.from('partnership_applications').select('id, program, program_name, data, status, created_at').order('created_at', { ascending: false }).limit(100)
    if (filter !== 'all') q = q.eq('status', filter)
    q.then(({ data }) => setRows((data as any) || []), () => setRows([]))
  }, [filter])

  useEffect(() => { load() }, [load])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('partnership_applications').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {['new', 'reviewing', 'approved', 'rejected', 'contacted', 'all'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: '6px 12px', background: filter === s ? 'var(--gold)' : 'var(--bg-1)', color: filter === s ? 'var(--bg)' : 'var(--fg-mute)', border: '1px solid var(--border)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>
        ))}
      </div>
      {rows === null ? <p style={{ color: 'var(--fg-mute)' }}>A carregar...</p> : rows.length === 0 ? <p style={{ color: 'var(--fg-mute)' }}>Sem candidaturas.</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map(r => (
            <div key={r.id} style={{ padding: 16, background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                <strong style={{ fontSize: 14 }}>{r.program_name || r.program}</strong>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700 }}>{r.status}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--fg-dim)', marginBottom: 10 }}>
                {Object.entries(r.data || {}).map(([k, v]) => <div key={k}><strong>{k}:</strong> {String(v)}</div>)}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['reviewing', 'approved', 'rejected', 'contacted'].map(s => (
                  <button key={s} onClick={() => updateStatus(r.id, s)} style={{ padding: '5px 10px', background: 'var(--bg-2)', color: 'var(--fg-mute)', border: '1px solid var(--border)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>{s}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── AdminProductsTab ───────────────────────────────────────────────────
// IMPORTANTE: esta aba edita a tabela `products` do Supabase, que existe
// no schema como catálogo reservado para uma FUTURA migração para catálogo
// dinâmico (ver supabase/schema.sql secção 3). A loja pública em produção
// continua a ler o catálogo ESTÁTICO embutido em ALL_PRODUCTS (App.tsx) —
// editar aqui NÃO altera o que os clientes veem na loja. Mantido assim de
// propósito para não misturar as duas fontes de dados sem migração
// explícita; serve para já para gerir stock/preço de forma centralizada
// e preparar essa migração futura.
interface AdminProductRow {
  id: string; sku: string; name: string; category: string; vertical: string | null
  price_cents: number; stock: number; is_active: boolean; is_featured: boolean
}
function AdminProductsTab() {
  const [rows, setRows] = useState<AdminProductRow[] | null>(null)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formSku, setFormSku] = useState('')
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formPrice, setFormPrice] = useState(0)
  const [formStock, setFormStock] = useState(0)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setRows([]); return }
    supabase.from('products').select('id, sku, name, category, vertical, price_cents, stock, is_active, is_featured').order('created_at', { ascending: false }).limit(200)
      .then(({ data }) => setRows((data as any) || []), () => setRows([]))
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (id: string, is_active: boolean) => {
    await supabase.from('products').update({ is_active: !is_active }).eq('id', id)
    load()
  }

  const updateStock = async (id: string, stock: number) => {
    await supabase.from('products').update({ stock }).eq('id', id)
    load()
  }

  const createProduct = async () => {
    if (!formSku.trim() || !formName.trim() || !formCategory.trim()) return
    setSaving(true)
    await supabase.from('products').insert({
      sku: formSku.trim().toUpperCase(), name: formName.trim(), category: formCategory.trim(),
      price_cents: Math.round(formPrice * 100), stock: formStock, is_active: true,
    })
    setSaving(false); setShowForm(false)
    setFormSku(''); setFormName(''); setFormCategory(''); setFormPrice(0); setFormStock(0)
    load()
  }

  const filtered = rows?.filter(r => !search || r.sku.toLowerCase().includes(search.toLowerCase()) || r.name.toLowerCase().includes(search.toLowerCase())) ?? null

  return (
    <div>
      <div style={{ padding: 14, marginBottom: 20, background: 'var(--gold)15', border: '1px solid var(--gold-3)', fontSize: 12, color: 'var(--fg-dim)', lineHeight: 1.6 }}>
        ⚠️ Esta tabela é um catálogo <b>reservado para migração futura</b>. A loja pública lê o catálogo estático (ALL_PRODUCTS) — editar aqui não afeta o que os clientes veem, ainda.
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar SKU ou nome..." style={{ flex: 1, minWidth: 200, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit' }} />
        <button onClick={() => setShowForm(v => !v)} style={{ padding: '8px 16px', background: 'var(--gold)', color: 'var(--bg)', border: 'none', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {showForm ? 'Cancelar' : '+ Novo Produto'}
        </button>
      </div>
      {showForm && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', padding: 14, background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
          <input value={formSku} onChange={e => setFormSku(e.target.value)} placeholder="SKU (ex: KN-050)" style={{ width: 120, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
          <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nome" style={{ flex: 1, minWidth: 140, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
          <input value={formCategory} onChange={e => setFormCategory(e.target.value)} placeholder="Categoria" style={{ width: 140, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
          <input type="number" value={formPrice} onChange={e => setFormPrice(Number(e.target.value))} placeholder="Preço €" style={{ width: 90, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
          <input type="number" value={formStock} onChange={e => setFormStock(Number(e.target.value))} placeholder="Stock" style={{ width: 80, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '8px 10px', fontSize: 13, fontFamily: 'inherit' }} />
          <button onClick={createProduct} disabled={saving} style={{ padding: '8px 16px', background: 'var(--gold)', color: 'var(--bg)', border: 'none', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {saving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      )}
      {filtered === null ? <p style={{ color: 'var(--fg-mute)' }}>A carregar...</p> : filtered.length === 0 ? <p style={{ color: 'var(--fg-mute)' }}>Sem produtos na tabela `products` (o catálogo público continua a funcionar via ALL_PRODUCTS).</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                {['SKU', 'Nome', 'Categoria', 'Preço', 'Stock', 'Ativo'].map(h => <th key={h} style={{ padding: '10px 8px', color: 'var(--fg-mute)', fontSize: 10, textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{p.sku}</td>
                  <td style={{ padding: '10px 8px' }}>{p.name}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--fg-mute)' }}>{p.category}</td>
                  <td style={{ padding: '10px 8px' }}>{fmt(p.price_cents / 100)}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <input type="number" defaultValue={p.stock} onBlur={e => { const v = Number(e.target.value); if (v !== p.stock) updateStock(p.id, v) }} style={{ width: 60, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '4px 6px', fontSize: 12, fontFamily: 'inherit' }} />
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <button onClick={() => toggleActive(p.id, p.is_active)} style={{ padding: '4px 10px', background: p.is_active ? '#2e7d32' : 'var(--bg-3)', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>{p.is_active ? 'Ativo' : 'Inativo'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── AdminUsersTab ──────────────────────────────────────────────────────
interface AdminUserRow {
  id: string; email: string | null; full_name: string | null; is_admin: boolean; created_at: string
}
function AdminUsersTab({ currentUserId }: { currentUserId?: string }) {
  const [rows, setRows] = useState<AdminUserRow[] | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setRows([]); return }
    supabase.from('profiles').select('id, email, full_name, is_admin, created_at').order('created_at', { ascending: false }).limit(300)
      .then(({ data }) => setRows((data as any) || []), () => setRows([]))
  }, [])

  useEffect(() => { load() }, [load])

  const toggleAdmin = async (id: string, is_admin: boolean) => {
    if (id === currentUserId && is_admin) {
      if (!window.confirm('Vais remover o teu próprio acesso de admin. Continuar?')) return
    }
    await supabase.from('profiles').update({ is_admin: !is_admin }).eq('id', id)
    load()
  }

  const filtered = rows?.filter(r => !search || (r.email || '').toLowerCase().includes(search.toLowerCase()) || (r.full_name || '').toLowerCase().includes(search.toLowerCase())) ?? null

  return (
    <div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar por email ou nome..." style={{ width: '100%', maxWidth: 320, marginBottom: 18, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit', display: 'block' }} />
      {filtered === null ? <p style={{ color: 'var(--fg-mute)' }}>A carregar...</p> : filtered.length === 0 ? <p style={{ color: 'var(--fg-mute)' }}>Sem utilizadores.</p> : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                {['Email', 'Nome', 'Desde', 'Admin'].map(h => <th key={h} style={{ padding: '10px 8px', color: 'var(--fg-mute)', fontSize: 10, textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 8px' }}>{u.email || '—'}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--fg-mute)' }}>{u.full_name || '—'}</td>
                  <td style={{ padding: '10px 8px', color: 'var(--fg-mute)' }}>{new Date(u.created_at).toLocaleDateString('pt-PT')}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <button onClick={() => toggleAdmin(u.id, u.is_admin)} style={{ padding: '4px 10px', background: u.is_admin ? 'var(--gold)' : 'var(--bg-3)', color: u.is_admin ? 'var(--bg)' : '#fff', border: 'none', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>{u.is_admin ? '👑 Admin' : 'Tornar admin'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

interface AdminPromoRow {
  id: string; code: string; discount_type: string; discount_value: number
  used_count: number; max_uses: number | null; is_active: boolean
}
function AdminPromosTab() {
  const [rows, setRows] = useState<AdminPromoRow[] | null>(null)
  const [newCode, setNewCode] = useState('')
  const [newValue, setNewValue] = useState(10)

  const load = useCallback(() => {
    if (!isSupabaseConfigured) { setRows([]); return }
    supabase.from('promo_codes').select('id, code, discount_type, discount_value, used_count, max_uses, is_active').order('created_at', { ascending: false })
      .then(({ data }) => setRows((data as any) || []), () => setRows([]))
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (id: string, is_active: boolean) => {
    await supabase.from('promo_codes').update({ is_active: !is_active }).eq('id', id)
    load()
  }

  const createCode = async () => {
    if (!newCode.trim()) return
    await supabase.from('promo_codes').insert({ code: newCode.toUpperCase(), name: newCode, discount_type: 'percentage', discount_value: newValue, is_active: true })
    setNewCode(''); setNewValue(10)
    load()
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="NOVO_CODIGO" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit' }} />
        <input type="number" value={newValue} onChange={e => setNewValue(Number(e.target.value))} style={{ width: 70, background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '8px 12px', fontSize: 13, fontFamily: 'inherit' }} />
        <span style={{ fontSize: 12, color: 'var(--fg-mute)' }}>% desconto</span>
        <button onClick={createCode} style={{ padding: '8px 16px', background: 'var(--gold)', color: 'var(--bg)', border: 'none', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Criar</button>
      </div>
      {rows === null ? <p style={{ color: 'var(--fg-mute)' }}>A carregar...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              {['Código', 'Tipo', 'Valor', 'Usos', 'Ativo'].map(h => <th key={h} style={{ padding: '10px 8px', color: 'var(--fg-mute)', fontSize: 10, textTransform: 'uppercase' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{p.code}</td>
                <td style={{ padding: '10px 8px' }}>{p.discount_type}</td>
                <td style={{ padding: '10px 8px' }}>{p.discount_value}{p.discount_type === 'percentage' ? '%' : ''}</td>
                <td style={{ padding: '10px 8px' }}>{p.used_count}{p.max_uses ? ` / ${p.max_uses}` : ''}</td>
                <td style={{ padding: '10px 8px' }}>
                  <button onClick={() => toggleActive(p.id, p.is_active)} style={{ padding: '4px 10px', background: p.is_active ? '#2e7d32' : 'var(--bg-3)', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>{p.is_active ? 'Ativo' : 'Inativo'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

interface AdminGiftCardRow {
  id: string; code: string; initial_value_cents: number; remaining_value_cents: number
  recipient_email: string | null; status: string; created_at: string
}
function AdminGiftCardsTab() {
  const [rows, setRows] = useState<AdminGiftCardRow[] | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) { setRows([]); return }
    supabase.from('gift_cards').select('id, code, initial_value_cents, remaining_value_cents, recipient_email, status, created_at').order('created_at', { ascending: false }).limit(100)
      .then(({ data }) => setRows((data as any) || []), () => setRows([]))
  }, [])

  return (
    <div>
      {rows === null ? <p style={{ color: 'var(--fg-mute)' }}>A carregar...</p> : rows.length === 0 ? <p style={{ color: 'var(--fg-mute)' }}>Sem cartões-presente.</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              {['Código', 'Valor inicial', 'Restante', 'Destinatário', 'Estado', 'Data'].map(h => <th key={h} style={{ padding: '10px 8px', color: 'var(--fg-mute)', fontSize: 10, textTransform: 'uppercase' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(g => (
              <tr key={g.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{g.code}</td>
                <td style={{ padding: '10px 8px' }}>{fmt(g.initial_value_cents / 100)}</td>
                <td style={{ padding: '10px 8px' }}>{fmt(g.remaining_value_cents / 100)}</td>
                <td style={{ padding: '10px 8px' }}>{g.recipient_email || '—'}</td>
                <td style={{ padding: '10px 8px' }}>{g.status}</td>
                <td style={{ padding: '10px 8px', color: 'var(--fg-mute)' }}>{new Date(g.created_at).toLocaleDateString('pt-PT')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

interface AdminNewsletterRow { email: string; language: string; is_active: boolean; created_at: string }
function AdminNewsletterTab() {
  const [rows, setRows] = useState<AdminNewsletterRow[] | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) { setRows([]); return }
    supabase.from('newsletter_subs').select('email, language, is_active, created_at').order('created_at', { ascending: false }).limit(500)
      .then(({ data }) => setRows((data as any) || []), () => setRows([]))
  }, [])

  const exportCsv = () => {
    if (!rows || !rows.length) return
    const csv = 'email,language,active,created_at\n' + rows.map(r => `${r.email},${r.language},${r.is_active},${r.created_at}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'newsletter_subs.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: 'var(--fg-mute)' }}>{rows?.length ?? 0} inscritos</span>
        <button onClick={exportCsv} disabled={!rows?.length} style={{ padding: '8px 16px', background: 'var(--gold)', color: 'var(--bg)', border: 'none', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, cursor: rows?.length ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>Exportar CSV</button>
      </div>
      {rows === null ? <p style={{ color: 'var(--fg-mute)' }}>A carregar...</p> : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
              {['Email', 'Idioma', 'Ativo', 'Desde'].map(h => <th key={h} style={{ padding: '10px 8px', color: 'var(--fg-mute)', fontSize: 10, textTransform: 'uppercase' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.email} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 8px' }}>{r.email}</td>
                <td style={{ padding: '10px 8px' }}>{r.language}</td>
                <td style={{ padding: '10px 8px' }}>{r.is_active ? '✓' : '✗'}</td>
                <td style={{ padding: '10px 8px', color: 'var(--fg-mute)' }}>{new Date(r.created_at).toLocaleDateString('pt-PT')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ─── GiftCardsPage ──────────────────────────────────────────────────────────
function GiftCardsPage() {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const [amount, setAmount] = useState(50)
  const [recipient, setRecipient] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sender, setSender] = useState('')
  const [design, setDesign] = useState('classic')
  const [submitting, setSubmitting] = useState(false)
  // Nota: sem estado "pago com sucesso" local — o fluxo agora redireciona
  // para o Stripe Checkout (handleBuy), pelo que o "done" nunca é necessário
  // aqui; o utilizador só volta ao site via /?pagamento=sucesso (SuccessPage).
  const [error, setError] = useState('')

  const AMOUNTS = [25, 50, 100, 150, 250]
  const DESIGNS = [
    { id: 'classic', label: isEN ? 'Classic' : 'Clássico', emoji: '✦' },
    { id: 'birthday', label: isEN ? 'Birthday' : 'Aniversário', emoji: '🎂' },
    { id: 'christmas', label: isEN ? 'Christmas' : 'Natal', emoji: '🎄' },
    { id: 'love', label: isEN ? 'Love' : 'Amor', emoji: '❤' },
  ]

  const handleBuy = async () => {
    if (!email.trim()) { setError(isEN ? 'Recipient email required' : 'Email do destinatário obrigatório'); return }
    setSubmitting(true); setError('')
    try {
      const code = 'GC-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
      if (isSupabaseConfigured) {
        const { error: err } = await supabase.from('gift_cards').insert({
          code, initial_value_cents: amount * 100, remaining_value_cents: amount * 100,
          design, recipient_name: recipient || null, recipient_email: email,
          sender_name: sender || null, personal_message: message || null, status: 'pending',
        })
        if (err) throw err
      }

      // Paga o cartão-presente via Stripe Checkout, como qualquer outra compra.
      // O webhook (checkout.session.completed) deteta metadata.gift_card_code
      // e transita a linha correspondente 'pending' → 'active'.
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            name: (isEN ? 'Karmic Node Gift Card — ' : 'Cartão-presente Karmic Node — ') + `€${amount}`,
            description: isEN ? `Digital gift card for ${email}` : `Cartão-presente digital para ${email}`,
            price: amount,
            qty: 1,
            sku: code,
            category: 'gift-card',
            giftCardCode: code,
          }],
          origin: window.location.origin,
          locale: isEN ? 'en' : 'pt',
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      throw new Error(data.error || 'checkout failed')
    } catch {
      setError(isEN ? 'Something went wrong. Please contact us directly.' : 'Algo correu mal. Por favor contacta-nos diretamente.')
    } finally {
      setSubmitting(false)
    }
  }



  return (
    <div style={{ padding: 'clamp(24px, 4vw, 60px)', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ marginBottom: 30 }}>
        <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: 8 }}>
          {isEN ? 'Gift Cards' : 'Cartões-presente'}
        </div>
        <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(32px, 5vw, 54px)', margin: '0 0 14px', fontWeight: 500 }}>
          {isEN ? 'Give the gift of ' : 'Ofereça o presente '}<em style={{ color: 'var(--gold)' }}>Karmic</em>.
        </h1>
        <p style={{ color: 'var(--fg-mute)', maxWidth: 500, lineHeight: 1.6 }}>
          {isEN ? 'Perfect for those who love good taste. Delivered digitally, valid for 2 years.' : 'Perfeito para quem gosta de bom gosto. Entregue digitalmente, válido por 2 anos.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 30 }}>
        <div>
          <div style={{ aspectRatio: '1.6', background: 'linear-gradient(135deg, #0B0B0C, #1a0d0f)', border: '2px solid var(--gold)', padding: 30, position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: 40, marginBottom: 20 }}>{DESIGNS.find(d => d.id === design)?.emoji}</div>
            <div style={{ fontSize: 10, letterSpacing: '.3em', color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 8 }}>Karmic Node</div>
            <div style={{ fontFamily: 'var(--f-display)', fontSize: 44, fontWeight: 500, color: 'var(--gold)' }}>€{amount}</div>
            {recipient && <div style={{ fontSize: 12, color: '#F5F2ED', marginTop: 16, fontFamily: 'var(--f-display)' }}>{isEN ? 'For' : 'Para'} {recipient}</div>}
            {message && <div style={{ fontSize: 11, color: '#F5F2ED99', marginTop: 8, fontStyle: 'italic', lineHeight: 1.5 }}>"{message}"</div>}
          </div>
        </div>

        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--fg-mute)', fontWeight: 600, marginBottom: 10 }}>{isEN ? 'Amount' : 'Valor'}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(a)} style={{ padding: '10px 18px', background: amount === a ? 'var(--gold)' : 'var(--bg-2)', color: amount === a ? 'var(--bg)' : 'var(--fg)', border: '1px solid var(--border)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>€{a}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--fg-mute)', fontWeight: 600, marginBottom: 6 }}>{isEN ? 'Design' : 'Design'}</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {DESIGNS.map(d => (
                <button key={d.id} onClick={() => setDesign(d.id)} style={{ flex: 1, padding: '10px 6px', background: design === d.id ? 'var(--gold)' : 'var(--bg-2)', color: design === d.id ? 'var(--bg)' : 'var(--fg)', border: '1px solid var(--border)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{d.emoji} {d.label}</button>
              ))}
            </div>
          </div>

          <input type="text" value={recipient} onChange={e => setRecipient(e.target.value)} placeholder={isEN ? "Recipient's name" : 'Nome do destinatário'}
            style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '11px 14px', fontSize: 13, marginBottom: 10, outline: 'none', fontFamily: 'inherit' }} />
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={isEN ? "Recipient's email" : 'Email do destinatário'}
            style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '11px 14px', fontSize: 13, marginBottom: 10, outline: 'none', fontFamily: 'inherit' }} />
          <input type="text" value={sender} onChange={e => setSender(e.target.value)} placeholder={isEN ? 'Your name' : 'O teu nome'}
            style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '11px 14px', fontSize: 13, marginBottom: 10, outline: 'none', fontFamily: 'inherit' }} />
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={isEN ? 'Message (optional)' : 'Mensagem (opcional)'} rows={3}
            style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '11px 14px', fontSize: 13, marginBottom: 16, outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />

          {error && <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--bordo)' }}>⚠ {error}</p>}

          <button onClick={handleBuy} disabled={submitting} style={{ width: '100%', padding: '14px', background: submitting ? 'var(--border)' : 'var(--bordo)', color: '#fff', border: 'none', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
            {submitting ? (isEN ? 'Processing...' : 'A processar...') : (isEN ? `Buy €${amount} gift card →` : `Comprar cartão €${amount} →`)}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── HelpPage (FAQ / Envio / Devoluções / Garantia) ────────────────────────
function HelpPage({ topic, setPage }: { topic: 'faq' | 'envio' | 'devolucoes' | 'garantia'; setPage: (p: Page) => void }) {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const CONTENT: Record<string, { title: string; subtitle: string; sections: { q: string; a: string }[] }> = {
    faq: {
      title: isEN ? 'Frequently Asked Questions' : 'Perguntas Frequentes',
      subtitle: isEN ? 'Everything you need to know about Karmic Node.' : 'Tudo o que precisas de saber sobre a Karmic Node.',
      sections: isEN ? [
        { q: 'How does customization work?', a: 'Choose a base product (t-shirt, hoodie, cushion...), pick color and size, and use our Pro Editor to add text, images, clipart, and effects. You can save your design and finalize it later.' },
        { q: 'What payment methods do you accept?', a: 'Credit/debit cards (Visa, Mastercard, Amex), MBWay, Multibanco reference, PayPal, and Apple/Google Pay.' },
        { q: 'What are the shipping times?', a: 'Standard products: 24-48h dispatch. Customized: 3-5 business days. International shipping: 5-10 business days.' },
        { q: 'Do you ship internationally?', a: 'Yes, we ship worldwide. Free shipping over €150 to mainland Portugal. Other destinations calculated at checkout.' },
        { q: 'What is the Karma Points system?', a: 'Every purchase, review, and interaction earns Karma Points. Reach 5 levels (Iniciante → Karmic) and redeem for discounts, free shipping, and exclusive products.' },
        { q: 'Can I return a custom product?', a: 'Custom products are non-returnable unless there is a manufacturing defect. Standard products have 14 days for return.' },
        { q: 'How can I contact you?', a: 'Email karmicnode@gmail.com or fill out the contact form. We respond within 24h.' },
        { q: 'Do you have physical store?', a: 'We are an online-only atelier based in Cartaxo, Portugal. All production happens at our studio and partner Portuguese artisans.' },
      ] : [
        { q: 'Como funciona a personalização?', a: 'Escolhe um produto base (t-shirt, hoodie, almofada...), seleciona cor e tamanho, e usa o nosso Editor Pro para adicionar texto, imagens, clipart e efeitos. Podes guardar o teu design e finalizar mais tarde.' },
        { q: 'Que métodos de pagamento aceitam?', a: 'Cartões crédito/débito (Visa, Mastercard, Amex), MBWay, referência Multibanco, PayPal, e Apple/Google Pay.' },
        { q: 'Quais são os prazos de envio?', a: 'Produtos standard: envio em 24-48h. Personalizados: 3-5 dias úteis. Internacional: 5-10 dias úteis.' },
        { q: 'Enviam para o estrangeiro?', a: 'Sim, enviamos para todo o mundo. Envio grátis acima de 150€ em Portugal Continental. Outros destinos calculados no checkout.' },
        { q: 'O que é o sistema Karma Points?', a: 'Cada compra, review e interação dá Karma Points. Sobe 5 níveis (Iniciante → Karmic) e troca por descontos, portes grátis e produtos exclusivos.' },
        { q: 'Posso devolver um produto personalizado?', a: 'Produtos personalizados não são devolvíveis, exceto em caso de defeito de fabrico. Produtos standard têm 14 dias para devolução.' },
        { q: 'Como posso contactar-vos?', a: 'Email karmicnode@gmail.com ou formulário de contacto. Respondemos em 24h.' },
        { q: 'Têm loja física?', a: 'Somos um atelier online sediado em Cartaxo, Portugal. Toda a produção é feita no nosso estúdio e por artesãos portugueses parceiros.' },
      ],
    },
    envio: {
      title: isEN ? 'Shipping Policy' : 'Política de Envio',
      subtitle: isEN ? 'How, when and where we deliver.' : 'Como, quando e para onde entregamos.',
      sections: isEN ? [
        { q: 'Shipping to Mainland Portugal', a: 'Free for orders over €150. Below: €4.99 (24-48h). Same-day delivery available in Lisbon and Porto for orders before 12h.' },
        { q: 'Shipping to Islands (Azores/Madeira)', a: '€6.99 fixed. Delivery in 3-5 business days.' },
        { q: 'Spain', a: '€9.99. Delivery in 5-7 business days.' },
        { q: 'Rest of the EU', a: '€14.99. Delivery in 5-10 business days.' },
        { q: 'Order tracking', a: 'You will receive tracking number via email as soon as the order is dispatched. Also visible in "My Account" → "Orders".' },
        { q: 'Absences and reschedule', a: 'Carriers make up to 2 delivery attempts. After that, the package returns to us. Contact us to reschedule.' },
      ] : [
        { q: 'Envio para Portugal Continental', a: 'Grátis para encomendas acima de 150€. Abaixo: 4,99€ (24-48h). Entrega no próprio dia disponível em Lisboa e Porto para encomendas antes das 12h.' },
        { q: 'Envio para Ilhas (Açores/Madeira)', a: '6,99€ fixo. Entrega em 3-5 dias úteis.' },
        { q: 'Espanha', a: '9,99€. Entrega em 5-7 dias úteis.' },
        { q: 'Resto da UE', a: '14,99€. Entrega em 5-10 dias úteis.' },
        { q: 'Rastreamento da encomenda', a: 'Receberás o número de tracking por email assim que a encomenda for despachada. Também visível em "A Minha Conta" → "Encomendas".' },
        { q: 'Ausências e reagendamento', a: 'As transportadoras fazem até 2 tentativas de entrega. Após isso, o pacote regressa a nós. Contacta-nos para reagendar.' },
      ],
    },
    devolucoes: {
      title: isEN ? 'Returns & Exchanges' : 'Devoluções e Trocas',
      subtitle: isEN ? '14 days to change your mind. Simple and hassle-free.' : '14 dias para mudares de ideias. Simples e sem complicações.',
      sections: isEN ? [
        { q: 'Return period', a: 'You have 14 calendar days from delivery to request a return. Products must be unused, unwashed, with tags and original packaging.' },
        { q: 'How to return', a: '1. Access "My Account" → "Orders" → "Request Return". 2. Print the pre-paid label (free for Portugal). 3. Drop off at any CTT or DPD point.' },
        { q: 'Refund', a: 'Processed within 5-10 business days after we receive the product. Same payment method used in purchase.' },
        { q: 'Exchanges', a: 'Free exchanges for different size/color of the same product. Follow return process and place new order — we credit the original.' },
        { q: 'Non-returnable items', a: 'Custom products (with your design or text), used underwear, and marked "Final Sale" items.' },
        { q: 'Defective products', a: 'Contact us immediately at karmicnode@gmail.com with photos. We replace or refund 100% including shipping.' },
      ] : [
        { q: 'Prazo de devolução', a: 'Tens 14 dias corridos após entrega para pedir devolução. Produtos devem estar por usar, por lavar, com etiquetas e embalagem original.' },
        { q: 'Como devolver', a: '1. Acede "A Minha Conta" → "Encomendas" → "Pedir Devolução". 2. Imprime a etiqueta pré-paga (grátis para Portugal). 3. Entrega em qualquer ponto CTT ou DPD.' },
        { q: 'Reembolso', a: 'Processado em 5-10 dias úteis após recebermos o produto. Mesmo método de pagamento usado na compra.' },
        { q: 'Trocas', a: 'Trocas gratuitas por tamanho/cor diferente do mesmo produto. Segue o processo de devolução e faz nova encomenda — creditamos a original.' },
        { q: 'Produtos não devolvíveis', a: 'Produtos personalizados (com o teu design ou texto), roupa interior usada, e artigos marcados "Venda Final".' },
        { q: 'Produtos defeituosos', a: 'Contacta-nos imediatamente em karmicnode@gmail.com com fotografias. Substituímos ou reembolsamos 100% incluindo portes.' },
      ],
    },
    garantia: {
      title: isEN ? 'Warranty & Quality' : 'Garantia e Qualidade',
      subtitle: isEN ? 'We stand behind everything we make.' : 'Garantimos tudo o que fazemos.',
      sections: isEN ? [
        { q: 'General warranty', a: 'All Karmic Node products have 2-year warranty against manufacturing defects, as required by EU law.' },
        { q: 'Fabric and stitching', a: 'Guaranteed against seam failure, fabric tearing under normal use, and color fading in first wash following our care instructions.' },
        { q: 'Prints and embroidery', a: 'DTG/DTF prints and embroidery guaranteed for 50+ washes when instructions are followed (inside out, cold water, no bleach).' },
        { q: 'How to claim', a: 'Send email to karmicnode@gmail.com with order number, defect photos, and clear description. We respond in 48h.' },
        { q: 'Resolution', a: 'Depending on defect: free repair, replacement, or full refund (buyer choice for defects in first 6 months).' },
        { q: 'Not covered', a: 'Normal wear, damage from misuse, incorrect washing, alterations by third parties.' },
      ] : [
        { q: 'Garantia geral', a: 'Todos os produtos Karmic Node têm garantia de 2 anos contra defeitos de fabrico, conforme exigido pela lei EU.' },
        { q: 'Tecido e costuras', a: 'Garantido contra falha de costuras, rasgo de tecido em uso normal, e desvanecimento de cor na primeira lavagem seguindo as instruções.' },
        { q: 'Estampas e bordados', a: 'Estampas DTG/DTF e bordados garantidos por 50+ lavagens quando instruções são seguidas (do avesso, água fria, sem lixívia).' },
        { q: 'Como reclamar', a: 'Envia email para karmicnode@gmail.com com número de encomenda, fotografias do defeito, e descrição clara. Respondemos em 48h.' },
        { q: 'Resolução', a: 'Consoante defeito: reparação grátis, substituição, ou reembolso total (escolha do comprador em defeitos nos primeiros 6 meses).' },
        { q: 'Não coberto', a: 'Desgaste normal, danos por uso indevido, lavagem incorreta, alterações por terceiros.' },
      ],
    },
  }

  const c = CONTENT[topic]

  return (
    <div style={{ padding: 'clamp(30px, 5vw, 80px) clamp(20px, 5vw, 60px)', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: 10 }}>{isEN ? 'Support' : 'Apoio'}</div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(30px, 4.5vw, 48px)', margin: '0 0 12px', fontWeight: 500 }}>{c.title}</h1>
      <p style={{ color: 'var(--fg-mute)', fontSize: 15, marginBottom: 30, lineHeight: 1.6 }}>{c.subtitle}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {c.sections.map((section, i) => (
          <div key={i} style={{ border: '1px solid var(--border)', background: openFaq === i ? 'var(--bg-2)' : 'transparent' }}>
            <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '16px 20px', textAlign: 'left', color: 'var(--fg)', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 15, fontFamily: 'var(--f-display)', fontWeight: 500 }}>{section.q}</span>
              <span style={{ color: 'var(--gold)', fontSize: 18, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform .3s' }}>+</span>
            </button>
            {openFaq === i && <div style={{ padding: '0 20px 20px', color: 'var(--fg-dim)', fontSize: 14, lineHeight: 1.7 }}>{section.a}</div>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, padding: 20, background: 'rgba(176,141,87,.08)', border: '1px solid var(--gold-3)' }}>
        <div style={{ fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: 8 }}>{isEN ? 'Still have questions?' : 'Ainda tens dúvidas?'}</div>
        <p style={{ fontSize: 13, color: 'var(--fg-dim)', margin: '0 0 14px', lineHeight: 1.6 }}>{isEN ? 'Contact us directly, we respond within 24h.' : 'Contacta-nos diretamente, respondemos em 24h.'}</p>
        <button onClick={() => setPage('contact')} style={{ padding: '10px 20px', background: 'var(--bordo)', color: '#fff', border: 'none', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{isEN ? 'Contact us →' : 'Contactar →'}</button>
      </div>
    </div>
  )
}

// ─── PartnershipsPage ───────────────────────────────────────────────────────
function PartnershipsPage({ setPage }: { setPage: (p: Page) => void }) {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const PROGRAMS = isEN ? [
    { id: 'artist', icon: '🎨', title: 'Artist Collaborations', desc: 'Partner with us to launch limited-edition capsule collections. We handle production, marketing, and fulfillment. You bring the art.', cta: 'Apply as Artist', highlight: '20% royalties on sales' },
    { id: 'corporate', icon: '🏢', title: 'Corporate & Events', desc: 'Custom apparel and merchandising for your company, event, or team. Volume discounts, dedicated account manager, and rush delivery available.', cta: 'Request Quote', highlight: 'From 20 units' },
    { id: 'affiliate', icon: '🤝', title: 'Affiliate Program', desc: 'Earn 10% commission on every sale from your referral link. Ideal for creators, influencers, and content producers.', cta: 'Join Affiliate', highlight: '10% commission' },
    { id: 'wholesale', icon: '🏭', title: 'Wholesale', desc: 'Buy in bulk (50+ units) at wholesale pricing. Perfect for retailers, gift shops, and hospitality.', cta: 'Wholesale Info', highlight: 'Up to 40% off retail' },
  ] : [
    { id: 'artist', icon: '🎨', title: 'Colaborações com Artistas', desc: 'Cria connosco coleções cápsula de edição limitada. Nós tratamos da produção, marketing e envio. Tu trazes a arte.', cta: 'Candidatar como Artista', highlight: '20% royalties nas vendas' },
    { id: 'corporate', icon: '🏢', title: 'Empresas & Eventos', desc: 'Vestuário personalizado e merchandising para a tua empresa, evento ou equipa. Descontos por volume, gestor dedicado, e entrega urgente.', cta: 'Pedir Orçamento', highlight: 'A partir de 20 unidades' },
    { id: 'affiliate', icon: '🤝', title: 'Programa Afiliados', desc: 'Ganha 10% de comissão em cada venda pelo teu link de referência. Ideal para criadores, influenciadores e produtores de conteúdo.', cta: 'Aderir Afiliados', highlight: '10% de comissão' },
    { id: 'wholesale', icon: '🏭', title: 'Grossista', desc: 'Compra em volume (50+ unidades) a preço de grossista. Perfeito para lojas de retalho, gift shops e hospitalidade.', cta: 'Info Grossista', highlight: 'Até 40% desconto retalho' },
  ]

  const selectProgram = (id: string) => {
    setSelectedProgram(id)
    setSubmitted(false)
    setError(null)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const submitForm = async (formData: Record<string, string>, programName: string) => {
    setSubmitting(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('_subject', `[Parceria - ${programName}] ${formData.name || formData.company || 'Nova candidatura'}`)
      fd.append('_replyto', formData.email || '')
      fd.append('program', programName)
      fd.append('program_id', selectedProgram || '')
      fd.append('language', isEN ? 'EN' : 'PT')
      fd.append('submitted_at', new Date().toLocaleString('pt-PT'))
      Object.entries(formData).forEach(([k, v]) => { if (v) fd.append(k, v) })

      const r = await fetch('https://formspree.io/f/xeeyzlvb', { method: 'POST', headers: { Accept: 'application/json' }, body: fd })
      if (!r.ok) throw new Error('Erro no envio')

      if (isSupabaseConfigured) {
        try {
          await supabase.from('partnership_applications').insert({
            program: selectedProgram, program_name: programName, data: formData,
            language: isEN ? 'en' : 'pt', status: 'new',
          })
        } catch { /* silencioso */ }
      }

      awardKarma('partnership_apply')
      setSubmitted(true)
    } catch {
      setError(isEN ? 'Error submitting. Please try again or email us directly.' : 'Erro no envio. Tenta novamente ou envia email diretamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ padding: 'clamp(30px, 5vw, 80px) clamp(20px, 5vw, 60px)', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: 10 }}>{isEN ? 'Grow with us' : 'Cresce connosco'}</div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(32px, 5vw, 54px)', margin: '0 0 12px', fontWeight: 500 }}>
        {isEN ? 'Partnerships & ' : 'Parcerias & '}<em style={{ color: 'var(--gold)' }}>{isEN ? 'Collaborations' : 'Colaborações'}</em>.
      </h1>
      <p style={{ color: 'var(--fg-mute)', fontSize: 15, marginBottom: 40, maxWidth: 620, lineHeight: 1.6 }}>
        {isEN ? 'Karmic Node partners with artists, brands, and communities that share our vision: quality, sustainability, and Portuguese craftsmanship.' : 'A Karmic Node faz parceria com artistas, marcas e comunidades que partilham a nossa visão: qualidade, sustentabilidade e artesanato português.'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>
        {PROGRAMS.map(p => (
          <div key={p.id} style={{ padding: 26, background: selectedProgram === p.id ? 'rgba(176,141,87,.08)' : 'var(--bg-1)', border: '1px solid ' + (selectedProgram === p.id ? 'var(--gold)' : 'var(--border)'), display: 'flex', flexDirection: 'column', gap: 12, transition: 'all .3s' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ fontSize: 32 }}>{p.icon}</div>
              <div style={{ padding: '4px 10px', background: 'rgba(139,30,45,.15)', color: 'var(--bordo)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700, border: '1px solid rgba(139,30,45,.3)' }}>{p.highlight}</div>
            </div>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 20, fontWeight: 500, margin: 0 }}>{p.title}</h3>
            <p style={{ color: 'var(--fg-mute)', fontSize: 13, lineHeight: 1.6, flex: 1, margin: 0 }}>{p.desc}</p>
            <button onClick={() => selectProgram(p.id)} style={{ padding: '10px 16px', background: selectedProgram === p.id ? 'var(--gold)' : 'transparent', color: selectedProgram === p.id ? 'var(--bg)' : 'var(--gold)', border: '1px solid var(--gold-3)', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start', transition: 'all .2s' }}>{p.cta} →</button>
          </div>
        ))}
      </div>

      <div ref={formRef}>
        {selectedProgram && !submitted && (
          <PartnershipForm program={selectedProgram} programName={PROGRAMS.find(p => p.id === selectedProgram)?.title || ''} isEN={isEN} submitting={submitting} error={error} onSubmit={submitForm} />
        )}

        {submitted && (
          <div style={{ padding: 40, background: 'linear-gradient(135deg, rgba(139,30,45,.08), rgba(176,141,87,.15))', border: '2px solid var(--gold)', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✦</div>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 28, fontWeight: 500, margin: '0 0 12px', color: 'var(--gold)' }}>{isEN ? 'Application received!' : 'Candidatura recebida!'}</h3>
            <p style={{ color: 'var(--fg-dim)', fontSize: 14, marginBottom: 24, maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.6 }}>
              {isEN ? 'Thank you for your interest. Our team will review your application and respond within 3-5 business days.' : 'Obrigado pelo teu interesse. A nossa equipa vai analisar a candidatura e responder em 3-5 dias úteis.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => { setSubmitted(false); setSelectedProgram(null) }} style={{ padding: '12px 24px', background: 'transparent', color: 'var(--gold)', border: '1px solid var(--gold)', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{isEN ? '← Back to programs' : '← Voltar aos programas'}</button>
              <button onClick={() => setPage('home')} style={{ padding: '12px 24px', background: 'var(--gold)', color: 'var(--bg)', border: 'none', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{isEN ? 'Continue browsing →' : 'Continuar a explorar →'}</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 50, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        {[
          { icon: '⏱', title: isEN ? '3-5 days response' : 'Resposta em 3-5 dias', desc: isEN ? 'Every application reviewed personally by our team.' : 'Cada candidatura analisada pessoalmente pela nossa equipa.' },
          { icon: '🇵🇹', title: isEN ? 'Made in Portugal' : 'Feito em Portugal', desc: isEN ? 'Local production in Cartaxo, Ribatejo.' : 'Produção local no Cartaxo, Ribatejo.' },
          { icon: '🌱', title: isEN ? 'Sustainable focus' : 'Foco sustentável', desc: isEN ? 'Made-to-order, zero excess stock.' : 'Feito por encomenda, zero excesso de stock.' },
          { icon: '💎', title: isEN ? 'Quality first' : 'Qualidade primeiro', desc: isEN ? 'Premium materials & rigorous QA.' : 'Materiais premium e controlo rigoroso.' },
        ].map((f, i) => (
          <div key={i} style={{ padding: 20, background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
            <h4 style={{ fontFamily: 'var(--f-display)', fontSize: 15, margin: '0 0 6px', fontWeight: 600 }}>{f.title}</h4>
            <p style={{ color: 'var(--fg-mute)', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 40, padding: 30, background: 'linear-gradient(135deg, rgba(139,30,45,.08), rgba(176,141,87,.08))', border: '1px solid var(--gold-3)', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
        <h3 style={{ fontFamily: 'var(--f-display)', fontSize: 22, fontWeight: 500, margin: '0 0 10px' }}>{isEN ? 'Have something else in mind?' : 'Tens outra ideia em mente?'}</h3>
        <p style={{ color: 'var(--fg-mute)', fontSize: 14, marginBottom: 20, maxWidth: 500, margin: '0 auto 20px', lineHeight: 1.6 }}>{isEN ? 'Every great partnership starts with a conversation.' : 'Toda a grande parceria começa com uma conversa.'}</p>
        <a href="mailto:karmicnode@gmail.com" style={{ display: 'inline-block', padding: '12px 26px', background: 'var(--bordo)', color: '#fff', textDecoration: 'none', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 700, fontFamily: 'inherit' }}>karmicnode@gmail.com</a>
      </div>
    </div>
  )
}

// ─── PartnershipForm (dinâmico por programa) ───────────────────────────────
function PartnershipForm({ program, programName, isEN, submitting, error, onSubmit }: {
  program: string; programName: string; isEN: boolean; submitting: boolean; error: string | null
  onSubmit: (data: Record<string, string>, programName: string) => Promise<void>
}) {
  const [form, setForm] = useState<Record<string, string>>({})
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--fg)', padding: '12px 14px', fontSize: 13, marginBottom: 12, outline: 'none', fontFamily: 'inherit' }
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: 'var(--fg-mute)', fontWeight: 600, marginBottom: 6, marginTop: 4 }

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(form, programName) }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 30, background: 'var(--bg-1)', border: '1px solid var(--gold-3)' }}>
      <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: 8 }}>{isEN ? 'Application' : 'Candidatura'}</div>
      <h2 style={{ fontFamily: 'var(--f-display)', fontSize: 26, fontWeight: 500, margin: '0 0 24px' }}>{programName}</h2>

      {program === 'artist' && (
        <>
          <label style={labelStyle}>{isEN ? 'Artist name / Alias' : 'Nome de artista'} *</label>
          <input required style={inputStyle} type="text" value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder={isEN ? 'e.g., Ana Costa' : 'ex: Ana Costa'} />
          <label style={labelStyle}>Email *</label>
          <input required style={inputStyle} type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="tu@exemplo.com" />
          <label style={labelStyle}>Instagram / Portfolio URL *</label>
          <input required style={inputStyle} type="url" value={form.portfolio || ''} onChange={e => set('portfolio', e.target.value)} placeholder="https://instagram.com/... ou https://..." />
          <label style={labelStyle}>{isEN ? 'Art style / Medium' : 'Estilo / Meio artístico'} *</label>
          <select required style={{ ...inputStyle, cursor: 'pointer' }} value={form.style || ''} onChange={e => set('style', e.target.value)}>
            <option value="">{isEN ? 'Select...' : 'Seleciona...'}</option>
            <option value="illustration">{isEN ? 'Illustration' : 'Ilustração'}</option>
            <option value="photography">{isEN ? 'Photography' : 'Fotografia'}</option>
            <option value="graphic-design">{isEN ? 'Graphic Design' : 'Design Gráfico'}</option>
            <option value="painting">{isEN ? 'Painting' : 'Pintura'}</option>
            <option value="typography">{isEN ? 'Typography' : 'Tipografia'}</option>
            <option value="3d-digital">3D / Digital</option>
            <option value="mixed">{isEN ? 'Mixed media' : 'Técnica mista'}</option>
            <option value="other">{isEN ? 'Other' : 'Outro'}</option>
          </select>
          <label style={labelStyle}>{isEN ? 'Tell us about your art' : 'Fala-nos da tua arte'} *</label>
          <textarea required rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={form.message || ''} onChange={e => set('message', e.target.value)} placeholder={isEN ? "Style, inspiration, what you'd like to create with us..." : 'Estilo, inspiração, o que gostavas de criar connosco...'} />
        </>
      )}

      {program === 'corporate' && (
        <>
          <label style={labelStyle}>{isEN ? 'Company name' : 'Nome da empresa'} *</label>
          <input required style={inputStyle} type="text" value={form.company || ''} onChange={e => set('company', e.target.value)} placeholder="Karmic Corp, Lda" />
          <label style={labelStyle}>{isEN ? 'Contact person' : 'Pessoa de contacto'} *</label>
          <input required style={inputStyle} type="text" value={form.name || ''} onChange={e => set('name', e.target.value)} />
          <label style={labelStyle}>Email *</label>
          <input required style={inputStyle} type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
          <label style={labelStyle}>{isEN ? 'Phone' : 'Telefone'}</label>
          <input style={inputStyle} type="tel" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+351 ..." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>{isEN ? 'Products' : 'Produtos'} *</label>
              <select required style={{ ...inputStyle, cursor: 'pointer' }} value={form.product_type || ''} onChange={e => set('product_type', e.target.value)}>
                <option value="">{isEN ? 'Select...' : 'Seleciona...'}</option>
                <option value="tshirts">T-shirts</option>
                <option value="hoodies">Hoodies</option>
                <option value="polos">Polos</option>
                <option value="caps">{isEN ? 'Caps' : 'Bonés'}</option>
                <option value="totes">Tote bags</option>
                <option value="mixed">{isEN ? 'Mix / Uniform' : 'Misto / Uniforme'}</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>{isEN ? 'Quantity' : 'Quantidade'} *</label>
              <select required style={{ ...inputStyle, cursor: 'pointer' }} value={form.quantity || ''} onChange={e => set('quantity', e.target.value)}>
                <option value="">{isEN ? 'Select...' : 'Seleciona...'}</option>
                <option value="20-50">20-50</option>
                <option value="50-100">50-100</option>
                <option value="100-500">100-500</option>
                <option value="500-1000">500-1000</option>
                <option value="1000+">1000+</option>
              </select>
            </div>
          </div>
          <label style={labelStyle}>{isEN ? 'Deadline' : 'Prazo necessário'}</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.deadline || ''} onChange={e => set('deadline', e.target.value)}>
            <option value="">{isEN ? 'Flexible' : 'Flexível'}</option>
            <option value="1-week">{isEN ? '1 week (rush)' : '1 semana (urgente)'}</option>
            <option value="2-weeks">{isEN ? '2 weeks' : '2 semanas'}</option>
            <option value="1-month">{isEN ? '1 month' : '1 mês'}</option>
            <option value="2-months">{isEN ? '2+ months' : '2+ meses'}</option>
          </select>
          <label style={labelStyle}>{isEN ? 'Project details' : 'Detalhes do projeto'} *</label>
          <textarea required rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={form.message || ''} onChange={e => set('message', e.target.value)} placeholder={isEN ? 'Event, logo, colors, sizes needed...' : 'Evento, logo, cores, tamanhos necessários...'} />
        </>
      )}

      {program === 'affiliate' && (
        <>
          <label style={labelStyle}>{isEN ? 'Your name' : 'O teu nome'} *</label>
          <input required style={inputStyle} type="text" value={form.name || ''} onChange={e => set('name', e.target.value)} />
          <label style={labelStyle}>Email *</label>
          <input required style={inputStyle} type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
          <label style={labelStyle}>{isEN ? 'Main platform' : 'Plataforma principal'} *</label>
          <select required style={{ ...inputStyle, cursor: 'pointer' }} value={form.platform || ''} onChange={e => set('platform', e.target.value)}>
            <option value="">{isEN ? 'Select...' : 'Seleciona...'}</option>
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
            <option value="twitter">Twitter / X</option>
            <option value="blog">Blog / Website</option>
            <option value="podcast">Podcast</option>
            <option value="other">{isEN ? 'Other' : 'Outra'}</option>
          </select>
          <label style={labelStyle}>{isEN ? 'Profile URL' : 'URL do perfil'} *</label>
          <input required style={inputStyle} type="url" value={form.profile_url || ''} onChange={e => set('profile_url', e.target.value)} placeholder="https://instagram.com/..." />
          <label style={labelStyle}>{isEN ? 'Follower count' : 'Número de seguidores'} *</label>
          <select required style={{ ...inputStyle, cursor: 'pointer' }} value={form.audience || ''} onChange={e => set('audience', e.target.value)}>
            <option value="">{isEN ? 'Select...' : 'Seleciona...'}</option>
            <option value="under-1k">&lt; 1.000</option>
            <option value="1k-10k">1.000 - 10.000</option>
            <option value="10k-50k">10.000 - 50.000</option>
            <option value="50k-100k">50.000 - 100.000</option>
            <option value="100k+">100.000+</option>
          </select>
          <label style={labelStyle}>{isEN ? 'Preferred referral code' : 'Código de referência preferido'}</label>
          <input style={inputStyle} type="text" value={form.desired_code || ''} onChange={e => set('desired_code', e.target.value.toUpperCase().slice(0, 15))} placeholder={isEN ? 'e.g., ANA10' : 'ex: ANA10'} maxLength={15} />
          <label style={labelStyle}>{isEN ? 'Audience niche / About you' : 'Nicho de audiência / Sobre ti'} *</label>
          <textarea required rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.message || ''} onChange={e => set('message', e.target.value)} placeholder={isEN ? 'Fashion, sustainable lifestyle, art...' : 'Moda, lifestyle sustentável, arte...'} />
        </>
      )}

      {program === 'wholesale' && (
        <>
          <label style={labelStyle}>{isEN ? 'Business name' : 'Nome do negócio'} *</label>
          <input required style={inputStyle} type="text" value={form.company || ''} onChange={e => set('company', e.target.value)} />
          <label style={labelStyle}>{isEN ? 'Business type' : 'Tipo de negócio'} *</label>
          <select required style={{ ...inputStyle, cursor: 'pointer' }} value={form.business_type || ''} onChange={e => set('business_type', e.target.value)}>
            <option value="">{isEN ? 'Select...' : 'Seleciona...'}</option>
            <option value="retail">{isEN ? 'Retail store' : 'Loja retalho'}</option>
            <option value="online">{isEN ? 'Online shop' : 'Loja online'}</option>
            <option value="gift">{isEN ? 'Gift shop / Concept store' : 'Gift shop / Concept store'}</option>
            <option value="hotel">{isEN ? 'Hotel / Hospitality' : 'Hotel / Hospitalidade'}</option>
            <option value="museum">{isEN ? 'Museum / Cultural' : 'Museu / Cultural'}</option>
            <option value="other">{isEN ? 'Other' : 'Outro'}</option>
          </select>
          <label style={labelStyle}>{isEN ? 'Contact person' : 'Pessoa de contacto'} *</label>
          <input required style={inputStyle} type="text" value={form.name || ''} onChange={e => set('name', e.target.value)} />
          <label style={labelStyle}>Email *</label>
          <input required style={inputStyle} type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} />
          <label style={labelStyle}>NIF / VAT</label>
          <input style={inputStyle} type="text" value={form.tax_id || ''} onChange={e => set('tax_id', e.target.value)} placeholder="500 000 000" />
          <label style={labelStyle}>{isEN ? 'Country' : 'País'} *</label>
          <select required style={{ ...inputStyle, cursor: 'pointer' }} value={form.country || ''} onChange={e => set('country', e.target.value)}>
            <option value="">{isEN ? 'Select...' : 'Seleciona...'}</option>
            <option value="PT">Portugal</option>
            <option value="ES">Espanha</option>
            <option value="FR">França</option>
            <option value="DE">Alemanha</option>
            <option value="UK">United Kingdom</option>
            <option value="OTHER-EU">{isEN ? 'Other EU' : 'Outro UE'}</option>
            <option value="OTHER">{isEN ? 'Other' : 'Outro'}</option>
          </select>
          <label style={labelStyle}>{isEN ? 'Estimated monthly volume' : 'Volume mensal estimado'} *</label>
          <select required style={{ ...inputStyle, cursor: 'pointer' }} value={form.volume || ''} onChange={e => set('volume', e.target.value)}>
            <option value="">{isEN ? 'Select...' : 'Seleciona...'}</option>
            <option value="50-100">50-100 unidades</option>
            <option value="100-500">100-500 unidades</option>
            <option value="500-1000">500-1000 unidades</option>
            <option value="1000+">1000+ unidades</option>
          </select>
          <label style={labelStyle}>{isEN ? 'Additional info' : 'Informação adicional'}</label>
          <textarea rows={3} style={{ ...inputStyle, resize: 'vertical' }} value={form.message || ''} onChange={e => set('message', e.target.value)} placeholder={isEN ? 'Product interests, deadlines, delivery preferences...' : 'Produtos de interesse, prazos, preferências de entrega...'} />
        </>
      )}

      <div style={{ margin: '20px 0 24px', padding: 14, background: 'var(--bg-2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--fg-mute)', lineHeight: 1.5 }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
          <input required type="checkbox" checked={form.gdpr === 'yes'} onChange={e => set('gdpr', e.target.checked ? 'yes' : '')} style={{ marginTop: 2 }} />
          <span>
            {isEN ? 'I agree that my data will be processed by Karmic Node to evaluate this partnership application. Data will not be shared with third parties. See our ' : 'Concordo que os meus dados sejam processados pela Karmic Node para avaliar esta candidatura. Os dados não serão partilhados com terceiros. Ver '}
            <a href="/privacidade" style={{ color: 'var(--gold)' }}>{isEN ? 'Privacy Policy' : 'Política de Privacidade'}</a>.
          </span>
        </label>
      </div>

      {error && <div style={{ marginBottom: 16, padding: 12, background: 'rgba(139,30,45,.1)', border: '1px solid var(--bordo-3)', color: 'var(--bordo)', fontSize: 13 }}>⚠ {error}</div>}

      <button type="submit" disabled={submitting} style={{ width: '100%', padding: '14px', background: submitting ? 'var(--border)' : 'var(--bordo)', color: '#fff', border: 'none', fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase', fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
        {submitting ? (isEN ? 'Sending...' : 'A enviar...') : (isEN ? 'Submit application →' : 'Enviar candidatura →')}
      </button>
      <p style={{ marginTop: 14, textAlign: 'center', fontSize: 11, color: 'var(--fg-mute)' }}>{isEN ? "You'll receive a confirmation email within minutes." : 'Vais receber um email de confirmação em minutos.'}</p>
    </form>
  )
}

// ─── LegalPage (Privacidade / Termos / Cookies) ────────────────────────────
function LegalPage({ type }: { type: 'privacy' | 'terms' | 'cookies' }) {
  const { lang } = useLang()
  const isEN = lang === 'en'
  const titles: Record<string, { pt: string; en: string }> = {
    privacy: { pt: 'Política de Privacidade', en: 'Privacy Policy' },
    terms: { pt: 'Termos e Condições', en: 'Terms & Conditions' },
    cookies: { pt: 'Política de Cookies', en: 'Cookies Policy' },
  }
  const tt = titles[type]
  return (
    <div style={{ padding: 'clamp(30px, 5vw, 80px) clamp(20px, 5vw, 60px)', maxWidth: 800, margin: '0 auto', minHeight: '60vh' }}>
      <div style={{ fontSize: 10, letterSpacing: '.28em', textTransform: 'uppercase', color: 'var(--gold)', fontWeight: 700, marginBottom: 10 }}>Legal</div>
      <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(28px, 4vw, 44px)', margin: '0 0 20px' }}>{isEN ? tt.en : tt.pt}</h1>
      <div style={{ padding: '16px 20px', background: 'rgba(176,141,87,.08)', border: '1px solid var(--gold-3)', marginBottom: 30 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-dim)', lineHeight: 1.6 }}>
          {isEN
            ? '📋 This is a draft based on standard GDPR/Portugal templates. Before publishing in production, we recommend using iubenda.com or consulting a lawyer specialized in e-commerce/GDPR.'
            : '📋 Este é um draft baseado em templates padrão RGPD/Portugal. Antes de publicar em produção, recomendamos usar iubenda.com ou consultar um advogado especializado em e-commerce/RGPD.'}
        </p>
      </div>
      {type === 'privacy' && (
        <div style={{ color: 'var(--fg-dim)', fontSize: 14, lineHeight: 1.8 }}>
          <p><b style={{ color: 'var(--fg)' }}>{isEN ? 'Data controller:' : 'Responsável pelo tratamento:'}</b> Karmic Node, Cartaxo, Portugal.</p>
          <p>{isEN
            ? 'We collect data you provide directly (name, email, shipping/billing address, phone, payment processed by Stripe — we never store card numbers, custom designs, support messages) and data collected automatically (IP address, browser/device type, pages visited, referral source, cookies).'
            : 'Recolhemos dados que nos fornece diretamente (nome, email, morada de envio/faturação, telefone, pagamento processado pela Stripe — nunca armazenamos números de cartão, designs personalizados, mensagens de suporte) e dados recolhidos automaticamente (IP, tipo de browser/dispositivo, páginas visitadas, origem do tráfego, cookies).'}</p>
          <p>{isEN
            ? 'We use your data to process and deliver orders, manage the Karma Points program, send newsletters (only if subscribed), improve the site, prevent fraud, and comply with legal (tax/accounting) obligations.'
            : 'Usamos os seus dados para processar e entregar encomendas, gerir o programa Karma Points, enviar newsletter (só se subscrever), melhorar o site, prevenir fraude, e cumprir obrigações legais (fiscais, contabilísticas).'}</p>
          <p>{isEN
            ? 'Shared only with essential providers (Supabase, Stripe, Resend, Vercel, carriers). We never sell your data. You have the right to access, rectify, erase, port, object to, and limit processing of your data — write to karmicnode@gmail.com, we respond within 30 days.'
            : 'Partilhados apenas com prestadores essenciais (Supabase, Stripe, Resend, Vercel, transportadoras). Nunca vendemos os seus dados. Tem direito a aceder, retificar, apagar, portabilidade, opor-se e limitar o tratamento dos seus dados — escreva para karmicnode@gmail.com, respondemos em até 30 dias.'}</p>
          <p>{isEN
            ? 'Supervisory authority (Portugal): Comissão Nacional de Proteção de Dados (CNPD) — cnpd.pt.'
            : 'Autoridade de controlo (Portugal): Comissão Nacional de Proteção de Dados (CNPD) — cnpd.pt.'}</p>
        </div>
      )}
      {type === 'terms' && (
        <div style={{ color: 'var(--fg-dim)', fontSize: 14, lineHeight: 1.8 }}>
          <p>{isEN
            ? 'All prices include VAT (23%). Custom and made-to-order products are produced after payment confirmation. Delivery times are estimated, not guaranteed.'
            : 'Todos os preços incluem IVA (23%). Peças personalizadas e feitas sob encomenda são produzidas após pagamento confirmado. Prazos de entrega são estimados, não garantidos.'}</p>
          <p>{isEN
            ? 'Under Decree-Law 24/2014, you have the right to withdraw within 14 days without justification, except for custom/made-to-measure products and unsealed digital downloads.'
            : 'Conforme Decreto-Lei n.º 24/2014, tem direito a resolver o contrato em 14 dias sem justificação, exceto produtos personalizados (feitos sob medida) e downloads digitais desprecintados.'}</p>
          <p>{isEN
            ? 'Returns must be in original condition (unused, unwashed, with tags). Refunds processed within 14 days of receiving the returned product. Return shipping is the customer\'s responsibility unless the product is defective.'
            : 'Devoluções devem estar em condições originais (não usado, não lavado, com etiquetas). Reembolso processado em até 14 dias após receção do produto devolvido. Portes de devolução por conta do cliente, exceto se o produto for defeituoso.'}</p>
          <p>{isEN
            ? '2-year warranty against manufacturing defects (Law 84/2021). Karma Points have no direct monetary value and expire after 12 months of account inactivity. Gift cards are valid for 2 years and non-refundable.'
            : 'Garantia de 2 anos contra defeitos de fabrico (Lei n.º 84/2021). Karma Points não têm valor monetário direto e expiram após 12 meses de inatividade da conta. Gift Cards são válidos por 2 anos e não reembolsáveis.'}</p>
          <p>{isEN
            ? 'Portuguese law applies. Alternative dispute resolution: consumidor.gov.pt or the European ODR platform (ec.europa.eu/consumers/odr).'
            : 'Aplica-se a lei portuguesa. Resolução alternativa de litígios: consumidor.gov.pt ou plataforma ODR europeia (ec.europa.eu/consumers/odr).'}</p>
        </div>
      )}
      {type === 'cookies' && (
        <div style={{ color: 'var(--fg-dim)', fontSize: 14, lineHeight: 1.8 }}>
          <p>{isEN
            ? 'Essential cookies (no consent required): Supabase authentication (sb-access-token, sb-refresh-token), shopping cart, language and theme preferences.'
            : 'Cookies essenciais (não requerem consentimento): autenticação Supabase (sb-access-token, sb-refresh-token), carrinho de compras, preferências de idioma e tema.'}</p>
          <p>{isEN
            ? 'We do not use Google Analytics, Facebook Pixel, or third-party marketing/advertising cookies. You can manage cookie preferences in your browser settings at any time.'
            : 'Não usamos Google Analytics, Facebook Pixel, ou cookies de marketing/publicidade de terceiros. Pode gerir as preferências de cookies nas definições do seu browser em qualquer momento.'}</p>
        </div>
      )}
      <p style={{ color: 'var(--fg-mute)', fontSize: 14, lineHeight: 1.7, marginTop: 20 }}>
        {isEN ? 'For questions about privacy, terms or cookies, contact us at karmicnode@gmail.com.' : 'Para dúvidas sobre privacidade, termos ou cookies, contacte-nos em karmicnode@gmail.com.'}
      </p>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

// ─── URL Routing ────────────────────────────────────────────────────────
const PAGE_TO_PATH: Record<Page, string> = {
  home: '/',
  vestuario: '/vestuario',
  atelier: '/atelier',
  casa: '/casa',
  shop: '/loja',
  custom: '/personalizar',
  blog: '/blog',
  contact: '/contacto',
  about: '/sobre',
  product: '/produto',
  success: '/sucesso',
  login: '/entrar',
  account: '/conta',
  giftcards: '/gift-cards',
  privacidade: '/privacidade',
  termos: '/termos',
  cookies: '/cookies',
  faq: '/faq',
  envio: '/envio',
  devolucoes: '/devolucoes',
  garantia: '/garantia',
  parcerias: '/parcerias',
  admin: '/admin',
  vault: '/vault',
  stylist: '/estilista',
}
const PATH_TO_PAGE: Record<string, Page> = {
  '/': 'home',
  '/vestuario': 'vestuario',
  '/atelier': 'atelier',
  '/casa': 'casa',
  '/loja': 'shop',
  '/personalizar': 'custom',
  '/blog': 'blog',
  '/contacto': 'contact',
  '/sobre': 'about',
  '/sucesso': 'success',
  '/entrar': 'login',
  '/conta': 'account',
  '/gift-cards': 'giftcards',
  '/privacidade': 'privacidade',
  '/termos': 'termos',
  '/cookies': 'cookies',
  '/faq': 'faq',
  '/envio': 'envio',
  '/devolucoes': 'devolucoes',
  '/garantia': 'garantia',
  '/parcerias': 'parcerias',
  '/admin': 'admin',
  '/vault': 'vault',
  '/estilista': 'stylist',
}

export default function App() {
  const [lang, setLang] = useState<Lang>('pt')
  const t = createT(lang)
  const arr = (k: TKey) => getArr(lang, k)
  const [activePage, setActivePage] = useState<Page>('home')
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [shopFilter, setShopFilter] = useState('Todos')
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState<string | null>(null)
  const [backTop, setBackTop] = useState(false)
  const [liveProducts, setLiveProducts] = useState<Product[]>([...ALL_PRODUCTS])
  const [successSessionId, setSuccessSessionId] = useState<string | null>(null)
  const toastTimer = useRef<number | null>(null)
  const auth = useAuth()

  useEffect(() => {
    fetch('/api/products')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.products?.length) setLiveProducts(data.products) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const h = () => setBackTop(window.scrollY > 400)
    window.addEventListener('scroll', h)
    return () => window.removeEventListener('scroll', h)
  }, [])

  // Ler estado inicial da URL (uma vez, no primeiro render)
  useEffect(() => {
    const path = window.location.pathname
    const params = new URLSearchParams(window.location.search)

    // Success/cancel do Stripe
    const status = params.get('pagamento')
    const sid = params.get('session_id')
    if (status === 'sucesso') {
      setSuccessSessionId(sid)
      setActivePage('success')
      setCartItems([])
      window.history.replaceState({ page: 'success' }, '', '/sucesso')
      return
    } else if (status === 'cancelado') {
      setToast(t('payment_cancelled'))
      window.history.replaceState({ page: 'home' }, '', '/')
      return
    }

    // Product page: /produto/:sku
    if (path.startsWith('/produto/')) {
      const sku = decodeURIComponent(path.slice('/produto/'.length))
      const p = ALL_PRODUCTS.find(x => (x.sku || String(x.id)) === sku)
      if (p) {
        setActiveProduct(p)
        setActivePage('product')
        return
      }
    }

    // Rotas normais
    const page = PATH_TO_PAGE[path]
    if (page) {
      setActivePage(page)
    } else if (path !== '/') {
      window.history.replaceState({ page: 'home' }, '', '/')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Listener para back/forward do browser
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname
      if (path.startsWith('/produto/')) {
        const sku = decodeURIComponent(path.slice('/produto/'.length))
        const p = ALL_PRODUCTS.find(x => (x.sku || String(x.id)) === sku)
        if (p) { setActiveProduct(p); setActivePage('product'); return }
      }
      const page = PATH_TO_PAGE[path]
      if (page) {
        setActivePage(page)
        setActiveProduct(null)
      } else {
        setActivePage('home')
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((p: Page, filter?: string) => {
    setActivePage(p)
    setActiveProduct(null)
    if (p === 'shop' || p === 'vestuario' || p === 'atelier' || p === 'casa') setShopFilter(filter ?? 'Todos')
    // Atualizar URL
    const newPath = PAGE_TO_PATH[p] || '/'
    if (window.location.pathname !== newPath) {
      window.history.pushState({ page: p }, '', newPath)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const setPage = useCallback((p: Page) => navigate(p), [navigate])

  const openProduct = useCallback((p: Product) => {
    setActiveProduct(p)
    setActivePage('product')
    // URL /produto/{sku}
    const newPath = '/produto/' + encodeURIComponent(p.sku || String(p.id))
    if (window.location.pathname !== newPath) {
      window.history.pushState({ page: 'product', sku: p.sku }, '', newPath)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
    logLiveActivity('view', p.name)
  }, [])

  const addToCart = useCallback((p: Product) => {
    setCartItems(prev => {
      const ex = prev.find(i => i.id === p.id)
      return ex ? prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i) : [...prev, { ...p, qty: 1 }]
    })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast(p.name)
    toastTimer.current = window.setTimeout(() => setToast(null), 2400)
  }, [])

  const updateQty = useCallback((id: number, qty: number) => {
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }, [])

  const removeFromCart = useCallback((id: number) => {
    setCartItems(prev => prev.filter(i => i.id !== id))
  }, [])

  // Sincroniza a wishlist local (Set<number> por id) com a tabela Supabase
  // `wishlist` (product_sku) quando o utilizador inicia sessão.
  useEffect(() => {
    if (!auth.user || !isSupabaseConfigured) return
    supabase.from('wishlist').select('product_sku, product_id_local').eq('user_id', auth.user.id)
      .then(({ data }) => {
        if (!data) return
        const ids = data
          .map((r: any) => {
            if (typeof r.product_id_local === 'number') return r.product_id_local
            const p = liveProducts.find(x => x.sku === r.product_sku) || ALL_PRODUCTS.find(x => x.sku === r.product_sku)
            return p?.id
          })
          .filter((x: any): x is number => typeof x === 'number')
        setWishlist(prev => new Set([...prev, ...ids]))
      }, () => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user])

  const toggleWish = useCallback((id: number) => {
    const isRemoving = wishlist.has(id)
    setWishlist(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
    if (auth.user && isSupabaseConfigured) {
      const product = liveProducts.find(p => p.id === id) || ALL_PRODUCTS.find(p => p.id === id)
      const sku = product?.sku || String(id)
      if (isRemoving) {
        supabase.from('wishlist').delete().eq('user_id', auth.user.id).eq('product_sku', sku).then(() => {}, () => {})
      } else {
        supabase.from('wishlist').insert({ user_id: auth.user.id, product_sku: sku, product_id_local: id }).then(() => {}, () => {})
        awardKarma('wishlist_add')
      }
    }
  }, [auth.user, liveProducts, wishlist])

  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)

  const sharedProps = { onAdd: addToCart, onOpen: openProduct, wishlist, toggleWish, products: liveProducts }

  return (
    <LangContext.Provider value={{ lang, t, arr }}>
    <div style={{ background: 'var(--bg)', color: 'var(--fg)', minHeight: '100vh' }}>
      <Header activePage={activePage} navigate={navigate} cartCount={cartCount} openCart={() => setCartOpen(true)} lang={lang} setLang={setLang} auth={auth} />

      {activePage === 'home' && <HomePage {...sharedProps} setPage={setPage} />}
      {activePage === 'shop' && <ShopPage key={shopFilter} {...sharedProps} initialCategory={shopFilter} vertical="all" />}
      {activePage === 'vestuario' && <ShopPage key={'v-' + shopFilter} {...sharedProps} initialCategory={shopFilter} vertical="vestuario" />}
      {activePage === 'atelier' && <ShopPage key={'atl-' + shopFilter} {...sharedProps} initialCategory={shopFilter} vertical="atelier" />}
      {activePage === 'casa' && <ShopPage key={'casa-' + shopFilter} {...sharedProps} initialCategory={shopFilter} vertical="casa" />}
      {activePage === 'product' && activeProduct && (
        <ProductPage product={activeProduct} {...sharedProps} onBack={() => setPage(activeProduct.vertical === 'atelier' ? 'atelier' : activeProduct.vertical === 'casa' ? 'casa' : 'vestuario')} allProducts={liveProducts} auth={auth} />
      )}
      {activePage === 'contact' && <ContactPage />}
      {activePage === 'about' && <AboutPage setPage={setPage} />}
      {activePage === 'blog' && <BlogPage />}
      {activePage === 'custom' && <CustomizerV2 setPage={setPage} onAddToCart={(item) => { setCartItems(prev => [...prev, item]); setToast(item.name); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = window.setTimeout(() => setToast(null), 2400); }} />}
      {activePage === 'success' && <SuccessPage sessionId={successSessionId} setPage={setPage} />}
      {activePage === 'login' && <LoginPage setPage={setPage} auth={auth} />}
      {activePage === 'account' && <AccountPage auth={auth} setPage={setPage} allProducts={liveProducts} onOpen={openProduct} />}
      {activePage === 'giftcards' && <GiftCardsPage />}
      {activePage === 'privacidade' && <LegalPage type="privacy" />}
      {activePage === 'termos' && <LegalPage type="terms" />}
      {activePage === 'cookies' && <LegalPage type="cookies" />}
      {activePage === 'faq' && <HelpPage topic="faq" setPage={setPage} />}
      {activePage === 'envio' && <HelpPage topic="envio" setPage={setPage} />}
      {activePage === 'devolucoes' && <HelpPage topic="devolucoes" setPage={setPage} />}
      {activePage === 'garantia' && <HelpPage topic="garantia" setPage={setPage} />}
      {activePage === 'parcerias' && <PartnershipsPage setPage={setPage} />}
      {activePage === 'admin' && <AdminPanel auth={auth} setPage={setPage} />}
      {activePage === 'vault' && <VaultPage auth={auth} setPage={setPage} />}
      {activePage === 'stylist' && <StylistPage products={liveProducts} onOpen={openProduct} onAdd={addToCart} />}

      <Footer setPage={setPage} />

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} items={cartItems} updateQty={updateQty} remove={removeFromCart} />

      {toast && (
        <div className="kn-toast">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
          <span><b style={{ color: 'var(--fg)' }}>{toast.length > 30 ? toast.slice(0, 30) + '…' : toast}</b> {t('added_cart')}</span>
        </div>
      )}

      <button className={`kn-back-top ${backTop ? 'visible' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 15l-6-6-6 6" /></svg>
      </button>

      <PwaInstallPrompt />
      <KinChatWidget userId={auth.user?.id} />
      <LiveStorefrontFeed />
    </div>
    </LangContext.Provider>
  )
}




/// <reference types="vite/client" />

// Tipagem JSX para o custom element <model-viewer> (@google/model-viewer).
// Usado em Product3DViewer (src/App.tsx) para modelos .glb reais + AR.
// React 19 com o novo JSX transform (jsx: "react-jsx") resolve
// IntrinsicElements via `React.JSX` (namespace aninhado dentro do
// namespace ambiente global `React`, não um namespace `JSX` solto) — por
// isso o augmentation tem de entrar via `declare global { namespace React
// { namespace JSX {} } }`. Este ficheiro é tratado como um módulo (por
// causa do `import type`), pelo que sem `declare global` a fusão de
// declaração ficaria isolada e não afetaria o namespace React ambiente
// real vindo de @types/react.
import type * as ReactTypes from 'react'

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        'model-viewer': ReactTypes.DetailedHTMLProps<ReactTypes.HTMLAttributes<HTMLElement>, HTMLElement> & {
          src?: string
          alt?: string
          poster?: string
          'ios-src'?: string
          ar?: boolean
          'ar-modes'?: string
          'camera-controls'?: boolean
          'auto-rotate'?: boolean
          'shadow-intensity'?: string | number
          'shadow-softness'?: string | number
          exposure?: string | number
          'environment-image'?: string
          'skybox-image'?: string
          loading?: 'auto' | 'lazy' | 'eager'
          reveal?: 'auto' | 'interaction' | 'manual'
          'disable-zoom'?: boolean
          'camera-orbit'?: string
          'min-camera-orbit'?: string
          'max-camera-orbit'?: string
          'field-of-view'?: string
        }
      }
    }
  }
}

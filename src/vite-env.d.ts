/// <reference types="vite/client" />

// Tipagem JSX para o custom element <model-viewer> (@google/model-viewer).
// Usado em Product3DViewer (src/App.tsx) para modelos .glb reais + AR.
declare namespace JSX {
  interface IntrinsicElements {
    'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
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

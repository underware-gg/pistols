/// <reference types="vite/client" />

// Add GLSL shader file type declarations
declare module '*.glsl' {
  const content: string;
  export default content;
}

declare module '*.wgsl' {
  const content: string;
  export default content;
}

declare module '*.vert' {
  const content: string;
  export default content;
}

declare module '*.frag' {
  const content: string;
  export default content;
}

declare module '*.vs' {
  const content: string;
  export default content;
}

declare module '*.fs' {
  const content: string;
  export default content;
}

// PWA globals set by index.html
interface Window {
  __pwaIsMobile?: boolean
  __pwaIsStandalone?: boolean
}

// iOS 13+ DeviceOrientationEvent permission API
interface DeviceOrientationEvent {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>
}

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

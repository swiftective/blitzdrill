/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '@lichess-org/chessground' {
  export const Chessground: any;
}
declare module '@lichess-org/chessground/config' {
  export type Config = any;
}
declare module '@lichess-org/chessground/api' {
  export type Api = any;
}

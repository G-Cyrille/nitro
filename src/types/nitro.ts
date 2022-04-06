/* eslint-disable no-use-before-define */
import type { Preset as UnenvPreset } from 'unenv'
import type { Unimport, UnimportOptions } from 'unimport'
import type { PluginVisualizerOptions } from 'rollup-plugin-visualizer'
import type { NestedHooks, Hookable } from 'hookable'
import type { Consola, LogLevel } from 'consola'
import { WatchOptions } from 'chokidar'
import type { NodeExternalsOptions } from '../rollup/plugins/externals'
import type { StorageOptions } from '../rollup/plugins/storage'
import type { RollupConfig } from '../rollup/config'
import type { Options as EsbuildOptions } from '../rollup/plugins/esbuild'
import { NitroDevEventHandler, NitroEventHandler } from './handler'

export interface Nitro {
  options: NitroOptions,
  scannedHandlers: NitroEventHandler[],
  vfs: Record<string, string>
  hooks: Hookable<NitroHooks>
  unimport?: Unimport
  logger: Consola
  close: () => Promise<void>
}

type HookResult = void | Promise<void>
export interface NitroHooks {
  'nitro:document': (htmlTemplate: { src: string, contents: string, dst: string }) => HookResult
  'nitro:rollup:before': (nitro: Nitro) => HookResult
  'nitro:compiled': (nitro: Nitro) => HookResult
  'nitro:dev:reload': () => HookResult
  'close': () => HookResult
}

type DeepPartial<T> = T extends Record<string, any> ? { [P in keyof T]?: DeepPartial<T[P]> | T[P] } : T

export type NitroPreset = NitroConfig | ((input: NitroConfig) => NitroConfig)

export interface NitroConfig extends DeepPartial<NitroOptions> {
  extends?: string | string[] | NitroPreset
}

export interface NitroRouteOption {
  swr?: boolean | number
  redirect?: string
}

export interface NitroRoutesOptions {
  [path: string]: NitroRouteOption
}

export interface PublicAssetDir {
  baseURL?: string
  fallthrough?: boolean
  maxAge: number
  dir: string
}

export interface ServerAssetDir {
  baseName: string
  dir: string
}

export interface DevServerOptions {
  watch: string[]
}

export interface NitroOptions {
  // Internal
  _config: NitroConfig

  // General
  preset: string
  logLevel: LogLevel
  runtimeConfig: {
    nitro: {
      /** @deprecated Use top-level routes option! */
      routes: NitroRoutesOptions
      baseURL: string,
    }
    [key: string]: any
  }

  // Dirs
  rootDir: string
  srcDir: string
  scanDirs: string[]
  buildDir: string
  output: {
    dir: string
    serverDir: string
    publicDir: string
  }

  // Features
  storage: StorageOptions
  timing: boolean
  renderer: string
  serveStatic: boolean
  experimental?: {
    wasm?: boolean
  }
  serverAssets: ServerAssetDir[]
  publicAssets: PublicAssetDir[]
  autoImport: UnimportOptions

  // Dev
  dev: boolean
  devServer: DevServerOptions
  watchOptions: WatchOptions

  // Routing
  baseURL: string,
  handlers: NitroEventHandler[]
  routes: NitroRoutesOptions
  devHandlers: NitroDevEventHandler[]
  prerender: {
    crawlLinks: boolean
    routes: string[]
  }

  // Rollup
  rollupConfig?: RollupConfig
  entry: string
  unenv: UnenvPreset
  alias: Record<string, string>
  minify: boolean
  inlineDynamicImports: boolean
  sourceMap: boolean
  node: boolean
  moduleSideEffects: string[]
  esbuild?: {
    options?: EsbuildOptions
  }
  externals: boolean | NodeExternalsOptions
  analyze: false | PluginVisualizerOptions
  replace: Record<string, string | ((id: string) => string)>

  // Advanced
  hooks: NestedHooks<NitroHooks>
  nodeModulesDirs: string[]
  commands: {
    preview: string
    deploy: string
  }
}
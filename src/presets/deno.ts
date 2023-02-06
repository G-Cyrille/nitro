import { isAbsolute } from "node:path";
import { builtinModules } from "node:module";

import MagicString from "magic-string";
import { findStaticImports } from "mlly";
import inject from "@rollup/plugin-inject";
import { defineNitroPreset } from "../preset";

export const deno = defineNitroPreset({
  entry: "#internal/nitro/entries/deno-deploy",
  node: false,
  noExternals: true,
  serveStatic: "deno",
  commands: {
    preview: "",
    deploy:
      "cd ./ && deployctl deploy --project=<project_name> server/index.ts",
  },
  rollupConfig: {
    preserveEntrySignatures: false,
    // external: ["https://deno.land/std/http/server.ts"],
    output: {
      entryFileNames: "index.ts",
      manualChunks: () => "index",
      format: "esm",
    },
  },
});

export const denoServer = defineNitroPreset({
  extends: "node-server",
  entry: "#internal/nitro/entries/deno-server",
  commands: {
    preview:
      "deno run --unstable --allow-net --allow-read --allow-env ./server/index.mjs",
  },
  rollupConfig: {
    output: {
      hoistTransitiveImports: false,
    },
    plugins: [
      inject({
        modules: {
          process: "process",
          global: "global",
          Buffer: ["buffer", "Buffer"],
          setTimeout: ["timers", "setTimeout"],
          clearTimeout: ["timers", "clearTimeout"],
          setInterval: ["timers", "setInterval"],
          clearInterval: ["timers", "clearInterval"],
          setImmediate: ["timers", "setImmediate"],
          clearImmediate: ["timers", "clearImmediate"],
        },
      }),
      {
        name: "rollup-plugin-node-deno",
        resolveId(id) {
          id = id.replace("node:", "");
          if (builtinModules.includes(id)) {
            return {
              id: `node:${id}`,
              moduleSideEffects: false,
              external: true,
            };
          }
          if (isHTTPImport(id)) {
            return {
              id,
              external: true,
            };
          }
        },
        renderChunk(code) {
          const s = new MagicString(code);
          const imports = findStaticImports(code);
          for (const i of imports) {
            if (
              !i.specifier.startsWith(".") &&
              !isAbsolute(i.specifier) &&
              !isHTTPImport(i.specifier) &&
              !i.specifier.startsWith("npm:")
            ) {
              const specifier = i.specifier.replace("node:", "");
              s.replace(
                i.code,
                i.code.replace(
                  new RegExp(`(?<quote>['"])${i.specifier}\\k<quote>`),
                  JSON.stringify(
                    builtinModules.includes(specifier)
                      ? "node:" + specifier
                      : "npm:" + specifier
                  )
                )
              );
            }
          }
          if (s.hasChanged()) {
            return {
              code: s.toString(),
              map: s.generateMap({ includeContent: true }),
            };
          }
        },
      },
      {
        name: "inject-process",
        renderChunk: {
          order: "post",
          handler(code, chunk) {
            if (
              !chunk.isEntry ||
              code.includes("ROLLUP_NO_REPLACE") ||
              !code.includes("process")
            ) {
              return;
            }

            const s = new MagicString(code);
            s.prepend("import process from 'node:process';");

            return {
              code: s.toString(),
              map: s.generateMap({ includeContent: true }),
            };
          },
        },
      },
    ],
  },
});

const HTTP_IMPORT_RE = /^(https?:)?\/\//;

function isHTTPImport(id: string) {
  return HTTP_IMPORT_RE.test(id);
}

import * as esbuild from 'esbuild'
import fs from 'node:fs/promises'
import packJSON from "../package.json" with { type: "json"};

const version = packJSON.version
const now = new Date()

let results = await esbuild.build({
  entryPoints: ['testclient.cjs'],
  bundle: true,
  banner: {
    js: `/* wiki-client (test) - ${version} - ${now.toUTCString()} */`},
  minify: true,
  sourcemap: true,
  logLevel: 'info',
  outfile: 'client/test/testclient.cjs'
})

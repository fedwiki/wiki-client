import * as esbuild from 'esbuild'
import packJSON from '../package.json' with { type: 'json' }

const version = packJSON.version
const now = new Date()

await esbuild.build({
  entryPoints: ['testclient.js'],
  bundle: true,
  banner: {
    js: `/* wiki-client (test) - ${version} - ${now.toUTCString()} */`,
  },
  minify: true,
  sourcemap: true,
  logLevel: 'info',
  outfile: 'client/test/testclient.js',
})

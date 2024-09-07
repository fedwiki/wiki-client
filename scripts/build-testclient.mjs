import * as esbuild from 'esbuild'

let results = await esbuild.build({
  entryPoints: ['testclient.js'],
  bundle: true,
  logLevel: 'info',
  outfile: 'client/test/testclient.js'
})

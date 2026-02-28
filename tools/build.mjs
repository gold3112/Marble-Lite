import esbuild from 'esbuild';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const metaPath = join(__dirname, '../src/userscript.meta.js');
const meta = readFileSync(metaPath, 'utf8').match(/`([\s\S]*)`/)?.[1] || '';

const watch = process.argv.includes('--watch');

const baseConfig = {
  entryPoints: ['src/index.js'],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  banner: { js: meta },
  legalComments: 'none',
  charset: 'utf8',
};

async function buildOne(opts) {
  await esbuild.build({ ...baseConfig, ...opts });
}

if (watch) {
  const ctx = await esbuild.context({ ...baseConfig, outfile: 'dist/ml.user.js' });
  await ctx.watch();
  console.log('Watching...');
} else {
  await buildOne({ outfile: 'dist/ml.user.js', minify: false });
  await buildOne({ outfile: 'dist/ml-optimized.user.js', minify: true });
  console.log('Built ml.user.js and ml-optimized.user.js');
}

const esbuild = require('esbuild');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'out');
const outputFile = path.join(outputDir, 'mermaid-bundle.js');

esbuild.build({
  entryPoints: [path.join(__dirname, '..', 'node_modules', '@mermaid-chart', 'mermaid', 'dist', 'mermaid.min.js')],
  outfile: outputFile,
  bundle: true,
  minify: true,
  platform: 'browser',
  sourcemap: true,
}).then(() => {
  console.log('Mermaid has been bundled successfully into out/mermaid-bundle.js!');
}).catch((error) => {
  console.error('Error bundling Mermaid:', error);
  process.exit(1);
});

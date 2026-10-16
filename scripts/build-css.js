'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
let pkgJsonPath;

try {
  pkgJsonPath = require.resolve('tailwindcss/package.json', { paths: [root] });
} catch (error) {
  console.error('\n[LVS Bio] O pacote "tailwindcss" não está instalado nesta pasta.');
  console.error('Execute "npm install" dentro da pasta do projeto (onde está o package.json) e tente de novo.\n');
  process.exit(1);
}

const pkg = require(pkgJsonPath);
if (!pkg.bin) {
  console.error('\n[LVS Bio] Versão do tailwindcss sem CLI (' + pkg.version + '). Use a versão 3: npm install tailwindcss@3.4.17\n');
  process.exit(1);
}
const bin = typeof pkg.bin === 'string' ? pkg.bin : (pkg.bin.tailwindcss || Object.values(pkg.bin)[0]);
const cliPath = path.join(path.dirname(pkgJsonPath), bin);

const watch = process.argv.includes('--watch');
const args = [
  cliPath,
  '-i', path.join(root, 'src', 'input.css'),
  '-o', path.join(root, 'public', 'css', 'styles.css')
];
args.push(watch ? '--watch' : '--minify');

const result = spawnSync(process.execPath, args, { stdio: 'inherit', cwd: root });
process.exit(result.status === null ? 1 : result.status);

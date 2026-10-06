const { spawn } = require('node:child_process');
const args = process.argv.slice(2);
let port = '3002';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '-p' || args[i] === '--port') port = args[i + 1];
  else if (args[i].startsWith('--port=')) port = args[i].slice(7);
}
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error('Invalid development port');
if (!args.some(arg => arg === '-p' || arg === '--port' || arg.startsWith('--port='))) args.push('--port', port);
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', ...args], {
  stdio: 'inherit', env: { ...process.env, NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || `.next-development-${port}` },
});
child.on('exit', code => { process.exitCode = code ?? 1; });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });

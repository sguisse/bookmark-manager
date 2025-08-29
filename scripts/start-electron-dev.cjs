#!/usr/bin/env node
// Small helper to start vite dev server and then launch electron
const { spawn } = require('child_process');
const net = require('net');

const vite = spawn('npm', ['run', 'dev'], { stdio: 'inherit' });

// Wait for vite default port 5173 to be open
function waitForPort(port, host = '127.0.0.1', timeout = 20000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      const socket = net.createConnection(port, host);
      socket.on('connect', () => {
        socket.end();
        resolve();
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error('Timeout waiting for port ' + port));
        } else {
          setTimeout(check, 200);
        }
      });
    })();
  });
}

waitForPort(3000).then(() => {
  // Launch electron
  const electron = spawn('npx', ['electron', '.'], { stdio: 'inherit' });
  electron.on('close', (code) => process.exit(code));
}).catch((err) => {
  console.error('Failed to start electron dev:', err);
  process.exit(1);
});

const { copyFileSync, rmSync } = require('node:fs');

const browser = 'dist/photostream/browser';

copyFileSync(`${browser}/shell/index.html`, `${browser}/404.html`);
rmSync(`${browser}/shell`, { recursive: true });

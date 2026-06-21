// Runtime path alias registration for production build
// Maps @/* -> dist/* to resolve TypeScript path aliases at runtime
// Uses Node.js built-in Module hook — no external deps required
const Module = require('module');
const path = require('path');

const baseDir = path.join(__dirname, 'dist');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    const resolved = path.join(baseDir, request.slice(2));
    return originalResolveFilename.call(this, resolved, parent, isMain, options);
  }
  if (request.startsWith('src/')) {
    const resolved = path.join(baseDir, request.slice(4));
    return originalResolveFilename.call(this, resolved, parent, isMain, options);
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require('./dist/main');

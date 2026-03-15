/**
 * Resolve .js imports to .ts files for ts-node + tsconfig-paths
 * with nodenext module resolution.
 *
 * tsconfig-paths resolves aliases (e.g. @core/* → src/core/*) but
 * doesn't map .js → .ts. This hook adds that fallback.
 */
const Module = require('module');

const origResolveFilename = Module._resolveFilename;

Module._resolveFilename = function (request, parent, isMain, options) {
  try {
    return origResolveFilename.call(this, request, parent, isMain, options);
  } catch (err) {
    if (request.endsWith('.js')) {
      return origResolveFilename.call(
        this,
        request.slice(0, -3) + '.ts',
        parent,
        isMain,
        options,
      );
    }
    throw err;
  }
};

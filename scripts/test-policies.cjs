// Standalone TS/TSX test runner; no Next server or database is required.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..').replaceAll('\\', '/');
for (const extension of ['.ts', '.tsx']) {
    require.extensions[extension] = (module, filename) => {
        const source = fs.readFileSync(filename, 'utf8').replaceAll('"@/', `"${root}/`).replaceAll("'@/", `'${root}/`);
        const { outputText } = ts.transpileModule(source, {
            compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
        });
        module._compile(outputText, filename);
    };
}
require('../tests/policies.test.ts');

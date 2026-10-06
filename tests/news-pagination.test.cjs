const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const source = fs.readFileSync(path.join(__dirname, "../lib/news-categories.ts"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const moduleUnderTest = { exports: {} };
new Function("module", "exports", "URLSearchParams", compiled)(moduleUnderTest, moduleUnderTest.exports, URLSearchParams);
const { newsListingHref, newsPagination } = moduleUnderTest.exports;

test("the featured story counts toward the first page of ten", () => {
  assert.deepEqual(newsPagination(undefined, 21), { page: 1, pages: 3, from: 0, to: 9 });
  assert.deepEqual(newsPagination("2", 21), { page: 2, pages: 3, from: 10, to: 19 });
  assert.deepEqual(newsPagination("3", 21), { page: 3, pages: 3, from: 20, to: 29 });
});

test("invalid and out-of-range pages are clamped", () => {
  assert.deepEqual(newsPagination("999", 11), { page: 2, pages: 2, from: 10, to: 19 });
  assert.deepEqual(newsPagination("no", 0), { page: 1, pages: 1, from: 0, to: 9 });
});

test("pagination links keep the active category", () => {
  assert.equal(newsListingHref("ar", "project-news", 2), "/ar/news?category=project-news&page=2#news-list");
});

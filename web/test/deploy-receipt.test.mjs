import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const workflow=fs.readFileSync(new URL('../../.github/workflows/pages.yml',import.meta.url),'utf8');
test('Pages publishes exact SHA receipt',()=>{assert.match(workflow,/release\.json/);assert.match(workflow,/GITHUB_SHA/);assert.match(workflow,/r\.sha!==process\.env\.GITHUB_SHA/);});
test('deployment workflow uses current product name',()=>assert.match(workflow,/name: Deploy KONA/));

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('WHY route consumes canonical brand authorities', () => {
  const html = read('why.html');
  for (const href of ['brand/tokens.css','brand/themes.css','brand/artifacts.css','brand/typography.css','web/styles/components.css','web/styles/why.css']) {
    assert.ok(html.includes(href), `missing ${href}`);
  }
  assert.equal(/<style\b/i.test(html), false);
  assert.equal(/style="/i.test(html), false);
});

test('WHY route exposes all story depths and avoids private identity fields', () => {
  const source = read('web/src/why-story.js');
  for (const route of ["'short'","'scenic'","'unfiltered'","'final'"]) assert.ok(source.includes(route));
  assert.ok(source.includes('Finished enough to let you in.'));
  assert.ok(source.includes('One bike. One room. One road.'));
  assert.equal(/gmail|street address|phone number/i.test(source), false);
});

test('WHY stylesheet stays route scoped and token driven', () => {
  const css = read('web/styles/why.css');
  assert.ok(css.includes('.why-page'));
  assert.ok(css.includes('var(--brand-bg)'));
  assert.ok(css.includes('var(--brand-font-editorial)'));
  assert.ok(css.includes('var(--brand-font-hand)'));
  assert.equal(/:root\s*\{/.test(css), false);
});

test('canonical landing links to WHY route', () => {
  const template = read('web/landing.template.html');
  assert.ok(template.includes('href="why.html">Why this exists</a>'));
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { publicUrl } from '../src/public-url.ts';

test('assets and original case studies stay within the preview subpath', () => {
  assert.equal(publicUrl('/media/resume/resume.svg', '/preview-test/'), '/preview-test/media/resume/resume.svg');
  assert.equal(publicUrl('/archive/virtuosos.html', '/preview-test/'), '/preview-test/archive/virtuosos.html');
  assert.equal(publicUrl('/resume.pdf', '/'), '/resume.pdf');
});

test('external links, email, anchors, and relative links are preserved', () => {
  for (const path of ['https://example.com/a', '//example.com/a', 'mailto:hello@example.com', '#ask', 'images/a.png']) {
    assert.equal(publicUrl(path, '/preview-test/'), path);
  }
});

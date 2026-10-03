import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'site-dist');
const config = JSON.parse(await readFile(path.join(root, 'deployment.json'), 'utf8'));
const legacy = JSON.parse(await readFile(path.join(root, 'legacy-files.json'), 'utf8'));

if (!['legacy', 'next'].includes(config.homepage) || !/^preview-[a-f0-9]{24}$/.test(config.previewPath)) {
  throw new Error('Invalid homepage or preview path in deployment.json');
}

// Verify the original site before building or replacing any deployment output.
for (const [name, expected] of Object.entries(legacy.files)) {
  const bytes = await readFile(path.join(root, name));
  if (createHash('sha256').update(bytes).digest('hex') !== expected) {
    throw new Error(`Original site changed: ${name}. Restore it before deploying.`);
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const preview = path.join(output, config.previewPath);
await build({ configFile: path.join(root, 'next/vite.config.ts'), base: `/${config.previewPath}/`, build: { outDir: preview } });
const previewHtml = await readFile(path.join(preview, 'index.html'), 'utf8');
await writeFile(path.join(preview, 'index.html'), previewHtml.replace('<head>', '<head>\n    <meta name="robots" content="noindex, nofollow" />'));

if (config.homepage === 'next') {
  await build({ configFile: path.join(root, 'next/vite.config.ts'), base: '/', build: { outDir: output, emptyOutDir: false } });
}

const legacyDestination = config.homepage === 'legacy' ? output : path.join(output, 'previous');
for (const name of Object.keys(legacy.files)) {
  const destination = path.join(legacyDestination, name);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(root, name), destination);
}
await writeFile(path.join(output, '.nojekyll'), '');
console.log(`Original site verified (${Object.keys(legacy.files).length} files). Homepage: ${config.homepage}. Preview: /${config.previewPath}/`);

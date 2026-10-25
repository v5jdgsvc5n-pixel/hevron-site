// Gera o site em dist/ a partir das páginas em src/pages/*.dc.html.
// Cada página vira um HTML já renderizado (bom para o Google) e um pequeno
// script que deixa os botões, menus e formulários funcionando.
import fs from 'node:fs';
import path from 'node:path';
import { parse, serializeOuter } from 'parse5';
import { h } from 'preact';
import { renderToString } from 'preact-render-to-string';
import * as esbuild from 'esbuild';
import { DCLogic, makePage, defaultProps } from '../src/runtime.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const PAGES = path.join(ROOT, 'src/pages');
const DIST = path.join(ROOT, 'dist');
const SITE_URL = 'https://hevron.com.br';

// "reforma-casa.dc.html" → "/reforma-casa", "Main.dc.html" → "/"
function pageUrl(file) {
  const slug = file.replace(/\.dc\.html$/, '');
  return slug === 'Main' ? '/' : '/' + slug;
}
function outName(file) {
  const slug = file.replace(/\.dc\.html$/, '');
  return slug === 'Main' ? 'index.html' : slug + '.html';
}

// Ajusta links entre páginas e imagens do canvas para o site.
function rewrite(src) {
  return src
    .replace(/(["'(\s])\.?\/?([A-Za-z0-9_-]+)\.dc\.html/g, (_, pre, slug) => pre + pageUrl(slug + '.dc.html'))
    .replace(/\/_blob\/([a-f0-9]{32})/g, '/img/$1.jpg');
}

const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;

function splitHoles(text) {
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(HOLE)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ x: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function convertAttr(value) {
  const parts = splitHoles(value);
  if (parts.length === 1 && typeof parts[0] === 'object') return parts[0];
  if (parts.every((p) => typeof p === 'string')) return value;
  return parts;
}

function attrName(a) {
  return a.prefix ? `${a.prefix}:${a.name}` : a.name;
}

function convert(node) {
  if (node.nodeName === '#text') return splitHoles(node.value);
  if (node.nodeName === '#comment') return [];
  const kids = (node.content || node).childNodes || [];
  const c = kids.flatMap(convert);
  const attrs = Object.fromEntries((node.attrs || []).map((a) => [attrName(a), a.value]));
  if (node.tagName === 'sc-if') return [{ if: convertAttr(attrs.value), c }];
  if (node.tagName === 'sc-for') return [{ for: convertAttr(attrs.list), as: attrs.as, c }];
  const a = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('hint-')) continue;
    a[k === 'class' ? 'class' : k] = convertAttr(v);
  }
  return [{ t: node.tagName, a, c }];
}

function find(node, pred) {
  if (pred(node)) return node;
  for (const ch of node.childNodes || []) {
    const r = find(ch, pred);
    if (r) return r;
  }
  return null;
}

function textOf(node) {
  return (node.childNodes || []).map((n) => n.value || '').join('');
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

fs.rmSync(DIST, { recursive: true, force: true });
fs.cpSync(path.join(ROOT, 'public'), DIST, { recursive: true });
fs.mkdirSync(path.join(DIST, 'js'), { recursive: true });
const entriesDir = path.join(ROOT, '.build');
fs.rmSync(entriesDir, { recursive: true, force: true });
fs.mkdirSync(entriesDir, { recursive: true });

const files = fs.readdirSync(PAGES).filter((f) => f.endsWith('.dc.html')).sort();
const pages = [];

for (const file of files) {
  const raw = rewrite(fs.readFileSync(path.join(PAGES, file), 'utf8'));
  const doc = parse(raw);
  const html = find(doc, (n) => n.tagName === 'html');
  const lang = (html.attrs.find((a) => a.name === 'lang') || {}).value || 'pt-BR';
  const titleNode = find(doc, (n) => n.tagName === 'title');
  const title = titleNode ? textOf(titleNode) : 'Hevron';
  const xdc = find(doc, (n) => n.tagName === 'x-dc');
  const helmet = xdc.childNodes.find((n) => n.tagName === 'helmet');
  const headExtra = helmet
    ? helmet.childNodes.filter((n) => n.tagName).map((n) => serializeOuter(n)).join('\n')
    : '';
  const body = xdc.childNodes.filter((n) => n !== helmet);
  const tree = body.flatMap(convert);
  const script = find(doc, (n) => n.tagName === 'script' && n.attrs.some((a) => a.name === 'data-dc-script'));
  const logicSrc = textOf(script);
  const propsAttr = script.attrs.find((a) => a.name === 'data-props');
  const props = defaultProps(propsAttr ? JSON.parse(propsAttr.value) : {});

  // HTML pronto no servidor.
  const Logic = new Function('DCLogic', logicSrc + '\nreturn Component;')(DCLogic);
  const Page = makePage(tree, Logic);
  const appHtml = renderToString(h(Page, props));

  // Script do navegador.
  const slug = file.replace(/\.dc\.html$/, '');
  const entry = path.join(entriesDir, slug + '.js');
  fs.writeFileSync(entry, [
    `import { h, hydrate } from 'preact';`,
    `import { DCLogic, makePage } from '../src/runtime.js';`,
    `const tree = ${JSON.stringify(tree)};`,
    `const props = ${JSON.stringify(props)};`,
    `const Logic = (function (DCLogic) {\n${logicSrc}\nreturn Component;\n})(DCLogic);`,
    `hydrate(h(makePage(tree, Logic), props), document.getElementById('app'));`,
  ].join('\n'));

  const descMatch = /<p[^>]*>([^<]{60,300})<\/p>/.exec(appHtml);
  const description = descMatch ? descMatch[1].trim() : 'Hevron: reforma e construção com gestão completa da sua obra.';
  const url = SITE_URL + (pageUrl(file) === '/' ? '/' : pageUrl(file));

  const out = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon-v2.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${url}">
<meta property="og:locale" content="pt_BR">
${headExtra}
</head>
<body>
<div id="app">${appHtml}</div>
<script type="module" src="/js/${slug}.js"></script>
</body>
</html>
`;
  fs.writeFileSync(path.join(DIST, outName(file)), out);
  pages.push({ file, entry, url });
}

await esbuild.build({
  entryPoints: pages.map((p) => p.entry),
  bundle: true,
  minify: true,
  format: 'esm',
  splitting: true,
  outdir: path.join(DIST, 'js'),
  target: ['es2019'],
  logLevel: 'warning',
});

fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  pages.map((p) => `  <url><loc>${p.url}</loc></url>`).join('\n') + `\n</urlset>\n`);
fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`${pages.length} páginas geradas em dist/`);

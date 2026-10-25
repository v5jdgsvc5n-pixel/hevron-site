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
// ID do Google Analytics (começa com G-). Só carrega se o visitante aceitar os cookies.
const GA_ID = process.env.GA_ID || '';

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

// Menu do celular: três barrinhas ao lado do logo que abrem a lista de páginas.
const MOBILE_LINKS = [
  ['Reformar', [
    ['Reforma de casa', '/reforma-casa'], ['Reforma de apartamento', '/reforma-apartamento'],
    ['Reforma de cozinha', '/reforma-cozinha'], ['Reforma de banheiro', '/reforma-banheiro'],
    ['Áreas externas', '/reforma-areas-externas'], ['Pisos', '/reforma-pisos'],
    ['Pintura e revestimentos', '/reforma-pintura'], ['Elétrica e hidráulica', '/reforma-eletrica-hidraulica'],
    ['Eficiência energética', '/reforma-eficiencia-energetica'], ['Mármore', '/reforma-marmore'],
  ]],
  ['Construir', [
    ['Casa térrea', '/construir-casa-terrea'], ['Sobrado', '/construir-sobrado'],
    ['Casa de alto padrão', '/construir-alto-padrao'], ['Ampliação', '/construir-ampliacao'],
    ['Área de lazer e piscina', '/construir-area-lazer'], ['Imóvel comercial', '/construir-comercial'],
  ]],
  ['Projetos', '/projetos'],
  ['Como funciona', '/como-funciona'],
  ['Sobre nós', '/sobre-nos'],
  ['Seja parceiro', '/rede-parceiros'],
];

const BURGER_ICON = { t: 'svg', a: { width: '26', height: '26', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'aria-hidden': 'true' }, c: [
  { t: 'path', a: { class: 'hv-i-open', d: 'M4 7h16M4 12h16M4 17h16' }, c: [] },
  { t: 'path', a: { class: 'hv-i-close', d: 'M6 6l12 12M18 6L6 18' }, c: [] },
] };

function mobileMenuNodes(logoStyle) {
  const link = ([label, href]) => ({ t: 'a', a: { href }, c: [label] });
  const items = MOBILE_LINKS.map(([label, v]) => Array.isArray(v)
    ? { t: 'details', a: {}, c: [{ t: 'summary', a: {}, c: [label] }, { t: 'div', a: { class: 'hv-sub' }, c: v.map(link) }] }
    : link([label, v]));
  items.push({ t: 'a', a: { href: '/comecar-projeto', class: 'hv-cta' }, c: ['Começar meu projeto'] });
  const burgerStyle = Array.isArray(logoStyle) ? [...logoStyle] : [logoStyle || ''];
  burgerStyle.push('; display: none; background: transparent; border: 0; padding: 0; cursor: pointer; min-width: 44px; justify-content: center');
  return {
    burger: { t: 'button', a: { type: 'button', class: 'hv-burger', 'aria-label': 'Abrir menu', 'aria-expanded': 'false', style: burgerStyle }, c: [BURGER_ICON] },
    panel: { t: 'nav', a: { class: 'hv-mobile-menu', 'aria-label': 'Menu do celular' }, c: items },
  };
}

// Procura o cabeçalho com o menu principal e encaixa as barrinhas e o painel.
function addMobileMenu(tree) {
  let done = false;
  (function walk(nodes) {
    for (const n of nodes) {
      if (done || !n || typeof n !== 'object' || !n.c) continue;
      if (n.t === 'header') {
        const inner = n.c.find((k) => k.t === 'div');
        const navIdx = inner ? inner.c.findIndex((k) => k.t === 'nav' && k.a['aria-label'] === 'Menu principal') : -1;
        if (navIdx < 0) return;
        const logoIdx = inner.c.findIndex((k) => k.t === 'a');
        const actions = inner.c.slice(navIdx + 1).find((k) => k.t === 'div');
        if (actions) actions.a.class = 'hv-actions';
        inner.c[navIdx].a.class = 'hv-desktop-nav';
        const { burger, panel } = mobileMenuNodes(inner.c[logoIdx].a.style);
        inner.c.splice(logoIdx, 0, burger);
        inner.c.push(panel);
        done = true;
        return;
      }
      walk(n.c);
    }
  })(tree);
  return done;
}

const MOBILE_CSS = `<style>
.hv-mobile-menu{display:none}
@media (max-width: 900px){
  header .hv-desktop-nav, header .hv-actions{display:none !important}
  header .hv-burger{display:inline-flex !important; margin-left:-10px}
  header > div{gap:8px !important; flex-wrap:nowrap !important}
  .hv-burger .hv-i-close{display:none}
  html.hv-open .hv-burger .hv-i-open{display:none}
  html.hv-open .hv-burger .hv-i-close{display:inline}
  html.hv-open header{background:#FFFFFF !important; box-shadow:0 1px 0 #DED8CE !important}
  html.hv-open header .hv-burger, html.hv-open header a[aria-label^="Hevron"]{color:#1C1B19 !important}
  html.hv-open{overflow:hidden}
  html.hv-open .hv-mobile-menu{display:flex}
  .hv-mobile-menu{position:absolute; top:100%; left:0; right:0; height:calc(100vh - 80px); height:calc(100dvh - 80px); overflow-y:auto; background:#FFFFFF; flex-direction:column; padding:8px 24px 32px; box-sizing:border-box; font-family:Figtree,sans-serif; border-top:1px solid #DED8CE}
  .hv-mobile-menu > a, .hv-mobile-menu summary{display:flex; align-items:center; justify-content:space-between; min-height:56px; border-bottom:1px solid #EDE9E2; color:#1C1B19; text-decoration:none; font-size:19px; font-weight:500; cursor:pointer; list-style:none}
  .hv-mobile-menu summary::-webkit-details-marker{display:none}
  .hv-mobile-menu summary::after{content:""; width:9px; height:9px; border-right:2px solid currentColor; border-bottom:2px solid currentColor; transform:rotate(45deg); margin:0 4px 6px 0; transition:transform .2s}
  .hv-mobile-menu details[open] summary::after{transform:rotate(-135deg); margin-bottom:0}
  .hv-sub{display:flex; flex-direction:column; padding:4px 0 12px 16px; border-bottom:1px solid #EDE9E2}
  .hv-sub a{color:#3F3B35; text-decoration:none; font-size:17px; min-height:44px; display:flex; align-items:center}
  .hv-mobile-menu a.hv-cta{margin-top:24px; justify-content:center; background:#A84E28; color:#FFFFFF; border:0; border-radius:4px; font-weight:600; font-size:17px}
}
</style>`;

const MOBILE_JS = `<script>
document.addEventListener('click', function (e) {
  var root = document.documentElement;
  var b = e.target.closest && e.target.closest('.hv-burger');
  if (b) {
    var open = root.classList.toggle('hv-open');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    b.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  } else if (e.target.closest && e.target.closest('.hv-mobile-menu a')) {
    root.classList.remove('hv-open');
  }
});
</script>`;

// O aviso de cookies antigo (só na página inicial) dá lugar ao aviso de consentimento abaixo.
function removeOldCookieBanner(nodes) {
  return nodes.filter((n) => !(n && n.if && n.if.x === 'showCookies'))
    .map((n) => (n && typeof n === 'object' && n.c ? { ...n, c: removeOldCookieBanner(n.c) } : n));
}

const BTN = 'font: 600 15px Figtree, sans-serif; padding: 12px 18px; min-height: 44px; border: 1px solid #1C1B19; border-radius: 4px; cursor: pointer';
const CONSENT_HTML = `<div id="hv-consent" role="dialog" aria-label="Preferências de cookies" hidden style="position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 40; max-width: 560px; margin-left: auto; background: #FFFFFF; color: #1C1B19; border: 1px solid #DED8CE; border-radius: 8px; padding: 24px; box-sizing: border-box; flex-direction: column; gap: 14px; box-shadow: 0 8px 28px rgba(28,27,25,0.18); font-family: Figtree, sans-serif; line-height: 1.5">
<div style="font-weight: 600; font-size: 17px">Usamos cookies</div>
<p style="margin: 0; color: #5A564F; font-size: 15px">Alguns são necessários para o site funcionar. Com a sua permissão, usamos também o Google Analytics para medir a audiência e melhorar o site. <a href="/politica-de-privacidade#cookies" style="color: #1C1B19">Saiba mais</a></p>
<div class="hv-prefs" hidden style="border-top: 1px solid #EDE9E2; padding-top: 12px; font-size: 15px">
<label style="display: flex; gap: 12px; align-items: flex-start; min-height: 44px"><input type="checkbox" checked disabled style="width: 20px; height: 20px; margin: 2px 0 0; accent-color: #1C1B19"><span><strong>Necessários</strong><br><span style="color: #5A564F">Guardam a sua escolha sobre cookies. Sempre ativos.</span></span></label>
<label style="display: flex; gap: 12px; align-items: flex-start; min-height: 44px; margin-top: 8px; cursor: pointer"><input type="checkbox" id="hv-ga" style="width: 20px; height: 20px; margin: 2px 0 0; accent-color: #1C1B19"><span><strong>Medição de audiência</strong><br><span style="color: #5A564F">Google Analytics: quantas pessoas visitam e quais páginas mais acessam.</span></span></label>
</div>
<div style="display: flex; flex-wrap: wrap; gap: 10px">
<button type="button" data-hv-c="recusar" style="${BTN}; background: #FFFFFF; color: #1C1B19">Recusar tudo</button>
<button type="button" data-hv-c="personalizar" style="${BTN}; background: #FFFFFF; color: #1C1B19">Personalizar</button>
<button type="button" data-hv-c="salvar" hidden style="${BTN}; background: #FFFFFF; color: #1C1B19">Salvar escolha</button>
<button type="button" data-hv-c="aceitar" style="${BTN}; background: #1C1B19; color: #FFFFFF">Aceitar tudo</button>
</div>
</div>`;

const CONSENT_JS = `<script>
(function () {
  var KEY = 'hevron-consent', GA = ${JSON.stringify(GA_ID)};
  var box = document.getElementById('hv-consent');
  var prefs = box.querySelector('.hv-prefs'), ga = document.getElementById('hv-ga');
  var save = box.querySelector('[data-hv-c="salvar"]'), custom = box.querySelector('[data-hv-c="personalizar"]');
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function loadGA() {
    if (!GA || window.__hvGA) return;
    window.__hvGA = true;
    window['ga-disable-' + GA] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA;
    document.head.appendChild(s);
  }
  function stopGA() {
    if (GA) window['ga-disable-' + GA] = true;
    var host = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (/^_ga/.test(n)) ['', host, '.' + host].forEach(function (d) {
        document.cookie = n + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
      });
    });
  }
  function show(withPrefs) {
    ga.checked = get() === 'aceito';
    prefs.hidden = !withPrefs; save.hidden = !withPrefs; custom.hidden = !!withPrefs;
    box.hidden = false; box.style.display = 'flex';
  }
  function choose(v) {
    set(v);
    box.hidden = true; box.style.display = 'none';
    if (v === 'aceito') loadGA(); else stopGA();
  }
  box.addEventListener('click', function (e) {
    var b = e.target.closest('[data-hv-c]');
    if (!b) return;
    var a = b.getAttribute('data-hv-c');
    if (a === 'aceitar') choose('aceito');
    else if (a === 'recusar') choose('recusado');
    else if (a === 'personalizar') show(true);
    else if (a === 'salvar') choose(ga.checked ? 'aceito' : 'recusado');
  });
  document.addEventListener('click', function (e) {
    var l = e.target.closest && e.target.closest('a[href$="#cookies"]');
    if (!l || box.contains(l) || !/gerenciar/i.test(l.textContent)) return;
    e.preventDefault();
    show(true);
  });
  var c = get();
  if (c === 'aceito') loadGA(); else if (!c) show(false);
})();
</script>`;

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
  const tree = removeOldCookieBanner(body.flatMap(convert));
  const hasMobileMenu = addMobileMenu(tree);
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
${hasMobileMenu ? MOBILE_CSS : ''}
</head>
<body>
<div id="app">${appHtml}</div>
${hasMobileMenu ? MOBILE_JS : ''}
${CONSENT_HTML}
${CONSENT_JS}
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

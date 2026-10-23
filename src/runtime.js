// Interpreta o template de uma página (.dc.html convertido em árvore JSON)
// e gera elementos Preact. É usado tanto no build (HTML estático) quanto
// no navegador (para os botões, carrosséis e formulários funcionarem).
import { h, Component, Fragment } from 'preact';

// Nó da árvore:
//   string                       → texto fixo
//   { x: 'caminho' }             → buraco {{ caminho }} em texto
//   { t, a, c }                  → elemento (tag, atributos, filhos)
//   { if: valor, c }             → <sc-if value="{{…}}">
//   { for: lista, as, c }        → <sc-for list="{{…}}" as="…">
// Valores de atributo: string fixa, { x } (valor bruto) ou [partes] (texto interpolado).

function lookup(scope, path) {
  if (path === 'true') return true;
  if (path === 'false') return false;
  if (path === 'null') return null;
  if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
  const m = /^(['"])(.*)\1$/.exec(path);
  if (m) return m[2];
  let cur = scope;
  for (const key of path.split('.')) {
    if (cur == null) return undefined;
    cur = cur[key];
  }
  return cur;
}

function attrValue(v, scope) {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    return v.map((p) => {
      if (typeof p === 'string') return p;
      const r = lookup(scope, p.x);
      return r == null ? '' : String(r);
    }).join('');
  }
  return lookup(scope, v.x);
}

const TEXT_INPUTS = /^(text|email|tel|number|search|url|password|date|)$/;

function buildProps(node, scope) {
  const props = {};
  for (const name in node.a) {
    let val = attrValue(node.a[name], scope);
    let key = name;
    if (key === 'onchange') {
      // Mesmo comportamento do React: onChange dispara a cada tecla em campos de texto.
      const type = (node.a.type && typeof node.a.type === 'string') ? node.a.type : '';
      if (node.t === 'textarea' || (node.t === 'input' && TEXT_INPUTS.test(type))) key = 'oninput';
    }
    if (key === 'ref') { if (typeof val === 'function') props.ref = val; continue; }
    if (key.startsWith('on')) { if (typeof val === 'function') props[key] = val; continue; }
    if (val === undefined || val === null) continue;
    if (val === false && !key.startsWith('aria-')) continue;
    props[key] = val;
  }
  return props;
}

export function renderNodes(nodes, scope) {
  const out = [];
  for (const n of nodes) {
    const r = renderNode(n, scope);
    if (Array.isArray(r)) out.push(...r); else if (r != null) out.push(r);
  }
  return out;
}

function renderNode(n, scope) {
  if (typeof n === 'string') return n;
  if (n.x !== undefined) {
    const v = lookup(scope, n.x);
    return v == null ? '' : String(v);
  }
  if (n.if !== undefined) {
    return attrValue(n.if, scope) ? renderNodes(n.c, scope) : null;
  }
  if (n.for !== undefined) {
    const list = attrValue(n.for, scope) || [];
    return list.map((item, i) => h(Fragment, { key: i },
      ...renderNodes(n.c, Object.assign(Object.create(scope), { [n.as]: item, $index: i }))));
  }
  return h(n.t, buildProps(n, scope), ...renderNodes(n.c, scope));
}

// Classe base usada pelo código de cada página (class Component extends DCLogic).
export class DCLogic extends Component {}

export function makePage(tree, Logic) {
  return class Page extends Logic {
    componentDidMount() {
      if (super.componentDidMount) super.componentDidMount();
      // Lembra a escolha do aviso de cookies entre visitas.
      try { if (localStorage.getItem('hevron-cookies')) this.setState({ cookiesClosed: true }); } catch (e) { /* sem armazenamento */ }
    }
    componentDidUpdate(prevProps, prevState) {
      if (super.componentDidUpdate) super.componentDidUpdate(prevProps, prevState);
      if (this.state && this.state.cookiesClosed) {
        try { localStorage.setItem('hevron-cookies', '1'); } catch (e) { /* sem armazenamento */ }
      }
    }
    render() {
      const vals = this.renderVals ? this.renderVals() : {};
      return h(Fragment, null, ...renderNodes(tree, vals));
    }
  };
}

export function defaultProps(propsSpec) {
  const p = {};
  for (const k in propsSpec) {
    if (k.startsWith('$')) continue;
    if (propsSpec[k] && 'default' in propsSpec[k]) p[k] = propsSpec[k].default;
  }
  return p;
}

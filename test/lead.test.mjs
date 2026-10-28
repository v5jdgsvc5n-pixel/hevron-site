// Testa a função que recebe os formulários, sem chamar serviços de verdade.
import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/lead.js';

function call(body, env = {}) {
  const calls = [];
  global.fetch = async (url, opts) => { calls.push({ url, body: JSON.parse(opts.body) }); return { ok: true, status: 200, text: async () => '' }; };
  Object.assign(process.env, { SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '', RESEND_API_KEY: '', LEAD_EMAIL_TO: '' }, env);
  const res = { code: 0, data: null, headers: {}, status(c) { this.code = c; return this; }, json(d) { this.data = d; return this; }, setHeader(k, v) { this.headers[k] = v; } };
  return handler({ method: 'POST', body }, res).then(() => ({ res, calls }));
}

const ENV = { SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'k', RESEND_API_KEY: 'r', LEAD_EMAIL_TO: 'contato@hevron.com.br' };
const projeto = { tipo: 'projeto', nome: 'Maria Silva', email: 'maria@exemplo.com', telefone: '(43) 99999-0000', aceite: true, respostas: { 'O que você quer fazer?': 'Reformar um imóvel' } };

test('pedido de projeto válido é guardado e avisado por e-mail', async () => {
  const { res, calls } = await call(projeto, ENV);
  assert.equal(res.code, 200);
  assert.equal(calls.length, 2);
  const db = calls.find((c) => c.url.includes('/rest/v1/leads'));
  assert.equal(db.body.nome, 'Maria Silva');
  assert.equal(db.body.dados.respostas['O que você quer fazer?'], 'Reformar um imóvel');
  const mail = calls.find((c) => c.url.includes('resend'));
  assert.deepEqual(mail.body.to, ['contato@hevron.com.br']);
  assert.match(mail.body.html, /Maria Silva/);
});

test('HTML no nome não entra no e-mail', async () => {
  const { calls } = await call({ ...projeto, nome: '<b>Maria</b>' }, ENV);
  const mail = calls.find((c) => c.url.includes('resend'));
  assert.doesNotMatch(mail.body.html, /<b>Maria/);
});

test('telefone curto é recusado', async () => {
  const { res } = await call({ ...projeto, telefone: '123' }, ENV);
  assert.equal(res.code, 400);
});

test('robô que preenche o campo escondido é ignorado', async () => {
  const { res, calls } = await call({ ...projeto, site: 'spam' }, ENV);
  assert.equal(res.code, 200);
  assert.equal(calls.length, 0);
});

test('sem nenhum serviço configurado devolve erro', async () => {
  const { res } = await call(projeto);
  assert.equal(res.code, 500);
});

test('cadastro de parceiro sem e-mail é aceito', async () => {
  const { res, calls } = await call({ tipo: 'parceiro', nome: 'João Pedreiro', telefone: '43988887777', cidade: 'Londrina', especialidade: 'Alvenaria' }, ENV);
  assert.equal(res.code, 200);
  assert.equal(calls.find((c) => c.url.includes('/rest/v1/leads')).body.dados.cidade, 'Londrina');
});

test('origem do pedido é guardada, só com os campos conhecidos', async () => {
  const origem = { utm_source: 'google', utm_campaign: 'banheiro-londrina', gclid: 'abc', outro: 'x' };
  const { calls } = await call({ ...projeto, origem }, ENV);
  const db = calls.find((c) => c.url.includes('/rest/v1/leads'));
  assert.deepEqual(db.body.dados.origem, { utm_source: 'google', utm_campaign: 'banheiro-londrina', gclid: 'abc' });
});

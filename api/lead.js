// Recebe os formulários do site ("Começar meu projeto" e "Seja parceiro"),
// guarda o pedido no Supabase e avisa por e-mail.
//
// Variáveis de ambiente (configuradas na Vercel):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  → onde os pedidos ficam guardados
//   RESEND_API_KEY                           → envio do e-mail de aviso
//   LEAD_EMAIL_TO                            → quem recebe o aviso (ex.: contato@hevron.com.br)
//   LEAD_EMAIL_FROM                          → remetente (ex.: Site Hevron <site@hevron.com.br>)

const TIPOS = { projeto: 'Novo pedido de orçamento', parceiro: 'Novo cadastro de parceiro' };

function clean(v, max = 300) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function normalize(body) {
  const tipo = body.tipo === 'parceiro' ? 'parceiro' : 'projeto';
  const lead = {
    tipo,
    nome: clean(body.nome, 120),
    email: clean(body.email, 160).toLowerCase(),
    telefone: clean(body.telefone, 40),
    dados: {},
  };
  if (tipo === 'projeto') {
    const respostas = {};
    if (body.respostas && typeof body.respostas === 'object') {
      for (const [k, v] of Object.entries(body.respostas).slice(0, 20)) respostas[clean(k, 120)] = clean(v, 1500);
    }
    lead.dados = { respostas, aceita_dicas: !!body.dicas, aceite_privacidade: !!body.aceite };
  } else {
    lead.dados = {
      cidade: clean(body.cidade, 120),
      especialidade: clean(body.especialidade, 120),
      experiencia: clean(body.experiencia, 10),
      mensagem: clean(body.mensagem, 2000),
    };
  }
  return lead;
}

function validate(lead) {
  if (lead.nome.length < 3) return 'Nome inválido.';
  if (lead.telefone.replace(/\D/g, '').length < 10) return 'Telefone inválido.';
  if (lead.tipo === 'projeto' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return 'E-mail inválido.';
  return null;
}

async function saveToSupabase(lead) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;
  const r = await fetch(`${url.replace(/\/$/, '')}/rest/v1/leads`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ tipo: lead.tipo, nome: lead.nome, email: lead.email || null, telefone: lead.telefone, dados: lead.dados }),
  });
  if (!r.ok) {
    console.error('Supabase', r.status, await r.text());
    return false;
  }
  return true;
}

function emailHtml(lead) {
  const rows = [
    ['Nome', lead.nome],
    ['Telefone', lead.telefone],
    ['E-mail', lead.email || '(não informado)'],
  ];
  const extra = lead.tipo === 'projeto' ? lead.dados.respostas : lead.dados;
  for (const [k, v] of Object.entries(extra || {})) if (v) rows.push([k, v]);
  if (lead.tipo === 'projeto') rows.push(['Aceita receber dicas', lead.dados.aceita_dicas ? 'Sim' : 'Não']);
  const whats = lead.telefone.replace(/\D/g, '');
  return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1C1B19">
<h2 style="margin:0 0 16px">${escapeHtml(TIPOS[lead.tipo])}</h2>
<table cellpadding="6" style="border-collapse:collapse">
${rows.map(([k, v]) => `<tr><td style="color:#5A564F;vertical-align:top">${escapeHtml(k)}</td><td>${escapeHtml(v)}</td></tr>`).join('\n')}
</table>
<p style="margin-top:20px"><a href="https://wa.me/55${escapeHtml(whats.replace(/^55/, ''))}">Responder pelo WhatsApp</a></p>
</div>`;
}

async function sendEmail(lead) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_EMAIL_TO;
  if (!key || !to) return false;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.LEAD_EMAIL_FROM || 'Site Hevron <site@hevron.com.br>',
      to: to.split(',').map((s) => s.trim()),
      reply_to: lead.email || undefined,
      subject: `${TIPOS[lead.tipo]}: ${lead.nome}`,
      html: emailHtml(lead),
    }),
  });
  if (!r.ok) {
    console.error('Resend', r.status, await r.text());
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = null; }
  }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, erro: 'Pedido inválido.' });

  // Campo escondido: só robôs preenchem. Fingimos sucesso e descartamos.
  if (clean(body.site)) return res.status(200).json({ ok: true });

  const lead = normalize(body);
  const erro = validate(lead);
  if (erro) return res.status(400).json({ ok: false, erro });

  const [saved, mailed] = await Promise.all([
    saveToSupabase(lead).catch((e) => { console.error(e); return false; }),
    sendEmail(lead).catch((e) => { console.error(e); return false; }),
  ]);
  if (!saved && !mailed) return res.status(500).json({ ok: false, erro: 'Não foi possível registrar o pedido.' });
  return res.status(200).json({ ok: true });
}

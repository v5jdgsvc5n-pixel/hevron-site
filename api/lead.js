// Recebe os formulários do site ("Começar meu projeto" e "Seja parceiro"),
// guarda o pedido no Supabase e avisa por e-mail.
//
// Variáveis de ambiente (configuradas na Vercel):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  → onde os pedidos ficam guardados
//   RESEND_API_KEY                           → envio do e-mail de aviso
//   LEAD_EMAIL_TO                            → quem recebe o aviso (ex.: contato@hevron.com.br)
//   LEAD_EMAIL_FROM                          → remetente (ex.: Site Hevron <site@hevron.com.br>)
//
// Quem preenche o formulário com e-mail também recebe uma confirmação automática
// (precisa do domínio do remetente verificado no Resend).

const TIPOS = { projeto: 'Novo pedido de orçamento', parceiro: 'Novo cadastro de parceiro' };

function clean(v, max = 300) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// De onde a pessoa chegou ao site (anúncio, Google, Instagram…).
const ORIGEM_CAMPOS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'referrer', 'entrada'];

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
  const origem = {};
  if (body.origem && typeof body.origem === 'object') {
    for (const k of ORIGEM_CAMPOS) if (body.origem[k]) origem[k] = clean(body.origem[k], 300);
  }
  if (Object.keys(origem).length) lead.dados.origem = origem;
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

const ARVORES_IMG = 'https://hevron.com.br/img/email-arvores.jpg';

function primeiroNome(nome) {
  const n = nome.split(/\s+/)[0] || '';
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

// E-mail automático para quem preencheu o formulário.
function confirmacaoHtml(lead) {
  const nome = escapeHtml(primeiroNome(lead.nome));
  const projeto = lead.tipo === 'projeto';
  const P = 'margin:0 0 16px';
  const corpo = projeto
    ? `<p style="${P}">Obrigado por confiar à Hevron o primeiro passo do seu projeto.</p>
<p style="${P}">Toda obra começa com uma boa conversa. Em breve, um coordenador da nossa equipe vai entrar em contato para entender o que você imagina e apresentar os próximos passos.</p>
<p style="${P}">Desde o início, você terá clareza sobre o que será feito, quanto custa e quando cada fase acontece. E vai acompanhar tudo de perto, com registros de cada etapa, até a conclusão da obra.</p>`
    : `<p style="${P}">Obrigado pelo interesse em fazer parte da rede de profissionais da Hevron.</p>
<p style="${P}">Recebemos o seu cadastro. Nossa equipe vai conhecer o seu trabalho e entrar em contato em breve para conversar sobre as próximas obras na sua região.</p>`;
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#1C1B19;max-width:560px;margin:0 auto">
<p style="font-family:Georgia,serif;font-size:26px;margin:0 0 32px"><span style="color:#A84E28">H</span>evron</p>
<p style="${P}">Olá, ${nome}.</p>
${corpo}
<div style="background:#F2F0E5;border-radius:8px;margin:32px 0 0;padding:20px 20px 24px;text-align:center">
<img src="${ARVORES_IMG}" width="480" alt="Mudas crescendo até virar uma árvore" style="display:block;width:100%;max-width:480px;height:auto;margin:0 auto">
<p style="font-family:Georgia,serif;font-size:22px;line-height:1.3;margin:16px 0 8px">Cada obra entregue, duas árvores plantadas.</p>
<p style="margin:0;color:#5A564F">É o nosso jeito de devolver à cidade um pouco do que construímos nela.</p>
</div>
<p style="margin:32px 0 0">Até breve,<br>Equipe Hevron<br><span style="color:#5A564F">hevron.com.br</span></p>
<p style="color:#8A8377;font-size:12px;margin-top:32px">Você recebeu este e-mail porque preencheu um formulário em hevron.com.br. Se não foi você, pode ignorar esta mensagem.</p>
</div>`;
}

async function sendConfirmation(lead) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !lead.email) return false;
  const equipe = (process.env.LEAD_EMAIL_TO || '').split(',').map((s) => s.trim()).filter(Boolean);
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.LEAD_EMAIL_FROM || 'Site Hevron <site@hevron.com.br>',
      to: [lead.email],
      reply_to: equipe[0] || undefined,
      subject: lead.tipo === 'projeto'
        ? `${primeiroNome(lead.nome)}, o seu projeto chegou até nós`
        : `${primeiroNome(lead.nome)}, recebemos o seu cadastro na rede Hevron`,
      html: confirmacaoHtml(lead),
    }),
  });
  if (!r.ok) {
    console.error('Resend (confirmação)', r.status, await r.text());
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
    sendConfirmation(lead).catch((e) => { console.error(e); return false; }),
  ]);
  if (!saved && !mailed) return res.status(500).json({ ok: false, erro: 'Não foi possível registrar o pedido.' });
  return res.status(200).json({ ok: true });
}

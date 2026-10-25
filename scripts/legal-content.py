# Gera as páginas de Política de privacidade e Termos de uso no estilo
# documento: página branca, menu lateral e um resumo no topo com links
# para cada seção. Rodar: python3 scripts/legal-content.py
import pathlib
root = pathlib.Path(__file__).resolve().parent.parent / 'src/pages'

BLUE = '#1A4FBF'
H2 = 'margin: 48px 0 14px; font-weight: 700; font-size: 26px; line-height: 1.25; scroll-margin-top: 24px'
P = 'margin: 0 0 16px'
UL = 'margin: 0 0 16px; padding-left: 22px'

DOCS = [
    ('termos-de-uso', 'Termos de uso'),
    ('politica-de-privacidade', 'Política de privacidade'),
]

def p(t): return f'<p style="{P}">{t}</p>'
def ul(items): return f'<ul style="{UL}">' + ''.join(f'<li style="margin-bottom: 8px">{i}</li>' for i in items) + '</ul>'

def page(file, title, box_title, intro, sections):
    side = []
    for f, label in DOCS:
        if f == file:
            side.append(f'<span aria-current="page" style="color: #1C1B19; font-weight: 600">{label}</span>')
        else:
            side.append(f'<a href="{f}.dc.html" style="color: {BLUE}; text-decoration: none">{label}</a>')
    side.append(f'<a href="/politica-de-privacidade#cookies" style="color: {BLUE}; text-decoration: none">Gerenciar cookies</a>')
    side.append(f'<a href="Main.dc.html" style="color: {BLUE}; text-decoration: none">Voltar ao site</a>')
    summary = '\n'.join(
        f'<p style="margin: 22px 0 6px"><a href="#{sid}" style="color: {BLUE}; font-weight: 600; text-decoration: none">{t}</a></p>\n<p style="margin: 0">{resumo}</p>'
        for sid, t, resumo, _ in sections)
    body = '\n'.join(f'<h2 id="{sid}" style="{H2}">{t}</h2>\n' + '\n'.join(conteudo) for sid, t, _, conteudo in sections)
    return f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Hevron — {title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800&amp;family=DM+Serif+Display&amp;display=swap" rel="stylesheet">
<style>
body{{margin:0;background:#FFFFFF}}
.lg-wrap{{max-width:1320px;margin:0 auto;padding:28px 32px 80px;box-sizing:border-box}}
.lg-grid{{display:grid;grid-template-columns:240px minmax(0,1040px);gap:24px 72px;margin-top:40px}}
.lg-side{{display:flex;flex-direction:column;gap:18px;font-size:18px;position:sticky;top:24px;align-self:start}}
.lg-main a{{color:{BLUE}}}
@media (max-width: 860px){{
  .lg-wrap{{padding:20px 16px 64px}}
  .lg-grid{{grid-template-columns:1fr;margin-top:20px}}
  .lg-side{{position:static;flex-direction:row;flex-wrap:wrap;gap:10px 20px;font-size:16px;padding-bottom:16px;border-bottom:1px solid #E3E3E3}}
}}
</style>
</helmet>
<div style="font-family: Figtree, sans-serif; color: #1C1B19; background: #FFFFFF; font-size: 18px; line-height: 1.65; min-height: 100vh">
<div class="lg-wrap">
<a href="Main.dc.html" aria-label="Hevron, página inicial" style="display: inline-flex; align-items: center; text-decoration: none; color: #1C1B19; min-height: 44px">
<span style="font-family: 'DM Serif Display', serif; font-size: 34px; line-height: 1; letter-spacing: -0.01em"><span style="color: #D98A63">H</span>evron</span>
</a>
<div class="lg-grid">
<nav aria-label="Documentos" class="lg-side">
{chr(10).join(side)}
</nav>
<main class="lg-main">
<h1 style="margin: 0 0 20px; font-weight: 800; font-size: clamp(36px, 5vw, 60px); line-height: 1.08; letter-spacing: -0.02em">{title}</h1>
{chr(10).join(intro)}
<div style="background: #EEEEEE; border: 1px solid #9E9E9E; padding: 20px 24px 28px; margin: 28px 0 8px">
<h2 style="margin: 0; font-weight: 700; font-size: 26px; line-height: 1.25">{box_title}</h2>
<p style="margin: 18px 0 0">Este resumo ajuda você a encontrar cada parte do documento. Mesmo assim, leia o texto completo abaixo.</p>
{summary}
</div>
{body}
<p style="margin: 64px 0 0; padding-top: 20px; border-top: 1px solid #E3E3E3; font-size: 15px; color: #5A564F">Hevron · CNPJ 50.469.536/0001-29 · <a href="mailto:contato@hevron.com.br">contato@hevron.com.br</a></p>
</main>
</div>
</div>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":5000}}}}'>
class Component extends DCLogic {{
renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''

atual = p('<strong>Última atualização:</strong> 25 de outubro de 2026.')

priv = [
  ('responsavel', 'Quem é o responsável pelos seus dados', 'Quem cuida dos seus dados e como falar com a gente.', [
    p('Hevron, CNPJ 50.469.536/0001-29, é a controladora dos dados coletados neste site. Para qualquer assunto sobre os seus dados, fale com a gente pelo e-mail <a href="mailto:contato@hevron.com.br">contato@hevron.com.br</a> ou pelo WhatsApp <a href="https://wa.me/5543988712083" target="_blank" rel="noopener">(43) 98871-2083</a>.'),
  ]),
  ('dados', 'Quais dados coletamos', 'Os dados que você informa nos formulários do site.', [
    p('Coletamos apenas os dados que você mesmo informa nos formulários do site:'),
    ul([
      '<strong>Começar meu projeto:</strong> nome, e-mail, celular, CEP da obra e as respostas sobre o seu projeto (tipo de obra, imóvel, área, prazo, faixa de investimento e a descrição que você escrever).',
      '<strong>Seja parceiro:</strong> nome, telefone, cidade, especialidade, anos de experiência, e-mail (opcional) e a mensagem sobre o seu trabalho.',
    ]),
    p('Não pedimos documentos, dados bancários nem dados sensíveis pelo site.'),
  ]),
  ('uso', 'Para que usamos os seus dados', 'Por que precisamos dos seus dados e com qual base legal.', [
    ul([
      'Entrar em contato com você para entender o seu projeto, agendar a visita técnica e preparar o orçamento.',
      'Avaliar o cadastro de profissionais que querem fazer parte da nossa rede de parceiros.',
      'Enviar dicas e novidades sobre reforma e construção, somente se você marcar essa opção. Você pode pedir para parar de receber a qualquer momento.',
    ]),
    p('Usamos os seus dados com base no seu consentimento e para os procedimentos preliminares de um possível contrato que você mesmo pediu (art. 7º, incisos I e V, da LGPD).'),
  ]),
  ('compartilhamento', 'Com quem compartilhamos', 'Os serviços que ajudam o site a funcionar.', [
    p('Não vendemos nem alugamos os seus dados. Eles são compartilhados apenas com os serviços que fazem o site funcionar, que tratam os dados em nosso nome:'),
    ul([
      '<strong>Vercel:</strong> hospedagem do site.',
      '<strong>Supabase:</strong> armazenamento seguro dos pedidos enviados pelos formulários.',
      '<strong>Resend:</strong> envio do e-mail interno que nos avisa de cada novo pedido.',
      '<strong>Google Analytics:</strong> medição de audiência do site, somente se você aceitar (veja Cookies abaixo).',
    ]),
    p('Alguns desses serviços guardam dados em servidores fora do Brasil, com garantias de segurança compatíveis com a LGPD. Quando a sua obra for contratada, os dados necessários poderão ser compartilhados com os profissionais da equipe que vai executá-la.'),
  ]),
  ('prazo', 'Por quanto tempo guardamos', 'Quando os seus dados são apagados.', [
    p('Guardamos os seus dados enquanto forem necessários para atender o seu pedido. Se a obra não for contratada, apagamos os dados em até 2 anos após o último contato, a não ser que você peça antes. Dados de obras contratadas são guardados pelo prazo exigido pela legislação.'),
  ]),
  ('direitos', 'Os seus direitos', 'O que você pode pedir sobre os seus dados, e como.', [
    p('A qualquer momento você pode pedir para:'),
    ul(['confirmar se tratamos os seus dados e ter acesso a eles;', 'corrigir dados incompletos ou desatualizados;', 'apagar os seus dados ou revogar o seu consentimento;', 'saber com quem compartilhamos os seus dados.']),
    p('Basta escrever para <a href="mailto:contato@hevron.com.br">contato@hevron.com.br</a>. Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).'),
  ]),
  ('cookies', 'Cookies', 'Os cookies que usamos e como mudar a sua escolha.', [
    p('Cookies são pequenos arquivos que o site guarda no seu navegador. Usamos dois tipos:'),
    ul([
      '<strong>Necessários:</strong> guardam a sua escolha sobre cookies, para não perguntarmos de novo a cada página. Ficam sempre ativos.',
      '<strong>Medição de audiência (Google Analytics):</strong> nos mostram quantas pessoas visitam o site, de onde vêm e quais páginas mais acessam, de forma estatística. Só são ativados se você clicar em Aceitar ou ligar essa opção em Personalizar. Não usamos esses dados para publicidade.',
    ]),
    p('Você pode mudar sua escolha a qualquer momento pelo link <a href="#cookies">Gerenciar cookies</a>, que também fica no rodapé de todas as páginas. O Google Analytics é um serviço do Google, que pode tratar dados fora do Brasil; saiba mais na <a href="https://policies.google.com/privacy?hl=pt-BR" target="_blank" rel="noopener">política de privacidade do Google</a>.'),
  ]),
  ('seguranca', 'Segurança', 'Como protegemos os seus dados.', [
    p('O site usa conexão segura (HTTPS) e os pedidos ficam em um banco de dados com acesso restrito à equipe da Hevron.'),
  ]),
  ('mudancas', 'Mudanças nesta política', 'Como avisamos quando esta política muda.', [
    p('Podemos atualizar esta política. A data da última atualização fica sempre no topo desta página.'),
  ]),
]

termos = [
  ('sobre', 'Sobre o site', 'Quem somos e para que serve o site.', [
    p('O site apresenta os serviços de reforma e construção da Hevron, CNPJ 50.469.536/0001-29, e permite que você peça um orçamento ou se cadastre como profissional parceiro.'),
  ]),
  ('orcamentos', 'Orçamentos e informações', 'Como funcionam os valores e pedidos de orçamento.', [
    p('As informações, fotos e valores mostrados no site são ilustrativos e não constituem proposta comercial. Cada obra recebe um orçamento próprio, feito depois da visita técnica, e só é contratada com a assinatura de um contrato.'),
    p('Enviar o formulário "Começar meu projeto" não cria nenhuma obrigação de contratação para você nem para a Hevron.'),
  ]),
  ('parceiros', 'Cadastro de parceiros', 'O que vale para quem se cadastra como profissional.', [
    p('O cadastro na rede de profissionais não garante a contratação. Todos os parceiros passam por uma avaliação antes de participar de qualquer obra.'),
  ]),
  ('uso-adequado', 'Uso adequado', 'O que você se compromete a fazer ao usar o site.', [
    p('Você se compromete a informar dados verdadeiros e a não usar o site para enviar conteúdo ilegal, ofensivo ou mensagens automáticas.'),
  ]),
  ('propriedade', 'Propriedade intelectual', 'De quem são a marca, os textos e as imagens.', [
    p('Os textos, a marca Hevron, o logotipo e o layout do site pertencem à Hevron e não podem ser copiados sem autorização.'),
  ]),
  ('seus-dados', 'Seus dados', 'Onde ver como tratamos os seus dados.', [
    p('O tratamento dos dados que você informa no site está descrito na nossa <a href="/politica-de-privacidade">Política de privacidade</a>.'),
  ]),
  ('contato', 'Contato', 'Como tirar dúvidas sobre estes termos.', [
    p('Dúvidas sobre estes termos: <a href="mailto:contato@hevron.com.br">contato@hevron.com.br</a> ou WhatsApp <a href="https://wa.me/5543988712083" target="_blank" rel="noopener">(43) 98871-2083</a>.'),
  ]),
]

(root / 'politica-de-privacidade.dc.html').write_text(page(
    'politica-de-privacidade', 'Política de privacidade', 'O que tem nesta política?',
    [atual, p('Esta política explica quais dados pessoais a Hevron coleta pelo site hevron.com.br, por que coleta, com quem compartilha e como você pode exercer os seus direitos, de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD).')],
    priv))
(root / 'termos-de-uso.dc.html').write_text(page(
    'termos-de-uso', 'Termos de uso', 'O que tem nestes termos?',
    [atual, p('Ao usar o site hevron.com.br, você concorda com estes termos. Se não concordar, por favor não use o site.')],
    termos))
print('ok')

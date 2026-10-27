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

atual = p('<strong>Última atualização:</strong> 27 de outubro de 2026.')
EMAIL = '<a href="mailto:contato@hevron.com.br">contato@hevron.com.br</a>'
WHATS = '<a href="https://wa.me/5543988712083" target="_blank" rel="noopener">(43) 98871-2083</a>'

priv = [
  ('responsavel', 'Quem é o responsável pelos seus dados', 'Quem cuida dos seus dados e qual é o canal para falar com a gente.', [
    p('A Hevron, inscrita no CNPJ 50.469.536/0001-29, com atuação em Londrina (PR), é a <strong>controladora</strong> dos dados pessoais tratados neste site, ou seja, é quem decide como e por que eles são usados.'),
    p(f'<strong>Canal de atendimento ao titular:</strong> para qualquer assunto sobre os seus dados, inclusive para exercer os seus direitos, escreva para {EMAIL} ou chame no WhatsApp {WHATS}. Como agente de tratamento de pequeno porte, a Hevron não é obrigada a indicar um encarregado (Resolução CD/ANPD nº 2/2022), e este canal cumpre essa função.'),
  ]),
  ('dados', 'Quais dados coletamos', 'Os dados que você informa e os que o site registra automaticamente.', [
    p('<strong>Dados que você informa nos formulários:</strong>'),
    ul([
      '<strong>Começar meu projeto:</strong> nome, e-mail, celular, CEP da obra e as respostas sobre o seu projeto (tipo de obra, imóvel, área, prazo, faixa de investimento e a descrição que você escrever).',
      '<strong>Seja parceiro:</strong> nome, telefone, cidade, especialidade, anos de experiência, e-mail (opcional) e a mensagem sobre o seu trabalho.',
    ]),
    p('<strong>Dados registrados automaticamente:</strong>'),
    ul([
      '<strong>Registros de acesso:</strong> endereço IP, data e hora de cada acesso, registrados pelo serviço de hospedagem para segurança do site e porque a lei exige (Marco Civil da Internet, art. 15).',
      '<strong>Dados de navegação:</strong> páginas visitadas, tipo de aparelho e navegador, cidade aproximada e de onde você chegou ao site, coletados pelo Google Analytics <em>somente se você aceitar</em> os cookies de medição.',
    ]),
    p('Não pedimos documentos, dados bancários nem dados sensíveis (como saúde, religião ou origem racial) pelo site. Por favor, não escreva esse tipo de informação nos campos de texto livre.'),
  ]),
  ('uso', 'Para que usamos e com qual base legal', 'Cada uso dos seus dados e a regra da LGPD que o permite.', [
    p('Só usamos os seus dados para as finalidades abaixo. Cada uma tem uma base legal prevista no art. 7º da LGPD:'),
    ul([
      '<strong>Responder ao seu pedido, agendar a visita técnica e preparar o orçamento:</strong> procedimentos preliminares de um contrato que você mesmo pediu (art. 7º, V).',
      '<strong>Avaliar o cadastro de profissionais parceiros:</strong> procedimentos preliminares de um possível contrato com o profissional (art. 7º, V).',
      '<strong>Enviar dicas e novidades sobre reforma e construção:</strong> somente se você marcar essa opção, com base no seu consentimento (art. 7º, I). Você pode cancelar quando quiser.',
      '<strong>Medir a audiência do site com o Google Analytics:</strong> consentimento, dado no aviso de cookies (art. 7º, I).',
      '<strong>Guardar os registros de acesso:</strong> cumprimento de obrigação legal (art. 7º, II).',
      '<strong>Guardar documentos de obras contratadas e nos defender em processos:</strong> cumprimento de obrigação legal e exercício regular de direitos (art. 7º, II e VI).',
    ]),
    p('Não usamos os seus dados para tomar decisões automatizadas, não vendemos e não usamos para publicidade de terceiros.'),
  ]),
  ('obrigatorios', 'Dados obrigatórios', 'O que acontece se você não quiser informar algum dado.', [
    p('Nome, telefone e, no pedido de orçamento, e-mail são necessários para conseguirmos responder. Sem eles não é possível enviar o formulário, mas você pode falar com a gente direto pelo WhatsApp. Os demais campos são opcionais ou servem para entendermos melhor o seu projeto. Recusar os cookies de medição não muda nada no uso do site.'),
  ]),
  ('compartilhamento', 'Com quem compartilhamos', 'Os serviços que tratam dados em nosso nome.', [
    p('Não vendemos nem alugamos os seus dados. Eles são compartilhados apenas com os serviços abaixo, que atuam como <strong>operadores</strong>, ou seja, tratam os dados em nosso nome e seguindo as nossas instruções:'),
    ul([
      '<strong>Vercel</strong> (Estados Unidos): hospedagem do site e registros de acesso.',
      '<strong>Supabase</strong> (servidores em São Paulo, Brasil): armazenamento dos pedidos enviados pelos formulários.',
      '<strong>Resend</strong> (Estados Unidos): envio do e-mail interno que nos avisa de cada novo pedido.',
      '<strong>Zoho</strong>: caixa de e-mail onde recebemos esses avisos.',
      '<strong>Google Analytics</strong> (Google, Estados Unidos): medição de audiência, somente com o seu consentimento.',
    ]),
    p('Quando a sua obra for contratada, os dados necessários poderão ser compartilhados com os profissionais da equipe que vai executá-la. Também podemos ter de entregar dados a autoridades públicas quando houver ordem judicial ou obrigação legal.'),
  ]),
  ('internacional', 'Transferência internacional', 'Dados que podem ser tratados fora do Brasil.', [
    p('Alguns dos serviços acima ficam fora do Brasil, principalmente nos Estados Unidos. Por isso, parte dos seus dados pode ser transferida para lá, apenas para as finalidades descritas nesta política e pelo tempo indicado em "Por quanto tempo guardamos".'),
    p(f'Essas transferências seguem o art. 33 da LGPD: escolhemos fornecedores que adotam cláusulas contratuais e medidas de segurança compatíveis com a lei brasileira. Você pode pedir mais informações, inclusive sobre as garantias usadas, pelo {EMAIL}.'),
  ]),
  ('prazo', 'Por quanto tempo guardamos', 'Quando os seus dados são apagados.', [
    ul([
      '<strong>Pedidos de orçamento e cadastros de parceiros:</strong> enquanto forem necessários. Se não houver contratação, apagamos em até 2 anos após o último contato, ou antes, se você pedir.',
      '<strong>Obras contratadas:</strong> pelo prazo exigido pela legislação civil, fiscal e do consumidor.',
      '<strong>Registros de acesso:</strong> 6 meses, como exige o Marco Civil da Internet.',
      '<strong>Dados do Google Analytics:</strong> até 14 meses, depois são apagados automaticamente.',
      '<strong>Lista de dicas e novidades:</strong> até você cancelar.',
    ]),
  ]),
  ('direitos', 'Os seus direitos', 'O que você pode pedir sobre os seus dados (art. 18 da LGPD), e como.', [
    p('A qualquer momento, e sem custo, você pode pedir:'),
    ul([
      'confirmação de que tratamos os seus dados;',
      'acesso aos seus dados;',
      'correção de dados incompletos, inexatos ou desatualizados;',
      'anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desacordo com a LGPD;',
      'portabilidade dos dados a outro fornecedor;',
      'eliminação dos dados tratados com base no seu consentimento;',
      'informação sobre as entidades com quem compartilhamos os seus dados;',
      'informação sobre a possibilidade de não dar o consentimento e sobre as consequências disso;',
      'revogação do consentimento;',
      'revisão de decisões tomadas apenas de forma automatizada (hoje não tomamos esse tipo de decisão).',
    ]),
    p(f'Basta escrever para {EMAIL}. Podemos pedir uma confirmação de identidade para proteger os seus dados. Respondemos em até 15 dias. Se não ficar satisfeito, você pode reclamar à <a href="https://www.gov.br/anpd" target="_blank" rel="noopener">Autoridade Nacional de Proteção de Dados (ANPD)</a> ou a um órgão de defesa do consumidor.'),
  ]),
  ('cookies', 'Cookies', 'Os cookies que usamos e como mudar a sua escolha.', [
    p('Cookies são pequenos arquivos que o site guarda no seu navegador. Usamos dois tipos:'),
    ul([
      '<strong>Necessários:</strong> guardam a sua escolha sobre cookies, para não perguntarmos de novo a cada página. Ficam sempre ativos.',
      '<strong>Medição de audiência (Google Analytics):</strong> nos mostram quantas pessoas visitam o site, de onde vêm e quais páginas mais acessam, de forma estatística. Só são ativados se você clicar em Aceitar ou ligar essa opção em Personalizar. Não usamos esses dados para publicidade.',
    ]),
    p('Você pode mudar sua escolha a qualquer momento pelo link <a href="#cookies">Gerenciar cookies</a>, que também fica no rodapé de todas as páginas, ou apagando os cookies nas configurações do seu navegador. Saiba mais na <a href="https://policies.google.com/privacy?hl=pt-BR" target="_blank" rel="noopener">política de privacidade do Google</a>.'),
  ]),
  ('menores', 'Crianças e adolescentes', 'O site não é destinado a menores de 18 anos.', [
    p(f'O site e os formulários são destinados a maiores de 18 anos. Não coletamos de propósito dados de crianças e adolescentes. Se você souber que um menor nos enviou dados, avise pelo {EMAIL} que apagaremos.'),
  ]),
  ('seguranca', 'Segurança', 'Como protegemos os seus dados e o que fazemos em caso de incidente.', [
    p('O site usa conexão segura (HTTPS), os pedidos ficam em um banco de dados com acesso restrito à equipe da Hevron e as chaves de acesso não ficam expostas no site.'),
    p('Nenhum sistema é 100% seguro. Se acontecer um incidente de segurança que possa trazer risco ou dano relevante a você, comunicaremos a ANPD e os titulares afetados, como manda o art. 48 da LGPD.'),
  ]),
  ('mudancas', 'Mudanças nesta política', 'Como avisamos quando esta política muda.', [
    p('Podemos atualizar esta política para refletir mudanças no site ou na lei. A data da última atualização fica sempre no topo desta página. Se a mudança for importante, avisaremos no próprio site.'),
  ]),
]

termos = [
  ('sobre', 'Quem somos', 'A empresa responsável pelo site e como falar com ela.', [
    p(f'Este site é mantido pela Hevron, inscrita no CNPJ 50.469.536/0001-29, com atuação em Londrina (PR). Contato: {EMAIL} ou WhatsApp {WHATS}.'),
    p('O site apresenta os nossos serviços de reforma e construção e permite que você peça um orçamento ou se cadastre como profissional parceiro.'),
  ]),
  ('aceite', 'Aceitação destes termos', 'Ao usar o site, você concorda com estas regras.', [
    p('Ao usar o site, você declara que leu e concorda com estes termos e com a nossa <a href="/politica-de-privacidade">Política de privacidade</a>. Se não concordar, por favor não use o site. Para enviar formulários, você precisa ter 18 anos ou mais.'),
  ]),
  ('orcamentos', 'Orçamentos e informações', 'O que vale para fotos, valores e pedidos de orçamento.', [
    p('As informações, fotos, prazos e valores mostrados no site são ilustrativos e não constituem oferta ou proposta comercial. Cada obra recebe um orçamento próprio, feito depois da visita técnica, e só é contratada com a assinatura de um contrato, que terá as condições específicas do serviço.'),
    p('Enviar o formulário "Começar meu projeto" é gratuito e não cria obrigação de contratação para você nem para a Hevron.'),
  ]),
  ('parceiros', 'Cadastro de parceiros', 'O que vale para quem se cadastra como profissional.', [
    p('O cadastro na rede de profissionais é gratuito e não garante contratação nem cria vínculo de qualquer tipo com a Hevron. Todos os parceiros passam por uma avaliação antes de participar de qualquer obra, e as condições de cada trabalho são definidas em contrato próprio.'),
  ]),
  ('uso-adequado', 'Uso adequado', 'O que você se compromete a fazer ao usar o site.', [
    p('Você se compromete a:'),
    ul([
      'informar dados verdadeiros e seus, ou de quem autorizou você a informá-los;',
      'não enviar conteúdo ilegal, ofensivo, falso ou que viole direitos de terceiros;',
      'não usar robôs, envios automáticos ou qualquer meio que prejudique o funcionamento do site.',
    ]),
  ]),
  ('propriedade', 'Propriedade intelectual', 'De quem são a marca, os textos e as imagens.', [
    p('A marca Hevron, o logotipo, os textos e o layout do site pertencem à Hevron ou são usados com autorização, e são protegidos pela Lei de Direitos Autorais (Lei nº 9.610/1998) e pela Lei de Propriedade Industrial (Lei nº 9.279/1996). Não podem ser copiados ou usados para fins comerciais sem autorização por escrito.'),
  ]),
  ('links', 'Links para outros sites', 'Sobre WhatsApp, redes sociais e outros sites.', [
    p('O site tem links para serviços de terceiros, como WhatsApp, Instagram, Facebook e Pinterest. Ao clicar neles você sai do nosso site, e passam a valer os termos e as políticas de privacidade desses serviços.'),
  ]),
  ('responsabilidade', 'Disponibilidade e responsabilidade', 'O que garantimos e o que não podemos garantir.', [
    p('Trabalhamos para manter o site no ar e com informações corretas, mas ele pode ficar fora do ar por manutenção ou por falhas de terceiros. Nada nestes termos limita os direitos que você tem pelo Código de Defesa do Consumidor (Lei nº 8.078/1990).'),
  ]),
  ('seus-dados', 'Seus dados', 'Onde ver como tratamos os seus dados.', [
    p('O tratamento dos dados que você informa no site está descrito na nossa <a href="/politica-de-privacidade">Política de privacidade</a>, que faz parte destes termos.'),
  ]),
  ('mudancas', 'Mudanças nestes termos', 'Como avisamos quando estes termos mudam.', [
    p('Podemos atualizar estes termos. A data da última atualização fica sempre no topo desta página, e a versão publicada é a que vale a partir dessa data.'),
  ]),
  ('lei', 'Lei aplicável e foro', 'Qual lei vale e onde resolver eventuais conflitos.', [
    p(f'Estes termos seguem as leis brasileiras. Antes de qualquer medida, fale com a gente pelo {EMAIL} para tentarmos resolver. Se você for consumidor, eventuais conflitos podem ser levados ao foro da sua cidade; nos demais casos, fica eleito o foro da comarca de Londrina (PR).'),
  ]),
]

(root / 'politica-de-privacidade.dc.html').write_text(page(
    'politica-de-privacidade', 'Política de privacidade', 'O que tem nesta política?',
    [atual, p('Esta política explica quais dados pessoais a Hevron coleta pelo site hevron.com.br, por que coleta, com quem compartilha e como você pode exercer os seus direitos, de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD).')],
    priv))
(root / 'termos-de-uso.dc.html').write_text(page(
    'termos-de-uso', 'Termos de uso', 'O que tem nestes termos?',
    [atual, p('Estes termos explicam as regras para usar o site hevron.com.br. Leia com atenção antes de enviar um formulário.')],
    termos))
print('ok')

# Gera as páginas de Política de privacidade e Termos de uso a partir do
# cabeçalho e rodapé da página Sobre nós. Rodar: python3 scripts/legal-content.py
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / 'src/pages'
base = (root / 'sobre-nos.dc.html').read_text()
start = base.index('<!-- Topo -->')
end = base.index('<!-- Rodapé -->')

H2 = 'margin: 40px 0 12px; font-family: \'Bricolage Grotesque\', sans-serif; font-weight: 700; font-size: 26px; line-height: 1.2; letter-spacing: -0.01em'
P = 'margin: 0 0 14px; color: #3F3B35'
UL = 'margin: 0 0 14px; padding-left: 22px; color: #3F3B35'

def page(title, h1, intro, body):
    hero = f'''<!-- Topo -->
<section ref="{{{{heroRef}}}}" style="position: relative; display: flex; align-items: flex-end; color: #FFFFFF; background: #1C1B19">
<div style="position: relative; max-width: 1240px; width: 100%; margin: 0 auto; padding: 170px 24px 64px; box-sizing: border-box; display: flex; flex-direction: column; gap: 20px">
<nav aria-label="Você está em" style="font-size: 15px; color: #EDE9E2; display: flex; flex-wrap: wrap; gap: 8px; align-items: center"><a href="Main.dc.html" style="color: #EDE9E2">Início</a><span aria-hidden="true">/</span><span>{h1}</span></nav>
<h1 style="margin: 0; font-family: 'Bricolage Grotesque', sans-serif; font-weight: 800; font-size: clamp(36px, 5vw, 60px); line-height: 1.05; letter-spacing: -0.03em">{h1}</h1>
<p style="margin: 0; font-size: 18px; color: #EDE9E2; max-width: 720px">{intro}</p>
</div>
</section>

<!-- Conteúdo -->
<section>
<div style="max-width: 820px; margin: 0 auto; padding: 56px 24px 96px; box-sizing: border-box">
{body}
</div>
</section>

'''
    s = base[:start] + hero + base[end:]
    s = s.replace('<a href="sobre-nos.dc.html" aria-current="page" style="text-decoration: none; color: {{navColor}}; box-shadow: inset 0 -2px 0 #D98A63; ', '<a href="sobre-nos.dc.html" style="text-decoration: none; color: {{navColor}}; ')
    s = re.sub(r'<title>.*?</title>', f'<title>Hevron — {title}</title>', s)
    return s

def h2(t, id=None):
    return f'<h2{f" id=\"{id}\"" if id else ""} style="{H2}">{t}</h2>'
def p(t): return f'<p style="{P}">{t}</p>'
def ul(items): return f'<ul style="{UL}">' + ''.join(f'<li style="margin-bottom: 6px">{i}</li>' for i in items) + '</ul>'

atual = p('<strong>Última atualização:</strong> 25 de outubro de 2026.')

priv = '\n'.join([
  atual,
  p('Esta política explica quais dados pessoais a Hevron coleta pelo site hevron.com.br, por que coleta, com quem compartilha e como você pode exercer os seus direitos, de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018, LGPD).'),
  h2('Quem é o responsável pelos seus dados'),
  p('Hevron, CNPJ 50.469.536/0001-29, é a controladora dos dados coletados neste site. Para qualquer assunto sobre os seus dados, fale com a gente pelo e-mail <a href="mailto:contato@hevron.com.br">contato@hevron.com.br</a> ou pelo WhatsApp <a href="https://wa.me/5543988712083" target="_blank" rel="noopener">(43) 98871-2083</a>.'),
  h2('Quais dados coletamos'),
  p('Coletamos apenas os dados que você mesmo informa nos formulários do site:'),
  ul([
    '<strong>Começar meu projeto:</strong> nome, e-mail, celular, CEP da obra e as respostas sobre o seu projeto (tipo de obra, imóvel, área, prazo, faixa de investimento e a descrição que você escrever).',
    '<strong>Seja parceiro:</strong> nome, telefone, cidade, especialidade, anos de experiência, e-mail (opcional) e a mensagem sobre o seu trabalho.',
  ]),
  p('Não pedimos documentos, dados bancários nem dados sensíveis pelo site.'),
  h2('Para que usamos os seus dados'),
  ul([
    'Entrar em contato com você para entender o seu projeto, agendar a visita técnica e preparar o orçamento.',
    'Avaliar o cadastro de profissionais que querem fazer parte da nossa rede de parceiros.',
    'Enviar dicas e novidades sobre reforma e construção, somente se você marcar essa opção. Você pode pedir para parar de receber a qualquer momento.',
  ]),
  p('Usamos os seus dados com base no seu consentimento e para os procedimentos preliminares de um possível contrato que você mesmo pediu (art. 7º, incisos I e V, da LGPD).'),
  h2('Com quem compartilhamos'),
  p('Não vendemos nem alugamos os seus dados. Eles são compartilhados apenas com os serviços que fazem o site funcionar, que tratam os dados em nosso nome:'),
  ul([
    '<strong>Vercel:</strong> hospedagem do site.',
    '<strong>Supabase:</strong> armazenamento seguro dos pedidos enviados pelos formulários.',
    '<strong>Resend:</strong> envio do e-mail interno que nos avisa de cada novo pedido.',
    '<strong>Google Analytics:</strong> medição de audiência do site, somente se você aceitar (veja Cookies abaixo).',
  ]),
  p('Alguns desses serviços guardam dados em servidores fora do Brasil, com garantias de segurança compatíveis com a LGPD. Quando a sua obra for contratada, os dados necessários poderão ser compartilhados com os profissionais da equipe que vai executá-la.'),
  h2('Por quanto tempo guardamos'),
  p('Guardamos os seus dados enquanto forem necessários para atender o seu pedido. Se a obra não for contratada, apagamos os dados em até 2 anos após o último contato, a não ser que você peça antes. Dados de obras contratadas são guardados pelo prazo exigido pela legislação.'),
  h2('Os seus direitos'),
  p('A qualquer momento você pode pedir para:'),
  ul(['confirmar se tratamos os seus dados e ter acesso a eles;', 'corrigir dados incompletos ou desatualizados;', 'apagar os seus dados ou revogar o seu consentimento;', 'saber com quem compartilhamos os seus dados.']),
  p('Basta escrever para <a href="mailto:contato@hevron.com.br">contato@hevron.com.br</a>. Respondemos em até 15 dias. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).'),
  h2('Cookies', 'cookies'),
  p('Cookies são pequenos arquivos que o site guarda no seu navegador. Usamos dois tipos:'),
  ul([
    '<strong>Necessários:</strong> guardam a sua escolha sobre cookies, para não perguntarmos de novo a cada página. Ficam sempre ativos.',
    '<strong>Medição de audiência (Google Analytics):</strong> nos mostram quantas pessoas visitam o site, de onde vêm e quais páginas mais acessam, de forma estatística. Só são ativados se você clicar em Aceitar ou ligar essa opção em Personalizar. Não usamos esses dados para publicidade.',
  ]),
  p('Você pode mudar sua escolha a qualquer momento pelo link <a href="#cookies" >Gerenciar cookies</a>, que também fica no rodapé de todas as páginas. O Google Analytics é um serviço do Google, que pode tratar dados fora do Brasil; saiba mais na <a href="https://policies.google.com/privacy?hl=pt-BR" target="_blank" rel="noopener">política de privacidade do Google</a>.'),
  h2('Segurança'),
  p('O site usa conexão segura (HTTPS) e os pedidos ficam em um banco de dados com acesso restrito à equipe da Hevron.'),
  h2('Mudanças nesta política'),
  p('Podemos atualizar esta política. A data da última atualização fica sempre no topo desta página.'),
])

termos = '\n'.join([
  atual,
  p('Ao usar o site hevron.com.br, você concorda com estes termos. Se não concordar, por favor não use o site.'),
  h2('Sobre o site'),
  p('O site apresenta os serviços de reforma e construção da Hevron, CNPJ 50.469.536/0001-29, e permite que você peça um orçamento ou se cadastre como profissional parceiro.'),
  h2('Orçamentos e informações'),
  p('As informações, fotos e valores mostrados no site são ilustrativos e não constituem proposta comercial. Cada obra recebe um orçamento próprio, feito depois da visita técnica, e só é contratada com a assinatura de um contrato.'),
  p('Enviar o formulário "Começar meu projeto" não cria nenhuma obrigação de contratação para você nem para a Hevron.'),
  h2('Cadastro de parceiros'),
  p('O cadastro na rede de profissionais não garante a contratação. Todos os parceiros passam por uma avaliação antes de participar de qualquer obra.'),
  h2('Uso adequado'),
  p('Você se compromete a informar dados verdadeiros e a não usar o site para enviar conteúdo ilegal, ofensivo ou mensagens automáticas.'),
  h2('Propriedade intelectual'),
  p('Os textos, a marca Hevron, o logotipo e o layout do site pertencem à Hevron e não podem ser copiados sem autorização.'),
  h2('Seus dados'),
  p('O tratamento dos dados que você informa no site está descrito na nossa <a href="/politica-de-privacidade">Política de privacidade</a>.'),
  h2('Contato'),
  p('Dúvidas sobre estes termos: <a href="mailto:contato@hevron.com.br">contato@hevron.com.br</a> ou WhatsApp <a href="https://wa.me/5543988712083" target="_blank" rel="noopener">(43) 98871-2083</a>.'),
])

(root / 'politica-de-privacidade.dc.html').write_text(page('Política de privacidade', 'Política de privacidade', 'Como a Hevron cuida dos dados que você informa no site, de acordo com a LGPD.', priv))
(root / 'termos-de-uso.dc.html').write_text(page('Termos de uso', 'Termos de uso', 'As regras para usar o site da Hevron.', termos))
print('ok')

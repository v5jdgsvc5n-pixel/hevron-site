# Site da Hevron

Site de reforma e construção da Hevron, publicado em https://hevron.com.br.

## Como está organizado

- `src/pages/*.dc.html`: as páginas, no mesmo formato do canvas de design. Cada arquivo tem o HTML da página e, no fim, o código que faz menus, carrosséis e formulários funcionarem.
- `src/runtime.js`: transforma essas páginas em HTML e liga a parte interativa no navegador.
- `scripts/build.mjs`: gera o site final em `dist/` (HTML pronto para o Google, `sitemap.xml` e `robots.txt`).
- `scripts/legal-content.py`: gera as páginas de Política de privacidade e Termos de uso.
- `public/`: fotos (`img/`) e ícone do site.
- `api/lead.js`: recebe os formulários "Começar meu projeto" e "Seja parceiro", guarda no Supabase e envia um e-mail de aviso.
- `supabase/schema.sql`: cria a tabela `leads` no Supabase.

## Comandos

```bash
npm install
npm run build   # gera dist/
npm run dev     # gera e abre em http://localhost:3000
npm test        # testa o recebimento dos formulários
```

## Publicação (Vercel)

A Vercel publica sozinha a cada mudança na branch `main`. Variáveis de ambiente necessárias:

| Variável | Para que serve |
| --- | --- |
| `SUPABASE_URL` | Endereço do projeto no Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secreta do Supabase (nunca colocar no código) |
| `RESEND_API_KEY` | Chave do Resend, para enviar o e-mail de aviso |
| `LEAD_EMAIL_TO` | Quem recebe o aviso, ex.: `contato@hevron.com.br` |
| `LEAD_EMAIL_FROM` | Remetente, ex.: `Site Hevron <site@hevron.com.br>` |

Basta ter o Supabase ou o Resend configurado para os formulários funcionarem; com os dois, o pedido fica guardado e você recebe o e-mail.

# Site — DDE Sites (estúdio de criação de sites para empresas)

Site institucional estático, responsivo e sem dependências externas além das fontes do Google Fonts.
É só abrir o arquivo `index.html` no navegador para ver funcionando.

Identidade visual aplicada conforme o PRD: azul petróleo `#063B55`, azul vivo `#149ED0`,
azul claro `#75C9E8`, branco gelo `#F4F8FA`, laranja `#F5A623` (CTAs) e verde-água `#28B7A4`
(indicadores de sucesso).

## Estrutura

```
nexo-sites/
├── index.html                  Página inicial (hero, benefícios, serviços, projetos,
│                               processo, depoimentos, chamada final)
├── servicos.html               5 serviços com "o que inclui", "para quem", benefícios e FAQ
├── projetos.html               Grade de projetos com filtros por tipo
├── projeto-clinica-vitalis.html    Página individual de projeto
├── projeto-martelli-moveis.html    Página individual de projeto
├── projeto-rota-norte.html         Página individual de projeto
├── projeto-horizonte-advocacia.html Página individual de projeto
├── projeto-feira-cafe.html         Página individual de projeto
├── projeto-vila-nova.html          Página individual de projeto
├── como-funciona.html          Processo detalhado em 4 etapas + FAQ
├── sobre.html                  História, valores e equipe
├── orcamento.html              Formulário de orçamento com validação e confirmação
├── privacidade.html            Política de privacidade (LGPD)
├── robots.txt                  Instruções para buscadores
├── sitemap.xml                 Mapa do site (atualizar com o domínio real)
└── assets/
    ├── css/style.css           Todo o estilo do site
    ├── js/main.js              Menu mobile, animações, filtros e formulário
    └── img/                    Logo, hero, processo, sobre e 6 capas de projeto (SVG)
```

## Como o formulário funciona hoje

O formulário valida os campos no navegador (nome, empresa, contato, tipo de descrição e
consentimento), protege contra envio automatizado (honeypot + tempo mínimo de preenchimento)
e exibe a confirmação de envio.

**Não há backend configurado:** a confirmação é exibida, mas a mensagem ainda não chega a lugar
nenhum. Antes de publicar, conecte um destino:

| Opção | Como fazer |
|---|---|
| Formspree / Getform / Basin | Criar o formulário no serviço e adicionar `action="https://formspree.io/f/SEU_ID" method="POST"` na tag `<form data-formulario>` (remover o `novalidate` e o `preventDefault` do JS se preferir envio nativo) |
| Netlify Forms | Adicionar `data-netlify="true"` e publicar na Netlify |
| Servidor próprio (PHP/Node) | Apontar `action` para o script que envia o e-mail |

## Como atualizar o conteúdo

Em geral, basta editar o texto desejado dentro do arquivo `.html` correspondente.

| O que mudar | Onde editar |
|---|---|
| Nome / logo da empresa | Todos os `.html` — blocos `.brand` (cabeçalho e rodapé) + `assets/img/favicon.svg` |
| E-mail de contato | Todos os `.html` — procurar por `contato@ddesites.com.br` |
| Textos e itens dos serviços | `servicos.html` |
| Projetos (nome, segmento, texto, imagem) | `projetos.html` + `projeto-*.html` + capas em `assets/img/proj-*.svg` |
| Filtros de projetos | `projetos.html` (atributo `data-categoria`) e `assets/js/main.js` |
| Depoimentos | `index.html` — seção `#depoimentos` (modelo pronto no comentário do HTML) |
| Equipe | `sobre.html` — seção "Equipe" |
| Canais (WhatsApp, redes) | `orcamento.html` — seção `#canais` + rodapé |
| Política de privacidade | `privacidade.html` |
| Domínio | `robots.txt` e `sitemap.xml` (trocar `https://example.com`) |

## Conteúdo que ainda precisa ser fornecido

Nenhum dado comercial, número ou resultado foi inventado. Os itens abaixo estão estruturados no
site e devem ser preenchidos antes da publicação:

- [x] **Marca** — o site usa "DDE Sites" (alinhada ao GitHub `DDESites`). Logo definitiva, se
      diferente, continua pendente.
- [x] **WhatsApp** — publicado: `(61) 99824-9527` (rodapé, canais do orçamento).
- [x] **Projetos reais** — os 7 projetos são trabalhos reais publicados no ar, com link
      "Ver site no ar" para cada um (`ddesites.github.io/...`).
- [x] **Depoimentos** — os 7 depoimentos enviados foram publicados em `index.html`.
- [x] **Equipe** — Jéssica Freire, Bruno Cassimiro e Jéssica Miranda em `sobre.html`
      (fotos, funções específicas e biografias podem ser complementados).
- [ ] **E-mail de contato** — hoje publicado como `contato@ddesites.com.br`; confirmar ou trocar.
- [ ] **Redes sociais** — Instagram/outras redes ainda não publicadas.
- [ ] **Fotos reais dos projetos** — as capas são ilustrações da estrutura; substituir por
      capturas ou fotos dos sites publicados quando disponíveis.
- [ ] **Textos institucionais finais** — história e propósito em `sobre.html`.
- [ ] **Preços, planos e condições** — não exibidos, conforme o PRD. Só adicionar se definidos.
- [ ] **Destino do formulário** — ver seção anterior.
- [x] **Domínio** — publicado em https://ddesites.github.io/ (obots.txt, sitemap.xml e JSON-LD atualizados).

## Checklist antes de publicar

- [ ] Trocar `https://example.com` por domínio real em `robots.txt`, `sitemap.xml` e JSON-LD.
- [ ] Conectar o formulário a um serviço de envio e testar o recebimento.
- [ ] Testar navegação por teclado e leitura de tela nas páginas principais.
- [ ] Conferir contraste e legibilidade em celular real.
- [ ] Rodar Lighthouse (Performance ≥ 85, Accessibility ≥ 95).
- [ ] Adicionar o site ao Google Search Console e enviar o `sitemap.xml`.

## Publicação

O site é estático e funciona em qualquer hospedagem:

1. **Netlify, Vercel ou GitHub Pages** — arrastar a pasta e publicar.
2. **Hospedagem tradicional (cPanel)** — enviar os arquivos para `public_html`.
3. **Domínio próprio** — apontar o domínio para a hospedagem escolhida.

## Acessibilidade e SEO

- Estrutura semântica (`header`, `main`, `section`, `footer`) e headings hierárquicos.
- "Pular para o conteúdo", foco visível e navegação por teclado.
- Texto alternativo em todas as imagens e rótulo em todos os campos do formulário.
- Animações respeitam `prefers-reduced-motion`.
- Título, descrição e dados estruturados por página (JSON-LD).
- Formulário com validação, mensagem de erro junto ao campo e confirmação de envio.

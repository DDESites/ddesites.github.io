# Bella Boutique — Site de Moda Feminina

Site completo da **Bella Boutique**, loja de moda feminina: vitrine com curadoria, catálogo com filtros, página de produto, sacola persistente, checkout em 3 etapas e páginas institucionais.

## Como executar

O site é 100% estático (HTML, CSS e JavaScript puro). Basta abrir o `index.html` no navegador, ou usar o servidor local:

```powershell
powershell -ExecutionPolicy Bypass -File .\server.ps1
```

Depois acesse `http://localhost:8000`.

## Estrutura

```
bella-boutique/
├── index.html            Página inicial (banner, categorias, novidades, mais vendidos, editorial, redes)
├── catalogo.html         Catálogo com filtros, busca, ordenação e carregamento progressivo
├── produto.html          Página de produto (galeria, tamanhos, cores, guia de medidas)
├── sacola.html           Sacola (quantidades, cupom, cálculo de frete, resumo)
├── checkout.html         Finalização em 3 etapas (dados, entrega/pagamento, revisão)
├── confirmacao.html      Confirmação do pedido com resumo e envio pelo WhatsApp
├── sobre.html            Sobre a Bella Boutique
├── contato.html          Contato e atendimento (formulário via WhatsApp)
├── entrega.html          Entrega e frete (tabela de prazos e valores)
├── trocas.html           Trocas e devoluções
├── guia-medidas.html     Guia de medidas completo
├── privacidade.html      Privacidade e termos de uso
├── assets/               Logo, favicon e placeholder de imagem
├── css/style.css         Folha de estilo com a identidade da marca
└── js/
    ├── data.js           ★ Produtos, categorias, cupons e frete (edite para personalizar)
    ├── main.js           Compartilhado: cabeçalho, rodapé, sacola, busca, cards
    ├── catalogo.js       Filtros, ordenação e paginação progressiva
    ├── produto.js        Galeria, seleção de tamanho/cor e adicionar à sacola
    ├── sacola.js         Quantidades, cupom e cálculo de frete
    └── checkout.js       Fluxo de finalização em 3 etapas
```

## Identidade visual

- **Marrom taupe** (`#806b63`) — cor principal de fundos, botões e destaque
- **Off-white rosado** (`#f2e7e2`) — lettering, áreas de destaque e textos sobre fundos escuros
- **Bronze areia** (`#8f7761` / `#cbb9a4`) — detalhes, selos e acentos discretos
- **Creme e nude** — áreas de apoio e respiro
- Tipografia: **Playfair Display** (títulos, serifa Didone de alto contraste) + **Jost** (texto funcional)

## Como personalizar

1. **Produtos, preços e fotos:** edite `js/data.js` (cada produto tem nome, categoria, preço, tamanhos, cores, fotos e descrição).
2. **Cupons de desconto:** edite o objeto `CUPONS` em `js/data.js`.
3. **Frete por região:** ajuste a função `calcularFrete()` em `js/data.js`.
4. **Contato, Instagram e frete grátis:** edite o objeto `LOJA` no topo de `js/data.js`.

> As fotos atuais são de coleção (Unsplash) servidas como referência visual. Troque pelos URLs ou arquivos oficiais da loja — se uma foto faltar, o site usa automaticamente o placeholder da marca.

## Funcionalidades

- Sacola persistente durante a navegação (localStorage)
- Busca com sugestões em tempo real e filtros por categoria, tamanho, cor, preço e disponibilidade
- Ordenação por novidades, relevância, preço e promoções
- Chips de filtros ativos com remoção individual e URL compartilhável
- Seleção de tamanho com aviso claro de tamanhos esgotados
- Cupom de desconto e cálculo de frete por CEP com prazo estimado
- Checkout em 3 etapas com validação e confirmação do pedido
- Mensagens de confirmação ao adicionar itens e remover da sacola
- Layout responsivo, navegação por teclado, foco visível e textos alternativos

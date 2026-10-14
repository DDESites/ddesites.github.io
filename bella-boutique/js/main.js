/* ============================================================
   BELLA BOUTIQUE — comportamento compartilhado
   Cabeçalho/rodapé, sacola persistente, busca e cards.
   ============================================================ */

/* ---------- utilidades ---------- */
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatarPreco = (v) => BRL.format(v);

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const esc = (texto = "") =>
  String(texto).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

/** Evita imagem quebrada: cai para o placeholder da marca. */
function bellaImgFalha(img) {
  if (img.dataset.falhou) return;
  img.dataset.falhou = "1";
  img.src = "assets/placeholder.svg";
}

/** Logotipo embutido (usa a fonte Playfair Display da própria página). */
function logoBella() {
  return `<svg class="logo-svg" viewBox="0 0 720 567" role="img"
      aria-label="Bella Boutique — Moda Feminina by Sandy" focusable="false">
    <rect width="720" height="567" fill="#806b63"></rect>
    <g fill="#f2e7e2" font-family="'Playfair Display', Georgia, 'Times New Roman', serif" text-anchor="middle">
      <text x="360" y="272" font-size="152" letter-spacing="10">BELLA</text>
      <text x="360" y="408" font-size="130" letter-spacing="4">BOUTIQUE</text>
      <text x="360" y="478" font-size="30" letter-spacing="7">MODA FEMININA</text>
      <text x="360" y="518" font-size="26" letter-spacing="7">BY SANDY</text>
    </g>
  </svg>`;
}

const acharProduto = (id) => PRODUTOS.find((p) => p.id === id);

/** Texto de parcelamento, quando aplicável. */
function textoParcelas(p) {
  if (p.preco < 100) return "";
  const n = p.preco >= 300 ? 5 : 3;
  return `${n}x de ${formatarPreco(p.preco / n)} sem juros`;
}

/* ---------- WhatsApp ---------- */
function linkWhatsApp(texto) {
  return `https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(texto)}`;
}

const TEXTO_PADRAO_ZAP =
  "Olá! Vim pelo site da Bella Boutique e preciso de ajuda para escolher minha peça.";

/* ---------- sacola de compras ---------- */
const CHAVE_SACOLA = "bb_sacola";
const CHAVE_CUPOM = "bb_cupom";
const CHAVE_FRETE = "bb_frete";

const lerSacola = () => {
  try { return JSON.parse(localStorage.getItem(CHAVE_SACOLA)) || []; }
  catch { return []; }
};

const salvarSacola = (itens) => {
  localStorage.setItem(CHAVE_SACOLA, JSON.stringify(itens));
  atualizarBadge();
};

const chaveItem = (id, tamanho, cor) => `${id}||${tamanho}||${cor}`;

function adicionarASacola(id, tamanho, cor, quantidade = 1) {
  const produto = acharProduto(id);
  if (!produto) return false;
  const itens = lerSacola();
  const chave = chaveItem(id, tamanho, cor);
  const existente = itens.find((i) => chaveItem(i.id, i.tamanho, i.cor) === chave);
  if (existente) existente.qtd += quantidade;
  else itens.push({ id, tamanho, cor, qtd: quantidade, preco: produto.preco });
  salvarSacola(itens);
  toast(`${produto.nome} (${tamanho}) adicionado à sacola`);
  return true;
}

function atualizarQuantidade(id, tamanho, cor, novaQtd) {
  let itens = lerSacola();
  const chave = chaveItem(id, tamanho, cor);
  itens = itens
    .map((i) => (chaveItem(i.id, i.tamanho, i.cor) === chave ? { ...i, qtd: novaQtd } : i))
    .filter((i) => i.qtd > 0);
  salvarSacola(itens);
}

function removerDaSacola(id, tamanho, cor) {
  const chave = chaveItem(id, tamanho, cor);
  salvarSacola(lerSacola().filter((i) => chaveItem(i.id, i.tamanho, i.cor) !== chave));
  toast("Item removido da sacola.");
}

const totalSacola = (itens = lerSacola()) =>
  itens.reduce((s, i) => s + i.preco * i.qtd, 0);

const totalItens = (itens = lerSacola()) => itens.reduce((s, i) => s + i.qtd, 0);

function atualizarBadge() {
  const n = totalItens();
  $$("[data-badge-sacola]").forEach((el) => {
    el.textContent = n;
    el.style.display = n > 0 ? "grid" : "none";
  });
}

/* ---------- cupom de desconto ---------- */
const lerCupom = () => {
  try { return JSON.parse(localStorage.getItem(CHAVE_CUPOM)) || null; }
  catch { return null; }
};
const salvarCupom = (codigo) => localStorage.setItem(CHAVE_CUPOM, JSON.stringify(codigo));
const limparCupom = () => localStorage.removeItem(CHAVE_CUPOM);

function descontoCupom(subtotal, cupom = lerCupom()) {
  if (!cupom || !CUPONS[cupom]) return 0;
  const c = CUPONS[cupom];
  if (subtotal < c.minimo) return 0;
  return c.tipo === "percentual" ? subtotal * c.valor : 0;
}

function freteCupomGratis(subtotal, cupom = lerCupom()) {
  return Boolean(cupom && CUPONS[cupom] && CUPONS[cupom].tipo === "frete" && subtotal >= CUPONS[cupom].minimo);
}

/* ---------- frete ---------- */
const lerFrete = () => {
  try { return JSON.parse(localStorage.getItem(CHAVE_FRETE)) || null; }
  catch { return null; }
};
const salvarFrete = (dados) => localStorage.setItem(CHAVE_FRETE, JSON.stringify(dados));

/* Resumo financeiro completo usado na sacola e no checkout */
function resumoValores(itens = lerSacola()) {
  const subtotal = totalSacola(itens);
  const desconto = descontoCupom(subtotal);
  const base = subtotal - desconto;

  let frete = 0;
  let freteRotulo = "Não calculado";
  const freteSalvo = lerFrete();
  const gratisPorCupom = freteCupomGratis(base);

  if (gratisPorCupom) {
    frete = 0;
    freteRotulo = "Grátis (cupom)";
  } else if (subtotal >= LOJA.freteGratisAcima) {
    frete = 0;
    freteRotulo = "Grátis";
  } else if (freteSalvo) {
    frete = freteSalvo.valor;
    freteRotulo = `${formatarPreco(freteSalvo.valor)} — ${freteSalvo.prazo}`;
  }

  return { subtotal, desconto, frete, freteRotulo, total: Math.max(base + frete, 0) };
}

/* ---------- toast ---------- */
let toastTimer;
function toast(mensagem) {
  let el = $("#bb-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "bb-toast";
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.appendChild(el);
  }
  el.textContent = mensagem;
  el.classList.add("visivel");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visivel"), 3200);
}

/* ---------- card de produto ---------- */
function cartaoProduto(p) {
  const selo = p.estoque === false
    ? '<span class="selo selo-esgotado">Esgotado</span>'
    : p.promo
      ? '<span class="selo selo-promo">Promoção</span>'
      : p.novidade
        ? '<span class="selo selo-novidade">Novidade</span>'
        : "";

  const precoAntigo = p.precoAntigo
    ? `<span class="preco-antigo">${formatarPreco(p.precoAntigo)}</span>`
    : "";

  const parcelas = textoParcelas(p);
  const corUnica = p.cores.length === 1 ? p.cores[0] : "";
  const tamanhoUnico = p.tamanhos.length === 1 ? p.tamanhos[0] : "";
  const compraDireta = corUnica && tamanhoUnico && p.estoque !== false;

  const acao = p.estoque === false
    ? `<a class="btn btn-contorno btn-mini btn-bloco" href="${linkWhatsApp(
        `Olá! Quero saber quando volta o ${p.nome} na Bella Boutique.`)}" target="_blank" rel="noopener">Avise-me quando chegar</a>`
    : compraDireta
      ? `<button class="btn btn-primario btn-mini btn-bloco" data-add-rapido="${p.id}">Adicionar à sacola</button>`
      : `<a class="btn btn-escuro btn-mini btn-bloco" href="produto.html?id=${encodeURIComponent(p.id)}">Escolher tamanho</a>`;

  return `
    <article class="produto-cartao">
      <a class="produto-foto" href="produto.html?id=${encodeURIComponent(p.id)}" aria-label="${esc(p.nome)} — ver detalhes">
        ${selo}
        <img src="${p.imagens[0]}" alt="${esc(p.nome)} — ${esc(p.resumo)}" loading="lazy" onerror="bellaImgFalha(this)">
      </a>
      <div class="produto-info">
        <span class="produto-categoria">${esc(p.categoria)}</span>
        <h3 class="produto-nome"><a href="produto.html?id=${encodeURIComponent(p.id)}">${esc(p.nome)}</a></h3>
        <div class="preco-linha"><span class="preco">${formatarPreco(p.preco)}</span>${precoAntigo}</div>
        ${parcelas ? `<p class="parcelas">${parcelas}</p>` : ""}
        <div class="bloco-add">${acao}</div>
      </div>
    </article>`;
}

function renderizarGrade(alvo, produtos) {
  const el = typeof alvo === "string" ? $(alvo) : alvo;
  if (!el) return;
  el.innerHTML = produtos.map(cartaoProduto).join("");
}

/* ---------- texto do pedido no WhatsApp ---------- */
function textoPedidoWhatsApp(itens = lerSacola(), extras = "") {
  if (!itens.length) return TEXTO_PADRAO_ZAP;
  const linhas = itens.map((i, n) => {
    const p = acharProduto(i.id);
    return `${n + 1}. ${p ? p.nome : i.id} — Tam ${i.tamanho} — ${i.cor} — ${i.qtd}x ${formatarPreco(i.preco)}`;
  });
  const { subtotal, desconto, total, freteRotulo } = resumoValores(itens);
  const linhasTotal = [
    `Subtotal: ${formatarPreco(subtotal)}`,
    desconto > 0 ? `Desconto: -${formatarPreco(desconto)}` : null,
    `Frete: ${freteRotulo}`,
    `Total: ${formatarPreco(total)}`,
  ].filter(Boolean);
  return [
    "Olá! Vim pelo site da Bella Boutique e quero finalizar este pedido:",
    "",
    ...linhas,
    "",
    ...linhasTotal,
    extras ? `\n${extras}` : "",
    "\nPode me ajudar com pagamento e entrega, por favor?",
  ].filter(Boolean).join("\n");
}

const linkPedidoWhatsApp = (itens, extras) => linkWhatsApp(textoPedidoWhatsApp(itens, extras));

/* ---------- cabeçalho, menu e busca ---------- */
const ICONES = {
  busca: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  sacola: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.2-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5 0-.2 0-.4-.1-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.2-.6-.4zM12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2z"/></svg>',
};

function montarCabecalho() {
  const alvo = $("#cabecalho");
  if (!alvo) return;
  const pagina = document.body.dataset.pagina || "";
  const marcaLink = (ativo) => (ativo ? ' aria-current="page"' : "");

  alvo.innerHTML = `
    <div class="topo-aviso">
      <strong>Envio para todo o Brasil</strong> • Frete grátis acima de ${formatarPreco(LOJA.freteGratisAcima)} • ${LOJA.pixDesconto * 100}% de desconto no Pix
    </div>
    <div class="container cabecalho-interno">
      <button class="icone-btn menu-hamburguer" data-abrir-menu aria-label="Abrir menu de navegação">${ICONES.menu}</button>
      <a class="marca" href="index.html">${logoBella()}</a>
      <nav class="nav-principal" aria-label="Menu principal">
        <a href="index.html"${marcaLink(pagina === "inicio")}>Início</a>
        <a href="catalogo.html?ordem=novidades">Novidades</a>
        <a href="catalogo.html?cat=Vestidos">Vestidos</a>
        <a href="catalogo.html?cat=Conjuntos">Conjuntos</a>
        <a href="catalogo.html?cat=Acess%C3%B3rios">Acessórios</a>
        <a href="sobre.html"${marcaLink(pagina === "sobre")}>Sobre</a>
      </nav>
      <div class="acoes">
        <button class="icone-btn" data-abrir-busca aria-label="Buscar produtos">${ICONES.busca}</button>
        <a class="icone-btn" href="${LOJA.instagram}" target="_blank" rel="noopener" aria-label="Instagram da Bella Boutique">${ICONES.instagram}</a>
        <a class="icone-btn" href="sacola.html" aria-label="Ver sacola de compras">
          ${ICONES.sacola}
          <span class="contador-sacola" data-badge-sacola style="display:none">0</span>
        </a>
      </div>
    </div>`;

  /* menu mobile */
  const navMobile = document.createElement("nav");
  navMobile.className = "nav-mobile";
  navMobile.id = "nav-mobile";
  navMobile.setAttribute("aria-label", "Menu de navegação");
  navMobile.innerHTML = `
    <button class="btn btn-contorno btn-mini" data-fechar style="margin-bottom:1rem">Fechar</button>
    <a href="index.html">Início</a>
    <a href="catalogo.html">Catálogo completo</a>
    <a href="catalogo.html?cat=Vestidos">Vestidos</a>
    <a href="catalogo.html?cat=Conjuntos">Conjuntos</a>
    <a href="catalogo.html?cat=Blusas">Blusas</a>
    <a href="catalogo.html?cat=Cal%C3%A7as%20e%20Saias">Calças e Saias</a>
    <a href="catalogo.html?cat=Acess%C3%B3rios">Acessórios</a>
    <a href="sobre.html">Sobre a Bella</a>
    <a href="guia-medidas.html">Guia de medidas</a>
    <a href="entrega.html">Entrega e frete</a>
    <a href="trocas.html">Trocas e devoluções</a>
    <a href="contato.html">Contato</a>
    <a href="${linkWhatsApp(TEXTO_PADRAO_ZAP)}" target="_blank" rel="noopener">Chamar no WhatsApp</a>`;
  document.body.appendChild(navMobile);

  /* overlay */
  const overlay = document.createElement("div");
  overlay.className = "overlay";
  overlay.id = "overlay";
  overlay.setAttribute("aria-hidden", "true");
  document.body.appendChild(overlay);

  /* painel de busca */
  const painel = document.createElement("div");
  painel.className = "busca-painel";
  painel.id = "painel-busca";
  painel.setAttribute("role", "search");
  painel.setAttribute("aria-label", "Busca de produtos");
  painel.innerHTML = `
    <div class="container">
      <form class="busca-form" id="form-busca" action="catalogo.html" method="get" role="search">
        <label class="sr-only" for="campo-busca">O que você procura hoje?</label>
        <input type="search" id="campo-busca" name="q" placeholder="Buscar vestidos, conjuntos, cores, tamanhos…" autocomplete="off">
        <button type="submit" class="btn btn-primario btn-mini">Buscar</button>
        <button type="button" class="icone-btn" data-fechar aria-label="Fechar busca">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>'}</button>
      </form>
      <div class="busca-sugestoes" id="busca-sugestoes"></div>
    </div>`;
  document.body.appendChild(painel);
}

function montarRodape() {
  const alvo = $("#rodape");
  if (!alvo) return;
  alvo.innerHTML = `
    <div class="container">
      <div class="rodape-grade">
        <div>
          <a class="marca" href="index.html">${logoBella()}</a>
          <p style="margin-top:1rem">Moda feminina com elegância e cuidado — de ${esc(LOJA.cidade)} para todo o Brasil.</p>
          <div class="rodape-redes">
            <a href="${LOJA.instagram}" target="_blank" rel="noopener" aria-label="Instagram">${ICONES.instagram}</a>
            <a href="${linkWhatsApp(TEXTO_PADRAO_ZAP)}" target="_blank" rel="noopener" aria-label="WhatsApp">${ICONES.whatsapp}</a>
          </div>
        </div>
        <div>
          <h4>Comprar</h4>
          <ul>
            <li><a href="catalogo.html">Catálogo completo</a></li>
            <li><a href="catalogo.html?cat=Vestidos">Vestidos</a></li>
            <li><a href="catalogo.html?cat=Conjuntos">Conjuntos</a></li>
            <li><a href="catalogo.html?cat=Blusas">Blusas</a></li>
            <li><a href="catalogo.html?cat=Cal%C3%A7as%20e%20Saias">Calças e Saias</a></li>
            <li><a href="catalogo.html?cat=Acess%C3%B3rios">Acessórios</a></li>
          </ul>
        </div>
        <div>
          <h4>Institucional</h4>
          <ul>
            <li><a href="sobre.html">Sobre a Bella</a></li>
            <li><a href="contato.html">Contato e atendimento</a></li>
            <li><a href="entrega.html">Entrega e frete</a></li>
            <li><a href="trocas.html">Trocas e devoluções</a></li>
            <li><a href="guia-medidas.html">Guia de medidas</a></li>
            <li><a href="privacidade.html">Privacidade e termos</a></li>
          </ul>
        </div>
        <div>
          <h4>Atendimento</h4>
          <ul class="rodape-contato">
            <li>${ICONES.whatsapp} <a href="${linkWhatsApp(TEXTO_PADRAO_ZAP)}" target="_blank" rel="noopener">${esc(LOJA.whatsappExibicao)}</a></li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg> <a href="mailto:${esc(LOJA.email)}">${esc(LOJA.email)}</a></li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 21s-7-5.4-7-11a7 7 0 0 1 14 0c0 5.6-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg> ${esc(LOJA.cidade)} — ${esc(LOJA.estado)}</li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> ${esc(LOJA.horario)}</li>
          </ul>
        </div>
      </div>
      <div class="rodape-base">
        <span>© <span data-ano></span> Bella Boutique — Todos os direitos reservados.</span>
        <span>Formas de pagamento: Pix, cartão em até 5x e boleto</span>
      </div>
    </div>`;
}

/* ---------- comportamento do cabeçalho ---------- */
function iniciarCabecalho() {
  atualizarBadge();

  const overlay = $("#overlay");
  const painelBusca = $("#painel-busca");
  const campoBusca = $("#campo-busca");
  const sugestoes = $("#busca-sugestoes");

  const abrirBusca = () => {
    painelBusca.classList.add("aberto");
    overlay.classList.add("aberto");
    setTimeout(() => campoBusca.focus(), 120);
  };
  const fecharTudo = () => {
    painelBusca.classList.remove("aberto");
    overlay.classList.remove("aberto");
    $("#nav-mobile")?.classList.remove("aberto");
    $("#filtros")?.classList.remove("aberto");
  };

  $$("[data-abrir-busca]").forEach((b) => b.addEventListener("click", abrirBusca));
  $$("[data-abrir-menu]").forEach((b) =>
    b.addEventListener("click", () => {
      $("#nav-mobile")?.classList.add("aberto");
      overlay.classList.add("aberto");
    })
  );
  overlay?.addEventListener("click", fecharTudo);
  $$("[data-fechar]").forEach((b) => b.addEventListener("click", fecharTudo));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharTudo(); });

  campoBusca?.addEventListener("input", () => {
    const termo = campoBusca.value.trim().toLowerCase();
    if (termo.length < 2) { sugestoes.innerHTML = ""; return; }
    const achados = PRODUTOS.filter((p) =>
      [p.nome, p.categoria, ...p.cores, ...p.tags].join(" ").toLowerCase().includes(termo)
    ).slice(0, 5);
    sugestoes.innerHTML = achados.length
      ? achados.map((p) => `
          <a href="produto.html?id=${encodeURIComponent(p.id)}">
            <img src="${p.imagens[0]}" alt="" onerror="bellaImgFalha(this)">
            <span>${esc(p.nome)}<br><small>${esc(p.categoria)}</small></span>
            <span class="preco">${formatarPreco(p.preco)}</span>
          </a>`).join("")
      : `<p class="sem-margem">Nada encontrado por “${esc(termo)}”. Tente “vestido”, “conjunto” ou “calça”.</p>`;
  });

  $("#form-busca")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const termo = campoBusca.value.trim();
    window.location.href = termo ? `catalogo.html?q=${encodeURIComponent(termo)}` : "catalogo.html";
  });

  $$("[data-ano]").forEach((el) => (el.textContent = new Date().getFullYear()));
}

/* ---------- atalho de compra rápida ---------- */
function iniciarAtalhosGlobais() {
  document.addEventListener("click", (e) => {
    const addRapido = e.target.closest("[data-add-rapido]");
    if (!addRapido) return;
    const p = acharProduto(addRapido.dataset.addRapido);
    if (p) adicionarASacola(p.id, p.tamanhos.find((t) => !(p.esgotados || []).includes(t)) || p.tamanhos[0], p.cores[0]);
  });
}

/* ---------- montagem padrão das páginas ---------- */
document.addEventListener("DOMContentLoaded", () => {
  montarCabecalho();
  montarRodape();
  iniciarCabecalho();
  iniciarAtalhosGlobais();

  if (!document.querySelector(".zap-flutuante")) {
    const a = document.createElement("a");
    a.className = "zap-flutuante";
    a.href = linkWhatsApp(TEXTO_PADRAO_ZAP);
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", `Falar com a Bella Boutique no WhatsApp ${LOJA.whatsappExibicao}`);
    a.innerHTML = ICONES.whatsapp;
    document.body.appendChild(a);
  }
});

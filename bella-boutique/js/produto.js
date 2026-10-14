/* ============================================================
   BELLA BOUTIQUE — Página de produto
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(location.search).get("id");
  const p = acharProduto(id);

  const detalhe = $("#produto-detalhe");
  const naoEncontrado = $("#produto-nao-encontrado");

  if (!p) {
    detalhe.style.display = "none";
    $("#secao-relacionados").style.display = "none";
    naoEncontrado.hidden = false;
    document.title = "Produto não encontrado — Bella Boutique";
    return;
  }

  /* ---------- dados básicos ---------- */
  document.title = `${p.nome} — Bella Boutique`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", `${p.nome}: ${p.resumo} Tamanhos ${p.tamanhos.join(", ")}. Compre na Bella Boutique.`);

  $("#caminho").innerHTML =
    `<a href="index.html">Início</a> › <a href="catalogo.html">Catálogo</a> › <a href="catalogo.html?cat=${encodeURIComponent(p.categoria)}">${esc(p.categoria)}</a> › ${esc(p.nome)}`;

  $("#produto-categoria").textContent = p.categoria;
  $("#produto-nome").textContent = p.nome;
  $("#produto-resumo").textContent = p.resumo;
  $("#produto-preco").textContent = formatarPreco(p.preco);
  $("#produto-parcelas").textContent = textoParcelas(p) || "Pagamento à vista no Pix ou cartão";
  $("#frete-gratis-info").textContent = formatarPreco(LOJA.freteGratisAcima);

  if (p.precoAntigo) {
    $("#produto-preco-antigo").textContent = formatarPreco(p.precoAntigo);
    const pct = Math.round((1 - p.preco / p.precoAntigo) * 100);
    const chip = $("#produto-desconto");
    chip.textContent = `${pct}% off`;
    chip.hidden = false;
  }

  const disponibilidade = $("#produto-disponibilidade");
  if (p.estoque === false) {
    disponibilidade.textContent = "Esgotado no momento — avise-me quando chegar";
    disponibilidade.classList.add("esgotado");
  } else {
    const restantes = p.tamanhos.filter((t) => !(p.esgotados || []).includes(t));
    disponibilidade.textContent = `Disponível${restantes.length ? ` nos tamanhos ${restantes.join(", ")}` : ""}`;
  }

  /* ---------- galeria ---------- */
  const fotoPrincipal = $("#foto-principal");
  const miniaturas = $("#galeria-miniaturas");
  fotoPrincipal.src = p.imagens[0];
  fotoPrincipal.alt = `${p.nome} — foto principal`;
  fotoPrincipal.onerror = () => bellaImgFalha(fotoPrincipal);

  miniaturas.innerHTML = p.imagens
    .map(
      (src, i) => `
        <button type="button" data-foto="${i}" aria-pressed="${i === 0}" aria-label="Ver foto ${i + 1} de ${p.nome}">
          <img src="${src}" alt="" loading="lazy" onerror="bellaImgFalha(this)">
        </button>`
    )
    .join("");

  miniaturas.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-foto]");
    if (!btn) return;
    const i = Number(btn.dataset.foto);
    fotoPrincipal.src = p.imagens[i];
    $$("[data-foto]", miniaturas).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
  });

  /* zoom da foto principal (lightbox) */
  $("#foto-principal-caixa").addEventListener("click", () => {
    const lightbox = document.createElement("div");
    lightbox.className = "modal-guia aberto";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", `Foto ampliada de ${p.nome}`);
    lightbox.innerHTML = `
      <div class="modal-caixa" style="max-width:640px;padding:1rem;background:transparent;box-shadow:none">
        <div class="cabecalho-modal">
          <span style="color:#fff;font-weight:500">${esc(p.nome)}</span>
          <button class="icone-btn" style="color:#fff" aria-label="Fechar foto ampliada">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
        </div>
        <img src="${fotoPrincipal.src}" alt="${esc(p.nome)} — foto ampliada" style="border-radius:10px;max-height:78vh;object-fit:contain;margin:0 auto">
      </div>`;
    const fechar = () => lightbox.remove();
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox || e.target.closest("button")) fechar(); });
    document.addEventListener("keydown", function escHandler(e) {
      if (e.key === "Escape") { fechar(); document.removeEventListener("keydown", escHandler); }
    });
    document.body.appendChild(lightbox);
    lightbox.querySelector("button").focus();
  });

  /* ---------- escolhas de cor e tamanho ---------- */
  let corEscolhida = "";
  let tamanhoEscolhido = "";

  const coresAlvo = $("#botoes-cor");
  const tamanhosAlvo = $("#botoes-tamanho");

  coresAlvo.innerHTML = p.cores
    .map(
      (c) => `
      <button type="button" class="cor-chip" data-cor="${esc(c)}" aria-pressed="false">
        <i style="background:${CORES_COM_TOM[c] || "#e0d3cd"}"></i>${esc(c)}
      </button>`
    )
    .join("");

  tamanhosAlvo.innerHTML = p.tamanhos
    .map((t) => {
      const esgotado = (p.esgotados || []).includes(t);
      return `<button type="button" class="tamanho-chip${esgotado ? " esgotado" : ""}" data-tamanho="${esc(t)}" aria-pressed="false"${esgotado ? ' aria-disabled="true" title="Tamanho esgotado"' : ""}>${esc(t)}</button>`;
    })
    .join("");

  coresAlvo.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cor]");
    if (!btn) return;
    corEscolhida = btn.dataset.cor;
    $$("[data-cor]", coresAlvo).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    $("#legenda-cor").textContent = corEscolhida;
    limparErro();
  });

  tamanhosAlvo.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tamanho]");
    if (!btn) return;
    if (btn.classList.contains("esgotado")) {
      mostrarErro(`O tamanho ${btn.dataset.tamanho} está esgotado. Escolha outro tamanho ou chame no WhatsApp que avisamos quando chegar.`);
      return;
    }
    tamanhoEscolhido = btn.dataset.tamanho;
    $$("[data-tamanho]", tamanhosAlvo).forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    $("#legenda-tamanho").textContent = tamanhoEscolhido;
    limparErro();
  });

  /* ---------- adicionar à sacola ---------- */
  const aviso = $("#aviso-erro");
  const mostrarErro = (msg) => { aviso.textContent = msg; aviso.classList.add("visivel"); };
  const limparErro = () => aviso.classList.remove("visivel");

  $("#btn-adicionar").addEventListener("click", () => {
    const faltando = [];
    if (!corEscolhida) faltando.push("a cor");
    if (!tamanhoEscolhido) faltando.push("o tamanho");
    if (faltando.length) {
      mostrarErro(`Escolha ${faltando.join(" e ")} antes de adicionar à sacola.`);
      (corEscolhida ? tamanhosAlvo : coresAlvo).querySelector("button")?.focus();
      return;
    }
    if (p.estoque === false) {
      mostrarErro("Esta peça está esgotada no momento. Chame no WhatsApp que a gente avisa quando chegar.");
      return;
    }
    adicionarASacola(p.id, tamanhoEscolhido, corEscolhida);
    limparErro();
  });

  /* ---------- WhatsApp do produto ---------- */
  $("#btn-zap").href = linkWhatsApp(
    `Olá! Estou na página do ${p.nome} (${formatarPreco(p.preco)}) na Bella Boutique e quero saber mais.`
  );

  /* ---------- informações ---------- */
  const detalhes = Object.entries(p.detalhes || {})
    .map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`)
    .join("");

  $("#produto-info").innerHTML = `
    <details open>
      <summary>Descrição e detalhes</summary>
      <div class="conteudo">
        <p>${esc(p.descricao)}</p>
        <dl>${detalhes}</dl>
      </div>
    </details>
    <details>
      <summary>Tamanho e caimento</summary>
      <div class="conteudo">
        <p>Tamanhos disponíveis: <strong>${p.tamanhos.join(", ")}</strong>. Meça o corpo e compare com a tabela antes de escolher.</p>
        <button type="button" class="btn btn-contorno btn-mini" data-abrir-guia>Ver guia de medidas</button>
      </div>
    </details>
    <details>
      <summary>Entrega, troca e pagamento</summary>
      <div class="conteudo">
        <ul style="list-style:disc;padding-left:1.2rem">
          <li>Enviamos para todo o Brasil pelos Correios ou transportadora, com código de rastreio.</li>
          <li>Frete grátis em compras acima de ${formatarPreco(LOJA.freteGratisAcima)}.</li>
          <li>Retirada na loja física em ${esc(LOJA.cidade)}, sem custo.</li>
          <li>Trocas em até 7 dias após o recebimento — veja a <a href="trocas.html" style="text-decoration:underline">política de trocas</a>.</li>
          <li>Pagamento por Pix (${LOJA.pixDesconto * 100}% de desconto), cartão em até 5x sem juros ou boleto.</li>
        </ul>
      </div>
    </details>`;

  /* ---------- modal do guia de medidas ---------- */
  $$("[data-abrir-guia], #abrir-guia").forEach((b) =>
    b.addEventListener("click", () => {
      $("#modal-guia").classList.add("aberto");
      $("#modal-guia .icone-btn")?.focus();
    })
  );
  $$("[data-fechar-modal]").forEach((b) =>
    b.addEventListener("click", () => $("#modal-guia").classList.remove("aberto"))
  );
  $("#modal-guia").addEventListener("click", (e) => {
    if (e.target.id === "modal-guia") $("#modal-guia").classList.remove("aberto");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") $("#modal-guia").classList.remove("aberto");
  });

  /* ---------- relacionados ---------- */
  const relacionados = PRODUTOS.filter((x) => x.id !== p.id)
    .sort((a, b) => {
      const nota = (x) => (x.categoria === p.categoria ? 2 : 0) + (x.tags?.some((t) => p.tags?.includes(t)) ? 1 : 0);
      return nota(b) - nota(a);
    })
    .slice(0, 4);
  renderizarGrade("#grade-relacionados", relacionados);

  /* ---------- dados estruturados (SEO) ---------- */
  const ld = document.createElement("script");
  ld.type = "application/ld+json";
  ld.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.nome,
    description: p.resumo,
    image: p.imagens,
    brand: { "@type": "Brand", name: "Bella Boutique" },
    offers: {
      "@type": "Offer",
      price: p.preco.toFixed(2),
      priceCurrency: "BRL",
      availability: p.estoque === false ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: `produto.html?id=${encodeURIComponent(p.id)}`,
    },
  });
  document.head.appendChild(ld);
});

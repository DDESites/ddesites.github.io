/* ============================================================
   BELLA BOUTIQUE — Sacola de compras
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const caixaItens = $("#sacola-itens");
  const layout = $("#sacola-layout");
  const vazio = $("#sacola-vazia");
  const campoCupom = $("#campo-cupom");
  const avisoCupom = $("#cupom-aviso");
  const campoCep = $("#campo-cep");
  const resultadoFrete = $("#frete-resultado");

  /* ---------- cupom ---------- */
  const cupomAtivo = lerCupom();
  if (cupomAtivo) campoCupom.value = cupomAtivo;

  function aplicarCupom() {
    const codigo = campoCupom.value.trim().toUpperCase();
    if (!codigo) {
      limparCupom();
      avisoCupom.textContent = "";
      render();
      return;
    }
    const cupom = CUPONS[codigo];
    const { subtotal } = resumoValores();
    if (!cupom) {
      avisoCupom.textContent = "Cupom inválido. Confira o código e tente novamente.";
      avisoCupom.style.color = "var(--vermelho)";
      return;
    }
    if (subtotal < cupom.minimo) {
      avisoCupom.textContent = `Este cupom vale para compras acima de ${formatarPreco(cupom.minimo)}.`;
      avisoCupom.style.color = "var(--vermelho)";
      return;
    }
    salvarCupom(codigo);
    avisoCupom.textContent = `Cupom ${codigo} aplicado: ${cupom.rotulo}.`;
    avisoCupom.style.color = "var(--verde)";
    render();
  }

  $("#btn-cupom").addEventListener("click", aplicarCupom);
  campoCupom.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); aplicarCupom(); } });

  /* ---------- frete ---------- */
  const freteSalvo = lerFrete();
  if (freteSalvo) {
    campoCep.value = freteSalvo.cep;
    resultadoFrete.textContent = `${formatarPreco(freteSalvo.valor)} — entrega em ${freteSalvo.prazo} (${freteSalvo.regiao}).`;
  }

  campoCep.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 8);
    e.target.value = v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
  });

  $("#btn-frete").addEventListener("click", () => {
    const cep = campoCep.value.replace(/\D/g, "");
    if (cep.length !== 8) {
      resultadoFrete.textContent = "Digite um CEP completo com 8 dígitos.";
      resultadoFrete.style.color = "var(--vermelho)";
      campoCep.focus();
      return;
    }
    const dados = { cep, ...calcularFrete(cep) };
    salvarFrete(dados);
    resultadoFrete.style.color = "var(--texto-suave)";
    resultadoFrete.textContent = `${formatarPreco(dados.valor)} — entrega em ${dados.prazo} (${dados.regiao}).`;
    render();
  });

  /* ---------- renderização ---------- */
  function render() {
    const itens = lerSacola();

    if (!itens.length) {
      layout.hidden = true;
      vazio.hidden = false;
      atualizarBadge();
      return;
    }
    layout.hidden = false;
    vazio.hidden = true;

    caixaItens.innerHTML = itens
      .map((i) => {
        const p = acharProduto(i.id) || { nome: i.id, imagens: ["assets/placeholder.svg"], categoria: "" };
        return `
          <article class="item-sacola">
            <a href="produto.html?id=${encodeURIComponent(i.id)}" aria-label="${esc(p.nome)}">
              <img src="${p.imagens[0]}" alt="${esc(p.nome)}" onerror="bellaImgFalha(this)">
            </a>
            <div>
              <h3><a href="produto.html?id=${encodeURIComponent(i.id)}">${esc(p.nome)}</a></h3>
              <p class="variacao">Tam ${esc(i.tamanho)} · ${esc(i.cor)} · ${formatarPreco(i.preco)} cada</p>
              <div class="qtd-controle">
                <button type="button" data-acao="menos" data-id="${esc(i.id)}" data-tamanho="${esc(i.tamanho)}" data-cor="${esc(i.cor)}" aria-label="Diminuir quantidade de ${esc(p.nome)}">−</button>
                <span aria-live="polite">${i.qtd}</span>
                <button type="button" data-acao="mais" data-id="${esc(i.id)}" data-tamanho="${esc(i.tamanho)}" data-cor="${esc(i.cor)}" aria-label="Aumentar quantidade de ${esc(p.nome)}">+</button>
              </div>
              <button class="item-remover" type="button" data-acao="remover" data-id="${esc(i.id)}" data-tamanho="${esc(i.tamanho)}" data-cor="${esc(i.cor)}">Remover</button>
            </div>
            <p class="item-total">${formatarPreco(i.preco * i.qtd)}</p>
          </article>`;
      })
      .join("");

    const { subtotal, desconto, frete, freteRotulo, total } = resumoValores(itens);

    $("#resumo-subtotal").textContent = formatarPreco(subtotal);
    $("#linha-desconto").hidden = desconto <= 0;
    $("#resumo-desconto").textContent = `-${formatarPreco(desconto)}`;
    $("#resumo-frete").textContent = freteRotulo;
    $("#resumo-total").textContent = formatarPreco(total);

    const aviso = $("#aviso-frete");
    if (subtotal >= LOJA.freteGratisAcima) {
      aviso.textContent = "Você ganhou frete grátis nesta compra!";
    } else {
      const falta = LOJA.freteGratisAcima - subtotal;
      aviso.textContent = `Faltam ${formatarPreco(falta)} para você ganhar frete grátis.`;
    }

    $("#btn-zap-pedido").href = linkPedidoWhatsApp(itens);
    atualizarBadge();
  }

  caixaItens.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-acao]");
    if (!btn) return;
    const { id, tamanho, cor, acao } = btn.dataset;
    const item = lerSacola().find((i) => chaveItem(i.id, i.tamanho, i.cor) === chaveItem(id, tamanho, cor));
    if (!item) return;

    if (acao === "mais") atualizarQuantidade(id, tamanho, cor, item.qtd + 1);
    if (acao === "menos") atualizarQuantidade(id, tamanho, cor, item.qtd - 1);
    if (acao === "remover") removerDaSacola(id, tamanho, cor);
    render();
  });

  render();
});

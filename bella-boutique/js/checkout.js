/* ============================================================
   BELLA BOUTIQUE — Finalização da compra (3 passos)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  const itens = lerSacola();

  $("#loja-cidade").textContent = `${LOJA.cidade} — ${LOJA.estado}`;
  $("#pix-desconto").textContent = `${LOJA.pixDesconto * 100}%`;

  const layout = $("#checkout-layout");
  const vazio = $("#checkout-vazio");

  /* ---------- carrinho vazio ---------- */
  if (!itens.length) {
    layout.hidden = true;
    vazio.hidden = false;
    return;
  }

  /* ---------- resumo lateral ---------- */
  function renderResumo() {
    $("#resumo-itens").innerHTML = itens
      .map((i) => {
        const p = acharProduto(i.id) || { nome: i.id, imagens: ["assets/placeholder.svg"] };
        return `
          <div class="resumo-item">
            <img src="${p.imagens[0]}" alt="" onerror="bellaImgFalha(this)">
            <div>
              <strong>${esc(p.nome)}</strong>
              <small>Tam ${esc(i.tamanho)} · ${esc(i.cor)} · ${i.qtd}x</small>
            </div>
            <span style="font-weight:600;font-size:0.92rem">${formatarPreco(i.preco * i.qtd)}</span>
          </div>`;
      })
      .join("");

    const { subtotal, desconto, freteRotulo, total } = resumoValores(itens);
    $("#checkout-subtotal").textContent = formatarPreco(subtotal);
    $("#linha-desconto").hidden = desconto <= 0;
    $("#checkout-desconto").textContent = `-${formatarPreco(desconto)}`;
    $("#checkout-frete").textContent = freteRotulo;
    $("#checkout-total").textContent = formatarPreco(total);

    const aviso = $("#checkout-aviso-frete");
    if (subtotal >= LOJA.freteGratisAcima) {
      aviso.textContent = "Frete grátis liberado para este pedido!";
    } else {
      aviso.textContent = `Faltam ${formatarPreco(LOJA.freteGratisAcima - subtotal)} para o frete grátis.`;
    }
  }
  renderResumo();

  /* ---------- navegação entre passos ---------- */
  let passoAtual = 1;

  function irPara(n) {
    passoAtual = n;
    $$(".checkout-etapa").forEach((e) => e.classList.toggle("ativa", Number(e.dataset.etapa) === n));
    $$(".passo").forEach((p) => p.classList.toggle("ativo", Number(p.dataset.passo) <= n));
    if (n === 3) montarRevisao();
    window.scrollTo({ top: $("#conteudo").offsetTop, behavior: "smooth" });
  }

  $$("[data-proximo]").forEach((btn) =>
    btn.addEventListener("click", () => {
      const destino = Number(btn.dataset.proximo);
      if (destino > passoAtual && !validarPasso(passoAtual)) return;
      irPara(destino);
    })
  );

  /* ---------- validação ---------- */
  const marcar = (campo, valido) => {
    campo.closest(".linha-campo")?.classList.toggle("invalido", !valido);
    return valido;
  };

  function validarPasso(n) {
    const form = $("#form-checkout");
    let ok = true;

    if (n === 1) {
      ok = marcar($("#nome"), $("#nome").value.trim().length >= 3) && ok;
      const tel = $("#whatsapp").value.replace(/\D/g, "");
      ok = marcar($("#whatsapp"), tel.length >= 10) && ok;
      const email = $("#email").value.trim();
      ok = marcar($("#email"), email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
    }

    if (n === 2) {
      const entrega = form.querySelector('input[name="entrega"]:checked')?.value;
      if (entrega === "Entrega em casa") {
        ok = marcar($("#cep"), $("#cep").value.replace(/\D/g, "").length === 8) && ok;
        ok = marcar($("#cidade"), $("#cidade").value.trim().length >= 2) && ok;
        ok = marcar($("#endereco"), $("#endereco").value.trim().length >= 5) && ok;
      }
    }

    if (!ok) toast("Confira os campos destacados para continuar.");
    return ok;
  }

  /* ---------- campos condicionais ---------- */
  function atualizarEntrega() {
    const entrega = $("#form-checkout").querySelector('input[name="entrega"]:checked').value;
    const eEntrega = entrega === "Entrega em casa";
    $("#campos-endereco").style.display = eEntrega ? "" : "none";
    $("#cep").required = eEntrega;
    $("#cidade").required = eEntrega;
    $("#endereco").required = eEntrega;

    const { freteRotulo } = resumoValores(itens);
    if (!eEntrega) $("#checkout-frete").textContent = "Retirada na loja — grátis";
    else $("#checkout-frete").textContent = freteRotulo;
  }
  $$('input[name="entrega"]').forEach((r) => r.addEventListener("change", atualizarEntrega));
  atualizarEntrega();

  /* ---------- máscaras ---------- */
  $("#cep")?.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 8);
    e.target.value = v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v;
  });

  $("#whatsapp")?.addEventListener("input", (e) => {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 6) v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
    else if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`;
    else if (v.length) v = `(${v}`;
    e.target.value = v;
  });

  /* ---------- revisão ---------- */
  function dadosExtras() {
    const entrega = $("#form-checkout").querySelector('input[name="entrega"]:checked').value;
    return [
      $("#nome").value && `Nome: ${$("#nome").value}`,
      $("#whatsapp").value && `WhatsApp: ${$("#whatsapp").value}`,
      $("#email").value && `E-mail: ${$("#email").value}`,
      `Entrega: ${entrega}`,
      entrega === "Entrega em casa" && $("#cep").value && `CEP: ${$("#cep").value}`,
      entrega === "Entrega em casa" && $("#endereco").value && `Endereço: ${$("#endereco").value} - ${$("#cidade").value}`,
      `Pagamento: ${$("#form-checkout").querySelector('input[name="pagamento"]:checked').value}`,
      $("#observacao").value && `Obs.: ${$("#observacao").value}`,
    ].filter(Boolean).join("\n");
  }

  function montarRevisao() {
    $("#revisao-texto").textContent =
      `${$("#nome").value.trim()}, confira se está tudo certo: ` +
      `${totalItens(itens)} ${totalItens(itens) === 1 ? "peça" : "peças"} no pedido.`;
    $("#btn-zap-finalizar").href = linkPedidoWhatsApp(itens, dadosExtras());
  }

  $("#btn-zap-finalizar").addEventListener("click", () => {
    $("#btn-zap-finalizar").href = linkPedidoWhatsApp(itens, dadosExtras());
  });

  /* ---------- conclusão ---------- */
  $("#form-checkout").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validarPasso(1)) return irPara(1);
    if (!validarPasso(2)) return irPara(2);

    const pagamento = $("#form-checkout").querySelector('input[name="pagamento"]:checked').value;
    const pedido = {
      codigo: `BB-${Date.now().toString().slice(-6)}`,
      data: new Date().toLocaleString("pt-BR"),
      nome: $("#nome").value.trim(),
      whatsapp: $("#whatsapp").value.trim(),
      email: $("#email").value.trim(),
      entrega: $("#form-checkout").querySelector('input[name="entrega"]:checked').value,
      endereco: $("#endereco").value.trim(),
      cidade: $("#cidade").value.trim(),
      cep: $("#cep").value.trim(),
      pagamento,
      cupom: lerCupom(),
      observacao: $("#observacao").value.trim(),
      itens: lerSacola(),
      valores: resumoValores(),
    };

    const pedidos = JSON.parse(localStorage.getItem("bb_pedidos") || "[]");
    pedidos.push(pedido);
    localStorage.setItem("bb_pedidos", JSON.stringify(pedidos));
    localStorage.setItem("bb_ultimo_pedido", pedido.codigo);
    salvarSacola([]);
    limparCupom();

    window.location.href = `confirmacao.html?pedido=${encodeURIComponent(pedido.codigo)}`;
  });
});

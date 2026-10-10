/* ==========================================================================
   DDE Sites — comportamento do site
   Sem dependências externas. Todos os recursos degradam bem sem JavaScript.
   ========================================================================== */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var movimentoReduzido = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     1. Menu mobile
     ------------------------------------------------------------------ */
  function iniciarMenu() {
    var botao = document.querySelector(".nav-toggle");
    var nav = document.getElementById("menu-principal");
    if (!botao || !nav) return;

    function fechar() {
      botao.setAttribute("aria-expanded", "false");
      botao.setAttribute("aria-label", "Abrir menu");
      nav.classList.remove("is-aberto");
    }

    function abrir() {
      botao.setAttribute("aria-expanded", "true");
      botao.setAttribute("aria-label", "Fechar menu");
      nav.classList.add("is-aberto");
    }

    botao.addEventListener("click", function () {
      var aberto = botao.getAttribute("aria-expanded") === "true";
      aberto ? fechar() : abrir();
    });

    nav.addEventListener("click", function (evento) {
      if (evento.target.closest("a")) fechar();
    });

    document.addEventListener("keydown", function (evento) {
      if (evento.key === "Escape" && botao.getAttribute("aria-expanded") === "true") {
        fechar();
        botao.focus();
      }
    });

    document.addEventListener("click", function (evento) {
      if (botao.getAttribute("aria-expanded") !== "true") return;
      if (!nav.contains(evento.target) && !botao.contains(evento.target)) fechar();
    });

    // Volta ao estado inicial ao entrar no modo desktop
    var largura = window.matchMedia("(min-width: 961px)");
    var aoMudar = function (evento) { if (evento.matches) fechar(); };
    if (largura.addEventListener) largura.addEventListener("change", aoMudar);
    else if (largura.addListener) largura.addListener(aoMudar);
  }

  /* ------------------------------------------------------------------
     2. Cabeçalho com sombra ao rolar
     ------------------------------------------------------------------ */
  function iniciarHeader() {
    var header = document.querySelector("[data-header]");
    if (!header) return;

    var atualizar = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    atualizar();
    window.addEventListener("scroll", atualizar, { passive: true });
  }

  /* ------------------------------------------------------------------
     3. Animação de entrada (reveal)
     ------------------------------------------------------------------ */
  function iniciarReveal() {
    var itens = document.querySelectorAll(".reveal");
    if (!itens.length) return;

    if (movimentoReduzido || !("IntersectionObserver" in window)) {
      itens.forEach(function (el) { el.classList.add("is-visivel"); });
      return;
    }

    // Elementos já visíveis na abertura aparecem sem depender do observador.
    function revelarVisiveis() {
      itens.forEach(function (el) {
        if (el.classList.contains("is-visivel")) return;
        var ret = el.getBoundingClientRect();
        if (ret.top < window.innerHeight && ret.bottom > 0) {
          el.style.setProperty("--atraso", "0ms");
          el.classList.add("is-visivel");
        }
      });
    }

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        var el = entrada.target;
        var atraso = parseInt(el.getAttribute("data-delay") || "0", 10);
        el.style.setProperty("--atraso", (atraso * 90) + "ms");
        el.classList.add("is-visivel");
        observador.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    itens.forEach(function (el) { observador.observe(el); });
    revelarVisiveis();

    // Rede de segurança: se o observador não disparar (aba oculta, por exemplo),
    // nada fica escondido quando o conteúdo entra na tela.
    var aoRolar = function () {
      revelarVisiveis();
      var restantes = document.querySelectorAll(".reveal:not(.is-visivel)").length;
      if (restantes === 0) window.removeEventListener("scroll", aoRolar);
    };
    window.addEventListener("scroll", aoRolar, { passive: true });

    window.addEventListener("load", function () {
      setTimeout(revelarVisiveis, 300);
    });
  }

  /* ------------------------------------------------------------------
     4. Filtros de projetos
     ------------------------------------------------------------------ */
  function iniciarFiltros() {
    var grupo = document.querySelector("[data-filtros]");
    var grade = document.querySelector("[data-grade-projetos]");
    if (!grupo || !grade) return;

    var botoes = grupo.querySelectorAll(".filtro");
    var cards = grade.querySelectorAll("[data-categoria]");
    var aviso = document.querySelector("[data-contagem]");

    function aplicar(categoria) {
      var visiveis = 0;
      cards.forEach(function (card) {
        var categorias = (card.getAttribute("data-categoria") || "").split(" ");
        var mostrar = categoria === "todos" || categorias.indexOf(categoria) !== -1;
        card.hidden = !mostrar;
        if (mostrar) visiveis++;
      });
      if (aviso) {
        aviso.textContent = visiveis === 1
          ? "1 projeto exibido"
          : visiveis + " projetos exibidos";
      }
    }

    botoes.forEach(function (botao) {
      botao.addEventListener("click", function () {
        botoes.forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        botao.setAttribute("aria-pressed", "true");
        aplicar(botao.getAttribute("data-filtro"));
      });
    });

    aplicar("todos");
  }

  /* ------------------------------------------------------------------
     5. Formulário de orçamento — validação, anti-spam e confirmação
     ------------------------------------------------------------------ */
  function iniciarFormulario() {
    var form = document.querySelector("[data-formulario]");
    if (!form) return;

    var ok = form.querySelector(".formulario__ok");
    var mensagemGeral = form.querySelector("[data-erro-geral]");

    var regras = {
      nome: function (valor) {
        if (!valor.trim()) return "Informe o seu nome.";
        if (valor.trim().length < 2) return "Digite pelo menos 2 caracteres.";
        return "";
      },
      empresa: function (valor) {
        if (!valor.trim()) return "Informe o nome da empresa ou do projeto.";
        return "";
      },
      contato: function (valor) {
        var v = valor.trim();
        if (!v) return "Informe um e-mail ou telefone para retorno.";
        var email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        var telefone = /^[\d\s()+-]{10,20}$/;
        if (email.test(v)) return "";
        if (telefone.test(v)) return "";
        if (v.indexOf("@") !== -1) return "Verifique o formato do e-mail.";
        return "Informe um telefone com DDD, com pelo menos 10 dígitos.";
      },
      tipo: function (valor) {
        if (!valor) return "Selecione o tipo de site desejado.";
        return "";
      },
      descricao: function (valor) {
        if (!valor.trim()) return "Descreva brevemente o projeto.";
        if (valor.trim().length < 20) return "Conte um pouco mais: mínimo de 20 caracteres.";
        return "";
      },
      aceite: function (valor, campo) {
        if (!campo.checked) return "Confirme a autorização para que possamos retornar o contato.";
        return "";
      }
    };

    function validarCampo(campo) {
      var erro = regras[campo.name];
      if (!erro) return true;

      var alvo = form.querySelector('[data-erro-for="' + campo.name + '"]');
      var mensagem = erro(campo.value || "", campo);

      if (mensagem) {
        campo.setAttribute("aria-invalid", "true");
        if (alvo) alvo.textContent = mensagem;
        return false;
      }

      campo.removeAttribute("aria-invalid");
      if (alvo) alvo.textContent = "";
      return true;
    }

    Object.keys(regras).forEach(function (nome) {
      var campo = form.elements[nome];
      if (!campo) return;

      campo.addEventListener("blur", function () { validarCampo(campo); });
      campo.addEventListener("input", function () {
        if (campo.getAttribute("aria-invalid") === "true") validarCampo(campo);
      });
      campo.addEventListener("change", function () {
        if (campo.getAttribute("aria-invalid") === "true") validarCampo(campo);
      });
    });

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();

      if (mensagemGeral) mensagemGeral.textContent = "";

      // Proteção contra envios automatizados: campo escondido (honeypot)
      // e verificação de tempo mínimo de preenchimento.
      var armadilha = form.elements["website"];
      var tempo = Date.now() - (window.__inicioFormulario || Date.now());
      if ((armadilha && armadilha.value) || (tempo > 0 && tempo < 2500)) {
        if (mensagemGeral) {
          mensagemGeral.textContent =
            "Não foi possível enviar agora. Revise os campos e tente novamente.";
        }
        return;
      }

      var valido = true;
      var primeiroInvalido = null;

      Object.keys(regras).forEach(function (nome) {
        var campo = form.elements[nome];
        if (!campo) return;
        if (!validarCampo(campo)) {
          valido = false;
          if (!primeiroInvalido) primeiroInvalido = campo;
        }
      });

      if (!valido) {
        if (mensagemGeral) {
          mensagemGeral.textContent = "Confira os campos destacados antes de enviar.";
        }
        if (primeiroInvalido) primeiroInvalido.focus();
        return;
      }

      // Sem backend: exibe a confirmação. Conecte um serviço de envio
      // (Formspree, Netlify Forms, e-mail do servidor) antes de publicar.
      form.classList.add("is-enviado");
      if (ok) {
        ok.classList.add("is-visivel");
        ok.setAttribute("tabindex", "-1");
        ok.focus();
      }
    });

    window.__inicioFormulario = Date.now();
  }

  /* ------------------------------------------------------------------
     6. Ano corrente no rodapé
     ------------------------------------------------------------------ */
  function iniciarAno() {
    var alvos = document.querySelectorAll("[data-ano]");
    var ano = String(new Date().getFullYear());
    alvos.forEach(function (el) { el.textContent = ano; });
  }

  /* ------------------------------------------------------------------
     7. Rolagem suave respeitando o cabeçalho
     ------------------------------------------------------------------ */
  function iniciarAncoras() {
    document.addEventListener("click", function (evento) {
      var link = evento.target.closest('a[href^="#"]');
      if (!link) return;

      var id = link.getAttribute("href");
      if (!id || id === "#") return;

      var alvo = document.querySelector(id);
      if (!alvo) return;

      evento.preventDefault();
      alvo.scrollIntoView({ behavior: movimentoReduzido ? "auto" : "smooth", block: "start" });
      alvo.setAttribute("tabindex", "-1");
      alvo.focus({ preventScroll: true });
      history.replaceState(null, "", id);
    });
  }

  /* ------------------------------------------------------------------
     Inicialização
     ------------------------------------------------------------------ */
  function iniciar() {
    iniciarMenu();
    iniciarHeader();
    iniciarReveal();
    iniciarFiltros();
    iniciarFormulario();
    iniciarAno();
    iniciarAncoras();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();

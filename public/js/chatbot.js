/**
 * Chatbot de atendimento da LVS Bio.
 * Fluxo 100% predefinido (sem IA, sem coleta de dados pessoais).
 * API pública: window.LVSChatbot.open(serviceKey?, source?)
 */
(function () {
  'use strict';

  var cfg = window.LVS_CONFIG || {};
  var WHATSAPP_NUMBER = cfg.whatsappNumber || '5582996402650';

  var SERVICES = {
    bio: {
      option: 'Quero criar uma página para bio.',
      name: 'criação de página para bio',
      description: 'Uma página profissional para reunir seus links, apresentar seus serviços e facilitar o contato com potenciais clientes.',
      question: 'Qual é o seu principal objetivo com a página de bio?',
      goals: [
        'Reunir meus contatos e serviços',
        'Divulgar meu negócio no Instagram',
        'Direcionar visitantes dos anúncios para o atendimento'
      ]
    },
    leads: {
      option: 'Preciso de um sistema para registrar leads.',
      name: 'sistema de registro de leads',
      description: 'Um sistema para registrar, organizar e acompanhar contatos comerciais vindos de anúncios, redes sociais e outros canais.',
      question: 'O que você mais precisa resolver com o sistema de leads?',
      goals: [
        'Organizar contatos comerciais',
        'Acompanhar o status das oportunidades',
        'Centralizar os leads recebidos'
      ]
    },
    landing: {
      option: 'Quero criar uma landing page.',
      name: 'criação de landing page',
      description: 'Uma página criada para apresentar uma oferta específica e estimular uma ação, como pedir orçamento ou entrar em contato.',
      question: 'Qual é o seu principal objetivo com a landing page?',
      goals: [
        'Divulgar um serviço específico',
        'Criar uma página para anúncios',
        'Receber solicitações de orçamento'
      ]
    },
    site: {
      option: 'Preciso de um site institucional.',
      name: 'site institucional',
      description: 'Um site profissional para apresentar sua empresa, seus serviços, diferenciais e canais de contato.',
      question: 'Qual é o seu principal objetivo com o site institucional?',
      goals: [
        'Apresentar minha empresa',
        'Divulgar meus serviços',
        'Facilitar o contato com clientes'
      ]
    }
  };

  var STEP_LABELS = [
    'Etapa 1 de 3 — Escolha o serviço',
    'Etapa 2 de 3 — Defina seu objetivo',
    'Etapa 3 de 3 — Continue pelo WhatsApp'
  ];

  var els = {};
  var state = { step: 1, service: null, goal: null, busy: false, isOpen: false };
  var lastFocus = null;

  function buildWhatsAppUrl(message) {
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
  }

  function buildServiceMessage(serviceKey, goal) {
    var s = SERVICES[serviceKey];
    return 'Olá! Vim pela página da LVS Bio e tenho interesse no serviço de ' + s.name + '. ' +
      'Meu objetivo é ' + goal.charAt(0).toLowerCase() + goal.slice(1) + '. Gostaria de saber mais.';
  }

  function buildGenericMessage() {
    return 'Olá! Vim pela página da LVS Bio e gostaria de saber mais sobre os serviços.';
  }

  // ---------- Renderização ----------
  function scrollToBottom() {
    els.body.scrollTop = els.body.scrollHeight;
  }

  function addMessage(text, who) {
    var div = document.createElement('div');
    div.className = 'chat-msg ' + who;
    div.textContent = text;
    els.body.appendChild(div);
    scrollToBottom();
  }

  function addOptions(items) {
    var wrap = document.createElement('div');
    wrap.className = 'chat-options';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Opções de resposta');

    items.forEach(function (item) {
      var el;
      if (item.href) {
        el = document.createElement('a');
        el.href = item.href;
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
      } else {
        el = document.createElement('button');
        el.type = 'button';
      }
      el.className = 'chat-option' + (item.whatsapp ? ' is-whatsapp' : '');
      el.textContent = item.label;
      el.addEventListener('click', function (event) {
        if (item.href) {
          if (item.onClick) item.onClick();
          return;
        }
        event.preventDefault();
        if (state.busy) return; // trata cliques repetidos
        state.busy = true;
        wrap.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
        item.onClick();
        state.busy = false;
      });
      wrap.appendChild(el);
    });

    els.body.appendChild(wrap);
    scrollToBottom();
    var first = wrap.querySelector('button, a');
    if (first && state.isOpen) first.focus({ preventScroll: true });
  }

  function setStep(step) {
    state.step = step;
    var dots = els.steps.querySelectorAll('.chat-step');
    dots.forEach(function (dot, i) { dot.classList.toggle('is-active', i < step); });
    els.stepLabel.textContent = STEP_LABELS[step - 1];
  }

  // ---------- Fluxo ----------
  function showWelcome() {
    els.body.innerHTML = '';
    state.service = null;
    state.goal = null;
    setStep(1);
    addMessage('Olá! Seja bem-vindo à LVS Bio.\n\nComo posso ajudar você a melhorar sua presença digital?', 'bot');
    addOptions([
      { label: '1. ' + SERVICES.bio.option, onClick: function () { selectService('bio', 'chatbot_menu'); } },
      { label: '2. ' + SERVICES.leads.option, onClick: function () { selectService('leads', 'chatbot_menu'); } },
      { label: '3. ' + SERVICES.landing.option, onClick: function () { selectService('landing', 'chatbot_menu'); } },
      { label: '4. ' + SERVICES.site.option, onClick: function () { selectService('site', 'chatbot_menu'); } },
      { label: '5. Quero conhecer melhor os serviços.', onClick: showServicesOverview },
      {
        label: '6. Falar diretamente pelo WhatsApp.',
        whatsapp: true,
        href: buildWhatsAppUrl(buildGenericMessage()),
        onClick: function () {
          window.LVSAnalytics.track('whatsapp_click', { source: 'chatbot_menu', service: 'none' });
        }
      }
    ]);
  }

  function showServicesOverview() {
    addMessage('Quero conhecer melhor os serviços.', 'user');
    addMessage(
      'Estes são os serviços disponíveis:\n\n' +
      '• Página para bio: reúne seus links e contatos.\n' +
      '• Sistema de registro de leads: organiza seus contatos comerciais.\n' +
      '• Landing page: apresenta uma oferta e estimula uma ação.\n' +
      '• Site institucional: apresenta sua empresa de forma profissional.\n\n' +
      'Qual deles faz mais sentido para você?',
      'bot'
    );
    addOptions([
      { label: SERVICES.bio.option, onClick: function () { selectService('bio', 'chatbot_overview'); } },
      { label: SERVICES.leads.option, onClick: function () { selectService('leads', 'chatbot_overview'); } },
      { label: SERVICES.landing.option, onClick: function () { selectService('landing', 'chatbot_overview'); } },
      { label: SERVICES.site.option, onClick: function () { selectService('site', 'chatbot_overview'); } }
    ]);
  }

  function selectService(key, source) {
    var s = SERVICES[key];
    if (!s) return;
    state.service = key;
    setStep(2);
    window.LVSAnalytics.track('chatbot_service_select', { service: key, source: source || 'chatbot' });
    addMessage(s.option, 'user');
    addMessage(s.description + '\n\n' + s.question, 'bot');
    addOptions(
      s.goals.map(function (goal) {
        return { label: goal, onClick: function () { selectGoal(goal); } };
      })
    );
  }

  function selectGoal(goal) {
    var s = SERVICES[state.service];
    state.goal = goal;
    setStep(3);
    addMessage(goal, 'user');
    addMessage(
      'Perfeito! Resumo do seu interesse:\n\n' +
      '• Serviço: ' + s.name + '\n' +
      '• Objetivo: ' + goal + '\n\n' +
      'Clique abaixo para continuar o atendimento pelo WhatsApp.',
      'bot'
    );
    var serviceKey = state.service;
    addOptions([
      {
        label: 'Continuar pelo WhatsApp',
        whatsapp: true,
        href: buildWhatsAppUrl(buildServiceMessage(serviceKey, goal)),
        onClick: function () {
          window.LVSAnalytics.track('whatsapp_click', { source: 'chatbot_resumo', service: serviceKey });
        }
      },
      { label: 'Recomeçar conversa', onClick: showWelcome }
    ]);
  }

  // ---------- Abrir / fechar ----------
  function openChat(serviceKey, source) {
    if (!state.isOpen) {
      lastFocus = document.activeElement;
      state.isOpen = true;
      els.window.classList.add('is-open');
      els.window.setAttribute('aria-hidden', 'false');
      els.toggle.setAttribute('aria-expanded', 'true');
      els.toggle.setAttribute('aria-label', 'Fechar chat de atendimento');
      window.LVSAnalytics.track('chatbot_open', { source: source || 'fab' });
      if (!els.body.children.length) showWelcome();
    }
    if (serviceKey && SERVICES[serviceKey]) {
      showWelcome();
      selectService(serviceKey, source || 'page_button');
    } else {
      var first = els.body.querySelector('.chat-option:not(:disabled)');
      if (first) first.focus({ preventScroll: true });
    }
  }

  function closeChat() {
    if (!state.isOpen) return;
    state.isOpen = false;
    els.window.classList.remove('is-open');
    els.window.setAttribute('aria-hidden', 'true');
    els.toggle.setAttribute('aria-expanded', 'false');
    els.toggle.setAttribute('aria-label', 'Abrir chat de atendimento');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
    else els.toggle.focus({ preventScroll: true });
  }

  function init() {
    els.toggle = document.getElementById('chat-toggle');
    els.window = document.getElementById('chat-window');
    els.body = document.getElementById('chat-body');
    els.steps = document.getElementById('chat-steps');
    els.stepLabel = document.getElementById('chat-step-label');
    els.close = document.getElementById('chat-close');
    els.restart = document.getElementById('chat-restart');
    if (!els.toggle || !els.window) return;

    els.toggle.addEventListener('click', function () {
      if (state.isOpen) closeChat(); else openChat(null, 'fab');
    });
    els.close.addEventListener('click', closeChat);
    els.restart.addEventListener('click', function () {
      showWelcome();
      var first = els.body.querySelector('.chat-option');
      if (first) first.focus({ preventScroll: true });
    });

    // Esc fecha; Tab fica contido dentro da janela quando aberta
    document.addEventListener('keydown', function (event) {
      if (!state.isOpen) return;
      if (event.key === 'Escape') { closeChat(); return; }
      if (event.key !== 'Tab') return;
      if (!els.window.contains(document.activeElement)) return;
      var focusables = els.window.querySelectorAll('button:not(:disabled), a[href]');
      if (!focusables.length) return;
      var firstEl = focusables[0];
      var lastEl = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) { event.preventDefault(); lastEl.focus(); }
      else if (!event.shiftKey && document.activeElement === lastEl) { event.preventDefault(); firstEl.focus(); }
    });
  }

  window.LVSChatbot = {
    open: openChat,
    close: closeChat,
    buildWhatsAppUrl: buildWhatsAppUrl,
    buildGenericMessage: buildGenericMessage
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

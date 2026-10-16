/**
 * Lógica geral da página: ícones, botões, WhatsApp, Instagram, animações e privacidade.
 */
(function () {
  'use strict';

  var cfg = window.LVS_CONFIG || {};

  function onReady(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  onReady(function () {
    // Ícones Lucide
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    // Ano do rodapé
    var year = document.getElementById('ano-atual');
    if (year) year.textContent = String(new Date().getFullYear());

    // Botões que abrem o chatbot (com serviço pré-selecionado, se houver)
    document.querySelectorAll('[data-open-chat]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var service = btn.getAttribute('data-service');
        var source = btn.getAttribute('data-source') || 'page_button';
        if (service) {
          window.LVSAnalytics.track('service_button_click', { service: service, source: source });
        } else {
          window.LVSAnalytics.track('cta_click', { cta: btn.getAttribute('data-cta') || 'open_chat' });
        }
        window.LVSChatbot.open(service, source);
      });
    });

    // Links de ancoragem registrados como CTA
    document.querySelectorAll('a[data-cta]').forEach(function (link) {
      link.addEventListener('click', function () {
        window.LVSAnalytics.track('cta_click', { cta: link.getAttribute('data-cta') });
      });
    });

    // Links de WhatsApp (mensagem codificada com encodeURIComponent)
    document.querySelectorAll('[data-whatsapp]').forEach(function (link) {
      link.href = window.LVSChatbot.buildWhatsAppUrl(window.LVSChatbot.buildGenericMessage());
      link.addEventListener('click', function () {
        window.LVSAnalytics.track('whatsapp_click', {
          source: link.getAttribute('data-source') || 'page',
          service: 'none'
        });
      });
    });

    // Instagram configurável: só aparece se houver URL válida em config.js
    var igItem = document.getElementById('instagram-item');
    var igLink = document.getElementById('instagram-link');
    if (igItem && igLink && /^https?:\/\//i.test(cfg.instagramUrl || '')) {
      igLink.href = cfg.instagramUrl;
      igItem.hidden = false;
      igLink.addEventListener('click', function () {
        window.LVSAnalytics.track('cta_click', { cta: 'instagram_footer' });
      });
    }

    // Animação de entrada discreta (respeita movimento reduzido via CSS)
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      reveals.forEach(function (el) { observer.observe(el); });
    } else {
      reveals.forEach(function (el) { el.classList.add('is-visible'); });
    }

    // Política de privacidade
    var dialog = document.getElementById('privacy-dialog');
    var openBtn = document.getElementById('privacy-open');
    var closeBtn = document.getElementById('privacy-close');
    if (dialog && openBtn && closeBtn) {
      openBtn.addEventListener('click', function () {
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
      });
      closeBtn.addEventListener('click', function () {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
      });
      dialog.addEventListener('click', function (event) {
        if (event.target === dialog && typeof dialog.close === 'function') dialog.close();
      });
    }

    // Consentimento de analytics (só aparece se IDs estiverem configurados)
    window.LVSAnalytics.initConsent();
  });
})();

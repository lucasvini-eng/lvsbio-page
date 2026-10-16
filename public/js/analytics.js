/**
 * Camada de analytics da LVS Bio.
 *
 * - Nada é carregado enquanto os IDs em config.js estiverem vazios.
 * - Mesmo com IDs, os rastreadores só são carregados após consentimento.
 *
 * Eventos documentados (nomes consistentes):
 *   service_button_click   -> clique em botão/card de serviço       { service, source }
 *   chatbot_open           -> abertura do chatbot                   { source }
 *   chatbot_service_select -> seleção de serviço no chatbot         { service }
 *   whatsapp_click         -> clique para iniciar conversa          { source, service }
 *   cta_click              -> clique em chamada para ação genérica  { cta }
 */
(function () {
  'use strict';

  var CONSENT_KEY = 'lvs_analytics_consent';
  var cfg = window.LVS_CONFIG || {};
  var loaded = false;

  function hasProvider() {
    return Boolean(cfg.ga4MeasurementId || cfg.metaPixelId);
  }

  function readConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }

  function writeConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* armazenamento indisponível */ }
  }

  function loadScript(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  function loadGa4(id) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true });
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id));
  }

  function loadMetaPixel(id) {
    /* eslint-disable */
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = true; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', id);
    window.fbq('track', 'PageView');
  }

  function loadTrackers() {
    if (loaded || !hasProvider() || readConsent() !== 'granted') return;
    loaded = true;
    if (cfg.ga4MeasurementId) loadGa4(cfg.ga4MeasurementId);
    if (cfg.metaPixelId) loadMetaPixel(cfg.metaPixelId);
  }

  /** Registra um evento nas ferramentas ativas (no-op se nada estiver ativo). */
  function track(eventName, params) {
    if (!loaded) return;
    var data = params || {};
    try {
      if (typeof window.gtag === 'function') window.gtag('event', eventName, data);
      if (typeof window.fbq === 'function') window.fbq('trackCustom', eventName, data);
    } catch (e) { /* nunca quebrar a página por causa de analytics */ }
  }

  /** Exibe o aviso de consentimento apenas quando há ferramenta configurada e ainda sem resposta. */
  function initConsent() {
    var banner = document.getElementById('consent-banner');
    if (!banner || !hasProvider()) return;

    var current = readConsent();
    if (current === 'granted') { loadTrackers(); return; }
    if (current === 'denied') return;

    banner.hidden = false;
    var accept = document.getElementById('consent-accept');
    var decline = document.getElementById('consent-decline');

    accept.addEventListener('click', function () {
      writeConsent('granted');
      banner.hidden = true;
      loadTrackers();
    });
    decline.addEventListener('click', function () {
      writeConsent('denied');
      banner.hidden = true;
    });
  }

  window.LVSAnalytics = { track: track, initConsent: initConsent };
})();

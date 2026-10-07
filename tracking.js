/* =========================================================
   Remarketing: Meta Pixel (Instagram/Facebook) e Google (GA4 / Google Ads)
   Os códigos só são carregados depois que o visitante aceita os cookies (LGPD).
   ========================================================= */

// ===== Edite aqui =====
const META_PIXEL_ID = "";   // ex.: "123456789012345"  (Gerenciador de Eventos da Meta > Fontes de dados > Pixel)
const GOOGLE_TAG_ID = "";   // ex.: "G-XXXXXXXXXX" (GA4) ou "AW-XXXXXXXXX" (Google Ads)
// ======================

const CONSENT_KEY = 'crm_cookies';

function lerConsentimento() {
  try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
}
function salvarConsentimento(v) {
  try { localStorage.setItem(CONSENT_KEY, v); } catch (e) { /* navegação privada */ }
}

function carregarPixels() {
  if (window.__pixelsCarregados) return;
  window.__pixelsCarregados = true;

  if (META_PIXEL_ID) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', META_PIXEL_ID);
    fbq('track', 'PageView');
  }
  if (GOOGLE_TAG_ID) {
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GOOGLE_TAG_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GOOGLE_TAG_ID);
  }
  (window.__eventosPendentes || []).forEach(([nome, dados]) => rastrear(nome, dados));
  window.__eventosPendentes = [];
}

/* Eventos usados nas páginas:
   - "InscricaoIniciada": abriu a página de inscrição
   - "InscricaoConfirmada": concluiu a inscrição (base do público de remarketing) */
function rastrear(nome, dados = {}) {
  if (lerConsentimento() !== 'aceito') return;
  if (!window.__pixelsCarregados) { (window.__eventosPendentes ||= []).push([nome, dados]); return; }
  const meta = { InscricaoIniciada: 'InitiateCheckout', InscricaoConfirmada: 'CompleteRegistration' }[nome];
  if (window.fbq && meta) fbq('track', meta, { content_name: 'Conferência Reformada do Marajó 2026', ...dados });
  if (window.gtag) gtag('event', nome === 'InscricaoConfirmada' ? 'sign_up' : 'begin_checkout', { event_category: 'inscricao', ...dados });
}
window.rastrear = rastrear;

// Aviso de cookies
function mostrarAviso() {
  const box = document.createElement('div');
  box.className = 'cookie-bar';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-label', 'Aviso de cookies');
  box.innerHTML = `
    <p>Usamos cookies para medir o alcance do site e para mostrar convites das próximas edições da conferência nas redes sociais.</p>
    <div>
      <button type="button" data-v="recusado" class="cookie-no">Recusar</button>
      <button type="button" data-v="aceito" class="cookie-yes">Aceitar</button>
    </div>`;
  box.addEventListener('click', e => {
    const v = e.target.dataset?.v; if (!v) return;
    salvarConsentimento(v); box.remove();
    if (v === 'aceito') carregarPixels();
  });
  document.body.appendChild(box);
}

// Só mostra o aviso se houver algum código configurado
if (META_PIXEL_ID || GOOGLE_TAG_ID) {
  const c = lerConsentimento();
  if (c === 'aceito') carregarPixels();
  else if (!c) document.addEventListener('DOMContentLoaded', mostrarAviso);
}

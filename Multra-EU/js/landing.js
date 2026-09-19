// Multra E.U. — Lógica de la landing pública. Conectada al backend.
(function () {
  const ICON = {
    rtm_liv: 'bi-tools', rtm_moto: 'bi-motorcycle', rtm_pes: 'bi-truck',
    soat_auto_lt10: 'bi-shield-check', soat_auto_mid: 'bi-shield-check', soat_auto_gt10: 'bi-shield-check',
    soat_moto_100: 'bi-shield-check', soat_moto_gt200: 'bi-shield-check',
    tr_auto_basico: 'bi-shield-lock', tr_auto_full: 'bi-shield-lock',
    traspaso_auto: 'bi-arrow-left-right', traspaso_moto: 'bi-arrow-left-right',
    licencia_carro_nueva: 'bi-person-vcard', licencia_moto_nueva: 'bi-person-vcard',
    licencia_carro_renov: 'bi-person-vcard', licencia_moto_renov: 'bi-person-vcard',
    placas: 'bi-badge-ad',
    motor: 'bi-wrench-adjustable', peritaje: 'bi-search', gnvc: 'bi-fuel-pump'
  };

  let SERVICIOS = [];   // cargado del backend
  let cart = [];

  // ---- Navbar móvil ----
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('l-nav__links--open'));
    navLinks.addEventListener('click', e => { if (e.target.tagName === 'A') navLinks.classList.remove('l-nav__links--open'); });
  }

  // ---- Cargar servicios del backend ----
  async function loadServicios() {
    try {
      const res = await fetch('/api/servicios');
      if (!res.ok) throw new Error('No se pudo cargar el catálogo');
      SERVICIOS = await res.json();
    } catch (e) {
      console.error('Fallo cargando servicios del backend:', e);
      document.getElementById('publicServices').innerHTML =
        '<div class="l-empty" style="grid-column:1/-1"><i class="bi bi-wifi-off"></i>No pudimos cargar el catálogo. Intenta recargar.</div>';
      return;
    }
    renderGrid(document.getElementById('publicServices'), false);
    renderGrid(document.getElementById('publicServices2'), true);
  }

  function renderGrid(el, selectable) {
    if (!el) return;
    if (!SERVICIOS.length) { el.innerHTML = '<div class="l-empty" style="grid-column:1/-1"><i class="bi bi-bag"></i>Sin servicios disponibles</div>'; return; }
    el.innerHTML = SERVICIOS.map(s => `
      <div class="l-service${selectable ? ' l-service--selectable' : ''}" data-id="${s.id}">
        <div class="l-service__head">
          <div class="l-service__ico"><i class="bi ${ICON[s.id] || 'bi-car-front'}"></i></div>
          <h3>${s.nombre}</h3>
        </div>
        <p>${s.desc || ''}</p>
        <div class="l-service__foot">
          <span class="l-service__price">${Multra.fmtCOP(s.precio)}</span>
          ${selectable
            ? '<i class="bi bi-plus-circle l-service__add"></i>'
            : '<a class="l-service__link" href="#cotizar" data-id="' + s.id + '">Cotizar →</a>'}
        </div>
      </div>`).join('');
  }

  // Click handler delegación: una sola vez en el documento
  document.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-id]');
    if (!a) return;
    const id = a.dataset.id;
    const isSelectable = a.classList.contains('l-service--selectable');
    const isLink = a.classList.contains('l-service__link');
    e.preventDefault();
    if (isSelectable) {
      toggleService(id);
    } else if (isLink) {
      document.getElementById('cotizar').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => toggleService(id), 400);
    }
  });

  function toggleService(id) {
    const s = SERVICIOS.find(x => x.id === id);
    if (!s) return;
    const i = cart.findIndex(x => x.id === id);
    if (i >= 0) cart.splice(i, 1); else cart.push({ id, nombre: s.nombre, precio: s.precio });
    document.querySelectorAll(`.l-service--selectable[data-id="${id}"]`).forEach(c => c.classList.toggle('l-service--selected', i < 0));
    renderCart();
  }

  async function renderCart() {
    const el = document.getElementById('publicCart');
    if (!el) return;
    if (!cart.length) {
      el.innerHTML = '<div class="l-empty"><i class="bi bi-bag"></i>Selecciona servicios para cotizar</div>';
      return;
    }
    // Calcular vía backend para que los precios coincidan con lo que el admin ve
    try {
        const r = await fetch('/api/cotizar/publico', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.map(x => ({ servicioId: x.id, cantidad: 1 })), descuentoPct: 0 })
      });
      const data = await r.json();
      el.innerHTML = `
        ${cart.map(x => `
          <div class="l-cart-line">
            <span>${x.nombre}</span>
            <span>
              ${Multra.fmtCOP(x.precio)}
              <button class="l-cart-remove" data-rm="${x.id}" title="Quitar"><i class="bi bi-trash"></i></button>
            </span>
          </div>`).join('')}
        <div class="l-cart-line"><span class="muted">Subtotal</span><span>${data.formatted.subtotal}</span></div>
        <div class="l-cart-line"><span class="muted">IVA 19%</span><span>${data.formatted.iva}</span></div>
        <div class="l-cart-line l-cart-total"><span>TOTAL</span><span style="color:var(--y2)">${data.formatted.total}</span></div>`;
      el.querySelectorAll('.l-cart-remove').forEach(btn => btn.addEventListener('click', () => toggleService(btn.dataset.rm)));
    } catch (e) {
      // fallback local si el backend no responde
      const subtotal = cart.reduce((a, x) => a + x.precio, 0);
      const iva = Math.round(subtotal * 0.19);
      const total = subtotal + iva;
      el.innerHTML = `
        ${cart.map(x => `<div class="l-cart-line"><span>${x.nombre}</span><span>${Multra.fmtCOP(x.precio)}<button class="l-cart-remove" data-rm="${x.id}"><i class="bi bi-trash"></i></button></span></div>`).join('')}
        <div class="l-cart-line"><span class="muted">Subtotal</span><span>${Multra.fmtCOP(subtotal)}</span></div>
        <div class="l-cart-line"><span class="muted">IVA 19%</span><span>${Multra.fmtCOP(iva)}</span></div>
        <div class="l-cart-line l-cart-total"><span>TOTAL</span><span style="color:var(--y2)">${Multra.fmtCOP(total)}</span></div>`;
      el.querySelectorAll('.l-cart-remove').forEach(btn => btn.addEventListener('click', () => toggleService(btn.dataset.rm)));
    }
  }
  window.publicQuote = renderCart;

  // ---- Chatbot ----
  const chat = document.getElementById('chat');
  const chatBody = document.getElementById('chatBody');
  const chatText = document.getElementById('chatText');
  const botBtn = document.getElementById('botBtn');
  const chatClose = document.getElementById('chatClose');
  if (botBtn && chat) {
    botBtn.addEventListener('click', () => chat.classList.toggle('l-chat--open'));
    chatClose.addEventListener('click', () => chat.classList.remove('l-chat--open'));
  }
  function sendChat() {
    if (!chatText || !chatBody) return;
    const q = chatText.value.trim(); if (!q) return;
    chatBody.insertAdjacentHTML('beforeend', `<div class="l-msg l-msg--user">${Multra.esc(q)}</div>`);
    chatText.value = '';
    setTimeout(() => {
      chatBody.insertAdjacentHTML('beforeend', `<div class="l-msg l-msg--bot">${answer(q)}</div>`);
      chatBody.scrollTop = chatBody.scrollHeight;
    }, 300);
  }
  if (chatText) {
    document.getElementById('chatSend').addEventListener('click', sendChat);
    chatText.addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
  }
  function answer(q) {
    q = q.toLowerCase();
    if (/tecn|revisi|mecan/.test(q)) return 'La técnico-mecánica cuesta desde $227.800 (motos) o $327.700 (livianos). Trae cédula, tarjeta de propiedad y SOAT vigente. Tarifas reguladas por el Ministerio de Transporte.';
    if (/soat/.test(q)) return 'Vendemos SOAT con Sura, Mapfre y más. El precio depende del cilindraje y la antigüedad del vehículo. Tarifas oficiales de la Superintendencia Financiera.';
    if (/todo riesgo|seguro/.test(q)) return 'Tenemos seguro todo riesgo desde $1.500.000 (vehículos de ~$25M) hasta $2.600.000 (sedán nuevo). Coberturas a medida.';
    if (/traspas/.test(q)) return 'Traspaso de carro $260.400, de moto $145.500 (tarifas SDM Bogotá 2026). No incluye retefuente ni SOAT. 3-5 días hábiles.';
    if (/licencia/.test(q)) return 'Licencia para carro 1ª vez $329.800, renovación $151.500. Para moto 1ª vez $272.700, renovación $266.400 (SDM Bogotá 2026).';
    if (/placa/.test(q)) return 'Duplicado de placas $180.000. Si fue por hurto, trae denuncia.';
    if (/horario|atienden/.test(q)) return 'Lun a Sáb de 7:00 AM a 6:00 PM en C.C. Los Comuneros, local 162.';
    if (/ubic|direc|donde/.test(q)) return 'C.c. Los Comuneros L-162, Neiva, Huila. Mira la sección Ubicación.';
    if (/precio|valor|cuanto|cotiz/.test(q)) return 'Usa la sección "Cotizar" para armar tu paquete. Los precios se calculan con IVA al instante.';
    return 'Puedo ayudarte con técnico-mecánica, SOAT, todo riesgo, traspasos, licencias, placas, horarios y ubicación.';
  }

  // Inicializar
  loadServicios();
})();

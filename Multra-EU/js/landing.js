// Multra E.U. — Lógica de la landing pública. Conectada al backend.
(function () {
  const ICON = {
    rtm_liv: 'wrench', rtm_moto: 'motorcycle', rtm_pes: 'truck',
    soat_auto_lt10: 'shield-check', soat_auto_mid: 'shield-check', soat_auto_gt10: 'shield-check',
    soat_moto_100: 'shield-check', soat_moto_gt200: 'shield-check',
    tr_auto_basico: 'shield-star', tr_auto_full: 'shield-star',
    traspaso_auto: 'arrow-left-right', traspaso_moto: 'arrow-left-right',
    licencia_carro_nueva: 'identification-card', licencia_moto_nueva: 'identification-card',
    licencia_carro_renov: 'identification-card', licencia_moto_renov: 'identification-card',
    placas: 'license-plate',
    motor: 'wrench', peritaje: 'magnifying-glass', gnvc: 'gas-pump'
  };

  const CAT_LABEL = { tecnomecanica: 'RTM', seguro: 'Seguros', tramite: 'Trámites', peritaje: 'Otros' };

  const PACKAGES = [
    { id: 'pkg-rtm-completo', icon: 'ph:wrench', titulo: 'RTM Completo', desc: 'Revisión + certificado digital + gestión RUNT', items: ['rtm_liv'], descuento: 5, badge: 'Más popular' },
    { id: 'pkg-rtm-soat', icon: 'ph:shield-check', titulo: 'RTM + SOAT', desc: 'Inspección + póliza SOAT auto en combo', items: ['rtm_liv', 'soat_auto_lt10'], descuento: 8, badge: 'Ahorra 8%' },
    { id: 'pkg-traspaso-auto', icon: 'ph:arrow-left-right', titulo: 'Traspaso Auto', desc: 'Cambio de propietario completo ante SDM', items: ['traspaso_auto'], descuento: 5, badge: null },
    { id: 'pkg-licencia-nueva', icon: 'ph:identification-card', titulo: 'Licencia 1ª vez', desc: 'Trámite + certificado + entrega', items: ['licencia_carro_nueva'], descuento: 5, badge: null },
    { id: 'pkg-flotilla', icon: 'ph:truck', titulo: 'Flotilla Pesados', desc: 'RTM + seguro para vehículo pesado', items: ['rtm_pes', 'soat_auto_lt10'], descuento: 10, badge: 'Ahorra 10%' },
  ];

  let SERVICIOS = [];
  let cart = [];
  let activeCat = 'all';
  let activePackage = null;

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('l-nav__links--open'));
    navLinks.addEventListener('click', e => { if (e.target.tagName === 'A') navLinks.classList.remove('l-nav__links--open'); });
  }

  async function loadServicios() {
    try {
      const res = await fetch('/api/servicios');
      if (!res.ok) throw new Error('No se pudo cargar el catálogo');
      SERVICIOS = await res.json();
    } catch (e) {
      console.error('Fallo cargando servicios:', e);
      const grid = document.getElementById('cotGrid');
      if (grid) grid.innerHTML = '<div class="l-cot__error"><i class="bi ph:wifi-slash"></i> No pudimos cargar el catálogo. Intenta recargar.</div>';
      return;
    }
    renderTabs();
    renderGrid();
    renderPackages();
    renderCatalogSection();
  }

  function renderTabs() {
    const tabsEl = document.getElementById('cotTabs');
    if (!tabsEl) return;
    const counts = SERVICIOS.reduce((acc, s) => { acc[s.tipo] = (acc[s.tipo] || 0) + 1; acc.all = (acc.all || 0) + 1; return acc; }, {});
    tabsEl.querySelectorAll('.l-cot__tab').forEach(btn => {
      const cat = btn.dataset.cat;
      const count = counts[cat] || 0;
      let label = btn.textContent.replace(/\s*\d+\s*$/, '').trim();
      btn.innerHTML = btn.innerHTML.replace(/<span[^>]*>.*?<\/span>/g, '');
      btn.appendChild(document.createTextNode(' ' + label + ' '));
      const span = document.createElement('span');
      span.className = 'l-cot__tab-count';
      span.textContent = count;
      btn.appendChild(span);
    });
  }

  function renderPackages() {
    const el = document.getElementById('cotPackages');
    if (!el) return;
    el.innerHTML = PACKAGES.map(p => {
      const itemsList = p.items.map(id => {
        const s = SERVICIOS.find(x => x.id === id);
        return s ? `<li><i class="bi ph:check"></i> ${Multra.esc(s.nombre)}</li>` : '';
      }).join('');
      const subtotal = p.items.reduce((sum, id) => {
        const s = SERVICIOS.find(x => x.id === id);
        return sum + (s ? s.precio : 0);
      }, 0);
      const precioFinal = Math.round(subtotal * (1 - p.descuento / 100));
      return `
        <div class="l-pkg${activePackage === p.id ? ' is-active' : ''}" data-pkg="${p.id}">
          ${p.badge ? `<span class="l-pkg__badge">${p.badge}</span>` : ''}
          <div class="l-pkg__head">
            <div class="l-pkg__ico"><i class="bi ${p.icon}"></i></div>
            <div class="l-pkg__title">
              <strong>${Multra.esc(p.titulo)}</strong>
              <small>${Multra.esc(p.desc)}</small>
            </div>
          </div>
          <ul class="l-pkg__items">${itemsList}</ul>
          <div class="l-pkg__foot">
            <div class="l-pkg__price">
              ${p.descuento ? `<s>${Multra.fmtCOP(subtotal)}</s>` : ''}
              <b>${Multra.fmtCOP(precioFinal)}</b>
              ${p.descuento ? `<span class="l-pkg__save">-${p.descuento}%</span>` : ''}
            </div>
            <button class="btn btn-dark btn-sm" data-add-pkg="${p.id}">
              <iconify-icon icon="ph:${activePackage === p.id ? 'check-circle' : 'plus'}"></iconify-icon>
              ${activePackage === p.id ? 'Seleccionado' : 'Agregar'}
            </button>
          </div>
        </div>`;
    }).join('');
    el.querySelectorAll('[data-add-pkg]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      addPackage(b.dataset.addPkg);
    }));
  }

  function renderCatalogSection() {
    const el = document.getElementById('publicServices');
    if (!el || !SERVICIOS.length) return;

    const CAT_ACCORDION = {
      tecnomecanica: { icon: 'ph:wrench', tag: 'Inspección', desc: 'Revisión Técnico-Mecánica en nuestras 3 líneas (livianos, motos, pesados).' },
      seguro:        { icon: 'ph:shield-check', tag: 'Seguros', desc: 'SOAT y todo riesgo con aseguradoras aliadas (Sura, Mapfre, Previsora).' },
      tramite:       { icon: 'bi-file-earmark-text', tag: 'Gestoría', desc: 'Traspasos, licencias, cambio de motor, GNV, placas y más.' },
      peritaje:      { icon: 'ph:magnifying-glass', tag: 'Diagnóstico', desc: 'Peritajes y revisiones para seguros, accidentes o actualización de datos.' }
    };

    const order = ['tecnomecanica', 'seguro', 'tramite', 'peritaje'];
    const grouped = {};
    for (const s of SERVICIOS) {
      (grouped[s.tipo] = grouped[s.tipo] || []).push(s);
    }

    el.className = 'l-accordion';
    el.innerHTML = order.map((tipo, idx) => {
      const list = grouped[tipo] || [];
      const meta = CAT_ACCORDION[tipo] || { icon: 'bi-grid', tag: tipo, desc: '' };
      const isOpen = idx === 0 ? ' open' : '';
      const servicesHtml = list.map(s => `
        <div class="l-accordion__service" data-id="${s.id}">
          <div class="l-accordion__service-head">
            <div class="l-accordion__service-ico"><i class="bi ${ICON[s.id] || 'bi-car-front'}"></i></div>
            <div class="l-accordion__service-cat">${Multra.esc(meta.tag)}</div>
          </div>
          <div class="l-accordion__service-body">
            <h4 class="l-accordion__service-name">${Multra.esc(s.nombre)}</h4>
            <p class="l-accordion__service-desc">${Multra.esc(s.desc || '')}</p>
          </div>
          <div class="l-accordion__service-foot">
            <span class="l-accordion__service-price">${Multra.fmtCOP(s.precio)}</span>
            <a class="l-accordion__service-cta" href="#cotizar" data-jump="${s.id}">
              Cotizar <i class="bi ph:arrow-right"></i>
            </a>
          </div>
        </div>`).join('');

      return `
        <details class="l-accordion__item"${isOpen}>
          <summary class="l-accordion__head">
            <i class="l-accordion__icon ${meta.icon}"></i>
            <div class="l-accordion__title">
              <strong>${Multra.esc(CAT_LABEL[tipo] || tipo)}</strong>
              <small>${Multra.esc(meta.desc)}</small>
            </div>
            <span class="l-accordion__count">${list.length}</span>
            <i class="l-accordion__chev bi ph:caret-down"></i>
          </summary>
          <div class="l-accordion__body">
            <div class="l-accordion__grid">${servicesHtml}</div>
          </div>
        </details>`;
    }).join('');

    el.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('cotizar').scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => addService(a.dataset.jump, 1), 400);
    }));
  }

  function bindJumpDelegation() {
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-jump]');
      if (!a) return;
      e.preventDefault();
      const tgt = document.getElementById('cotizar');
      if (tgt) tgt.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => addService(a.dataset.jump, 1), 400);
    });
  }

  function renderGrid() {
    const el = document.getElementById('cotGrid');
    if (!el) return;
    const list = activeCat === 'all' ? SERVICIOS : SERVICIOS.filter(s => s.tipo === activeCat);
    if (!list.length) { el.innerHTML = '<div class="l-cot__empty-cat">No hay servicios en esta categoría.</div>'; return; }
    el.innerHTML = list.map(s => {
      const inCart = cart.find(x => x.id === s.id);
      const qty = inCart ? inCart.cantidad : 0;
      return `
        <div class="l-cot__card${qty > 0 ? ' is-in-cart' : ''}" data-id="${s.id}">
          <div class="l-cot__card-head">
            <div class="l-cot__card-ico"><i class="bi ${ICON[s.id] || 'bi-car-front'}"></i></div>
            <span class="l-cot__card-cat">${CAT_LABEL[s.tipo] || s.tipo}</span>
          </div>
          <h4>${Multra.esc(s.nombre)}</h4>
          <p>${Multra.esc(s.desc || '')}</p>
          <div class="l-cot__card-foot">
            <span class="l-cot__card-price">${Multra.fmtCOP(s.precio)}</span>
            ${qty > 0
              ? `<div class="l-qty"><button type="button" data-dec="${s.id}" aria-label="Quitar uno"><i class="bi ph:minus"></i></button><span class="l-qty__val">${qty}</span><button type="button" data-inc="${s.id}" aria-label="Agregar uno"><i class="bi ph:plus"></i></button></div>`
              : `<button type="button" class="l-cot__add" data-add="${s.id}"><i class="bi ph:plus-lg"></i> Agregar</button>`}
          </div>
        </div>`;
    }).join('');
    el.querySelectorAll('[data-add]').forEach(b => b.addEventListener('click', () => addService(b.dataset.add, 1)));
    el.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', () => addService(b.dataset.inc, 1)));
    el.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', () => addService(b.dataset.dec, -1)));
  }

  function addService(id, delta) {
    const s = SERVICIOS.find(x => x.id === id);
    if (!s) return;
    activePackage = null;
    const idx = cart.findIndex(x => x.id === id);
    if (idx >= 0) {
      cart[idx].cantidad += delta;
      if (cart[idx].cantidad <= 0) cart.splice(idx, 1);
    } else if (delta > 0) {
      cart.push({ id, nombre: s.nombre, precio: s.precio, cantidad: 1 });
    }
    renderGrid();
    renderPackages();
    renderCart();
  }

  function addPackage(pkgId) {
    const pkg = PACKAGES.find(p => p.id === pkgId);
    if (!pkg) return;
    if (activePackage === pkgId) {
      activePackage = null;
      cart = [];
    } else {
      activePackage = pkgId;
      cart = pkg.items.map(id => {
        const s = SERVICIOS.find(x => x.id === id);
        return s ? { id, nombre: s.nombre, precio: s.precio, cantidad: 1 } : null;
      }).filter(Boolean);
    }
    renderGrid();
    renderPackages();
    renderCart();
  }

  function clearCart() {
    cart = [];
    activePackage = null;
    renderGrid();
    renderPackages();
    renderCart();
  }

  function fmt(n) { return Multra.fmtCOP(n); }

  async function renderCart() {
    const cartEl = document.getElementById('publicCart');
    const totalsEl = document.getElementById('cotTotals');
    const countEl = document.getElementById('cotCount');
    const clearBtn = document.getElementById('cotClear');
    const waBtn = document.getElementById('cotWhatsapp');

    const totalItems = cart.reduce((a, x) => a + x.cantidad, 0);
    if (countEl) countEl.textContent = totalItems + (totalItems === 1 ? ' servicio' : ' servicios');
    if (clearBtn) clearBtn.hidden = cart.length === 0;
    if (waBtn) {
      waBtn.classList.toggle('is-disabled', cart.length === 0);
      waBtn.setAttribute('aria-disabled', cart.length === 0 ? 'true' : 'false');
      waBtn.style.pointerEvents = cart.length === 0 ? 'none' : '';
      waBtn.style.opacity = cart.length === 0 ? '.55' : '1';
    }

    if (!cart.length) {
      cartEl.innerHTML = '<div class="l-cot__empty"><i class="bi ph:shopping-bag"></i><strong>Tu cotización está vacía</strong><small>Suma servicios del catálogo o elige un paquete para empezar.</small></div>';
      totalsEl.hidden = true;
      return;
    }

    try {
      const r = await fetch('/api/cotizar/publico', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.map(x => ({ servicioId: x.id, cantidad: x.cantidad })), descuentoPct: 0 })
      });
      const data = await r.json();

      const descuento = activePackage
        ? PACKAGES.find(p => p.id === activePackage)?.descuento || 0
        : 0;
      const descuentoValor = descuento > 0 ? Math.round(data.subtotal * descuento / 100) : 0;
      const subtotalConDesc = data.subtotal - descuentoValor;
      const iva = Math.round(subtotalConDesc * 0.19);
      const total = subtotalConDesc + iva;

      cartEl.innerHTML = cart.map(x => `
        <div class="l-cot__cart-line">
          <div class="l-cot__cart-line-main">
            <strong>${Multra.esc(x.nombre)}</strong>
            <small>${fmt(x.precio)} c/u</small>
          </div>
          <div class="l-qty l-qty--mini">
            <button type="button" data-dec="${x.id}" aria-label="Quitar uno"><i class="bi ph:minus"></i></button>
            <span class="l-qty__val">${x.cantidad}</span>
            <button type="button" data-inc="${x.id}" aria-label="Agregar uno"><i class="bi ph:plus"></i></button>
            <button type="button" class="l-qty__rm" data-rm="${x.id}" aria-label="Eliminar"><i class="bi ph:x"></i></button>
          </div>
        </div>`).join('');

      document.getElementById('cotSubtotal').textContent = fmt(data.subtotal);
      document.getElementById('cotIva').textContent = fmt(iva);
      document.getElementById('cotTotal').textContent = fmt(total);
      const discRow = document.getElementById('cotDiscountRow');
      const discEl = document.getElementById('cotDiscount');
      if (descuento > 0) {
        discRow.hidden = false;
        discEl.textContent = '-' + fmt(descuentoValor);
      } else {
        discRow.hidden = true;
      }
      totalsEl.hidden = false;

      cartEl.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', () => addService(b.dataset.inc, 1)));
      cartEl.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', () => addService(b.dataset.dec, -1)));
      cartEl.querySelectorAll('[data-rm]').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.rm;
        cart = cart.filter(x => x.id !== id);
        activePackage = null;
        renderGrid(); renderPackages(); renderCart();
      }));

      if (waBtn) {
        const lines = [
          'Hola Multra, quiero cotizar:',
          ...cart.map(x => `- ${x.nombre} x${x.cantidad} (${fmt(x.precio * x.cantidad)})`),
          `Subtotal: ${fmt(data.subtotal)}`,
          ...(descuento > 0 ? [`Descuento paquete: -${fmt(descuentoValor)} (${descuento}%)`] : []),
          `IVA 19%: ${fmt(iva)}`,
          `*TOTAL: ${fmt(total)}*`
        ];
        waBtn.href = 'https://wa.me/573001234567?text=' + encodeURIComponent(lines.join('\n'));
      }
    } catch (e) {
      const subtotal = cart.reduce((a, x) => a + x.precio * x.cantidad, 0);
      const iva = Math.round(subtotal * 0.19);
      const total = subtotal + iva;
      cartEl.innerHTML = cart.map(x => `
        <div class="l-cot__cart-line">
          <div class="l-cot__cart-line-main"><strong>${Multra.esc(x.nombre)}</strong><small>${fmt(x.precio)} c/u</small></div>
          <div class="l-qty l-qty--mini">
            <button type="button" data-dec="${x.id}"><i class="bi ph:minus"></i></button>
            <span class="l-qty__val">${x.cantidad}</span>
            <button type="button" data-inc="${x.id}"><i class="bi ph:plus"></i></button>
          </div>
        </div>`).join('');
      document.getElementById('cotSubtotal').textContent = fmt(subtotal);
      document.getElementById('cotIva').textContent = fmt(iva);
      document.getElementById('cotTotal').textContent = fmt(total);
      totalsEl.hidden = false;
    }
  }

  document.getElementById('cotClear')?.addEventListener('click', clearCart);
  document.getElementById('cotTabs')?.addEventListener('click', e => {
    const btn = e.target.closest('.l-cot__tab');
    if (!btn) return;
    document.querySelectorAll('.l-cot__tab').forEach(b => b.classList.toggle('is-active', b === btn));
    activeCat = btn.dataset.cat;
    renderGrid();
  });

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

  loadServicios();
  bindJumpDelegation();

  // Scroll reveal: fade-up entre secciones al hacer scroll
  (function initScrollReveal(){
    if (typeof IntersectionObserver === 'undefined') return;
    var sections = document.querySelectorAll('section[id]:not(#inicio)');
    if (!sections.length) return;
    sections.forEach(function(s){ s.classList.add('l-section-reveal'); });
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });
    sections.forEach(function(s){ io.observe(s); });
  })();
})();
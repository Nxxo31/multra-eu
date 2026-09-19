// Multra E.U. — Panel administrativo (dashboard.html)
// 8 vistas: dashboard, vehiculos, citas, inspeccion, seguros, cotizador, tramites, clientes.

(function () {
  // ===== Auth guard =====
  if (!Multra.getToken()) {
    // Permitir ?token=...&user=... en la URL para login rápido (testing/SSO)
    const params = new URLSearchParams(location.search);
    const qToken = params.get('token');
    if (qToken) {
      const qUser = params.get('user');
      try { Multra.setSession(qToken, qUser ? JSON.parse(decodeURIComponent(qUser)) : { username: 'admin' }); }
      catch { Multra.setSession(qToken, { username: 'admin' }); }
      history.replaceState({}, '', location.pathname);
    } else {
      location.replace('login.html');
      return;
    }
  }

  // ===== State =====
  const state = { servicios: [], vehiculos: [], clientes: [], polizas: [], citas: [], tramites: [], pagos: [], stats: null };
  const VIEWS = {};

  // ===== Header =====
  const u = Multra.getUser();
  if (u) {
    document.getElementById('userLabel').textContent = u.name || u.username;
    document.getElementById('avatar').textContent = (u.name || u.username || 'A').charAt(0).toUpperCase();
  }
  document.getElementById('menuBtn').onclick = () => document.getElementById('side').classList.toggle('p-side--open');
  document.getElementById('logout').onclick = (e) => { e.preventDefault(); Multra.clearSession(); location.href = 'login.html'; };

  // ===== Nav router =====
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-view]').forEach(x => x.classList.remove('p-nav__item--active'));
      btn.classList.add('p-nav__item--active');
      renderView(btn.dataset.view);
      document.getElementById('side').classList.remove('p-side--open');
    });
  });
  window.go = function (v) { document.querySelector(`[data-view="${v}"]`)?.click(); };

  function setCrumb(name, sub) {
    document.getElementById('crumb').textContent = name;
  }

  // ===== Vista: Dashboard =====
  VIEWS.dashboard = async () => {
    setCrumb('Dashboard');
    const s = await Multra.api('/api/stats');
    state.stats = s;
    const alertas = s.alertas.soatPorVencer + s.alertas.tecPorVencer + s.alertas.soatVencido + s.alertas.tecVencida;
    const pill = document.getElementById('pill-alertas');
    pill.textContent = alertas || '';
    pill.style.display = alertas ? 'inline-block' : 'none';

    const proximas = (await Multra.api('/api/citas')).slice(0, 5);
    const vehs = await Multra.api('/api/vehiculos');
    const vencs = [];
    vehs.forEach(v => {
      if (v.soatVence) vencs.push({ tipo: 'SOAT', vehiculo: v.placa, vence: v.soatVence, cliente: v.clienteNombre });
      if (v.tecnomecanicaVence) vencs.push({ tipo: 'Tecnomecánica', vehiculo: v.placa, vence: v.tecnomecanicaVence, cliente: v.clienteNombre });
    });
    vencs.sort((a, b) => new Date(a.vence) - new Date(b.vence));
    const top = vencs.slice(0, 6);

    return `
      <div class="p-page-head">
        <div class="p-page-head__left">
          <small>DASHBOARD</small>
          <h1>Hola, ${u?.name?.split(' ')[0] || 'Admin'}</h1>
          <p>Esto es lo que está pasando en tu CDA hoy.</p>
        </div>
      </div>
      <div class="p-kpis">
        <div class="p-kpi p-kpi--ok"><i class="bi bi-people"></i><span class="p-kpi__label">Clientes</span><strong class="p-kpi__value">${s.clientes}</strong><div class="p-kpi__sub">${s.vehiculos} vehículos asociados</div></div>
        <div class="p-kpi"><i class="bi bi-car-front"></i><span class="p-kpi__label">Citas hoy</span><strong class="p-kpi__value">${s.citasHoy}</strong><div class="p-kpi__sub">${proximas.length} en agenda</div></div>
        <div class="p-kpi p-kpi--ok"><i class="bi bi-shield-check"></i><span class="p-kpi__label">Pólizas vigentes</span><strong class="p-kpi__value">${s.polizasVigentes}</strong><div class="p-kpi__sub">SOAT + todo riesgo</div></div>
        <div class="p-kpi ${(s.alertas.soatVencido + s.alertas.tecVencida) > 0 ? 'p-kpi--err' : 'p-kpi--warn'}"><i class="bi bi-exclamation-triangle"></i><span class="p-kpi__label">Alertas</span><strong class="p-kpi__value">${s.alertas.soatVencido + s.alertas.tecVencida}</strong><div class="p-kpi__sub">${s.alertas.soatPorVencer} SOAT · ${s.alertas.tecPorVencer} tec. por vencer</div></div>
        <div class="p-kpi p-kpi--ok"><i class="bi bi-file-text"></i><span class="p-kpi__label">Trámites activos</span><strong class="p-kpi__value">${s.tramitesActivos}</strong><div class="p-kpi__sub">En gestión</div></div>
        <div class="p-kpi p-kpi--ok"><i class="bi bi-cash-coin"></i><span class="p-kpi__label">Ingresos del mes</span><strong class="p-kpi__value">${s.ingresosMesFmt}</strong><div class="p-kpi__sub">${new Date().toLocaleDateString('es-CO',{month:'long'})}</div></div>
      </div>

      <div class="p-row-2">
        <div class="p-card">
          <div class="p-card__head">
            <h4><i class="bi bi-calendar-event"></i> Próximas citas</h4>
            <button class="p-btn p-btn--sm p-btn--ghost" onclick="go('citas')">Ver agenda →</button>
          </div>
          ${proximas.length ? `<div class="p-agenda">${proximas.slice(0, 5).map(c => `
            <div class="p-slot">
              <div class="p-slot__time">${c.hora}</div>
              <div class="p-slot__info"><b>${Multra.esc(c.servicio?.nombre || '—')}</b><small>${Multra.esc(c.vehiculo?.placa || '')} · ${Multra.esc(c.cliente?.nombre || '')} · ${Multra.fmtDate(c.fecha)}</small></div>
              <span class="badge ${c.estado === 'en proceso' ? 'badge-info' : c.estado === 'completada' ? 'badge-ok' : 'badge-k'}">${c.estado}</span>
            </div>`).join('')}</div>` : '<div class="p-empty"><i class="bi bi-calendar-x"></i><p>Sin citas próximas</p></div>'}
        </div>
        <div class="p-card">
          <h4><i class="bi bi-bell"></i> Vencimientos</h4>
          ${top.length ? top.map(v => {
            const d = Multra.daysUntil(v.vence);
            const cls = d < 0 ? 'badge-err' : d <= 30 ? 'badge-warn' : 'badge-ok';
            return `<div class="d-flex" style="justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px dashed var(--b)">
              <div><b>${v.vehiculo}</b> <span class="badge badge-k">${v.tipo}</span><div class="small muted">${v.cliente}</div></div>
              <div class="tar"><span class="badge ${cls}">${d < 0 ? 'Hace ' + -d + 'd' : 'En ' + d + 'd'}</span><div class="small muted">${Multra.fmtDate(v.vence)}</div></div>
            </div>`;
          }).join('') : '<div class="p-empty"><i class="bi bi-check-circle"></i><p>Sin vencimientos próximos</p></div>'}
        </div>
      </div>
    `;
  };

  // ===== Vista: Vehículos =====
  VIEWS.vehiculos = async () => {
    setCrumb('Vehículos');
    state.vehiculos = await Multra.api('/api/vehiculos');
    return `
      <div class="p-page-head">
        <div class="p-page-head__left">
          <small>OPERACIÓN</small>
          <h1>Vehículos</h1>
          <p>${state.vehiculos.length} vehículos registrados</p>
        </div>
        <button class="p-btn" onclick="Multra.openVehiculoForm()"><i class="bi bi-plus-circle"></i> Nuevo vehículo</button>
      </div>
      <div class="p-search">
        <i class="bi bi-search"></i>
        <input class="p-input" id="vehSearch" placeholder="Buscar por placa o cliente...">
      </div>
      <div class="p-grid" id="vehList"></div>
    `;
  };

  function renderVehiculos() {
    const q = (document.getElementById('vehSearch')?.value || '').toLowerCase();
    const list = state.vehiculos.filter(v => !q || v.placa.toLowerCase().includes(q) || (v.clienteNombre || '').toLowerCase().includes(q));
    const el = document.getElementById('vehList');
    if (!el) return;
    if (!list.length) { el.innerHTML = '<div class="p-empty" style="grid-column:1/-1"><i class="bi bi-car-front"></i><p>Sin vehículos. Crea el primero.</p></div>'; return; }
    el.innerHTML = list.map(v => {
      const soat = Multra.daysUntil(v.soatVence);
      const tec = Multra.daysUntil(v.tecnomecanicaVence);
      return `<div class="p-veh-card">
        <div class="p-veh-card__head">
          <div>
            <span class="p-veh-card__plate">${Multra.esc(v.placa)}</span>
            <div class="p-veh-card__sub">${Multra.esc(v.marca)} ${Multra.esc(v.linea)} · ${v.modelo}</div>
          </div>
        </div>
        <div class="p-veh-card__body">
          <div class="p-veh-card__row"><span>Cliente</span><b>${Multra.esc(v.clienteNombre || '—')}</b></div>
          <div class="p-veh-card__row"><span>Clase</span><b>${Multra.esc(v.clase || '—')}</b></div>
          <div class="p-veh-card__row"><span>Color</span><b>${Multra.esc(v.color || '—')}</b></div>
          <div class="p-veh-card__row"><span>Km</span><b>${(v.kilometraje || 0).toLocaleString('es-CO')}</b></div>
        </div>
        <div class="p-veh-card__foot">
          <span class="p-veh-card__doc"><i class="bi bi-shield-check"></i> SOAT ${Multra.docBadge(soat)}</span>
          <span class="p-veh-card__doc"><i class="bi bi-wrench"></i> Tec. ${Multra.docBadge(tec)}</span>
        </div>
        <div class="p-veh-card__actions">
          <button class="p-btn p-btn--sm" onclick="Multra.openVehiculoDetail(${v.id})">Ver detalle</button>
        </div>
      </div>`;
    }).join('');
  }

  Multra.openVehiculoDetail = async (id) => {
    try {
      const v = await Multra.api('/api/vehiculos/' + id);
      const soat = Multra.daysUntil(v.soatVence);
      const tec = Multra.daysUntil(v.tecnomecanicaVence);
      Multra.openModal(`
        <h3><i class="bi bi-car-front"></i> ${v.placa}</h3>
        <div class="p-form-grid p-form-grid--3 mb-2" style="row-gap:18px">
          <div class="p-veh-detail"><label class="p-label">Marca</label><div class="p-veh-detail__val">${v.marca} ${v.linea}</div></div>
          <div class="p-veh-detail"><label class="p-label">Modelo</label><div class="p-veh-detail__val">${v.modelo}</div></div>
          <div class="p-veh-detail"><label class="p-label">Clase</label><div class="p-veh-detail__val">${v.clase || '—'}</div></div>
          <div class="p-veh-detail"><label class="p-label">Color</label><div class="p-veh-detail__val">${v.color || '—'}</div></div>
          <div class="p-veh-detail"><label class="p-label">Cilindraje</label><div class="p-veh-detail__val">${v.cilindraje} cc</div></div>
          <div class="p-veh-detail"><label class="p-label">Combustible</label><div class="p-veh-detail__val">${v.combustible}</div></div>
          <div class="p-veh-detail"><label class="p-label">Kilometraje</label><div class="p-veh-detail__val">${(v.kilometraje || 0).toLocaleString('es-CO')} km</div></div>
          <div class="p-veh-detail"><label class="p-label">Cliente</label><div class="p-veh-detail__val">${v.cliente?.nombre || '—'}</div></div>
          <div class="p-veh-detail"><label class="p-label">SOAT vence</label><div class="p-veh-detail__val">${Multra.docBadge(soat)}</div></div>
        </div>
        <h5 class="mt-2">Pólizas (${v.polizas.length})</h5>
        ${v.polizas.length ? v.polizas.map(p => `<div class="d-flex" style="justify-content:space-between;padding:8px 0;border-bottom:1px dashed var(--b)"><div><b>${p.tipo === 'soat' ? 'SOAT' : 'Todo Riesgo'}</b> · ${p.aseguradora}<div class="small muted">${p.numero}</div></div><div class="tar">${Multra.fmtCOP(p.prima)}<div class="small muted">vence ${Multra.fmtDate(p.fin)}</div></div></div>`).join('') : '<div class="muted small">Sin pólizas</div>'}
        <h5 class="mt-2">Citas (${v.citas.length})</h5>
        ${v.citas.length ? v.citas.map(c => `<div class="d-flex" style="justify-content:space-between;padding:8px 0;border-bottom:1px dashed var(--b)"><div>${Multra.fmtDate(c.fecha)} ${c.hora} · ${c.servicio?.nombre || '—'}</div><span class="badge badge-k">${c.estado}</span></div>`).join('') : '<div class="muted small">Sin citas</div>'}
        <div class="p-modal__actions">
          <button class="p-btn p-btn--ghost" onclick="Multra.closeModal()">Cerrar</button>
          <button class="p-btn p-btn--dark" onclick="Multra.openInspeccion(${v.id})"><i class="bi bi-clipboard2-check"></i> Iniciar inspección</button>
          <button class="p-btn" onclick="Multra.openVehiculoForm(${v.id})"><i class="bi bi-pencil"></i> Editar</button>
        </div>
      `);
    } catch (e) { Multra.toast(e.message, 'err'); }
  };

  Multra.openVehiculoForm = async (id = null) => {
    const isEdit = !!id;
    let veh = { placa: '', marca: '', linea: '', modelo: '', color: '', clase: 'Automóvil', tipoVehiculo: 'liviano', cilindraje: '', combustible: 'Gasolina', kilometraje: '', soatVence: '', tecnomecanicaVence: '' };
    if (isEdit) { const v = await Multra.api('/api/vehiculos/' + id); veh = { ...veh, ...v }; }
    if (!state.clientes.length) state.clientes = await Multra.api('/api/clientes');

    Multra.openModal(`
      <h3>${isEdit ? 'Editar' : 'Nuevo'} vehículo</h3>
      <form id="vehForm">
        <div class="p-form-grid">
          <div class="p-field p-field--full"><label class="p-label">Cliente <span class="req">*</span></label>
            <select class="p-select" id="vf_cliente" required>
              <option value="">Selecciona…</option>
              ${state.clientes.map(c => `<option value="${c.id}" ${veh.clienteId === c.id ? 'selected' : ''}>${Multra.esc(c.nombre)} (${c.cedula})</option>`).join('')}
            </select>
          </div>
          <div class="p-field"><label class="p-label">Placa <span class="req">*</span></label><input class="p-input" id="vf_placa" required value="${Multra.esc(veh.placa)}" maxlength="7"></div>
          <div class="p-field"><label class="p-label">Marca <span class="req">*</span></label><input class="p-input" id="vf_marca" required value="${Multra.esc(veh.marca)}"></div>
          <div class="p-field"><label class="p-label">Línea</label><input class="p-input" id="vf_linea" value="${Multra.esc(veh.linea)}"></div>
          <div class="p-field"><label class="p-label">Modelo <span class="req">*</span></label><input class="p-input" id="vf_modelo" type="number" min="1950" max="2030" required value="${veh.modelo}"></div>
          <div class="p-field"><label class="p-label">Color</label><input class="p-input" id="vf_color" value="${Multra.esc(veh.color)}"></div>
          <div class="p-field"><label class="p-label">Clase</label>
            <select class="p-select" id="vf_clase">${['Automóvil','Camioneta','Motocicleta','Camión','Bus','Microbús','Otro'].map(c => `<option ${veh.clase === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
          </div>
          <div class="p-field"><label class="p-label">Tipo</label>
            <select class="p-select" id="vf_tipo">${['liviano','moto','pesado'].map(c => `<option value="${c}" ${veh.tipoVehiculo === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
          </div>
          <div class="p-field"><label class="p-label">Cilindraje (cc)</label><input class="p-input" id="vf_cil" type="number" value="${veh.cilindraje}"></div>
          <div class="p-field"><label class="p-label">Combustible</label>
            <select class="p-select" id="vf_comb">${['Gasolina','Diésel','Gas','Eléctrico','Híbrido'].map(c => `<option ${veh.combustible === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
          </div>
          <div class="p-field"><label class="p-label">Kilometraje</label><input class="p-input" id="vf_km" type="number" value="${veh.kilometraje}"></div>
          <div class="p-field"><label class="p-label">SOAT vence</label><input class="p-input" id="vf_soat" type="date" value="${veh.soatVence || ''}"></div>
          <div class="p-field"><label class="p-label">Tec. vence</label><input class="p-input" id="vf_tec" type="date" value="${veh.tecnomecanicaVence || ''}"></div>
        </div>
        <div class="p-modal__actions">
          <button type="button" class="p-btn p-btn--ghost" onclick="Multra.closeModal()">Cancelar</button>
          <button class="p-btn" type="submit">${isEdit ? 'Guardar cambios' : 'Crear vehículo'}</button>
        </div>
      </form>
    `);
    document.getElementById('vehForm').onsubmit = async (e) => {
      e.preventDefault();
      const body = {
        clienteId: Number(vf_cliente.value), placa: vf_placa.value.trim(), marca: vf_marca.value.trim(),
        linea: vf_linea.value.trim(), modelo: Number(vf_modelo.value), color: vf_color.value.trim(),
        clase: vf_clase.value, tipoVehiculo: vf_tipo.value, cilindraje: Number(vf_cil.value) || 0,
        combustible: vf_comb.value, kilometraje: Number(vf_km.value) || 0,
        soatVence: vf_soat.value || null, tecnomecanicaVence: vf_tec.value || null
      };
      try {
        if (isEdit) await Multra.api('/api/vehiculos/' + id, { method: 'PUT', body: JSON.stringify(body) });
        else await Multra.api('/api/vehiculos', { method: 'POST', body: JSON.stringify(body) });
        Multra.toast('Vehículo guardado', 'ok');
        Multra.closeModal();
        go('vehiculos');
      } catch (err) { Multra.toast(err.message, 'err'); }
    };
  };

  // ===== Vista: Seguros / Pólizas =====
  VIEWS.seguros = async () => {
    setCrumb('Seguros');
    state.polizas = await Multra.api('/api/polizas');
    return `
      <div class="p-page-head">
        <div class="p-page-head__left"><small>COMERCIAL</small><h1>Seguros y pólizas</h1><p>${state.polizas.length} pólizas</p></div>
        <button class="p-btn" onclick="Multra.openPolizaForm()"><i class="bi bi-plus-circle"></i> Nueva póliza</button>
      </div>
      <div class="p-grid" id="polList"></div>
    `;
  };

  function renderPolizas() {
    const el = document.getElementById('polList');
    if (!el) return;
    if (!state.polizas.length) { el.innerHTML = '<div class="p-empty" style="grid-column:1/-1"><i class="bi bi-shield"></i><p>Sin pólizas registradas</p></div>'; return; }
    el.innerHTML = state.polizas.map(p => {
      const cls = p.diasParaVencer < 0 ? 'p-pol-card--err' : p.diasParaVencer <= 30 ? 'p-pol-card--warn' : '';
      const color = p.diasParaVencer < 0 ? 'err' : p.diasParaVencer <= 30 ? 'warn' : 'ok';
      const total = 365;
      const restante = Math.max(0, Math.min(total, total + (p.diasParaVencer < 0 ? p.diasParaVencer : Math.min(p.diasParaVencer, total))));
      const pct = Math.max(0, Math.min(100, (restante / total) * 100));
      const tipoLabel = p.tipo === 'soat' ? 'SOAT' : p.tipo === 'todo_riesgo' ? 'Todo Riesgo' : p.tipo;
      return `<div class="p-pol-card ${cls}">
        <div class="p-pol-card__head">
          <div>
            <div class="p-pol-card__type">${tipoLabel}</div>
            <div class="p-pol-card__num">${Multra.esc(p.aseguradora)} · ${Multra.esc(p.numero || 's/n')}</div>
          </div>
          <span class="badge badge-${color}">${p.diasParaVencer < 0 ? 'VENCIDA' : p.diasParaVencer <= 30 ? 'POR VENCER' : 'VIGENTE'}</span>
        </div>
        <div class="p-pol-card__body">
          <div class="p-pol-card__row"><span>Vehículo</span><b>${Multra.esc(p.vehiculo?.placa || '—')}</b></div>
          <div class="p-pol-card__row"><span>Cliente</span><b>${Multra.esc(p.cliente?.nombre || '—')}</b></div>
          <div class="p-pol-card__row"><span>Vigencia</span><b>${Multra.fmtDate(p.inicio)} → ${Multra.fmtDate(p.fin)}</b></div>
          <div class="p-pol-card__row"><span>Prima</span><b>${Multra.fmtCOP(p.prima)}</b></div>
        </div>
        <div class="p-progress p-progress--${color}"><div class="p-progress__bar" style="width:${pct}%"></div></div>
        <div class="muted small mt-1">${p.diasParaVencer < 0 ? `Hace ${-p.diasParaVencer} días` : `En ${p.diasParaVencer} días`}</div>
      </div>`;
    }).join('');
  }

  Multra.openPolizaForm = async () => {
    if (!state.vehiculos.length) state.vehiculos = await Multra.api('/api/vehiculos');
    if (!state.servicios.length) state.servicios = await Multra.api('/api/servicios');
    const seguros = state.servicios.filter(s => s.tipo === 'seguro');
    Multra.openModal(`
      <h3>Nueva póliza</h3>
      <form id="polForm">
        <div class="p-form-grid">
          <div class="p-field p-field--full"><label class="p-label">Vehículo <span class="req">*</span></label>
            <select class="p-select" id="pf_veh" required>
              <option value="">Selecciona…</option>
              ${state.vehiculos.map(v => `<option value="${v.id}">${v.placa} · ${v.marca} ${v.linea} (${v.clienteNombre || ''})</option>`).join('')}
            </select>
          </div>
          <div class="p-field"><label class="p-label">Tipo <span class="req">*</span></label>
            <select class="p-select" id="pf_tipo" required>
              ${seguros.map(s => `<option value="${s.id}" data-price="${s.precio}">${s.nombre}</option>`).join('')}
            </select>
          </div>
          <div class="p-field"><label class="p-label">Aseguradora <span class="req">*</span></label>
            <select class="p-select" id="pf_ase">${['Sura','Mapfre','Seguros Bolívar','Liberty','Allianz','Previsora','Mundial','HDI'].map(a => `<option>${a}</option>`).join('')}</select>
          </div>
          <div class="p-field"><label class="p-label">Número</label><input class="p-input" id="pf_num" placeholder="SOAT-2026-XXXXX"></div>
          <div class="p-field"><label class="p-label">Inicio <span class="req">*</span></label><input class="p-input" id="pf_ini" type="date" required value="${new Date().toISOString().slice(0,10)}"></div>
          <div class="p-field"><label class="p-label">Fin <span class="req">*</span></label><input class="p-input" id="pf_fin" type="date" required value="${(() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); })()}"></div>
          <div class="p-field"><label class="p-label">Prima <span class="req">*</span></label><input class="p-input" id="pf_prima" type="number" required></div>
        </div>
        <div class="p-modal__actions">
          <button type="button" class="p-btn p-btn--ghost" onclick="Multra.closeModal()">Cancelar</button>
          <button class="p-btn" type="submit">Emitir póliza</button>
        </div>
      </form>
    `);
    const fill = () => { const opt = pf_tipo.options[pf_tipo.selectedIndex]; pf_prima.value = opt.dataset.price || ''; };
    pf_tipo.onchange = fill; fill();
    document.getElementById('polForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await Multra.api('/api/polizas', { method: 'POST', body: JSON.stringify({
          vehiculoId: Number(pf_veh.value),
          tipo: pf_tipo.value.startsWith('soat') ? 'soat' : 'todo_riesgo',
          aseguradora: pf_ase.value, numero: pf_num.value, inicio: pf_ini.value, fin: pf_fin.value, prima: Number(pf_prima.value)
        })});
        Multra.toast('Póliza emitida', 'ok');
        Multra.closeModal();
        go('seguros');
      } catch (err) { Multra.toast(err.message, 'err'); }
    };
  };

  // ===== Vista: Citas =====
  VIEWS.citas = async () => {
    setCrumb('Citas');
    state.citas = await Multra.api('/api/citas');
    const grouped = {};
    state.citas.forEach(c => { (grouped[c.fecha] = grouped[c.fecha] || []).push(c); });
    const days = Object.keys(grouped).sort();
    return `
      <div class="p-page-head">
        <div class="p-page-head__left"><small>OPERACIÓN</small><h1>Agenda</h1><p>${state.citas.length} citas</p></div>
        <button class="p-btn" onclick="Multra.openCitaForm()"><i class="bi bi-plus-circle"></i> Nueva cita</button>
      </div>
      <div class="p-agenda">
        ${days.length ? days.map(d => `
          <div class="p-agenda__day">
            <h4>${Multra.fmtDate(d)} <small>· ${grouped[d].length} citas</small></h4>
            ${grouped[d].map(c => `
              <div class="p-slot">
                <div class="p-slot__time">${c.hora}</div>
                <div class="p-slot__info"><b>${Multra.esc(c.servicio?.nombre || '—')}</b><small>${Multra.esc(c.vehiculo?.placa || '')} · ${Multra.esc(c.cliente?.nombre || '')} · ${Multra.esc(c.tecnico || '')}</small></div>
                <select class="p-select p-select--sm" style="padding:5px 8px;font-size:.72rem;width:auto" onchange="Multra.updateCitaEstado(${c.id}, this.value)">
                  ${['agendada','en proceso','completada','cancelada'].map(s => `<option value="${s}" ${c.estado === s ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </div>`).join('')}
          </div>
        `).join('') : '<div class="p-empty"><i class="bi bi-calendar-x"></i><p>Sin citas. Crea la primera.</p></div>'}
      </div>
    `;
  };

  Multra.updateCitaEstado = async (id, estado) => {
    try { await Multra.api('/api/citas/' + id, { method: 'PATCH', body: JSON.stringify({ estado }) }); Multra.toast('Estado actualizado', 'ok'); }
    catch (e) { Multra.toast(e.message, 'err'); }
  };

  Multra.openCitaForm = async () => {
    if (!state.vehiculos.length) state.vehiculos = await Multra.api('/api/vehiculos');
    if (!state.servicios.length) state.servicios = await Multra.api('/api/servicios');
    const tec = ['Por asignar', 'J. Vargas', 'L. Hernández', 'M. Ospina', 'C. Ramírez', 'D. Trujillo'];
    Multra.openModal(`
      <h3>Nueva cita</h3>
      <form id="citForm">
        <div class="p-form-grid">
          <div class="p-field p-field--full"><label class="p-label">Vehículo <span class="req">*</span></label>
            <select class="p-select" id="cf_veh" required>
              <option value="">Selecciona…</option>
              ${state.vehiculos.map(v => `<option value="${v.id}">${v.placa} · ${v.marca} ${v.linea} (${v.clienteNombre || ''})</option>`).join('')}
            </select>
          </div>
          <div class="p-field p-field--full"><label class="p-label">Servicio <span class="req">*</span></label>
            <select class="p-select" id="cf_serv" required>
              <option value="">Selecciona…</option>
              ${state.servicios.map(s => `<option value="${s.id}">${s.nombre} (${Multra.fmtCOP(s.precio)})</option>`).join('')}
            </select>
          </div>
          <div class="p-field"><label class="p-label">Fecha <span class="req">*</span></label><input class="p-input" id="cf_fecha" type="date" required value="${new Date().toISOString().slice(0,10)}"></div>
          <div class="p-field"><label class="p-label">Hora <span class="req">*</span></label><input class="p-input" id="cf_hora" type="time" required value="09:00"></div>
          <div class="p-field"><label class="p-label">Técnico</label><select class="p-select" id="cf_tec">${tec.map(t => `<option>${t}</option>`).join('')}</select></div>
          <div class="p-field"><label class="p-label">Observaciones</label><input class="p-input" id="cf_obs" placeholder="Notas…"></div>
        </div>
        <div class="p-modal__actions">
          <button type="button" class="p-btn p-btn--ghost" onclick="Multra.closeModal()">Cancelar</button>
          <button class="p-btn" type="submit">Agendar</button>
        </div>
      </form>
    `);
    document.getElementById('citForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await Multra.api('/api/citas', { method: 'POST', body: JSON.stringify({
          vehiculoId: Number(cf_veh.value), servicioId: cf_serv.value, fecha: cf_fecha.value, hora: cf_hora.value, tecnico: cf_tec.value, obs: cf_obs.value
        })});
        Multra.toast('Cita agendada', 'ok');
        Multra.closeModal();
        go('citas');
      } catch (err) { Multra.toast(err.message, 'err'); }
    };
  };

  // ===== Vista: Inspección RTM (checklist) =====
  VIEWS.inspeccion = async () => {
    setCrumb('Inspección RTM');
    if (!state.vehiculos.length) state.vehiculos = await Multra.api('/api/vehiculos');
    const CHECK = [
      { id: 'luces', label: 'Luces y señalización', desc: 'Altas, bajas, direccionales, freno, reversa' },
      { id: 'frenos', label: 'Sistema de frenos', desc: 'Pedal, servo, líquido, discos/bandas' },
      { id: 'direccion', label: 'Dirección', desc: 'Holguras, alineación, volante' },
      { id: 'suspension', label: 'Suspensión', desc: 'Amortiguadores, resortes, bujes' },
      { id: 'llantas', label: 'Llantas', desc: 'Labrado, presión, estado general' },
      { id: 'emisiones', label: 'Emisiones y gases', desc: 'Opacidad / gases de escape' },
      { id: 'seguridad', label: 'Seguridad pasiva', desc: 'Cinturones, airbags, apoyacabezas' },
      { id: 'vidrios', label: 'Vidrios y espejos', desc: 'Parabrisas, laterales, retrovisores' },
      { id: 'claxon', label: 'Claxon', desc: 'Funcionamiento y nivel sonoro' },
      { id: 'chasis', label: 'Chasis y carrocería', desc: 'Identificación VIN, estructura' }
    ];
    window.__CHECK = CHECK;
    return `
      <div class="p-page-head">
        <div class="p-page-head__left"><small>OPERACIÓN</small><h1>Inspección técnico-mecánica</h1><p>Checklist según NTC 5375 / 5385 / 6218 / 6282</p></div>
      </div>
      <div class="p-card mb-2">
        <div class="p-form-grid p-form-grid--3">
          <div class="p-field"><label class="p-label">Vehículo <span class="req">*</span></label>
            <select class="p-select" id="insp_veh"><option value="">Selecciona…</option>${state.vehiculos.map(v => `<option value="${v.id}">${v.placa} · ${v.marca} ${v.linea} (${v.clienteNombre || ''})</option>`).join('')}</select>
          </div>
          <div class="p-field"><label class="p-label">Técnico</label><input class="p-input" id="insp_tec" value="Por asignar"></div>
          <div class="p-field"><label class="p-label">Resultado</label>
            <select class="p-select" id="insp_result"><option value="">—</option><option value="aprobado">Aprobado</option><option value="rechazado">Rechazado</option></select>
          </div>
        </div>
      </div>
      <div class="p-card">
        <h4 class="mb-2"><i class="bi bi-list-check"></i> 10 puntos de inspección</h4>
        <div class="p-checklist" id="checklist">
          ${CHECK.map((c, i) => `
            <div class="p-check" data-id="${c.id}">
              <div class="p-check__ico"><i class="bi bi-circle"></i></div>
              <div class="p-check__lbl"><b>${i + 1}. ${c.label}</b><small>${c.desc}</small></div>
              <div class="p-check__actions">
                <button type="button" class="p-btn p-btn--sm p-btn--success" data-set="ok" title="Aprobado"><i class="bi bi-check-lg"></i></button>
                <button type="button" class="p-btn p-btn--sm p-btn--danger" data-set="fail" title="Rechazado"><i class="bi bi-x-lg"></i></button>
                <button type="button" class="p-btn p-btn--sm p-btn--ghost" data-set="na" title="N/A"><i class="bi bi-dash"></i></button>
              </div>
            </div>`).join('')}
        </div>
        <div class="d-flex mt-2 p-2" style="background:var(--bg);border-radius:10px;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <div><b id="inspSummary">Selecciona el estado de cada punto</b><div class="small muted" id="inspDetail">0 OK · 0 fallas · 0 N/A de 10</div></div>
          <div class="d-flex gap-1">
            <button class="p-btn p-btn--ghost" id="inspReset"><i class="bi bi-arrow-clockwise"></i> Reiniciar</button>
            <button class="p-btn" id="inspSave"><i class="bi bi-save"></i> Guardar FUR</button>
          </div>
        </div>
      </div>
    `;
  };

  const checkState = {};
  function setupChecklist() {
    if (!document.getElementById('checklist')) return;
    document.querySelectorAll('.p-check').forEach(card => {
      card.querySelectorAll('[data-set]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = card.dataset.id; const v = btn.dataset.set;
          checkState[id] = v;
          card.classList.remove('p-check--ok', 'p-check--fail');
          if (v === 'ok') card.classList.add('p-check--ok');
          if (v === 'fail') card.classList.add('p-check--fail');
          const ico = card.querySelector('.p-check__ico i');
          ico.className = v === 'ok' ? 'bi bi-check-lg' : v === 'fail' ? 'bi bi-x-lg' : 'bi bi-dash';
          updateInspSummary();
        });
      });
    });
    document.getElementById('inspReset').addEventListener('click', () => {
      Object.keys(checkState).forEach(k => delete checkState[k]);
      document.querySelectorAll('.p-check').forEach(c => { c.classList.remove('p-check--ok', 'p-check--fail'); c.querySelector('.p-check__ico i').className = 'bi bi-circle'; });
      updateInspSummary();
    });
    document.getElementById('inspSave').addEventListener('click', guardarInspeccion);
  }
  function updateInspSummary() {
    const total = (window.__CHECK || []).length;
    const vals = Object.values(checkState);
    const ok = vals.filter(v => v === 'ok').length;
    const fail = vals.filter(v => v === 'fail').length;
    const na = vals.filter(v => v === 'na').length;
    document.getElementById('inspDetail').textContent = `${ok} OK · ${fail} fallas · ${na} N/A de ${total}`;
    const result = document.getElementById('insp_result');
    if (fail > 0) { result.value = 'rechazado'; document.getElementById('inspSummary').textContent = 'Resultado preliminar: RECHAZADO'; }
    else if (ok === total) { result.value = 'aprobado'; document.getElementById('inspSummary').textContent = 'Resultado preliminar: APROBADO'; }
    else { result.value = ''; document.getElementById('inspSummary').textContent = 'Resultado parcial — completa el checklist'; }
  }
  async function guardarInspeccion() {
    const vehId = insp_veh.value;
    if (!vehId) return Multra.toast('Selecciona un vehículo', 'err');
    const entries = Object.entries(checkState);
    if (!entries.length) return Multra.toast('Marca al menos un punto de inspección', 'err');
    const failCount = entries.filter(([, v]) => v === 'fail').length;
    const okCount = entries.filter(([, v]) => v === 'ok').length;
    try {
      await Multra.api('/api/inspections', {
        method: 'POST',
        body: JSON.stringify({
          vehiculoId: Number(vehId),
          tecnico: insp_tec.value || 'Por asignar',
          items: Object.fromEntries(entries),
          obs: `FUR — ${okCount} OK / ${failCount} fallas`
        })
      });
      Multra.toast(failCount ? 'FUR guardado: RECHAZADO' : 'FUR guardado: APROBADO. Vencimiento tecnomecánica +1 año', failCount ? 'err' : 'ok');
      Object.keys(checkState).forEach(k => delete checkState[k]);
      document.querySelectorAll('.p-check').forEach(c => { c.classList.remove('p-check--ok', 'p-check--fail'); c.querySelector('.p-check__ico i').className = 'bi bi-circle'; });
      updateInspSummary();
    } catch (e) { Multra.toast(e.message, 'err'); }
  }
  Multra.openInspeccion = (id) => { go('inspeccion'); setTimeout(() => { const sel = document.getElementById('insp_veh'); if (sel) sel.value = id; }, 200); };

  // ===== Vista: Cotizador =====
  VIEWS.cotizador = async () => {
    setCrumb('Cotizador');
    if (!state.servicios.length) state.servicios = await Multra.api('/api/servicios');
    return `
      <div class="p-page-head">
        <div class="p-page-head__left"><small>COMERCIAL</small><h1>Cotizador</h1><p>Calcula en tiempo real</p></div>
      </div>
      <div class="p-cot">
        <div class="p-cot__list">
          <h4 class="mb-2">Servicios disponibles</h4>
          <div id="cotItems">
            ${state.servicios.map(s => `
              <div class="p-cot__item" data-id="${s.id}">
                <div class="p-cot__item-info"><b>${s.nombre}</b><small>${s.desc} ${s.duracionMin ? '· ' + s.duracionMin + ' min' : ''}</small></div>
                <div class="p-cot__item-price">${Multra.fmtCOP(s.precio)}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="p-cot__side">
          <h4><i class="bi bi-cart-check"></i> Tu cotización</h4>
          <div id="cotCart"><div class="muted small">Selecciona servicios a la izquierda</div></div>
          <div class="p-field mt-2"><label class="p-label">Descuento %</label><input class="p-input" id="cotDesc" type="number" min="0" max="50" value="0"></div>
          <button class="p-btn mt-2" style="width:100%" onclick="compartirCotizacion()"><i class="bi bi-share"></i> Compartir por WhatsApp</button>
        </div>
      </div>
    `;
  };
  const cot = { items: [] };
  function setupCotizador() {
    if (!document.getElementById('cotItems')) return;
    document.querySelectorAll('.p-cot__item').forEach(it => {
      it.addEventListener('click', () => {
        const id = it.dataset.id;
        const s = state.servicios.find(x => x.id === id);
        const i = cot.items.findIndex(x => x.id === id);
        if (i >= 0) cot.items.splice(i, 1); else cot.items.push({ id, nombre: s.nombre, precio: s.precio });
        it.classList.toggle('p-cot__item--added', i < 0);
        renderCotPanel();
      });
    });
    document.getElementById('cotDesc').addEventListener('input', renderCotPanel);
  }
  function renderCotPanel() {
    const el = document.getElementById('cotCart');
    if (!el) return;
    if (!cot.items.length) { el.innerHTML = '<div class="muted small">Vacío</div>'; return; }
    const subtotal = cot.items.reduce((a, x) => a + x.precio, 0);
    const descPct = Number(document.getElementById('cotDesc')?.value) || 0;
    const desc = Math.round(subtotal * (descPct / 100));
    const iva = Math.round((subtotal - desc) * 0.19);
    const total = subtotal - desc + iva;
    el.innerHTML = `
      ${cot.items.map(x => `<div class="p-cot__line"><span class="small">${x.nombre}</span><span class="small">${Multra.fmtCOP(x.precio)}</span></div>`).join('')}
      <div class="p-cot__line"><span>Subtotal</span><span>${Multra.fmtCOP(subtotal)}</span></div>
      ${descPct > 0 ? `<div class="p-cot__line"><span>Descuento (${descPct}%)</span><span style="color:var(--err)">− ${Multra.fmtCOP(desc)}</span></div>` : ''}
      <div class="p-cot__line"><span>IVA 19%</span><span>${Multra.fmtCOP(iva)}</span></div>
      <div class="p-cot__line p-cot__line--total"><span>TOTAL</span><span style="color:var(--y2)">${Multra.fmtCOP(total)}</span></div>`;
  }
  window.compartirCotizacion = () => {
    if (!cot.items.length) return Multra.toast('Agrega servicios primero', 'err');
    const subtotal = cot.items.reduce((a, x) => a + x.precio, 0);
    const descPct = Number(document.getElementById('cotDesc')?.value) || 0;
    const desc = Math.round(subtotal * (descPct / 100));
    const iva = Math.round((subtotal - desc) * 0.19);
    const total = subtotal - desc + iva;
    const txt = `Hola Multra, cotización:%0A${cot.items.map(x => `• ${x.nombre} — ${Multra.fmtCOP(x.precio)}`).join('%0A')}%0A%0ASubtotal: ${Multra.fmtCOP(subtotal)}%0ADescuento: ${Multra.fmtCOP(desc)}%0AIVA: ${Multra.fmtCOP(iva)}%0ATotal: ${Multra.fmtCOP(total)}`;
    window.open('https://wa.me/573001234567?text=' + txt, '_blank');
  };

  // ===== Vista: Pagos =====
  VIEWS.pagos = async () => {
    setCrumb('Pagos');
    state.pagos = await Multra.api('/api/pagos');
    if (!state.clientes.length) state.clientes = await Multra.api('/api/clientes');
    const nombreCliente = id => (state.clientes.find(c => c.id === id)?.nombre) || `#${id}`;
    return `
      <div class="p-page-head">
        <div class="p-page-head__left"><small>COMERCIAL</small><h1>Pagos</h1><p>${state.pagos.length} registrados</p></div>
        <button class="p-btn" onclick="Multra.openPagoForm()"><i class="bi bi-plus-circle"></i> Registrar pago</button>
      </div>
      <div class="p-tbl-wrap">
        <table class="p-tbl">
          <thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Monto</th><th>Método</th><th>Póliza</th><th>Referencia</th></tr></thead>
          <tbody>
            ${state.pagos.length ? state.pagos.map(p => `
              <tr>
                <td>#${p.id}</td>
                <td>${Multra.fmtDate(p.fecha)}</td>
                <td>${Multra.esc(nombreCliente(p.clienteId))}</td>
                <td>${Multra.fmtCOP(p.monto)}</td>
                <td><span class="badge badge-k">${Multra.esc(p.metodo)}</span></td>
                <td>${p.polizaId || '—'}</td>
                <td class="small muted">${Multra.esc(p.ref || '—')}</td>
              </tr>`).join('') : '<tr><td colspan="7"><div class="p-empty"><i class="bi bi-cash-coin"></i><p>Sin pagos registrados</p></div></td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  };
  Multra.openPagoForm = async () => {
    if (!state.clientes.length) state.clientes = await Multra.api('/api/clientes');
    Multra.openModal(`
      <h3>Registrar pago</h3>
      <form id="pgForm">
        <div class="p-form-grid">
          <div class="p-field"><label class="p-label">Cliente <span class="req">*</span></label>
            <select class="p-select" id="pg_cli" required>
              <option value="">Selecciona…</option>${state.clientes.map(c => `<option value="${c.id}">${Multra.esc(c.nombre)} (${c.cedula})</option>`).join('')}
            </select>
          </div>
          <div class="p-field"><label class="p-label">Monto <span class="req">*</span></label><input class="p-input" id="pg_monto" type="number" min="1" required></div>
          <div class="p-field"><label class="p-label">Método <span class="req">*</span></label>
            <select class="p-select" id="pg_metodo">${['pse','tarjeta','efectivo','transferencia','nequi','daviplata'].map(m => `<option>${m}</option>`).join('')}</select>
          </div>
          <div class="p-field"><label class="p-label">Referencia</label><input class="p-input" id="pg_ref" placeholder="N° comprobante / transacción"></div>
        </div>
        <div class="p-modal__actions">
          <button type="button" class="p-btn p-btn--ghost" onclick="Multra.closeModal()">Cancelar</button>
          <button class="p-btn" type="submit">Guardar pago</button>
        </div>
      </form>
    `);
    document.getElementById('pgForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await Multra.api('/api/pagos', { method: 'POST', body: JSON.stringify({
          clienteId: Number(pg_cli.value), monto: Number(pg_monto.value), metodo: pg_metodo.value, ref: pg_ref.value
        })});
        Multra.toast('Pago registrado', 'ok');
        Multra.closeModal();
        go('pagos');
      } catch (err) { Multra.toast(err.message, 'err'); }
    };
  };

  // ===== Vista: Trámites =====
  VIEWS.tramites = async () => {
    setCrumb('Trámites');
    state.tramites = await Multra.api('/api/tramites');
    return `
      <div class="p-page-head">
        <div class="p-page-head__left"><small>COMERCIAL</small><h1>Trámites</h1><p>${state.tramites.length} registrados</p></div>
        <button class="p-btn" onclick="Multra.openTramiteForm()"><i class="bi bi-plus-circle"></i> Nuevo trámite</button>
      </div>
      <div class="p-tbl-wrap">
        <table class="p-tbl">
          <thead><tr><th>ID</th><th>Tipo</th><th>Cliente</th><th>Vehículo</th><th>Estado</th><th>Documentos</th><th>Gestor</th></tr></thead>
          <tbody>
            ${state.tramites.length ? state.tramites.map(t => `
              <tr>
                <td>#${t.id}</td>
                <td><b>${Multra.esc(t.tipo)}</b><div class="small muted">${Multra.esc(t.descripcion || '')}</div></td>
                <td>${Multra.esc(t.cliente?.nombre || '—')}</td>
                <td>${Multra.esc(t.vehiculo?.placa || '—')}</td>
                <td>
                  <select class="p-select" style="padding:4px 8px;font-size:.72rem;width:auto" onchange="Multra.updateTramiteEstado(${t.id}, this.value)">
                    ${['recibido','en proceso','radicado','finalizado','rechazado'].map(s => `<option value="${s}" ${t.estado === s ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </td>
                <td class="small">${(t.documentos || []).map(d => `<span class="badge badge-k me-1">${d}</span>`).join('') || '—'}</td>
                <td>${Multra.esc(t.gestor || '—')}</td>
              </tr>`).join('') : '<tr><td colspan="7"><div class="p-empty"><i class="bi bi-file-text"></i><p>Sin trámites</p></div></td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  };

  Multra.updateTramiteEstado = async (id, estado) => {
    try { await Multra.api('/api/tramites/' + id, { method: 'PATCH', body: JSON.stringify({ estado }) }); Multra.toast('Trámite actualizado', 'ok'); }
    catch (e) { Multra.toast(e.message, 'err'); }
  };

  Multra.openTramiteForm = async () => {
    if (!state.clientes.length) state.clientes = await Multra.api('/api/clientes');
    if (!state.vehiculos.length) state.vehiculos = await Multra.api('/api/vehiculos');
    Multra.openModal(`
      <h3>Nuevo trámite</h3>
      <form id="trForm">
        <div class="p-form-grid">
          <div class="p-field"><label class="p-label">Cliente <span class="req">*</span></label>
            <select class="p-select" id="tf_cli" required>
              <option value="">Selecciona…</option>${state.clientes.map(c => `<option value="${c.id}">${c.nombre} (${c.cedula})</option>`).join('')}
            </select>
          </div>
          <div class="p-field"><label class="p-label">Tipo <span class="req">*</span></label>
            <select class="p-select" id="tf_tipo" required>
              ${['Traspaso de vehículo','Licencia de conducción','Duplicado de placas','Cambio de motor','Cambio de carrocería','Matrícula inicial','FUR — Revisión Técnico-Mecánica'].map(t => `<option>${t}</option>`).join('')}
            </select>
          </div>
          <div class="p-field"><label class="p-label">Vehículo</label>
            <select class="p-select" id="tf_veh"><option value="">—</option>${state.vehiculos.map(v => `<option value="${v.id}">${v.placa} · ${v.marca} ${v.linea}</option>`).join('')}</select>
          </div>
          <div class="p-field"><label class="p-label">Gestor</label><input class="p-input" id="tf_gest" value="admin"></div>
          <div class="p-field p-field--full"><label class="p-label">Descripción</label><textarea class="p-textarea" id="tf_desc" placeholder="Notas del trámite…"></textarea></div>
          <div class="p-field p-field--full"><label class="p-label">Documentos (separados por coma)</label><input class="p-input" id="tf_docs" placeholder="Cédula, SOAT, Tarjeta de propiedad"></div>
        </div>
        <div class="p-modal__actions">
          <button type="button" class="p-btn p-btn--ghost" onclick="Multra.closeModal()">Cancelar</button>
          <button class="p-btn" type="submit">Crear trámite</button>
        </div>
      </form>
    `);
    document.getElementById('trForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await Multra.api('/api/tramites', { method: 'POST', body: JSON.stringify({
          clienteId: Number(tf_cli.value), vehiculoId: tf_veh.value ? Number(tf_veh.value) : null,
          tipo: tf_tipo.value, descripcion: tf_desc.value, gestor: tf_gest.value,
          documentos: tf_docs.value.split(',').map(s => s.trim()).filter(Boolean)
        })});
        Multra.toast('Trámite creado', 'ok');
        Multra.closeModal();
        go('tramites');
      } catch (err) { Multra.toast(err.message, 'err'); }
    };
  };

  // ===== Vista: Clientes =====
  VIEWS.clientes = async () => {
    setCrumb('Clientes');
    state.clientes = await Multra.api('/api/clientes');
    if (!state.vehiculos.length) state.vehiculos = await Multra.api('/api/vehiculos');
    return `
      <div class="p-page-head">
        <div class="p-page-head__left"><small>DATOS</small><h1>Clientes</h1><p>${state.clientes.length} clientes</p></div>
        <button class="p-btn" onclick="Multra.openClienteForm()"><i class="bi bi-person-plus"></i> Nuevo cliente</button>
      </div>
      <div class="p-search">
        <i class="bi bi-search"></i>
        <input class="p-input" id="cliSearch" placeholder="Buscar por nombre o cédula…">
      </div>
      <div class="p-grid" id="cliList"></div>
    `;
  };
  function renderClientes() {
    const q = (document.getElementById('cliSearch')?.value || '').toLowerCase();
    const list = state.clientes.filter(c => !q || c.nombre.toLowerCase().includes(q) || c.cedula.includes(q));
    const el = document.getElementById('cliList');
    if (!el) return;
    if (!list.length) { el.innerHTML = '<div class="p-empty" style="grid-column:1/-1"><i class="bi bi-people"></i><p>Sin clientes</p></div>'; return; }
    el.innerHTML = list.map(c => {
      const vehs = state.vehiculos.filter(v => v.clienteId === c.id);
      return `<div class="p-cli-card">
        <div class="p-cli-card__head">
          <div class="p-avatar">${c.nombre.charAt(0)}</div>
          <div><b>${c.nombre}</b><small class="muted">${c.cedula}</small></div>
        </div>
        <div class="p-veh-card__row"><span>Teléfono</span><b>${c.telefono || '—'}</b></div>
        <div class="p-veh-card__row"><span>Email</span><b class="small">${c.email || '—'}</b></div>
        <div class="p-veh-card__row"><span>Dirección</span><b class="small">${c.direccion || '—'}</b></div>
        <div class="p-veh-card__row"><span>Vehículos</span><b>${vehs.length}</b></div>
        ${vehs.length ? `<div class="mt-1">${vehs.map(v => `<span class="badge badge-k me-1">${v.placa}</span>`).join('')}</div>` : ''}
      </div>`;
    }).join('');
  }
  Multra.openClienteForm = () => {
    Multra.openModal(`
      <h3>Nuevo cliente</h3>
      <form id="cliForm">
        <div class="p-form-grid">
          <div class="p-field"><label class="p-label">Nombre <span class="req">*</span></label><input class="p-input" id="cf_nom" required></div>
          <div class="p-field"><label class="p-label">Cédula <span class="req">*</span></label><input class="p-input" id="cf_ced" required></div>
          <div class="p-field"><label class="p-label">Teléfono</label><input class="p-input" id="cf_tel"></div>
          <div class="p-field"><label class="p-label">Email</label><input class="p-input" id="cf_ema" type="email"></div>
          <div class="p-field p-field--full"><label class="p-label">Dirección</label><input class="p-input" id="cf_dir"></div>
        </div>
        <div class="p-modal__actions">
          <button type="button" class="p-btn p-btn--ghost" onclick="Multra.closeModal()">Cancelar</button>
          <button class="p-btn" type="submit">Crear cliente</button>
        </div>
      </form>
    `);
    document.getElementById('cliForm').onsubmit = async (e) => {
      e.preventDefault();
      try {
        await Multra.api('/api/clientes', { method: 'POST', body: JSON.stringify({
          nombre: cf_nom.value, cedula: cf_ced.value, telefono: cf_tel.value, email: cf_ema.value, direccion: cf_dir.value
        })});
        Multra.toast('Cliente creado', 'ok');
        Multra.closeModal();
        go('clientes');
      } catch (err) { Multra.toast(err.message, 'err'); }
    };
  };

  // ===== Router =====
  async function renderView(name) {
    const view = document.getElementById('view');
    view.innerHTML = '<div class="p-empty"><i class="bi bi-hourglass-split"></i><p>Cargando…</p></div>';
    try {
      const html = await VIEWS[name]();
      view.innerHTML = html;
      if (name === 'vehiculos') { document.getElementById('vehSearch').addEventListener('input', renderVehiculos); renderVehiculos(); }
      if (name === 'seguros') renderPolizas();
      if (name === 'clientes') { document.getElementById('cliSearch').addEventListener('input', renderClientes); renderClientes(); }
      if (name === 'inspeccion') setupChecklist();
      if (name === 'cotizador') setupCotizador();
    } catch (e) {
      view.innerHTML = `<div class="p-empty"><i class="bi bi-exclamation-triangle"></i><p>${e.message}</p></div>`;
    }
  }

  renderView('dashboard');
})();

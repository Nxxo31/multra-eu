// Multra E.U. — Core compartido: formateo, sesión, toast, modal.
// Usado por landing, login y panel.

const Multra = {
  // formatters
  fmtCOP: v => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(v || 0)),
  fmtDate: d => d ? new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' }) : '—',
  fmtDateTime: d => d ? new Date(d).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—',
  daysUntil: d => { if (!d) return null; const t = new Date(); t.setHours(0, 0, 0, 0); return Math.ceil((new Date(d + 'T00:00:00') - t) / 86400000); },
  esc: s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),

  // sesión
  TOKEN_KEY: 'multra_token',
  USER_KEY: 'multra_user',
  getToken: () => localStorage.getItem('multra_token'),
  getUser: () => { try { return JSON.parse(localStorage.getItem('multra_user') || 'null'); } catch { return null; } },
  setSession: (token, user) => { localStorage.setItem('multra_token', token); localStorage.setItem('multra_user', JSON.stringify(user)); },
  clearSession: () => { localStorage.removeItem('multra_token'); localStorage.removeItem('multra_user'); },

  // api
  async api(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (!opts.skipAuth) {
      const t = localStorage.getItem('multra_token');
      if (t) headers['Authorization'] = 'Bearer ' + t;
    }
    const r = await fetch(path, { ...opts, headers, skipAuth: undefined });
    if (r.status === 401) { Multra.clearSession(); if (!opts.silent) location.replace('login.html'); throw new Error('No autorizado'); }
    const txt = await r.text();
    const data = txt ? JSON.parse(txt) : null;
    if (!r.ok) throw new Error((data && data.error) || `Error ${r.status}`);
    return data;
  },

  // toast
  _toastEl: null,
  toast(msg, type = '') {
    if (!this._toastEl) {
      this._toastEl = document.createElement('div');
      this._toastEl.className = 'p-toast';
      document.body.appendChild(this._toastEl);
    }
    this._toastEl.className = 'p-toast p-toast--show' + (type ? ' p-toast--' + type : '');
    this._toastEl.textContent = msg;
    clearTimeout(this._toastEl._t);
    this._toastEl._t = setTimeout(() => this._toastEl.className = 'p-toast', 2500);
  },

  // modal genérico
  openModal(html) {
    this.closeModal();
    const wrap = document.createElement('div');
    wrap.className = 'p-modal p-modal--open';
    wrap.innerHTML = `<div class="p-modal__box">${html}</div>`;
    wrap.addEventListener('click', e => { if (e.target === wrap) this.closeModal(); });
    document.body.appendChild(wrap);
    return wrap;
  },
  closeModal: () => document.querySelectorAll('.p-modal').forEach(m => m.remove()),

  // badge helper para vencimientos
  docBadge: dias => {
    if (dias === null) return '<span class="badge">—</span>';
    if (dias < 0) return `<span class="badge badge-err">vencido hace ${-dias}d</span>`;
    if (dias <= 30) return `<span class="badge badge-warn">vence en ${dias}d</span>`;
    return `<span class="badge badge-ok">${dias}d</span>`;
  }
};
window.Multra = Multra;

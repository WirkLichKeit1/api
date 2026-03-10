/**
 * mobile.js — Controle do menu mobile (hamburger + sidebar drawer)
 *
 * Funciona independente do App — inicializa assim que o DOM carrega.
 * Expõe window.MobileMenu para uso externo se necessário.
 */

const MobileMenu = (() => {
  let _sidebar     = null;
  let _overlay     = null;
  let _escHandler  = null;

  function _open() {
    if (!_sidebar) return;
    _sidebar.classList.add('mobile-open');
    _overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    _escHandler = (e) => { if (e.key === 'Escape') _close(); };
    document.addEventListener('keydown', _escHandler);
  }

  function _close() {
    if (!_sidebar) return;
    _sidebar.classList.remove('mobile-open');
    _overlay.classList.remove('active');
    document.body.style.overflow = '';

    if (_escHandler) {
      document.removeEventListener('keydown', _escHandler);
      _escHandler = null;
    }
  }

  function _toggle() {
    if (_sidebar?.classList.contains('mobile-open')) _close();
    else _open();
  }

  function init() {
    _sidebar = document.querySelector('.sidebar');
    if (!_sidebar) return;

    /* ── Inject hamburger button into topbar ── */
    const topbarLeft = document.querySelector('.topbar__left');
    if (topbarLeft && !document.querySelector('.mobile-menu-btn')) {
      const btn = document.createElement('button');
      btn.className    = 'mobile-menu-btn';
      btn.setAttribute('aria-label', 'Menu');
      btn.setAttribute('aria-expanded', 'false');
      btn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6"  x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>`;
      btn.addEventListener('click', () => {
        _toggle();
        btn.setAttribute('aria-expanded', _sidebar.classList.contains('mobile-open'));
      });
      topbarLeft.insertBefore(btn, topbarLeft.firstChild);
    }

    /* ── Inject close button inside sidebar ── */
    if (!_sidebar.querySelector('.sidebar__close')) {
      const closeBtn = document.createElement('button');
      closeBtn.className   = 'sidebar__close';
      closeBtn.setAttribute('aria-label', 'Fechar menu');
      closeBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6"  y1="6" x2="18" y2="18"/>
        </svg>`;
      closeBtn.addEventListener('click', _close);
      _sidebar.appendChild(closeBtn);
    }

    /* ── Inject overlay ── */
    if (!document.querySelector('.sidebar-overlay')) {
      _overlay = document.createElement('div');
      _overlay.className = 'sidebar-overlay';
      _overlay.addEventListener('click', _close);
      document.body.appendChild(_overlay);
    } else {
      _overlay = document.querySelector('.sidebar-overlay');
    }

    /* ── Close sidebar on nav-item click (mobile) ── */
    _sidebar.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) _close();
      });
    });

    /* ── Re-wire nav items added dynamically later ── */
    const observer = new MutationObserver(() => {
      _sidebar.querySelectorAll('.nav-item:not([data-mobile-wired])').forEach(item => {
        item.dataset.mobileWired = '1';
        item.addEventListener('click', () => {
          if (window.innerWidth <= 768) _close();
        });
      });
    });
    observer.observe(_sidebar, { childList: true, subtree: true });

    /* ── Close on resize to desktop ── */
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) _close();
    });
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already ready (script loaded late)
    init();
  }

  return { open: _open, close: _close, toggle: _toggle, init };
})();

window.MobileMenu = MobileMenu;
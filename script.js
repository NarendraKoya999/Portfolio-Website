(function () {
  'use strict';

  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const themeColorMeta = document.getElementById('theme-color');
  const menuToggle = document.getElementById('menu-toggle');
  const siteNav = document.getElementById('site-nav');
  const progressBar = document.getElementById('scroll-progress-bar');
  const yearLabel = document.getElementById('current-year');

  // Theme: the inline <head> script already applied the saved/OS theme before first paint.
  if (!root.dataset.theme) {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = prefersDark ? 'dark' : 'light';
  }
  updateThemeUI(root.dataset.theme);

  function updateThemeUI(theme) {
    const isDark = theme === 'dark';
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
      themeToggle.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    if (themeColorMeta) themeColorMeta.setAttribute('content', isDark ? '#141713' : '#f5f4ef');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      updateThemeUI(next);
      try { localStorage.setItem('nk-portfolio-theme', next); } catch (_) { /* Theme still works for this page view. */ }
    });
  }

  function closeMenu() {
    if (!siteNav || !menuToggle) return;
    siteNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
  }

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', function () {
      const isOpen = siteNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
    });
    siteNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeMenu();
    });
    document.addEventListener('click', function (event) {
      if (!siteNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760) closeMenu();
    });
  }

  function updateScrollProgress() {
    if (!progressBar) return;
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
    progressBar.style.width = Math.min(100, Math.max(0, progress)) + '%';
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress);
  updateScrollProgress();

  if (yearLabel) yearLabel.textContent = String(new Date().getFullYear());

  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal on scroll.
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver(function (entries, currentObserver) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          currentObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });
    revealItems.forEach(function (item) { observer.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  }

  // Back to top / brand link: scroll smoothly to the very top (works reliably with the sticky header).
  document.querySelectorAll('a[href="#top"]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
      closeMenu();
      if (history.replaceState) history.replaceState(null, '', window.location.pathname + window.location.search);
    });
  });

  // Scroll-spy: highlight the nav link for the section in view.
  const navLinks = Array.prototype.slice.call(document.querySelectorAll('.site-nav > a[href^="#"]:not(.nav-contact)'));
  if ('IntersectionObserver' in window && navLinks.length) {
    const sections = navLinks
      .map(function (link) { return document.querySelector(link.getAttribute('href')); })
      .filter(Boolean);
    const spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          const active = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'true'); else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (section) { spy.observe(section); });
  }

  // Analytics consent (works with GA4 Consent Mode set up in <head>).
  const consentBox = document.getElementById('consent');
  const acceptBtn = document.getElementById('consent-accept');
  const declineBtn = document.getElementById('consent-decline');
  let consentChoice = null;
  try { consentChoice = localStorage.getItem('nk-consent'); } catch (_) { /* ignore */ }

  function setConsent(value) {
    try { localStorage.setItem('nk-consent', value); } catch (_) { /* ignore */ }
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: value });
    }
    if (consentBox) consentBox.hidden = true;
  }

  if (consentBox && !consentChoice) consentBox.hidden = false;
  if (acceptBtn) acceptBtn.addEventListener('click', function () { setConsent('granted'); });
  if (declineBtn) declineBtn.addEventListener('click', function () { setConsent('denied'); });
})();
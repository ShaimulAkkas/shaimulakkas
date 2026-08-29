/* ══════════════════════════════════════════
   MAIN.JS — Portfolio Interactions
   ══════════════════════════════════════════ */

(function () {
  'use strict';

  // ── Theme Toggle ──
  const themeToggle = document.getElementById('theme-toggle');
  const themeToggleMobile = document.getElementById('theme-toggle-mobile');
  const html = document.documentElement;

  function getPreferredTheme() {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
  }

  function updateThemeIcon(theme) {
    const icon = theme === 'dark' ? '☀️' : '🌙';
    const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
    if (themeToggle) {
      themeToggle.textContent = icon;
      themeToggle.setAttribute('aria-label', label);
    }
    if (themeToggleMobile) {
      themeToggleMobile.textContent = icon;
      themeToggleMobile.setAttribute('aria-label', label);
    }
  }

  function toggleTheme() {
    const current = html.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  }

  setTheme(getPreferredTheme());
  if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
  if (themeToggleMobile) themeToggleMobile.addEventListener('click', toggleTheme);

  // ── Language Toggle ──
  const langToggle = document.getElementById('lang-toggle');
  const langToggleMobile = document.getElementById('lang-toggle-mobile');
  let currentLang = localStorage.getItem('lang') || 'en';

  function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    html.setAttribute('lang', lang === 'bn' ? 'bn' : 'en');
    updateLangIcon(lang);
    translatePage(lang);
  }

  function updateLangIcon(lang) {
    const text = lang === 'en' ? 'বাং' : 'EN';
    const label = lang === 'en' ? 'Switch to Bangla' : 'Switch to English';
    if (langToggle) {
      langToggle.textContent = text;
      langToggle.setAttribute('aria-label', label);
    }
    if (langToggleMobile) {
      langToggleMobile.textContent = text;
      langToggleMobile.setAttribute('aria-label', label);
    }
  }

  function translatePage(lang) {
    if (typeof translations === 'undefined') return;
    const t = translations[lang];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) {
        if (el.hasAttribute('data-i18n-html')) {
          el.innerHTML = t[key];
        } else {
          el.textContent = t[key];
        }
      }
    });
  }

  function toggleLang() {
    setLanguage(currentLang === 'en' ? 'bn' : 'en');
  }

  setLanguage(currentLang);
  if (langToggle) langToggle.addEventListener('click', toggleLang);
  if (langToggleMobile) langToggleMobile.addEventListener('click', toggleLang);

  // ── Scroll-triggered animations ──
  const animateObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          animateObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.animate-in, .animate-left, .animate-right, .animate-scale, .stagger-children').forEach((el) => {
    animateObserver.observe(el);
  });

  // ── Language bars animation ──
  const langObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.querySelectorAll('.lang-fill').forEach((bar) => {
            const targetWidth = bar.dataset.width || bar.style.width;
            bar.style.width = '0%';
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                bar.style.width = targetWidth;
              });
            });
          });
          langObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  document.querySelectorAll('.lang-card').forEach((el) => {
    langObserver.observe(el);
  });

  // ── Navbar scroll effect ──
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  // ── Mobile nav toggle ──
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navOverlay = document.querySelector('.nav-overlay');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
      if (navOverlay) navOverlay.classList.toggle('active');
      document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
    });

    if (navOverlay) {
      navOverlay.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
        if (navOverlay) navOverlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    });
  }

  // ── Active nav link on scroll ──
  const sections = document.querySelectorAll('section[id]');
  if (sections.length > 0) {
    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            document.querySelectorAll('.nav-links a').forEach((link) => {
              link.classList.toggle('active', link.getAttribute('href') === '#' + id);
            });
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' }
    );

    sections.forEach((section) => activeObserver.observe(section));
  }

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });

  // ── Typing effect for hero greeting ──
  const greetingEl = document.querySelector('.hero-greeting');
  if (greetingEl) {
    const text = greetingEl.textContent;
    greetingEl.textContent = '';
    greetingEl.style.visibility = 'visible';
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < text.length) {
        greetingEl.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 60);
  }

  // ── Stat Counter Animation ──
  const statNums = document.querySelectorAll('.stat-num[data-count]');
  if (statNums.length > 0) {
    const animateCounter = (el) => {
      const target = parseInt(el.getAttribute('data-count'), 10);
      const duration = 1500;
      const start = performance.now();
      const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    statNums.forEach((el) => counterObserver.observe(el));
  }

})();

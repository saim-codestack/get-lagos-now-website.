/* =========================================================
   Get Lagos Now — main.js (vanilla JS, no dependencies)
   Multi-page aware navigation + shared interactions
   ========================================================= */
(function () {
  'use strict';

  var doc = document.documentElement;
  doc.classList.add('js');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var page = (doc.getAttribute('data-page') || '').toLowerCase();
  var path = (window.location.pathname || '').toLowerCase();
  var file = path.split('/').pop() || 'index.html';
  if (!page) {
    if (file.indexOf('services') !== -1) page = 'services';
    else if (file.indexOf('work') !== -1) page = 'work';
    else if (file.indexOf('about') !== -1) page = 'about';
    else if (file.indexOf('impact') !== -1) page = 'impact';
    else if (file.indexOf('insights') !== -1) page = 'insights';
    else if (file.indexOf('contact') !== -1) page = 'contact';
    else page = 'home';
  }

  /* ---------- Footer year ---------- */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header on scroll ---------- */
  var header = $('#siteHeader');
  var onScroll = function () {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 12);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  var toggle = $('#menuToggle');
  var menu = $('#mobileMenu');

  function openMenu() {
    if (!menu || !toggle) return;
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
    var first = $('a', menu);
    if (first) first.focus();
  }
  function closeMenu(returnFocus) {
    if (!menu || !toggle) return;
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
    if (returnFocus) toggle.focus();
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      if (menu.hidden) openMenu(); else closeMenu(false);
    });
    $$('a', menu).forEach(function (a) {
      a.addEventListener('click', function () { closeMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) closeMenu(true);
      if (e.key === 'Tab' && !menu.hidden) {
        var focusables = [toggle].concat($$('a, button', menu).filter(function (el) { return !el.closest('[hidden]') && !el.disabled && el.getClientRects().length > 0; }));
        var firstEl = focusables[0];
        var lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
        else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      }
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024 && !menu.hidden) closeMenu(false);
    });

    // Mobile accordion submenus (Portfolio & Reports)
    $$('.mobile-sub-toggle', menu).forEach(function (subBtn) {
      var panelId = subBtn.getAttribute('aria-controls');
      var subPanel = panelId ? document.getElementById(panelId) : null;
      if (!subPanel) return;
      subBtn.addEventListener('click', function () {
        var expanded = subBtn.getAttribute('aria-expanded') === 'true';
        subBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        subPanel.hidden = expanded;
      });
    });
  }

  /* ---------- Desktop navigation dropdowns (Portfolio & Reports) ---------- */
  var dropdownItems = $$('.nav-item--dropdown');
  function closeAllDropdowns(exceptItem) {
    dropdownItems.forEach(function (item) {
      if (item === exceptItem) return;
      item.classList.remove('is-open');
      var btn = $('.nav-dropdown__toggle', item);
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  dropdownItems.forEach(function (item) {
    var btn = $('.nav-dropdown__toggle', item);
    var panel = $('.nav-dropdown', item);
    var hoverTimer = null;
    if (!btn || !panel) return;

    function openDropdown() {
      if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
      closeAllDropdowns(item);
      item.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    }

    function closeDropdown() {
      if (hoverTimer) { clearTimeout(hoverTimer); hoverTimer = null; }
      item.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = item.classList.contains('is-open');
      if (isOpen) closeDropdown(); else openDropdown();
    });

    btn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        openDropdown();
        var firstLink = $('a', panel);
        if (firstLink) window.requestAnimationFrame(function () { firstLink.focus(); });
      }
    });

    item.addEventListener('mouseenter', function () {
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        openDropdown();
      }
    });

    item.addEventListener('mouseleave', function () {
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        hoverTimer = setTimeout(closeDropdown, 140);
      }
    });

    item.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && item.classList.contains('is-open')) {
        e.stopPropagation();
        closeDropdown();
        btn.focus();
      }
    });

    item.addEventListener('focusout', function (e) {
      var next = e.relatedTarget;
      if (next && item.contains(next)) return;
      closeDropdown();
    });
  });

  document.addEventListener('click', function (e) {
    var inside = e.target.closest ? e.target.closest('.nav-item--dropdown') : null;
    if (!inside) closeAllDropdowns(null);
  });

  /* ---------- Smooth same-page anchor scrolling ---------- */
  function scrollToId(id, updateHash) {
    if (!id) return false;
    var target = document.getElementById(id);
    if (!target) return false;
    var offset = header ? header.offsetHeight : 0;
    var top = target.getBoundingClientRect().top + window.scrollY - (id === 'home' ? offset + 20 : offset - 1);
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
    if (updateHash && history.replaceState) history.replaceState(null, '', '#' + id);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    return true;
  }

  function isSamePageHref(href) {
    if (!href) return false;
    if (href.charAt(0) === '#') return true;
    try {
      var url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return false;
      var targetFile = (url.pathname.split('/').pop() || 'index.html').toLowerCase();
      var currentFile = file || 'index.html';
      if (targetFile === '') targetFile = 'index.html';
      if (currentFile === '') currentFile = 'index.html';
      // Treat bare directory and index.html as the same page
      if ((targetFile === 'index.html' || targetFile === '') && (currentFile === 'index.html' || currentFile === '')) {
        return !!url.hash;
      }
      return targetFile === currentFile && !!url.hash;
    } catch (err) {
      return false;
    }
  }

  function getHashId(href) {
    if (!href) return '';
    if (href.charAt(0) === '#') return href.slice(1);
    try {
      var url = new URL(href, window.location.href);
      return (url.hash || '').replace(/^#/, '');
    } catch (err) {
      var i = href.indexOf('#');
      return i >= 0 ? href.slice(i + 1) : '';
    }
  }

  // Placeholder social links (URLs pending client confirmation) must not jump to page top.
  $$('a[href="#"]').forEach(function (link) {
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', function (e) { e.preventDefault(); });
  });

  $$('a[href]').forEach(function (link) {
    var href = link.getAttribute('href');
    if (!href || href === '#' || href.indexOf('javascript:') === 0) return;
    if (!isSamePageHref(href)) return;
    link.addEventListener('click', function (e) {
      var id = getHashId(href);
      if (!id) return;
      if (scrollToId(id, true)) e.preventDefault();
    });
  });

  // Arrive from another page with a hash (e.g. services.html#web-design or index.html#contact)
  if (window.location.hash && window.location.hash.length > 1) {
    var initialId = window.location.hash.slice(1);
    // Delay slightly so layout/fonts settle
    window.setTimeout(function () { scrollToId(initialId, false); }, 50);
  }

  /* ---------- Active nav link (page-aware) ---------- */
  var navLinks = $$('.nav-pill [data-nav], .mobile-menu nav [data-nav]');

  function clearNavActive() {
    navLinks.forEach(function (el) {
      el.classList.remove('is-active');
      if (el.tagName === 'A') el.removeAttribute('aria-current');
    });
  }

  function setNavActive(key) {
    clearNavActive();
    navLinks.forEach(function (el) {
      var nav = (el.getAttribute('data-nav') || '').toLowerCase();
      if (nav === key) {
        el.classList.add('is-active');
        if (el.tagName === 'A') el.setAttribute('aria-current', 'page');
      }
    });
  }

  if (page === 'services') {
    setNavActive('services');
  } else if (page === 'work') {
    setNavActive('work');
  } else if (page === 'about') {
    setNavActive('about');
  } else if (page === 'impact') {
    setNavActive('impact');
  } else if (page === 'insights') {
    setNavActive('insights');
  } else if (page === 'reports') {
    setNavActive('reports');
  } else if (page === 'contact' || page === 'privacy') {
    clearNavActive();
  } else if (page === 'home') {
    setNavActive('home');

    // On the homepage, optionally highlight section navs while scrolling
    // without fighting the dedicated Services page active state.
    var sectionMap = {
      home: 'home',
      work: 'home', // "Our Work" now lives on work.html, so the homepage block keeps Home active
      about: 'home', // The dedicated About page owns its active navigation state.
      impact: 'home', // Impact now has its own page; keep Home active on the homepage section.
      services: 'home' // homepage services block should not steal Services page state
    };
    var observed = ['home', 'about', 'work', 'impact']
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    if ('IntersectionObserver' in window && observed.length) {
      var navObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var key = sectionMap[entry.target.id] || 'home';
          setNavActive(key);
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      observed.forEach(function (s) { navObserver.observe(s); });
    }
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) {
      var parent = el.parentElement;
      var siblings = parent ? $$(':scope > .reveal', parent) : [];
      var idx = siblings.indexOf(el);
      if (idx > 0) el.style.transitionDelay = Math.min(idx * 70, 280) + 'ms';
      revealObserver.observe(el);
    });
  }

  /* ---------- Gauge (homepage only) ---------- */
  var gauge = $('#gaugeSvg');
  if (gauge) {
    var ns = 'http://www.w3.org/2000/svg';
    var cx = 160, cy = 160, total = 54, filled = 40;
    for (var i = 0; i <= total; i++) {
      var angle = Math.PI + (Math.PI * i / total);
      var major = i % 6 === 0;
      var rOuter = 150, rInner = major ? 124 : 132;
      var line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', (cx + rInner * Math.cos(angle)).toFixed(2));
      line.setAttribute('y1', (cy + rInner * Math.sin(angle)).toFixed(2));
      line.setAttribute('x2', (cx + rOuter * Math.cos(angle)).toFixed(2));
      line.setAttribute('y2', (cy + rOuter * Math.sin(angle)).toFixed(2));
      var color = i < filled ? '#101010' : 'rgba(16,16,16,.16)';
      if (i === filled) color = '#BA2028';
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', i === filled ? 3.2 : (major ? 2 : 1.4));
      gauge.appendChild(line);
    }
  }

  /* ---------- Testimonial slider (homepage only) ---------- */
  var testi = $('#testi');
  if (testi) {
    var slides = $$('.testi__slide', testi);
    var img = $('#testiImg');
    var count = $('#testiCount');
    var current = 0;

    var go = function (n) {
      var next = (n + slides.length) % slides.length;
      if (next === current) return;
      slides[current].classList.remove('is-active');
      slides[current].setAttribute('aria-hidden', 'true');
      current = next;
      slides[current].classList.add('is-active');
      slides[current].removeAttribute('aria-hidden');
      if (count) count.textContent = ('0' + (current + 1)).slice(-2) + ' / ' + ('0' + slides.length).slice(-2);
      if (img) {
        var src = slides[current].getAttribute('data-img');
        var alt = slides[current].getAttribute('data-alt') || '';
        img.classList.add('is-fading');
        var swap = function () {
          img.src = src; img.alt = alt;
          img.onload = function () { img.classList.remove('is-fading'); };
          setTimeout(function () { img.classList.remove('is-fading'); }, 600);
        };
        if (reduceMotion) swap(); else setTimeout(swap, 250);
      }
    };
    slides.forEach(function (s, i) { if (i !== 0) s.setAttribute('aria-hidden', 'true'); });
    var prev = $('#testiPrev'), nextBtn = $('#testiNext');
    if (prev) prev.addEventListener('click', function () { go(current - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { go(current + 1); });
    testi.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(current - 1);
      if (e.key === 'ArrowRight') go(current + 1);
    });
    slides.forEach(function (s) { var p = new Image(); p.src = s.getAttribute('data-img'); });
  }

  /* ---------- FAQ accordion (homepage only) ---------- */
  var accItems = $$('.acc-item');
  accItems.forEach(function (item) {
    var btn = $('.acc-btn', item);
    var panel = $('.acc-panel', item);
    if (!btn || !panel) return;
    btn.addEventListener('click', function () {
      var isOpen = btn.getAttribute('aria-expanded') === 'true';
      accItems.forEach(function (other) {
        var ob = $('.acc-btn', other), op = $('.acc-panel', other);
        if (!ob || !op) return;
        ob.setAttribute('aria-expanded', 'false');
        op.hidden = true;
        other.classList.remove('is-open');
      });
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
        item.classList.add('is-open');
      }
    });
  });
  var accButtons = $$('.acc-btn');
  accButtons.forEach(function (b, i) {
    b.addEventListener('keydown', function (e) {
      var target = null;
      if (e.key === 'ArrowDown') target = accButtons[(i + 1) % accButtons.length];
      if (e.key === 'ArrowUp') target = accButtons[(i - 1 + accButtons.length) % accButtons.length];
      if (e.key === 'Home') target = accButtons[0];
      if (e.key === 'End') target = accButtons[accButtons.length - 1];
      if (target) { e.preventDefault(); target.focus(); }
    });
  });

  /* ---------- Inquiry form validation (homepage only) ---------- */
  var form = $('#inquiryForm');
  if (form) {
    var status = $('#formStatus');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var rules = {
      fName: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your full name.'; },
      fEmail: function (v) {
        if (!v.trim()) return 'Please enter your email address.';
        return emailRe.test(v.trim()) ? '' : 'Please enter a valid email address (e.g. name@organization.org).';
      },
      fService: function (v) { return v ? '' : 'Please choose the service you are interested in.'; },
      fMsg: function (v) { return v.trim().length >= 10 ? '' : 'Please tell us a little about your project (at least 10 characters).'; }
    };

    var validateField = function (id) {
      var el = document.getElementById(id);
      var err = document.getElementById(id + '-err');
      if (!el) return true;
      var msg = rules[id](el.value);
      var field = el.closest('.field');
      if (field) field.classList.toggle('has-error', !!msg);
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
      return !msg;
    };

    Object.keys(rules).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', function () { if (el.value) validateField(id); });
      el.addEventListener('input', function () {
        if (el.closest('.field') && el.closest('.field').classList.contains('has-error')) validateField(id);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (status) {
        status.className = 'form__status';
        status.textContent = '';
      }
      var firstInvalid = null;
      Object.keys(rules).forEach(function (id) {
        if (!validateField(id) && !firstInvalid) firstInvalid = document.getElementById(id);
      });
      if (firstInvalid) {
        firstInvalid.focus();
        if (status) status.textContent = 'Please correct the highlighted fields.';
        return;
      }
      if (status) {
        status.classList.add('is-info');
        status.textContent = 'Your inquiry details passed validation. Form delivery is not connected, so no message was sent. Please use the contact page’s published phone or email to reach the team.';
      }
    });
  }

  /* ---------- Project inquiry form validation (contact page) ---------- */
  var projectForm = $('#projectInquiryForm');
  if (projectForm) {
    var ctStatus = $('#ctFormStatus');
    var ctSubmit = $('#ctSubmit');
    var ctSubmitLabel = $('#ctSubmitLabel');
    var ctServicesGroup = $('#ctServicesGroup');
    var ctEmailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var ctSubmitting = false;

    var isValidWebsite = function (raw) {
      var val = (raw || '').trim();
      if (!val) return true;
      var withProto = /^https?:\/\//i.test(val) ? val : 'https://' + val;
      try {
        var parsed = new URL(withProto);
        return /\.[a-z]{2,}$/i.test(parsed.hostname || '');
      } catch (err) {
        return false;
      }
    };

    var ctRules = {
      ctName: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your full name.'; },
      ctEmail: function (v) {
        if (!v.trim()) return 'Please enter your work email address.';
        return ctEmailRe.test(v.trim()) ? '' : 'Please enter a valid email address (e.g. you@organization.org).';
      },
      ctWebsite: function (v) {
        return isValidWebsite(v) ? '' : 'Please enter a valid website domain or URL (e.g. example.org).';
      },
      ctMessage: function (v) {
        return v.trim().length >= 10 ? '' : 'Please share a brief summary of your project (at least 10 characters).';
      }
    };

    var validateCtField = function (id) {
      var el = document.getElementById(id);
      var err = document.getElementById(id + '-err');
      if (!el) return true;
      var msg = ctRules[id](el.value);
      var field = el.closest('.field');
      if (field) field.classList.toggle('has-error', !!msg);
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg;
      return !msg;
    };

    var validateCtServices = function () {
      if (!ctServicesGroup) return true;
      var boxes = $$('input[name="services"]', ctServicesGroup);
      var checked = boxes.some(function (b) { return b.checked; });
      var err = $('#ctServices-err');
      ctServicesGroup.classList.toggle('has-error', !checked);
      if (err) err.textContent = checked ? '' : 'Please select at least one service area.';
      return checked;
    };

    Object.keys(ctRules).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', function () { if (el.value) validateCtField(id); });
      el.addEventListener('input', function () {
        var field = el.closest('.field');
        if (field && field.classList.contains('has-error')) validateCtField(id);
      });
    });

    if (ctServicesGroup) {
      ctServicesGroup.addEventListener('change', function () {
        if (ctServicesGroup.classList.contains('has-error')) validateCtServices();
      });
    }

    projectForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (ctSubmitting) return;

      var hp = $('#ctRole');
      if (hp && hp.value) return;

      if (ctStatus) {
        ctStatus.className = 'form__status ct-form__status';
        ctStatus.textContent = '';
      }

      var firstInvalid = null;
      ['ctName', 'ctEmail', 'ctWebsite'].forEach(function (id) {
        if (!validateCtField(id) && !firstInvalid) firstInvalid = document.getElementById(id);
      });
      if (!validateCtServices() && !firstInvalid) {
        firstInvalid = $('input[name="services"]', ctServicesGroup);
      }
      if (!validateCtField('ctMessage') && !firstInvalid) {
        firstInvalid = $('#ctMessage');
      }

      if (firstInvalid) {
        firstInvalid.focus();
        if (ctStatus) {
          ctStatus.classList.add('is-error');
          ctStatus.textContent = 'Please review the highlighted fields above.';
        }
        return;
      }

      ctSubmitting = true;
      if (ctSubmit) {
        ctSubmit.disabled = true;
        ctSubmit.setAttribute('aria-busy', 'true');
      }
      if (ctSubmitLabel) ctSubmitLabel.textContent = 'Checking…';

      window.setTimeout(function () {
        ctSubmitting = false;
        if (ctSubmit) {
          ctSubmit.disabled = false;
          ctSubmit.removeAttribute('aria-busy');
        }
        if (ctSubmitLabel) ctSubmitLabel.textContent = 'Send Inquiry';
        if (ctStatus) {
          ctStatus.className = 'form__status ct-form__status is-info';
          ctStatus.textContent = 'Your inquiry details passed validation. This static prototype is not yet connected to a backend form service, so no message was transmitted.';
        }
      }, 220);
    });
  }

  /* ---------- Newsletter (prototype state) ---------- */
  var nl = $('#newsletterForm');
  if (nl) {
    nl.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('#nlEmail');
      var out = $('#nlStatus');
      if (!input || !out) return;
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      out.textContent = ok
        ? 'Newsletter sign-up is not connected. No email was stored or subscription created.'
        : 'Please enter a valid email address.';
    });
  }

  /* ---------- Approach cursor-follow preview (services page) ----------
     One reusable floating image that trails the cursor across the four
     process rows. Enabled only for fine pointers without reduced motion. */
  var approachSection = $('.svc-approach');
  var approachList = $('#approachList');
  var cursorWrap = $('#approachCursor');
  if (approachSection && approachList && cursorWrap) {
    var finePointer = window.matchMedia('(pointer: fine)').matches;
    if (finePointer && !reduceMotion) {
      var cursorImg = $('#approachCursorImg');
      var approachItems = $$('.approach-item', approachList);
      var targetX = 0, targetY = 0, curX = 0, curY = 0;
      var cursorRaf = null;
      var cursorActive = false;
      var cursorSrc = '';
      var leaveTimer = null;

      // Preload all four previews so row switching is instant.
      approachItems.forEach(function (item) {
        var src = item.getAttribute('data-cursor-img');
        if (src) { var pre = new Image(); pre.src = src; }
      });

      cursorWrap.classList.add('is-enabled');

      // Clamp the preview center so the image always stays fully inside the
      // visible intersection of the section and the viewport (no clipping).
      function clampCursorPoint(x, y, rect) {
        var halfW = cursorWrap.offsetWidth / 2 || 160;
        var halfH = cursorWrap.offsetHeight / 2 || 107;
        var minX = halfW + Math.max(0, -rect.left);
        var maxX = Math.min(rect.width, window.innerWidth - rect.left) - halfW;
        var minY = halfH + Math.max(0, -rect.top);
        var maxY = Math.min(rect.height, window.innerHeight - rect.top) - halfH;
        if (maxX < minX) { x = (minX + maxX) / 2; } else { x = Math.min(Math.max(x, minX), maxX); }
        if (maxY < minY) { y = (minY + maxY) / 2; } else { y = Math.min(Math.max(y, minY), maxY); }
        return { x: x, y: y };
      }

      function cursorTick() {
        // Subtle interpolation: the preview trails the cursor with a fluid feel.
        curX += (targetX - curX) * 0.14;
        curY += (targetY - curY) * 0.14;
        cursorWrap.style.transform = 'translate3d(' + curX + 'px,' + curY + 'px,0)';
        if (cursorActive || Math.abs(targetX - curX) > 0.5 || Math.abs(targetY - curY) > 0.5) {
          cursorRaf = requestAnimationFrame(cursorTick);
        } else {
          cursorRaf = null;
        }
      }

      function startCursorRaf() {
        if (!cursorRaf) cursorRaf = requestAnimationFrame(cursorTick);
      }

      function setCursorTarget(e) {
        var rect = approachSection.getBoundingClientRect();
        var p = clampCursorPoint(e.clientX - rect.left, e.clientY - rect.top, rect);
        targetX = p.x;
        targetY = p.y;
        startCursorRaf();
      }

      approachList.addEventListener('mousemove', setCursorTarget);

      approachItems.forEach(function (item) {
        item.addEventListener('mouseenter', function (e) {
          var src = item.getAttribute('data-cursor-img');
          if (!src) return;
          if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
          if (src !== cursorSrc) {
            cursorSrc = src;
            cursorImg.src = src;
          }
          // Snap to the entry point so the preview never flies in from a corner.
          var rect = approachSection.getBoundingClientRect();
          var p = clampCursorPoint(e.clientX - rect.left, e.clientY - rect.top, rect);
          curX = targetX = p.x;
          curY = targetY = p.y;
          cursorWrap.style.transform = 'translate3d(' + curX + 'px,' + curY + 'px,0)';
          cursorActive = true;
          cursorWrap.classList.remove('is-leaving');
          cursorWrap.classList.add('is-visible');
          approachSection.classList.add('has-cursor');
          startCursorRaf();
        });
      });

      approachList.addEventListener('mouseleave', function () {
        cursorActive = false;
        cursorWrap.classList.remove('is-visible');
        cursorWrap.classList.add('is-leaving');
        approachSection.classList.remove('has-cursor');
        leaveTimer = setTimeout(function () {
          cursorWrap.classList.remove('is-leaving');
          leaveTimer = null;
        }, 220);
      });
    }
  }

  /* ---------- Image fallbacks (work page) ----------
     Full-size project images swap once to a known-good size if they fail. */
  $$('img[data-fallback]').forEach(function (im) {
    var fb = im.getAttribute('data-fallback');
    var swap = function () {
      if (!fb || im.getAttribute('data-fallback-used')) return;
      im.setAttribute('data-fallback-used', 'true');
      im.src = fb;
    };
    im.addEventListener('error', swap);
    // The error may already have fired before this script ran.
    if (im.complete && im.naturalWidth === 0 && im.getAttribute('src')) swap();
  });

  /* ---------- Portfolio filters (work page) ----------
     Cards carry data-cat tokens. Visible cards are re-slotted into the
     editorial row pattern (7/5, full, 5/7, full) so no gaps appear. */
  var filterGroup = $('#workFilters');
  var workGrid = $('#workGrid');
  if (filterGroup && workGrid) {
    var filterBtns = $$('.filter-btn', filterGroup);
    var workCards = $$('.work-card', workGrid);
    var countEl = $('#workCount');
    var emptyEl = $('#workEmpty');
    var SLOT_COUNT = 6;

    var applyFilter = function (key, animate) {
      var visible = [];
      workCards.forEach(function (card) {
        var cats = (card.getAttribute('data-cat') || '').split(/\s+/);
        var match = key === 'all' || cats.indexOf(key) !== -1;
        card.hidden = !match; // display:none → removed from tab order too
        if (match) visible.push(card);
      });

      visible.forEach(function (card, i) {
        var slot = i % SLOT_COUNT;
        card.setAttribute('data-slot', String(slot));
        // A first-of-pair card with no partner takes the full row.
        var alone = i === visible.length - 1 && (slot === 0 || slot === 3);
        if (alone) card.setAttribute('data-solo', 'true'); else card.removeAttribute('data-solo');
        card.classList.add('is-visible');
        if (animate && !reduceMotion) {
          card.style.setProperty('--i', String(i));
          card.classList.remove('is-entering');
          void card.offsetWidth; // restart animation
          card.classList.add('is-entering');
        }
      });

      var activeBtn = null;
      filterBtns.forEach(function (b) {
        var on = b.getAttribute('data-filter') === key;
        if (on) activeBtn = b;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      var n = visible.length;
      if (countEl) {
        countEl.textContent = 'Showing ' + n + ' project' + (n === 1 ? '' : 's') +
          (key !== 'all' && activeBtn ? ' — ' + activeBtn.textContent.trim() : '');
      }
      if (emptyEl) emptyEl.hidden = n !== 0;
    };

    workCards.forEach(function (card) {
      card.addEventListener('animationend', function () { card.classList.remove('is-entering'); });
    });

    filterGroup.addEventListener('click', function (e) {
      var btn = e.target.closest ? e.target.closest('.filter-btn') : null;
      if (!btn) return;
      applyFilter(btn.getAttribute('data-filter'), true);
      // Keep the chosen label visible when the bar scrolls horizontally (mobile).
      if (btn.scrollIntoView && filterGroup.scrollWidth > filterGroup.clientWidth) {
        btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });

    applyFilter('all', false);
  }

  /* ---------- Journal collections (insights page only) ---------- */
  var journalFilters = $('#journalFilters');
  var journalGrid = $('#journalGrid');
  var journalList = $('#journalList');
  if (journalFilters && journalGrid && journalList) {
    // Article metadata comes from the linked Get Lagos Now posts. Spotlights
    // above the filters are editorial features and remain visible for all topics.
    var journalArticles = [
      { id: 'brand-voice', placement: 'latest', title: 'What’s the best way to develop your brand voice', categories: ['branding'], label: 'Branding', date: '2024-02-20', author: 'Michelle Lagos', excerpt: 'Discover how a clear, consistent brand voice helps organizations communicate their personality and connect with the right audience.', image: 'https://getlagosnow.com/wp-content/uploads/2021/07/social-media-1024x768.jpg', alt: 'Visual published with the article about brand voice', url: 'https://getlagosnow.com/2024/02/20/whats-the-best-way-to-develop-your-brand-voice/' },
      { id: 'multilingual', placement: 'latest', title: 'The Benefits of Multilingual Websites', categories: ['web-design', 'accessibility'], label: 'Web Design / Accessibility', date: '2024-12-16', author: 'Michelle Lagos', excerpt: 'Explore how multilingual experiences can help organizations communicate with more audiences and strengthen digital inclusion.', image: 'https://getlagosnow.com/wp-content/uploads/2024/12/Online-1024x690.png', alt: 'Digital communication artwork published with the multilingual websites article', url: 'https://getlagosnow.com/2024/12/16/the-benefits-of-multi-lingual-websites/' },
      { id: 'ad-metrics', placement: 'latest', title: 'Demystifying Digital Ad Metrics: Measuring Success in Meta and Google Ads', categories: ['marketing'], label: 'Marketing', date: '2023-04-10', excerpt: 'A practical introduction to the measurements and platforms behind effective digital advertising.', image: 'https://getlagosnow.com/wp-content/uploads/2021/01/Online-Advertising-scaled-1-1024x630.jpg', alt: 'Digital advertising photograph published in the Meta and Google Ads article', url: 'https://getlagosnow.com/2023/04/10/demystifying-digital-ad-metrics-measuring-success-in-meta-and-google-ads/' },
      { id: 'timeless', placement: 'latest', title: 'Timeless Marketing Practices in 2024 and Beyond…', categories: ['marketing'], label: 'Marketing', date: '2024-02-20', author: 'Michelle Lagos', excerpt: 'Explore enduring marketing principles, from customer experience to thoughtful multi-channel communication.', image: 'https://getlagosnow.com/wp-content/uploads/2024/02/Fav-PDX-waterfront-reflection-pic-777x1024.jpg', alt: 'Portland waterfront photograph published with the marketing practices article', url: 'https://getlagosnow.com/2024/02/20/timeless-marketing-practices-in-2024-and-beyond/' },
      { id: 'seo-found', placement: 'more', title: 'Let’s Talk SEO and BE FOUND', categories: ['seo-ai'], label: 'SEO & AI', date: '2019-03-05', author: 'Michelle Lagos', excerpt: 'A 2019 perspective on search visibility and usability.', image: 'https://getlagosnow.com/wp-content/uploads/2019/03/WEB_GLSEO-1024x171.png', alt: 'Get Lagos Now SEO article graphic', url: 'https://getlagosnow.com/2019/03/05/lets-talk-seo-and-be-found/' },
      { id: 'ad-tips', placement: 'more', title: 'Successful Digital Advertising Tips in 2025', categories: ['marketing'], label: 'Marketing', date: '2024-12-16', author: 'Michelle Lagos', excerpt: 'Published guidance for digital advertising in 2025.', image: 'https://getlagosnow.com/wp-content/uploads/2024/04/Fav-PDX-waterfront-reflection-pic-777x1024.jpg', alt: 'Portland photograph published with the advertising tips article', url: 'https://getlagosnow.com/2024/12/16/successful-digital-advertising-tips-in-2025/' },
      { id: 'thought-leadership', placement: 'more', title: 'What is Thought Leadership?!', categories: ['marketing', 'branding'], label: 'Marketing / Branding', date: '2024-02-20', author: 'Michelle Lagos', excerpt: 'Sharing expertise and building trust through ideas.', image: 'https://getlagosnow.com/wp-content/uploads/2022/04/unsplashight-bulb-819x1024.jpg', alt: 'Light bulb image published with the thought leadership article', url: 'https://getlagosnow.com/2024/02/20/what-is-thought-leadership/' },
      { id: 'ad-guide', placement: 'more', title: 'Launch Your Digital Advertising: A Comprehensive Guide to Setting Up Meta and Google Ads Accounts', categories: ['marketing'], label: 'Marketing', date: '2023-04-24', author: 'Scott Smith & Michelle Lagos', excerpt: 'A 2023 account setup guide.', image: 'https://getlagosnow.com/wp-content/uploads/2023/04/Google_Ads_hero-1024x512.jpg', alt: 'Google Ads image from the account setup guide', url: 'https://getlagosnow.com/2023/04/24/launch-your-digital-advertising-a-comprehensive-guide-to-setting-up-meta-and-google-ads-accounts/' },
      { id: 'aeo-questions', placement: 'more', title: '10 AEO Questions I Should Be Asking?', categories: ['seo-ai'], label: 'SEO & AI', date: '2026-01-23', excerpt: 'Questions to consider as AI-powered search changes discovery.', image: 'https://getlagosnow.com/wp-content/uploads/2026/01/robot-and-key-300x193.png', alt: 'Robot and key graphic published with the AEO article', url: 'https://getlagosnow.com/2026/01/23/10-aeo-questions-i-should-be-asking/' },
      { id: 'ada-now', placement: 'more', title: 'How Important are ADA Compliant Websites now?', categories: ['accessibility'], label: 'Accessibility', date: '2026-01-26', excerpt: 'A later perspective on digital accessibility.', image: 'https://getlagosnow.com/wp-content/uploads/2024/12/accessibility-audit-1.png', alt: 'Accessibility audit illustration published with the article', url: 'https://getlagosnow.com/2026/01/26/how-important-are-ada-compliant-websites-now/' }
    ];
    var journalButtons = $$('button[data-topic]', journalFilters);
    var journalCount = $('#journalCount');
    var journalLoad = $('#journalLoad');
    var latestSection = $('.journal-latest');
    var moreSection = $('.journal-more');
    var currentTopic = 'all';
    var visibleMore = 3;

    function node(tag, cls, text) {
      var el = document.createElement(tag);
      if (cls) el.className = cls;
      if (text) el.textContent = text;
      return el;
    }
    function arrow(cls) {
      var box = node('span', cls);
      box.setAttribute('aria-hidden', 'true');
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 16 16');
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M4.5 11.5l7-7M5.5 4.5h6v6');
      svg.appendChild(path);
      box.appendChild(svg);
      return box;
    }
    function articleLink(item, text) {
      var link = node('a', '', text);
      link.href = item.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', text + ' (opens in a new tab)');
      return link;
    }
    function dateNode(item) {
      var label = new Date(item.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
      var time = node('time', '', label);
      time.dateTime = item.date;
      return time;
    }
    function journalCard(item) {
      var article = node('article', 'journal-card');
      article.dataset.articleId = item.id;
      var media = articleLink(item, '');
      media.className = 'journal-card__image';
      media.setAttribute('aria-label', 'Read ' + item.title + ' (opens in a new tab)');
      var image = document.createElement('img');
      image.src = item.image;
      image.alt = item.alt;
      image.width = 1024;
      image.height = 683;
      image.loading = 'lazy';
      image.decoding = 'async';
      media.appendChild(image);
      var meta = node('div', 'journal-card__meta');
      meta.appendChild(node('span', '', item.label));
      meta.appendChild(dateNode(item));
      var title = node('h3', 'journal-card__title');
      title.appendChild(articleLink(item, item.title));
      title.appendChild(arrow('journal-card__arrow'));
      article.appendChild(media);
      article.appendChild(meta);
      article.appendChild(title);
      article.appendChild(node('p', 'journal-card__excerpt', item.excerpt));
      return article;
    }
    function journalRow(item) {
      var article = node('article', 'journal-row');
      article.dataset.articleId = item.id;
      var meta = node('div', 'journal-row__meta');
      meta.appendChild(dateNode(item));
      meta.appendChild(node('span', '', item.label));
      var title = node('h3');
      title.appendChild(articleLink(item, item.title));
      article.appendChild(meta);
      article.appendChild(title);
      article.appendChild(arrow('journal-row__arrow'));
      return article;
    }
    function renderJournal() {
      var matches = journalArticles.filter(function (item) { return currentTopic === 'all' || item.categories.indexOf(currentTopic) !== -1; });
      var latest = matches.filter(function (item) { return item.placement === 'latest'; });
      var more = matches.filter(function (item) { return item.placement === 'more'; });
      journalGrid.replaceChildren();
      journalList.replaceChildren();
      journalGrid.classList.toggle('journal-grid--single', latest.length === 1);
      latest.forEach(function (item) { journalGrid.appendChild(journalCard(item)); });
      more.slice(0, visibleMore).forEach(function (item) { journalList.appendChild(journalRow(item)); });
      latestSection.hidden = !latest.length;
      moreSection.hidden = !more.length;
      journalLoad.hidden = more.length <= visibleMore;
      var shown = latest.length + Math.min(visibleMore, more.length);
      var chosen = journalButtons.filter(function (button) { return button.dataset.topic === currentTopic; })[0];
      journalCount.textContent = 'Showing ' + shown + ' of ' + matches.length + ' articles' + (currentTopic === 'all' ? '' : ' in ' + chosen.textContent.trim()) + '. Featured stories above remain available for every topic.';
    }
    journalFilters.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-topic]');
      if (!button || !journalFilters.contains(button)) return;
      currentTopic = button.dataset.topic;
      visibleMore = 3;
      journalButtons.forEach(function (entry) { entry.setAttribute('aria-pressed', entry === button ? 'true' : 'false'); });
      renderJournal();
    });
    journalLoad.addEventListener('click', function () {
      visibleMore += 3;
      renderJournal();
    });
    renderJournal();
  }

  /* ---------- Service index active state (services page) ---------- */
  var serviceIndexLinks = $$('.service-index a');
  if (serviceIndexLinks.length && 'IntersectionObserver' in window) {
    var serviceSections = serviceIndexLinks
      .map(function (a) { return document.getElementById(getHashId(a.getAttribute('href'))); })
      .filter(Boolean);
    if (serviceSections.length) {
      var svcObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.id;
          serviceIndexLinks.forEach(function (a) {
            var active = getHashId(a.getAttribute('href')) === id;
            a.classList.toggle('is-active', active);
          });
        });
      }, { rootMargin: '-40% 0px -45% 0px' });
      serviceSections.forEach(function (s) { svcObserver.observe(s); });
    }
  }
})();

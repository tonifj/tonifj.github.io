/* Toni Ferrari Juan, portfolio. Vanilla JS, no dependencies. */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- Theme ---------- */
  var themeBtn = $('#theme-toggle');
  var themeMeta = $('meta[name="theme-color"]');
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    if (themeMeta) themeMeta.setAttribute('content', t === 'light' ? '#f6f7fb' : '#0a0b10');
    themeBtn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    document.dispatchEvent(new CustomEvent('themechange'));
  }
  applyTheme(root.getAttribute('data-theme') || 'dark');
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Nav: mobile menu, scrolled state, scrollspy, progress ---------- */
  var nav = $('#nav');
  var burger = $('#burger');
  var progress = $('.progress');
  var links = $$('.nav-links a');

  function setMenu(open) {
    nav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  burger.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
  links.forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      nav.classList.toggle('scrolled', y > 8);
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['about', 'skills', 'projects', 'contact'].forEach(function (id) { var el = document.getElementById(id); if (el) spy.observe(el); });

  /* ---------- Typed role ---------- */
  var typedEl = $('#typed');
  var roles = ['Game programmer', 'C++ developer', 'Graphics & engine enthusiast', 'Unity developer'];
  if (typedEl && !reduceMotion) {
    var ri = 0, ci = 0, deleting = false;
    (function tick() {
      var word = roles[ri];
      ci += deleting ? -1 : 1;
      typedEl.textContent = word.slice(0, ci);
      var delay = deleting ? 35 : 75;
      if (!deleting && ci === word.length) { deleting = true; delay = 1600; }
      else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; delay = 350; }
      setTimeout(tick, delay);
    })();
  }

  /* ---------- Scroll reveal ---------- */
  $$('.card').forEach(function (c, i) { c.classList.add('reveal'); c.style.setProperty('--i', i % 3); });
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(function (el) { revealIO.observe(el); });

  /* ---------- Cursor spotlight on surfaces ---------- */
  if (finePointer) {
    document.addEventListener('pointermove', function (e) {
      var t = e.target.closest && e.target.closest('.spot');
      if (!t) return;
      var r = t.getBoundingClientRect();
      t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      t.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ---------- 3D tilt ---------- */
  if (finePointer && !reduceMotion) {
    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 12) + 'deg)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Hero particle network ---------- */
  (function particles() {
    var canvas = $('#bg');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var hero = canvas.parentElement;
    var w = 0, h = 0, dpr = 1, pts = [], visible = true, raf = 0;
    var mouse = { x: -9999, y: -9999 };
    var rgb = { a: [139, 124, 255], b: [45, 212, 255] };

    function hexToRgb(v, fallback) {
      v = (v || '').trim();
      var m = /^#([0-9a-f]{6})$/i.exec(v);
      return m ? [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)] : fallback;
    }
    function readColors() {
      var cs = getComputedStyle(root);
      rgb.a = hexToRgb(cs.getPropertyValue('--accent'), rgb.a);
      rgb.b = hexToRgb(cs.getPropertyValue('--accent-2'), rgb.b);
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(110, Math.round((w * h) / 15000));
      pts = [];
      for (var i = 0; i < n; i++) {
        pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.6 + .8 });
      }
      readColors();
      if (reduceMotion) draw();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var link = 125, mlink = 170, i, j, p, q, dx, dy, d, a;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        if (!reduceMotion) {
          dx = p.x - mouse.x; dy = p.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
          if (d < 140 && d > 0) { p.x += (dx / d) * 1.4; p.y += (dy / d) * 1.4; }
          p.x += p.vx; p.y += p.vy;
          if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
        }
        ctx.fillStyle = 'rgba(' + rgb.b[0] + ',' + rgb.b[1] + ',' + rgb.b[2] + ',.7)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832); ctx.fill();

        for (j = i + 1; j < pts.length; j++) {
          q = pts[j]; dx = p.x - q.x; dy = p.y - q.y; d = dx * dx + dy * dy;
          if (d < link * link) {
            a = (1 - Math.sqrt(d) / link) * .35;
            ctx.strokeStyle = 'rgba(' + rgb.a[0] + ',' + rgb.a[1] + ',' + rgb.a[2] + ',' + a + ')';
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
        dx = p.x - mouse.x; dy = p.y - mouse.y; d = Math.sqrt(dx * dx + dy * dy);
        if (d < mlink) {
          a = (1 - d / mlink) * .7;
          ctx.strokeStyle = 'rgba(' + rgb.b[0] + ',' + rgb.b[1] + ',' + rgb.b[2] + ',' + a + ')';
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }
    }

    function loop() { if (visible) draw(); raf = requestAnimationFrame(loop); }

    hero.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(hero);
    document.addEventListener('themechange', readColors);

    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(resize, 150); });
    resize();
    if (!reduceMotion) loop();
  })();

  /* ---------- Project videos: load + play only while visible ---------- */
  var videos = $$('video[data-src]');
  function ensureSrc(v) { if (!v.getAttribute('src')) { v.src = v.dataset.src; } }
  if (!reduceMotion) {
    var vidIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) { ensureSrc(v); var p = v.play(); if (p && p.catch) p.catch(function () {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.5 });
    videos.forEach(function (v) { vidIO.observe(v); });
  }

  /* ---------- Project filters ---------- */
  var cards = $$('.card');
  var chips = $$('.chip-btn');
  var countEl = $('#filter-count');
  function updateCount(n) { countEl.textContent = n + (n === 1 ? ' project' : ' projects'); }
  updateCount(cards.length);

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.dataset.filter, shown = 0;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      cards.forEach(function (card) {
        var match = f === 'all' || card.dataset.tags.split(' ').indexOf(f) !== -1;
        card.hidden = !match;
        card.classList.remove('pop');
        if (match) {
          shown++;
          card.classList.add('in'); // make sure it's visible even if never scrolled to
          void card.offsetWidth;
          if (!reduceMotion) card.classList.add('pop');
        }
      });
      updateCount(shown);
    });
  });

  /* ---------- Details modal ---------- */
  var modal = $('#modal');
  var mMedia = $('#modal-media'), mTitle = $('#modal-title'), mTags = $('#modal-tags');
  var mDesc = $('#modal-desc'), mContrib = $('#modal-contrib'), mActions = $('#modal-actions');
  var lastTrigger = null;

  function openModal(card, trigger) {
    var media = $('.card-media', card).firstElementChild.cloneNode(true);
    mMedia.textContent = '';
    if (media.tagName === 'VIDEO') {
      media.src = media.dataset.src; media.removeAttribute('data-src');
      media.controls = true; media.autoplay = !reduceMotion; media.muted = true; media.loop = true; media.playsInline = true;
      media.preload = 'metadata';
    }
    mMedia.appendChild(media);

    mTitle.textContent = $('h3', card).textContent;
    mTags.innerHTML = $('.tags', card).innerHTML;
    mDesc.textContent = $('.desc', card).textContent;

    var contrib = $('.contrib', card);
    mContrib.innerHTML = contrib ? contrib.outerHTML : '';

    mActions.textContent = '';
    $$('.card-actions a', card).forEach(function (a) { mActions.appendChild(a.cloneNode(true)); });

    lastTrigger = trigger;
    modal.showModal();
  }
  function closeModal() { modal.close(); }

  cards.forEach(function (card) {
    var btn = $('[data-open]', card);
    if (btn) btn.addEventListener('click', function () { openModal(card, btn); });
    // clicking the media also opens details
    $('.card-media', card).addEventListener('click', function () { openModal(card, btn); });
    $('.card-media', card).style.cursor = 'pointer';
  });
  modal.addEventListener('click', function (e) {
    if (e.target === modal || e.target.closest('[data-close]')) closeModal(); // backdrop or X
  });
  modal.addEventListener('close', function () {
    mMedia.textContent = ''; // stops the cloned video
    if (lastTrigger) lastTrigger.focus();
  });

  /* ---------- Copy email ---------- */
  var toast = $('#toast'), toastT;
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('show'); }, 2200);
  }
  var copyBtn = $('#copy-email');
  if (copyBtn) copyBtn.addEventListener('click', function () {
    var email = copyBtn.dataset.email;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(function () { showToast('Email copied to clipboard'); }, function () { showToast(email); });
    } else { showToast(email); }
  });

  /* ---------- Footer year ---------- */
  var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
})();

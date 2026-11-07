/* KCAMEL Production — page interactions + planet placeholders */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ==========================================================
     PLANETS
     Drop your own images into assets/planets/ using these names:
       hero.png  about.png  film.png  music.png  commercial.png
       experience.png  contact.png
     (transparent PNG or WebP works best). Until a file exists,
     a planet is painted here so the page never looks empty.
     ========================================================== */
  var PLANETS = {
    hero:       { type: 'gas',   seed: 3,  bands: 7,  pal: ['#2b1a0e', '#7a4a22', '#c98a44', '#efd2a0', '#9a5b2e'], atm: '#ffb860', rings: true },
    about:      { type: 'ocean', seed: 21, pal: ['#06223f', '#0f4c7a', '#2f7d4f', '#9c8a5a'], atm: '#7fc4ff' },
    film:       { type: 'rocky', seed: 7,  pal: ['#250c08', '#6b2614', '#b5512a', '#e09363'], atm: '#ff7b4e' },
    music:      { type: 'gas',   seed: 11, bands: 10, pal: ['#081f2e', '#164e66', '#3f9bb5', '#bfe8f2'], atm: '#8ad8ff' },
    commercial: { type: 'gas',   seed: 5,  bands: 6,  pal: ['#4a3a1e', '#a88a52', '#ecdcb4', '#7c6638'], atm: '#ffe2a8', rings: true },
    experience: { type: 'rocky', seed: 31, pal: ['#141414', '#3d3a36', '#8a847a', '#c8c2b6'], atm: '#c9d4ff' },
    contact:    { type: 'gas',   seed: 13, bands: 8,  pal: ['#2c0f22', '#6e2846', '#c4687e', '#f2c4c0'], atm: '#ff9db4' },
    md:         { type: 'gas',   seed: 41, bands: 7,  pal: ['#3a1e06', '#a8620e', '#e8a020', '#ffe0a0'], atm: '#ffc060', rings: true },
    audio:      { type: 'gas',   seed: 43, bands: 11, pal: ['#081f2e', '#164e66', '#3f9bb5', '#bfe8f2'], atm: '#8ad8ff' },
    visual:     { type: 'rocky', seed: 47, pal: ['#250c08', '#6b2614', '#b5512a', '#e09363'], atm: '#ff7b4e' }
  };

  function hash(x, y, s) { var h = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return h - Math.floor(h); }
  function vnoise(x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y, s) { var t = 0, a = 0.5, f = 1; for (var i = 0; i < 5; i++) { t += a * vnoise(x * f, y * f, s + i * 17); f *= 2; a *= 0.5; } return t; }
  function hex(h) { var n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function ramp(pal, t) {
    t = clamp(t, 0, 0.9999) * (pal.length - 1);
    var i = Math.floor(t), f = t - i, a = pal[i], b = pal[i + 1];
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }

  var cache = {};
  function paintPlanet(key) {
    if (cache[key]) return cache[key];
    var cfg = PLANETS[key] || PLANETS.hero;
    var pal = cfg.pal.map(hex), atm = hex(cfg.atm);
    var SIZE = 400, pr = cfg.rings ? 112 : 180, cx = SIZE / 2, cy = SIZE / 2;
    var cv = document.createElement('canvas'); cv.width = cv.height = SIZE;
    var g = cv.getContext('2d');
    var tilt = -0.38;

    function ring(front) {
      if (!cfg.rings) return;
      g.save();
      g.translate(cx, cy); g.rotate(tilt);
      g.beginPath();
      if (front) g.rect(-SIZE, 0, SIZE * 2, SIZE); else g.rect(-SIZE, -SIZE, SIZE * 2, SIZE);
      g.clip();
      for (var r = pr * 1.18; r < pr * 1.66; r += 1) {
        var k = (r - pr * 1.18) / (pr * 0.48);
        var dens = 0.25 + 0.75 * vnoise(k * 18, 0.5, cfg.seed) * (k > 0.55 && k < 0.6 ? 0.1 : 1);
        var c = ramp(pal, 0.35 + k * 0.5);
        g.strokeStyle = 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (dens * 0.55 * (1 - k * 0.4)).toFixed(3) + ')';
        g.lineWidth = 1.4;
        g.beginPath(); g.ellipse(0, 0, r, r * 0.26, 0, 0, Math.PI * 2); g.stroke();
      }
      g.restore();
    }

    ring(false);

    var img = g.createImageData(SIZE, SIZE), d = img.data;
    var L = [-0.62, -0.45, 0.64], ll = Math.hypot(L[0], L[1], L[2]); L = [L[0] / ll, L[1] / ll, L[2] / ll];
    var bands = cfg.bands || 8, s = cfg.seed;
    var pad = pr + 14;
    for (var y = Math.floor(cy - pad); y < cy + pad; y++) {
      for (var x = Math.floor(cx - pad); x < cx + pad; x++) {
        var nx = (x - cx) / pr, ny = (y - cy) / pr, rr = nx * nx + ny * ny;
        var idx = (y * SIZE + x) * 4;
        if (rr > 1.12) continue;
        var col, a;
        if (rr <= 1) {
          var nz = Math.sqrt(1 - rr);
          var lat = Math.asin(ny), lon = Math.atan2(nx, nz);
          if (cfg.type === 'gas') {
            var warp = fbm(lon * 2.2, lat * 5, s) * 1.6;
            var v = Math.sin((lat * bands + warp) * 1.7) * 0.5 + 0.5;
            col = ramp(pal, v * 0.8 + fbm(lon * 6, lat * 14, s + 3) * 0.25);
          } else if (cfg.type === 'rocky') {
            var h = fbm(lon * 2.6 + 3, lat * 2.6, s);
            var cr = fbm(lon * 9, lat * 9, s + 9);
            col = ramp(pal, h * 1.15 - (cr > 0.62 ? 0.18 : 0));
          } else {
            var land = fbm(lon * 2.2, lat * 2.4, s);
            col = land > 0.52 ? ramp(pal.slice(2), (land - 0.52) * 4) : ramp(pal.slice(0, 2), land * 1.6);
            var cl = fbm(lon * 3 + 7, lat * 6, s + 5);
            if (cl > 0.55) { var ca = Math.min(1, (cl - 0.55) * 4); col = [col[0] + (240 - col[0]) * ca, col[1] + (244 - col[1]) * ca, col[2] + (250 - col[2]) * ca]; }
          }
          var dif = nx * L[0] + ny * L[1] + nz * L[2];
          var lit = Math.pow(clamp(dif * 0.9 + 0.12, 0, 1), 0.85);
          var rim = Math.pow(1 - nz, 3) * (0.35 + Math.max(0, dif) * 0.9);
          col = [col[0] * (0.03 + lit) + atm[0] * rim, col[1] * (0.03 + lit) + atm[1] * rim, col[2] * (0.03 + lit) + atm[2] * rim];
          a = clamp((1 - Math.sqrt(rr)) * pr, 0, 1) * 255;
        } else {
          // thin atmosphere halo on the lit side
          var rd = Math.sqrt(rr), fall = 1 - (rd - 1) / 0.12;
          var side = clamp(((nx / rd) * L[0] + (ny / rd) * L[1]) * 1.2 + 0.25, 0, 1);
          col = atm; a = Math.pow(fall, 2.2) * side * 150;
        }
        d[idx] = clamp(col[0], 0, 255); d[idx + 1] = clamp(col[1], 0, 255); d[idx + 2] = clamp(col[2], 0, 255); d[idx + 3] = a;
      }
    }
    var tmp = document.createElement('canvas'); tmp.width = tmp.height = SIZE;
    tmp.getContext('2d').putImageData(img, 0, 0);
    g.drawImage(tmp, 0, 0);
    ring(true);
    cache[key] = cv.toDataURL('image/png');
    return cache[key];
  }

  // paint one planet at a time in idle moments so the page never stalls
  var queue = [], busy = false;
  function pump() {
    if (!queue.length) { busy = false; return; }
    busy = true;
    var job = queue.shift();
    job.img.src = paintPlanet(job.key);
    if (job.cls) job.img.classList.add(job.cls);
    (window.requestIdleCallback || function (f) { return setTimeout(f, 30); })(pump);
  }
  function usePainted(img, key, extraClass) {
    if (img.dataset.painted) return;
    img.dataset.painted = '1';
    queue.push({ img: img, key: key, cls: extraClass });
    if (!busy) setTimeout(pump, 50);
  }
  function watch(img, key, extraClass) {
    var failed = function () { usePainted(img, key, extraClass); };
    if (img.complete && img.naturalWidth === 0) failed();
    else img.addEventListener('error', failed, { once: true });
  }
  $$('img[data-planet]').forEach(function (img) { watch(img, img.dataset.planet); });
  $$('img[data-planet-fallback]').forEach(function (img) { watch(img, img.dataset.planetFallback, 'is-planet'); });

  /* planets drift at different speeds as you scroll (parallax depth) */
  var drifters = $$('[data-speed]');
  function drift() {
    var vh = window.innerHeight;
    drifters.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      var off = (r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.speed);
      el.style.translate = '0 ' + off.toFixed(1) + 'px';
    });
  }
  if (!reduceMotion) { window.addEventListener('scroll', drift, { passive: true }); drift(); }

  /* ---------- WebGL fallback ---------- */
  setTimeout(function () { if (!document.documentElement.classList.contains('webgl-ready')) document.documentElement.classList.add('no-webgl'); }, 6000);

  /* ---------- cursor ---------- */
  var cur = $('#cursor');
  if (finePointer && cur) {
    var tx = -50, ty = -50, cx = -50, cy = -50;
    document.addEventListener('mousemove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() { cx += (tx - cx) * 0.25; cy += (ty - cy) * 0.25; cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)'; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover', function (e) { cur.classList.toggle('big', !!e.target.closest('a,button,.p-card,.skill,select')); });
  }

  /* ---------- header + menu ---------- */
  var header = $('#header');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 80); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  var ham = $('#hamburger'), mob = $('#mobMenu');
  function setMenu(open) { ham.classList.toggle('open', open); mob.classList.toggle('open', open); ham.setAttribute('aria-expanded', String(open)); document.body.style.overflow = open ? 'hidden' : ''; }
  ham.addEventListener('click', function () { setMenu(!mob.classList.contains('open')); });
  $$('.ml').forEach(function (l) { l.addEventListener('click', function () { setMenu(false); }); });

  /* ---------- reveal ---------- */
  var io = new IntersectionObserver(function (en) {
    en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  $$('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- counters ---------- */
  var cio = new IntersectionObserver(function (en) {
    en.forEach(function (e) {
      if (!e.isIntersecting) return; cio.unobserve(e.target);
      var el = e.target, to = parseFloat(el.dataset.count), dec = parseInt(el.dataset.decimals || '0', 10), suf = el.dataset.suffix || '';
      var st = performance.now(), dur = reduceMotion ? 1 : 1800;
      (function step(now) { var p = clamp((now - st) / dur, 0, 1), k = 1 - Math.pow(1 - p, 4); el.textContent = (to * k).toFixed(dec) + suf; if (p < 1) requestAnimationFrame(step); })(st);
    });
  }, { threshold: 0.5 });
  $$('[data-count]').forEach(function (el) { cio.observe(el); });

  /* ---------- portfolio: planets + filter bar share one filter ---------- */
  var cards = $$('.p-card');
  function applyFilter(cat, scroll) {
    $$('.fb').forEach(function (b) { b.classList.toggle('active', b.dataset.filter === cat); });
    $$('.orrery [data-filter]').forEach(function (b) { b.classList.toggle('is-active', b.dataset.filter === cat); });
    cards.forEach(function (c) {
      var show = cat === 'all' || c.dataset.cat === cat;
      c.classList.toggle('is-hidden', !show);
      c.classList.toggle('wide', cat === 'all' && c.dataset.wide === '1');
    });
    if (scroll) $('.filter-bar').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }
  cards.forEach(function (c) { if (c.classList.contains('wide')) c.dataset.wide = '1'; });
  $$('.fb').forEach(function (b) { b.addEventListener('click', function () { applyFilter(b.dataset.filter, false); }); });
  $$('.orrery [data-filter]').forEach(function (b) { b.addEventListener('click', function () { applyFilter(b.dataset.filter, true); }); });

  /* hover video on cards */
  cards.forEach(function (card) {
    var vid = card.querySelector('video'); if (!vid) return;
    card.addEventListener('mouseenter', function () { var p = vid.play(); if (p && p.catch) p.catch(function () {}); });
    card.addEventListener('mouseleave', function () { vid.pause(); vid.currentTime = 0; });
  });

  /* ---------- showreel: load YouTube only on click ---------- */
  var poster = $('#screenPoster');
  poster.addEventListener('click', function () {
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube.com/embed/videoseries?list=UULFf4rDcCCXX6xBkBaDOPtbw&autoplay=1&rel=0';
    f.title = 'KCAMEL showreel';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    poster.replaceWith(f);
  });

  /* ---------- contact form → email app ---------- */
  var form = $('#contactForm'), note = $('#formNote');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    $$('input,select,textarea', form).forEach(function (f) {
      var bad = !f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
      f.parentNode.classList.toggle('err', bad); if (bad) ok = false;
    });
    if (!ok) { note.textContent = 'Please fill in every field so we can get back to you.'; return; }
    var d = new FormData(form);
    var subject = 'Project enquiry — ' + d.get('type') + ' — ' + d.get('name');
    var body = d.get('message') + '\n\n—\n' + d.get('name') + '\n' + d.get('email');
    window.location.href = 'mailto:kcamelstudios@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    note.textContent = 'Your email app should open now. If it doesn’t, write to kcamelstudios@gmail.com.';
  });
  $$('input,select,textarea', form).forEach(function (f) { f.addEventListener('input', function () { f.parentNode.classList.remove('err'); }); });

  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
})();

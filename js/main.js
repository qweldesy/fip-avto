/* ФиП Авто — main.js
   Motion (motion.dev, self-hosted) для reveal-анимаций;
   всё остальное — vanilla JS без зависимостей. */
(function () {
  'use strict';

  /* ---------- телефон: цифры и дефисы — ячейки одной ширины ---------- */
  function phoneCells() {
    document.querySelectorAll('[data-phone]').forEach(function (el) {
      var src = el.getAttribute('data-phone');
      el.textContent = '';
      src.split('').forEach(function (c) {
        if (/[0-9-]/.test(c)) {
          var b = document.createElement('b');
          b.className = 'ch';
          b.textContent = c;
          el.appendChild(b);
        } else {
          el.appendChild(document.createTextNode(c));
        }
      });
    });
    /* ширина ячейки = реальный advance самой широкой цифры этого же шрифта,
       замеренный в DOM (canvas может выбрать другой шрифт и врать) */
    document.querySelectorAll('.phone, .m-phone').forEach(function (el) {
      var cells = Array.prototype.slice.call(el.querySelectorAll('.ch'));
      if (!cells.length) return;
      var max = 0;
      cells.forEach(function (b) {
        if (!/[0-9]/.test(b.textContent)) return; // меряем только цифры
        b.style.width = '';
        var r = document.createRange();
        r.selectNodeContents(b);
        max = Math.max(max, r.getBoundingClientRect().width);
      });
      if (!max) return;
      cells.forEach(function (b) { b.style.width = (Math.ceil(max * 100) / 100).toFixed(2) + 'px'; });
    });
  }
  phoneCells();

  /* ---------- шапка: фон при скролле ---------- */
  var header = document.getElementById('header');
  function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- мобильное меню ---------- */
  var burger = document.getElementById('burger');
  var panel = document.getElementById('mobile-panel');

  function setMenu(open) {
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    if (open) {
      panel.hidden = false;
      requestAnimationFrame(function () { panel.classList.add('open'); });
      document.body.style.overflow = 'hidden';
    } else {
      panel.classList.remove('open');
      panel.hidden = true;
      document.body.style.overflow = '';
    }
  }

  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  panel.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') setMenu(false);
  });
  window.matchMedia('(min-width: 1101px)').addEventListener('change', function (e) {
    if (e.matches) setMenu(false);
  });

  /* отладочный хук: ?openmenu=1 — сразу открыть мобильную панель (для скриншотов) */
  if (new URLSearchParams(location.search).get('openmenu') === '1') {
    window.addEventListener('load', function () {
      setMenu(true);
      panel.style.animation = 'none'; // чтобы headless-скриншот не поймал анимацию на середине
    });
  }

  /* отладочный хук: ?probe=1 — замеры ячеек телефона и выравнивания шапки в title */
  if (new URLSearchParams(location.search).get('probe') === '1') {
    window.addEventListener('load', function () {
      setTimeout(function () {
        var m = {};
        var desktop = getComputedStyle(document.querySelector('.header-actions')).display !== 'none';
        var phone = document.querySelector(desktop ? '.header-actions .phone' : '.m-phone');
        if (phone) {
          var cells = Array.prototype.map.call(phone.querySelectorAll('.ch'), function (b) {
            return +b.getBoundingClientRect().width.toFixed(2);
          });
          m.cells = cells;
          m.uniq = Array.from(new Set(cells));
          m.phone = phone.textContent;
        }
        if (desktop) {
          var c = function (el) { var r = el.getBoundingClientRect(); return +(r.top + r.height / 2).toFixed(1); };
          m.nav = c(document.querySelector('.nav a'));
          m.wa = c(document.querySelector('.header-actions .wa-btn'));
          m.cta = c(document.querySelector('.header-actions .cta-btn'));
          m.phoneY = c(phone);
        }
        document.title = 'PROBE ' + JSON.stringify(m);
      }, 300);
    });
  }

  /* отладочный хук: ?probe2=1 — элементы, вызывающие горизонтальное переполнение */
  if (new URLSearchParams(location.search).get('probe2') === '1') {
    window.addEventListener('load', function () {
      setTimeout(function () {
        var out = [];
        document.querySelectorAll('body *').forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.right > innerWidth + 1 && r.width < innerWidth * 3) {
            var cls = (typeof el.className === 'string' ? el.className : '').split(' ')[0];
            out.push(el.tagName + '.' + cls + '@' + Math.round(r.right) + '/w' + Math.round(r.width));
          }
        });
        document.title = 'OVERFLOW ' + innerWidth + ' [' + out.slice(0, 12).join('; ') + ']';
      }, 400);
    });
  }

  /* ---------- Motion: reveal + счётчики ---------- */
  var noReveal = new URLSearchParams(location.search).get('noreveal') === '1'; // dev-параметр для скриншотов
  if (window.Motion && window.Motion.inView && !noReveal) {
    document.documentElement.classList.add('has-motion');
    var M = window.Motion;

    var groups = [];
    M.inView('[data-reveal]', function (el) {
      var delay = 0;
      var parent = el.parentElement;
      if (parent && parent.dataset && parent.dataset.stagger !== 'off') {
        var siblings = Array.prototype.filter.call(parent.children, function (n) {
          return n.hasAttribute && n.hasAttribute('data-reveal');
        });
        var i = siblings.indexOf(el);
        if (i > 0) delay = Math.min(i * 70, 350);
      }
      M.animate(el, { opacity: [0, 1], y: [26, 0] }, { duration: 0.7, delay: delay, ease: [0.22, 1, 0.36, 1] });
    }, { margin: '0px 0px -70px 0px' });

    /* счётчики в хиро */
    var fmt = new Intl.NumberFormat('ru-RU');
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var decimals = parseInt(el.getAttribute('data-decimal') || '0', 10);
      M.inView(el, function () {
        try {
          M.animate(0, target, {
            duration: 1.1,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: function (v) { el.textContent = fmt.format(parseFloat(v.toFixed(decimals))); }
          });
        } catch (err) {
          el.textContent = fmt.format(target);
        }
      }, { amount: 0.6 });
    });

    /* страховка: если rAF/IO заморожены (троттлинг вкладки), показываем то,
       что уже в вьюпорте, — контент не должен остаться невидимым */
    setTimeout(function () {
      document.querySelectorAll('[data-reveal]').forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0 && parseFloat(getComputedStyle(el).opacity) < 0.05) {
          try {
            M.animate(el, { opacity: [0, 1], y: [26, 0] }, { duration: 0.5 });
          } catch (err) {
            el.style.opacity = '1';
            el.style.transform = 'none';
          }
          setTimeout(function () {
            if (parseFloat(getComputedStyle(el).opacity) < 0.05) {
              el.style.opacity = '1';
              el.style.transform = 'none';
            }
          }, 700);
        }
      });
    }, 2000);
  }

  /* ---------- glow-карточки (spotlight за курсором) ---------- */
  document.addEventListener('pointermove', function (e) {
    var card = e.target.closest ? e.target.closest('.glow-card') : null;
    if (!card) return;
    var r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }, { passive: true });

  /* ---------- прайс: поиск и показать все ---------- */
  var priceCard = document.querySelector('.price-card');
  var search = document.getElementById('price-search');
  var toggle = document.getElementById('price-toggle');
  var emptyMsg = document.querySelector('.price-empty');

  if (priceCard && toggle) {
    var rows = Array.prototype.slice.call(priceCard.querySelectorAll('.price-row:not(.price-head)'));
    var total = rows.length;

    priceCard.classList.add('collapsed');
    toggle.textContent = 'Показать все ' + total;
    toggle.setAttribute('aria-expanded', 'false');

    toggle.addEventListener('click', function () {
      var collapsed = priceCard.classList.toggle('collapsed');
      toggle.textContent = collapsed ? 'Показать все ' + total : 'Свернуть';
      toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    });

    search.addEventListener('input', function () {
      var q = (search.value || '').trim().toLowerCase();
      var visible = 0;
      priceCard.classList.toggle('searching', !!q);
      rows.forEach(function (row) {
        var text = row.querySelector('span').textContent.toLowerCase();
        var show = !q || text.indexOf(q) !== -1;
        row.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      if (!q) rows.forEach(function (row) { row.style.display = ''; });
      if (emptyMsg) emptyMsg.hidden = visible !== 0;
      toggle.disabled = !!q;
    });
  }
})();

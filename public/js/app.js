(function () {
  'use strict';

  /* ---------- rail drag scroll ---------- */
  document.querySelectorAll('[data-rail]').forEach(function (track) {
    var down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener('pointerdown', function (e) {
      down = true; moved = false;
      startX = e.clientX;
      startLeft = track.scrollLeft;
    });
    track.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startLeft - dx;
    });
    track.addEventListener('pointerup', function () { down = false; });
    track.addEventListener('pointerleave', function () { down = false; });
    track.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); }
    });
  });

  /* ---------- search box (header) ---------- */
  var input = document.getElementById('search-input');
  var drop = document.getElementById('search-drop');
  if (input && drop) {
    var timer = null;
    var idx = -1;
    var items = [];

    function renderDropdown(list) {
      items = list;
      idx = -1;
      drop.innerHTML = list.length
        ? list.map(function (it, i) {
            return '<a class="search-item" data-i="' + i + '" href="/anime/' + it.slug + '">' +
              (it.cover ? '<img src="' + it.cover + '" alt="">' : '') +
              '<span>' + it.title + '</span></a>';
          }).join('')
        : '<div class="search-empty">NO RESULT</div>';
    }

    function select(i) {
      var el = drop.querySelector('[data-i="' + i + '"]');
      if (el) window.location.href = el.getAttribute('href');
    }

    input.addEventListener('input', function () {
      clearTimeout(timer);
      var q = input.value.trim();
      if (q.length < 2) { drop.hidden = true; return; }
      drop.hidden = false;
      drop.innerHTML = '<div class="search-loading">SEARCHING…</div>';
      timer = setTimeout(function () {
        fetch('/api/search?q=' + encodeURIComponent(q))
          .then(function (r) { return r.json(); })
          .then(function (data) {
            renderDropdown((data && data.data && data.data.items) || []);
          })
          .catch(function () { drop.innerHTML = '<div class="search-empty">ERROR</div>'; });
      }, 300);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var q = input.value.trim();
        if (idx > -1) select(idx);
        else if (q.length >= 2) window.location.href = '/search?q=' + encodeURIComponent(q);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        if (drop.hidden || !items.length) return;
        e.preventDefault();
        idx = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
        drop.querySelectorAll('.search-item').forEach(function (el, i) {
          el.style.background = i === idx ? 'var(--color-panel-2)' : '';
        });
      } else if (e.key === 'Escape') {
        drop.hidden = true;
      }
    });

    document.addEventListener('click', function (e) {
      if (!input.contains(e.target) && !drop.contains(e.target)) drop.hidden = true;
    });
  }

  /* ---------- episode page filter ---------- */
  var epInput = document.querySelector('.ep-filter-input');
  if (epInput) {
    epInput.addEventListener('input', function () {
      var q = epInput.value.trim().toLowerCase();
      document.querySelectorAll('[data-episodes] .ep-item').forEach(function (el) {
        var hay = (el.getAttribute('data-title') || '') + ' ' + (el.getAttribute('data-slug') || '');
        el.style.display = hay.indexOf(q) === -1 ? 'none' : '';
      });
    });
  }

  /* ---------- video player ---------- */
  var player = document.querySelector('[data-player]');
  if (player) {
    var frame = player.querySelector('[data-frame]');
    var loading = player.querySelector('[data-loading]');
    var iframe = frame ? frame.querySelector('iframe') : null;
    var current = iframe ? iframe.src : '';

    function setSrc(url) {
      current = url;
      if (loading) loading.hidden = !url;
      if (frame && url) {
        var el = document.createElement('iframe');
        el.src = url;
        el.title = 'Stream';
        el.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
        el.setAttribute('allowfullscreen', '');
        frame.innerHTML = '';
        frame.appendChild(el);
      }
    }

    player.querySelectorAll('.server-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        player.querySelectorAll('.server-btn').forEach(function (b) {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        if (loading) loading.hidden = false;
        fetch('/api/stream-resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: btn.getAttribute('data-payload') }),
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data && data.success && data.data && data.data.src) setSrc(data.data.src);
            else if (loading) { loading.hidden = true; }
          })
          .catch(function () { if (loading) loading.hidden = true; });
      });
    });
  }

  /* ---------- search page inline box ---------- */
  var pageInput = document.getElementById('search-page');
  if (pageInput) {
    pageInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') window.location.href = '/search?q=' + encodeURIComponent(pageInput.value.trim());
    });
  }
})();
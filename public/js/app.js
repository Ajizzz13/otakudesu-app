(function () {
  'use strict';

  /* ---------- search box (header) ---------- */
  var input = document.getElementById('search-input');
  var drop = document.getElementById('search-drop');
  if (input && drop) {
    var timer = null;
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
            var items = (data && data.data && data.data.items) || [];
            if (!items.length) {
              drop.innerHTML = '<div class="search-empty">NO RESULT</div>';
              return;
            }
            drop.innerHTML = items.map(function (it) {
              return '<a class="search-item" href="/anime/' + it.slug + '">' +
                (it.cover ? '<img src="' + it.cover + '" alt="">' : '') +
                '<span>' + it.title + '</span></a>';
            }).join('');
          })
          .catch(function () { drop.innerHTML = '<div class="search-empty">ERROR</div>'; });
      }, 300);
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
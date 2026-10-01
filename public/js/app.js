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
    var groups = window.__groups || [];
    var statusEl = document.querySelector('[data-stream-status]');
    var serverSelect = document.getElementById('server-select-active');
    var pills = document.querySelectorAll('.quality-pills .pill-btn');

    var conn = navigator.connection || {};
    var isSlow = conn.saveData === true
      || conn.effectiveType === '3g'
      || conn.effectiveType === 'slow-2g'
      || (conn.downlink != null && conn.downlink < 1.2);

    var currentQuality = isSlow ? '360p' : '720p';

    function setStatus(text) {
      if (!statusEl) return;
      if (text) {
        statusEl.hidden = false;
        statusEl.textContent = text;
      } else {
        statusEl.hidden = true;
      }
    }

    function setFrameSrc(url) {
      if (!url) return;
      var cur = frame.querySelector('iframe');
      if (cur && cur.src === url) return;
      var el = document.createElement('iframe');
      el.src = url;
      el.title = 'Stream';
      el.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
      el.setAttribute('allowfullscreen', '');
      frame.innerHTML = '';
      frame.appendChild(el);
      if (loading) loading.hidden = true;
    }

    function updateServerDropdown(q) {
      if (!serverSelect) return;
      var grp = groups.find(function (g) { return g.quality === q; });
      serverSelect.innerHTML = '';
      if (!grp || !grp.options || !grp.options.length) {
        serverSelect.innerHTML = '<option value="">Server tidak tersedia</option>';
        return;
      }
      grp.options.forEach(function (opt) {
        var optEl = document.createElement('option');
        optEl.value = opt.payload;
        optEl.textContent = opt.server;
        serverSelect.appendChild(optEl);
      });
    }

    function switchStream(payload, label) {
      if (!payload) return;
      setStatus('MEMUAT ' + (label || '').toUpperCase() + '…');
      if (loading) loading.hidden = false;
      fetch('/api/stream-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: payload }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.success && data.data && data.data.src) {
            setFrameSrc(data.data.src);
            setStatus('');
          } else {
            setStatus('Server tidak merespons.');
            if (loading) loading.hidden = true;
          }
        })
        .catch(function () {
          setStatus('Gagal menghubungi server.');
          if (loading) loading.hidden = true;
        });
    }

    pills.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var q = btn.getAttribute('data-quality');
        if (!q) return;
        currentQuality = q;
        pills.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        updateServerDropdown(q);
        var firstPayload = serverSelect && serverSelect.value;
        if (firstPayload) {
          switchStream(firstPayload, q);
        }
      });
    });

    if (serverSelect) {
      serverSelect.addEventListener('change', function () {
        var payload = serverSelect.value;
        var optText = serverSelect.options[serverSelect.selectedIndex] ? serverSelect.options[serverSelect.selectedIndex].text : '';
        switchStream(payload, currentQuality + ' ' + optText);
      });
    }

    // Set initial quality pill & server dropdown
    var initialBtn = document.querySelector('.quality-pills .pill-btn[data-quality="' + currentQuality + '"]')
      || document.querySelector('.quality-pills .pill-btn');

    if (initialBtn) {
      pills.forEach(function (b) { b.classList.remove('active'); });
      initialBtn.classList.add('active');
      var q = initialBtn.getAttribute('data-quality') || '360p';
      updateServerDropdown(q);
      // Auto-switch to 720p on fast connection if available
      if (q !== '360p' && serverSelect && serverSelect.value) {
        switchStream(serverSelect.value, q);
      }
    }

    if (isSlow) {
      var note = document.createElement('p');
      note.className = 'quota';
      note.style.marginTop = '10px';
      note.innerHTML = '<span class="quota-label" style="color:var(--color-accent-text)">DATA SAVER</span>' +
        '<span class="quota-list"><span>360p otomatis · hemat ±60% kuota</span></span>';
      player.parentElement.appendChild(note);
    }

    (function compressFlow() {
      var box = document.querySelector('[data-compress-box]');
      if (!box) return;
      var btn = box.querySelector('[data-compress-btn]');
      var status = box.querySelector('[data-compress-status]');
      var slug = box.getAttribute('data-slug');
      if (!btn || !slug) return;

      function setStatus(text, tone) {
        status.hidden = false;
        status.textContent = text;
        status.setAttribute('data-tone', tone || 'info');
      }

      function pickQuality() {
        var sel = null;
        player.querySelectorAll('.server-select').forEach(function (s) {
          if (s.getAttribute('data-quality') === '360p' && !sel) sel = s;
        });
        if (!sel) {
          player.querySelectorAll('.server-select').forEach(function (s) { if (!sel) sel = s; });
        }
        var q = sel ? sel.getAttribute('data-quality') : '360p';
        return q || '360p';
      }

      function playUrl(url) {
        setStatus('SIAP · memuat versi hemat…', 'ok');
        playMedia(url);
      }

      function poll(quality, tries) {
        if (tries > 80) {
          setStatus('Gagal / timeout. Coba tombol lagi nanti.', 'err');
          btn.disabled = false;
          return;
        }
        fetch('/api/compress-status?slug=' + encodeURIComponent(slug) + '&quality=' + encodeURIComponent(quality))
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data && data.success && data.status === 'ready' && data.url) {
              var mb = data.size ? ' (' + (data.size / 1048576).toFixed(1) + 'MB)' : '';
              setStatus('SIAP' + mb + ' · memuat…', 'ok');
              playUrl(data.url);
              btn.disabled = false;
              return;
            }
            var remain = Math.max(0, 80 - tries);
            setStatus('SEDANG DIKOMPRES… (' + (tries * 15) + 's) · jangan tutup', 'info');
            setTimeout(function () { poll(quality, tries + 1); }, 15000);
          })
          .catch(function () {
            setTimeout(function () { poll(quality, tries + 1); }, 15000);
          });
      }

      btn.addEventListener('click', function () {
        var quality = pickQuality();
        btn.disabled = true;
        setStatus('Menghubungi server…', 'info');
        fetch('/api/ensure-compressed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: slug, quality: quality }),
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data && data.success && data.status === 'ready' && data.url) {
              var mb = data.size ? ' (' + (data.size / 1048576).toFixed(1) + 'MB)' : '';
              setStatus('SIAP' + mb + ' · memuat…', 'ok');
              playUrl(data.url);
              btn.disabled = false;
              return;
            }
            if (data && data.success && data.status === 'processing') {
              setStatus('SEDANG DIKOMPRES… (~3 menit) · jangan tutup', 'info');
              poll(quality, 1);
              return;
            }
            setStatus('Gagal: ' + ((data && data.error) || 'unknown'), 'err');
            btn.disabled = false;
          })
          .catch(function () {
            setStatus('Gagal menghubungi server.', 'err');
            btn.disabled = false;
          });
      });
    })();
  }

  /* ---------- search page inline box ---------- */
  var pageInput = document.getElementById('search-page');
  if (pageInput) {
    pageInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') window.location.href = '/search?q=' + encodeURIComponent(pageInput.value.trim());
    });
  }
})();
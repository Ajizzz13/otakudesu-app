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
    var current = '';

    function destroyArt() {
      if (window.__art) {
        try { window.__art.destroy(); } catch (e) {}
        window.__art = null;
      }
    }

    function initArt() {
      if (!window.Artplayer || !window.__streams || !window.__streams.length) {
        fallbackIframe(player.getAttribute('data-default') || '');
        return;
      }
      var streams = window.__streams;
      var pick = streams.filter(function (s) { return s.quality === '720p'; })[0]
        || streams[streams.length - 1]
        || streams[0];
      window.__art = new Artplayer({
        container: '#art-wrap',
        url: pick.url,
        quality: streams.map(function (s) {
          return { name: s.quality, html: s.quality, url: s.url };
        }),
        theme: '#b94a1e',
        autoSize: false,
        playbackRate: true,
        screenshot: true,
        setting: true,
        fullscreen: true,
        fullscreenWeb: true,
        mini: true,
        fastForward: true,
        lock: true,
        pip: true,
        airplay: true,
        lang: 'en',
      });
      window.__art.on('error', function () {
        fallbackIframe(player.getAttribute('data-default') || '');
      });
    }

    function fallbackIframe(url) {
      destroyArt();
      if (!url) return;
      if (loading) loading.hidden = false;
      var el = document.createElement('iframe');
      el.src = url;
      el.title = 'Stream';
      el.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
      el.setAttribute('allowfullscreen', '');
      frame.innerHTML = '';
      frame.appendChild(el);
      if (loading) loading.hidden = true;
      current = url;
    }

    function setSrc(url) {
      destroyArt();
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

    initArt();

    function playMedia(url) {
      destroyArt();
      var wrap = document.getElementById('art-wrap');
      if (!window.Artplayer || !wrap) {
        setSrc(player.getAttribute('data-default') || '');
        return;
      }
      var isHls = /\.m3u8($|\?)/i.test(url);
      window.__art = new Artplayer({
        container: '#art-wrap',
        url: url,
        type: isHls ? 'm3u8' : (/\.mp4($|\?)/i.test(url) ? 'mp4' : ''),
        theme: '#b94a1e',
        autoSize: false,
        playbackRate: true,
        screenshot: true,
        setting: true,
        fullscreen: true,
        fullscreenWeb: true,
        mini: true,
        fastForward: true,
        lock: true,
        pip: true,
        airplay: true,
        lang: 'en',
        customType: {
          m3u8: function (video, src) {
            if (window.Hls && window.Hls.isSupported()) {
              var hls = new window.Hls({ maxBufferLength: 30 });
              hls.loadSource(src);
              hls.attachMedia(video);
              return;
            }
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = src;
            }
          },
        },
      });
      window.__art.on('error', function () {
        fallbackIframe(player.getAttribute('data-default') || '');
      });
      if (loading) loading.hidden = true;
    }

    player.querySelectorAll('.server-select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var payload = sel.value;
        if (!payload) return;
        var payloads = [];
        sel.querySelectorAll('option').forEach(function (o) { if (o.value) payloads.push(o.value); });
        player.querySelectorAll('.server-select').forEach(function (other) {
          if (other === sel) return;
          other.querySelectorAll('option').forEach(function (o) { if (o.value) payloads.push(o.value); });
        });
        payloads = payloads.filter(function (v, i) { return payloads.indexOf(v) === i; });
        if (loading) loading.hidden = false;
        fetch('/api/stream-direct-mirror', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: payload, payloads: payloads }),
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data && data.success && data.data && data.data.media) {
              playMedia(data.data.media);
            } else if (data && data.success && data.data && data.data.src) {
              setSrc(data.data.src);
            } else if (loading) { loading.hidden = true; }
          })
          .catch(function () { if (loading) loading.hidden = true; });
      });
    });

    (function dataSaver() {
      var conn = navigator.connection || {};
      var slow = conn.saveData === true
        || conn.effectiveType === '3g'
        || conn.effectiveType === 'slow-2g'
        || (conn.downlink != null && conn.downlink < 1.2);
      if (!slow) return;
      var pick = null;
      player.querySelectorAll('.server-select').forEach(function (s) {
        if (s.getAttribute('data-quality') === '360p' && !pick) pick = s;
      });
      if (!pick) return;
      pick.value = pick.options[0] ? pick.options[0].value : pick.value;
      pick.dispatchEvent(new Event('change'));
      var note = document.createElement('p');
      note.className = 'quota';
      note.style.marginTop = '10px';
      note.innerHTML = '<span class="quota-label" style="color:var(--color-accent-text)">DATA SAVER</span>' +
        '<span class="quota-list"><span>360p otomatis · hemat ±60% kuota</span></span>';
      player.parentElement.appendChild(note);
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
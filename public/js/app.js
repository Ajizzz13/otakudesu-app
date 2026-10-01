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
    var currentQuality = '720p';
    var streams = window.__streams || [];
    var groups = window.__groups || [];

    // Collect available qualities: e.g. 1080p, 720p, 480p, 360p
    var qualitySet = [];
    ['1080p', '720p', '480p', '360p'].forEach(function (q) {
      var inGroups = groups.some(function (g) { return g.quality === q; });
      var inStreams = streams.some(function (s) { return s.quality === q; });
      if (inGroups || inStreams) qualitySet.push(q);
    });
    if (!qualitySet.length) {
      groups.forEach(function (g) { if (g.quality && qualitySet.indexOf(g.quality) === -1) qualitySet.push(g.quality); });
      streams.forEach(function (s) { if (s.quality && qualitySet.indexOf(s.quality) === -1) qualitySet.push(s.quality); });
    }

    var conn = navigator.connection || {};
    var isSlow = conn.saveData === true
      || conn.effectiveType === '3g'
      || conn.effectiveType === 'slow-2g'
      || (conn.downlink != null && conn.downlink < 1.2);

    currentQuality = isSlow && qualitySet.indexOf('360p') !== -1
      ? '360p'
      : (qualitySet.indexOf('720p') !== -1 ? '720p' : (qualitySet[0] || '360p'));

    function destroyArt() {
      if (window.__art) {
        if (window.__art.hls) {
          try { window.__art.hls.destroy(); } catch (e) {}
          window.__art.hls = null;
        }
        try { window.__art.destroy(); } catch (e) {}
        window.__art = null;
      }
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
      fallbackIframe(url);
    }

    function syncDropdowns(q) {
      player.querySelectorAll('.server-select').forEach(function (s) {
        if (s.getAttribute('data-quality') === q) {
          s.parentElement.style.opacity = '1';
        } else {
          s.parentElement.style.opacity = '0.55';
        }
      });
    }

    function getPayloadsForQuality(q) {
      var payloads = [];
      groups.forEach(function (g) {
        if (g.quality === q && g.options) {
          g.options.forEach(function (o) { if (o.payload) payloads.push(o.payload); });
        }
      });
      return payloads.filter(function (v, i, a) { return a.indexOf(v) === i; });
    }

    async function resolveQualityMedia(targetQ) {
      var payloads = getPayloadsForQuality(targetQ);
      if (payloads.length) {
        try {
          var res = await fetch('/api/stream-direct-mirror', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payloads: payloads })
          });
          var data = await res.json();
          if (data && data.success && data.data) {
            if (data.data.media) return { type: 'media', url: data.data.media, quality: targetQ };
            if (data.data.src) return { type: 'iframe', url: data.data.src, quality: targetQ };
          }
        } catch (e) {}
      }

      // Direct stream fallback
      var direct = streams.find(function (s) { return s.quality === targetQ && s.url; });
      if (direct) {
        return { type: 'media', url: direct.url, quality: targetQ };
      }

      return null;
    }

    function createArt(initialUrl, initialQuality) {
      destroyArt();
      var wrap = document.getElementById('art-wrap');
      if (!window.Artplayer || !wrap) {
        fallbackIframe(player.getAttribute('data-default') || '');
        return;
      }

      currentQuality = initialQuality || currentQuality;

      var selectorList = qualitySet.map(function (q) {
        return {
          default: q === currentQuality,
          html: q.toUpperCase(),
          value: q
        };
      });

      var controls = [];
      if (qualitySet.length > 1) {
        controls.push({
          name: 'resolution',
          position: 'right',
          index: 10,
          style: { marginRight: '10px' },
          html: currentQuality.toUpperCase(),
          tooltip: 'Kualitas Video',
          selector: selectorList,
          onSelect: async function (item) {
            var targetQ = item.value;
            if (targetQ === currentQuality) return item.html;
            var art = this;
            art.notice.show = 'Memuat ' + item.html + '…';
            try {
              var resolved = await resolveQualityMedia(targetQ);
              if (!resolved) {
                art.notice.show = 'Gagal memuat ' + item.html;
                return currentQuality.toUpperCase();
              }
              if (resolved.type === 'media') {
                if (art.hls && !/\.m3u8($|\?)/i.test(resolved.url)) {
                  try { art.hls.destroy(); } catch (e) {}
                  art.hls = null;
                }
                await art.switchQuality(resolved.url);
                currentQuality = targetQ;
                syncDropdowns(targetQ);
                art.notice.show = 'Kualitas: ' + item.html;
                return item.html;
              } else if (resolved.type === 'iframe') {
                fallbackIframe(resolved.url);
                return item.html;
              }
            } catch (err) {
              art.notice.show = 'Error: ' + err.message;
              return currentQuality.toUpperCase();
            }
            return item.html;
          }
        });
      }

      window.__art = new Artplayer({
        container: '#art-wrap',
        url: initialUrl,
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
        controls: controls,
        customType: {
          m3u8: function (video, src, art) {
            if (art.hls) {
              try { art.hls.destroy(); } catch (e) {}
              art.hls = null;
            }
            if (window.Hls && window.Hls.isSupported()) {
              var hls = new window.Hls({ maxBufferLength: 30 });
              hls.loadSource(src);
              hls.attachMedia(video);
              art.hls = hls;
              art.on('destroy', function () {
                try { hls.destroy(); } catch (e) {}
              });
              return;
            }
            if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = src;
            }
          }
        }
      });

      var errorTried = false;
      window.__art.on('error', async function () {
        if (!errorTried && qualitySet.length > 1) {
          errorTried = true;
          var nextQ = currentQuality === '720p' ? '480p' : (currentQuality === '480p' ? '360p' : '720p');
          if (window.__art && window.__art.notice) {
            window.__art.notice.show = 'Mencoba mirror ' + nextQ.toUpperCase() + '…';
          }
          try {
            var alt = await resolveQualityMedia(nextQ);
            if (alt && alt.type === 'media') {
              if (window.__art.hls && !/\.m3u8($|\?)/i.test(alt.url)) {
                try { window.__art.hls.destroy(); } catch (e) {}
                window.__art.hls = null;
              }
              await window.__art.switchQuality(alt.url);
              currentQuality = nextQ;
              syncDropdowns(nextQ);
              window.__art.notice.show = 'Kualitas: ' + nextQ.toUpperCase();
              return;
            }
          } catch (e) {}
        }
        fallbackIframe(player.getAttribute('data-default') || '');
      });

      if (loading) loading.hidden = true;
      syncDropdowns(currentQuality);
    }

    function playMedia(url) {
      if (window.__art && window.__art.isReady) {
        if (window.__art.hls && !/\.m3u8($|\?)/i.test(url)) {
          try { window.__art.hls.destroy(); } catch (e) {}
          window.__art.hls = null;
        }
        window.__art.switchQuality(url);
      } else {
        createArt(url, currentQuality);
      }
    }

    async function initPlayer() {
      if (loading) loading.hidden = false;

      // 1. Resolve preferred quality from mirrors (real 720p/480p/360p without 403 IP-lock)
      if (groups.length) {
        try {
          var res = await resolveQualityMedia(currentQuality);
          if (res && res.type === 'media') {
            createArt(res.url, currentQuality);
            return;
          }
          if (res && res.type === 'iframe') {
            fallbackIframe(res.url);
            return;
          }
        } catch (e) {
          console.error('Mirror resolve failed:', e);
        }
      }

      // 2. Direct streams fallback (if mirrors empty)
      var direct = streams.find(function (s) { return s.quality === currentQuality && s.url; })
        || streams.find(function (s) { return s.quality === '720p' && s.url; })
        || streams[0];

      if (direct && direct.url) {
        createArt(direct.url, direct.quality);
        return;
      }

      // 3. Fallback to default iframe
      var def = player.getAttribute('data-default') || '';
      if (def) {
        fallbackIframe(def);
      } else {
        if (loading) loading.hidden = true;
      }
    }

    initPlayer();

    // Sync external server selects
    player.querySelectorAll('.server-select').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var payload = sel.value;
        if (!payload) return;
        var q = sel.getAttribute('data-quality') || currentQuality;
        var payloads = [payload];
        sel.querySelectorAll('option').forEach(function (o) { if (o.value && o.value !== payload) payloads.push(o.value); });
        if (loading) loading.hidden = false;
        fetch('/api/stream-direct-mirror', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payload: payload, payloads: payloads }),
        })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (data && data.success && data.data && data.data.media) {
              if (window.__art && window.__art.isReady) {
                currentQuality = q;
                if (window.__art.hls && !/\.m3u8($|\?)/i.test(data.data.media)) {
                  try { window.__art.hls.destroy(); } catch (e) {}
                  window.__art.hls = null;
                }
                window.__art.switchQuality(data.data.media);
                syncDropdowns(q);
              } else {
                createArt(data.data.media, q);
              }
            } else if (data && data.success && data.data && data.data.src) {
              fallbackIframe(data.data.src);
            } else if (loading) { loading.hidden = true; }
          })
          .catch(function () { if (loading) loading.hidden = true; });
      });
    });

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
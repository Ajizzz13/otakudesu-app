# OTAKUDESU CLEAN

Streaming anime tanpa iklan — desain Hallmark (dark editorial, Workbench display, cool cyan accent).
Sumber data: otakudesu.blog. Scrape server-side dari IP mesin ini (IP datacenter lain diblokir Cloudflare otakudesu).

## Run

```bash
npm install
npm start          # http://localhost:3001
```

Env opsional: `OTAKUDESU_BASE_URL` (fallback `https://otakudesu.blog`), `PORT` (default 3001).

## Routes

| Route | Keterangan |
|---|---|
| `/` | Home — ongoing + complete |
| `/anime/:slug` | Detail + episode list |
| `/episode/:slug` | Player + mirror server + download + nav |
| `/search?q=` | Pencarian |
| `/ongoing-anime` `/complete-anime` `/anime-list` `?page=N` | Daftar + pagination |
| `/jadwal-rilis` `/genre-list` `/genres/:genre` | Jadwal + genre |
| `/api/search` `POST /api/stream-resolve` | JSON API |

## Teknis

- `lib/scraper.js` — axios + cheerio, throttle serial 500ms, retry 3x, 2 UA. Slug-based.
- Mirror server episode = AJAX + nonce (`admin-ajax.php`) — di-resolve on-demand lewat `/api/stream-resolve` (nonce di-cache 5 menit).
- Player default = iframe `#pembed` (render server-side), mirror tombol swap iframe, download links = `.download`.
- `public/css/style.css` — token: `--bg-ink --bg-panel --line --text-paper --text-muted --accent`.
- `public/js/app.js` — search debounce, episode filter, mirror resolve.

## Struktur

```
server.js          # Express routes
lib/scraper.js     # scraper otakudesu
templates/         # EJS + partials
public/            # css, js
```
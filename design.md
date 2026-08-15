# Design — Otakudesu Clean Stream

Locked design system — bespoke streaming platform (rewritten 2026-08-15, replaces modern-minimal Workbench system).

## Genre
atmospheric · cinematic-dark (streaming rails)

## Structure (bespoke)
- "Backdrop-bleed bioskop": setiap judul punya latar sinematik — hero/detail memakai cover as-is sebagai backdrop (blur + gradient), cover jadi frame poster 2:3.
- Home: Hero (NOW PLAYING) + rail horizontal (On-Going, Complete) + chip genre.
- Detail: backdrop header (cover kiri + info kanan) + episode grid scrollable.
- Player: cinema 16:9 + server chips + episode rail sidebar.
- List/jadwal/genre: grid poster / list abjad / kolom hari / chip besar.

## Theme (OKLCH)
- `--color-ink`: oklch(12.5% 0.012 250) deep blue-black
- `--color-panel`: oklch(15.5% 0.014 250) · `--color-panel-2`: oklch(18.5% 0.016 250)
- `--color-line`: oklch(22% 0.018 250)
- `--color-paper`: oklch(93% 0.01 250) · `--color-muted`: oklch(71% 0.022 250)
- `--color-accent`: oklch(63% 0.18 22) — ember/warm (break dari cyan lama)
- `--color-accent-ink`: oklch(14% 0.04 22) · `--color-focus`: oklch(70% 0.19 285)
- Neutrals semua tinted (gate 22). Tidak ada #000/#fff murni (gate 7).

## Typography
- Display: Archivo 700–900 (roman), letter-spacing -0.01em
- Body: Source Sans 3 (400/600)
- Mono: IBM Plex Mono (label, badge, ep number, tag)

## Spacing / shape
4pt scale (`--space-*`). Radius 6/10/14. Rule 1px.

## Motion
- `--ease-out`: cubic-bezier(0.16, 1, 0.3, 1) · `--ease-in-out`
- Hero fade-in (480ms), rail drag-scroll, tile hover scale 1.03 + ring accent
- reduced-motion: semua durasi 0ms

## Microinteractions
- Hover: tile cover scale + border accent · button lift -1px
- Focus: 2px violet ring (`--color-focus`), 3:1+
- Active: translateY(0)
- Loading: mono "LOADING FEED…" pulse (hidden attr dihormati)

## CTA voice
"Watch" (primary ember) · "Detail" (ghost) · Prev/Next/All Episodes (ghost).

## What pages MUST share
wordmark, accent ember, Archivo/Source Sans 3/IBM Plex Mono, rail-head rhythm, tile voice, focus ring, footer mono line.

## What MAY differ
per-page structure (hero vs backdrop-header vs player-shell vs grid), enrichment none (app pages).

## Exports
- tokens: `public/css/tokens.css` (sumber kebenaran)
- style: `public/css/style.css` (import tokens)
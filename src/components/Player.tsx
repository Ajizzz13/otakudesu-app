'use client';

import { useEffect, useState } from 'react';

interface DownloadLink {
  label: string;
  url: string;
  size?: string;
}

export default function Player({ title, downloadUrl }: { title: string; downloadUrl?: string }) {
  const [status, setStatus] = useState<'resolving' | 'ready' | 'error'>('resolving');
  const [src, setSrc] = useState<string | null>(null);
  const [embed, setEmbed] = useState<string | null>(null);

  useEffect(() => {
    if (!downloadUrl) {
      setStatus('error');
      return;
    }
    fetch(`/api/stream?url=${encodeURIComponent(downloadUrl)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.type === 'video' && d.src) {
          setSrc(d.src);
          setStatus('ready');
        } else if (d.type === 'embed' && d.src) {
          setEmbed(d.src);
          setStatus('ready');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [downloadUrl]);

  if (status === 'resolving') {
    return (
      <div className="aspect-video bg-black border border-line rounded-lg flex items-center justify-center">
        <span className="font-mono text-sm text-accent animate-pulse">RESOLVING SOURCE…</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="aspect-video bg-black border border-line rounded-lg flex flex-col items-center justify-center gap-3">
        <span className="font-mono text-sm text-accent">LOST FEED</span>
        <p className="text-xs text-muted max-w-sm text-center px-4">
          Source stream error. Try another mirror below (download links act as mirrors when playable).
        </p>
      </div>
    );
  }

  if (embed) {
    return (
      <div className="aspect-video bg-black border border-line rounded-lg overflow-hidden">
        <iframe src={embed} title={title} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
      </div>
    );
  }

  return (
    <div className="aspect-video bg-black border border-line rounded-lg overflow-hidden">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video controls autoPlay playsInline src={src || undefined} className="w-full h-full" />
    </div>
  );
}

export type { DownloadLink };
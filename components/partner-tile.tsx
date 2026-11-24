'use client';

import { useCallback, useRef } from 'react';
import { Globe2, X } from 'lucide-react';
import type { PartnerEntry } from '@/lib/cms/schema';
import { PARTNER_KIND_LABELS } from '@/lib/partners';
import { isExternalUrl } from '@/lib/site';
import { normalizePartnerLogoBoxOpacity } from '@/lib/utils';

export type PartnerTileSize = 'xxl' | 'large' | 'medium' | 'footer';

function hexToRgba(hex: string, opacityPercent: number) {
  const normalized = hex.replace('#', '').trim();
  const expanded = normalized.length === 3
    ? normalized.split('').map((part) => `${part}${part}`).join('')
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(expanded)) {
    return `rgba(58, 39, 24, ${Math.min(1, Math.max(0, opacityPercent / 100))})`;
  }

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${Math.min(1, Math.max(0, opacityPercent / 100))})`;
}

// Maximale Logomaße je Paketstufe: Die Abstufung muss an der tatsächlichen
// Logogröße erkennbar sein. Logos bleiben proportional (object-contain).
const tileSizeClasses: Record<PartnerTileSize, { width: string; padding: string; logoBox: string; fallbackText: string }> = {
  xxl: {
    width: 'w-full',
    padding: 'p-6 sm:p-10',
    logoBox: 'h-36 sm:h-48',
    fallbackText: 'text-lg',
  },
  large: {
    width: 'w-40 sm:w-56',
    padding: 'p-4 sm:p-6',
    logoBox: 'h-24 sm:h-32',
    fallbackText: 'text-sm',
  },
  medium: {
    width: 'w-32 sm:w-44',
    padding: 'p-3 sm:p-4',
    logoBox: 'h-16 sm:h-24',
    fallbackText: 'text-xs',
  },
  footer: {
    width: 'w-24 sm:w-28',
    padding: 'p-2 sm:p-3',
    logoBox: 'h-10 sm:h-12',
    fallbackText: 'text-[0.65rem]',
  },
};

/**
 * Logo-Kachel mit Detailansicht. Die Kachel zeigt nur das Logo; Klick, Touch
 * oder Enter/Leertaste öffnen den Detaildialog mit Logo, Name, Beschreibung
 * und Website-Link. Desktop: zentriertes Dialogfenster. Smartphone: von unten
 * eingeblendetes Detailfenster. Schließen per Button, Escape oder Klick auf
 * den Hintergrund; der Fokus kehrt zur Kachel zurück.
 */
export function PartnerTile({ partner, size, fill = false }: { partner: PartnerEntry; size: PartnerTileSize; fill?: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const classes = tileSizeClasses[size];
  const logoBackground = hexToRgba(
    partner.logoBoxBackground || '#3a2718',
    normalizePartnerLogoBoxOpacity(partner.logoBoxBackground, partner.logoBoxOpacity, 100),
  );

  const openDialog = useCallback(() => {
    dialogRef.current?.showModal();
  }, []);

  const closeDialog = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  const handleDialogClose = useCallback(() => {
    triggerRef.current?.focus();
  }, []);

  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDialog}
        aria-haspopup="dialog"
        aria-label={`Details zu ${partner.name} anzeigen`}
        className={`group flex flex-col items-center justify-center rounded-[1.3rem] border border-[color:var(--color-accent)]/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-[color:var(--color-accent)]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)] ${fill ? 'w-full' : classes.width} ${classes.padding}`}
        style={{ backgroundColor: logoBackground }}
      >
        {partner.logo.assetUrl ? (
          <img
            src={partner.logo.assetUrl}
            alt={`${partner.name} Logo`}
            className={`w-auto max-w-full object-contain ${classes.logoBox}`}
          />
        ) : (
          <span className={`flex items-center justify-center text-center font-semibold text-[color:var(--color-muted)] ${classes.logoBox} ${classes.fallbackText}`}>
            {partner.name}
          </span>
        )}
      </button>

      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        onClick={handleBackdropClick}
        aria-label={`Details zu ${partner.name}`}
        className="m-auto w-[min(34rem,calc(100vw-2rem))] rounded-[1.6rem] border border-[color:var(--color-accent)]/30 bg-[linear-gradient(180deg,rgba(28,18,12,0.98)_0%,rgba(12,8,6,0.98)_100%)] p-0 text-[color:var(--color-foreground)] shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop:bg-black/70 backdrop:backdrop-blur-sm max-sm:mb-0 max-sm:mt-auto max-sm:w-full max-sm:max-w-full max-sm:rounded-b-none"
      >
        <div className="relative p-6 sm:p-8">
          <button
            type="button"
            onClick={closeDialog}
            aria-label="Details schließen"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-black/30 text-[color:var(--color-muted)] transition hover:border-[color:var(--color-accent)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="mx-auto flex h-28 w-full max-w-[14rem] items-center justify-center rounded-[1.3rem] border border-[color:var(--color-accent)]/25 p-4"
            style={{ backgroundColor: logoBackground }}
          >
            {partner.logo.assetUrl ? (
              <img src={partner.logo.assetUrl} alt={`${partner.name} Logo`} className="max-h-full w-auto max-w-full object-contain" />
            ) : (
              <span className="text-center text-sm font-semibold text-[color:var(--color-muted)]">Kein Logo hinterlegt</span>
            )}
          </div>

          <h3 className="mt-5 text-center text-xl font-black text-white sm:text-2xl">{partner.name}</h3>

          {partner.kind ? (
            <p className="mt-2 text-center text-xs font-bold uppercase tracking-[0.18em] text-[color:var(--color-accent-soft)]">
              {PARTNER_KIND_LABELS[partner.kind]}
            </p>
          ) : null}

          {partner.description ? (
            <p className="body-copy mt-4 text-center text-sm leading-7">{partner.description}</p>
          ) : null}

          {partner.website ? (
            <div className="mt-6 flex justify-center">
              <a
                href={partner.website}
                target={isExternalUrl(partner.website) ? '_blank' : undefined}
                rel={isExternalUrl(partner.website) ? 'noreferrer' : undefined}
                className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-sm font-bold text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white"
              >
                <Globe2 className="h-4 w-4" />
                Website besuchen
              </a>
            </div>
          ) : null}
        </div>
      </dialog>
    </>
  );
}

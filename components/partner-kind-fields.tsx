'use client';

import { useState } from 'react';
import type { PartnerKind } from '@/lib/cms/schema';
import { PARTNER_KIND_LABELS, PARTNER_KINDS } from '@/lib/partners';

const selectClassName =
  'w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)] [&>option]:bg-[#1a120c]';

/**
 * Pflichtfeld „Partnerart“ mit bedingtem Pflichtfeld „Sponsoringpaket“:
 * Das Paket-Select erscheint nur bei Partnerart „Sponsor“. Beim Wechsel zu
 * einer anderen Partnerart wird das Paket nicht mehr mitgesendet und
 * serverseitig aus dem Datensatz entfernt.
 */
export function PartnerKindFields({
  packages,
  defaultKind,
  defaultSponsorPackageId,
}: {
  packages: { id: string; name: string }[];
  defaultKind?: PartnerKind;
  defaultSponsorPackageId?: string;
}) {
  const [kind, setKind] = useState<PartnerKind | ''>(defaultKind ?? '');

  return (
    <>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-white">Partnerart (Pflichtfeld)</span>
        <select
          name="kind"
          required
          value={kind}
          onChange={(event) => setKind(event.target.value as PartnerKind | '')}
          className={selectClassName}
        >
          <option value="" disabled>
            Bitte Partnerart wählen
          </option>
          {PARTNER_KINDS.map((value) => (
            <option key={value} value={value}>
              {PARTNER_KIND_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      {kind === 'sponsor' ? (
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-white">Sponsoringpaket (Pflichtfeld)</span>
          <select name="sponsorPackageId" required defaultValue={defaultSponsorPackageId ?? ''} className={selectClassName}>
            <option value="" disabled>
              Bitte Paket wählen
            </option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </>
  );
}

import type { PartnerEntry, PartnerKind } from '@/lib/cms/schema';
import type { SponsorPackage } from '@/lib/types';

export const PARTNER_KIND_LABELS: Record<PartnerKind, string> = {
  sponsor: 'Sponsor',
  // Sichtbare Bezeichnung „Projektpartner“; der interne Wert 'cooperation'
  // bleibt erhalten, damit gespeicherte Zuordnungen weiter funktionieren.
  cooperation: 'Projektpartner',
  network: 'Netzwerkkooperationspartner',
};

export const PARTNER_KINDS = Object.keys(PARTNER_KIND_LABELS) as PartnerKind[];

export function normalizePartnerKind(value: unknown): PartnerKind | undefined {
  const normalized = String(value ?? '').trim();
  return PARTNER_KINDS.includes(normalized as PartnerKind) ? (normalized as PartnerKind) : undefined;
}

/**
 * Größenstufe eines Sponsorenlogos. Die Stufe ergibt sich aus dem im Admin
 * gewählten Sponsoringpaket: xxl = eigene Fläche über volle Breite,
 * large/medium = Sponsorenbereich, footer = kleines Logo im Footer.
 */
export type SponsorTier = 'xxl' | 'large' | 'medium' | 'footer';

export const SPONSOR_TIER_ORDER: SponsorTier[] = ['xxl', 'large', 'medium', 'footer'];

function tierFromLogoSize(logoSize: string): SponsorTier | undefined {
  const value = logoSize
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ä/g, 'a');

  if (value.includes('xxl') || value.includes('xl')) {
    return 'xxl';
  }

  if (value.includes('gross') || value.includes('large')) {
    return 'large';
  }

  if (value.includes('mittel') || value.includes('medium')) {
    return 'medium';
  }

  if (value.includes('klein') || value.includes('small') || value.includes('footer')) {
    return 'footer';
  }

  return undefined;
}

/**
 * Leitet die Größenstufe aus der Paketdefinition ab. Primär zählt das Feld
 * „Logogröße“ des Pakets (XXL/Groß/Mittel/Klein). Ist es nicht eindeutig,
 * entscheidet der Preisrang unter allen Paketen (teuerstes = xxl, dann
 * absteigend large, medium, footer). Paketnamen werden bewusst nicht
 * ausgewertet, da Admins sie frei umbenennen können.
 */
export function resolveSponsorTier(pkg: SponsorPackage, allPackages: SponsorPackage[]): SponsorTier {
  const fromLogoSize = tierFromLogoSize(String(pkg.logoSize ?? ''));

  if (fromLogoSize) {
    return fromLogoSize;
  }

  const byPriceDesc = [...allPackages].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  const rank = byPriceDesc.findIndex((candidate) => candidate.id === pkg.id);

  if (rank === 0) {
    return 'xxl';
  }

  if (rank === 1) {
    return 'large';
  }

  if (rank === 2) {
    return 'medium';
  }

  return 'footer';
}

export interface SponsorPackageGroup {
  package: SponsorPackage;
  tier: SponsorTier;
  partners: PartnerEntry[];
}

export interface GroupedPartners {
  /** Sponsorengruppen für den Seitenbereich (xxl/large/medium), nach Stufe sortiert. */
  sponsorGroups: SponsorPackageGroup[];
  /** Sponsorengruppen mit Footer-Stufe (z. B. Bühnenbauer). */
  footerSponsorGroups: SponsorPackageGroup[];
  cooperation: PartnerEntry[];
  network: PartnerEntry[];
  /** Alt-Datensätze ohne Partnerart: bleiben bis zur Zuordnung öffentlich sichtbar. */
  unassigned: PartnerEntry[];
}

export function groupPartners(partners: PartnerEntry[], packages: SponsorPackage[]): GroupedPartners {
  const cooperation: PartnerEntry[] = [];
  const network: PartnerEntry[] = [];
  const unassigned: PartnerEntry[] = [];
  const sponsorsByPackage = new Map<string, PartnerEntry[]>();

  for (const partner of partners) {
    if (partner.kind === 'cooperation') {
      cooperation.push(partner);
    } else if (partner.kind === 'network') {
      network.push(partner);
    } else if (partner.kind === 'sponsor' && partner.sponsorPackageId && packages.some((pkg) => pkg.id === partner.sponsorPackageId)) {
      const list = sponsorsByPackage.get(partner.sponsorPackageId) ?? [];
      list.push(partner);
      sponsorsByPackage.set(partner.sponsorPackageId, list);
    } else {
      // Ohne Partnerart oder mit gelöschtem/fehlendem Paket: neutral anzeigen,
      // keine Stufe aus Name, Logo oder Reihenfolge ableiten.
      unassigned.push(partner);
    }
  }

  const groups: SponsorPackageGroup[] = [];

  for (const pkg of packages) {
    const groupPartnersList = sponsorsByPackage.get(pkg.id);

    if (groupPartnersList?.length) {
      groups.push({ package: pkg, tier: resolveSponsorTier(pkg, packages), partners: groupPartnersList });
    }
  }

  groups.sort((a, b) => SPONSOR_TIER_ORDER.indexOf(a.tier) - SPONSOR_TIER_ORDER.indexOf(b.tier));

  return {
    sponsorGroups: groups.filter((group) => group.tier !== 'footer'),
    footerSponsorGroups: groups.filter((group) => group.tier === 'footer'),
    cooperation,
    network,
    unassigned,
  };
}

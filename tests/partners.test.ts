import test from 'node:test';
import assert from 'node:assert/strict';
import type { PartnerEntry } from '@/lib/cms/schema';
import type { SponsorPackage } from '@/lib/types';
import { groupPartners, normalizePartnerKind, resolveSponsorTier } from '@/lib/partners';

function buildPackage(overrides: Partial<SponsorPackage>): SponsorPackage {
  return {
    id: overrides.id || `paket-${Math.random().toString(36).slice(2, 10)}`,
    name: overrides.name || 'Testpaket',
    price: overrides.price ?? 1000,
    features: overrides.features || ['Feature'],
    visibility: overrides.visibility || 'Sichtbarkeit',
    logoSize: overrides.logoSize ?? 'Mittel',
    placement: overrides.placement || 'Platzierung',
    highlighted: overrides.highlighted ?? false,
  };
}

function buildPartner(overrides: Partial<PartnerEntry>): PartnerEntry {
  return {
    id: overrides.id || `partner-${Math.random().toString(36).slice(2, 10)}`,
    name: overrides.name || 'Testpartner',
    website: overrides.website ?? '',
    description: overrides.description || 'Beschreibung',
    logo: overrides.logo || { assetUrl: '', assetName: '', assetContentType: '' },
    ...overrides,
  };
}

// Vier Pakete wie im CMS: Namen sind frei wählbar (z. B. Headliner,
// Impulsgeber, Wegbereiter, Bühnenbauer), die Stufe folgt der Logogröße.
const packages: SponsorPackage[] = [
  buildPackage({ id: 'buehnenbauer', name: 'Bühnenbauer', price: 500, logoSize: 'Klein' }),
  buildPackage({ id: 'wegbereiter', name: 'Wegbereiter', price: 1500, logoSize: 'Mittel' }),
  buildPackage({ id: 'impulsgeber', name: 'Impulsgeber', price: 3000, logoSize: 'Groß' }),
  buildPackage({ id: 'headliner', name: 'Headliner', price: 7500, logoSize: 'XXL' }),
];

test('Partnerart wird nur fuer gueltige Werte uebernommen', () => {
  assert.equal(normalizePartnerKind('sponsor'), 'sponsor');
  assert.equal(normalizePartnerKind('cooperation'), 'cooperation');
  assert.equal(normalizePartnerKind('network'), 'network');
  assert.equal(normalizePartnerKind('Hauptsponsor'), undefined);
  assert.equal(normalizePartnerKind(''), undefined);
  assert.equal(normalizePartnerKind(undefined), undefined);
});

test('Logogroesse des Pakets bestimmt die Stufe', () => {
  assert.equal(resolveSponsorTier(packages[3], packages), 'xxl');
  assert.equal(resolveSponsorTier(packages[2], packages), 'large');
  assert.equal(resolveSponsorTier(packages[1], packages), 'medium');
  assert.equal(resolveSponsorTier(packages[0], packages), 'footer');
});

test('ohne eindeutige Logogroesse entscheidet der Preisrang', () => {
  const unlabeled = [
    buildPackage({ id: 'a', price: 500, logoSize: '' }),
    buildPackage({ id: 'b', price: 1500, logoSize: '' }),
    buildPackage({ id: 'c', price: 3000, logoSize: '' }),
    buildPackage({ id: 'd', price: 7500, logoSize: '' }),
  ];

  assert.equal(resolveSponsorTier(unlabeled[3], unlabeled), 'xxl');
  assert.equal(resolveSponsorTier(unlabeled[2], unlabeled), 'large');
  assert.equal(resolveSponsorTier(unlabeled[1], unlabeled), 'medium');
  assert.equal(resolveSponsorTier(unlabeled[0], unlabeled), 'footer');
});

test('leere Pakete erzeugen keine Gruppe, belegte behalten die Stufenreihenfolge', () => {
  const partners = [
    buildPartner({ id: 's1', kind: 'sponsor', sponsorPackageId: 'wegbereiter' }),
    buildPartner({ id: 's2', kind: 'sponsor', sponsorPackageId: 'headliner' }),
    buildPartner({ id: 's3', kind: 'sponsor', sponsorPackageId: 'wegbereiter' }),
  ];

  const grouped = groupPartners(partners, packages);

  // Kein Impulsgeber vorhanden: keine Gruppe und damit keine Ueberschrift/Luecke.
  assert.deepEqual(
    grouped.sponsorGroups.map((group) => group.package.id),
    ['headliner', 'wegbereiter']
  );
  // Mehrere Sponsoren im selben Paket bleiben in einer Gruppe.
  assert.deepEqual(
    grouped.sponsorGroups[1].partners.map((partner) => partner.id),
    ['s1', 's3']
  );
  assert.equal(grouped.footerSponsorGroups.length, 0);
});

test('ausschliesslich Buehnenbauer landen nur im Footer', () => {
  const partners = [buildPartner({ id: 's1', kind: 'sponsor', sponsorPackageId: 'buehnenbauer' })];
  const grouped = groupPartners(partners, packages);

  assert.equal(grouped.sponsorGroups.length, 0);
  assert.equal(grouped.footerSponsorGroups.length, 1);
  assert.equal(grouped.footerSponsorGroups[0].package.id, 'buehnenbauer');
});

test('Kooperations- und Netzwerkpartner werden getrennt gruppiert', () => {
  const partners = [
    buildPartner({ id: 'k1', kind: 'cooperation' }),
    buildPartner({ id: 'n1', kind: 'network' }),
    buildPartner({ id: 'k2', kind: 'cooperation' }),
  ];

  const grouped = groupPartners(partners, packages);

  assert.deepEqual(grouped.cooperation.map((partner) => partner.id), ['k1', 'k2']);
  assert.deepEqual(grouped.network.map((partner) => partner.id), ['n1']);
  assert.equal(grouped.unassigned.length, 0);
});

test('Eintraege ohne Partnerart bleiben als Weitere Partner sichtbar', () => {
  const partners = [
    buildPartner({ id: 'alt1' }),
    buildPartner({ id: 'k1', kind: 'cooperation' }),
  ];

  const grouped = groupPartners(partners, packages);

  assert.deepEqual(grouped.unassigned.map((partner) => partner.id), ['alt1']);
});

test('Sponsor mit geloeschtem Paket faellt neutral zurueck statt eine Stufe zu erraten', () => {
  const partners = [buildPartner({ id: 's1', kind: 'sponsor', sponsorPackageId: 'geloeschtes-paket' })];
  const grouped = groupPartners(partners, packages);

  assert.equal(grouped.sponsorGroups.length, 0);
  assert.deepEqual(grouped.unassigned.map((partner) => partner.id), ['s1']);
});

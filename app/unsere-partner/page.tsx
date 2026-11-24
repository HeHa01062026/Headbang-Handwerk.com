import type { Metadata } from 'next';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { EditablePageShell } from '@/components/editable-page-shell';
import { LiveEditableText } from '@/components/live-editable-text';
import { LiveResizableBox } from '@/components/live-resizable-box';
import { PartnerKindFields } from '@/components/partner-kind-fields';
import { PartnerTile } from '@/components/partner-tile';
import { Button } from '@/components/ui/button';
import { isAdminAuthenticated } from '@/lib/cms/auth';
import { resolveLiveBoxStyle, resolveLiveHtml } from '@/lib/cms/live-editor';
import type { PartnerEntry } from '@/lib/cms/schema';
import { getCmsContent } from '@/lib/cms/storage';
import { groupPartners, PARTNER_KIND_LABELS, type SponsorPackageGroup } from '@/lib/partners';
import { normalizePartnerLogoBoxOpacity } from '@/lib/utils';
import { addPartnerAction, movePartnerAction, removePartnerAction, updatePartnerAction } from './actions';

export const metadata: Metadata = {
  title: 'Unsere Partner – Headbang Handwerk',
  description: 'Partner und Unterstützer von Headbang Handwerk im Überblick.',
};

function getAdminErrorMessage(adminError?: string) {
  if (!adminError) {
    return null;
  }

  if (adminError === 'missing-config') {
    return 'Für Logo-Uploads fehlt aktuell die Firebase-Konfiguration. Prüfe FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY und FIREBASE_STORAGE_BUCKET.';
  }

  if (adminError === 'invalid-firebase') {
    return 'Firebase ist gesetzt, aber ungültig formatiert. Prüfe besonders FIREBASE_PRIVATE_KEY und FIREBASE_STORAGE_BUCKET.';
  }

  if (adminError === 'firebase-auth') {
    return 'Firebase lehnt das Speichern ab. Prüfe den Service-Account und seine Rechte.';
  }

  if (adminError === 'logo-upload-bucket') {
    return 'Das Partner-Logo konnte nicht hochgeladen werden, weil der Firebase-Storage-Bucket nicht gefunden wurde.';
  }

  if (adminError === 'logo-upload-permission') {
    return 'Das Partner-Logo konnte nicht hochgeladen werden, weil dem Service Account Rechte auf Firebase Storage fehlen.';
  }

  if (adminError === 'logo-upload') {
    return 'Das Partner-Logo konnte nicht hochgeladen werden. Prüfe Firebase Storage und den Service Account.';
  }

  if (adminError === 'missing-partner-fields') {
    return 'Bitte mindestens Partnername und Kurzbeschreibung ausfüllen.';
  }

  if (adminError === 'missing-partner-kind') {
    return 'Bitte eine Partnerart wählen: Sponsor, Kooperationspartner oder Netzwerkkooperationspartner.';
  }

  if (adminError === 'missing-sponsor-package') {
    return 'Für Sponsoren muss eines der vorhandenen Sponsoringpakete gewählt werden.';
  }

  return 'Aktion fehlgeschlagen. Bitte Eingaben prüfen.';
}

const adminInputClassName =
  'w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]';

function PartnerAdminBadges({ partner, packages }: { partner: PartnerEntry; packages: { id: string; name: string }[] }) {
  const packageName = partner.sponsorPackageId
    ? packages.find((pkg) => pkg.id === partner.sponsorPackageId)?.name ?? partner.sponsorPackageId
    : null;

  return (
    <div className="flex flex-wrap gap-2 text-xs font-bold">
      {partner.kind ? (
        <span className="rounded-full border border-[color:var(--color-accent)]/40 bg-[color:var(--color-accent)]/10 px-3 py-1 text-[color:var(--color-accent-soft)]">
          {PARTNER_KIND_LABELS[partner.kind]}
        </span>
      ) : (
        <span className="rounded-full border border-amber-400/50 bg-amber-950/40 px-3 py-1 text-amber-200">Noch nicht zugeordnet</span>
      )}
      {partner.kind === 'sponsor' && packageName ? (
        <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[color:var(--color-muted)]">Paket: {packageName}</span>
      ) : null}
    </div>
  );
}

function SponsorGroupSection({ group }: { group: SponsorPackageGroup }) {
  return (
    <div>
      <h3 className="text-center text-xl font-black text-white sm:text-2xl">{group.package.name}</h3>
      {group.tier === 'xxl' ? (
        <div className="mt-5 space-y-6">
          {group.partners.map((partner) => (
            <PartnerTile key={partner.id} partner={partner} size="xxl" fill />
          ))}
        </div>
      ) : (
        <div className="mt-5 flex flex-wrap justify-center gap-4">
          {group.partners.map((partner) => (
            <PartnerTile key={partner.id} partner={partner} size={group.tier === 'large' ? 'large' : 'medium'} />
          ))}
        </div>
      )}
    </div>
  );
}

function PartnerGroupGrid({ partners }: { partners: PartnerEntry[] }) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {partners.map((partner) => (
        <PartnerTile key={partner.id} partner={partner} size="medium" fill />
      ))}
    </div>
  );
}

export default async function UnserePartnerPage({
  searchParams,
}: {
  searchParams?: Promise<{ view?: string; adminSaved?: string; adminError?: string }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const cms = await getCmsContent();
  const isAuthenticatedAdmin = await isAdminAuthenticated();
  const isAdmin = isAuthenticatedAdmin && params?.view !== 'user';
  const liveEditor = cms.site.liveEditor;
  const partners = cms.site.partners;
  const sponsorPackages = cms.site.sponsorPackages;
  const packageOptions = sponsorPackages.map((pkg) => ({ id: pkg.id, name: pkg.name }));
  const adminErrorMessage = getAdminErrorMessage(params?.adminError);

  const grouped = groupPartners(partners, sponsorPackages);
  const hasPageSponsors = grouped.sponsorGroups.length > 0;
  const hasFooterSponsors = grouped.footerSponsorGroups.length > 0;
  // Gibt es nur Bühnenbauer (Footer-Stufe), führt der Sprunglink direkt zu
  // ihnen im Footer. Ohne sichtbare Sponsoren entfällt der Link komplett.
  const sponsorJumpHref = hasPageSponsors ? '#sponsoren' : hasFooterSponsors ? '#footer-sponsoren' : null;

  const jumpLinks = [
    ...(sponsorJumpHref ? [{ href: sponsorJumpHref, label: 'Sponsoren' }] : []),
    ...(grouped.cooperation.length ? [{ href: '#kooperationspartner', label: 'Kooperationspartner' }] : []),
    ...(grouped.network.length ? [{ href: '#netzwerkkooperationspartner', label: 'Netzwerkkooperationspartner' }] : []),
    ...(grouped.unassigned.length ? [{ href: '#weitere-partner', label: 'Weitere Partner' }] : []),
  ];

  return (
    <EditablePageShell cms={cms} isAdmin={isAdmin} mainClassName="min-h-screen bg-transparent pt-28 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {isAdmin ? (
          <section className="mb-10 rounded-[1.8rem] border border-[color:var(--color-border)]/70 bg-[linear-gradient(180deg,rgba(22,14,10,0.88)_0%,rgba(10,7,5,0.82)_100%)] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent-soft)]">Admin Verwaltung</p>
                <h2 className="mt-2 text-2xl font-black text-white">Partner hinzufügen, bearbeiten und sortieren</h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
                  Jeder Partner braucht eine Partnerart. Sponsoren erhalten zusätzlich eines der Sponsoringpakete und erscheinen damit automatisch in der passenden Größenstufe – Bühnenbauer-Sponsoren im Footer. Einträge ohne Partnerart sind als „Noch nicht zugeordnet“ markiert und erscheinen öffentlich unter „Weitere Partner“, bis du sie zuordnest.
                </p>
              </div>
              <div className="text-sm font-semibold">
                {params?.adminSaved ? <p className="rounded-xl border border-green-500/30 bg-green-950/40 px-4 py-3 text-green-200">Änderung gespeichert.</p> : null}
                {adminErrorMessage ? <p className="rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-red-200">{adminErrorMessage}</p> : null}
              </div>
            </div>

            <form action={addPartnerAction} className="mt-6 grid gap-4 rounded-[1.4rem] border border-white/8 bg-black/15 p-5 lg:grid-cols-2">
              <input name="name" placeholder="Name des Partners" className={adminInputClassName} />
              <input name="website" placeholder="Website des Partners" className={adminInputClassName} />
              <PartnerKindFields packages={packageOptions} />
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Logo-Kasten Hintergrund</span>
                <input name="logoBoxBackground" type="color" defaultValue="#3a2718" className="h-12 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-2 py-2 text-white outline-none focus:border-[color:var(--color-accent)]" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Logo-Kasten Transparenz in %</span>
                <input name="logoBoxOpacity" type="number" min="0" max="100" defaultValue="100" className={adminInputClassName} />
              </label>
              <label className="block lg:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-white">Logo hochladen</span>
                <input
                  type="file"
                  name="logoFile"
                  accept=".png,.jpg,.jpeg,.webp,.svg"
                  className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]"
                />
              </label>
              <textarea name="description" rows={4} placeholder="Kurzbeschreibung" className={`lg:col-span-2 ${adminInputClassName}`} />
              <div className="lg:col-span-2 flex justify-end">
                <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Partner hinzufügen</button>
              </div>
            </form>

            {partners.length ? (
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {partners.map((partner, index) => (
                  <div key={partner.id} className="rounded-[1.4rem] border border-white/8 bg-black/10 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {partner.logo.assetUrl ? (
                          <img src={partner.logo.assetUrl} alt={`${partner.name} Logo`} className="h-10 w-16 object-contain" />
                        ) : null}
                        <p className="text-base font-black text-white">{partner.name}</p>
                      </div>
                      <PartnerAdminBadges partner={partner} packages={packageOptions} />
                    </div>

                    <form action={updatePartnerAction} className="mt-4 grid gap-3">
                      <input type="hidden" name="id" value={partner.id} />
                      <input name="name" defaultValue={partner.name} className={adminInputClassName} />
                      <input name="website" defaultValue={partner.website} placeholder="Website des Partners" className={adminInputClassName} />
                      <PartnerKindFields packages={packageOptions} defaultKind={partner.kind} defaultSponsorPackageId={partner.sponsorPackageId} />
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Logo-Kasten Hintergrund</span>
                        <input name="logoBoxBackground" type="color" defaultValue={partner.logoBoxBackground || '#3a2718'} className="h-12 w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-2 py-2 text-white outline-none focus:border-[color:var(--color-accent)]" />
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Logo-Kasten Transparenz in %</span>
                        <input name="logoBoxOpacity" type="number" min="0" max="100" defaultValue={String(normalizePartnerLogoBoxOpacity(partner.logoBoxBackground, partner.logoBoxOpacity, 100))} className={adminInputClassName} />
                      </label>
                      <textarea name="description" rows={4} defaultValue={partner.description} className={adminInputClassName} />
                      <label className="block">
                        <span className="mb-2 block text-sm font-semibold text-white">Neues Logo hochladen</span>
                        <input
                          type="file"
                          name="logoFile"
                          accept=".png,.jpg,.jpeg,.webp,.svg"
                          className="w-full rounded-xl border border-[color:var(--color-border)] bg-black/20 px-4 py-3 text-white outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[color:var(--color-accent)] file:px-4 file:py-2 file:font-semibold file:text-white focus:border-[color:var(--color-accent)]"
                        />
                      </label>
                      <label className="inline-flex items-center gap-3 rounded-xl border border-[color:var(--color-border)]/70 bg-black/15 px-4 py-3 text-sm text-[color:var(--color-muted)]">
                        <input type="checkbox" name="removeLogo" className="h-4 w-4 rounded border-[color:var(--color-border)] bg-black/20" />
                        Vorhandenes Logo entfernen
                      </label>
                      <div className="flex flex-wrap gap-3">
                        <button type="submit" className="rounded-xl border border-[color:var(--color-accent)]/50 px-4 py-3 text-sm font-black text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white">Speichern</button>
                      </div>
                    </form>

                    <div className="mt-3 flex flex-wrap gap-3">
                      <form action={movePartnerAction}>
                        <input type="hidden" name="id" value={partner.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button type="submit" disabled={index === 0} className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] px-4 py-3 text-sm font-black text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40">
                          <ArrowUp className="h-4 w-4" />
                          Nach oben
                        </button>
                      </form>
                      <form action={movePartnerAction}>
                        <input type="hidden" name="id" value={partner.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button type="submit" disabled={index === partners.length - 1} className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--color-border)] px-4 py-3 text-sm font-black text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-40">
                          <ArrowDown className="h-4 w-4" />
                          Nach unten
                        </button>
                      </form>
                      <form action={removePartnerAction}>
                        <input type="hidden" name="id" value={partner.id} />
                        <button type="submit" className="rounded-xl bg-red-500/15 px-4 py-3 text-sm font-black text-red-200 transition hover:bg-red-500/25">Entfernen</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <LiveResizableBox boxKey="partners.intro.box" initialStyle={resolveLiveBoxStyle(liveEditor, 'partners.intro.box')} isAdmin={isAdmin} className="content-flow text-center mb-10 max-w-4xl mx-auto">
          <h1 className="page-title">
            <LiveEditableText as="span" className="inline" editorKey="partners.title" initialHtml={resolveLiveHtml(liveEditor, 'partners.title', 'Unsere Partner')} isAdmin={isAdmin} title="Partner Titel" />
          </h1>
          <LiveEditableText as="p" className="body-copy-lg" editorKey="partners.lead" initialHtml={resolveLiveHtml(liveEditor, 'partners.lead', 'Diese Unternehmen, Betriebe und Unterstützer begleiten Headbang Handwerk bereits auf dem Weg zu mehr Sichtbarkeit für das Handwerk.')} isAdmin={isAdmin} title="Partner Einleitung" />
        </LiveResizableBox>

        <div className="mb-12 flex flex-wrap items-center justify-center gap-3">
          {jumpLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full border border-[color:var(--color-border)] bg-black/15 px-4 py-2 text-sm font-bold text-[color:var(--color-accent-soft)] transition hover:border-[color:var(--color-accent)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]"
            >
              {link.label}
            </a>
          ))}
          <Button href="/sponsoren" size="md">Sponsoringpakete ansehen</Button>
        </div>

        <div className="space-y-14">
          {hasPageSponsors ? (
            <section id="sponsoren" aria-labelledby="sponsoren-heading" className="section-shell content-box scroll-mt-32 sm:p-8">
              <h2 id="sponsoren-heading" className="section-title text-center text-[1.9rem] sm:text-[2.2rem]">Sponsoren</h2>
              <div className="mt-8 space-y-10">
                {grouped.sponsorGroups.filter((group) => group.tier === 'xxl').map((group) => (
                  <SponsorGroupSection key={group.package.id} group={group} />
                ))}
                {grouped.sponsorGroups.some((group) => group.tier !== 'xxl') ? (
                  // Impulsgeber- und Wegbereiter-Bereiche stehen bei ausreichender
                  // Breite nebeneinander; ist nur einer belegt, nutzt er die volle Breite.
                  <div className="flex flex-wrap gap-10">
                    {grouped.sponsorGroups.filter((group) => group.tier !== 'xxl').map((group) => (
                      <div key={group.package.id} className="min-w-[14rem] flex-1">
                        <SponsorGroupSection group={group} />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {grouped.cooperation.length ? (
            <section id="kooperationspartner" aria-labelledby="kooperationspartner-heading" className="section-shell content-box scroll-mt-32 sm:p-8">
              <h2 id="kooperationspartner-heading" className="section-title text-center text-[1.9rem] sm:text-[2.2rem]">Kooperationspartner</h2>
              <PartnerGroupGrid partners={grouped.cooperation} />
            </section>
          ) : null}

          {grouped.network.length ? (
            <section id="netzwerkkooperationspartner" aria-labelledby="netzwerkkooperationspartner-heading" className="section-shell content-box scroll-mt-32 sm:p-8">
              <h2 id="netzwerkkooperationspartner-heading" className="section-title text-center text-[1.9rem] sm:text-[2.2rem]">Netzwerkkooperationspartner</h2>
              <PartnerGroupGrid partners={grouped.network} />
            </section>
          ) : null}

          {grouped.unassigned.length ? (
            // Bestehende Einträge ohne Partnerart bleiben hier öffentlich sichtbar,
            // bis sie im Adminbereich zugeordnet sind. Danach entfällt der Bereich.
            <section id="weitere-partner" aria-labelledby="weitere-partner-heading" className="section-shell content-box scroll-mt-32 sm:p-8">
              <h2 id="weitere-partner-heading" className="section-title text-center text-[1.9rem] sm:text-[2.2rem]">Weitere Partner</h2>
              <PartnerGroupGrid partners={grouped.unassigned} />
            </section>
          ) : null}
        </div>
      </div>
    </EditablePageShell>
  );
}

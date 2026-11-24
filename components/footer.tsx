import type { ComponentType, SVGProps } from 'react';
import { Facebook, Form as FormIcon, Instagram, Mail } from 'lucide-react';
import { updateFooterAction } from '@/app/admin/chrome-actions';
import type { FooterContent, LiveEditorContent } from '@/lib/cms/schema';
import { resolveLiveHtml, resolveLiveBoxStyle } from '@/lib/cms/live-editor';
import type { SponsorPackageGroup } from '@/lib/partners';
import { isExternalUrl, normalizeSafeSocialUrl } from '@/lib/site';
import { LiveEditableText } from './live-editable-text';
import { LiveResizableBox } from './live-resizable-box';
import { PartnerTile } from './partner-tile';

function TikTokIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M14.5 3c.31 2.09 1.48 3.96 3.36 5.16A7.88 7.88 0 0 0 21 9.3v3.42a10.94 10.94 0 0 1-3.38-.54v4.86c0 3.82-3.09 6.92-6.92 6.92a6.92 6.92 0 1 1 0-13.84c.34 0 .68.03 1.01.08v3.5a3.8 3.8 0 0 0-1.01-.14 3.48 3.48 0 1 0 3.48 3.48V3h3.32Z" />
    </svg>
  );
}

type FooterSocialPlatform = 'facebook' | 'instagram' | 'tiktok';

interface FooterContactRow {
  key: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  text: string;
  href: string;
  /** Nur für Screenreader vorangestellt, z. B. „Instagram:“ vor dem Profilnamen. */
  srPrefix?: string;
}

const socialIcons: Record<FooterSocialPlatform, ComponentType<SVGProps<SVGSVGElement>>> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: TikTokIcon,
};

// Anzeigename aus der Profil-URL, z. B. https://www.instagram.com/headbang.handwerk/ -> @headbang.handwerk.
// Passt der erste Pfadteil nicht zu einem Profilnamen (etwa facebook.com/profile.php?id=…), bleibt das Label.
function getSocialProfileName(platform: FooterSocialPlatform, href: string, fallback: string) {
  try {
    const segment = decodeURIComponent(new URL(href).pathname.split('/').filter(Boolean)[0] || '');

    if (!/^@?[\w.-]+$/.test(segment) || segment.endsWith('.php')) {
      return fallback;
    }

    const name = segment.replace(/^@/, '');
    return platform === 'facebook' ? name : `@${name}`;
  } catch {
    return fallback;
  }
}

// Zeilen im Kontaktbereich, in dieser Reihenfolge: Social-Profile, E-Mail, Kontaktformular.
function buildFooterContactRows(content: FooterContent, resolvedContactEmail: string) {
  const rows: FooterContactRow[] = [];

  for (const platform of ['facebook', 'instagram', 'tiktok'] as const) {
    const socialLink = content.socialLinks.find((link) => link.platform === platform);
    const href = normalizeSafeSocialUrl(socialLink?.href || '');

    if (!href || !socialLink) {
      continue;
    }

    rows.push({
      key: platform,
      Icon: socialIcons[platform],
      text: getSocialProfileName(platform, href, socialLink.label),
      href,
      srPrefix: `${socialLink.label}: `,
    });
  }

  if (resolvedContactEmail) {
    rows.push({ key: 'email', Icon: Mail, text: resolvedContactEmail, href: `mailto:${resolvedContactEmail}`, srPrefix: 'E-Mail: ' });
  }

  rows.push({ key: 'form', Icon: FormIcon, text: 'Nachricht senden', href: '/kontakt' });

  return rows;
}

export function Footer({
  content,
  isAdmin = false,
  liveEditor,
  contactEmail,
  sponsorGroups = [],
}: {
  content: FooterContent;
  isAdmin?: boolean;
  liveEditor?: LiveEditorContent;
  contactEmail?: string;
  /** Sponsoren der Footer-Stufe (z. B. Bühnenbauer): kleine Logos im Footer. */
  sponsorGroups?: SponsorPackageGroup[];
}) {
  const year = new Date().getFullYear();
  const resolvedContactEmail = (content.contactEmail || contactEmail || '').trim();
  const contactHeading = content.contactHeading?.trim() || 'Kontakt';
  const contactRows = buildFooterContactRows(content, resolvedContactEmail);

  return (
    <footer className="relative mt-6 border-t border-[color:var(--color-border)] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-background)_88%,black)_0%,var(--color-background)_100%)] sm:mt-8">
      <div className="fire-divider" />
      {/* Seitliches Padding wie der Hauptinhalt der Startseite (px-4 sm:px-6 lg:px-8), damit die Kanten bündig sind. */}
      <div className="site-shell w-full px-4 py-14 text-center sm:px-6 lg:px-8">
        {isAdmin ? (
          <section className="mb-8 rounded-[1.4rem] border border-[#ff9d3c]/30 bg-[#130d09]/92 p-5 text-left shadow-[0_20px_50px_rgba(0,0,0,0.25)] backdrop-blur-sm">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffcf98]">Footer</p>
              <p className="mt-1 text-sm text-[#f3dec4]">Social Links und Kontakt für alle öffentlichen Seiten pflegen. Der Link „Nachricht senden“ führt fest auf die Kontaktseite.</p>
            </div>
            {/* Beschreibung, Informationen und Kontaktlinks werden im Footer nicht mehr angezeigt und sind deshalb
                nicht mehr im Formular. updateFooterAction behält bei fehlenden Feldern die gespeicherten Werte. */}
            <form action={updateFooterAction} className="grid gap-4">
              <div className="grid gap-4 lg:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Facebook URL</span>
                  <input name="footerFacebookUrl" defaultValue={content.socialLinks.find((link) => link.platform === 'facebook')?.href || ''} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Instagram URL</span>
                  <input name="footerInstagramUrl" defaultValue={content.socialLinks.find((link) => link.platform === 'instagram')?.href || ''} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">TikTok URL optional</span>
                  <input name="footerTiktokUrl" defaultValue={content.socialLinks.find((link) => link.platform === 'tiktok')?.href || ''} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                </label>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Überschrift Kontakt</span>
                  <input name="footerContactHeading" defaultValue={content.contactHeading || 'Kontakt'} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Footer E-Mail optional</span>
                  <input name="footerContactEmail" defaultValue={content.contactEmail || resolvedContactEmail} placeholder={resolvedContactEmail || 'name@beispiel.de'} className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[color:var(--color-accent)]" />
                </label>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="rounded-xl bg-[color:var(--color-accent)] px-5 py-3 text-sm font-black text-black transition hover:brightness-110">Footer speichern</button>
              </div>
            </form>
          </section>
        ) : null}

        {/* Kontaktbereich: Überschrift „Kontakt“, darunter je eine Zeile aus Icon und Text (beides ein Link):
            Social-Profile, E-Mail, Kontaktformular. Kein Logo – das steht schon in der Navigation. */}
        <LiveResizableBox
          boxKey="footer.top.brand.box"
          initialStyle={resolveLiveBoxStyle(liveEditor, 'footer.top.brand.box')}
          isAdmin={isAdmin}
          lockHorizontal
          growWithContent
          className="rounded-[1.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(22,14,10,0.92)_0%,rgba(10,7,5,0.85)_100%)] p-6 text-left shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
        >
          <h2 className="text-[1.35rem] font-black leading-[1.05] sm:text-[1.8rem]">{contactHeading}</h2>
          <ul className="mt-5 flex flex-col gap-3">
            {contactRows.map((row) => {
              const opensNewTab = isExternalUrl(row.href) && !row.href.startsWith('mailto:');

              return (
                <li key={row.key}>
                  <a
                    href={row.href}
                    target={opensNewTab ? '_blank' : undefined}
                    rel={opensNewTab ? 'noreferrer noopener' : undefined}
                    className="group inline-flex max-w-full items-center gap-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-background)]"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-surface-2)_92%,black)_0%,color-mix(in_srgb,var(--color-surface)_76%,black)_100%)] text-[color:var(--text-link)] ring-1 ring-[color:var(--color-border)] transition-all group-hover:ring-[color:var(--color-accent)]">
                      <row.Icon className="h-5 w-5" />
                    </span>
                    {/* Farbe per Utility statt .link-copy: die Klasse steht ohne Layer, group-hover würde nicht greifen. */}
                    <span className="min-w-0 text-sm font-semibold text-[color:var(--text-link)] [overflow-wrap:anywhere] transition-colors group-hover:text-white">
                      {row.srPrefix ? <span className="sr-only">{row.srPrefix}</span> : null}
                      {row.text}
                      {opensNewTab ? <span className="sr-only"> (öffnet in neuem Tab)</span> : null}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </LiveResizableBox>

        {sponsorGroups.length ? (
          // Bühnenbauer-Sponsoren: kleine Logos im Footer. Der Bereich erscheint
          // nur, wenn mindestens ein Sponsor dieser Stufe vorhanden ist.
          <section id="footer-sponsoren" aria-label="Sponsoren im Footer" className="mt-8 scroll-mt-32 space-y-6 rounded-[1.4rem] border border-white/10 bg-black/15 p-5">
            {sponsorGroups.map((group) => (
              <div key={group.package.id}>
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-[color:var(--color-accent-soft)]">{group.package.name}</h2>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  {group.partners.map((partner) => (
                    <PartnerTile key={partner.id} partner={partner} size="footer" />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ) : null}

        <div className="mt-8 flex w-full justify-center">
          <LiveResizableBox
            boxKey="footer.legal.box"
            initialStyle={resolveLiveBoxStyle(liveEditor, 'footer.legal.box')}
            isAdmin={isAdmin}
            lockHorizontal
            growWithContent
            className="w-full"
          >
            <div className="body-copy flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-3 border-t border-[color:var(--color-border)] pt-5 text-center text-sm">
              <p>
                © {year}{' '}
                <LiveEditableText as="span" className="inline" editorKey="footer.copyrightName" initialHtml={resolveLiveHtml(liveEditor, 'footer.copyrightName', content.copyrightName)} isAdmin={isAdmin} title="Footer Copyright" />
              </p>
              <a href="/impressum" className="link-copy transition-colors">Impressum</a>
              <a href="/datenschutz" className="link-copy transition-colors">Datenschutz</a>
              <a href="/agb" className="link-copy transition-colors">AGB</a>
            </div>
          </LiveResizableBox>
        </div>
      </div>
    </footer>
  );
}

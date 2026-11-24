import { getImageProps } from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { getPathname } from '@/i18n/navigation';
import { ArtImage } from './art-image';
import horizon from './assets/footer-horizon.webp';
import logo from './assets/opta-horizontal-light.svg';
import whatsapp from './assets/whatsapp.svg';
import styles from './site-frame.module.css';

// The same mark as the header's, with the wordmark in the paper colour for the dark band. Below the fold on every page, so lazy
const { props: logoProps } = getImageProps({ src: logo, alt: '', width: 176, loading: 'lazy' });

// WhatsApp's own round mark, green included: its colour is the brand's, so it lives in the file and not in the theme
const { props: whatsappProps } = getImageProps({ src: whatsapp, alt: '', width: 56, height: 56 });

// The home's sections, in page order: the footer links to them from every page
const sections = ['places', 'method', 'tourism', 'allies', 'faq'] as const;

// Plain HTML instead of Mantine's Container, Group or Anchor: on every route they add client JS (Group measured 33 B), and the budget
// only goes down. Every link is a plain anchor too: the sticky footer always sits in the viewport (covered, which IntersectionObserver
// ignores), so a next-intl Link would prefetch its target on every page view
const SiteFooter = () => {
  const locale = useLocale();
  const t = useTranslations('SiteShell');
  const home = getPathname({ locale, href: '/' });

  return (
    // The band re-resolves the theme's tokens to dark; the horizon above it paints nothing of its own, so its sky fades into the page
    <footer data-theme="dark" className={styles.footer}>
      <div className={styles.horizon}>
        <ArtImage src={horizon} sizes="100vw" className={styles.horizonArt} />
      </div>
      <div className={styles.band}>
        <div className={styles.columns}>
          <div className={styles.brand}>
            {/* Decorative: the line below names Ruta Opta and its foundation */}
            <img {...logoProps} alt="" className={styles.logo} />
            <p className={`${styles.mission} t-body-lg`}>{t('footer.mission')}</p>
            <p className="t-body-sm">{t('footer.initiative')}</p>
          </div>
          <nav aria-labelledby="footer-explore" className={styles.column}>
            <h2 id="footer-explore" className="t-overline">
              {t('footer.explore')}
            </h2>
            {/* list-style: none drops the list role in Safari */}
            <ul role="list" className="t-body-md">
              {sections.map((section) => (
                <li key={section}>
                  <a href={`${home}#${section}`}>{t(`sections.${section}`)}</a>
                </li>
              ))}
            </ul>
          </nav>
          <div className={styles.column}>
            <h2 className="t-overline">{t('footer.contact')}</h2>
            <ul role="list" className="t-body-md">
              <li>
                <a href={`https://wa.me/${t('footer.whatsappNumber')}`} className={styles.phone}>
                  {t('footer.whatsapp')}
                </a>
              </li>
              <li>
                <a href={`mailto:${t('footer.infoEmail')}`}>{t('footer.infoEmail')}</a>
              </li>
              <li>
                {/* The glyph is decorative: the link's text already says the network and the handle */}
                <a href={t('footer.instagramUrl')} className={styles.social}>
                  <svg viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                    <path d="M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
                    <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0-6 0" />
                    <path d="M16.5 7.5v.01" />
                  </svg>
                  {t('footer.instagram')}
                </a>
              </li>
              <li>{t('footer.place')}</li>
            </ul>
          </div>
          <div className={styles.column}>
            <h2 className="t-overline">{t('footer.legal')}</h2>
            <ul role="list" className="t-body-md">
              <li>
                <a href={getPathname({ locale, href: '/privacy' })}>{t('footer.privacy')}</a>
              </li>
              <li>
                <a href={`mailto:${t('footer.email')}`}>{t('footer.email')}</a>
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.rights}>
          {/* A string, so the year is not formatted as a number (2,026 in English) */}
          <p className="t-body-sm">{t('footer.rights', { year: String(new Date().getFullYear()) })}</p>
        </div>
      </div>
    </footer>
  );
};

// The button that floats over every page and over the footer. A plain anchor, like the footer's links: no Mantine Affix, so no client JS
const WhatsappButton = () => {
  const t = useTranslations('SiteShell');

  return (
    <a href={`https://wa.me/${t('footer.whatsappNumber')}`} target="_blank" rel="noopener noreferrer" aria-label={t('whatsappFloat.label')} className={styles.whatsapp}>
      <img {...whatsappProps} alt="" className={styles.whatsappMark} />
    </a>
  );
};

// The reveal footer: the page sits on an opaque layer above the footer, which the end of the scroll uncovers where the whole footer fits
export const SiteFrame = ({ children }: { children: ReactNode }) => (
  <>
    <div className={styles.content}>{children}</div>
    <SiteFooter />
    <WhatsappButton />
  </>
);

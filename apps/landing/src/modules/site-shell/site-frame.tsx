import { useLocale, useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { getPathname } from '@/i18n/navigation';
import styles from './site-frame.module.css';

// Plain blocks instead of Mantine's Container and Group: on every route they add client JS (Group measured 33 B), and the budget only goes down.
// The privacy link is a plain anchor too: the sticky footer always sits in the viewport (covered, which IntersectionObserver ignores), so a
// next-intl Link would prefetch /privacy on every page view
const SiteFooter = () => {
  const locale = useLocale();
  const t = useTranslations('SiteShell.footer');

  return (
    <footer className={styles.footer}>
      <div className={styles.bar}>
        <p className="t-body-sm">{t('initiative')}</p>
        <div className={styles.links}>
          <a className="t-body-sm" href={getPathname({ locale, href: '/privacy' })}>
            {t('privacy')}
          </a>
          <a className="t-body-sm" href={`mailto:${t('email')}`}>
            {t('email')}
          </a>
        </div>
      </div>
    </footer>
  );
};

// The reveal footer: the page sits on an opaque layer above the footer, which the end of the scroll uncovers
export const SiteFrame = ({ children }: { children: ReactNode }) => (
  <>
    <div className={styles.content}>{children}</div>
    <SiteFooter />
  </>
);

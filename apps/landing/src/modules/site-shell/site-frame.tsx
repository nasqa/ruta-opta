import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import styles from './site-frame.module.css';

// Plain blocks instead of Mantine's Container and Group: on every route they add client JS (Group measured 33 B), and the budget only goes down
const SiteFooter = () => {
  const t = useTranslations('SiteShell.footer');

  return (
    <footer className={styles.footer}>
      <div className={styles.bar}>
        <p className="t-body-sm">{t('initiative')}</p>
        <div className={styles.links}>
          <Link className="t-body-sm" href="/privacy">
            {t('privacy')}
          </Link>
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

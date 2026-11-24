import { Badge } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { ArtImage } from '@/modules/site-shell';
import tourismArt from '../../_art/home-tourism.webp';
import layout from './layout.module.css';
import styles from './tourism.module.css';

const principles = ['designed', 'decides', 'price'] as const;

// The page's one inset panel: what is being built, marked as in progress, with one quiet action towards the list
export const Tourism = () => {
  const t = useTranslations('Prelaunch');

  return (
    <section id="tourism" className={`${layout.band} ${layout.canvas}`} aria-labelledby="tourism-title">
      <div className={layout.inner}>
        <div className={styles.panel}>
          <div className={styles.media}>
            <ArtImage src={tourismArt} sizes="(min-width: 62em) 50vw, 100vw" className={styles.art} />
          </div>
          <div className={styles.body}>
            <p className={`${styles.overline} t-overline`}>{t('tourismOverline')}</p>
            <h2 id="tourism-title" className="t-heading-lg">
              {t('tourism.title')}
            </h2>
            <Badge className={styles.status}>{t('tourism.status')}</Badge>
            <p className="t-body-lg">{t('tourism.text')}</p>
            <div className={styles.principles}>
              <p id="tourism-principles" className="t-label">
                {t('tourismPrinciples.label')}
              </p>
              {/* list-style: none drops the list role in Safari */}
              <ul role="list" aria-labelledby="tourism-principles">
                {principles.map((principle) => (
                  <li key={principle} className="t-body-md">
                    {t(`tourismPrinciples.${principle}`)}
                  </li>
                ))}
              </ul>
            </div>
            <a className={`${styles.link} t-body-md`} href="#lista">
              {t('tourismLink')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

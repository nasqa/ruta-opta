import { Button } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { SceneBand } from '@/modules/site-shell';
import heroArt from '../../_art/home-hero.webp';
import styles from './hero.module.css';

export const Hero = () => {
  const t = useTranslations('Prelaunch');

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.text}>
        <p className={`${styles.overline} t-overline`}>{t('overline')}</p>
        <h1 id="hero-title" className="t-display-lg">
          {t('title')}
        </h1>
        <p className="t-body-lg">{t('lead')}</p>
        <div className={styles.actions}>
          <Button component="a" href="#lista">
            {t('cta')}
          </Button>
          <Button component="a" href="#allies" variant="default">
            {t('ctaAllies')}
          </Button>
        </div>
        <p className={`${styles.note} t-body-sm`}>{t('ctaNote')}</p>
      </div>
      {/* Reserved and tinted before the art arrives, so a slow connection shows a panel and not a floating sun. From 62em it runs from
          the text column to the right edge of the window: about 55 % of the width there */}
      <div className={styles.art}>
        <SceneBand scene={heroArt} height="hero" sun sizes="(min-width: 62em) 55vw, 100vw" />
      </div>
    </section>
  );
};

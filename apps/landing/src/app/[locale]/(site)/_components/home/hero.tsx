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
        <h1 id="hero-title" className="t-display-md">
          {t('title')}
        </h1>
        <p className="t-body-lg">{t('lead')}</p>
        <Button component="a" href="#lista" className={styles.cta}>
          {t('cta')}
        </Button>
      </div>
      <SceneBand scene={heroArt} height="hero" sun />
    </section>
  );
};

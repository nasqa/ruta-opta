import { Button } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { mailtoHref, whatsappHref } from './contact-links';
import styles from './allies.module.css';

export const Allies = () => {
  const t = useTranslations('Prelaunch');

  return (
    <section className={styles.section} aria-labelledby="allies-title">
      <h2 id="allies-title" className="t-heading-lg">
        {t('allies.title')}
      </h2>
      <p className="t-body-lg">{t('allies.text')}</p>
      <div className={styles.cards}>
        <div className={styles.card}>
          <h3 className="t-heading-md">{t('allies.whatsapp.title')}</h3>
          <Button
            component="a"
            href={whatsappHref(t('allies.whatsapp.number'), t('allies.whatsapp.message'))}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('allies.whatsapp.label')}
          </Button>
        </div>
        <div className={styles.card}>
          <h3 className="t-heading-md">{t('allies.email.title')}</h3>
          <Button component="a" href={mailtoHref(t('allies.email.address'), t('allies.email.subject'))}>
            {t('allies.email.label')}
          </Button>
        </div>
      </div>
    </section>
  );
};

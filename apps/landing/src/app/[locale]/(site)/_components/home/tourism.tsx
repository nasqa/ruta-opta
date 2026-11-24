import { Badge } from '@mantine/core';
import { useTranslations } from 'next-intl';
import styles from './tourism.module.css';

export const Tourism = () => {
  const t = useTranslations('Prelaunch');

  return (
    <section className={styles.section} aria-labelledby="tourism-title">
      <h2 id="tourism-title" className="t-heading-lg">
        {t('tourism.title')}
      </h2>
      <Badge className={styles.status}>{t('tourism.status')}</Badge>
      <p className="t-body-lg">{t('tourism.text')}</p>
    </section>
  );
};

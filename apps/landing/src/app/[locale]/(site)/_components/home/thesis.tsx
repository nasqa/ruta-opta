import { useTranslations } from 'next-intl';
import styles from './thesis.module.css';

const territories = ['quindio', 'risaralda', 'caldas', 'valle', 'choco'] as const;

export const Thesis = () => {
  const t = useTranslations('Prelaunch');

  return (
    <section className={styles.section} aria-labelledby="thesis-title">
      <h2 id="thesis-title" className="t-heading-lg">
        {t('thesis.title')}
      </h2>
      <p className="t-body-lg">{t('thesis.text')}</p>
      <ul className={styles.territories} aria-label={t('thesis.territoriesLabel')}>
        {territories.map((territory) => (
          <li key={territory} className={`${styles.territory} t-title`}>
            {t(`thesis.territories.${territory}`)}
          </li>
        ))}
      </ul>
    </section>
  );
};

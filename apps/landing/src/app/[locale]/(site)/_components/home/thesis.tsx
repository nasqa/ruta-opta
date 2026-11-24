import { useTranslations } from 'next-intl';
import layout from './layout.module.css';
import styles from './thesis.module.css';

const verbs = ['listen', 'recognize', 'connect', 'build'] as const;

// The page's pause: one statement and its argument, the four verbs of the method as a typographic strip, and the stance
export const Thesis = () => {
  const t = useTranslations('Prelaunch');

  return (
    <section className={`${layout.band} ${layout.subtle}`} aria-labelledby="thesis-title">
      <div className={`${layout.inner} ${styles.layout}`}>
        <h2 id="thesis-title" className={`${styles.title} t-display-md`}>
          {t('thesis.title')}
        </h2>
        <p className={`${styles.text} t-body-lg`}>{t('thesis.text')}</p>
        {/* list-style: none drops the list role in Safari */}
        <ul className={styles.verbs} role="list" aria-label={t('thesis.verbsLabel')}>
          {verbs.map((verb) => (
            <li key={verb} className={`${styles.verb} t-heading-md`}>
              {t(`thesis.verbs.${verb}`)}
            </li>
          ))}
        </ul>
        <p className={`${styles.stance} t-heading-sm`}>{t('thesis.stance')}</p>
      </div>
    </section>
  );
};

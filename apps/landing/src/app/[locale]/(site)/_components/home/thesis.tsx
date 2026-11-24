import { useTranslations } from 'next-intl';
import layout from './layout.module.css';
import styles from './thesis.module.css';

const commitments = ['listen', 'recognize', 'connect', 'decide'] as const;

// The page's pause: why Ruta Opta exists, in the founder's own words, and the four commitments of how it will work
export const Thesis = () => {
  const t = useTranslations('Prelaunch');

  return (
    <section className={`${layout.band} ${layout.subtle}`} aria-labelledby="thesis-title">
      <div className={`${layout.inner} ${styles.layout}`}>
        <h2 id="thesis-title" className={`${styles.title} t-display-md`}>
          {t('thesis.title')}
        </h2>
        <p className={`${styles.text} t-body-lg`}>{t('thesis.text')}</p>
        <figure className={styles.stance}>
          {/* A signed statement approved by its author, not a quotation of something she said: no blockquote */}
          <div className={`${styles.quote} t-heading-sm`}>
            <p>{t('thesis.stance')}</p>
          </div>
          <figcaption className="t-label">{t('thesis.stanceAuthor')}</figcaption>
        </figure>
        <div className={styles.commitments}>
          <p id="thesis-commitments" className={`${styles.commitmentsLabel} t-label`}>
            {t('thesis.commitmentsLabel')}
          </p>
          {/* list-style: none drops the list role in Safari */}
          <ul role="list" aria-labelledby="thesis-commitments" className={styles.list}>
            {commitments.map((commitment) => (
              <li key={commitment} className={styles.commitment}>
                <h3 className="t-heading-md">{t(`thesis.commitments.${commitment}.title`)}</h3>
                <p className="t-body-md">{t(`thesis.commitments.${commitment}.text`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

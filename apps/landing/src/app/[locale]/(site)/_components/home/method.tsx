import { useTranslations } from 'next-intl';
import styles from './method.module.css';

const stages = ['grow', 'create', 'connect'] as const;

export const Method = () => {
  const t = useTranslations('Prelaunch');

  return (
    <section className={styles.section} aria-labelledby="method-title">
      <h2 id="method-title" className="t-heading-lg">
        {t('methodTitle')}
      </h2>
      {/* list-style: none drops the list role in Safari; the numbers are drawn by CSS counters */}
      <ol className={styles.steps} role="list">
        {stages.map((stage) => (
          <li key={stage} className={styles.step}>
            <div className={styles.card}>
              <h3 className="t-heading-md">{t(`stages.${stage}.name`)}</h3>
              <p className="t-title">{t(`stages.${stage}.tagline`)}</p>
              <p className="t-body-md">{t(`stages.${stage}.text`)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};

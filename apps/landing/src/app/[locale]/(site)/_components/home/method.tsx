import { useTranslations } from 'next-intl';
import { ArtImage } from '@/modules/site-shell';
import connect from '../../_art/home-method-connect.webp';
import create from '../../_art/home-method-create.webp';
import grow from '../../_art/home-method-grow.webp';
import layout from './layout.module.css';
import styles from './method.module.css';

const stages = [
  ['grow', grow],
  ['create', create],
  ['connect', connect],
] as const;

export const Method = () => {
  const t = useTranslations('Prelaunch');

  return (
    <section id="method" className={`${layout.band} ${layout.subtle}`} aria-labelledby="method-title">
      <div className={layout.inner}>
        <div className={layout.head}>
          <h2 id="method-title" className="t-heading-lg">
            {t('methodTitle')}
          </h2>
          <p className="t-body-lg">{t('methodLead')}</p>
        </div>
        {/* list-style: none drops the list role in Safari; the step numbers are drawn by CSS counters */}
        <ol className={styles.steps} role="list">
          {stages.map(([stage, art]) => (
            <li key={stage} className={styles.step}>
              <ArtImage src={art} sizes="(min-width: 48em) 40vw, 60vw" className={`${layout.piece} ${styles.art}`} />
              <div className={styles.text}>
                <h3 className="t-heading-lg">{t(`stages.${stage}.name`)}</h3>
                <p className="t-title">{t(`stages.${stage}.tagline`)}</p>
                <p className="t-body-md">{t(`stages.${stage}.text`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

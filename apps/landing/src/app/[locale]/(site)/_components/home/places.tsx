import { useTranslations } from 'next-intl';
import { ArtImage } from '@/modules/site-shell';
import caldas from '../../_art/home-place-caldas.webp';
import choco from '../../_art/home-place-choco.webp';
import quindio from '../../_art/home-place-quindio.webp';
import risaralda from '../../_art/home-place-risaralda.webp';
import valle from '../../_art/home-place-valle.webp';
import layout from './layout.module.css';
import styles from './places.module.css';

// In the order the tests guard; each with its own cut-paper piece
const territories = [
  ['quindio', quindio],
  ['risaralda', risaralda],
  ['caldas', caldas],
  ['valle', valle],
  ['choco', choco],
] as const;

export const Places = () => {
  const t = useTranslations('Prelaunch');

  return (
    <section id="places" className={`${layout.band} ${layout.canvas}`} aria-labelledby="places-title">
      <div className={layout.inner}>
        <div className={layout.head}>
          <h2 id="places-title" className="t-heading-lg">
            {t('places.title')}
          </h2>
          <p className="t-body-lg">{t('places.lead')}</p>
        </div>
        {/* list-style: none drops the list role in Safari */}
        <ul className={styles.grid} role="list" aria-label={t('thesis.territoriesLabel')}>
          {territories.map(([territory, art]) => (
            <li key={territory} className={styles.place}>
              <ArtImage src={art} sizes="(min-width: 62em) 216px, (min-width: 48em) 30vw, 45vw" className={layout.piece} />
              <div className={styles.caption}>
                <h3 className="t-heading-sm">{t(`thesis.territories.${territory}`)}</h3>
                <p className="t-body-sm">{t(`places.${territory}`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

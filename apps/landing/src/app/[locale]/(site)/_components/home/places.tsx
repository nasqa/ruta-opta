import { useTranslations } from 'next-intl';
import { ArtImage } from '@/modules/site-shell';
import caldas from '../../_art/home-place-caldas.webp';
import choco from '../../_art/home-place-choco.webp';
import narino from '../../_art/home-place-narino.webp';
import quindio from '../../_art/home-place-quindio.webp';
import risaralda from '../../_art/home-place-risaralda.webp';
import valle from '../../_art/home-place-valle.webp';
import layout from './layout.module.css';
import styles from './places.module.css';

// The first territory has a plan; the other five do not yet, and the page says so by giving the first one its own place instead of
// repeating one line six times. In the order the tests guard; each with its own cut-paper piece
const next = [
  ['risaralda', risaralda],
  ['caldas', caldas],
  ['valle', valle],
  ['choco', choco],
  ['narino', narino],
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
        <div role="group" aria-label={t('thesis.territoriesLabel')} className={styles.group}>
          <div className={styles.first}>
            <ArtImage src={quindio} sizes="(min-width: 48em) 30vw, 60vw" className={layout.piece} />
            <div className={styles.firstText}>
              <p className="t-label">{t('places.status.design')}</p>
              <h3 className="t-heading-md">{t('thesis.territories.quindio')}</h3>
              <p className="t-body-md">{t('places.quindio')}</p>
            </div>
          </div>
          <p id="places-next" className={`${styles.nextLabel} t-label`}>
            {t('places.nextLabel')}
          </p>
          {/* list-style: none drops the list role in Safari */}
          <ul className={styles.grid} role="list" aria-labelledby="places-next">
            {next.map(([territory, art]) => (
              <li key={territory} className={styles.place}>
                <ArtImage src={art} sizes="(min-width: 75em) 216px, (min-width: 48em) 30vw, 45vw" className={layout.piece} />
                <div className={styles.caption}>
                  <h3 className="t-heading-sm">{t(`thesis.territories.${territory}`)}</h3>
                  <p className="t-label">{t('places.status.upcoming')}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

import { Button } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { mailtoHref, whatsappHref } from './contact-links';
import { CopyEmail } from './copy-email';
import layout from './layout.module.css';
import styles from './allies.module.css';

const allyKinds = ['companies', 'agencies', 'lodgings', 'institutions', 'people'] as const;

export const Allies = () => {
  const t = useTranslations('Prelaunch');
  const address = t('allies.email.address');

  return (
    <section id="allies" className={`${layout.band} ${layout.subtle}`} aria-labelledby="allies-title">
      <div className={`${layout.inner} ${styles.layout}`}>
        <div className={styles.intro}>
          <h2 id="allies-title" className="t-heading-lg">
            {t('allies.title')}
          </h2>
          <p className="t-body-lg">{t('allies.text')}</p>
          <div className={styles.kinds}>
            <p id="allies-kinds" className={`${styles.kindsTitle} t-label`}>
              {t('alliesFor.title')}
            </p>
            {/* list-style: none drops the list role in Safari; the wrapper clips each line's leading hairline */}
            <div className={styles.kindsClip}>
              <ul role="list" aria-labelledby="allies-kinds" className={`${styles.kindsList} t-body-md`}>
                {allyKinds.map((kind) => (
                  <li key={kind}>{t(`alliesFor.${kind}`)}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className={styles.cards}>
          <div className={styles.card}>
            <h3 className="t-heading-md">{t('allies.whatsapp.title')}</h3>
            <p className="t-body-md">{t('alliesWhatsappText')}</p>
            <Button
              component="a"
              href={whatsappHref(t('allies.whatsapp.number'), t('allies.whatsapp.message'))}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('allies.whatsapp.opensNewTab', { label: t('allies.whatsapp.label') })}
            >
              {t('allies.whatsapp.label')}
            </Button>
          </div>
          <div className={styles.card}>
            <h3 className="t-heading-md">{t('allies.email.title')}</h3>
            <p className="t-body-md">{t('alliesEmailText')}</p>
            {/* Many phones have no mail app set up: the address stays readable, selectable and copyable next to the button */}
            <p className={`${styles.address} t-title`}>{address}</p>
            <div className={styles.actions}>
              <Button component="a" href={mailtoHref(address, t('allies.email.subject'))}>
                {t('allies.email.label')}
              </Button>
              <CopyEmail address={address} copyLabel={t('copyEmail')} copiedLabel={t('copiedEmail')} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

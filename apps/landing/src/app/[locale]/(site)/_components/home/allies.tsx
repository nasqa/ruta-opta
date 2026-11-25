import { Button } from '@mantine/core';
import { useTranslations } from 'next-intl';
import { allyRoutes, eventProps } from '@/modules/analytics/server';
import { mailtoHref, whatsappHref } from './contact-links';
import { CopyEmail } from './copy-email';
import layout from './layout.module.css';
import styles from './allies.module.css';

// One route per kind of ally, each named by the verb the ally performs. The WhatsApp message and the email subject arrive already
// written for that kind, so a lead reaches the inbox qualified without the site collecting anything from it
export const Allies = () => {
  const t = useTranslations('Prelaunch');
  const address = t('allies.email.address');
  const number = t('allies.whatsapp.number');

  return (
    <section id="allies" className={`${layout.band} ${layout.subtle}`} aria-labelledby="allies-title">
      <div className={`${layout.inner} ${styles.layout}`}>
        <div className={styles.intro}>
          <h2 id="allies-title" className="t-heading-lg">
            {t('allies.title')}
          </h2>
          <p className="t-body-lg">{t('allies.text')}</p>
        </div>
        {/* list-style: none drops the list role in Safari */}
        <ul role="list" aria-labelledby="allies-title" className={styles.routes}>
          {allyRoutes.map((route) => {
            const verb = t(`allies.routes.${route}.verb`);
            const cta = t(`allies.routes.${route}.cta`);
            return (
              <li key={route} className={styles.route}>
                <h3 className="t-heading-md">{verb}</h3>
                <p className={`${styles.who} t-label`}>{t(`allies.routes.${route}.who`)}</p>
                <p className="t-body-md">{t(`allies.routes.${route}.offer`)}</p>
                <div className={styles.routeActions}>
                  <Button
                    {...eventProps(`ally-${route}-whatsapp`)}
                    component="a"
                    href={whatsappHref(number, t(`allies.routes.${route}.message`))}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('allies.whatsapp.opensNewTab', { label: cta })}
                  >
                    {cta}
                  </Button>
                  <a
                    {...eventProps(`ally-${route}-email`, `${styles.byEmail} t-body-md`)}
                    href={mailtoHref(address, t(`allies.routes.${route}.subject`))}
                    aria-label={t('allies.byEmailFor', { label: t('allies.byEmail'), verb })}
                  >
                    {t('allies.byEmail')}
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
        <p className={`${styles.ask} t-body-md`}>{t('allies.ask')}</p>
        <div className={styles.other}>
          <h3 className="t-heading-md">{t('alliesOther.title')}</h3>
          <div className={styles.cards}>
            <div className={styles.card}>
              <h4 className="t-heading-sm">{t('allies.whatsapp.title')}</h4>
              <p className="t-body-md">{t('alliesOther.whatsappText')}</p>
              <Button
                {...eventProps('ally-other-whatsapp')}
                component="a"
                href={whatsappHref(number, t('allies.whatsapp.message'))}
                target="_blank"
                rel="noopener noreferrer"
                variant="default"
                aria-label={t('allies.whatsapp.opensNewTab', { label: t('allies.whatsapp.label') })}
              >
                {t('allies.whatsapp.label')}
              </Button>
            </div>
            <div className={styles.card}>
              <h4 className="t-heading-sm">{t('allies.email.title')}</h4>
              <p className="t-body-md">{t('alliesOther.emailText')}</p>
              {/* Many phones have no mail app set up: the address stays readable, selectable and copyable next to the button */}
              <p className={`${styles.address} t-title`}>{address}</p>
              <div className={styles.actions}>
                <Button component="a" href={mailtoHref(address, t('allies.email.subject'))} variant="default" {...eventProps('ally-other-email')}>
                  {t('allies.email.label')}
                </Button>
                <CopyEmail address={address} copyLabel={t('copyEmail')} copiedLabel={t('copiedEmail')} tracking={eventProps('copy-email')} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import { useLocale, useTranslations } from 'next-intl';
import { getPathname } from '@/i18n/navigation';
import { FaqAccordion, type FaqItem } from './faq-accordion';
import layout from './layout.module.css';
import styles from './faq.module.css';

const questions = ['what', 'when', 'book', 'donate', 'allies', 'data'] as const;

export const Faq = () => {
  const locale = useLocale();
  const t = useTranslations('Prelaunch');
  // The data answer ends at the policy itself; a plain anchor, as in the footer
  const privacy = { href: getPathname({ locale, href: '/privacy' }), label: t('privacyLink') };
  const items: FaqItem[] = questions.map((value) => ({
    value,
    question: t(`faq.${value}.q`),
    answer: t(`faq.${value}.a`),
    link: value === 'data' ? privacy : undefined,
  }));
  // Without JavaScript the accordion cannot open, and its closed panels are hidden from everyone: it gives way to a plain list
  const withoutScript = `.${styles.accordion}{display:none}`;

  return (
    <section id="faq" className={`${layout.band} ${layout.canvas}`} aria-labelledby="faq-title">
      <div className={`${layout.inner} ${styles.layout}`}>
        <h2 id="faq-title" className="t-heading-lg">
          {t('faq.title')}
        </h2>
        <div>
          <FaqAccordion items={items} className={styles.accordion} />
          <noscript>
            <style dangerouslySetInnerHTML={{ __html: withoutScript }} />
            <dl className={styles.fallback}>
              {items.map(({ value, question, answer, link }) => (
                <div key={value}>
                  <dt className="t-title">{question}</dt>
                  <dd className={styles.content}>
                    <p className="t-body-md">{answer}</p>
                    {link && (
                      <a className="t-body-md" href={link.href}>
                        {link.label}
                      </a>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </noscript>
        </div>
      </div>
    </section>
  );
};

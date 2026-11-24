'use client';

import { Accordion } from '@mantine/core';
import styles from './faq.module.css';

export type FaqItem = { value: string; question: string; answer: string; link?: { href: string; label: string } };

// Accordion is compound and stateful, so it lives in this island and gets its strings translated. Closed panels stay in the HTML
// (display-none, not React's Activity, which leaves hidden content out of the server render); without JavaScript the route shows a
// plain list instead (see faq.tsx)
export const FaqAccordion = ({ items, className }: { items: FaqItem[]; className: string }) => (
  <Accordion multiple order={3} keepMountedMode="display-none" className={className} classNames={{ label: 't-title', content: styles.content }}>
    {items.map(({ value, question, answer, link }) => (
      <Accordion.Item key={value} value={value}>
        <Accordion.Control>{question}</Accordion.Control>
        <Accordion.Panel>
          <p className="t-body-md">{answer}</p>
          {link && (
            <a className="t-body-md" href={link.href}>
              {link.label}
            </a>
          )}
        </Accordion.Panel>
      </Accordion.Item>
    ))}
  </Accordion>
);

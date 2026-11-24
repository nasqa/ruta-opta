import { getImageProps } from 'next/image';
import type { ReactNode } from 'react';
import icon from './assets/opta-icon.svg';
import styles from './scene-card.module.css';

// 56 px; the CSS module narrows it to 48 px on phones. Decorative: the card's heading says what the page is
const { props: markProps } = getImageProps({ src: icon, alt: '', width: 56, loading: 'eager' });

type SceneCardProps = { width?: 'narrow' | 'wide'; mark?: boolean; children: ReactNode };

// Trama's Card and Stack drawn with their own tokens: as Mantine components, exported from index.ts, they added client JS to every route.
// The mark (the ring) opens only a card about something that went right
export const SceneCard = ({ width = 'narrow', mark = false, children }: SceneCardProps) => (
  <div className={`${styles.card} ${styles[width]}`}>
    {mark && <img {...markProps} alt="" className={styles.mark} />}
    {children}
  </div>
);

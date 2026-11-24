import type { ReactNode } from 'react';
import styles from './scene-card.module.css';

type SceneCardProps = { width?: 'narrow' | 'wide'; children: ReactNode };

// Trama's Card and Stack drawn with their own tokens: as Mantine components, exported from index.ts, they added client JS to every route
export const SceneCard = ({ width = 'narrow', children }: SceneCardProps) => <div className={`${styles.card} ${styles[width]}`}>{children}</div>;

import { getImageProps, type StaticImageData } from 'next/image';
import sunArt from './assets/sun.svg';
import styles from './scene-band.module.css';

// The mark with its paper-cut shadow baked into the SVG: allowed only inside an illustration, never as a CSS effect
const { props: sunProps } = getImageProps({ src: sunArt, alt: '', loading: 'eager' });

type SceneBandProps = { scene: StaticImageData; height: 'tall' | 'short' | 'strip' | 'hero'; imageClassName?: string; sun?: boolean };

export const SceneBand = ({ scene, height, imageClassName, sun = false }: SceneBandProps) => {
  // A band above the fold is the likely LCP element: one source, fetched first, never lazy
  const { props } = getImageProps({ src: scene, alt: '', sizes: '100vw', loading: 'eager', fetchPriority: 'high' });

  return (
    <div className={`${styles.band} ${styles[height]}`}>
      <img {...props} alt="" className={imageClassName ? `${styles.scene} ${imageClassName}` : styles.scene} />
      {sun && <img {...sunProps} alt="" className={styles.sun} />}
    </div>
  );
};

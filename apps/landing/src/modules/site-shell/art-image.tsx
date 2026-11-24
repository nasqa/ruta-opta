import { getImageProps, type StaticImageData } from 'next/image';

type ArtImageProps = { src: StaticImageData; sizes: string; className?: string; alt?: string };

// Art below the fold: lazy, decoded off the main thread, and sized by the file's own width and height so nothing moves when it
// arrives. Decorative by default, since every piece sits next to its own visible label
export const ArtImage = ({ src, sizes, className, alt = '' }: ArtImageProps) => {
  const { props } = getImageProps({ src, alt, sizes, loading: 'lazy' });

  return <img {...props} alt={alt} decoding="async" className={className} />;
};

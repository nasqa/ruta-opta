import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import styles from './not-found.module.css';

const NotFoundPage = () => {
  const t = useTranslations('NotFound');

  return (
    <main className={styles.page}>
      <h1 className="t-display-md">{t('title')}</h1>
      <Link className="t-body-lg" href="/">
        {t('home')}
      </Link>
    </main>
  );
};

export default NotFoundPage;

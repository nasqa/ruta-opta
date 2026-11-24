import { SiteFrame } from '@/modules/site-shell';

// The footer is the same on every page, so the layout owns it; the header stays per page, because only the page knows its href and query
const SiteLayout = ({ children }: LayoutProps<'/[locale]'>) => <SiteFrame>{children}</SiteFrame>;

export default SiteLayout;

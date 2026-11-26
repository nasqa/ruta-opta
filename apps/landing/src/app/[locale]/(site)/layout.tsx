import { eventProps } from '@/modules/analytics/server';
import { SiteFrame, type SiteTracking } from '@/modules/site-shell';

// The shell does not know what is measured: the route composes it with the events
const tracking: SiteTracking = {
  floating: eventProps('floating-whatsapp'),
  whatsapp: eventProps('footer-whatsapp'),
  email: eventProps('footer-email'),
  instagram: eventProps('footer-instagram'),
};

// The footer is the same on every page, so the layout owns it; the header stays per page, because only the page knows its href and query
const SiteLayout = ({ children }: LayoutProps<'/[locale]'>) => <SiteFrame tracking={tracking}>{children}</SiteFrame>;

export default SiteLayout;

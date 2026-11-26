import 'server-only';
import { scriptTags } from './plausible';

export { allyRoutes } from './catalog';
export { eventProps, noEvent } from './markup';

// The host production answers on: events from any other are dropped
export const analyticsScript = () => scriptTags(process.env.ANALYTICS_SCRIPT_SRC, 'www.rutaopta.org');

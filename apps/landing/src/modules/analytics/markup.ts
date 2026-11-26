import { events, type EventId } from './catalog';
import { goalAttributes, type TrackingAttributes } from './plausible';

// The whole bag is spread on the element: another vendor may mark it with data- attributes instead of a class
export const eventProps = (id: EventId, className?: string): TrackingAttributes => {
  const { className: vendorClass, ...attributes } = goalAttributes(events[id].goal);
  const classes = [className, vendorClass].filter(Boolean).join(' ');
  return classes ? { ...attributes, className: classes } : attributes;
};

export const noEvent = (reason: 'recovery'): TrackingAttributes => ({ 'data-no-event': reason });

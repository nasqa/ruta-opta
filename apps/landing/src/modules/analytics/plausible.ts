// The only file that knows the analytics vendor

export const proxyPaths = { script: '/o/s.js', event: '/o/e' } as const;
export const vendorEventUrl = 'https://plausible.io/api/event';
const vendorScripts = 'https://plausible.io/js/';

export type TrackingAttributes = { className?: string; [key: `data-${string}`]: string | undefined };

const goalClass = 'plausible-event-name=';

export const goalAttributes = (goal: string): TrackingAttributes => ({ className: `${goalClass}${goal.replaceAll(' ', '+')}` });

export const goalOf = (attributes: Record<string, string>) =>
  attributes.class
    ?.split(/\s+/)
    .find((name) => name.startsWith(goalClass))
    ?.slice(goalClass.length)
    .replaceAll('+', ' ');

const stub =
  'window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};';

// The only query names that reach the vendor. Matched exactly: the confirm token travels as ?t=
const queryNames = ['ref', 'source', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

// Source text, not fn.toString(): what runs in the page is what the tests evaluate, whatever the compiler does.
// transformRequest fails closed: an event it cannot clean is dropped
export const initSnippet = ({ host, endpoint }: { host: string; endpoint?: string }) => `${stub}
plausible.init({${endpoint ? `endpoint:${JSON.stringify(endpoint)},` : ''}transformRequest:function(payload){
try{
if(location.hostname!==${JSON.stringify(host)})return null;
var bare=function(address,base){var url=new URL(address,base);url.search="";url.hash="";return url.href};
var page=new URL(payload.u),kept=new URLSearchParams();
page.searchParams.forEach(function(value,name){if(${JSON.stringify(queryNames)}.indexOf(name)>-1)kept.append(name,value)});
page.search=kept.toString();
page.hash="";
var clean=Object.assign({},payload,{u:page.href});
if(payload.r)clean.r=bare(payload.r);
if(payload.p&&payload.p.url)clean.p=Object.assign({},payload.p,{url:bare(payload.p.url,location.href)});
return clean
}catch(error){return null}
}})`;

export const scriptTags = (src: string | undefined, host: string) => {
  if (!src) return undefined;
  // One leading slash only: //name points at another host, and browsers read /\name the same way
  if (/^\/(?![/\\])/.test(src)) return { src, init: initSnippet({ host, endpoint: proxyPaths.event }) };
  if (src.startsWith(vendorScripts)) return { src, init: initSnippet({ host }) };
  return undefined;
};

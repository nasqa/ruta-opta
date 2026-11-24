const plainAddress = /^[^\s@,;?&#]+@[^\s@,;?&#]+\.[^\s@,;?&#]+$/;

// The number is digits only with the country code first, as wa.me wants it; the site collects nothing from the chat
export const whatsappHref = (number: string, text: string) => {
  if (!/^\d{8,15}$/.test(number)) throw new RangeError('A WhatsApp number is 8 to 15 digits, country code first, no + or spaces');
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
};

export const mailtoHref = (address: string, subject: string) => {
  if (!plainAddress.test(address)) throw new RangeError('A mailto target is one plain address');
  return `mailto:${address}?subject=${encodeURIComponent(subject)}`;
};

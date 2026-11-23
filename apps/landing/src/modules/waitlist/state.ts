export type WaitlistField = 'name' | 'email' | 'consent';

export type WaitlistValues = { name: string; email: string; consent: boolean };

// What the form shows after each submit. Errors are codes: the form turns them into text from the messages
export type WaitlistState =
  | { status: 'idle' }
  | { status: 'invalid'; errors: Partial<Record<WaitlistField, true>>; values: WaitlistValues }
  | { status: 'unavailable'; values: WaitlistValues }
  | { status: 'sent'; name: string };

export const initialWaitlistState: WaitlistState = { status: 'idle' };

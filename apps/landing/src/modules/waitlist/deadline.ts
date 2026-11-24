// Rejects with a TimeoutError once the task outlasts ms. The task itself keeps running: the race has already subscribed to it, so a late
// rejection is not left unhandled. The timer is cleared as soon as either side settles
export const withDeadline = <T>(task: Promise<T>, ms: number, what: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error(`${what} took longer than ${ms} ms`), { name: 'TimeoutError' })), ms);
  });
  return Promise.race([task, timeout]).finally(() => clearTimeout(timer));
};

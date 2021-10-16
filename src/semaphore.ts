import PCancelable from 'p-cancelable';
import { Semaphore } from 'await-semaphore';
import { Decorator, decorate } from './decorate';
import { isCancelable } from './cancelable';

/**
 * The `semaphore` decorator parameters.
 */
interface Parameters {
  /**
   * The max number of simultaneous calls.
   */
  limit: number;
}

/**
 * Limits the number of simultaneous calls.
 * @param parameters - The decorator parameters.
 * @returns The method decorator.
 */
export function semaphore<T>({ limit }: Parameters): Decorator<T> {
  const handle = new Semaphore(limit);

  return decorate(
    ({ callback }) =>
      new PCancelable((resolve, reject, onCancel) => {
        let promise: unknown;
        onCancel(() => isCancelable(promise) && promise.cancel());

        // eslint-disable-next-line no-return-assign
        handle.use(async () => (promise = callback())).then(resolve, reject);
      }),
  );
}

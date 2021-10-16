import PCancelable from 'p-cancelable';
import { isCancelable } from './cancelable';
import { Decorator, decorate } from './decorate';

/**
 * The `retry` decorator parameters.
 */
interface Parameters<T> {
  /**
   * The retries number.
   * @param - The decorated method object's instance.
   */
  retries: number | ((this: T, instance: T) => number);
}

/**
 * Retries failed method calls.
 * @param parameters - The decorator parameters.
 * @returns The method decorator.
 */
export function retry<T>({ retries }: Parameters<T>): Decorator<T> {
  return decorate(
    ({ callback, instance }) =>
      new PCancelable((resolve, reject, onCancel) => {
        let isCanceled = false;
        let promise: unknown;

        const limit = Math.max(typeof retries === 'function' ? retries.call(instance, instance) : retries, 1);
        const invoke = async (attempt = 1) => {
          try {
            promise = callback();
            resolve(await promise);
          } catch (error) {
            if (attempt >= limit) {
              reject(error);
            } else if (!isCanceled) {
              invoke(attempt + 1);
            }
          }
        };

        onCancel(() => {
          if (isCancelable(promise)) {
            promise.cancel();
          }

          isCanceled = true;
        });

        invoke();
      }),
  );
}

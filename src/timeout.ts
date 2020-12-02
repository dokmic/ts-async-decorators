import PCancelable from 'p-cancelable';
import { Decorator, decorate } from './decorate';

/**
 * The `timeout` decorator parameters.
 */
interface Parameters<T> {
  /**
   * The execution timeout in milliseconds.
   * @param - The decorated method object's instance.
   */
  timeout: number | ((this: T, instance: T) => number);

  /**
   * The timeout reason.
   */
  reason?: string;
}

/**
 * Limits method execution time.
 * @param parameters - The decorator parameters.
 * @returns The method decorator.
 */
export function timeout<T>({ timeout: ms, reason = 'Operation timeout.' }: Parameters<T>): Decorator<T> {
  return decorate(({ callback, instance }) => {
    const promise = callback();
    setTimeout(
      () => promise instanceof PCancelable && promise.cancel(reason),
      typeof ms === 'function' ? ms.call(instance, instance) : ms,
    );

    return promise;
  });
}

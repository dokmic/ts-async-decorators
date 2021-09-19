import PCancelable from 'p-cancelable';
import { Decorator, decorate } from './decorate';

/**
 * The `throttle` decorator parameters.
 */
interface Parameters<T> {
  /**
   * The flag to call the decorated method on the leading edge.
   */
  immediate?: boolean;

  /**
   * Throttling timeout in milliseconds.
   * The decorated method will be called only once within `timeout` milliseconds.
   * @param - The decorated method object's instance.
   */
  timeout: number | ((this: T, instance: T) => number);
}

/**
 * Limits the number of calls per time range.
 * @param parameters - The decorator parameters.
 * @returns The method decorator.
 */
export function throttle<T>({ immediate = false, timeout }: Parameters<T>): Decorator<T> {
  let action: (() => unknown) | undefined;
  let handle: NodeJS.Timeout | undefined;
  let trigger: (() => void) | undefined;
  let wrapper: PCancelable<unknown> | undefined;

  const reset = () => {
    action = undefined;
    trigger = undefined;
    wrapper = undefined;
  };

  const schedule = (instance: T) => {
    handle = setTimeout(
      () => {
        handle = undefined;
        trigger?.();
      },
      typeof timeout === 'function' ? timeout.call(instance, instance) : timeout,
    );
  };

  return decorate(({ callback, instance }) => {
    action = callback;

    if (!wrapper) {
      wrapper = new PCancelable((resolve, reject, onCancel) => {
        let promise: unknown;

        trigger = async () => {
          try {
            promise = action?.();
            reset();
            schedule(instance);
            resolve(await promise);
          } catch (error) {
            reject(error);
          }
        };

        onCancel(() => {
          if (promise instanceof PCancelable) {
            promise.cancel();
          }

          if (handle) {
            clearTimeout(handle);
            handle = undefined;
          }

          reset();
        });
      });
    }

    if (!handle) {
      if (immediate) {
        trigger?.();
      } else {
        schedule(instance);
      }
    }

    return wrapper;
  });
}

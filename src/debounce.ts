import PCancelable from 'p-cancelable';
import { isCancelable } from './cancelable';
import { Decorator, decorate } from './decorate';

/**
 * The `debounce` decorator parameters.
 */
interface Parameters<T> {
  /**
   * The flag to call the decorated method on the leading edge.
   */
  immediate?: boolean;

  /**
   * Debouncing timeout in milliseconds.
   * The decorated method will be called only once after `timeout` milliseconds since the last call.
   * @param - The decorated method object's instance.
   */
  timeout: number | ((this: T, instance: T) => number);
}

/**
 * Delays execution by timeout since the last call.
 * @param parameters - The decorator parameters.
 * @returns The method decorator.
 */
export function debounce<T>({ immediate = false, timeout }: Parameters<T>): Decorator<T> {
  let action: (() => unknown) | undefined;
  let handle: NodeJS.Timeout | undefined;
  let trigger: (() => void) | undefined;
  let wrapper: PCancelable<unknown> | undefined;

  const reset = () => {
    action = undefined;
    trigger = undefined;
    wrapper = undefined;
  };

  return decorate(({ callback, instance }) => {
    const isLeading = !handle;
    action = callback;

    if (!wrapper) {
      wrapper = new PCancelable((resolve, reject, onCancel) => {
        let promise: unknown;

        trigger = async () => {
          try {
            promise = action?.();
            reset();
            resolve(await promise);
          } catch (error) {
            reject(error);
          }
        };

        onCancel(() => {
          if (isCancelable(promise)) {
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

    if (handle) {
      clearTimeout(handle);
    }

    handle = setTimeout(
      () => {
        handle = undefined;
        trigger?.();
      },
      typeof timeout === 'function' ? timeout.call(instance, instance) : timeout,
    );

    if (immediate && isLeading) {
      trigger?.();
    }

    return wrapper;
  });
}

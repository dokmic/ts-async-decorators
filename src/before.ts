import PCancelable from 'p-cancelable';
import { isCancelable } from './cancelable';
import { Decorator, decorate } from './decorate';

/**
 * The `before` decorator parameters.
 */
interface Parameters<T> {
  /**
   * The action to call before the decorated method.
   * @param instance - The decorated method object's instance.
   */
  action(this: T, instance: T): unknown;

  /**
   * The flag to wait with the decorated method call until the action completes.
   */
  wait?: boolean;
}

/**
 * Calls an action before a decorated method.
 * @param parameters - The decorator parameters.
 * @returns The method decorator.
 */
export function before<T>({ action, wait = false }: Parameters<T>): Decorator<T> {
  return decorate(
    ({ callback, instance }) =>
      new PCancelable(async (resolve, reject, onCancel) => {
        let promise: unknown;
        let actionPromise: unknown;

        onCancel(() => {
          if (isCancelable(actionPromise)) {
            actionPromise.cancel();
          }
          if (isCancelable(promise)) {
            promise.cancel();
          }
        });

        try {
          actionPromise = action.call(instance, instance);
          if (wait) {
            await actionPromise;
          }

          promise = callback();
          resolve(await promise);
        } catch (error) {
          reject(error);
        }
      }),
  );
}

import PCancelable from 'p-cancelable';
import { Decorator, decorate } from './decorate';

/**
 * The `after` decorator parameters.
 */
interface Parameters<T> {
  /**
   * The action to call after the decorated method.
   * @param instance - The decorated method object's instance.
   */
  action(this: T, instance: T): unknown;

  /**
   * The flag to wait with promise resolution until the action completes.
   */
  wait?: boolean;
}

/**
 * Calls an action after a decorated method.
 * @param parameters - The decorator parameters.
 * @returns The method decorator.
 */
export function after<T>({ action, wait = false }: Parameters<T>): Decorator<T> {
  return decorate(
    ({ callback, instance }) =>
      new PCancelable(async (resolve, reject, onCancel) => {
        let promise: unknown;
        let actionPromise: unknown;

        onCancel(() => {
          if (actionPromise instanceof PCancelable) {
            actionPromise.cancel();
          }
          if (promise instanceof PCancelable) {
            promise.cancel();
          }
        });

        try {
          promise = callback();
          const result = await promise;

          actionPromise = action.call(instance, instance);
          if (wait) {
            await actionPromise;
          }

          resolve(result);
        } catch (error) {
          reject(error);
        }
      }),
  );
}

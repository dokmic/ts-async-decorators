import PCancelable, { CancelError } from 'p-cancelable';
import { Decorator, decorate } from './decorate';

export { CancelError };

/**
 * Cancelable promise.
 * The interface is compatible with the most popular promise libraries.
 */
export interface Cancelable extends Promise<unknown> {
  /**
   * Cancels the promise.
   * @param reason - The cancelation reason.
   */
  cancel(reason?: string): void;
}

/**
 * Checks whether a value is a cancelable promise.
 * @param value - The value to check.
 */
export function isCancelable(value: unknown): value is Cancelable {
  return value instanceof Promise && typeof (value as Partial<Cancelable>).cancel === 'function';
}

/**
 * The `cancelable` decorator parameters.
 */
interface Parameters<T> {
  /**
   * The action to call on canceling the returned promise.
   * @param instance - The decorated method object's instance.
   */
  onCancel?(this: T, instance: T): void;
}

type Callback<T> = Required<Parameters<T>>['onCancel'];

// eslint-disable-next-line no-use-before-define
let context: typeof onCancel | undefined;

/**
 * Sets the cancelation callback.
 * @param callback - The callback that will be called on promise cancelation.
 * @example
 * cancelable()
 * fetch() {
 *   const controller = new AbortController();
 *   const { signal } = controller;
 *   onCancel(() => controller.abort());
 *
 *   return fetch('http://example.com', { signal });
 * }
 */
export function onCancel<T>(callback: Callback<T>): void {
  if (!context) {
    throw new Error('The cancelation callback cannot be set outside the cancelable method.');
  }

  return context(callback);
}

/**
 * Wraps a call inside a cancelable promise.
 * @example
 * cancelable({ cancel() { this.stop(); } })
 * start() {
 *   // ...
 * }
 * @param parameters - The decorator parameters.
 * @returns The method decorator.
 */
// eslint-disable-next-line no-shadow
export function cancelable<T>({ onCancel }: Parameters<T> = {}): Decorator<T> {
  return decorate<T>(
    ({ callback, instance }) =>
      new PCancelable(async (resolve, reject, onWrapperCancel) => {
        let promise: unknown;

        onWrapperCancel(() => {
          onCancel?.call(instance, instance);

          if (isCancelable(promise)) {
            promise.cancel();
          }
        });

        try {
          const previousContext = context;
          try {
            // eslint-disable-next-line no-return-assign, no-param-reassign
            context = (value) => (onCancel = value as unknown as typeof onCancel);
            promise = callback();
          } finally {
            context = previousContext;
          }

          resolve(await promise);
        } catch (error) {
          reject(error);
        }
      }),
  );
}

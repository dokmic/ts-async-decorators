/**
 * Decorating function parameters.
 */
interface Parameters<T, U extends unknown[] = unknown[]> {
  /**
   * Current call arguments.
   */
  args: U;

  /**
   * A callback to call the decorated method with the current arguments.
   */
  callback(): unknown;

  /**
   * Current call context.
   */
  instance: T;

  /**
   * The original method.
   */
  value?(this: T, ...args: U): unknown;
}

type Handler<T> = (parameters: Parameters<T>) => unknown;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Method<T> = (this: T, ...args: any[]) => any;

/**
 * Method decorator.
 */
export type Decorator<T> = <U extends T>(
  target: U,
  key: keyof never,
  descriptor: TypedPropertyDescriptor<Method<T>>,
) => TypedPropertyDescriptor<Method<T>>;

/**
 * Applies decorating function to intercept decorated method calls.
 * @param fn - The decorating function.
 */
export function decorate<T>(fn: Handler<T>): Decorator<T> {
  const result: Decorator<T> = (
    target,
    key,
    descriptor = Object.getOwnPropertyDescriptor(target, key) ?? {
      enumerable: true,
      configurable: true,
      writable: true,
    },
  ) => {
    const { value } = descriptor;

    return Object.assign(descriptor, {
      value(this: T, ...args: unknown[]) {
        return fn({
          args,
          value,
          instance: this,
          callback: () => value?.apply(this, args),
        });
      },
    });
  };

  return result;
}

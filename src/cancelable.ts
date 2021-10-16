import type PCancelable from 'p-cancelable';

type Cancelable = Promise<unknown> & Pick<PCancelable<unknown>, 'cancel'>;

export function isCancelable(value: unknown): value is Cancelable {
  return value instanceof Promise && typeof (value as Partial<Cancelable>).cancel === 'function';
}

import PCancelable from 'p-cancelable';
import { isCancelable } from './cancelable';

describe('isCancelable', () => {
  it('should return true for a cancelable promise', () => {
    const cancelable = new PCancelable((resolve) => resolve());

    expect(isCancelable(cancelable)).toBeTrue();
  });

  it('should return true for a custom cancelable promise', () => {
    const cancelable = Object.assign(Promise.resolve(), { cancel: jest.fn() });

    expect(isCancelable(cancelable)).toBeTrue();
  });

  it('should return false for a non-promise value', () => {
    const cancelable = { cancel: jest.fn() };

    expect(isCancelable(cancelable)).toBeFalse();
  });
});

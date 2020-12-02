import PCancelable, { CancelError } from 'p-cancelable';
import { timeout } from './timeout';

describe('timeout', () => {
  const ms = jest.fn(() => 500);
  const payload = jest.fn(() => new PCancelable(jest.fn()));

  class TestClass {
    @timeout({ timeout: 1000 })
    method1() {
      return payload();
    }

    @timeout({ timeout: ms, reason: 'something' })
    method2() {
      return payload();
    }
  }

  let instance: TestClass;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    instance = new TestClass();
  });

  it('should cancel a decorated method call after a timeout', () => {
    const promise = instance.method1();

    jest.advanceTimersByTime(1000);

    expect(promise).rejects.toBeInstanceOf(CancelError);
    expect(promise.isCanceled).toBe(true);
  });

  it('should not cancel a decorated method if it is completed before timeout', () => {
    payload.mockReturnValueOnce(new PCancelable((resolve) => setTimeout(() => resolve('something'), 500)));
    const promise = instance.method1();

    jest.advanceTimersByTime(1000);

    expect(promise).resolves.toBe('something');
  });

  it('should invoke a function to determine a timeout', () => {
    const promise = instance.method2();

    jest.advanceTimersByTime(500);

    expect(promise).toReject();
    expect(promise.isCanceled).toBe(true);
  });

  it('should reject with a custom reason', () => {
    const promise = instance.method2();

    jest.advanceTimersByTime(500);

    expect(promise).rejects.toEqual(new CancelError('something'));
  });
});

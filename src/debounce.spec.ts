import PCancelable from 'p-cancelable';
import { debounce } from './debounce';

describe('debounce', () => {
  const timeout = jest.fn(() => 1000);
  const payload = jest.fn();

  class TestClass {
    @debounce({ timeout: 1000 })
    method1(...args: unknown[]) {
      return payload(...args);
    }

    @debounce({ timeout })
    method2() {
      return payload();
    }

    @debounce({ timeout: 1000, immediate: true })
    method3(...args: unknown[]) {
      return payload(...args);
    }
  }

  let instance: TestClass;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    instance = new TestClass();
  });

  it('should postpone a decorated method call', () => {
    instance.method1();

    expect(payload).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    expect(payload).toHaveBeenCalled();
  });

  it('should debounce secondary calls', () => {
    const promise1 = instance.method1('a');
    jest.advanceTimersByTime(500);
    const promise2 = instance.method1('b');
    jest.advanceTimersByTime(500);

    expect(promise2).toBe(promise1);
    expect(payload).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);

    expect(payload).toHaveBeenCalledTimes(1);
    expect(payload).toHaveBeenCalledWith('b');
  });

  it('should forward a return value', async () => {
    payload.mockReturnValueOnce('something');

    const promise = instance.method1();
    jest.advanceTimersByTime(1000);

    expect(await promise).toBe('something');
  });

  it('should reject with an exception', () => {
    payload.mockRejectedValueOnce('something');

    const promise = instance.method1();
    jest.advanceTimersByTime(1000);

    expect(promise).rejects.toBe('something');
  });

  it('should cancel a decorated method', () => {
    const promise = instance.method1();
    promise.cancel();

    jest.advanceTimersByTime(1000);

    expect(promise).toReject();
    expect(payload).not.toHaveBeenCalled();
  });

  it('should cancel a decorated method call', () => {
    const promise = instance.method1();
    const payloadPromise = new PCancelable((resolve) => setTimeout(resolve, 2000));
    payload.mockReturnValueOnce(payloadPromise);

    jest.advanceTimersByTime(1000);

    promise.cancel();

    expect(promise).toReject();
    expect(payloadPromise.isCanceled).toBe(true);
  });

  it('should invoke a function to determine a timeout', () => {
    instance.method2();

    expect(payload).not.toHaveBeenCalled();
    expect(timeout).toHaveBeenCalledWith(instance);

    jest.advanceTimersByTime(1000);

    expect(payload).toHaveBeenCalled();
  });

  it('should call a decorated method immediately', async () => {
    instance.method3('a');
    jest.advanceTimersByTime(500);
    instance.method3('b');
    jest.advanceTimersByTime(500);
    instance.method3('c');
    jest.advanceTimersByTime(1000);

    expect(payload).toHaveBeenCalledTimes(2);
    expect(payload).nthCalledWith(1, 'a');
    expect(payload).nthCalledWith(2, 'c');
  });
});

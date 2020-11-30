import PCancelable from 'p-cancelable';
import { throttle } from './throttle';

describe('throttle', () => {
  const timeout = jest.fn(() => 1000);
  const payload = jest.fn();

  class TestClass {
    @throttle({ timeout: 1000 })
    method1(...args: unknown[]) {
      return payload(...args);
    }

    @throttle({ timeout })
    method2() {
      return payload();
    }

    @throttle({ timeout: 1000, immediate: true })
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

  it('should throttle secondary calls', () => {
    const promise1 = instance.method1('a');
    jest.advanceTimersByTime(500);
    const promise2 = instance.method1('b');
    jest.advanceTimersByTime(500);
    const promise3 = instance.method1('c');
    jest.advanceTimersByTime(1000);

    expect(promise2).toBe(promise1);
    expect(promise3).not.toBe(promise2);
    expect(payload).toHaveBeenCalledTimes(2);
    expect(payload).toHaveBeenCalledWith('b');
    expect(payload).toHaveBeenCalledWith('c');
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
    instance.method3('b');
    instance.method3('c');
    jest.advanceTimersByTime(1000);

    expect(payload).toHaveBeenCalledTimes(2);
    expect(payload).nthCalledWith(1, 'a');
    expect(payload).nthCalledWith(2, 'c');
  });
});

import PCancelable from 'p-cancelable';
import { retry } from './retry';

describe('retry', () => {
  const retries = jest.fn(() => 3);
  const payload = jest.fn();

  class TestClass {
    @retry({ retries: 3 }) method1() {
      return payload();
    }

    @retry({ retries }) method2() {
      return payload();
    }
  }

  let instance: TestClass;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetAllMocks();

    instance = new TestClass();
  });

  it('should retry until a decorated method resolves', async () => {
    payload.mockRejectedValueOnce('a');
    payload.mockRejectedValueOnce('b');
    payload.mockResolvedValueOnce('c');

    expect(await instance.method1()).toBe('c');
    expect(payload).toHaveBeenCalledTimes(3);
  });

  it('should reject until a decorated method resolves', () => {
    payload.mockRejectedValueOnce('a');
    payload.mockRejectedValueOnce('b');
    payload.mockRejectedValueOnce('c');

    expect(instance.method1()).rejects.toBe('c');
  });

  it('should cancel a cancelable decorated method', () => {
    const payloadPromise = new PCancelable(jest.fn());
    payload.mockReturnValueOnce(payloadPromise);

    const promise = instance.method1();
    promise.cancel();

    expect(promise).toReject();
    expect(payloadPromise.isCanceled).toBe(true);
  });

  it('should cancel a regular decorated method', () => {
    payload.mockImplementation(() => new Promise((resolve, reject) => setTimeout(reject, 1000)));

    const promise = instance.method1();
    promise.cancel();
    jest.advanceTimersByTime(1000);

    expect(promise).toReject();
    expect(payload).toHaveBeenCalledTimes(1);
  });

  it('should invoke a function to determine retries number', async () => {
    payload.mockRejectedValueOnce('a');
    payload.mockRejectedValueOnce('b');
    payload.mockResolvedValueOnce('c');

    expect(await instance.method2()).toBe('c');
  });
});

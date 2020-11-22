import PCancelable from 'p-cancelable';
import { before } from './before';

describe('before', () => {
  const callback = jest.fn();
  const action = jest.fn(() => new Promise((resolve) => setTimeout(() => resolve(callback()), 1000)));
  const payload = jest.fn();

  class TestClass {
    @before({ action })
    method1() {
      return payload();
    }

    @before({ action, wait: true })
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

  it('should invoke an action before a decorated method', async () => {
    await instance.method1();

    expect(action).toHaveBeenCalled();
    expect(action).toHaveBeenCalledBefore(payload);
  });

  it('should not wait until an action completes', async () => {
    await instance.method1();

    expect(action).toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
    expect(payload).toHaveBeenCalled();
  });

  it('should wait until an action completes', async () => {
    instance.method2();
    await new Promise(process.nextTick);

    expect(payload).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    await new Promise(process.nextTick);

    expect(payload).toHaveBeenCalled();
  });

  it('should cancel a decorated method', () => {
    const payloadPromise = new PCancelable(jest.fn());
    payload.mockReturnValueOnce(payloadPromise);
    action.mockResolvedValueOnce(undefined);

    const promise = instance.method1();
    promise.cancel();

    expect(promise).toReject();
    expect(payloadPromise.isCanceled).toBe(true);
  });

  it('should cancel an action', () => {
    const actionPromise = new PCancelable(jest.fn());
    action.mockReturnValueOnce(actionPromise);

    const promise = instance.method2();
    promise.cancel();

    expect(promise).toReject();
    expect(actionPromise.isCanceled).toBe(true);
  });
});

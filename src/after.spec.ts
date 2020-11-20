import PCancelable from 'p-cancelable';
import { after } from './after';

describe('after', () => {
  const callback = jest.fn();
  const action = jest.fn(() => new Promise((resolve) => setTimeout(() => resolve(callback()), 1000)));
  const payload = jest.fn();

  class TestClass {
    @after({ action })
    method1() {
      return payload();
    }

    @after({ action, wait: true })
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

  it('should invoke an action after a decorated method', async () => {
    await instance.method1();

    expect(action).toHaveBeenCalled();
    expect(action).toHaveBeenCalledAfter(payload);
  });

  it('should not wait until an action completes', async () => {
    await instance.method1();

    expect(callback).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalled();
  });

  it('should wait until an action completes', async () => {
    const next = jest.fn();

    instance.method2().then(next);
    await new Promise(process.nextTick);

    expect(next).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);
    await new Promise(process.nextTick);

    expect(next).toHaveBeenCalled();
  });

  it('should cancel a decorated method', () => {
    const payloadPromise = new PCancelable(jest.fn());
    payload.mockReturnValueOnce(payloadPromise);

    const promise = instance.method1();
    promise.cancel();

    expect(promise).toReject();
    expect(payloadPromise.isCanceled).toBe(true);
  });

  it('should cancel an action', async () => {
    const actionPromise = new PCancelable(jest.fn());
    action.mockReturnValueOnce(actionPromise);

    const promise = instance.method2();
    await new Promise(process.nextTick);
    promise.cancel();

    expect(promise).toReject();
    expect(actionPromise.isCanceled).toBe(true);
  });
});

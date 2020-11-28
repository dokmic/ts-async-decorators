import PCancelable from 'p-cancelable';
import { semaphore } from './semaphore';

describe('semaphore', () => {
  const payload = jest.fn();

  class TestClass {
    @semaphore({ limit: 1 }) method() {
      return payload();
    }
  }

  let instance: TestClass;

  beforeEach(() => {
    jest.resetAllMocks();
    jest.useFakeTimers();

    instance = new TestClass();
  });

  it('should limit the number of simultaneous calls', async () => {
    payload.mockImplementation(() => new PCancelable((resolve) => setTimeout(resolve, 1000)));

    instance.method();
    instance.method();
    instance.method();

    await new Promise(process.nextTick);
    expect(payload).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1000);
    await new Promise(process.nextTick);
    expect(payload).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(1000);
    await new Promise(process.nextTick);
    jest.advanceTimersByTime(1000);
    await new Promise(process.nextTick);

    expect(payload).toHaveBeenCalledTimes(3);
  });

  it('should cancel a decorated method', async () => {
    const payloadPromise = new PCancelable(jest.fn());
    payload.mockReturnValueOnce(payloadPromise);

    const promise = instance.method();
    await new Promise(process.nextTick);
    promise.cancel();

    expect(promise).toReject();
    expect(payloadPromise.isCanceled).toBe(true);
  });
});

// eslint-disable-next-line max-classes-per-file
import PCancelable from 'p-cancelable';
import { cancelable, isCancelable, onCancel, CancelError } from './cancelable';

describe('isCancelable', () => {
  it('should return true for a cancelable promise', () => {
    const promise = new PCancelable((resolve) => resolve());

    expect(isCancelable(promise)).toBeTrue();
  });

  it('should return true for a custom cancelable promise', () => {
    const promise = Object.assign(Promise.resolve(), { cancel: jest.fn() });

    expect(isCancelable(promise)).toBeTrue();
  });

  it('should return false for a non-promise value', () => {
    const promise = { cancel: jest.fn() };

    expect(isCancelable(promise)).toBeFalse();
  });
});

describe('cancelable', () => {
  const callback = jest.fn();
  const payload = jest.fn();

  class TestClass {
    @cancelable({ onCancel: callback })
    method1() {
      return payload();
    }

    @cancelable()
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

  it('should return a cancelable promise', () => {
    const result = instance.method1();

    expect(result).toBeInstanceOf(Promise);
    expect(result).toHaveProperty('cancel', expect.any(Function));
  });

  it('should resolve with the decorated method result', async () => {
    payload.mockReturnValueOnce('something');

    await expect(instance.method1()).resolves.toBe('something');
  });

  it('should reject with the thrown value', async () => {
    payload.mockImplementationOnce(() => {
      throw new Error('something');
    });

    await expect(instance.method1()).rejects.toEqual(new Error('something'));
  });

  it('should wrap a returned promise', async () => {
    payload.mockResolvedValueOnce('something');

    await expect(instance.method1()).resolves.toBe('something');
  });

  it('should call a callback on cancelation', async () => {
    payload.mockReturnValueOnce(new Promise(jest.fn()));
    const result = instance.method1();
    result.cancel();

    await expect(result).rejects.toBeInstanceOf(CancelError);
    expect(callback).toHaveBeenCalled();
  });

  it('should cancel a wrapped cancelable promise', async () => {
    const cancel = jest.fn();
    const promise = Object.assign(new Promise(jest.fn()), { cancel });

    payload.mockReturnValueOnce(promise);
    const result = instance.method1();
    result.cancel();

    await expect(result).rejects.toBeInstanceOf(CancelError);
    expect(cancel).toHaveBeenCalled();
  });

  it('should not fail when there is no cancelation callback', async () => {
    payload.mockReturnValueOnce(new Promise(jest.fn()));
    const result = instance.method2();
    result.cancel();

    await expect(result).rejects.toBeInstanceOf(CancelError);
  });
});

describe('onCancel', () => {
  const payload = jest.fn();

  class TestClass {
    @cancelable()
    method1() {
      return payload();
    }

    @cancelable()
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

  it('should set cancelation callback from within a cancelable method', async () => {
    const callback = jest.fn();
    payload.mockImplementation(() => onCancel(callback));

    const result = instance.method1();
    result.cancel();

    await expect(result).rejects.toBeInstanceOf(CancelError);
    expect(callback).toHaveBeenCalled();
  });

  it('should set cancelation callback from within an asynchronous method', async () => {
    const cancel = jest.fn();
    payload.mockImplementation(
      async () =>
        new Promise(() => {
          onCancel(cancel);
        }),
    );

    const result = instance.method1();
    result.cancel();

    await expect(result).rejects.toBeInstanceOf(CancelError);
    expect(cancel).toHaveBeenCalled();
  });

  it('should throw if called outside a cancelable method', () => {
    expect(() => onCancel(jest.fn())).toThrow();
  });

  it('should keep context for nested calls', async () => {
    const cancel1 = jest.fn();
    const cancel2 = jest.fn();

    payload.mockImplementationOnce(() => {
      instance.method2();
      onCancel(cancel1);
    });
    payload.mockImplementationOnce(() => {
      onCancel(cancel2);
    });

    const result = instance.method1();
    result.cancel();

    await expect(result).rejects.toBeInstanceOf(CancelError);
    expect(cancel2).toHaveBeenCalledAfter(cancel1);
  });

  it('should not lose context when a method throws', async () => {
    const cancel = jest.fn();

    payload.mockImplementationOnce(() => {
      instance.method2().catch(jest.fn());
      onCancel(cancel);
    });
    payload.mockImplementationOnce(() => {
      throw new Error();
    });

    const result = instance.method1();
    result.cancel();

    await expect(result).rejects.toBeInstanceOf(CancelError);
    expect(cancel).toHaveBeenCalled();
  });

  it('should not reject after cancelation', async () => {
    payload.mockImplementation(
      () =>
        new Promise((resolve, reject) => {
          onCancel(() => reject(new Error()));
        }),
    );

    const result = instance.method1();
    result.cancel();

    await expect(result).rejects.toBeInstanceOf(CancelError);
  });
});

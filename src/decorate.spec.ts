import { decorate } from './decorate';

describe('decorate', () => {
  const decorator = jest.fn();
  const payload = jest.fn();

  class TestClass {
    @decorate(decorator) method(...args: unknown[]) {
      return payload(...args);
    }
  }

  let instance: TestClass;

  beforeEach(() => {
    jest.clearAllMocks();

    instance = new TestClass();
  });

  it('should call a decorator function', async () => {
    await instance.method('a', 'b');

    expect(decorator).toHaveBeenCalledWith(
      expect.objectContaining({
        instance,
        args: ['a', 'b'],
        value: expect.any(Function),
        callback: expect.any(Function),
      }),
    );
    expect(payload).not.toHaveBeenCalled();
  });

  it('should wrap an original method', async () => {
    await instance.method('a', 'b');

    const [[{ callback }]] = decorator.mock.calls;
    callback();

    expect(payload).toHaveBeenCalledWith('a', 'b');
  });
});

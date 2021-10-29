# TypeScript Async Method Decorators 🧰
[![NPM](https://img.shields.io/npm/v/ts-async-decorators.svg)](https://www.npmjs.com/package/ts-async-decorators)
[![Downloads](https://img.shields.io/npm/dm/ts-async-decorators)](https://www.npmjs.com/package/ts-async-decorators)
[![Tests](https://github.com/dokmic/ts-async-decorators/actions/workflows/tests.yaml/badge.svg?branch=master)](https://github.com/dokmic/ts-async-decorators/actions/workflows/tests.yaml)
[![Code Coverage](https://codecov.io/gh/dokmic/ts-async-decorators/badge.svg?branch=master)](https://codecov.io/gh/dokmic/ts-async-decorators?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This package provides a collection of asynchronous method decorators with an elegant declarative API.

## What's Inside?
- `after` - post action.
- `before` - pre action.
- `cancelable` - canceling execution.
- `debounce` - delaying execution by timeout since the last call.
- `retry` - retrying on fail.
- `semaphore` - limiting the number of simultaneous calls.
- `throttle` - limiting the number of calls per time range.
- `timeout` - limiting the execution time.

## Get Started
```bash
npm install --save ts-async-decorators
```

## API
### `after`
Calls an action after a decorated method.

```typescript
after({ action, wait = false }): Decorator
```
- `action: (instance) => unknown` - The action to call after the decorated method.
- `wait: boolean` - The flag to wait with promise resolution until the action completes.

#### Example
```typescript
import { after } from 'ts-async-decorators';

class SomeClass {
  @after({ action() { console.log('called fetch!'); } })
  fetch() {
    // ...
  }
}
```

### `before`
Calls an action before a decorated method.

```typescript
before({ action, wait = false }): Decorator
```
- `action: (instance) => unknown` - The action to call before the decorated method.
- `wait: boolean` - The flag to wait with the decorated method call until the action completes.

#### Example
```typescript
import { before } from 'ts-async-decorators';

class SomeClass {
  @before({ action() { console.log('calling fetch!'); } })
  fetch() {
    // ...
  }
}
```

### `cancelable`
Wraps a call inside a cancelable promise.

```typescript
cancelable({ onCancel = undefined }): Decorator
```
- `onCancel: (instance) => void` - The action to call on canceling the returned promise.

There is also an option to set the cancelation callback from within the decorated method.

```typescript
onCancel(callback): void
```
- `callback: (instance) => void` - The callback that will be called on promise cancelation.

#### Example using parameters
```typescript
import { cancelable } from 'ts-async-decorators';

class SomeClass {
  @cancelable({ onCancel() { this.stop(); } })
  start() {
    // ...
  }

  stop() {
    // ...
  }
}
```

#### Example using `onCancel`
```typescript
import { cancelable, onCancel } from 'ts-async-decorators';

class SomeClass {
  @cancelable()
  fetch() {
    const controller = new AbortController();
    const { signal } = controller;
    onCancel(() => controller.abort());

    return fetch('http://example.com', { signal });
  }
}
```


### `debounce`
Delays execution by timeout since the last call.

```typescript
debounce({ immediate = false, timeout }): Decorator
```
- `immediate: boolean` - The flag to call the decorated method on the leading edge.
- `timeout: number | ((instance) => number)` - The decorated method will be called only once after `timeout` milliseconds since the last call.

#### Example
```typescript
import { debounce } from 'ts-async-decorators';

class SomeClass {
  @debounce({ timeout: 2000 })
  handleChange() {
    // ...
  }
}
```

### `retry`
Retries failed method calls.

```typescript
retry({ retries }): Decorator
```
- `retries: number | ((instance) => number)` - The retries number.

#### Example
```typescript
import { retry } from 'ts-async-decorators';

class SomeClass {
  @retry({ retries: 3 })
  fetch() {
    // ...
  }
}
```

### `semaphore`
Limits the number of simultaneous calls.

```typescript
semaphore({ limit }): Decorator
```
- `limit: number` - The max number of simultaneous calls.

#### Example
```typescript
import { semaphore } from 'ts-async-decorators';

const mutex = () => semaphore({ limit: 1 });

class SomeClass {
  @mutex()
  connect() {
    // ...
  }

  @semaphore({ limit: 2 })
  read() {
    // ...
  }
}
```

### `throttle`
Limits the number of calls per time range.

```typescript
throttle({ immediate = false, timeout }): Decorator
```
- `immediate: boolean` - The flag to call the decorated method on the leading edge.
- `timeout: number | ((instance) => number)` - The decorated method will be called only once within `timeout` milliseconds.

#### Example
```typescript
import { throttle } from 'ts-async-decorators';

class SomeClass {
  @throttle({ timeout: 1000 })
  handleResize() {
    // ...
  }
}
```

### `timeout`
Limits method execution time.

```typescript
timeout({ timeout, reason = 'Operation timeout.' }): Decorator
```
- `timeout: number | ((instance) => number)` - The execution timeout in milliseconds.
- `reason: string` - The timeout reason.

#### Example
```typescript
import { cancelable, timeout, onCancel } from 'ts-async-decorators';

class SomeClass {
  @timeout({ timeout: 10000, reason = 'Fetch timeout.' })
  @cancelable()
  fetch() {
    const controller = new AbortController();
    const { signal } = controller;
    onCancel(() => controller.abort());

    return fetch('http://example.com', { signal });
  }
}
```

## Examples
- [Bluetooth Low-Energy Peripheral Device](https://github.com/dokmic/bluetooth-device).

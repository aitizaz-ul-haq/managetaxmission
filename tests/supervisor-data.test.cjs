const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((fulfill, fail) => {
    resolve = fulfill;
    reject = fail;
  });
  return { promise, resolve, reject };
}

const flushRequests = () => new Promise((resolve) => setImmediate(resolve));
const response = (body, ok = true) => ({ ok, json: async () => body });

// Model React's state, dependency changes, and effect cleanup without browser dependencies.
async function createHarness(endpoint = '/api/supervisor/stats') {
  const stateSlots = [];
  const effectSlots = [];
  const callbackSlots = [];
  const writes = [];
  const requests = [];
  let stateIndex = 0;
  let effectIndex = 0;
  let callbackIndex = 0;
  let pendingEffects = [];
  let abortCalls = 0;
  let hook;
  const changed = (before, after) => !before || before.length !== after.length || after.some((value, index) => !Object.is(value, before[index]));

  const react = {
    useState(initial) {
      const index = stateIndex++;
      if (!stateSlots[index]) {
        const slot = { value: typeof initial === 'function' ? initial() : initial };
        slot.set = (next) => {
          slot.value = typeof next === 'function' ? next(slot.value) : next;
          writes.push({ index, value: slot.value });
        };
        stateSlots[index] = slot;
      }
      return [stateSlots[index].value, stateSlots[index].set];
    },
    useCallback(callback, dependencies) {
      const index = callbackIndex++;
      if (changed(callbackSlots[index]?.dependencies, dependencies)) {
        callbackSlots[index] = { callback, dependencies };
      }
      return callbackSlots[index].callback;
    },
    useEffect(setup, dependencies) {
      const index = effectIndex++;
      if (changed(effectSlots[index]?.dependencies, dependencies)) {
        pendingEffects.push(() => {
          effectSlots[index]?.cleanup?.();
          effectSlots[index] = { setup, dependencies, cleanup: setup() };
        });
      }
    },
  };

  class TrackingAbortController extends AbortController {
    abort(...args) {
      abortCalls++;
      return super.abort(...args);
    }
  }

  const context = vm.createContext({
    Error,
    SyntaxError,
    AbortController: TrackingAbortController,
    fetch(url, options = {}) {
      const request = { ...deferred(), url, options };
      requests.push(request);
      return request.promise;
    },
  });
  const module = new vm.SourceTextModule(fs.readFileSync(path.join(__dirname, '../components/supervisor/useSupervisorData.js'), 'utf8'), { context });
  await module.link((specifier) => {
    assert.equal(specifier, 'react');
    return new vm.SyntheticModule(Object.keys(react), function () {
      for (const [name, value] of Object.entries(react)) this.setExport(name, value);
    }, { context });
  });
  await module.evaluate();
  hook = module.namespace.default;

  function render(nextEndpoint = endpoint) {
    endpoint = nextEndpoint;
    stateIndex = 0;
    effectIndex = 0;
    callbackIndex = 0;
    const value = hook(endpoint);
    const effects = pendingEffects;
    pendingEffects = [];
    for (const commit of effects) commit();
    return value;
  }

  return {
    render,
    get current() { return render(); },
    get abortCalls() { return abortCalls; },
    requests,
    writes,
    replayEffects() {
      for (const effect of effectSlots) {
        effect.cleanup?.();
        effect.cleanup = effect.setup();
      }
    },
    unmount() {
      for (const effect of effectSlots) {
        effect.cleanup?.();
        effect.cleanup = undefined;
      }
    },
  };
}

test('supervisor data survives Strict Mode effect replay without aborting requests', async () => {
  const app = await createHarness();
  assert.equal(app.render().loading, true);
  app.replayEffects();
  assert.equal(app.requests.length, 2);
  assert.equal(app.abortCalls, 0, 'Effect cleanup must not emit the transport abort that caused the login error');
  for (const request of app.requests) {
    assert.equal(request.options.cache, 'no-store');
    assert.notEqual(request.options.signal?.aborted, true);
  }

  app.requests[0].resolve(response({ total: 1 }));
  await flushRequests();
  assert.equal(app.current.data, null);
  assert.equal(app.current.loading, true, 'An obsolete request must not stop the current loading indicator');
  assert.equal(app.current.error, '');

  const latest = { total: 2 };
  app.requests[1].resolve(response(latest));
  await flushRequests();
  assert.equal(app.current.data, latest);
  assert.equal(app.current.loading, false);
  assert.equal(app.current.error, '');
  app.unmount();
  assert.equal(app.abortCalls, 0);
});

test('unmounted supervisor views ignore late request and response-body outcomes', async (t) => {
  for (const outcome of ['fetch success', 'fetch failure', 'body success', 'body syntax failure']) {
    await t.test(outcome, async () => {
      const app = await createHarness();
      app.render();
      const request = app.requests[0];
      const body = deferred();
      if (outcome.startsWith('body')) {
        request.resolve({ ok: true, json: () => body.promise });
        await flushRequests();
      }
      app.unmount();
      const writesBefore = app.writes.length;
      if (outcome === 'fetch success') request.resolve(response({ total: 9 }));
      if (outcome === 'fetch failure') request.reject(new Error('Network unavailable'));
      if (outcome === 'body success') body.resolve({ total: 9 });
      if (outcome === 'body syntax failure') body.reject(new SyntaxError('Unexpected token'));
      await flushRequests();
      assert.equal(app.writes.length, writesBefore, 'An unmounted view must receive no state updates');
      assert.equal(app.abortCalls, 0);
    });
  }
});

test('supervisor data shows current errors and clears them on a successful retry', async (t) => {
  const cases = [
    { name: 'network failure', fail: (request) => request.reject(new Error('Network unavailable')), message: 'Network unavailable' },
    { name: 'null rejection', fail: (request) => request.reject(null), message: 'Unable to connect. Please try again.' },
    { name: 'API failure', fail: (request) => request.resolve(response({ error: 'Access denied' }, false)), message: 'Access denied' },
    { name: 'malformed JSON', fail: (request) => request.resolve({ ok: true, json: async () => { throw new SyntaxError('Unexpected token'); } }), message: 'The server returned an unexpected response. Please try again.' },
  ];

  for (const scenario of cases) {
    await t.test(scenario.name, async () => {
      const app = await createHarness();
      app.render();
      scenario.fail(app.requests[0]);
      await flushRequests();
      const failed = app.current;
      assert.equal(failed.error, scenario.message);
      assert.equal(failed.loading, false);
      assert.equal(failed.data, null);

      failed.reload();
      app.render();
      assert.equal(app.current.error, '');
      assert.equal(app.current.loading, true);
      assert.equal(app.current.reload, failed.reload, 'Retry callback stays stable across renders');
      const recovered = { total: 3 };
      app.requests[1].resolve(response(recovered));
      await flushRequests();
      assert.equal(app.current.data, recovered);
      assert.equal(app.current.error, '');
      assert.equal(app.current.loading, false);
      app.unmount();
    });
  }
});

test('changing supervisor endpoints ignores an obsolete failure while the new request loads', async () => {
  const app = await createHarness('/api/supervisor/submissions');
  app.render();
  app.render('/api/supervisor/fbr-invoices');
  assert.equal(app.requests[0].url, '/api/supervisor/submissions');
  assert.equal(app.requests[1].url, '/api/supervisor/fbr-invoices');

  app.requests[0].reject(new Error('Old endpoint failed'));
  await flushRequests();
  assert.equal(app.current.loading, true);
  assert.equal(app.current.error, '');
  assert.equal(app.current.data, null);

  const invoices = { invoices: [{ id: 'invoice-1' }] };
  app.requests[1].resolve(response(invoices));
  await flushRequests();
  assert.equal(app.current.data, invoices);
  assert.equal(app.current.loading, false);
  app.unmount();
});

test('overlapping supervisor reloads keep the latest result when older requests finish last', async () => {
  const app = await createHarness();
  app.render();
  const original = { total: 1 };
  app.requests[0].resolve(response(original));
  await flushRequests();
  app.current.reload();
  app.render();
  assert.equal(app.current.loading, true);
  assert.equal(app.current.data, original);
  app.current.reload();
  app.render();
  assert.equal(app.requests.length, 3);

  const latest = { total: 3 };
  app.requests[2].resolve(response(latest));
  await flushRequests();
  assert.equal(app.current.data, latest);
  assert.equal(app.current.loading, false);

  const writesBefore = app.writes.length;
  app.requests[1].resolve(response({ total: 2 }));
  await flushRequests();
  assert.equal(app.current.data, latest);
  assert.equal(app.current.loading, false);
  assert.equal(app.current.error, '');
  assert.equal(app.writes.length, writesBefore, 'An obsolete reload must not write any state');
  app.unmount();
});

## [3.0.0](https://github.com/kleinfreund/retrieve/compare/v2.0.0...v3.0.0) (2025-05-01)

### ⚠ BREAKING CHANGES

* `retrieve` returns a promise that now **fulfills** with a `ResponseError` instead of **rejecting** with one.
* Errors during deserialization (e.g. JSON parse errors) are now thrown as their original errors rather than being wrapped in a ResponseError.
* Remove `config.requestErrorMessage` and `config.responseErrorMessage`.
* Change the return value of the functions provided to `config.requestErrorHandlers` and `config.responseErrorHandlers`. They now require returning either an `Error` or `Response` object instead of returning a `{ status: 'maintained', value: Error }` or `{ status: 'corrected', value: Response }` object.
* The first positional parameter of `config.beforeRequestHandlers`, the `URL` object used to construct the `Request` object passed to `fetch`, is replaced with that very `Request` object.
* The second positional parameter of `config.requestErrorHandlers`, the `URL` object used to construct the `Request` object passed to `fetch`, is replaced with that very `Request` object.
* The third positional parameter of `config.responseErrorHandlers`, the `URL` object used to construct the `Request` object passed to `fetch`, is removed. Use the `request` property on the second positional parameter, the `RetrieveResponse` object, instead.
* **pkg:** Remove the "retrieve/dist/retrieve.d.ts" module specifier. **How to update**: Use "retrieve" instead.

### Features

* accept Request object ([8349508](https://github.com/kleinfreund/retrieve/commit/83495081fd38c50e01aa48552a07f04346bd3ea2))

  Accept a `Request` object instead of the `RetrieveConfig` normally expected by `retrieve`. Using a `Request` object skips any of retrieve's preprocessing steps and doesn't execute any interceptors. The `Request` object is passed directly to `fetch`.
* add Request to RetrieveResponse ([0adf035](https://github.com/kleinfreund/retrieve/commit/0adf0359b4c7f2865e9344a125c52e878c8c6ea2))

  Add the `Request` object that was passed to `fetch` to the `RetrieveResponse` object.
* allow skipping fetch through returning Response from beforeRequestHandlers functions ([3a517cc](https://github.com/kleinfreund/retrieve/commit/3a517cc89958bda7f8890bb28b00219c2c0c90b8))

  Change `config.beforeRequestHandlers` to allow returning a `Response` object which will skip calling `fetch` entirely. This can be used to implement client-side caching of network requests or request mocking.
* allow typing deserialized data ([97405a9](https://github.com/kleinfreund/retrieve/commit/97405a9dfb0dde93770152f5eb0fd9aaf58b1bc7))

  Allow typing the deserialized `data` property on the `RetrieveResponse` returned by `retrieve` by making `retrieve` a generic function with two optional type parameters `Success` and `Error`. The `ResponseError` will also reflect this in its `data` property. The response success and error handlers will also reflect this in their `retrieveResponse` parameters accordingly.
* pass Request object to beforeRequestHandlers and requestErrorHandlers functions ([f06870f](https://github.com/kleinfreund/retrieve/commit/f06870f178de634aebe6efd88fa8118159cf5b27))

  Pass the `Request` object used when calling `fetch` to `beforeRequestHandlers` and `requestErrorHandlers` functions. This makes it easier to make changes before sending a request (like adding headers) or when trying to deal with request errors.

  **BREAKING CHANGE**: The first positional parameter of `config.beforeRequestHandlers`, the `URL` object used to construct the `Request` object passed to `fetch`, is replaced with that very `Request` object.

  **BREAKING CHANGE**: The second positional parameter of `config.requestErrorHandlers`, the `URL` object used to construct the `Request` object passed to `fetch`, is replaced with that very `Request` object.

  **BREAKING CHANGE**: The third positional parameter of `config.responseErrorHandlers`, the `URL` object used to construct the `Request` object passed to `fetch`, is removed. Use the `request` property on the second positional parameter, the `RetrieveResponse` object, instead.
* provide RequestInit object to all interceptors ([63eb72f](https://github.com/kleinfreund/retrieve/commit/63eb72f2cc3bb43adf178cf33bc55dcc63a8d6a1))

  Provide the `RequestInit` object used to construct the `Request` object to all interceptors.
* return ResponseError instead of throwing it ([b80d361](https://github.com/kleinfreund/retrieve/commit/b80d3616b3e0c0dba37fb7d95ea03517b92bc5b9))

  Change retrieve to fulfill with a `ResponseError` instead of rejecting.

  **BREAKING CHANGE**: `retrieve` returns a promise that now **fulfills** with a `ResponseError` instead of **rejecting** with one.

### Bug Fixes

* don't consume response body during deserialization ([ff8f77a](https://github.com/kleinfreund/retrieve/commit/ff8f77a7aaa2737072b542fc76d9dde5c54811a0))

  Change deserialization such that the response body is consumed on a cloned response so that the returned response bodies can still be consumed outside of retrieve.
* not adding same-name parameters ([9416b9f](https://github.com/kleinfreund/retrieve/commit/9416b9fdca9d2d809f3305792d2a68abce5e87a6))
* not using correct header for text bodies ([87f857b](https://github.com/kleinfreund/retrieve/commit/87f857bdb074c0ce5ae383b92b2bc96da7c3140a))

  Fix not setting the correct content type for request bodies that just contain text.

  Fix not deserializing "text/plain" response bodies.

### Miscellaneous Chores

* don't wrap deserialization errors in ResponseError ([116fd22](https://github.com/kleinfreund/retrieve/commit/116fd2273d9751582c3a1afd70ac6f0bde7ab15d))

  Change deserialization to no longer catch errors and wrapping them in a ResponseError before throwing them again. Instead, they're now thrown directly.

  **BREAKING CHANGE**: Errors during deserialization (e.g. JSON parse errors) are now thrown as their original errors rather than being wrapped in a ResponseError.
* **pkg:** remove ./dist/retrieve.d.ts module specifier ([9f08910](https://github.com/kleinfreund/retrieve/commit/9f0891084e24541392f8d98348f0934aa1d24ec0))

  **BREAKING CHANGE**: Remove the "retrieve/dist/retrieve.d.ts" module specifier. **How to update**: Use "retrieve" instead.
* remove requestErrorMessage and responseErrorMessage options ([094d211](https://github.com/kleinfreund/retrieve/commit/094d211e6f7d67ce1313c3204f765247d64c220a))

  **BREAKING CHANGE**: Remove `config.requestErrorMessage` and `config.responseErrorMessage`.

### Code Refactoring

* simplify request and response error handlers ([7c49294](https://github.com/kleinfreund/retrieve/commit/7c49294ca33457af8f85c29263787061205bf443))

  Simplify `config.requestErrorHandlers` and `config.responseErrorHandlers` functions to require an `Error` or `Response` object as their return value to maintain or correct an error respectively instead of the currently needed object with a `status` and `value` property.

  **BREAKING CHANGE**: Change the return value of the functions provided to `config.requestErrorHandlers` and `config.responseErrorHandlers`. They now require returning either an `Error` or `Response` object instead of returning a `{ status: 'maintained', value: Error }` or `{ status: 'corrected', value: Response }` object.

## [2.0.0](https://github.com/kleinfreund/retrieve/compare/v1.2.1...v2.0.0) (2024-10-20)

### ⚠ BREAKING CHANGES

* Change the first parameter of `ResponseError` to expect a `RetrieveResponse` object instead of a `Response` object. **How to update**: Replace `new ResponseError(response, ...)` with `new ResponseError({ response, data: null }, ...)`.

### Features

* add data to ResponseError ([bdddbdc](https://github.com/kleinfreund/retrieve/commit/bdddbdc5190442d4a7a357629e95eeaa763d5a1b))

  Add a new `data` property to `ResponseError`s holding the same deserialized value as the `data` property on `RetrieveResponse` objects. If an exception occurs during deserialization, the value will be `null`.

  **BREAKING CHANGE**: Change the first parameter of `ResponseError` to expect a `RetrieveResponse` object instead of a `Response` object. **How to update**: Replace `new ResponseError(response, ...)` with `new ResponseError({ response, data: null }, ...)`.

## [1.2.1](https://github.com/kleinfreund/retrieve/compare/v1.2.0...v1.2.1) (2023-12-05)


### Bug Fixes

* crash on window access in node environments ([bf014f3](https://github.com/kleinfreund/retrieve/commit/bf014f352fd3a0eaec3e2b8b0de8415bc00b5d39))

  Fix retrieve not working in Node environments caused by accessing `window` without first checking if it exists.

## [1.2.0](https://github.com/kleinfreund/retrieve/compare/v1.1.1...v1.2.0) (2023-11-25)


### Features

* relax response error handler types ([5095993](https://github.com/kleinfreund/retrieve/commit/5095993f41d2fba78cfcb1cc788631cd1a5542a1))

  Relaxes the types of response error handlers. The first argument of a response error handler is now typed as `Error` instead of `ResponseError`. Only the type changes. The value is unchanged: the object will still be a `ResponseError` unless a previous response error handler changes it. Similarly, the return value for maintained errors now expects a `value` of type `Error` instead of requiring `ResponseError`. This makes it easier to use response error handler because you can now return custom error formats without angering the TypeScript compiler.


### Bug Fixes

* only processing the first response success handler ([f4a1e06](https://github.com/kleinfreund/retrieve/commit/f4a1e065f2a58278850f26259468a9f1153093c1))

  Fixes an issue with response success handlers where only the first handler was processed.
* processing more response error handlers after one corrected an error ([7567bc5](https://github.com/kleinfreund/retrieve/commit/7567bc549d68ef73c4bedd9db9d9b6c41d0f98b2))

  Fixes an issue with the processing of response error handlers where if a handler corrected the error state, retrieve would continue processing the remaining handlers. This was unintentional and neither matched the behavior of request error handlers nor the documentation for response error handlers.
* processing response success handlers in error case ([92567fb](https://github.com/kleinfreund/retrieve/commit/92567fb4e39f070b2c85427bfcd754cfb87b2471))

  Fixes an issue with response success handlers where handlers were executed even if the network response had an error status code.

## [1.1.1](https://github.com/kleinfreund/retrieve/compare/v1.1.0...v1.1.1) (2023-11-18)


### Bug Fixes

* overriding x-requested-with header ([f9d32d4](https://github.com/kleinfreund/retrieve/commit/f9d32d4fbc8cd5d4b7104c868eac12421c7f27f6))

  Fixes setting the x-requested-with header when `config.init.headers` already has a value for that header field.

# [1.1.0](https://github.com/kleinfreund/retrieve/compare/v1.0.0...v1.1.0) (2023-07-16)


### Features

* changes default response error message ([20ef3eb](https://github.com/kleinfreund/retrieve/commit/20ef3eba0b20e71526224f2329d7e8d6831f8cc2))

  Changes the default response error message from `'Unknown response error'` to `$statusCode $statusText` (e.g. `'404 Not Found'`).


### Bug Fixes

* ignoring `config.init.body` ([514b3e6](https://github.com/kleinfreund/retrieve/commit/514b3e699251e255ef549c76403a69f03decce9d))

  Fixes an issue where `config.init.body` would always be ignored regardless of `config.data` being set. Now, if `config.data` is not set and `config.init.body` is set, `config.init.body` will be used as the request body as-is.

* not passing `config.init` to `fetch` ([4139f4f](https://github.com/kleinfreund/retrieve/commit/4139f4fe67392a5968b6ded515e2497f10ca3959))

  Fixes a bug causing `config.init` not to be passed as the `init` parameter to `fetch`.

* using JSON content-type for POST requests with FormData body ([5ae55df](https://github.com/kleinfreund/retrieve/commit/5ae55df407cd8fdd7930b7939b3730aa1d99331a))

  Fixes POST requests with `config.data` being set to a `FormData` object being sent with a content type `'application/json'`. Instead, such requests now will be sent with **no** content type as the browser will set it automatically.

# 1.0.0 (2023-06-20)


### Features

* adds retrieve ([e533c21](https://github.com/kleinfreund/retrieve/commit/e533c219bbe7455d5a44b9728397b671935140f8))

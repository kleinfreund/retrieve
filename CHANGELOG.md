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

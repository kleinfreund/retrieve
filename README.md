# retrieve

[![Tests passing](https://github.com/kleinfreund/retrieve/workflows/Tests/badge.svg)](https://github.com/kleinfreund/retrieve/actions)

A convenience wrapper around fetch for the browser (and anything that has `fetch`).

This package’s files are distributed in the ES module format and have not been transpiled.

**Links**:

- [demo](https://retrieve.netlify.app)
- [**npmjs.com**/package/retrieve](https://www.npmjs.com/package/retrieve)
	- [on BundlePhobia](https://bundlephobia.com/result?p=retrieve)
- [**github.com**/kleinfreund/retrieve](https://github.com/kleinfreund/retrieve)
	- [code of conduct](https://github.com/kleinfreund/retrieve/blob/main/CODE_OF_CONDUCT.md)
	- [contributing guidelines](https://github.com/kleinfreund/retrieve/blob/main/CONTRIBUTING.md)

**Features** (see [Features](#features) for more detailed descriptions):

- [sets the right “content-type” header based on the request body format](#request-content-type-guessing)
- [serializes request bodies (JSON)](#request-body-serialization)
- [deserializes response bodies (JSON, FormData, text)](#response-body-deserialization)
- [returns a rejecting promise with a `ResponseError` for error responses](#returning-a-rejecting-promise-for-error-responses)
- [supports interceptors that can implement error correcting logic](#interceptors)

Why is it called `retrieve`? I wanted to call it `makeRequest` (I like clean and explicit names), but that already exists on npm. So I went with `retrieve` because that's similar to `fetch`.

## Contents

- [Installation & usage](#installation--usage)
	- [As npm package](#as-npm-package)
	- [As plain JS file](#as-plain-js-file)
- [Documentation](#documentation)
	- [Parameters](#parameters)
		- [`config`](#config)
			- [`url`](#url)
			- [`baseUrl`](#baseurl-optional)
			- [`params`](#params-optional)
			- [`init`](#init-optional)
			- [`data`](#data-optional)
			- [`requestErrorMessage`](#requesterrormessage-optional)
			- [`responseErrorMessage`](#responseerrormessage-optional)
			- [`timeout`](#timeout-optional)
			- [`beforeRequestHandlers`](#beforerequesthandlers-optional)
			- [`requestErrorHandlers`](#requesterrorhandlers-optional)
			- [`responseSuccessHandlers`](#responsesuccesshandlers-optional)
			- [`responseErrorHandlers`](#responseerrorhandlers-optional)
	- [Return value](#return-value)
	- [Exceptions](#exceptions)
		- [`TypeError`](#typeerror)
		- [`ResponseError`](#responseerror)
- [Examples](#examples)
	- [Example 1: make simple API request](#example-1-make-simple-api-request)
	- [Example 2: use response error](#example-2-use-response-error)
	- [Example 3: retrying requests](#example-3-retrying-requests)
	- [Example 4: submitting form data (POST)](#example-4-submitting-form-data-post)
	- [Example 5: submitting form data (GET)](#example-5-submitting-form-data-get)
- [Features](#Features)
	- [Request content type guessing](#request-content-type-guessing)
	- [Request body serialization](#request-body-serialization)
	- [Response body deserialization](#response-body-deserialization)
	- [Returning a rejecting promise for error responses](#returning-a-rejecting-promise-for-error-responses)
	- [Interceptors](#interceptors)
- [Versioning](#versioning)

## Installation & usage

### As npm package

Install the `retrieve` package.

```sh
npm install retrieve
```

Import the `retrieve` function and use it.

```js
import { retrieve } from 'retrieve'

const { data, response } = await retrieve({ url: 'http://example.org' })
console.dir(data, response)
```

### As plain JS file

Download the `retrieve` module.

```sh
curl -O 'https://cdn.jsdelivr.net/npm/retrieve@latest/dist/retrieve.js'
```

Import the `retrieve` function and use it.

```html
<script type="module">
	import { retrieve } from './retrieve.js'

	const { data, response } = await retrieve({ url: 'http://example.org' })
	console.dir(data, response)
</script>
```

## Documentation

Basic usage of `retrieve` looks like this:

```ts
const { data } = await retrieve({
	url: 'https://pokeapi.co/api/v2/pokemon',
})
```

### Parameters

#### `config`

A `RetrieveConfig` object.

##### `url`

The request URL.

- `URL`: Will be used as-is.
- `string`:
	- Absolute URL string: Will be used as-is.
	- Relative URL path string: Will be turned into an absolute URL (using `config.baseUrl`).

##### `baseUrl` (optional)

**Default**: `window.location.origin` in browser environments; otherwise, `undefined`

Base for request URL. Ignored if `config.url` is a `URL` object or an absolute URL `string`.

##### `params` (optional)

Request query parameters. Will be appended to the request URL. Parameters already existing on the request URL will be overridden. New parameters will be added.

FormData is intentionally not supported because it cannot be easily and reliably turned into an `URLSearchParams` object. If you can guarantee that your `FormData` object doesn't hold files, you can provide `config.params` using `new URLSearchParams(formData)`.

##### `init` (optional)

Init object passed to `fetch`.

The following changes are made to the `init` object before it is passed to `fetch` (but without changing `config.init`):

- **Headers**: If no “content-type” header is set, it is determined automatically where appropriate:

	- “application/octet-stream” if `config.data` is an ArrayBuffer of Blob object
	- “plain/text” if `config.data` is a string
	- “application/json” if `config.data` is set and the request method isn't GET or HEAD

	Note that if `config.data` is set to a `FormData` object, an existing content type **will be removed**. Read the warning on [MDN: Using FormData Objects: Sending files using a FormData object](https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects#sending_files_using_a_formdata_object) for an explanation.
- **Body**: If `config.data` is set, it will be used for fetch's `init.body`. See `config.data` description for more information. Otherwise, if `config.init.body` is set, it will be used for fetch's `init.body`.
- **Signal**: If `config.timeout` is set to a positive number, it will be used to create fetch's `init.signal` using `AbortSignal.timeout(config.timeout)`.

##### `data` (optional)

Request body data.

If `config.data` is set:

- … and the “content-type” header is “application/json”, `init.body` is set to the result of `JSON.stringify(config.data)`
- … otherwise, `init.body` is set to `config.data`. It's your responsibility to make sure `config.data` can be used on `init.body` (see [fetch() global function: parameters](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters)).

##### `requestErrorMessage` (optional)

**Default**: `'Unknown request error'`

Message for request errors.

If set, it overrides the underlying error's own message which will then be set on the request error's `cause` property.

##### `responseErrorMessage` (optional)

**Default**: `$statusCode $statusText` (e.g. `'404 Not Found'`)

Message for response errors.

##### `timeout` (optional)

**Default**: `0` (no timeout)

Request timeout in milliseconds.

##### `beforeRequestHandlers` (optional)

Processed right before a request is sent (i.e. before calling `fetch`). Allows making changes to the parameters passed to `fetch` after they've been processed by `retrieve`.

**Example**:

```js
const config = {
	url: 'https://api.example.org',
	beforeRequestHandlers: [
		(url, init) => {
			const url = import.meta.env.MODE === 'development'
				? new URL('http://localhost:1234/api')
				: url
			return [url, init]
		},
	],
}
```

##### `requestErrorHandlers` (optional)

Processed if sending the request failed (i.e. the promise returned by `fetch` was rejected). Allows implementing corrective measures.

Exceptions during the processing of a request error handler are not caught.

A request error handler can have one of two results:

- maintaining the error state of the request (indicated by returning `{ status: 'maintained', value: error }`)
- correcting the error state of the request (indicated by returning `{ status: 'corrected', value: response }`)

Returning a result object with the corrected status and a `Response` object allows `retrieve` to continue processing the request as if no error occurred in the first place. Then, no further error request handlers will be processed.

**Example**:

```js
const config = {
	url: 'https://api.example.org',
	requestErrorHandlers: [
		async (requestError, url, init) => {
			// Do something to fix the error cause
			const response = await fetch(url, init)

			return { status: 'corrected', value: response }
		},
	],
}
```

Returning a result object with the maintained status and an `Error` object makes `retrieve` continue treating the request as having errored. Note also that all request error handlers will be processed as long as the previous handlers maintain the error state.

**Example**:

```js
const config = {
	url: 'https://api.example.org',
	requestErrorHandlers: [
		(requestError, url, init) => {
			// Do something with requestError
			requestError.message = 'ERR: ' + requestError.message

			return { status: 'maintained', value: requestError }
		},
	],
}
```

##### `responseSuccessHandlers` (optional)

Processed if sending the request succeeded and a response with a status code 200–299 was returned (i.e. the promise returned by `fetch` is fulfilled and yields a `Response` object whose `ok` property is set to `true`).

Exceptions during the processing of a response success handler are not caught.

**Example**:

```js
const config = {
	url: 'https://api.example.org',
	responseErrorHandlers: [
		async (retrieveResponse, url, init) => {
			// Do something with retrieveResponse
			return retrieveResponse
		},
	],
}
```

##### `responseErrorHandlers` (optional)

Processed if sending the request succeeded and a response with a status code >=300 was returned (i.e. the promise returned by `fetch` is fulfilled and yields a `Response` object whose `ok` property is set to `false`).

Exceptions during the processing of a response error handler are not caught.

A response error handler can have one of two results:

- maintaining the error state of the response (indicated by returning `{ status: 'maintained', value: error }`)
- correcting the error state of the response (indicated by returning `{ status: 'corrected', value: response }`)

Returning a result object with the corrected status and a `Response` object allows `retrieve` to continue processing the response as if no error occurred in the first place. Then, no further error response handlers will be processed.

**Example**:

```js
const config = {
	url: 'https://api.example.org',
	responseErrorHandlers: [
		async (error, retrieveResponse, url, init) => {
			if (retrieveResponse.response.status === 401) {
				// Do something to fix the error cause (e.g. refresh the user's session)
				const response = await fetch(url, init)

				return { status: 'corrected', value: response }
			}

			return { status: 'maintained', value: error }
		},
	],
}
```

Returning a result object with the maintained status and an `ResponseError` object makes `retrieve` continue treating the response as having errored. Note also that all response error handlers will be processed as long as the previous handlers maintain the error state.

**Example**:

```js
const config = {
	url: 'https://api.example.org',
	responseErrorHandlers: [
		async (error, retrieveResponse, url, init) => {
			// Do something with error
			error.message = 'ERR: ' + error.message

			return { status: 'maintained', value: error }
		},
	],
}
```

### Return value

A `Promise` that resolves to a `RetrieveResponse` object.

### Exceptions

#### `TypeError`

A `TypeError` is thrown when `fetch` does (see [fetch() global function: Exceptions](https://developer.mozilla.org/en-US/docs/Web/API/fetch#exceptions)).

#### `ResponseError`

A `ResponseError` is thrown for `fetch` responses with a status code >=300.

By default, this error will be an instance of `ResponseError` which will have access to the original `Response` object returned by `fetch`:

```js
try {
	await retrieve({
		url: 'https://pokeapi.co/api/v2/pokemon/grogu/',
	})
} catch (error) {
	if (error instanceof ResponseError) {
		console.log(error.response)
	}
}
```

Note that when using response error handlers that the final error is determined by you and may or may not be a `ResponseError`.

## Examples

### Example 1: make simple API request

```js
async function example() {
	const { data, response } = await retrieve({
		url: 'https://pokeapi.co/api/v2/pokemon/pikachu/',
	})
	console.dir(data, response)
}

example()
```

### Example 2: use response error

```js
async function example() {
	try {
		await retrieve({
			url: 'https://pokeapi.co/api/v2/pokemon/grogu/',
		})
	} catch (error) {
		console.dir(error)
	}
}

example()
```

### Example 3: retrying requests

```js
async function example() {
	await retrieve({
		url: 'http://api.example.org/status',
		responseErrorHandlers: [
			async (error, retrieveResponse, url, init) => {
				if (retrieveResponse.response.status === 401) {
					// Do something to fix the error cause (e.g. refresh the user's session)
					const response = await fetch(url, init)

					return { status: 'corrected', value: response }
				}

				return { status: 'maintained', value: error }
			},
		],
	})
}

example()
```

### Example 4: submitting form data (POST)

**Warning**: This is an educational example only. As it stands, a plain HTML `form` element without any JavaScript will handle such a use case just fine and do a better job of it. No need for `retrieve`.

```html
<form method="POST" enctype="multipart/form-data">
	<label>
		Name
		<input type="text" name="name" value="value">
	</label>

	<label>
		Age
		<input type="number" name="age" value="0">
	</label>

	<label>
		File
		<input type="file" name="file">
	</label>

	<button>Submit</button>
</form>
```

```js
const form = document.querySelector('form')

form.addEventListener('submit', function (event) {
	event.preventDefault()

	const form = event.target

	retrieve({
		url: form.action,
		data: new FormData(form),
		init: {
			method: form.method,
		},
	})
})
```

### Example 5: submitting form data (GET)

**Warning**: This is an educational example only. As it stands, a plain HTML `form` element without any JavaScript will handle such a use case just fine and do a better job of it. No need for `retrieve`.

```html
<form>
	<label>
		Name
		<input type="text" name="name" value="value">
	</label>

	<label>
		Age
		<input type="number" name="age" value="0">
	</label>

	<button>Submit</button>
</form>
```

```js
const form = document.querySelector('form')

form.addEventListener('submit', function (event) {
	event.preventDefault()

	const form = event.target

	retrieve({
		url: form.action,
		params: new URLSearchParams(new FormData(form)),
		init: {
			method: form.method,
		},
	})
})
```

### Example 6: transforming response error

Use a response error handler to transform a well-defined error format on your API responses into a custom API error class.

```js
class ApiError extends Error {
	code = null

	constructor(message, code = null) {
		super(message)
		this.code = code
	}

	toJSON() {
		return {
			code: this.code,
			message: this.message,
		}
	}
}

async function example() {
	try {
		await retrieve({
			url: 'http://api.example.org/status',
			responseErrorHandlers: [
				async (error, { data }) => {
					let message = error.message
					let code = null

					if (data && typeof data === 'object') {
						if ('message' in data && typeof data.message === 'string') {
							message = data.message
						}

						if ('code' in data && typeof data.code === 'string') {
							code = data.code
						}
					}

					return {
						status: 'maintained',
						value: new ApiError(message, code),
					}
				},
			],
		})
	} catch (error) {
		if (error instanceof ApiError) {
			console.error(`${error.code}: ${error.message}`)
		} else {
			console.error(error)
		}
	}
}

example()
```

## Features

### Request content type guessing

The content type for the request is guessed based on the request body format (if one isn't set already).

- `application/octet-stream` if `config.data` is an `ArrayBuffer` of `Blob` object
- `plain/text` if `config.data` is a string
- `application/json` if `config.data` is set and the request method isn't GET or HEAD

### Request body serialization

The request body is automatically serialized for JSON request bodies.

### Response body deserialization

The response body is automatically deserialized for JSON, `FormData`, or text response bodies based on the response's content-type header.

### Returning a rejecting promise for error responses

In case of receiving a response with a status code >=300 from the underlying `fetch` call, `retrieve` will return a rejecting promise (with a `ResponseError`). The behavior of `fetch` is to return a resolving promise (with a `Response`) instead.

### Interceptors

Four types of interceptors are supported:

- Before request: processed before a request is sent
- Request error: processed if a network error is encountered
- Response success: processed if a response with status 200-299 is returned
- Response error: processed if a response with status >=300 is returned

Both error interceptors support error correcting logic triggered by returning a new `Response` object (e.g. the result of a new `fetch` call).

See [Example: retrying requests](#example-3-retrying-requests)

## Versioning

This package uses [semantic versioning](https://semver.org).

# retrieve

[![Tests passing](https://github.com/kleinfreund/retrieve/workflows/Tests/badge.svg)](https://github.com/kleinfreund/retrieve/actions)

A convenience wrapper around fetch for the browser (and anything that has `fetch` like Node.js).

This package’s files are distributed in the ES module format and have not been transpiled.

**Links**:

- [demo](https://retrieve.netlify.app)
- [**npmjs.com**/package/retrieve](https://www.npmjs.com/package/retrieve)
- [**github.com**/kleinfreund/retrieve](https://github.com/kleinfreund/retrieve)
	- [code of conduct](https://github.com/kleinfreund/retrieve/blob/main/CODE_OF_CONDUCT.md)
	- [contributing guidelines](https://github.com/kleinfreund/retrieve/blob/main/CONTRIBUTING.md)

**Features** (see [Features](#features) for more detailed descriptions):

- [sets the right “content-type” header based on the request body format](#request-content-type-guessing)
- [serializes request bodies (JSON)](#request-body-serialization)
- [deserializes response bodies (JSON, FormData, text)](#response-body-deserialization)
- [allows typing deserialization result for successful and failed responses](#typing-response-data)
- [supports interceptors that can implement error correcting logic](#interceptors)

Why is it called `retrieve`? I wanted to call it `makeRequest` (I like clean and explicit names), but that already exists on npm. So I went with `retrieve` because that's similar to `fetch`.

## Contents

- [Installation & usage](#installation--usage)
	- [As npm package](#as-npm-package)
	- [As plain JS file](#as-plain-js-file)
- [Documentation](#documentation)
	- [Parameters](#parameters)
		- [`config`](#config)
			- [`config.url`](#configurl-required)
			- [`config.baseUrl`](#configbaseurl-optional)
			- [`config.params`](#configparams-optional)
			- [`config.init`](#configinit-optional)
			- [`config.data`](#configdata-optional)
			- [`config.timeout`](#configtimeout-optional)
			- [`config.beforeRequestHandlers`](#configbeforerequesthandlers-optional)
			- [`config.requestErrorHandlers`](#configrequesterrorhandlers-optional)
			- [`config.responseSuccessHandlers`](#configresponsesuccesshandlers-optional)
			- [`config.responseErrorHandlers`](#configresponseerrorhandlers-optional)
		- [`request`](#request)
	- [Return value](#return-value)
	- [Exceptions](#exceptions)
		- [`TypeError`](#typeerror)
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
	- [Typing response data](#typing-response-data)
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

With error handling and types:

```ts
type Pokemon = { id: number, name: string }
type ApiError = string

const result = await retrieve<Pokemon, ApiError>({
	url: 'https://pokeapi.co/api/v2/pokemon/25',
})

if (result instanceof ResponseError) {
	console.error(result.data)
	//                   ^^^^ ApiError
} else {
	console.dir(result.data)
	//                 ^^^^ Pokemon
}
```

### Parameters

The `retrieve` function takes one parameter, `configOrRequest`, which can be either a `RetrieveConfig` or `Request` object.

#### `config`

A `RetrieveConfig` object. Read the following sections to learn more.

##### `config.url` (required)

The request URL.

- `URL`: Will be used as-is.
- `string`:
	- Absolute URL string: Will be used as-is.
	- Relative URL path string: Will be turned into an absolute URL (using `config.baseUrl`).

**Note**: Providing a `Request` object to `config.url` is intentionally not possible. If you want to use a `Request` object, provide it _instead_ of `configOrRequest` (see [request](#request)).

##### `config.baseUrl` (optional)

**Default**: `window.location.origin` in browser environments; otherwise, `undefined`

Base for request URL. Ignored if `config.url` is a `URL` object or an absolute URL `string`.

##### `config.params` (optional)

Request query parameters. Will be appended to the request URL. Parameters already existing on the request URL will be overridden. New parameters will be added.

FormData is intentionally not supported because it cannot be easily and reliably turned into an `URLSearchParams` object. If you can guarantee that your `FormData` object doesn't hold files, you can provide `config.params` using `new URLSearchParams(formData)`.

##### `config.init` (optional)

Init object passed to `fetch`.

The following changes are made to the `init` object before it is passed to `fetch` (but without changing `config.init`):

- **Headers**: If no “content-type” header is set, it is determined automatically where appropriate:

	- “application/octet-stream” if `config.data` is an ArrayBuffer of Blob object
	- “plain/text” if `config.data` is a string
	- “application/json” if `config.data` is set and the request method isn't GET or HEAD

	Note, that if `config.data` is set to a `FormData` object, an existing content type **will be removed**. Read the warning on [MDN: Using FormData Objects: Sending files using a FormData object](https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects#sending_files_using_a_formdata_object) for an explanation.
- **Body**: If `config.data` is set, it will be used for fetch's `init.body`. See `config.data` description for more information. Otherwise, if `config.init.body` is set, it will be used for fetch's `init.body`.
- **Signal**: If `config.timeout` is set to a positive number, it will be used to create fetch's `init.signal` using `AbortSignal.timeout(config.timeout)`.

##### `config.data` (optional)

Request body data.

If `config.data` is set:

- … and the “content-type” header is “application/json”, `init.body` is set to the result of `JSON.stringify(config.data)`
- … otherwise, `init.body` is set to `config.data`. It's your responsibility to make sure `config.data` can be used on `init.body` (see [fetch() global function: parameters](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters)).

##### `config.timeout` (optional)

**Default**: `0` (no timeout)

Request timeout in milliseconds.

##### `config.beforeRequestHandlers` (optional)

Run right before a request is sent (i.e. before calling `fetch`). Allows making changes to the parameters passed to `fetch` after they've been processed by `retrieve`. Also allows skipping the call to `fetch` entirely.

Exceptions during the processing of a before request handler are not caught.

A before request handler can have one of two results:

- proceeding with the execution of `retrieve` like normal
- altering the normal execution of `retrieve` to avoid making the call to `fetch` entirely (indicated by returning a `Response` object)

When returning a `Response` object in a before request handler, the call to `fetch` is skipped entirely and the subsequent execution of `retrieve` uses the `Response` object for all further logic.

**Example**:

```js
const config = {
	url: 'https://api.example.org',
	beforeRequestHandlers: [
		(request) => {
			request.headers.set('Authorization', 'Bearer ...')
		},
	],
}
```

##### `config.requestErrorHandlers` (optional)

Run when sending the request failed (i.e. the promise returned by `fetch` was rejected). Allows implementing corrective measures.

Exceptions during the processing of a request error handler are not caught.

A request error handler can have one of two results:

- maintaining the error state of the request
- correcting the error state of the request (indicated by returning a `Response` object)

Returning a `Response` object allows `retrieve` to continue processing the request as if no error occurred in the first place. Then, no further error request handlers will be processed.

**Example**:

```js
const config = {
	url: 'https://api.example.org',
	requestErrorHandlers: [
		async (error, request) => {
			// Do something to fix the error cause
			return await fetch(request)
		},
	],
}
```

Returning an `Error` object (or not returning anything or returning `undefined`) makes `retrieve` continue treating the request as having errored. All request error handlers will be processed as long as the previous handlers maintain the error state (i.e. don't return a `Response` object). A returned `Error` object will be passed to subsequent handlers.

**Example**:

```js
const config = {
	url: 'https://api.example.org',
	requestErrorHandlers: [
		(error, request) => {
			// Do something with error
			error.message = 'ERR: ' + error.message
			return error
		},
	],
}
```

##### `config.responseSuccessHandlers` (optional)

Run when sending the request succeeded and a response with a status code 200–299 was returned (i.e. the promise returned by `fetch` is fulfilled and yields a `Response` object whose `ok` property is set to `true`).

Exceptions during the processing of a response success handler are not caught.

**Example**:

```js
const config = {
	url: 'https://api.example.org',
	responseSuccessHandlers: [
		async (retrieveResponse) => {
			// Do something with retrieveResponse
		},
	],
}
```

##### `config.responseErrorHandlers` (optional)

Run when sending the request succeeded and a response with a status code >=300 was returned (i.e. the promise returned by `fetch` is fulfilled and yields a `Response` object whose `ok` property is set to `false`).

Exceptions during the processing of a response error handler are not caught.

A response error handler can have one of two results:

- maintaining the error state of the response
- correcting the error state of the response (indicated by returning a `Response` object)

Returning a `Response` object allows `retrieve` to continue processing the response as if no error occurred in the first place. Then, no further error response handlers will be processed.

**Example**:

```js
const config = {
	url: 'https://api.example.org',
	responseErrorHandlers: [
		async (error, { request, response }) => {
			if (response.status === 401) {
				// Do something to fix the error cause (e.g. refresh the user's session)
				const newAccessToken = '...'
				request.headers.set('Authorization', `Bearer ${newAccessToken}`)

				return await retrieve(request)
			}
		},
	],
}
```

Returning an `Error` object makes `retrieve` continue treating the response as having errored. Note also that all response error handlers will be processed as long as the previous handlers maintain the error state (i.e. don't return a `Response` object).

**Example**:

```js
const config = {
	url: 'https://api.example.org',
	responseErrorHandlers: [
		async (error, retrieveResponse) => {
			// Do something with error
			error.message = 'ERR: ' + error.message

			return error
		},
	],
}
```

#### `request`

When providing a `Request` object (instead of a `RetrieveConfig` object) to `retrieve`, all of retrieve's preprocessing steps are skipped and no interceptors are run. The `Request` object is instead directly passed to `fetch`. This is useful when retrying requests in `config.responseErrorHandlers`, for example.

### Return value

A `Promise` that fulfills with a `RetrieveResponse` object for successful responses (status code 200–299) or a `ResponseError` object for failed responses (status code >=300).

A `ResponseError` has access to:

- `request`: the `Request` object used when calling `fetch`
- `response`: the `Response` object returned by `fetch`
- `data`: the deserialized response body contents

```js
const result = await retrieve({
	url: 'https://pokeapi.co/api/v2/pokemon/grogu/',
})
if (result instanceof ResponseError) {
	console.error(result.response, result.data)
} else {
	console.log(result.response, result.data)
}
```

### Exceptions

#### `TypeError`

A `TypeError` is thrown when `fetch` does (see [fetch() global function: Exceptions](https://developer.mozilla.org/en-US/docs/Web/API/fetch#exceptions)).

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
	const result = await retrieve({
		url: 'https://pokeapi.co/api/v2/pokemon/grogu/',
	})
	console.dir(result)
	if (result instanceof ResponseError) {
		console.log(result.data)
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
			async (error, { request, response }) => {
				if (response.status === 401) {
					// Do something to fix the error cause (e.g. refresh the user's session)
					const newAccessToken = '...'
					request.headers.set('Authorization', `Bearer ${newAccessToken}`)

					return await retrieve(request)
				}
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

## Features

### Request content type guessing

The content type for the request is guessed based on the request body format (if one isn't set already).

- `application/octet-stream` if `config.data` is an `ArrayBuffer` of `Blob` object
- `plain/text` if `config.data` is a string
- `application/json` if `config.data` is set and the request method isn't GET or HEAD

### Request body serialization

The request body is automatically serialized for JSON request bodies.

### Response body deserialization

The response body is automatically deserialized for JSON, `FormData`, or text response bodies based on the response's content-type header. The deserialization happens on a _cloned_ `Response` object so that the body of the `Response` object included in `RetrieveResponse` and `ResponseError` objects can be consumed again.

### Typing response data

When using TypeScript, types for the deserialized response body can be provided via type parameters when calling `retrieve`. Two type parameters can be provided: one for the data if the response was successful (status code 200-299); one for the data if the response wasn't successful (status code >=300)

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

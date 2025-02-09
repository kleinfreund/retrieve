import { ResponseError } from './ResponseError.js'

export interface RetrieveConfig {
	/**
	 * Request URL.
	 *
	 * - `URL`: Will be used as-is.
	 * - `string`:
	 *   - Absolute URL string: Will be used as-is.
	 *   - Relative URL path string: Will be turned into an absolute URL (using `config.baseUrl`).
	 */
	url: string | URL

	/**
	 * Base for request URL. Ignored if `url` is a URL object or an absolute URL string.
	 *
	 * **Default**: `window.location.origin` in browser environments; otherwise, `undefined`
	 */
	baseUrl?: string | URL

	/**
	 * Request query parameters. Will be appended to the request URL. Parameters already existing on the request URL will be overridden. New parameters will be added.
	 *
	 * `FormData` is intentionally not supported because it cannot be easily and reliably turned into an `URLSearchParams` object. If you can guarantee that your `FormData` object doesn't hold files, you can provide `config.params` using `new URLSearchParams(formData)`.
	 */
	params?: Record<string, string> | URLSearchParams

	/**
	 * Init object passed to `fetch`.
	 *
	 * The following changes are made to the `init` object before it is passed to `fetch` (but without changing `config.init`):
	 *
	 * - **Headers**: If no “content-type” header is set, it is determined automatically where appropriate:
	 *
	 *   - “application/octet-stream” if `config.data` is an `ArrayBuffer` of `Blob` object
	 *   - “plain/text” if `config.data` is a string
	 *   - “application/json” if `config.data` is set and the request method isn't GET or HEAD
	 *
	 *   Note that if `config.data` is set to a `FormData` object, an existing content type **will be removed**. Read the warning on [MDN: Using FormData Objects: Sending files using a FormData object](https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects#sending_files_using_a_formdata_object) for an explanation.
	 * - **Body**: If `config.data` is set, it will be used for `init.body`. See `config.data` description for more information. Otherwise, if `config.init.body` is set, it will be used for fetch's `init.body`.
	 * - **Signal**: If `config.timeout` is set to a positive number, it will be used to create `init.signal` using `AbortSignal.timeout(config.timeout)`.
	 */
	init?: RequestInit

	/**
	 * Request body data.
	 *
	 * If `config.data` is set:
	 *
	 * - … and the “content-type” header is “application/json”, `init.body` is set to the result of `JSON.stringify(config.data)`
	 * - … otherwise, `init.body` is set to `config.data`. It's your responsibility to make sure `config.data` can used on `init.body` (see [fetch() global function: parameters](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters)).
	 */
	// Allowing `any` for this because I feel like I'd do more harm trying to type-guard against all the possible values that you can feed to `JSON.stringify` (which are a lot) than just letting the consumers of `retrieve` figure this out. Sorry. 🤡
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: any

	/**
	 * Message for request errors.
	 *
	 * If set, it overrides the underlying error's own message which will then be set on the request error's `cause` property.
	 *
	 * **Default**: `'Unknown request error'`
	 */
	requestErrorMessage?: string

	/**
	 * Message for response errors.
	 *
	 * **Default**: `$statusCode $statusText` (e.g. `'404 Not Found'`)
	 */
	responseErrorMessage?: string

	/**
	 * Request timeout in milliseconds.
	 *
	 * **Default**: `0` (no timeout)
	 */
	timeout?: number

	/**
	 * Processed right before a request is sent (i.e. before calling `fetch`). Allows making changes to the parameters passed to `fetch` after they've been processed by `retrieve`.
	 *
	 * **Example**:
	 *
	 * ```js
	 * const config = {
	 *   url: 'https://api.example.org',
	 *   beforeRequestHandlers: [
	 *     (request) => {
	 *       const url = import.meta.env.MODE === 'development'
	 *         ? 'http://localhost:1234/api'
	 *         : request.url
	 *       return new Request(url, request)
	 *     },
	 *   ],
	 * }
	 * ```
	 */
	beforeRequestHandlers?: BeforeRequestHandler[]

	/**
	 * Processed if sending the request failed (i.e. the promise returned by `fetch` was rejected). Allows implementing corrective measures.
	 *
	 * Exceptions during the processing of a request error handler are not caught.
	 *
	 * A request error handler can have one of two results:
	 *
import { ResponseError } from './ResponseError.js'

export interface RetrieveConfig {
	/**
	 * Request URL.
	 *
	 * - `URL`: Will be used as-is.
	 * - `string`:
	 *   - Absolute URL string: Will be used as-is.
	 *   - Relative URL path string: Will be turned into an absolute URL (using `config.baseUrl`).
	 */
	url: string | URL

	/**
	 * Base for request URL. Ignored if `url` is a URL object or an absolute URL string.
	 *
	 * **Default**: `window.location.origin` in browser environments; otherwise, `undefined`
	 */
	baseUrl?: string | URL

	/**
	 * Request query parameters. Will be appended to the request URL. Parameters already existing on the request URL will be overridden. New parameters will be added.
	 *
	 * `FormData` is intentionally not supported because it cannot be easily and reliably turned into an `URLSearchParams` object. If you can guarantee that your `FormData` object doesn't hold files, you can provide `config.params` using `new URLSearchParams(formData)`.
	 */
	params?: Record<string, string> | URLSearchParams

	/**
	 * Init object passed to `fetch`.
	 *
	 * The following changes are made to the `init` object before it is passed to `fetch` (but without changing `config.init`):
	 *
	 * - **Headers**: If no “content-type” header is set, it is determined automatically where appropriate:
	 *
	 *   - “application/octet-stream” if `config.data` is an `ArrayBuffer` of `Blob` object
	 *   - “plain/text” if `config.data` is a string
	 *   - “application/json” if `config.data` is set and the request method isn't GET or HEAD
	 *
	 *   Note that if `config.data` is set to a `FormData` object, an existing content type **will be removed**. Read the warning on [MDN: Using FormData Objects: Sending files using a FormData object](https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects#sending_files_using_a_formdata_object) for an explanation.
	 * - **Body**: If `config.data` is set, it will be used for `init.body`. See `config.data` description for more information. Otherwise, if `config.init.body` is set, it will be used for fetch's `init.body`.
	 * - **Signal**: If `config.timeout` is set to a positive number, it will be used to create `init.signal` using `AbortSignal.timeout(config.timeout)`.
	 */
	init?: RequestInit

	/**
	 * Request body data.
	 *
	 * If `config.data` is set:
	 *
	 * - … and the “content-type” header is “application/json”, `init.body` is set to the result of `JSON.stringify(config.data)`
	 * - … otherwise, `init.body` is set to `config.data`. It's your responsibility to make sure `config.data` can used on `init.body` (see [fetch() global function: parameters](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters)).
	 */
	// Allowing `any` for this because I feel like I'd do more harm trying to type-guard against all the possible values that you can feed to `JSON.stringify` (which are a lot) than just letting the consumers of `retrieve` figure this out. Sorry. 🤡
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: any

	/**
	 * Message for request errors.
	 *
	 * If set, it overrides the underlying error's own message which will then be set on the request error's `cause` property.
	 *
	 * **Default**: `'Unknown request error'`
	 */
	requestErrorMessage?: string

	/**
	 * Message for response errors.
	 *
	 * **Default**: `$statusCode $statusText` (e.g. `'404 Not Found'`)
	 */
	responseErrorMessage?: string

	/**
	 * Request timeout in milliseconds.
	 *
	 * **Default**: `0` (no timeout)
	 */
	timeout?: number

	/**
	 * Processed right before a request is sent (i.e. before calling `fetch`). Allows making changes to the parameters passed to `fetch` after they've been processed by `retrieve`.
	 *
	 * **Example**:
	 *
	 * ```js
	 * const config = {
	 *   url: 'https://api.example.org',
	 *   beforeRequestHandlers: [
	 *     (request) => {
	 *       const url = import.meta.env.MODE === 'development'
	 *         ? 'http://localhost:1234/api'
	 *         : request.url
	 *       return new Request(url, request)
	 *     },
	 *   ],
	 * }
	 * ```
	 */
	beforeRequestHandlers?: BeforeRequestHandler[]

	/**
	 * Processed if sending the request failed (i.e. the promise returned by `fetch` was rejected). Allows implementing corrective measures.
	 *
	 * Exceptions during the processing of a request error handler are not caught.
	 *
	 * A request error handler can have one of two results:
	 *
	 * - maintaining the error state of the request (indicated by returning an `Error` object)
	 * - correcting the error state of the request (indicated by returning a `Response` object)
	 *
	 * Returning a `Response` object allows `retrieve` to continue processing the request as if no error occurred in the first place. Then, no further error request handlers will be processed.
	 *
	 * **Example**:
	 *
	 * ```js
	 * const config = {
	 *   url: 'https://api.example.org',
	 *   requestErrorHandlers: [
	 *     async (error, request) => {
	 *       // Do something to fix the error cause
	 *       return await fetch(request)
	 *     },
	 *   ],
	 * }
	 * ```
	 *
	 * Returning an `Error` object makes `retrieve` continue treating the request as having errored. Note also that all request error handlers will be processed as long as the previous handlers maintain the error state (i.e. don't return a `Response` object).
	 *
	 * **Example**:
	 *
	 * ```js
	 * const config = {
	 *   url: 'https://api.example.org',
	 *   requestErrorHandlers: [
	 *     (error, request) => {
	 *       // Do something with error
	 *       error.message = 'ERR: ' + error.message
	 *
	 *       return error
	 *     },
	 *   ],
	 * }
	 * ```
	 */
	requestErrorHandlers?: RequestErrorHandler[]

	/**
	 * Processed if sending the request succeeded and a response with a status code 200–299 was returned (i.e. the promise returned by `fetch` is fulfilled and yields a `Response` object whose `ok` property is set to `true`).
	 *
	 * Exceptions during the processing of a response success handler are not caught.
	 *
	 * **Example**:
	 *
	 * ```js
	 * const config = {
	 *   url: 'https://api.example.org',
	 *   responseSuccessHandlers: [
	 *     async (retrieveResponse) => {
	 *       // Do something with retrieveResponse
	 *       return retrieveResponse
	 *     },
	 *   ],
	 * }
	 * ```
	 */
	responseSuccessHandlers?: ResponseSuccessHandler[]

	/**
	 * Processed if sending the request succeeded and a response with a status code >=300 was returned (i.e. the promise returned by `fetch` is fulfilled and yields a `Response` object whose `ok` property is set to `false`).
	 *
	 * Exceptions during the processing of a response error handler are not caught.
	 *
	 * A response error handler can have one of two results:
	 *
	 * - maintaining the error state of the response (indicated by returning an `Error` object)
	 * - correcting the error state of the response (indicated by returning a `Response` object)
	 *
	 * Returning a `Response` object allows `retrieve` to continue processing the response as if no error occurred in the first place. Then, no further error response handlers will be processed.
	 *
	 * **Example**:
	 *
	 * ```js
	 * const config = {
	 *   url: 'https://api.example.org',
	 *   responseErrorHandlers: [
	 *     async (error, retrieveResponse) => {
	 *       if (retrieveResponse.response.status === 401) {
	 *         // Do something to fix the error cause (e.g. refresh the user's session)
	 *         return await fetch(retrieveResponse.request)
	 *       }
	 *
	 *       return error
	 *     },
	 *   ],
	 * }
	 * ```
	 *
	 * Returning an `Error` object makes `retrieve` continue treating the response as having errored. Note also that all response error handlers will be processed as long as the previous handlers maintain the error state (i.e. don't return a `Response` object).
	 *
	 * **Example**:
	 *
	 * ```js
	 * const config = {
	 *   url: 'https://api.example.org',
	 *   responseErrorHandlers: [
	 *     async (error, retrieveResponse) => {
	 *       // Do something with error
	 *       error.message = 'ERR: ' + error.message
	 *
	 *       return error
	 *     },
	 *   ],
	 * }
	 * ```
	 */
	responseErrorHandlers?: ResponseErrorHandler[]
}

export interface RetrieveResponse {
	/**
	 * Original `Request` object passed to `fetch`.
	 */
	request: Request

	/**
	 * Original `Response` object as returned by `fetch`.
	 */
	response: Response

	/**
	 * Deserialized response body (if applicable).
	 *
	 * The following logic applies to deserialization:
	 *
	 * - Response content type starts with “application/json” or “application/problem+json”: the response body is parsed as JSON (using `Response.prototype.json`).
	 * - For everything else: the response body is parsed as text (using `Response.prototype.text`).
	 */
	data: unknown
}

export type ErrorHandlerResult = Response | Error

export type BeforeRequestHandler = (request: Request) => Request | Promise<Request>

export type RequestErrorHandler = (error: Error, request: Request) => ErrorHandlerResult | Promise<ErrorHandlerResult>

export type ResponseSuccessHandler = (retrieveResponse: RetrieveResponse) => RetrieveResponse | Promise<RetrieveResponse>

export type ResponseErrorHandler = (error: Error, retrieveResponse: RetrieveResponse) => ErrorHandlerResult | Promise<ErrorHandlerResult>

type BodyType = 'arrayBuffer' | 'blob' | 'formData' | 'json' | 'text'

const CONTENT_TYPE = 'content-type'
const CONTENT_TYPE_FORM_DATA = 'multipart/form-data'
const CONTENT_TYPE_JSON = 'application/json'
const CONTENT_TYPE_JSON_PROBLEM = 'application/problem+json'
const CONTENT_TYPE_OCTET_STREAM = 'application/octet-stream'
const CONTENT_TYPE_TEXT = 'plain/text'

const CONTENT_TYPES: Record<BodyType, string> = {
	arrayBuffer: CONTENT_TYPE_OCTET_STREAM,
	blob: CONTENT_TYPE_OCTET_STREAM,
	formData: CONTENT_TYPE_FORM_DATA,
	json: CONTENT_TYPE_JSON,
	text: CONTENT_TYPE_TEXT,
}

export async function retrieve (config: RetrieveConfig): Promise<RetrieveResponse> {
	const url = createUrl(config)
	const init = createInit(config)

	let request = new Request(url, init)
	for (const beforeRequestHandler of config.beforeRequestHandlers ?? []) {
		request = await beforeRequestHandler(request)
	}

	let response: Response | undefined

	try {
		response = await fetch(request)
	} catch (error) {
		let requestError = createRequestError(error, config.requestErrorMessage)

		for (const requestErrorHandler of config.requestErrorHandlers ?? []) {
			const result = await requestErrorHandler(requestError, request)
			if (result instanceof Response) {
				response = result
				// At this point, the current request error handler has corrected the error state (by returning a new `Response` object) and we stop processing any further request error handlers.
				break
			} else {
				requestError = result
			}
		}

		// If `response` isn't set here, the request error wasn't corrected and we can throw it.
		if (!response) {
			throw requestError
		}
		// Conversely, `response` being set here is the signal for the request error to have been corrected by a request error handler and for retrieve to move on to processing the response as if no request error had occurred in the first place.
	}

	let retrieveResponse = await createRetrieveResponse(request, response)

	if (retrieveResponse.response.ok) {
		for (const responseSuccessHandler of config.responseSuccessHandlers ?? []) {
			retrieveResponse = await responseSuccessHandler(retrieveResponse)
		}

		return retrieveResponse
	}

	let error: Error = new ResponseError(retrieveResponse, config.responseErrorMessage)

	for (const responseErrorHandler of config.responseErrorHandlers ?? []) {
		const result = await responseErrorHandler(error, retrieveResponse)

		if (result instanceof Response) {
			retrieveResponse = await createRetrieveResponse(request, result)
			// At this point, the current response error handler has corrected the error state (by returning a `Response` object) and no further response error handlers are processed.
			break
		} else {
			error = result
		}
	}

	if (retrieveResponse.response.ok) {
		return retrieveResponse
	}

	throw error
}

/**
 * Creates a `URL` object that will be passed to `fetch` as its `input` parameter.
 */
function createUrl (config: RetrieveConfig): URL {

import { ResponseError } from './ResponseError.js'
import { RetrieveResponse } from './RetrieveResponse.js'

export interface RetrieveConfig<Success = unknown, Failure = unknown> {
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
	 *   Note, that if `config.data` is set to a `FormData` object, an existing content type **will be removed**. Read the warning on [MDN: Using FormData Objects: Sending files using a FormData object](https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects#sending_files_using_a_formdata_object) for an explanation.
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
	 * - … otherwise, `init.body` is set to `config.data`. It's your responsibility to make sure `config.data` can be used on `init.body` (see [fetch() global function: parameters](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters)).
	 */
	// Allowing `any` for this because I feel like I'd do more harm trying to type-guard against all the possible values that you can feed to `JSON.stringify` (which are a lot) than just letting the consumers of `retrieve` figure this out. Sorry. 🤡
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data?: any

	/**
	 * Request timeout in milliseconds.
	 *
	 * **Default**: `0` (no timeout)
	 */
	timeout?: number

	/**
	 * Run right before a request is sent (i.e. before calling `fetch`). Allows making changes to the parameters passed to `fetch` after they've been processed by `retrieve`. Also allows skipping the call to `fetch` entirely.
	 *
	 * Exceptions during the processing of a before request handler are not caught.
	 *
	 * A before request handler can have one of two results:
	 *
	 * - proceeding with the execution of `retrieve` like normal
	 * - altering the normal execution of `retrieve` to avoid making the call to `fetch` entirely (indicated by returning a `Response` object)
	 *
	 * When returning a `Response` object in a before request handler, the call to `fetch` is skipped entirely and the subsequent execution of `retrieve` uses the `Response` object for all further logic.
	 *
	 * **Example**:
	 *
	 * ```js
	 * const config = {
	 *   url: 'https://api.example.org',
	 *   beforeRequestHandlers: [
	 *     (request) => {
	 *       request.headers.set('Authorization', 'Bearer ...')
	 *     },
	 *   ],
	 * }
	 * ```
	 */
	beforeRequestHandlers?: BeforeRequestHandler[]

	/**
	 * Run when sending the request failed (i.e. the promise returned by `fetch` was rejected). Allows implementing corrective measures.
	 *
	 * Exceptions during the processing of a request error handler are not caught.
	 *
	 * A request error handler can have one of two results:
	 *
	 * - maintaining the error state of the request
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
	 *       return await retrieve(request)
	 *     },
	 *   ],
	 * }
	 * ```
	 *
	 * Returning an `Error` object (or not returning anything or returning `undefined`) makes `retrieve` continue treating the request as having errored. All request error handlers will be processed as long as the previous handlers maintain the error state (i.e. don't return a `Response` object). A returned `Error` object will be passed to subsequent handlers.
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
	 *       return error
	 *     },
	 *   ],
	 * }
	 * ```
	 */
	requestErrorHandlers?: RequestErrorHandler[]

	/**
	 * Run when sending the request succeeded and a response with a status code 200–299 was returned (i.e. the promise returned by `fetch` is fulfilled and yields a `Response` object whose `ok` property is set to `true`).
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
	responseSuccessHandlers?: ResponseSuccessHandler<Success>[]

	/**
	 * Run when sending the request succeeded and a response with a status code >=300 was returned (i.e. the promise returned by `fetch` is fulfilled and yields a `Response` object whose `ok` property is set to `false`).
	 *
	 * Exceptions during the processing of a response error handler are not caught.
	 *
	 * A response error handler can have one of two results:
	 *
	 * - maintaining the error state of the response
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
	 *     async (error, { request, response }) => {
	 *       if (response.status === 401) {
	 *         // Do something to fix the error cause (e.g. refresh the user's session)
	 *         return await retrieve(request)
	 *       }
	 *     },
	 *   ],
	 * }
	 * ```
	 *
	 * Returning an `Error` object (or not returning anything or returning `undefined`) makes `retrieve` continue treating the response as having errored. All response error handlers will be processed as long as the previous handlers maintain the error state (i.e. don't return a `Response` object). A returned `Error` object will be passed to subsequent handlers.
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
	 *       return error
	 *     },
	 *   ],
	 * }
	 * ```
	 */
	responseErrorHandlers?: ResponseErrorHandler<Success, Failure>[]
}

interface NormalizedRequestInit extends RequestInit {
	method: string
	headers: Headers
}

type OptionalPromise<T> = T | Promise<T>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Interceptor<T extends (...args: any) => any> =
	// Accept interceptor return values wrapped in a promise or not
	((...args: Parameters<T>) => OptionalPromise<ReturnType<T> | undefined>)
	// Allow interceptors to implicitly return
	| ((...args: Parameters<T>) => void)

export type BeforeRequestHandler = Interceptor<(request: Request, init: NormalizedRequestInit) => Response | Request>

export type RequestErrorHandler = Interceptor<(error: Error, request: Request, init: NormalizedRequestInit) => Response | Error>

export type ResponseSuccessHandler<Success> = Interceptor<(retrieveResponse: RetrieveResponse<Success>, init: NormalizedRequestInit) => RetrieveResponse<Success>>

export type ResponseErrorHandler<Success, Failure> = Interceptor<(error: Error, retrieveResponse: RetrieveResponse<Failure>, init: NormalizedRequestInit) => RetrieveResponse<Success> | Response | Error>

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

/**
 * Takes a `RetrieveConfig` or `Request` object and makes a network request using `fetch`.
 *
 * When providing a `RetrieveConfig`, several preprocessing steps are performed before creating a `Request` object. That `Request` object (and the `RequestInit` object that was used to create it) is then passed to `config.beforeRequestHandlers` before it's ultimately passed to `fetch`.
 *
 * When providing a `Request` object, no preprocessing steps are performed and no interceptors are executed. The `Request` is passed to `fetch` directly. This is primarily intended for retrying requests inside `config.responseErrorHandlers`.
 */
export async function retrieve<Success = unknown, Failure = unknown> (configOrRequest: RetrieveConfig<Success, Failure> | Request): Promise<RetrieveResponse<Success>> {
	let beforeRequestHandlers: BeforeRequestHandler[]
	let requestErrorHandlers: RequestErrorHandler[]
	let responseSuccessHandlers: ResponseSuccessHandler<Success>[]
	let responseErrorHandlers: ResponseErrorHandler<Success, Failure>[]
	let init: NormalizedRequestInit
	let request: Request
	if (configOrRequest instanceof Request) {
		// Using empty arrays for all interceptors when receiving a `Request` object instead of a `RetrieveConfig` keeps the control flow further below simple.
		beforeRequestHandlers = []
		requestErrorHandlers = []
		responseSuccessHandlers = []
		responseErrorHandlers = []
		// Initializing the `init` variable is only done to keep proper types: I'd otherwise have to change the control flow below to only have the `init` variable in scope when a `RetrieveConfig` is being processed.
		init = { method: '', headers: new Headers() }
		request = configOrRequest
	} else {
		beforeRequestHandlers = configOrRequest.beforeRequestHandlers ?? []
		requestErrorHandlers = configOrRequest.requestErrorHandlers ?? []
		responseSuccessHandlers = configOrRequest.responseSuccessHandlers ?? []
		responseErrorHandlers = configOrRequest.responseErrorHandlers ?? []
		const url = createUrl(configOrRequest)
		init = createInit(configOrRequest)
		request = new Request(url, init)
	}

	let response: Response | undefined

	for (const beforeRequestHandler of beforeRequestHandlers) {
		const result = await beforeRequestHandler(request, init)
		if (result instanceof Response) {
			response = result
			// At this point, the current before request handler has corrected the error state (by returning a new `Response` object) and no further before request handlers are processed. Notably, the call to `fetch` will be skipped entirely.
			break
		} else {
			request = result !== undefined ? result : request
		}
	}

	try {
		if (!(response instanceof Response)) {
			response = await fetch(request)
		}
	} catch (error) {
		let requestError = createRequestError(error)

		for (const requestErrorHandler of requestErrorHandlers) {
			const result = await requestErrorHandler(requestError, request, init)
			if (result instanceof Response) {
				response = result
				// At this point, the current request error handler has corrected the error state (by returning a new `Response` object) and no further request error handlers are processed.
				break
			} else {
				requestError = result !== undefined ? result : requestError
			}
		}

		// If `response` isn't set here, the request error wasn't corrected and we can throw it.
		if (response === undefined) {
			throw requestError
		}
		// Conversely, `response` being set here is the signal for the request error to have been corrected by a request error handler and for retrieve to move on to processing the response as if no request error had occurred in the first place.
	}

	if (response.ok) {
		const data = await deserializeResponseBody(response) as Success
		let retrieveSuccessResponse = new RetrieveResponse({ request, response, data })
		for (const responseSuccessHandler of responseSuccessHandlers) {
			const result = await responseSuccessHandler(retrieveSuccessResponse, init)
			retrieveSuccessResponse = result !== undefined ? result : retrieveSuccessResponse
		}

		return retrieveSuccessResponse
	}

	const data = await deserializeResponseBody(response) as Failure
	const retrieveErrorResponse = new RetrieveResponse({ request, response, data })
	let error: Error = new ResponseError(retrieveErrorResponse)

	for (const responseErrorHandler of responseErrorHandlers) {
		const result = await responseErrorHandler(error, retrieveErrorResponse, init)

		if (result instanceof RetrieveResponse) {
			// At this point, the current response error handler has corrected the error state (by returning a `RetrieveResponse` object) and no further response error handlers are processed.
			return result
		} else if (result instanceof Response) {
			// At this point, the current response error handler has corrected the error state (by returning a `Response` object) and no further response error handlers are processed.
			const data = await deserializeResponseBody(result) as Success
			return new RetrieveResponse({ request, response: result, data })
		} else {
			error = result !== undefined ? result : error
		}
	}

	throw error
}

/**
 * Creates a `URL` object that will be passed to `fetch` as its `input` parameter.
 */
function createUrl<Success, Failure> (config: RetrieveConfig<Success, Failure>): URL {
	// Process request URL
	const baseUrl = config.baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : undefined)
	const url = new URL(config.url, baseUrl)

	// Turn `params` into query
	if (config.params) {
		// Delete any existing query parameters
		for (const name of url.searchParams.keys()) {
			url.searchParams.delete(name)
		}

		const params = config.params instanceof URLSearchParams
			? config.params
			: new URLSearchParams(config.params)

		for (const [name, value] of params) {
			url.searchParams.append(name, value)
		}
	}

	return url
}

/**
 * Creates a `RequestInit` object that will be passed to the `Request` constructor as its `init` parameter.
 */
function createInit<Success, Failure> (config: RetrieveConfig<Success, Failure>): NormalizedRequestInit {
	const originalInit = config.init ?? {}

	// Process request method
	const method = (originalInit.method ?? 'GET').toUpperCase()

	// Process request headers
	const headers = new Headers(originalInit.headers)
	if (!headers.has('x-request-with')) {
		headers.set('x-requested-with', 'XMLHttpRequest')
	}

	const init: NormalizedRequestInit = {
		...originalInit,
		method,
		headers,
	}

	// Determines request body type
	let bodyType: BodyType | undefined
	if ('data' in config) {
		const contentType = init.headers.get(CONTENT_TYPE)

		if (config.data instanceof ArrayBuffer) {
			bodyType = 'arrayBuffer'
		} else if (config.data instanceof Blob) {
			bodyType = 'blob'
		} else if (config.data instanceof FormData) {
			bodyType = 'formData'
		} else if (contentType?.startsWith(CONTENT_TYPE_JSON) || (contentType === null && !['GET', 'HEAD'].includes(init.method))) {
			bodyType = 'json'
		} else if (typeof config.data === 'string') {
			bodyType = 'text'
		}
	}

	if (bodyType === 'formData') {
		/**
		 * The content type shouldn't be explicitly set for requests with a `FormData` body because the browser will otherwise not add the form data boundary to the content type header (e.g. “multipart/form-data; boundary=...”),
		 *
		 * Source: https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects#sending_files_using_a_formdata_object
		 */
		init.headers.delete(CONTENT_TYPE)
	} else if (bodyType && !init.headers.has(CONTENT_TYPE)) {
		// Sets the content type if not already set explicitly.
		init.headers.set(CONTENT_TYPE, CONTENT_TYPES[bodyType])
	}

	// Process request body
	if ('data' in config) {
		init.body = bodyType === 'json' ? JSON.stringify(config.data) : config.data
	} else if ('body' in originalInit) {
		init.body = originalInit.body
	}

	if (config.timeout && !('signal' in init)) {
		init.signal = AbortSignal.timeout(config.timeout)
	}

	return init
}

function createRequestError (error: unknown): Error {
	if (error instanceof Error) {
		return error
	}

	return new Error(typeof error === 'string' && error !== '' ? error : 'Unknown request error')
}

/**
 * Takes a `Response` object and deserializes its body (if set)
 */
async function deserializeResponseBody (response: Response) {
	const contentType = response.headers.get(CONTENT_TYPE) ?? ''
	let bodyType: BodyType | undefined

	if (contentType.startsWith(CONTENT_TYPE_JSON) || contentType.startsWith(CONTENT_TYPE_JSON_PROBLEM)) {
		bodyType = 'json'
	} else if (contentType.startsWith(CONTENT_TYPE_FORM_DATA)) {
		bodyType = 'formData'
	} else if (contentType.startsWith(CONTENT_TYPE_TEXT)) {
		bodyType = 'text'
	}

	return bodyType ? await response.clone()[bodyType]() : null
}

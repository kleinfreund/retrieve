import { ResponseError } from './ResponseError.js'

export interface RetrieveConfig {
	/**
	 * Request URL.
	 *
	 * - `URL`: Will be used as-is.
	 * - `string`:
	 *   - Absolute URL string: Will be used as-is.
	 *   - Relative URL path string: Will be turned into an absolute URL (using `config.baseUrl` if set; otherwise `window.location.origin`).
	 */
	url: string | URL

	/**
	 * Base for request URL. Ignored if `url` is a URL object or an absolute URL string.
	 *
	 * **Default**: `window.location.origin`
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
	 *   - “application/octet-stream” if `config.data` is an `ArrayBuffer` of `Blob` object
	 *   - “plain/text” if `config.data` is a string
	 *   - “application/json” if `config.data` is set and the request method isn't GET or HEAD
	 * - **Body**: If `config.data` is set, it will be used for `init.body`. See `config.data` description for more information.
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
	 *     (url, init) => {
	 *       const url = import.meta.env.MODE === 'development'
	 *         ? new URL('http://localhost:1234/api')
	 *         : url
	 *       return [url, init]
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
	 * - maintaining the error state of the request (indicated by returning `{ status: 'maintained', value: error }`)
	 * - correcting the error state of the request (indicated by returning `{ status: 'corrected', value: response }`)
	 *
	 * Returning a result object with the corrected status and a `Response` object allows `retrieve` to continue processing the request as if no error occurred in the first place. Then, no further error request handlers will be processed.
	 *
	 * **Example**:
	 *
	 * ```js
	 * const config = {
	 *   url: 'https://api.example.org',
	 *   requestErrorHandlers: [
	 *     async (requestError, url, init) => {
	 *       // Do something to fix the error cause
	 *       const response = await fetch(url, init)
	 *
	 *         return { status: 'corrected', value: response }
	 *     },
	 *   ],
	 * }
	 * ```
	 *
	 * Returning a result object with the maintained status and an `Error` object makes `retrieve` continue treating the request as having errored. Note also that all request error handlers will be processed as long as the previous handlers maintain the error state.
	 *
	 * **Example**:
	 *
	 * ```js
	 * const config = {
	 *   url: 'https://api.example.org',
	 *   requestErrorHandlers: [
	 *     (requestError, url, init) => {
	 *       // Do something with requestError
	 *       requestError.message = 'ERR: ' + requestError.message
	 *
	 *       return { status: 'maintained', value: requestError }
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
	 *   responseErrorHandlers: [
	 *     async (retrieveResponse, url, init) => {
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
	 * - maintaining the error state of the response (indicated by returning `{ status: 'maintained', value: error }`)
	 * - correcting the error state of the response (indicated by returning `{ status: 'corrected', value: response }`)
	 *
	 * Returning a result object with the corrected status and a `Response` object allows `retrieve` to continue processing the response as if no error occurred in the first place. Then, no further error response handlers will be processed.
	 *
	 * **Example**:
	 *
	 * ```js
	 * const config = {
	 *   url: 'https://api.example.org',
	 *   responseErrorHandlers: [
	 *     async (responseError, retrieveResponse, url, init) => {
	 *       if (responseError.response.status === 401) {
	 *         // Do something to fix the error cause (e.g. refresh the user's session)
	 *         const response = await fetch(url, init)
	 *
	 *         return { status: 'corrected', value: response }
	 *       }
	 *
	 *       return { status: 'maintained', value: responseError }
	 *     },
	 *   ],
	 * }
	 * ```
	 *
	 * Returning a result object with the maintained status and an `ResponseError` object makes `retrieve` continue treating the response as having errored. Note also that all response error handlers will be processed as long as the previous handlers maintain the error state.
	 *
	 * **Example**:
	 *
	 * ```js
	 * const config = {
	 *   url: 'https://api.example.org',
	 *   responseErrorHandlers: [
	 *     async (responseError, retrieveResponse, url, init) => {
	 *       // Do something with responseError
	 *       responseError.message = 'ERR: ' + responseError.message
	 *
	 *       return { status: 'maintained', value: responseError }
	 *     },
	 *   ],
	 * }
	 * ```
	 */
	responseErrorHandlers?: ResponseErrorHandler[]
}

export type RetrieveResponse = {
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

export interface ErrorCorrectedResult {
	status: 'corrected'
	value: Response
}

export interface ErrorMaintainedResult<ErrorType> {
	status: 'maintained'
	value: ErrorType
}

export type ErrorHandlerResult<ErrorType = Error> = ErrorCorrectedResult | ErrorMaintainedResult<ErrorType>;

export type RetrieveFetchParams = [RetrieveConfig['url'], RequestInit]

export type BeforeRequestHandler = (...fetchParams: RetrieveFetchParams) => RetrieveFetchParams | Promise<RetrieveFetchParams>

export type RequestErrorHandler = (requestError: Error, ...fetchParams: RetrieveFetchParams) => ErrorHandlerResult | Promise<ErrorHandlerResult>

export type ResponseSuccessHandler = (responseObj: RetrieveResponse) => RetrieveResponse | Promise<RetrieveResponse>

export type ResponseErrorHandler = (responseError: ResponseError, responseObj: RetrieveResponse | undefined, ...fetchParams: RetrieveFetchParams) => ErrorHandlerResult<ResponseError> | Promise<ErrorHandlerResult<ResponseError>>

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

export async function retrieve(config: RetrieveConfig): Promise<RetrieveResponse> {
	const url = createUrl(config)
	const init = createInit(config)

	// Process request interceptors' `onBeforeRequest` handlers
	let fetchParams: RetrieveFetchParams = [url, init]
	for (const beforeRequestHandler of config.beforeRequestHandlers ?? []) {
		fetchParams = await beforeRequestHandler(...fetchParams)
	}

	let response: Response | undefined

	try {
		response = await fetch(...fetchParams)
	} catch (error) {
		let requestError = createRequestError(error, config.requestErrorMessage)

		// Process request interceptors' `onRequestError` handlers
		for (const requestErrorHandler of config.requestErrorHandlers ?? []) {
			const result = await requestErrorHandler(requestError, ...fetchParams)
			if (result.status === 'corrected') {
				response = result.value
				// At this point, the previously executed request error handler is considered to have *correct the error state* (by returning a new `Response` object). Thus we stop processing any further request error handlers.
				break
			} else {
				requestError = result.value
			}
		}

		// We assume that the request interceptors have corrected an error if `response` was set, so let's only throw the request error if that wasn't done.
		if (response === undefined) {
			throw requestError
		}
	}

	let retrieveResponse = await createRetrieveResponse(response)

	// Process response interceptors' `onResponseSuccess` handlers
	for (const responseSuccessHandler of config.responseSuccessHandlers ?? []) {
		if (retrieveResponse.response.ok) {
			retrieveResponse = await responseSuccessHandler(retrieveResponse)
		}

		return retrieveResponse
	}

	let responseError = new ResponseError(response, config.responseErrorMessage)

	// Process response interceptors' `onResponseError` handlers
	for (const responseErrorHandler of config.responseErrorHandlers ?? []) {
		const result = await responseErrorHandler(responseError, retrieveResponse, ...fetchParams)

		if (result.status === 'corrected') {
			// Only updates `retrieveResponse` so that remaining response interceptors can still deal be executed. An alternative would be to immediately return `retrieveResponse` if `retrieveResponse.response.ok` is `true` because at this point, the initial response error state can be considered recovered and any further error recovery procedure would be futile. But we don't really have to make this assumption and let the interceptors behave gracefully in this case (i.e. by them not performing error corrective actions in case the provided `retrieveResponse` has `retrieveResponse.response.ok` set to `true`).
			retrieveResponse = await createRetrieveResponse(result.value)
		} else {
			responseError = result.value
		}
	}

	if (retrieveResponse.response.ok) {
		return retrieveResponse
	}

	throw responseError
}

/**
 * Creates a `URL` object that will be passed to `fetch` as the `input` parameter.
 */
function createUrl(config: RetrieveConfig): URL {
	// Process request URL
	const url = new URL(config.url, config.baseUrl ?? window.location.origin)

	// Turns `params` into query parameters for GET requests
	if (config.params) {
		const params = config.params instanceof URLSearchParams
			? config.params
			: new URLSearchParams(config.params)

		for (const [param, value] of params) {
			url.searchParams.set(param, value)
		}
	}

	return url
}

function createInit(config: RetrieveConfig): RequestInit {
	const originalInit: RequestInit = config.init ?? {}
	const init: RequestInit = {}

	// Process request method
	init.method = (originalInit.method ?? 'GET').toUpperCase()

	// Process request headers
	const headers = originalInit.headers instanceof Headers
		? originalInit.headers
		: new Headers(originalInit.headers)

	headers.set('x-requested-with', 'XMLHttpRequest')

	// Determines request body type
	let bodyType: BodyType | undefined

	if ('data' in config) {
		const contentType = headers.get(CONTENT_TYPE)

		if (contentType?.startsWith(CONTENT_TYPE_JSON) || (contentType === null && !['GET', 'HEAD'].includes(init.method))) {
			bodyType = 'json'
		} else if (typeof config.data === 'string') {
			bodyType = 'text'
		} else if (config.data instanceof ArrayBuffer) {
			bodyType = 'arrayBuffer'
		} else if (config.data instanceof Blob) {
			bodyType = 'blob'
		} else if (config.data instanceof FormData) {
			bodyType = 'formData'
		}
	}

	if (bodyType !== undefined) {
		if (bodyType === 'formData') {
			/**
			 * The content type shouldn't be explicitly set for requests with a `FormData` body because the browser will otherwise not add the form data boundry to the content type header (e.g. “multipart/form-data; boundary=...”),
			 *
			 * Source: https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects#sending_files_using_a_formdata_object
			 */
			headers.delete(CONTENT_TYPE)
		} else if (!headers.has(CONTENT_TYPE)) {
			// Sets the content type if not already set explicitly.
			headers.set(CONTENT_TYPE, CONTENT_TYPES[bodyType])
		}
	}

	init.headers = headers

	// Process request body
	if ('data' in config) {
		init.body = bodyType === 'json' ? JSON.stringify(config.data) : config.data
	}

	if (config.timeout !== undefined && config.timeout > 0 && !('signal' in init)) {
		init.signal = AbortSignal.timeout(config.timeout)
	}

	return init
}

function createRequestError(error: unknown, requestErrorMessage?: string): Error {
	const requestError = error instanceof Error ? error : new Error()

	if (requestError.message !== '') {
		requestError.cause = requestError.message
	}

	// Overrides error message only if one is explicitly provided.
	if (requestErrorMessage) {
		requestError.message = requestErrorMessage
	} else if (typeof error === 'string' && error.length > 0) {
		requestError.message = error
	} else if (requestError.message === '') {
		requestError.message = 'Unknown request error'
	}

	return requestError
}

async function createRetrieveResponse(response: Response): Promise<RetrieveResponse> {
	const contentType = response.headers.get(CONTENT_TYPE) ?? ''
	let bodyType: BodyType | undefined

	if (contentType.startsWith(CONTENT_TYPE_JSON) || contentType.startsWith(CONTENT_TYPE_JSON_PROBLEM)) {
		bodyType = 'json'
	} else if (contentType.startsWith(CONTENT_TYPE_FORM_DATA)) {
		bodyType = 'formData'
	} else if (contentType.startsWith(CONTENT_TYPE_TEXT)) {
		bodyType = 'text'
	}

	try {
		const data = bodyType !== undefined ? await response[bodyType]() : null

		return { response, data }
	} catch (err) {
		const error = err as Error
		const errorOptions: ErrorOptions = {}
		if ('cause' in error) {
			errorOptions.cause = error.cause
		}

		throw new ResponseError(response, error.message, errorOptions)
	}
}

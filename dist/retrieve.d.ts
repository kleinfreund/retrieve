declare class RetrieveResponse<Data = unknown> {
    /**
     * Original `Request` object passed to `fetch`.
     */
    request: Request;
    /**
     * Original `Response` object returned by `fetch`.
     */
    response: Response;
    /**
     * Deserialized response body (if applicable).
     *
     * The following logic applies to deserialization:
     *
     * - Response content type starts with “application/json” or “application/problem+json”: the response body is parsed as JSON (using `Response.prototype.json`).
     * - For everything else: the response body is parsed as text (using `Response.prototype.text`).
     */
    data: Data;
    constructor({ request, response, data }: {
        request: Request;
        response: Response;
        data: Data;
    });
}

declare class ResponseError<Data = unknown> extends Error {
    name: string;
    request: RetrieveResponse<Data>['request'];
    response: RetrieveResponse<Data>['response'];
    data: RetrieveResponse<Data>['data'];
    constructor({ request, response, data }: RetrieveResponse<Data>);
    toJSON(): {
        name: string;
        message: string;
    };
}

interface RetrieveConfig<Success = unknown, Failure = unknown> {
    /**
     * Request URL.
     *
     * - `URL`: Will be used as-is.
     * - `string`:
     *   - Absolute URL string: Will be used as-is.
     *   - Relative URL path string: Will be turned into an absolute URL using `new URL(config.url, config.baseUrl)` (see also [MDN: Resolving relative references to a URL](https://developer.mozilla.org/en-US/docs/Web/API/URL_API/Resolving_relative_references)).
     */
    url: string | URL;
    /**
     * Base for request URL. Ignored if `url` is a URL object or an absolute URL string.
     *
     * **Default**: `window.location.origin` in browser environments; otherwise, `undefined`
     */
    baseUrl?: string | URL;
    /**
     * Request query parameters. Will be appended to the request URL. Parameters already existing on the request URL will be overridden. New parameters will be added.
     *
     * `FormData` is intentionally not supported because it cannot be easily and reliably turned into an `URLSearchParams` object. If you can guarantee that your `FormData` object doesn't hold files, you can provide `config.params` using `new URLSearchParams(formData)`.
     */
    params?: Record<string, string> | URLSearchParams;
    /**
     * Init object passed to `fetch`.
     *
     * The following changes are made to the `init` object before it is passed to `fetch` (but without changing `config.init`):
     *
     * - **Headers**: If no “content-type” header is set, it is determined automatically where appropriate:
     *
     *   - “application/octet-stream” if `config.data` is an `ArrayBuffer` or `Blob` object
     *   - “text/plain” if `config.data` is a string
     *   - “application/json” if `config.data` is set and the request method isn't GET or HEAD
     *
     *   Note, that if `config.data` is set to a `FormData` object, an existing content type **will be removed**. Read the warning on [MDN: Using FormData Objects: Sending files using a FormData object](https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects#sending_files_using_a_formdata_object) for an explanation.
     * - **Body**: If `config.data` is set, it will be used for `init.body`. See `config.data` description for more information. Otherwise, if `config.init.body` is set, it will be used for fetch's `init.body`.
     * - **Signal**: If `config.timeout` is set to a positive number, it will be used to create `init.signal` using `AbortSignal.timeout(config.timeout)`.
     */
    init?: RequestInit;
    /**
     * Request body data.
     *
     * If `config.data` is set:
     *
     * - … and the “content-type” header is “application/json”, `init.body` is set to the result of `JSON.stringify(config.data)`
     * - … otherwise, `init.body` is set to `config.data`. It's your responsibility to make sure `config.data` can be used on `init.body` (see [fetch() global function: parameters](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters)).
     */
    data?: any;
    /**
     * Request timeout in milliseconds.
     *
     * **Default**: `0` (no timeout)
     */
    timeout?: number;
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
    beforeRequestHandlers?: BeforeRequestHandler[];
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
    requestErrorHandlers?: RequestErrorHandler[];
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
    responseSuccessHandlers?: ResponseSuccessHandler<Success>[];
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
    responseErrorHandlers?: ResponseErrorHandler<Success, Failure>[];
}
interface NormalizedRequestInit extends RequestInit {
    method: string;
    headers: Headers;
}
type OptionalPromise<T> = T | Promise<T>;
type Interceptor<T extends (...args: any) => any> = ((...args: Parameters<T>) => OptionalPromise<ReturnType<T> | undefined>) | ((...args: Parameters<T>) => void);
type BeforeRequestHandler = Interceptor<(request: Request, init: NormalizedRequestInit) => Response | Request>;
type RequestErrorHandler = Interceptor<(error: Error, request: Request, init: NormalizedRequestInit) => Response | Error>;
type ResponseSuccessHandler<Success> = Interceptor<(retrieveResponse: RetrieveResponse<Success>, init: NormalizedRequestInit) => RetrieveResponse<Success>>;
type ResponseErrorHandler<Success, Failure> = Interceptor<(error: ResponseError<Failure>, retrieveResponse: RetrieveResponse<Failure>, init: NormalizedRequestInit) => RetrieveResponse<Success> | Response | ResponseError<Failure>>;
/**
 * Takes a {@link RetrieveConfig} or {@link Request} object and makes a network request using {@link fetch}.
 *
 * When providing a `RetrieveConfig`, several preprocessing steps are performed before creating a `Request` object. That `Request` object (and the `RequestInit` object that was used to create it) is then passed to `config.beforeRequestHandlers` before it's ultimately passed to `fetch`.
 *
 * When providing a `Request` object, no preprocessing steps are performed and no interceptors are executed. The `Request` is passed to `fetch` directly. This is primarily intended for retrying requests inside `config.responseErrorHandlers`.
 */
declare function retrieve<Success = unknown, Failure = unknown>(configOrRequest: RetrieveConfig<Success, Failure> | Request): Promise<RetrieveResponse<Success> | ResponseError<Failure>>;

export { type BeforeRequestHandler, type RequestErrorHandler, ResponseError, type ResponseErrorHandler, type ResponseSuccessHandler, type RetrieveConfig, RetrieveResponse, retrieve };

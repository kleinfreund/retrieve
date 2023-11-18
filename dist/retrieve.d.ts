declare class ResponseError extends Error {
    name: string;
    response: Response;
    constructor(response: Response, message?: string, options?: {
        cause?: unknown;
    });
    toJSON(): {
        name: string;
        message: string;
    };
}

interface RetrieveConfig {
    /**
     * Request URL.
     *
     * - `URL`: Will be used as-is.
     * - `string`:
     *   - Absolute URL string: Will be used as-is.
     *   - Relative URL path string: Will be turned into an absolute URL (using `config.baseUrl` if set; otherwise `window.location.origin`).
     */
    url: string | URL;
    /**
     * Base for request URL. Ignored if `url` is a URL object or an absolute URL string.
     *
     * **Default**: `window.location.origin`
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
     *   - “application/octet-stream” if `config.data` is an `ArrayBuffer` of `Blob` object
     *   - “plain/text” if `config.data` is a string
     *   - “application/json” if `config.data` is set and the request method isn't GET or HEAD
     *
     *   Note that if `config.data` is set to a `FormData` object, an existing content type **will be removed**. Read the warning on [MDN: Using FormData Objects: Sending files using a FormData object](https://developer.mozilla.org/en-US/docs/Web/API/FormData/Using_FormData_Objects#sending_files_using_a_formdata_object) for an explanation.
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
     * - … otherwise, `init.body` is set to `config.data`. It's your responsibility to make sure `config.data` can used on `init.body` (see [fetch() global function: parameters](https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters)).
     */
    data?: any;
    /**
     * Message for request errors.
     *
     * If set, it overrides the underlying error's own message which will then be set on the request error's `cause` property.
     *
     * **Default**: `'Unknown request error'`
     */
    requestErrorMessage?: string;
    /**
     * Message for response errors.
     *
     * **Default**: `$statusCode $statusText` (e.g. `'404 Not Found'`)
     */
    responseErrorMessage?: string;
    /**
     * Request timeout in milliseconds.
     *
     * **Default**: `0` (no timeout)
     */
    timeout?: number;
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
    beforeRequestHandlers?: BeforeRequestHandler[];
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
    requestErrorHandlers?: RequestErrorHandler[];
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
    responseSuccessHandlers?: ResponseSuccessHandler[];
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
    responseErrorHandlers?: ResponseErrorHandler[];
}
type RetrieveResponse = {
    /**
     * Original `Response` object as returned by `fetch`.
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
    data: unknown;
};
interface ErrorCorrectedResult {
    status: 'corrected';
    value: Response;
}
interface ErrorMaintainedResult<ErrorType> {
    status: 'maintained';
    value: ErrorType;
}
type ErrorHandlerResult<ErrorType = Error> = ErrorCorrectedResult | ErrorMaintainedResult<ErrorType>;
type RetrieveFetchParams = [RetrieveConfig['url'], RequestInit];
type BeforeRequestHandler = (...fetchParams: RetrieveFetchParams) => RetrieveFetchParams | Promise<RetrieveFetchParams>;
type RequestErrorHandler = (requestError: Error, ...fetchParams: RetrieveFetchParams) => ErrorHandlerResult | Promise<ErrorHandlerResult>;
type ResponseSuccessHandler = (responseObj: RetrieveResponse) => RetrieveResponse | Promise<RetrieveResponse>;
type ResponseErrorHandler = (responseError: ResponseError, responseObj: RetrieveResponse | undefined, ...fetchParams: RetrieveFetchParams) => ErrorHandlerResult<ResponseError> | Promise<ErrorHandlerResult<ResponseError>>;
declare function retrieve(config: RetrieveConfig): Promise<RetrieveResponse>;

export { type BeforeRequestHandler, type ErrorCorrectedResult, type ErrorMaintainedResult, type RequestErrorHandler, ResponseError, type ResponseErrorHandler, type ResponseSuccessHandler, type RetrieveConfig, type RetrieveFetchParams, type RetrieveResponse, retrieve };

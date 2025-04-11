export class RetrieveResponse<Data = unknown> {
	/**
	 * Original `Request` object passed to `fetch`.
	 */
	request: Request

	/**
	 * Original `Response` object returned by `fetch`.
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
	data: Data

	constructor ({ request, response, data }: { request: Request, response: Response, data: Data }) {
		this.request = request
		this.response = response
		this.data = data
	}
}

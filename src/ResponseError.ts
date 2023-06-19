export class ResponseError extends Error {
	response: Response

	constructor(response: Response, message?: string, options?: { cause?: unknown }) {
		super(message || 'Unknown response error', options)

		this.name = 'ResponseError'
		this.response = response
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
		}
	}
}

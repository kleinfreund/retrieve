export class ResponseError extends Error {
	name = 'ResponseError'
	response: Response

	constructor(response: Response, message?: string, options?: { cause?: unknown }) {
		super(message || 'Unknown response error', options)

		this.response = response
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
		}
	}
}

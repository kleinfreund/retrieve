import type { RetrieveResponse } from './retrieve.js'

export class ResponseError extends Error {
	name = 'ResponseError'
	data: RetrieveResponse['data']
	response: RetrieveResponse['response']

	constructor(retrieveResponse: RetrieveResponse, message?: string, options?: { cause?: unknown }) {
		super(message || `${retrieveResponse.response.status} ${retrieveResponse.response.statusText}`.trim(), options)

		this.data = retrieveResponse.data
		this.response = retrieveResponse.response
	}

	toJSON() {
		return {
			name: this.name,
			message: this.message,
		}
	}
}

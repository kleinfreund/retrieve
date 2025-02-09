import type { RetrieveResponse } from './RetrieveResponse.js'

export class ResponseError extends Error {
	name = 'ResponseError'
	request: RetrieveResponse['request']
	response: RetrieveResponse['response']
	data: RetrieveResponse['data']

	constructor (retrieveResponse: RetrieveResponse, message?: string, options?: { cause?: unknown }) {
		super(message || `${retrieveResponse.response.status} ${retrieveResponse.response.statusText}`.trim(), options)

		this.request = retrieveResponse.request
		this.response = retrieveResponse.response
		this.data = retrieveResponse.data
	}

	toJSON () {
		return {
			name: this.name,
			message: this.message,
		}
	}
}

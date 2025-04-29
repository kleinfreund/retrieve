import type { RetrieveResponse } from './RetrieveResponse.js'

export class ResponseError<Data = unknown> extends Error {
	name = 'ResponseError'
	request: RetrieveResponse<Data>['request']
	response: RetrieveResponse<Data>['response']
	data: RetrieveResponse<Data>['data']

	constructor ({ request, response, data }: RetrieveResponse<Data>) {
		const status = `${response.status} ${response.statusText}`.trim()
		const message = `Request “${request.method} ${request.url}” failed with status code ${status}`
		super(message)

		this.request = request
		this.response = response
		this.data = data
	}

	toJSON () {
		return {
			name: this.name,
			message: this.message,
		}
	}
}

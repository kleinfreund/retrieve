import { describe, expect, test } from 'vitest'
import { ResponseError } from './ResponseError.js'

describe('ResponseError', () => {
	test('has the expected data', () => {
		const request = new Request('http://example.org')
		const response = new Response()
		const data = null
		const error = new Error('Error message')
		const responseError = new ResponseError({ request, response, data }, error)

		expect(responseError.request).toBe(request)
		expect(responseError.response).toBe(response)
		expect(responseError.data).toBe(data)
		expect(responseError.toJSON()).toEqual({
			name: 'ResponseError',
			message: 'Error message',
		})
	})

	test.each([
		[
			undefined,
			'Request “GET http://example.org/” failed with status code 400 Bad Request',
		],
		[
			new Error(),
			'Request “GET http://example.org/” failed with status code 400 Bad Request',
		],
		[
			new Error(''),
			'Request “GET http://example.org/” failed with status code 400 Bad Request',
		],
		[
			new Error('Error message'),
			'Error message',
		],
	])('has the expected message', (error, expectedMessage) => {
		const responseError = new ResponseError({
			request: new Request('http://example.org'),
			response: new Response(undefined, { status: 400, statusText: 'Bad Request' }),
			data: null,
		}, error)

		expect(responseError.message).toBe(expectedMessage)
	})
})

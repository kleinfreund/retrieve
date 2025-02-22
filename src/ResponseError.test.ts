import { describe, expect, test } from 'vitest'
import { ResponseError } from './ResponseError.js'

describe('ResponseError', () => {
	test('toJSON produces expected result', () => {
		const request = new Request('http://example.org')
		const response = new Response()
		const data = null
		const error = new Error('Error message')
		const responseError = new ResponseError({ request, response, data }, error)

		expect(responseError.toJSON()).toEqual({
			name: 'ResponseError',
			message: 'Error message',
		})
	})

	test('holds reference to request/response/data', () => {
		const request = new Request('http://example.org')
		const response = new Response()
		const data = null
		const error = new Error('Error message')
		const responseError = new ResponseError({ request, response, data }, error)

		expect(responseError.request).toBe(request)
		expect(responseError.response).toBe(response)
		expect(responseError.data).toBe(data)
	})

	test.each([
		[
			undefined,
			'400 Bad Request',
		],
		[
			new Error(),
			'400 Bad Request',
		],
		[
			new Error(''),
			'400 Bad Request',
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

import { describe, expect, test } from 'vitest'
import { ResponseError } from './ResponseError.js'

describe('ResponseError', () => {
	test('has the expected data', () => {
		expect.assertions(5)
		const request = new Request('http://example.org')
		const response = new Response(undefined, { status: 400, statusText: 'Bad Request' })
		const data = null
		const responseError = new ResponseError({ request, response, data })

		expect(responseError.message).toBe('Request “GET http://example.org/” failed with status code 400 Bad Request')
		expect(responseError.request).toBe(request)
		expect(responseError.response).toBe(response)
		expect(responseError.data).toBe(data)
		expect(responseError.toJSON()).toEqual({
			name: 'ResponseError',
			message: 'Request “GET http://example.org/” failed with status code 400 Bad Request',
		})
	})
})

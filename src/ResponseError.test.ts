import { describe, expect, test } from 'vitest'
import { ResponseError } from './ResponseError.js'

describe('ResponseError', () => {
	test.each([
		[
			'Error message',
			new Response(),
			{
				name: 'ResponseError',
				message: 'Error message',
			},
		],
	])('toJSON produces expected result', (message, response, expectedToJsonObject) => {
		const responseError = new ResponseError(response, message)

		expect(responseError.toJSON()).toEqual(expectedToJsonObject)
	})

	test('holds reference to response object', () => {
		const response = new Response()
		const responseError = new ResponseError(response, 'Error message')

		expect(responseError.response).toBe(response)
	})

	test.each([
		[
			undefined,
			'Unknown response error',
		],
		[
			'',
			'Unknown response error',
		],
		[
			'Error message',
			'Error message',
		],
	])('has the expected message', (message, expectedMessage) => {
		const responseError = new ResponseError(new Response(), message)

		expect(responseError.message).toBe(expectedMessage)
	})
})

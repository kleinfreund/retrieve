import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

import { retrieve, type RetrieveConfig } from './retrieve.js'

type OriginalFetchParams = Parameters<typeof fetch>

describe('retrieve', () => {
	beforeEach(() => {
		vi.restoreAllMocks()
	})

	describe('fetch parameter preparation', () => {
		describe('url', () => {
			test.each([
				[
					'absolute URL as string',
					{
						url: 'http://example.org?query=value',
					},
					new URL('http://example.org?query=value'),
				],
				[
					'absolute URL as URL object',
					{
						url: new URL('http://example.org?query=value'),
					},
					new URL('http://example.org?query=value'),
				],
				[
					'absolute URL as string + add/override query parameters (record)',
					{
						url: 'http://example.org?query=value',
						params: {
							query: 'overridden-value',
							newParam: 'new-value',
						},
					},
					new URL('http://example.org?query=overridden-value&newParam=new-value'),
				],
				[
					'absolute URL as string + add/override query parameters (URLSearchParams)',
					{
						url: 'http://example.org?query=value',
						params: new URLSearchParams({
							query: 'overridden-value',
							newParam: 'new-value',
						}),
					},
					new URL('http://example.org?query=overridden-value&newParam=new-value'),
				],
				[
					'relative URL path as string + path withleading slash',
					{
						url: '/path',
						baseUrl: 'http://example.org',
					},
					new URL('http://example.org/path'),
				],
				[
					'relative URL path as string + path without leading slash',
					{
						url: 'path',
						baseUrl: 'http://example.org',
					},
					new URL('http://example.org/path'),
				],
			])('%s', async (_title: string, config: RetrieveConfig, expectedUrl: OriginalFetchParams[0]) => {
				vi.spyOn(global, 'fetch').mockImplementation((...fetchParams: OriginalFetchParams) => {
					assertUrlEquality(fetchParams[0], expectedUrl)

					return Promise.resolve(new Response('OK'))
				})

				await retrieve(config)

				expect(global.fetch).toHaveBeenCalled()
			})
		})

		describe('init', () => {
			describe('method', () => {
				test.each([
					[
						'no method defaults to GET',
						{
							url: 'http://example.org',
						},
						{
							method: 'GET',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
							}),
						},
					],
					[
						'lowercase method is uppercased',
						{
							url: 'http://example.org',
							init: {
								method: 'get',
							},
						},
						{
							method: 'GET',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
							}),
						},
					],
				])('%s', async (_title: string, config: RetrieveConfig, expectedInit: OriginalFetchParams[1]) => {
					vi.spyOn(global, 'fetch').mockImplementation((...fetchParams: OriginalFetchParams) => {
						assertInitEquality(fetchParams[1], expectedInit)

						return Promise.resolve(new Response('OK'))
					})

					await retrieve(config)

					expect(global.fetch).toHaveBeenCalled()
				})
			})

			describe('headers', () => {
				test.each([
					[
						'POST method sets content-type application/json',
						{
							url: 'http://example.org',
							init: {
								method: 'POST',
							},
							data: 'hello',
						} satisfies RetrieveConfig,
						{
							method: 'POST',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
								'content-type': 'application/json',
							}),
							body: '"hello"',
						},
					],
					[
						'PUT method sets content-type application/json',
						{
							url: 'http://example.org',
							init: {
								method: 'PUT',
							},
							data: 'hello',
						} satisfies RetrieveConfig,
						{
							method: 'PUT',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
								'content-type': 'application/json',
							}),
							body: '"hello"',
						},
					],
					[
						'PATCH method sets content-type application/json',
						{
							url: 'http://example.org',
							init: {
								method: 'PATCH',
							},
							data: 'hello',
						} satisfies RetrieveConfig,
						{
							method: 'PATCH',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
								'content-type': 'application/json',
							}),
							body: '"hello"',
						},
					],
					[
						'ArrayBuffer data sets content-type application/octet-stream',
						{
							url: 'http://example.org',
							data: new ArrayBuffer(8),
						} satisfies RetrieveConfig,
						{
							method: 'GET',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
								'content-type': 'application/octet-stream',
							}),
							body: new ArrayBuffer(8),
						},
					],
					[
						'Blob data sets content-type application/octet-stream',
						{
							url: 'http://example.org',
							data: new Blob(),
						} satisfies RetrieveConfig,
						{
							method: 'GET',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
								'content-type': 'application/octet-stream',
							}),
							body: new Blob(),
						},
					],
					[
						'FormData data sets content-type multipart/form-data',
						{
							url: 'http://example.org',
							data: new FormData(),
						} satisfies RetrieveConfig,
						{
							method: 'GET',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
								// Note: No “content-type” header is expected here as the browser will set it automatically for `FormData` request bodies.
							}),
							body: new FormData(),
						},
					],
					[
						'can provide headers as entries',
						{
							url: 'http://example.org',
							init: {
								headers: [['content-type', 'plain/text']],
							},
						} satisfies RetrieveConfig,
						{
							method: 'GET',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
								'content-type': 'plain/text',
							}),
						},
					],
					[
						'can provide headers as record',
						{
							url: 'http://example.org',
							init: {
								headers: { 'content-type': 'plain/text' },
							},
						} satisfies RetrieveConfig,
						{
							method: 'GET',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
								'content-type': 'plain/text',
							}),
						},
					],
					[
						'can provide headers as Headers object',
						{
							url: 'http://example.org',
							init: {
								headers: new Headers({ 'content-type': 'plain/text' }),
							},
						} satisfies RetrieveConfig,
						{
							method: 'GET',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
								'content-type': 'plain/text',
							}),
						},
					],
				])('%s', async (_title: string, config: RetrieveConfig, expectedInit: OriginalFetchParams[1]) => {
					vi.spyOn(global, 'fetch').mockImplementation((...fetchParams: OriginalFetchParams) => {
						assertInitEquality(fetchParams[1], expectedInit)

						return Promise.resolve(new Response('OK'))
					})

					await retrieve(config)

					expect(global.fetch).toHaveBeenCalled()
				})
			})

			describe('body', () => {
				test.each([
					[
						'JSON dictionary',
						{
							url: 'http://example.org',
							init: {
								method: 'POST',
							},
							data: {
								string: 'default',
								number: 1,
								date: new Date('2023-03-14T17:34:00'),
							},
						},
						{
							method: 'POST',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
								'content-type': 'application/json',
							}),
							body: '{"string":"default","number":1,"date":"2023-03-14T17:34:00.000Z"}',
						},
					],
					[
						'JSON plain null value',
						{
							url: 'http://example.org',
							init: {
								method: 'POST',
							},
							data: null,
						},
						{
							method: 'POST',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
								'content-type': 'application/json',
							}),
							body: 'null',
						},
					],
					[
						'JSON plain false value',
						{
							url: 'http://example.org',
							init: {
								method: 'POST',
							},
							data: false,
						},
						{
							method: 'POST',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
								'content-type': 'application/json',
							}),
							body: 'false',
						},
					],
					[
						'Plain text value',
						{
							url: 'http://example.org',
							init: {
								method: 'POST',
								headers: new Headers({ 'content-type': 'plain/text' }),
							},
							data: 'Hello, server!',
						},
						{
							method: 'POST',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
								'content-type': 'plain/text',
							}),
							body: 'Hello, server!',
						},
					],
				])('%s', async (_title: string, config: RetrieveConfig, expectedInit: OriginalFetchParams[1]) => {
					vi.spyOn(global, 'fetch').mockImplementation((...fetchParams: OriginalFetchParams) => {
						assertInitEquality(fetchParams[1], expectedInit)

						return Promise.resolve(new Response('OK'))
					})

					await retrieve(config)

					expect(global.fetch).toHaveBeenCalled()
				})
			})

			describe('signal', () => {
				beforeAll(() => {
					vi.useFakeTimers()
				})

				afterAll(() => {
					vi.useRealTimers()
				})

				test.each([
					[
						'5s timeout',
						{
							url: 'http://example.org',
							timeout: 1000,
						},
						// Note: This should be `new DOMException`, but somehow `DOMException instanceof Error` is `false` in JSDOM.
						new Error('Request timed out'),
					],
				])('%s', async (_title: string, config: RetrieveConfig, expectedError: Error) => {
					let rejectFetchPromise: (reason?: unknown) => unknown = () => undefined
					// @ts-expect-error We want to return a promise that doesn't resolve to test timeouts.
					vi.spyOn(global, 'fetch').mockImplementation(() => new Promise((_resolve, reject) => {
						rejectFetchPromise = reject
					}))

					// Fakes `AbortSignal.timeout` because it seems utterly unfazed by the fake timers meaning I can't speedrun it in the tests.
					vi.spyOn(AbortSignal, 'timeout').mockImplementation((timeout) => {
						setTimeout(() => {
							rejectFetchPromise(expectedError)
						}, timeout)

						return (new AbortController()).signal
					})

					const promise = retrieve(config)

					vi.runAllTimers()

					await expect(promise).rejects.toThrowError(expectedError)
				})
			})
		})
	})

	describe('fetch processing', () => {
		describe('network error', () => {
			test.each([
				[
					'Error + fetch error message',
					() => Promise.reject(new Error('Original error message')),
					{
						url: 'http://example.org',
					},
					new Error('Original error message'),
				],
				[
					'Error + default message',
					() => Promise.reject(new Error()),
					{
						url: 'http://example.org',
					},
					new Error('Unknown request error'),
				],
				[
					'Error + custom message',
					() => Promise.reject(new Error('Original error message')),
					{
						url: 'http://example.org',
						requestErrorMessage: 'Custom error message',
					},
					new Error('Custom error message', { cause: 'Original error message' }),
				],
				[
					'plain text + default message',
					// We specifically want to test this edge case.
					// eslint-disable-next-line prefer-promise-reject-errors
					() => Promise.reject('Now that’s just great'),
					{
						url: 'http://example.org',
					},
					new Error('Now that’s just great'),
				],
				[
					'plain text + custom message',
					// We specifically want to test this edge case.
					// eslint-disable-next-line prefer-promise-reject-errors
					() => Promise.reject('Original error message'),
					{
						url: 'http://example.org',
						requestErrorMessage: 'Custom error message',
					},
					new Error('Custom error message', { cause: 'Original error message' }),
				],
			])('%s', async (_title: string, fetchMock: typeof fetch, config: RetrieveConfig, expectedError: Error) => {
				vi.spyOn(global, 'fetch').mockImplementation(fetchMock)

				const promise = retrieve(config)
				await expect(promise).rejects.toThrowError(expectedError)
			})
		})

		describe('responses with status codes 200-299', () => {
			test.each([
				[
					'application/json',
					function () {
						const response = new Response('{"items":[{"key":"value"}]}', {
							status: 200,
							statusText: 'Super duper!',
							headers: {
								'content-type': 'application/json',
							},
						})

						return Promise.resolve(response)
					},
					{
						items: [
							{
								key: 'value',
							},
						],
					},
					{
						status: 200,
						statusText: 'Super duper!',
					},
				],
				[
					'application/json; charset=utf-8',
					function () {
						const response = new Response('{"items":[{"key":"value"}]}', {
							status: 200,
							statusText: 'Super duper!',
							headers: {
								'content-type': 'application/json; charset=utf-8',
							},
						})

						return Promise.resolve(response)
					},
					{
						items: [
							{
								key: 'value',
							},
						],
					},
					{
						status: 200,
						statusText: 'Super duper!',
					},
				],
				[
					'plain/text',
					function () {
						const response = new Response('OK', {
							status: 200,
							statusText: 'Super duper!',
							headers: {
								'content-type': 'plain/text',
							},
						})

						return Promise.resolve(response)
					},
					'OK',
					{
						status: 200,
						statusText: 'Super duper!',
					},
				],
				[
					'multipart/form-data',
					function () {
						const formData = new FormData()
						formData.set('name', 'test')
						const response = new Response(formData, {
							status: 200,
							statusText: 'Super duper!',
						})

						return Promise.resolve(response)
					},
					(function () {
						const formData = new FormData()
						formData.set('name', 'test')
						return formData
					})(),
					{
						status: 200,
						statusText: 'Super duper!',
					},
				],
			])('handles content-type %s', async (_title: string, fetchMock: typeof fetch, expectedData: unknown, expectedPartialResponse: Partial<Response>) => {
				vi.spyOn(global, 'fetch').mockImplementation(fetchMock)

				const { data, response } = await retrieve({ url: 'http://example.org' })

				// For some reason, the `FormData` object created using `Response.prototype.formData()` has a different structure than `new FormData()` and, worse, fails “formData instanceof FormData”. The following is an extremely poor workaround to this problem.
				// @ts-expect-error things are hard-enough as it is
				const dataA = data?.constructor.name === 'FormData' ? Array.from(data.entries()) : data
				// @ts-expect-error things are hard-enough as it is
				const dataB = expectedData?.constructor.name === 'FormData' ? Array.from(expectedData.entries()) : expectedData
				expect(dataA).toEqual(dataB)
				expect(response).toEqual(expect.objectContaining(expectedPartialResponse))
			})

			test.each([
				[
					function () {
						const response = new Response('{', {
							status: 200,
							statusText: 'Super duper!',
							headers: {
								'content-type': 'application/json',
							},
						})

						return Promise.resolve(response)
					},
					new Error('Expected property name or \'}\' in JSON at position 1'),
				],
			])('handles invalid JSON correctly', async (fetchMock: typeof fetch, expectedError: Error) => {
				// Throw the expected JSON error manually because different implementations will throw errors with different messages which makes this test unstable.
				vi.spyOn(Response.prototype, 'json').mockImplementation(() => {
					throw new Error('Expected property name or \'}\' in JSON at position 1')
				})
				vi.spyOn(global, 'fetch').mockImplementation(fetchMock)

				const promise = retrieve({ url: 'http://example.org' })

				await expect(promise).rejects.toThrowError(expectedError)
			})
		})

		describe('responses with status codes >=300', () => {
			test.each([
				[
					'no content-type',
					function () {
						const response = new Response('Oopsie!', {
							status: 400,
							statusText: 'Bad Request',
						})

						return Promise.resolve(response)
					},
					new Error('400 Bad Request'),
				],
				[
					'plain/text',
					function () {
						const response = new Response('Oopsie!', {
							status: 400,
							statusText: 'Bad Request',
							headers: {
								'content-type': 'plain/text',
							},
						})

						return Promise.resolve(response)
					},
					new Error('400 Bad Request'),
				],
				[
					'application/json',
					function () {
						const response = new Response('{"error":"oh no"}', {
							status: 400,
							statusText: 'Bad Request',
							headers: {
								'content-type': 'application/json',
							},
						})

						return Promise.resolve(response)
					},
					new Error('400 Bad Request'),
				],
				[
					'application/json; charset=utf-8',
					function () {
						const response = new Response('{"error":"oh no"}', {
							status: 400,
							statusText: 'Bad Request',
							headers: {
								'content-type': 'application/json; charset=utf-8',
							},
						})

						return Promise.resolve(response)
					},
					new Error('400 Bad Request'),
				],
				[
					'application/problem+json; charset=utf-8',
					function () {
						const response = new Response('{"error":"oh no"}', {
							status: 400,
							statusText: 'Bad Request',
							headers: {
								'content-type': 'application/problem+json; charset=utf-8',
							},
						})

						return Promise.resolve(response)
					},
					new Error('400 Bad Request'),
				],
			])('handles content-type %s', async (_title: string, fetchMock: typeof fetch, expectedError: Error) => {
				vi.spyOn(global, 'fetch').mockImplementation(fetchMock)

				const promise = retrieve({ url: 'http://example.org' })
				await expect(promise).rejects.toThrow(expectedError)
			})

			test('response error has cause if present on underlying error', async () => {
				vi.spyOn(Response.prototype, 'json').mockImplementation(() => {
					const error = new SyntaxError('You messed up', { cause: 'badly' })

					return Promise.reject(error)
				})
				vi.spyOn(global, 'fetch').mockImplementation(function () {
					const response = new Response('Oopsie!', {
						status: 400,
						statusText: 'Bad, bad request',
						headers: {
							'content-type': 'application/json',
						},
					})

					return Promise.resolve(response)
				})

				let error
				try {
					await retrieve({ url: 'http://example.org' })
				} catch (err) {
					error = err
				}

				// @ts-expect-error it's fine
				expect(error.message).toBe('You messed up')
				// @ts-expect-error promise
				expect(error.cause).toBe('badly')
			})

			test('response with no content-type is handled correctly', async () => {
				vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve(new Response(null)))

				const { data } = await retrieve({ url: 'http://example.org' })

				expect(data).toBe(null)
			})
		})
	})

	describe('interceptors', () => {
		describe('beforeRequestHandlers', () => {
			test.each([
				[
					{
						url: 'http://example.org/path',
						beforeRequestHandlers: [
							(url, init) => {
								const newUrl = toUrl(url)
								newUrl.href += '-x'
								return [newUrl, init]
							},
						],
					} satisfies RetrieveConfig,
					new URL('http://example.org/path-x'),
					{
						method: 'GET',
						headers: new Headers({
							'x-requested-with': 'XMLHttpRequest',
						}),
					},
				],
				[
					{
						url: 'http://example.org/path',
						beforeRequestHandlers: [
							(url, init) => [url, { ...init, method: 'PATCH' }],
						],
					} satisfies RetrieveConfig,
					new URL('http://example.org/path'),
					{
						method: 'PATCH',
						headers: new Headers({
							'x-requested-with': 'XMLHttpRequest',
						}),
					},
				],
			])('onResponseSuccess handlers produce response', async (config: RetrieveConfig, ...expectedFetchParams: OriginalFetchParams) => {
				vi.spyOn(global, 'fetch').mockImplementation((...fetchParams: OriginalFetchParams) => {
					assertUrlEquality(fetchParams[0], expectedFetchParams[0])
					assertInitEquality(fetchParams[1], expectedFetchParams[1])

					return Promise.resolve(new Response('OK'))
				})

				await retrieve(config)

				expect(global.fetch).toHaveBeenCalled()
			})
		})

		describe('requestErrorHandlers', () => {
			test.each([
				[
					{
						url: 'http://example.org',
						requestErrorHandlers: [
							(error) => ({ status: 'maintained', value: error }),
						],
					} satisfies RetrieveConfig,
					new Error('Standard error'),
				],
				[
					{
						url: 'http://example.org',
						requestErrorHandlers: [
							(error) => {
								error.message = 'Overridden error'
								return { status: 'maintained', value: error }
							},
						],
					} satisfies RetrieveConfig,
					new Error('Overridden error'),
				],
			])('onRequestError handlers produce error', async (config: RetrieveConfig, expectedError: Error) => {
				vi.spyOn(global, 'fetch').mockImplementation(() => Promise.reject(new Error('Standard error')))

				const promise = retrieve(config)
				await expect(promise).rejects.toThrowError(expectedError)
			})

			test.each([
				[
					{
						url: 'http://example.org',
						requestErrorHandlers: [
							() => {
								const response = new Response('Hell yeah!', {
									headers: {
										'content-type': 'plain/text',
									},
								})

								return { status: 'corrected', value: response }
							},
						],
					} satisfies RetrieveConfig,
					'Hell yeah!',
				],
			])('onRequestError handlers produce response', async (config: RetrieveConfig, expectedData: unknown) => {
				vi.spyOn(global, 'fetch').mockImplementation(() => Promise.reject(new Error('Standard error')))

				const { data } = await retrieve(config)

				expect(data).toEqual(expectedData)
			})

			test.each([
				[
					{
						url: 'http://example.org',
						requestErrorHandlers: [
							() => {
								throw 'Unknown error format'
							},
						],
					} satisfies RetrieveConfig,
					'Unknown error format',
				],
			])('onRequestError handlers raise exception on unknown error format', async (config: RetrieveConfig, expectedError: string) => {
				vi.spyOn(global, 'fetch').mockImplementation(() => Promise.reject(new Error('Standard error')))

				const promise = retrieve(config)
				await expect(promise).rejects.toThrowError(expectedError)
			})
		})

		describe('responseSuccessHandlers', () => {
			test.each([
				[
					{
						url: 'http://example.org',
						responseSuccessHandlers: [
							(responseObj) => {
								responseObj.data = 'test'
								return Promise.resolve(responseObj)
							},
						],
					} satisfies RetrieveConfig,
					'test',
				],
			])('onResponseSuccess handlers produce response', async (config: RetrieveConfig, expectedData: unknown) => {
				vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve(new Response('OK')))

				const { data } = await retrieve(config)

				expect(data).toEqual(expectedData)
			})
		})

		describe('responseErrorHandlers', () => {
			test.each([
				[
					{
						url: 'http://example.org/path',
						responseErrorHandlers: [
							(error) => {
								error.message = 'Altered message'
								return { status: 'maintained', value: error }
							},
						],
					} satisfies RetrieveConfig,
					new Error('Altered message'),
				],
			])('onResponseError handlers produce error', async (config: RetrieveConfig, expectedError: Error) => {
				vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve(new Response('Unauthorized', { status: 401 })))

				const promise = retrieve(config)
				await expect(promise).rejects.toThrowError(expectedError)
			})

			test.each([
				[
					{
						url: 'http://example.org',
						responseErrorHandlers: [
							() => {
								const response = new Response('Hell yeah!', {
									headers: {
										'content-type': 'plain/text',
									},
								})

								return { status: 'corrected', value: response }
							},
						],
					} satisfies RetrieveConfig,
					'Hell yeah!',
				],
			])('onResponseError handlers produce response', async (config: RetrieveConfig, expectedData: unknown) => {
				vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve(new Response('Unauthorized', { status: 401 })))

				const { data } = await retrieve(config)

				expect(data).toEqual(expectedData)
			})

			test.each([
				[
					{
						url: 'http://example.org',
						responseErrorHandlers: [
							() => {
								throw 'Unknown error format'
							},
						],
					} satisfies RetrieveConfig,
					'Unknown error format',
				],
			])('onResponseError handlers raise exception on unknown error format', async (config: RetrieveConfig, expectedError: string) => {
				vi.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve(new Response('Unauthorized', { status: 401 })))

				const promise = retrieve(config)
				await expect(promise).rejects.toThrowError(expectedError)
			})
		})
	})
})


function assertUrlEquality(urlA: OriginalFetchParams[0], urlB: OriginalFetchParams[0]) {
	expect(toUrl(urlA).href).toEqual(toUrl(urlB).href)
}

function assertInitEquality(initA: OriginalFetchParams[1], initB: OriginalFetchParams[1]) {
	const headersA = Array.from(new Headers(initA?.headers))
	const headersB = Array.from(new Headers(initB?.headers))
	expect(headersA).toEqual(headersB)
	expect(initA).toEqual(initB)
}

/**
 * Helper to unwrap fetch URLs because Jest will never fail on `expect(new URL(a)).toEqual(new URL(b))`.
 */
function toUrl(url: OriginalFetchParams[0]): URL {
	return typeof url === 'string'
		? new URL(url)
		: url instanceof URL
			? url : new URL(url.url)
}

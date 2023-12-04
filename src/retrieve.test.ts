import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'

import { retrieve, type RetrieveConfig } from './retrieve.js'

describe('retrieve', () => {
	beforeEach(() => {
		vi.restoreAllMocks()
	})

	describe('fetch parameter preparation', () => {
		describe('url', () => {
			test.each<[string, RetrieveConfig, URL]>([
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
			])('%s', async (_title, config, expectedInput) => {
				vi.spyOn(window, 'fetch').mockImplementation(() => Promise.resolve(new Response('OK')))

				await retrieve(config)

				expect(fetch).toHaveBeenCalledWith(expectedInput, {
					method: 'GET',
					headers: new Headers({
						'x-requested-with': 'XMLHttpRequest',
					}),
				})
			})
		})

		describe('init', () => {
			test('config.init parameters are passed to fetch', async () => {
				vi.spyOn(window, 'fetch').mockImplementation(() => Promise.resolve(new Response('OK')))

				await retrieve({
					url: 'http://example.org',
					init: {
						body: 'body',
						cache: 'default',
						credentials: 'same-origin',
						headers: {
							'x-test-header': 'header-value',
						},
						integrity: 'hash',
						keepalive: true,
						method: 'POST',
						mode: 'same-origin',
						redirect: 'follow',
						referrer: 'ref',
						signal: null,
						window: null,
					},
				})

				expect(fetch).toHaveBeenCalledWith(new URL('http://example.org'), {
					body: 'body',
					cache: 'default',
					credentials: 'same-origin',
					headers: new Headers({
						'x-test-header': 'header-value',
						'x-requested-with': 'XMLHttpRequest',
					}),
					integrity: 'hash',
					keepalive: true,
					method: 'POST',
					mode: 'same-origin',
					redirect: 'follow',
					referrer: 'ref',
					signal: null,
					window: null,
				})
			})

			describe('method', () => {
				test.each<[string, RetrieveConfig]>([
					[
						'no method defaults to GET',
						{
							url: 'http://example.org',
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
					],
				])('%s', async (_title, config) => {
					vi.spyOn(window, 'fetch').mockImplementation(() => Promise.resolve(new Response('OK')))

					await retrieve(config)

					expect(fetch).toHaveBeenCalledWith(new URL('http://example.org'), {
						method: 'GET',
						headers: new Headers({
							'x-requested-with': 'XMLHttpRequest',
						}),
					})
				})
			})

			describe('headers', () => {
				test.each<[string, RetrieveConfig, RequestInit]>([
					[
						'POST method sets content-type application/json',
						{
							url: 'http://example.org',
							init: {
								method: 'POST',
							},
							data: 'hello',
						},
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
						},
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
						},
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
						},
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
						},
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
						'FormData data sets content-type multipart/form-data (GET)',
						{
							url: 'http://example.org',
							data: new FormData(),
						},
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
						'FormData data sets content-type multipart/form-data (POST)',
						{
							url: 'http://example.org',
							init: { method: 'post' },
							data: new FormData(),
						},
						{
							method: 'POST',
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
						},
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
						},
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
						},
						{
							method: 'GET',
							headers: new Headers({
								'x-requested-with': 'XMLHttpRequest',
								'content-type': 'plain/text',
							}),
						},
					],
				])('%s', async (_title, config, expectedInit) => {
					vi.spyOn(window, 'fetch').mockImplementation(() => Promise.resolve(new Response('OK')))

					await retrieve(config)

					expect(fetch).toHaveBeenCalledWith(new URL('http://example.org'), expectedInit)
				})
			})

			describe('body', () => {
				test.each<[string, RetrieveConfig, RequestInit]>([
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
					[
						'Plain text value (in `config.init.body`)',
						{
							url: 'http://example.org',
							init: {
								method: 'POST',
								headers: new Headers({ 'content-type': 'plain/text' }),
								body: 'Hello, server!',
							},
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
				])('%s', async (_title, config, expectedInit) => {
					vi.spyOn(window, 'fetch').mockImplementation(() => Promise.resolve(new Response('OK')))

					await retrieve(config)

					expect(fetch).toHaveBeenCalledWith(new URL('http://example.org'), expectedInit)
				})
			})

			describe('signal', () => {
				beforeAll(() => {
					vi.useFakeTimers()
				})

				afterAll(() => {
					vi.useRealTimers()
				})

				test.each<[string, RetrieveConfig, Error]>([
					[
						'5s timeout',
						{
							url: 'http://example.org',
							timeout: 1000,
						},
						// Note: This should be `new DOMException`, but somehow `DOMException instanceof Error` is `false` in JSDOM.
						new Error('Request timed out'),
					],
				])('%s', async (_title, config, expectedError) => {
					let reject: (reason?: unknown) => unknown
					const promise = new Promise<Response>((_resolve, _reject) => {
						reject = _reject
					})
					vi.spyOn(window, 'fetch').mockImplementation(() => promise)

					// Fakes `AbortSignal.timeout` because it seems utterly unfazed by the fake timers meaning I can't speedrun it in the tests.
					vi.spyOn(AbortSignal, 'timeout').mockImplementation((timeout) => {
						setTimeout(() => {
							reject(expectedError)
						}, timeout)

						return (new AbortController()).signal
					})

					const retrievePromise = retrieve(config)

					vi.runAllTimers()

					await expect(retrievePromise).rejects.toThrowError(expectedError)
				})
			})
		})
	})

	describe('fetch processing', () => {
		describe('network error', () => {
			test.each<[string, typeof fetch, RetrieveConfig, Error]>([
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
					() => Promise.reject('Now that’s just great'),
					{
						url: 'http://example.org',
					},
					new Error('Now that’s just great'),
				],
				[
					'plain text + custom message',
					() => Promise.reject('Original error message'),
					{
						url: 'http://example.org',
						requestErrorMessage: 'Custom error message',
					},
					new Error('Custom error message', { cause: 'Original error message' }),
				],
			])('%s', async (_title, fetchMock, config, expectedError) => {
				vi.spyOn(window, 'fetch').mockImplementation(fetchMock)

				const promise = retrieve(config)
				await expect(promise).rejects.toThrowError(expectedError)
			})
		})

		describe('responses with status codes 200-299', () => {
			test.each<[string, typeof fetch, unknown, Partial<Response>]>([
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
			])('handles content-type %s', async (_title, fetchMock, expectedData, expectedPartialResponse) => {
				vi.spyOn(window, 'fetch').mockImplementation(fetchMock)

				const { data, response } = await retrieve({ url: 'http://example.org' })

				function getData(data: unknown) {
					// For some reason, the `FormData` object created using `Response.prototype.formData()` in this test environment has a different structure than `new FormData()` and, worse, fails “formData instanceof FormData”. The following is an extremely poor workaround to this problem: As long as I can find an `entries` method on `data`, I can convert `data` into an array of entries and compare it with the expected data.
					return data && typeof data === 'object' && 'entries' in data && typeof data?.entries === 'function' ? Array.from(data.entries()) : data
				}

				expect(getData(data)).toEqual(getData(expectedData))
				expect(response).toEqual(expect.objectContaining(expectedPartialResponse))
			})

			test.each<[typeof fetch, Error]>([
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
			])('handles invalid JSON correctly', async (fetchMock, expectedError) => {
				// Throw the expected JSON error manually because different implementations will throw errors with different messages which makes this test unstable.
				vi.spyOn(Response.prototype, 'json').mockImplementation(() => {
					throw new Error('Expected property name or \'}\' in JSON at position 1')
				})
				vi.spyOn(window, 'fetch').mockImplementation(fetchMock)

				const promise = retrieve({ url: 'http://example.org' })

				await expect(promise).rejects.toThrowError(expectedError)
			})
		})

		describe('responses with status codes >=300', () => {
			test.each<[string, typeof fetch, Error]>([
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
			])('handles content-type %s', async (_title, fetchMock, expectedError) => {
				vi.spyOn(window, 'fetch').mockImplementation(fetchMock)

				const promise = retrieve({ url: 'http://example.org' })
				await expect(promise).rejects.toThrow(expectedError)
			})

			test('response error has cause if present on underlying error', async () => {
				vi.spyOn(Response.prototype, 'json').mockImplementation(() => {
					const error = new SyntaxError('You messed up', { cause: 'badly' })

					return Promise.reject(error)
				})
				vi.spyOn(window, 'fetch').mockImplementation(function () {
					const response = new Response('Oopsie!', {
						status: 400,
						statusText: 'Bad, bad request',
						headers: {
							'content-type': 'application/json',
						},
					})

					return Promise.resolve(response)
				})

				try {
					await retrieve({ url: 'http://example.org' })
				} catch (err) {
					expect(err instanceof Error).toBe(true)

					if (err instanceof Error) {
						expect(err.message).toBe('You messed up')
						expect(err.cause).toBe('badly')
					}
				}
			})

			test('response with no content-type is handled correctly', async () => {
				vi.spyOn(window, 'fetch').mockImplementation(() => Promise.resolve(new Response(null)))

				const { data } = await retrieve({ url: 'http://example.org' })

				expect(data).toBe(null)
			})
		})
	})

	describe('interceptors', () => {
		describe('beforeRequestHandlers', () => {
			test.each<[RetrieveConfig, URL, RequestInit]>([
				[
					{
						url: 'http://example.org/path',
						beforeRequestHandlers: [
							(url, init) => {
								const newUrl = url instanceof URL ? url : new URL(url)
								newUrl.href += '-x'
								return [newUrl, init]
							},
						],
					},
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
					},
					new URL('http://example.org/path'),
					{
						method: 'PATCH',
						headers: new Headers({
							'x-requested-with': 'XMLHttpRequest',
						}),
					},
				],
			])('onResponseSuccess handlers produce response', async (config, expectedInput, expectedInit) => {
				vi.spyOn(window, 'fetch').mockImplementation(() => Promise.resolve(new Response('OK')))

				await retrieve(config)

				expect(fetch).toHaveBeenCalledWith(expectedInput, expectedInit)
			})
		})

		describe('requestErrorHandlers', () => {
			test.each<[RetrieveConfig, Error]>([
				[
					{
						url: 'http://example.org',
						requestErrorHandlers: [
							(error) => ({ status: 'maintained', value: error }),
						],
					},
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
					},
					new Error('Overridden error'),
				],
			])('onRequestError handlers produce error', async (config, expectedError) => {
				vi.spyOn(window, 'fetch').mockImplementation(() => Promise.reject(new Error('Standard error')))

				const promise = retrieve(config)
				await expect(promise).rejects.toThrowError(expectedError)
			})

			test.each<[RetrieveConfig, unknown]>([
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
					},
					'Hell yeah!',
				],
			])('onRequestError handlers produce response', async (config, expectedData) => {
				vi.spyOn(window, 'fetch').mockImplementation(() => Promise.reject(new Error('Standard error')))

				const { data } = await retrieve(config)

				expect(data).toEqual(expectedData)
			})

			test.each<[RetrieveConfig, string]>([
				[
					{
						url: 'http://example.org',
						requestErrorHandlers: [
							() => {
								throw 'Unknown error format'
							},
						],
					},
					'Unknown error format',
				],
			])('onRequestError handlers raise exception on unknown error format', async (config, expectedError) => {
				vi.spyOn(window, 'fetch').mockImplementation(() => Promise.reject(new Error('Standard error')))

				const promise = retrieve(config)
				await expect(promise).rejects.toThrowError(expectedError)
			})
		})

		describe('responseSuccessHandlers', () => {
			test.each<[RetrieveConfig, unknown]>([
				[
					{
						url: 'http://example.org',
						responseSuccessHandlers: [
							(retrieveResponse) => {
								retrieveResponse.data = 'test'
								return Promise.resolve(retrieveResponse)
							},
						],
					},
					'test',
				],
				[
					{
						url: 'http://example.org',
						responseSuccessHandlers: [
							(retrieveResponse) => {
								retrieveResponse.data = 'test'
								return Promise.resolve(retrieveResponse)
							},
							(retrieveResponse) => {
								retrieveResponse.data = 'overridden data'
								return Promise.resolve(retrieveResponse)
							},
						],
					},
					'overridden data',
				],
			])('onResponseSuccess handlers produce response', async (config, expectedData) => {
				vi.spyOn(window, 'fetch').mockImplementation(() => Promise.resolve(new Response('OK')))

				const { data } = await retrieve(config)

				expect(data).toEqual(expectedData)
			})
		})

		describe('responseErrorHandlers', () => {
			test.each<[RetrieveConfig, Error]>([
				[
					{
						url: 'http://example.org/path',
						responseErrorHandlers: [
							(error) => {
								error.message = 'Altered message'
								return { status: 'maintained', value: error }
							},
						],
					},
					new Error('Altered message'),
				],
			])('onResponseError handlers produce error', async (config, expectedError) => {
				vi.spyOn(window, 'fetch').mockImplementation(() => Promise.resolve(new Response('Unauthorized', { status: 401 })))

				const promise = retrieve(config)
				await expect(promise).rejects.toThrowError(expectedError)
			})

			test.each<[RetrieveConfig, unknown]>([
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
					},
					'Hell yeah!',
				],
			])('onResponseError handlers produce response', async (config, expectedData) => {
				vi.spyOn(window, 'fetch').mockImplementation(() => Promise.resolve(new Response('Unauthorized', { status: 401 })))

				const { data } = await retrieve(config)

				expect(data).toEqual(expectedData)
			})

			test.each<[RetrieveConfig, string]>([
				[
					{
						url: 'http://example.org',
						responseErrorHandlers: [
							() => {
								throw 'Unknown error format'
							},
						],
					},
					'Unknown error format',
				],
			])('onResponseError handlers raise exception on unknown error format', async (config, expectedError) => {
				vi.spyOn(window, 'fetch').mockImplementation(() => Promise.resolve(new Response('Unauthorized', { status: 401 })))

				const promise = retrieve(config)
				await expect(promise).rejects.toThrowError(expectedError)
			})
		})
	})

	describe('examples', () => {
		test('Example 6: transforming response error', async () => {
			class ApiError extends Error {
				code: string | null = null

				constructor(message: string, code: string | null = null) {
					super(message)
					this.code = code
				}

				toJSON() {
					return {
						code: this.code,
						message: this.message,
					}
				}
			}

			const expectedError = new ApiError('error message', 'error_code')

			vi.spyOn(window, 'fetch').mockImplementation(function () {
				const response = new Response('{"code":"error_code","message":"error message"}', {
					status: 400,
					statusText: 'Bad Request',
					headers: {
						'content-type': 'application/problem+json; charset=utf-8',
					},
				})

				return Promise.resolve(response)
			})
			const promise = retrieve({
				url: 'http://api.example.org/status',
				responseErrorHandlers: [
					async (error, { data }) => {
						let message = error.message
						let code = null

						if (data && typeof data === 'object') {
							if ('message' in data && typeof data.message === 'string') {
								message = data.message
							}

							if ('code' in data && typeof data.code === 'string') {
								code = data.code
							}
						}

						return {
							status: 'maintained',
							value: new ApiError(message, code),
						}
					},
				],
			})

			expect(promise).rejects.toThrowError(expectedError)
		})
	})
})

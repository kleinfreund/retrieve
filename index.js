import { retrieve, ResponseError, RetrieveResponse } from './dist/retrieve.js'
/** @import { RetrieveConfig } from './src/retrieve.js' */

Object.defineProperty(window, 'retrieve', { value: retrieve })
Object.defineProperty(window, 'ResponseError', { value: ResponseError })
Object.defineProperty(window, 'RetrieveResponse', { value: RetrieveResponse })

const forms = Array.from(document.forms)

forms.filter((form) => form.method === 'get')
	.forEach((form) => form.addEventListener('submit', handleGetSubmit))

forms.filter((form) => form.method === 'post')
	.forEach((form) => form.addEventListener('submit', handlePostSubmit))

async function handleGetSubmit (event) {
	event.preventDefault()

	const form = /** @type {HTMLFormElement} */ (event.target)
	console.log({ form })

	/** @type {RetrieveConfig} */ const config = {
		url: form.action,
		params: new URLSearchParams(/** @type {any} */(new FormData(form))),
		init: {
			method: form.method,
		},
	}
	console.log({ config })

	const result = await retrieve(config)
	console.dir(result)
}

async function handlePostSubmit (event) {
	event.preventDefault()

	const form = /** @type {HTMLFormElement} */ (event.target)
	console.log({ form })

	/** @type {RetrieveConfig} */ const config = {
		url: form.action,
		data: new FormData(form),
		init: {
			method: form.method,
		},
	}
	console.log({ config })

	const result = await retrieve(config)
	console.dir(result)
}

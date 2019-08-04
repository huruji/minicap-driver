let ws: WebSocket
let debug = false
let debounce = false
let hasDown = false

function wsJson(obj: { [key: string]: any }) {
	if (ws.readyState === ws.OPEN) {
		const json = JSON.stringify(obj)
		if (debug) console.log('wsJson', json)

		ws.send(json)
	}
}

function start(w: WebSocket, el: string, d: boolean = false) {
	ws = w
	debug = d

	const canvas = document.querySelector(el)!

	function mouseHandler(t: string, e: MouseEvent) {
		const cx = e.clientX
		const cy = e.clientY

		const x = cx / canvas.scrollWidth
		const y = cy / canvas.scrollHeight

		wsJson({
			event: 'mouse',
			t,
			x,
			y
		})
	}

	console.log('addeventlistener')
	canvas.addEventListener('mousedown', (e: MouseEvent) => {
		hasDown = true
		console.log('mousedown')
		mouseHandler('d', e)
		e.preventDefault()
	})

	canvas.addEventListener('mousemove', (e: MouseEvent) => {
		if (!hasDown) return
		if (!debounce) {
			debounce = true
			mouseHandler('m', e)
			setTimeout(() => {
				debounce = false
			})
		}
	})

	canvas.addEventListener('mouseup', (e: MouseEvent) => {
		hasDown = false
		mouseHandler('u', e)
		e.preventDefault()
	})
}

export { start as minitouchClient }

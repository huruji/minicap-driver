let ws: WebSocket
let debug = false
let debounce = false
let hasDown = false

function wsJson(obj: { [key: string]: any }) {
	if (ws.readyState === ws.OPEN) {
		const json = JSON.stringify(obj)

		ws.send(json)
	}
}

function start(w: WebSocket, el: string, opt: { debug?: boolean } = { debug: false }) {
	const options = Object.assign(
		{
			debug: false
		},
		opt
	)
	ws = w
	debug = options.debug

	const canvas = document.querySelector(el)!

	function mouseHandler(t: string, e: MouseEvent) {
		const cx = e.offsetX
		const cy = e.offsetY

		const x = cx / canvas.scrollWidth
		const y = cy / canvas.scrollHeight

		let json = {
			event: 'mouse',
			t,
			x,
			y
		}

		wsJson(json)

		if (debug) {
			console.log('mouse event:', JSON.stringify(json))
		}
	}

	canvas.addEventListener('mousedown', (e: MouseEvent) => {
		hasDown = true
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

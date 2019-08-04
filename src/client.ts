function minicapClient(
	ws: WebSocket,
	selector: string,
	opt?: {
		width?: string | number
		height?: string | number
		zoom?: number
		debug?: boolean
	}
) {
	const options = Object.assign(
		{
			zoom: 1,
			debug: false
		},
		opt
	)

	const { debug } = options

	const canvas: HTMLCanvasElement = document.querySelector(selector) as HTMLCanvasElement
	const context = canvas.getContext('2d')!
	ws.binaryType = 'blob'
	ws.addEventListener('open', () => {
		ws.send('minicap')
	})

	ws.addEventListener('error', e => {
		console.log(e)
	})

	ws.addEventListener('close', e => {
		if (debug) console.log('close')
	})
	ws.addEventListener('message', event => {
		if (debug) {
			console.log('get image from server', event.data)
		}
		const blob = new Blob([event.data], {
			type: 'image/jpeg'
		})

		const URL = window.URL
		const img = new Image()
		img.src = (URL || webkitURL).createObjectURL(blob)

		img.onload = () => {
			if (options.zoom) {
				canvas.width = img.width * options.zoom
				canvas.height = img.height * options.zoom
			} else if (options.width) {
				let w = parseFloat(options.width + '')
				if (w < 1) {
					canvas.width = img.width * w
					canvas.height = img.height * w
				} else {
					let scale = w / img.width
					canvas.width = w
					canvas.height = scale * img.height
				}
			} else if (options.height) {
				let h = parseFloat(options.height + '')
				if (h < 1) {
					canvas.width = img.width * h
					canvas.height = img.height * h
				} else {
					let scale = h / img.height
					canvas.height = h
					canvas.width = scale * img.height
				}
			} else {
				canvas.width = img.width
				canvas.height = img.height
			}
			context.drawImage(img, 0, 0, canvas.width, canvas.height)
		}
	})
}

export { minicapClient }

function minicapClient(wslocation: string, selector: string) {
  console.log('9999')
	const ws = new WebSocket(wslocation)
	const canvas: HTMLCanvasElement = document.querySelector(selector) as HTMLCanvasElement
	const context = canvas.getContext('2d')!
	ws.binaryType = 'blob'
	ws.addEventListener('open', () => {
		console.log('open')
		ws.send('minicap')
	})

	ws.addEventListener('error', e => {
		console.log(e)
	})

	ws.addEventListener('message', event => {
		const blob = new Blob([event.data], {
			type: 'image/jpeg'
		})

		const URL = window.URL
		const img = new Image()
		img.src = URL.createObjectURL(blob)

		img.onload = () => {
			canvas.width = img.width
			canvas.height = img.height
			context.drawImage(img, 0, 0)
		}
	})
}

export { minicapClient }

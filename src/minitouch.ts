import {
	killMinitouchProcess,
	removeMinitouchDir,
	createDeviceMinitouchDir,
	getCPUAbiType,
	pushMinitouchToDevice,
	changeModForMinitouch,
	startMinitouch,
	forwardPort
} from './adb'
import { MINITOUCH_PREBUILT_DIR, MINITOUCH_NAME } from './CONSTANT'
import { resolve } from 'path'
import * as net from 'net'

// let maxContacts = 0
let maxX = 0
let maxY = 0
// let maxPressure = 0

let minitouchSocket: net.Socket

// let hasStarted = false

let proc: ChildProcess = null

async function exit(): Promise<void> {
	await killMinitouchProcess()
	await removeMinitouchDir()
}

async function init(): Promise<void> {
	await exit()
	await createDeviceMinitouchDir()

	const abi = (await getCPUAbiType()) as string

	const binDir = resolve(__dirname, '../', MINITOUCH_PREBUILT_DIR, abi, 'bin', MINITOUCH_NAME)

	await pushMinitouchToDevice(binDir)

	await changeModForMinitouch()
}

function action(type: 'u' | 'd' | 'm', x: number, y: number) {
	// let suc = false
	let txt = ''
	let c = '\nc\n'

	if (type === 'u') txt = `u 0 ${c}`
	else {
		if (x < 0 || y < 0 || x > maxX || y > maxY) return
		if (x < 1) x = Math.round(x * maxX)
		if (y < 1) y = Math.round(y * maxY)
		txt = `\n${type} 0 ${x} ${y} 50 ${c}`
	}

	minitouchSocket.write(txt)
}

function startSocket(port: number) {
	console.warn('minitouch startsocket')
	const socket = net.connect({
		port
	})

	socket.on('connect', () => {
		console.log('open')
	})

	socket.on('data', d => {
		console.log('minitouch data')
		const arr = d.toString().match(/\^ (\d+) (\d+) (\d+) (\d+)/)!
		let a = null
		;[, , maxX, maxY] = [...arr.map(e => +e)]
		console.error(arr)
	})

	socket.on('close', () => {
		console.log('stream close')
	})
	minitouchSocket = socket
	console.log('miniSocket')
	console.log(minitouchSocket)
}

async function start(ws: WebSocket, port: number = 1718) {
	ws.on('message', (data: string) => {
		let j = null
		try {
			j = JSON.parse(data)
		} catch (e) {}

		if (!j) return

		if (j.event === 'mouse') {
			action(j.t, j.x, j.y)
		}
	})

	if (!proc || !proc.started) {
		proc = await startMinitouch()
	}
	proc.started = true

	proc.stdout!.on('data', async () => {
		console.log('minitouch proc data')
		if (proc.hasSocket) return
		await forwardPort(port, MINITOUCH_NAME)
		proc.hasSocket = true
		startSocket(port)
	})
}

process.on('exit', async () => {
	console.log('exit')
	exit()
})

export { init, start }

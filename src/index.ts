import {
	killMinicapProcess,
	removeMinicapDir,
	createDeviceMinicapDir,
	getCPUAbiType,
	getSDKVersion,
	pushMinicapToDevice,
	pushMinicapLibToDevice,
	changeModForMinicap,
	getScreenSize,
	getRotation,
	forwardPort,
	startMinicap
} from './adb'
import { MINICAP_PREBUILT_DIR, NAME } from './CONSTANT'

import { resolve } from 'path'
import * as net from 'net'
import { ChildProcess } from 'child_process'
import { Server as WebSocketServer } from 'ws'

declare module 'child_process' {
	interface ChildProcess {
		hasSocket: boolean
		started: boolean
	}
}

// interface WebSocket {
// 	minicap?: boolean
// }

let deviceInfo: {
	width?: number
	height?: number
	rotation?: number
} = {}

let readBannerBytes = 0
let bannerLength = 2
let readFrameBytes = 0
let frameBodyLength = 0
let frameBody = Buffer.from([])

let proc: ChildProcess = null

const sockets: WebSocket[] = []

let lastFramBody: Buffer

const banner = {
	version: 0,
	length: 0,
	pid: 0,
	realWidth: 0,
	realHeight: 0,
	virtualWidth: 0,
	virtualHeight: 0,
	orientation: 0,
	quirks: 0
}

function read(socket: net.Socket, ws: WebSocket) {
	const chunk = socket.read()
	if (!chunk) return
	for (let cursor = 0, len = chunk.length; cursor < len; ) {
		if (readBannerBytes < bannerLength) {
			switch (readBannerBytes) {
				case 0:
					banner.version = chunk[cursor]
					break
				case 1:
					bannerLength = chunk[cursor]
					banner.length = bannerLength
					break
				case 2:
				case 3:
				case 4:
				case 5:
					banner.pid += (chunk[cursor] << ((readBannerBytes - 2) * 8)) >>> 0
					break
				case 6:
				case 7:
				case 8:
				case 9:
					banner.realWidth += (chunk[cursor] << ((readBannerBytes - 6) * 8)) >>> 0
					break
				case 10:
				case 11:
				case 12:
				case 13:
					banner.realHeight += (chunk[cursor] << ((readBannerBytes - 10) * 8)) >>> 0
					break
				case 14:
				case 15:
				case 16:
				case 17:
					banner.virtualWidth += (chunk[cursor] << ((readBannerBytes - 14) * 8)) >>> 0
					break
				case 18:
				case 19:
				case 20:
				case 21:
					banner.virtualHeight += (chunk[cursor] << ((readBannerBytes - 18) * 8)) >>> 0
					break
				case 22:
					banner.orientation += chunk[cursor] * 90
					break
				case 23:
					banner.quirks = chunk[cursor]
					break
			}
			cursor++
			readBannerBytes++
			if (readBannerBytes === bannerLength) {
				console.log('banner', banner)
			}
		} else if (readFrameBytes < 4) {
			frameBodyLength += (chunk[cursor] << (readFrameBytes * 8)) >>> 0
			cursor++
			readFrameBytes++
		} else {
			if (len - cursor >= frameBodyLength) {
				frameBody = Buffer.concat([frameBody, chunk.slice(cursor, cursor + frameBodyLength)])
				lastFramBody = frameBody
				console.log('send framebody')
				for (let i = 0; i < sockets.length; i++) {
					sockets[i].send(frameBody, {
						binary: true
					})
				}
				cursor += frameBodyLength
				frameBodyLength = readFrameBytes = 0
				frameBody = Buffer.from([])
			} else {
				frameBody = Buffer.concat([frameBody, chunk.slice(cursor, cursor + frameBodyLength)])
				frameBodyLength -= len - cursor
				readFrameBytes += len - cursor
				cursor = len
			}
		}
	}
}

function startSocket(ws: WebSocket, port: number) {
	const socket = net.connect({
		port
	})

	ws.addEventListener('close', () => {
		console.log('close')
		sockets.splice(sockets.indexOf(ws), 1)
	})

	console.log('connect')

	socket.on('data', () => {
		console.log('socketdata')
	})

	socket.on('readable', () => {
		read(socket, ws)
	})
	socket.on('error', () => console.log('stream error', port, NAME))
}

async function exit(): Promise<void> {
	await killMinicapProcess()
	await removeMinicapDir()
}

async function init(): Promise<void> {
	await exit()
	await createDeviceMinicapDir()

	const abi = (await getCPUAbiType()) as string

	const sdk = await getSDKVersion()

	const binDir = resolve(__dirname, '../', MINICAP_PREBUILT_DIR, abi, 'bin', NAME)

	await pushMinicapToDevice(binDir)

	const libDir = resolve(__dirname, '../', MINICAP_PREBUILT_DIR, abi, 'lib', `android-${sdk}`, `${NAME}.so`)

	await pushMinicapLibToDevice(libDir)

	await changeModForMinicap()
	const { width, height } = await getScreenSize()
	const rotation = await getRotation()
	deviceInfo = Object.assign(
		{},
		{
			width,
			height,
			rotation
		}
	)
}

async function start(ws: WebSocket, port = 1717) {
	sockets.push(ws)
	if (lastFramBody) {
		for (let i = 0; i < sockets.length; i++) {
			sockets[i].send(lastFramBody, {
				binary: true
			})
		}
	}
	if (!proc || !proc.started) {
		proc = (await startMinicap(
			deviceInfo.width!,
			deviceInfo.height!,
			Math.round(deviceInfo.width! / 2),
			Math.round(deviceInfo.height! / 2),
			deviceInfo.rotation!
		)) as ChildProcess
	}

	proc.started = true
	// if (!proc.hasSocket) {
	proc.stdout!.on('data', async () => {
		console.log('data')
		if (proc.hasSocket) return
		await forwardPort(port, 'minicap')
		proc.hasSocket = true
		startSocket(ws, port)
	})
	// }
}

process.on('exit', async () => {
	console.log('exit')
	exit()
})
export { start, exit, init }

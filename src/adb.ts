import { exec, ChildProcess } from 'child_process'
import { NAME, DEVICE_MINICAP_DIR } from './CONSTANT'

interface Device {
	name: string
	status: string
}

let currentDeviceName = ''
let isVerbose = true

const call = (code: string, getProc = false): Promise<string | ChildProcess> => {
	return new Promise((resolve, reject) => {
		const command = `adb ${currentDeviceName ? `-s ${currentDeviceName}` : ''} ${code}`

		if (isVerbose) console.log(command, '\n')

		if (getProc) {
			const proc = exec(command)
			resolve(proc)
		} else {
			exec(command, (err, stdout, stderr) => {
				if (err) reject(new Error(err + ''))
				resolve(stdout.trim())
			})
		}
	})
}

const rawDevices = () => call('devices')

const devices = async (): Promise<Device[]> => {
	return ((await rawDevices()) as string)
		.split(/\n/)
		.map(line => line.split('\t'))
		.filter(line => line.length > 1)
		.map(device => ({ name: device[0].trim(), status: device[1].trim() }))
}

const use = (device: Device) => (currentDeviceName = device.name)

const verbose = (value: boolean) => (isVerbose = value)

const killMinicapProcess = () => call(`shell -x killall ${NAME}`)
const removeMinicapDir = () => call(`shell rm -rf ${DEVICE_MINICAP_DIR}`)
const createDeviceMinicapDir = () => call(`shell mkdir ${DEVICE_MINICAP_DIR}`)

const getCPUAbiType = () => call(`shell getprop ro.product.cpu.abi`)
const getSDKVersion = () => call(`shell getprop ro.build.version.sdk`)

const pushMinicapToDevice = (binaryDir: string) => call(`push ${binaryDir} ${DEVICE_MINICAP_DIR}/`)

const pushMinicapLibToDevice = (libDir: string) => call(`push ${libDir} ${DEVICE_MINICAP_DIR}/`)

const changeModForMinicap = () => call(`shell -x chmod +x ${DEVICE_MINICAP_DIR}/${NAME}`)

const getScreenSize = async (): Promise<{ width: number; height: number }> => {
	const str = (await call('shell wm size')) as string
	const arr = str.match(/(\d+)x(\d+)/)!

	return {
		width: +arr[1],
		height: +arr[2]
	}
}

const getRotation = async (): Promise<number> => {
	const dumpsys: string = (await call('shell dumpsys window')) as string

	const arr: (string | number)[] = dumpsys.match(/mCurrentRotation=(?:ROTATION_)?(\d+)/)!

	if (+arr[1] == 1) arr[1] = 90
	return +arr[1]
}

const forwardPort = async (port: number, name: string) => call(`forward tcp:${port} localabstract:${name}`)

const startMinicap = async (w: number, h: number, w1: number, h1: number, r: number) =>
	call(
		`shell -x LD_LIBRARY_PATH=${DEVICE_MINICAP_DIR} ${DEVICE_MINICAP_DIR}/${NAME} -P ${w}x${h}@${w1}x${h1}/${r}`,
		true
	)

export {
	devices,
	use,
	verbose,
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
}

import * as minicapDriver from '../../dist/index'
import * as minitouchDriver from '../../dist/minitouch'

import * as koa from 'koa'
import * as koaStatic from 'koa-static'
import * as path from 'path'
import * as route from 'koa-route'
import * as websockify from 'koa-websocket'
import { Server as WebSocketServer } from 'ws'

// const wss = new WebSocketServer({ port: 9002 })

const app = websockify(new koa())

app.use(koaStatic(path.resolve(__dirname, '../client/dist')))
;(async () => {
	await minicapDriver.init()
	await minitouchDriver.init()
	// wss.on('connection', async ws => {
	// 	console.log('conncetion')
	// 	minicapDriver.start(ws)
	// 	// minitouchDriver.start(ws)
	// })
})()

app.ws.use(route.all('/socket', ctx => {}))

app.ws.onConnection = async function(ws) {
	console.log('ws connection')
	await minitouchDriver.start(ws)
	console.log('connection 23')
	await minicapDriver.start(ws)
}

app.listen(9000)

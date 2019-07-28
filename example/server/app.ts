import * as minicapDriver from '../../dist/index'
import * as koa from 'koa'
import * as koaStatic from 'koa-static'
import * as path from 'path'
import { Server as WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 9002 })

const app = new koa()

app.use(koaStatic(path.resolve(__dirname, '../client/dist')))
;(async () => {
	await minicapDriver.init()
	wss.on('connection', async ws => {
		console.log('conncetion')
		await minicapDriver.start(ws)
	})
})()

app.listen(9000)

## minicap-driver

一个对 [minicap](https://github.com/openstf/minicap) 的 node.js 封装，让开发人员不需要关注 minicap 的底层原理 websocket 的处理，更加轻松实现 Android 设备投影到浏览器，并保证高帧率。

![](./shot.gif)

**server side**

```js

import * as minicapDriver from 'minicap-driver'
import { Server as WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 9002 })

;(async () => {
	await minicapDriver.init()
	wss.on('connection', async ws => {
		console.log('conncetion')
		await minicapDriver.start(ws)
	})
})()
```

**client side** just like this:

```js
import { minicapClient } from 'minicap-driver/dist/client'

minicapClient('ws://localhost:9002', '#canvas')
```

就是这么简单，例子可以看example
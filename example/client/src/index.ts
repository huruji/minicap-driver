import { minicapClient } from '../../../src/client'
import { minitouchClient } from '../../../src/miniTouchClient'

const ws = new WebSocket('ws://localhost:9000')

minicapClient(ws, '#canvas')

minitouchClient(ws, '#canvas', true)

// minitouchClient('ws://localhost:9002', '#canvas')

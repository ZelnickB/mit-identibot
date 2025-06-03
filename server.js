import * as path from 'path'
import Express from 'express'
import cookieParser from 'cookie-parser'

import { initializeAll as initializeRoutes } from './lib/initializeRoutes.js'

const app = Express()
app.use(cookieParser())

app.set('view engine', 'hbs')

import('./discordBot/initialize.js')

initializeRoutes(app, path.join(import.meta.dirname, 'routes'))
  .then(() => app.listen(80))

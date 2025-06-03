import * as path from 'path'
import { initializeAll as initializeRoutes } from '../../lib/initializeRoutes.js'
import { Router } from 'express'

const router = Router()

initializeRoutes(router, path.join(import.meta.dirname, 'callbacks')).then()

export default router

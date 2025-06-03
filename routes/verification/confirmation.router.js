import * as path from 'path'
import { initializeAll as initializeRoutes } from '../../lib/initializeRoutes.js'
import { Router } from 'express'

const router = Router()

initializeRoutes(router, path.join(import.meta.dirname, 'confirmation')).then()

export default router

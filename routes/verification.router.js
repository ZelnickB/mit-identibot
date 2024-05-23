import * as path from 'path'
import { initializeAll as initializeRoutes } from '../lib/initializeRoutes.js'
import { Router } from 'express'

const router = Router()

router.get('/', (req, res) => {
  res.redirect(307, '/verification/touchstone')
})

initializeRoutes(router, path.join(import.meta.dirname, 'verification')).then()

export default router

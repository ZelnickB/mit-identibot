import * as path from 'path'
import { initializeAll as initializeRoutes } from '../lib/initializeRoutes.js'
import Express from 'express'

const router = Express.Router()
router.use(Express.urlencoded())

router.get('/', (req, res) => {
  res.redirect(307, '/verification/touchstone')
})

initializeRoutes(router, path.join(import.meta.dirname, 'verification')).then()

export default router

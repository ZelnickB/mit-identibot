import * as path from 'path'
import { Router, static as staticMiddleware } from 'express'

const router = Router()
router.use('/usr', staticMiddleware(path.resolve(import.meta.dirname, '..', 'usr', 'serveStatic'), { fallthrough: false }))
router.use(staticMiddleware(path.resolve(import.meta.dirname, 'endpointAssets', 'static'), { fallthrough: false }))

export default router

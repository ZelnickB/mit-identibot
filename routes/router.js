const express = require('express')
const path = require('path')

const router = express.Router()

router.get('/', (req, res) => {
  res.redirect(302, '/verify')
})
router.get('/verify', (req, res) => {
  res.redirect(302, '/ui/verification/touchstone')
})
router.use('/static', express.static(path.resolve(__dirname, 'static')))
router.use('/preferenceAwareStatic', require('./preferenceAwareStatic/router'))
router.use('/ui', require('./ui/router'))
router.use('/api', require('./api/router'))

module.exports = router

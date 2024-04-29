const express = require('express')
const path = require('path')
const preferences = require('../../library/preferences')

const router = express.Router()
router.use('/', (req, res) => {
  if (!req.path.match(/^\/([A-Za-z0-9]+\/?)*$/)) {
    return res.sendStatus(403)
  }
  res.render(path.resolve(__dirname, `templates${req.path.replaceAll('.', '')}.hbs`), preferences)
})

module.exports = router

const express = require('express')
const path = require('path')
const axios = require('axios')
const cryptutils = require('../../library/cryptutils')
const redisClient = require('../../library/redisClient')

const preferences = require('../../library/preferences')

const router = express.Router()

router.get('/verification/touchstone', (req, res) => {
  res.redirect(302, '/preferenceAwareStatic/verification/touchstone')
})
router.get('/verification/discord', (req, res) => {
  let deciphered
  try {
    deciphered = cryptutils.decrypt(Buffer.from(req.cookies.verification_touchstoneAuthorization, 'base64url'))
  } catch {
    res.status(400)
    res.render(path.resolve(__dirname, '..', '..', 'misc', 'error.hbs'), {
      errCode: '400',
      errDesc: 'Bad Request',
      errExplanation: 'This probably happened because you manually changed a cookie. If you keep getting this error, please message Ben.'
    })
    return
  }
  deciphered = JSON.parse(deciphered.toString())
  axios.get('https://petrock.mit.edu/oidc/userinfo', {
    headers: {
      Authorization: `Bearer ${deciphered.access_token}`
    },
    responseType: 'json'
  }).then((response) => {
    res.render(path.resolve(__dirname, 'templates', 'verification', 'discord.hbs'), {
      preferences,
      name: response.data.given_name,
      email: response.data.email
    })
  })
})
router.get('/verification/confirm', (req, res) => {
  let decipheredTouchstone, decipheredDiscord
  try {
    decipheredTouchstone = JSON.parse(cryptutils.decrypt(Buffer.from(req.cookies.verification_touchstoneAuthorization, 'base64url')).toString())
    decipheredDiscord = JSON.parse(cryptutils.decrypt(Buffer.from(req.cookies.verification_discordAuthorization, 'base64url')).toString())
  } catch {
    res.status(400)
    res.render(path.resolve(__dirname, '..', '..', 'misc', 'error.hbs'), {
      errCode: '400',
      errDesc: 'Bad Request',
      errExplanation: 'This probably happened because you manually changed a cookie. If you keep getting this error, please message Ben.'
    })
    return
  }
  axios.get('https://petrock.mit.edu/oidc/userinfo', {
    headers: {
      Authorization: `Bearer ${decipheredTouchstone.access_token}`
    },
    responseType: 'json'
  }).then((touchstoneResponse) => {
    axios.get('https://discord.com/api/users/@me', {
      headers: {
        'User-Agent': 'DiscordBot (https://github.com/zelnickb/mit2028-discord-verifier, 0.1.0)',
        Authorization: `Bearer ${decipheredDiscord.access_token}`
      },
      responseType: 'json'
    }).then((discordResponse) => {
      res.render(path.resolve(__dirname, 'templates', 'verification', 'confirm.hbs'), {
        preferences,
        discordUsername: discordResponse.data.username,
        email: touchstoneResponse.data.email
      })
    })
  })
})
router.get('/verification/confirmed', (req, res) => {
  let decipheredTouchstone
  try {
    decipheredTouchstone = JSON.parse(cryptutils.decrypt(Buffer.from(req.cookies.verification_touchstoneAuthorization, 'base64url')).toString())
  } catch {
    res.status(400)
    res.render(path.resolve(__dirname, '..', '..', 'misc', 'error.hbs'), {
      errCode: '400',
      errDesc: 'Bad Request',
      errExplanation: 'This probably happened because you manually changed a cookie. If you keep getting this error, please message Ben.'
    })
    return
  }
  axios.get('https://petrock.mit.edu/oidc/userinfo', {
    headers: {
      Authorization: `Bearer ${decipheredTouchstone.access_token}`
    },
    responseType: 'json'
  }).then((response) => {
    redisClient.HEXISTS('verification:map:kerberos,discord', response.data.sub).then((kerbExists) => {
      redisClient.SISMEMBER('verification:blacklist:kerberos', response.data.sub).then((isBlacklisted) => {
        if (isBlacklisted) {
          res.status(403)
          res.render(path.resolve(__dirname, '..', '..', 'misc', 'error.hbs'), {
            errCode: '403',
            errDesc: 'Forbidden',
            errExplanation: 'This Kerberos account has been blocked from being used for verification on this server.'
          })
        } else {
          if (kerbExists) {
            if (parseInt(req.query.inClass) === 0) {
              res.status(200).render(path.resolve(__dirname, 'templates', 'verification', 'confirmedOutsider.hbs'), {
                preferences,
                name: response.data.given_name
              })
            } else {
              res.status(200).render(path.resolve(__dirname, 'templates', 'verification', 'confirmed.hbs'), {
                preferences,
                name: response.data.given_name
              })
            }
          } else {
            res.status(500)
            res.render(path.resolve(__dirname, '..', '..', 'misc', 'error.hbs'), {
              errCode: '500',
              errDesc: 'Internal Server Error',
              errExplanation: 'Your verification information was not found in the database.'
            })
          }
        }
      })
    })
  })
})

module.exports = router

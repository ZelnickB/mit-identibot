const express = require('express')
const path = require('path')
const axios = require('axios')
const cryptutils = require('../../library/cryptutils')
const preferences = require('../../library/preferences')
const redisClient = require('../../library/redisClient')

const router = express.Router()

router.get('/verification/auth/touchstone', (req, res) => {
  axios.post(
    'https://petrock.mit.edu/oidc/token',
    {
      grant_type: 'authorization_code',
      code: req.query.code,
      redirect_uri: 'https://2028discordverifier.mit.zelnick.dev/api/verification/auth/touchstone'
    },
    {
      responseType: 'text',
      headers: {
        'User-Agent': 'DiscordBot (https://github.com/zelnickb/mit2028-discord-verifier, 0.1.0)',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      auth: {
        username: preferences.api_keys.petrock.client_id,
        password: preferences.api_keys.petrock.client_secret
      }
    }
  ).then((response) => {
    res.cookie('verification_touchstoneAuthorization',
      cryptutils.encrypt(response.data).toString('base64url'),
      {
        httpOnly: true,
        sameSite: 'lax',
        path: '/'
      }
    )
    res.redirect(302, '/ui/verification/discord')
  }).catch((errorData) => {
    res.status(502)
    res.render(path.resolve(__dirname, '..', '..', 'misc', 'error.hbs'), {
      errCode: '502',
      errDesc: 'Bad Gateway',
      errExplanation: 'Something bad happened when trying to communicate with Petrock and/or Touchstone. Please try again later or message Ben for help.'
    })
  })
})
router.get('/verification/auth/discord', (req, res) => {
  axios.post(
    'https://discord.com/api/oauth2/token',
    {
      grant_type: 'authorization_code',
      code: req.query.code,
      redirect_uri: `${preferences.base_url}/api/verification/auth/discord`
    },
    {
      responseType: 'text',
      headers: {
        'User-Agent': 'DiscordBot (https://github.com/zelnickb/mit2028-discord-verifier, 0.1.0)',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      auth: {
        username: preferences.api_keys.discord.client_id,
        password: preferences.api_keys.discord.client_secret
      }
    }
  ).then((response) => {
    res.cookie('verification_discordAuthorization',
      cryptutils.encrypt(response.data).toString('base64url'),
      {
        httpOnly: true,
        sameSite: 'lax',
        path: '/'
      }
    )
    res.redirect(302, '/ui/verification/confirm')
  }).catch((errorData) => {
    res.status(502)
    res.render(path.resolve(__dirname, '..', '..', 'misc', 'error.hbs'), {
      errCode: '502',
      errDesc: 'Bad Gateway',
      errExplanation: 'Something bad happened when trying to communicate with Discord. Please try again later or message Ben for help.'
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
    if (touchstoneResponse.data.affiliation !== 'student') {
      res.status(403)
      return res.render(path.resolve(__dirname, '..', '..', 'misc', 'error.hbs'), {
        errCode: '403',
        errDesc: 'Forbidden',
        errExplanation: 'You cannot verify using a non-student Kerberos identity.'
      })
    }
    axios.get('https://discord.com/api/users/@me', {
      headers: {
        'User-Agent': 'DiscordBot (https://github.com/zelnickb/mit2028-discord-verifier, 0.1.0)',
        Authorization: `Bearer ${decipheredDiscord.access_token}`
      },
      responseType: 'json'
    }).then((discordResponse) => {
      redisClient.HGET('verification:map:kerberos,discord', touchstoneResponse.data.sub).then((value) => {
        if (value !== null && value !== discordResponse.data.id) {
          res.status(403)
          res.render(path.resolve(__dirname, '..', '..', 'misc', 'error.hbs'), {
            errCode: '403',
            errDesc: 'Forbidden',
            errExplanation: 'This Kerberos identity has already been used to verify a different Discord account.'
          })
        } else {
          try {
            axios.get(`https://discord.com/api/v10/guilds/${preferences.discord.guild_id}/members/${discordResponse.data.id}`, {
              headers: {
                'User-Agent': 'DiscordBot (https://github.com/zelnickb/mit2028-discord-verifier, 0.1.0)',
                Authorization: `Bot ${preferences.api_keys.discord.bot_token}`
              }
            })
          } catch {
            res.status(401)
            res.render(path.resolve(__dirname, '..', '..', 'misc', 'error.hbs'), {
              errCode: '401',
              errDesc: 'Unauthorized',
              errExplanation: `The Discord user ${discordResponse.data.username} was not found in the server. Verification has been aborted.`
            })
            return
          }
          redisClient.SISMEMBER('verification:blacklist:kerberos', touchstoneResponse.data.sub).then((isBlacklisted) => {
            redisClient.HSET('verification:map:kerberos,discord', touchstoneResponse.data.sub, discordResponse.data.id).then(() => {
              return redisClient.HSET('verification:map:discord,kerberos', discordResponse.data.id, touchstoneResponse.data.sub)
            }).then(() => {
              return redisClient.HSET('verification:cache:map:kerberos,userinfo', touchstoneResponse.data.sub, JSON.stringify(touchstoneResponse.data))
            }).then(() => {
              return redisClient.HSET('verification:cache:map:discord,userinfo', discordResponse.data.id, JSON.stringify(discordResponse.data))
            }).then(() => {
              return redisClient.HSET('verification:oauthResponse:petrock', touchstoneResponse.data.sub, JSON.stringify(decipheredTouchstone))
            }).then(() => {
              return redisClient.HSET('verification:oauthResponse:discord', discordResponse.data.id, JSON.stringify(decipheredDiscord))
            }).then(() => {
              if (isBlacklisted) {
                res.status(403)
                res.render(path.resolve(__dirname, '..', '..', 'misc', 'error.hbs'), {
                  errCode: '403',
                  errDesc: 'Forbidden',
                  errExplanation: 'This Kerberos account has been blocked from being used for verification on this server.'
                })
              } else {
                axios.put(`https://discord.com/api/v10/guilds/${preferences.discord.guild_id}/members/${discordResponse.data.id}/roles/${preferences.discord.role_id}`, undefined, {
                  headers: {
                    'User-Agent': 'DiscordBot (https://github.com/zelnickb/mit2028-discord-verifier, 0.1.0)',
                    Authorization: `Bot ${preferences.api_keys.discord.bot_token}`,
                    'X-Audit-Log-Reason': `User verified to control Kerberos identity ${touchstoneResponse.data.email}.`
                  }
                }).then(() => {
                  return axios.get(`https://tlepeopledir.mit.edu/q/${touchstoneResponse.data.sub}`, {
                    responseType: 'json'
                  }
                  )
                }
                ).then(
                  (directoryResponse) => {
                    if (directoryResponse.data.result[0] !== undefined && directoryResponse.data.result[0].student_year === undefined) {
                      axios.put(`https://discord.com/api/v10/guilds/${preferences.discord.guild_id}/members/${discordResponse.data.id}/roles/${preferences.discord.c28_role_id}`, undefined, {
                        headers: {
                          'User-Agent': 'DiscordBot (https://github.com/zelnickb/mit2028-discord-verifier, 0.1.0)',
                          Authorization: `Bot ${preferences.api_keys.discord.bot_token}`,
                          'X-Audit-Log-Reason': 'User verified as student in MIT directory without class year (implies that student is \'28er).'
                        }
                      }).then(() => {
                        res.redirect(302, '/ui/verification/confirmed?inclass=1')
                      })
                    } else {
                      res.redirect(302, '/ui/verification/confirmed?inclass=0')
                    }
                  },
                  () => {
                    res.status(401)
                    res.render(path.resolve(__dirname, '..', '..', 'misc', 'error.hbs'), {
                      errCode: '401',
                      errDesc: 'Unauthorized',
                      errExplanation: 'There was an error applying the role to this user. Ensure that you are in the server and then try again.'
                    })
                  })
              }
            })
          })
        }
      })
    })
  })
})

module.exports = router

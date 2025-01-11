import * as openidClient from 'openid-client'
import * as oauthConfigs from '../../../../lib/oauthConfigurations.js'
import { configSync } from '../../../../lib/preferencesReader.js'
import { dbClient } from '../../../../lib/mongoClient.js'

const discordOauthTokens = dbClient.collection('verification.oauthTokens.discord')
const verificationSessions = dbClient.collection('verification.sessions')

export function get (req, res) {
  return openidClient.authorizationCodeGrant(oauthConfigs.discord, new URL(configSync().baseURL + req.originalUrl))
    .then(async (tokens) => {
      const userInfo = await openidClient.fetchProtectedResource(oauthConfigs.discord, tokens.access_token, new URL('https://discord.com/api/v10/users/@me'), 'GET').then(response => response.json())
      return {
        tokens,
        userInfo
      }
    })
    .then(async (userInfoAndTokens) => {
      await discordOauthTokens.updateOne(
        { _sub: userInfoAndTokens.userInfo.id },
        {
          $set: {
            _sub: userInfoAndTokens.userInfo.id,
            ...userInfoAndTokens.tokens
          }
        },
        {
          upsert: true
        }
      )
      return userInfoAndTokens
    })
    .then((userInfoAndTokens) => {
      return verificationSessions.updateOne(
        { sessionID: req.cookies['verification.sessionID'] },
        {
          $set: {
            discordUser: userInfoAndTokens.userInfo
          }
        })
    })
    .then(() => {
      res.redirect(302, '/verification/confirm')
    })
}

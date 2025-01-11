import * as openidClient from 'openid-client'
import * as crypto from 'crypto'
import { petrock } from '../../../../lib/oauthConfigurations.js'
import { configSync } from '../../../../lib/preferencesReader.js'
import { dbClient } from '../../../../lib/mongoClient.js'

const petrockOauthTokens = dbClient.collection('verification.oauthTokens.petrock')
const verificationSessions = dbClient.collection('verification.sessions')

export async function get (req, res) {
  return openidClient.authorizationCodeGrant(petrock, new URL(configSync().baseURL + req.originalUrl))
    .then(async (tokens) => {
      const userInfo = await openidClient.fetchUserInfo(petrock, tokens.access_token, tokens.claims().sub)
      return {
        tokens,
        userInfo
      }
    })
    .then(async (userInfoAndTokens) => {
      await petrockOauthTokens.updateOne(
        { _sub: userInfoAndTokens.userInfo.sub },
        {
          $set: {
            _sub: userInfoAndTokens.userInfo.sub,
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
      const sessionID = crypto.randomBytes(32).toString('base64url')
      res.cookie('verification.sessionID', sessionID, {
        sameSite: 'lax',
        path: '/',
        maxAge: 43200000
      })
      return verificationSessions.insertOne({
        _expires: new Date(Date.now() + 45000000), // Remove the session from the database 30 minutes (45000000-43200000 ms) after the cookie expires (in case of clock drift)
        sessionID,
        petrockUser: userInfoAndTokens.userInfo
      })
    })
    .then(() => {
      return res.redirect(302, '/verification/discord')
    })
}

import * as openidClient from 'openid-client'

import { petrock } from '../../../lib/oauthConfigurations.js'
import { dbClient } from '../../../lib/mongoClient.js'
import { checkRequestCookieAndHandleError } from '../lib/sessionInformation.js'
import { cachedConfig } from '../../../lib/preferencesReader.js'

const verificationSessionsCollection = dbClient.collection('verification.sessions')
const verificationLinksCollection = dbClient.collection('verification.links')
const petrockOauthTokens = dbClient.collection('oauthTokens.petrock')
const petrockUserInfoCache = dbClient.collection('cache.userInfo.petrock')

export async function get (req, res) {
  if (!await checkRequestCookieAndHandleError(req, res)) return
  return openidClient.authorizationCodeGrant(petrock, new URL(cachedConfig.baseURL + req.originalUrl))
    .then(async (tokens) => {
      const userInfo = await openidClient.fetchUserInfo(petrock, tokens.access_token, tokens.claims().sub)
      return {
        tokens,
        userInfo
      }
    })
    .then((userInfoAndTokens) => {
      return Promise.all([
        petrockOauthTokens.updateOne(
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
        ),
        petrockUserInfoCache.updateOne(
          { sub: userInfoAndTokens.userInfo.sub },
          {
            $set: userInfoAndTokens.userInfo
          },
          {
            upsert: true
          }
        ),
        (async () => {
          if (await verificationLinksCollection.countDocuments({ 'petrock.sub': userInfoAndTokens.userInfo.sub }) > 0) {
            return 'kerbAlreadyUsed'
          }
          if ((await verificationSessionsCollection.findOne({ _sessionId: req.cookies['verification.sessionId'] })).linkedAccounts.includes('petrock')) {
            return 'discordAlreadyLinked'
          }
          return verificationSessionsCollection.updateOne(
            { _sessionId: req.cookies['verification.sessionId'] },
            {
              $set: {
                'linksInProgress.petrock': userInfoAndTokens.userInfo
              }
            }
          )
        })()
      ])
    })
    .then((promiseResults) => {
      switch (promiseResults[2]) {
        case 'kerbAlreadyUsed':
          return res.status(403)
            .render('error', {
              code: '403',
              description: 'Forbidden',
              explanation: 'Your Kerberos identity is already linked to a Discord account. You may use your Kerberos identity to verify only one Discord account.'
            })
        case 'discordAlreadyLinked':
          return res.status(403)
            .render('error', {
              code: '403',
              description: 'Forbidden',
              explanation: 'Your Discord account is already linked to a Kerberos identity.'
            })
      }
      return res.redirect(307, '/verification/confirmation/petrock')
    })
}

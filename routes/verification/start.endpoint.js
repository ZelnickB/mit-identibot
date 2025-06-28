import * as path from 'path'
import { buildAuthorizationUrl } from 'openid-client'

import { dbClient } from '../../lib/mongoClient.js'
import { cachedConfig } from '../../lib/preferencesReader.js'
import { petrock } from '../../lib/oauthConfigurations.js'

const verificationSessionsCollection = dbClient.collection('verification.sessions')

export async function get (req, res) {
  if (!('sessionId' in req.query)) {
    return res.status(400)
      .render('error', {
        code: '400',
        description: 'Bad Request',
        explanation: 'To verify your account, you must first run the proper command from Discord.'
      })
  }
  const sessionInformation = await verificationSessionsCollection.findOne({ _sessionId: req.query.sessionId })
  if (sessionInformation === null) {
    return res.clearCookie('verification.sessionId')
      .status(400)
      .render('error', {
        code: '400',
        description: 'Bad Request',
        explanation: 'Invalid session ID. Use the proper Discord command to request a new verification link.'
      })
  }
  res.cookie('verification.sessionId', sessionInformation._sessionId, {
    sameSite: 'lax',
    path: '/',
    expires: new Date(sessionInformation._expires - 300000)
  })
    .status(200)
    .render(path.resolve(import.meta.dirname, 'endpointAssets', 'start', 'ui.hbs'), {
      sessionInformation,
      ssoURLs: {
        petrock: buildAuthorizationUrl(petrock, {
          redirect_uri: `${cachedConfig.baseURL}/verification/callbacks/petrock`,
          scope: 'openid email profile'
        }),
        alumSSO: "javascript:alert('This feature is not yet implemented.')",
        admittedVerification: '/verification/admitted'
      },
      extraClasses: {
        touchstoneButton: returnHiddenIfTrue(sessionInformation.linkedAccounts.includes('petrock')),
        admittedVerificationButton: returnHiddenIfTrue(sessionInformation.linkedAccounts.includes('admitted'))
      }
    })
}

function returnHiddenIfTrue (i) {
  if (i) return 'hidden'
  else return ''
}

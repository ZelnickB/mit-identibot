import * as path from 'path'
import { discord } from '../../lib/oauthConfigurations.js'
import { configSync } from '../../lib/preferencesReader.js'
import { dbClient } from '../../lib/mongoClient.js'
import { buildAuthorizationUrl } from 'openid-client'

const verificationSessions = dbClient.collection('verification.sessions')

export function get (req, res) {
  verificationSessions.findOne({ sessionID: req.cookies['verification.sessionID'] })
    .then((sessionInformation) => {
      res.status(200).render(path.resolve(import.meta.dirname, 'endpointAssets', 'discord', 'ui.hbs'), {
        authorizationRedirectURL: buildAuthorizationUrl(discord, {
          redirect_uri: `${configSync().baseURL}/api/verification/oauthCallbacks/discord`,
          scope: 'identify email openid role_connections.write'
        }),
        userInfo: sessionInformation.petrockUser
      })
    })
}

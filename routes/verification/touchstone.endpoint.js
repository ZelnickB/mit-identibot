import * as path from 'path'
import { petrock } from '../../lib/oauthConfigurations.js'
import { configSync } from '../../lib/preferencesReader.js'
import { buildAuthorizationUrl } from 'openid-client'

export function get (req, res) {
  res.status(200).render(path.resolve(import.meta.dirname, 'endpointAssets', 'touchstone', 'ui.hbs'), {
    authorizationRedirectURL: buildAuthorizationUrl(petrock, {
      redirect_uri: `${configSync().baseURL}/api/verification/oauthCallbacks/petrock`,
      scope: 'openid email profile'
    })
  })
}

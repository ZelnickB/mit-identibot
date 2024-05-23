import path from 'path'
import { petrock } from '../../lib/oauthClients.js'
import { configSync } from '../../lib/preferencesReader.js'

export function get (req, res) {
  res.status(200).render(path.resolve(import.meta.dirname, 'endpointAssets', 'touchstone', 'ui.hbs'), {
    authorizationRedirectURL: petrock.authorizationUrl({
      redirect_uri: `${configSync().baseURL}/api/verification/oauthCallbacks/petrock`,
      scope: 'openid email profile'
    })
  })
}

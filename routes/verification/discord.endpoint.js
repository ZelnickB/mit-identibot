import path from 'path'
import { TokenSet } from 'openid-client'
import { petrock, discord } from '../../lib/oauthClients.js'
import { configSync } from '../../lib/preferencesReader.js'
import { decrypt } from '../../lib/simpleCrypto.js'

export function get (req, res) {
  petrock.userinfo(
    new TokenSet(
      JSON.parse(
        decrypt(Buffer.from(req.cookies['oauthTokens.petrock'], 'base64url'))
          .toString('utf8')
      )
    )
  ).then((userInfo) => {
    res.status(200).render(path.resolve(import.meta.dirname, 'endpointAssets', 'discord', 'ui.hbs'), {
      authorizationRedirectURL: discord.authorizationUrl({
        redirect_uri: `${configSync().baseURL}/api/verification/oauthCallbacks/discord`,
        scope: 'openid identify email'
      }),
      petrockUserInfo: userInfo
    })
  })
}

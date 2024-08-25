import * as path from 'path'
import { petrock } from '../../lib/oauthClients.js'
import { TokenSet } from 'openid-client'
import { decrypt } from '../../lib/simpleCrypto.js'
import { configSync } from '../../lib/preferencesReader.js'

export function get (req, res) {
  petrock.userinfo(
    new TokenSet(
      JSON.parse(
        decrypt(Buffer.from(req.cookies['oauthTokens.petrock'], 'base64url'))
          .toString('utf8')
      )
    )
  ).then((petrockUserInfo) => {
    res.status(200).render(path.resolve(import.meta.dirname, 'endpointAssets', 'confirmed', 'ui.hbs'), {
      petrockUserInfo,
      messageVariables: {
        whereServers: configSync().singleServerMessages ? 'this server' : 'all participating Discord servers'
      }
    })
  })
}

import * as path from 'path'
import { petrock, discord } from '../../lib/oauthClients.js'
import { TokenSet } from 'openid-client'
import { decrypt } from '../../lib/simpleCrypto.js'
import * as utils from '../../lib/utils.js'
import { configSync } from '../../lib/preferencesReader.js'

export function get (req, res) {
  let petrockTokenSetJSON, discordTokenSetJSON
  try {
    petrockTokenSetJSON = new TokenSet(JSON.parse(
      decrypt(Buffer.from(req.cookies['oauthTokens.petrock'], 'base64url'))
        .toString('utf8')
    ))
    discordTokenSetJSON = new TokenSet(JSON.parse(
      decrypt(Buffer.from(req.cookies['oauthTokens.discord'], 'base64url'))
        .toString('utf8')
    ))
  } catch {
    return res.sendStatus(400)
  }
  Promise.all([
    petrock.userinfo(
      petrockTokenSetJSON
    ),
    discord.requestResource(
      'https://discord.com/api/v10/users/@me',
      discordTokenSetJSON
    )
  ]).then(([petrockUserInfo, discordUserInfo]) => {
    discordUserInfo = JSON.parse(discordUserInfo.body.toString('utf8'))
    const newServerNickname = utils.parseNickname(petrockUserInfo.given_name, petrockUserInfo.family_name)
    res.status(200).render(path.resolve(import.meta.dirname, 'endpointAssets', 'confirm', 'ui.hbs'), {
      petrockUserInfo,
      discordUserInfo,
      newServerNickname,
      messageVariables:
        configSync().singleServerMessages
          ? {
              discordAccountWhereAlt: ' in this server',
              discordAccountWhere: 'this server',
              discordAccountWhereSome: 'this server (depending on configuration)'
            }
          : {
              discordAccountWhereAlt: '',
              discordAccountWhere: 'participating servers',
              discordAccountWhereSome: 'some participating servers'
            }
    })
  })
}

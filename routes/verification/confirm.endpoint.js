import * as path from 'path'
import * as utils from '../../lib/utils.js'
import { configSync } from '../../lib/preferencesReader.js'
import { dbClient } from '../../lib/mongoClient.js'

const verificationSessions = dbClient.collection('verification.sessions')

export function get (req, res) {
  verificationSessions.findOne({ sessionID: req.cookies['verification.sessionID'] })
    .then((sessionInformation) => {
      res.status(200).render(path.resolve(import.meta.dirname, 'endpointAssets', 'confirm', 'ui.hbs'), {
        petrockUserInfo: sessionInformation.petrockUser,
        discordUserInfo: sessionInformation.discordUser,
        newServerNickname: utils.parseNickname(sessionInformation.petrockUser.given_name, sessionInformation.petrockUser.family_name),
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

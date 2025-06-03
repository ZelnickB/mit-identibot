import { checkRequestCookieAndHandleError } from '../lib/sessionInformation.js'
import { dbClient } from '../../../lib/mongoClient.js'
import path from 'path'
import { assignRolesToUserInAllServers } from '../../../lib/guildUserModifier.js'

const verificationSessionsCollection = dbClient.collection('verification.sessions')
const verificationLinksCollection = dbClient.collection('verification.links')

export async function get (req, res) {
  if (!await checkRequestCookieAndHandleError(req, res)) return
  const sessionInformation = await verificationSessionsCollection.findOne({ _sessionId: req.cookies['verification.sessionId'] })
  if (!('petrock' in sessionInformation.linksInProgress)) {
    return res.status(400)
      .render('error', {
        code: '400',
        description: 'Bad Request',
        explanation: 'You must sign in with your Kerberos account before accessing this page.'
      })
  }
  await verificationLinksCollection.updateOne(
    {
      discordAccountId: sessionInformation.discordUser.id
    },
    {
      $setOnInsert: {
        discordAccountId: sessionInformation.discordUser.id
      },
      $set: {
        petrock: {
          sub: sessionInformation.linksInProgress.petrock.sub,
          timeLinked: new Date(Date.now())
        }
      }
    },
    {
      upsert: true
    }
  )
    .then(() => {
      return verificationSessionsCollection.updateOne(
        { _sessionId: req.cookies['verification.sessionId'] },
        {
          $unset: {
            'linksInProgress.petrock': null
          },
          $push: {
            linkedAccounts: 'petrock'
          }
        }
      )
    })
  res.status(200).sendFile(path.resolve(import.meta.dirname, 'endpointAssets', 'petrock', 'ui.html'))
  return assignRolesToUserInAllServers(sessionInformation.discordUser.id)
}

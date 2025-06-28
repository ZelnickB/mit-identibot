import { dbClient } from '../../../lib/mongoClient.js'
import path from 'path'
import { assignRolesToUserInAllServers } from '../../../lib/guildUserModifier.js'
import { initialVerifyChallengeSessionAndRespond } from '../lib/admittedVerificationSessions.js'

const verificationSessionsCollection = dbClient.collection('verification.sessions')
const verificationLinksCollection = dbClient.collection('verification.links')

export async function get (req, res) {
  const sessionInformation = await initialVerifyChallengeSessionAndRespond(req, res, true)
  if (!sessionInformation) return
  if (await verificationLinksCollection.findOne({ 'admitted.uuid': sessionInformation.linksInProgress.admitted.uuid })) {
    return res.status(403)
      .render('error', {
        code: '403',
        description: 'Forbidden',
        explanation: 'The admitted student profile associated with your email has already been used to verify another Discord account.'
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
        admitted: {
          uuid: sessionInformation.linksInProgress.admitted.uuid,
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
        { _id: sessionInformation._id },
        {
          $unset: {
            'linksInProgress.admitted': null
          },
          $push: {
            linkedAccounts: 'admitted'
          }
        }
      )
    })
  res.status(200).sendFile(path.resolve(import.meta.dirname, 'endpointAssets', 'admitted', 'ui.html'))
  return assignRolesToUserInAllServers(sessionInformation.discordUser.id)
}

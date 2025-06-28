import { dbClient } from '../../../lib/mongoClient.js'
import { initialVerifyChallengeSessionAndRespond } from '../lib/admittedVerificationSessions.js'

const verificationSessionsCollection = dbClient.collection('verification.sessions')

export async function get (req, res) {
  const sessionInformation = await initialVerifyChallengeSessionAndRespond(req, res, false)
  if (!sessionInformation) return
  await verificationSessionsCollection.updateOne(
    { _id: sessionInformation._id },
    {
      $set: {
        'linksInProgress.admitted.emailVerified': true
      }
    }
  )
  return res.redirect(307, `/verification/confirmation/admitted?challenge=${req.query.challenge}`)
}

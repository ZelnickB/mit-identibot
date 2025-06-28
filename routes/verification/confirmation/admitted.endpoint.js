import { dbClient } from '../../../lib/mongoClient.js'
import path from 'path'
import { initialVerifyChallengeSessionAndRespond } from '../lib/admittedVerificationSessions.js'

const admittedStudentsCollection = dbClient.collection('admittedStudents')

export async function get (req, res) {
  const sessionInformation = await initialVerifyChallengeSessionAndRespond(req, res, true)
  if (!sessionInformation) return
  const admittedStudentProfile = await admittedStudentsCollection.findOne({ uuid: sessionInformation.linksInProgress.admitted.uuid })
  res.status(200)
    .render(path.resolve(import.meta.dirname, 'endpointAssets', 'admitted', 'ui.hbs'), {
      sessionInformation,
      newServerNickname: admittedStudentProfile.preferredName
    })
}

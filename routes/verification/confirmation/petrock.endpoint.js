import path from 'path'
import { dbClient } from '../../../lib/mongoClient.js'
import { checkRequestCookieAndHandleError } from '../lib/sessionInformation.js'
import { parseNickname } from '../../../lib/utils.js'

const verificationSessionsCollection = dbClient.collection('verification.sessions')

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
  res.status(200)
    .render(path.resolve(import.meta.dirname, 'endpointAssets', 'petrock', 'ui.hbs'), {
      sessionInformation,
      newServerNickname: parseNickname(sessionInformation.linksInProgress.petrock.given_name, sessionInformation.linksInProgress.petrock.family_name)
    })
}

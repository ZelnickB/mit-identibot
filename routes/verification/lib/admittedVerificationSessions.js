import { dbClient } from '../../../lib/mongoClient.js'
import { checkRequestCookieAndHandleError } from './sessionInformation.js'

const verificationSessionsCollection = dbClient.collection('verification.sessions')

export async function initialVerifyChallengeSessionAndRespond (req, res, requireVerifiedEmail = false) {
  if (!('challenge' in req.query)) {
    res.status(400)
      .render('error', {
        code: '400',
        description: 'Bad Request',
        explanation: 'Missing URL parameter. Ensure that you correctly entered the URL that was emailed to you.'
      })
    return false
  }
  const sessionInformation = await verificationSessionsCollection.findOne({ 'linksInProgress.admitted.challengeString': req.query.challenge })
  if (!sessionInformation) {
    res.status(403)
      .render('error', {
        code: '403',
        description: 'Forbidden',
        explanation: 'Invalid challenge string.'
      })
    return false
  }
  if (requireVerifiedEmail && !sessionInformation.linksInProgress.admitted.emailVerified) {
    res.status(403)
      .render('error', {
        code: '403',
        description: 'Forbidden',
        explanation: 'You have not yet verified your email. Follow the link that you received in your email to do this.'
      })
    return false
  }
  return sessionInformation
}

export async function emailSubmissionPageValidateInitialRequestAndRespond (req, res) {
  if (!await checkRequestCookieAndHandleError(req, res)) return false
  const sessionInformation = await verificationSessionsCollection.findOne({ _sessionId: req.cookies['verification.sessionId'] })
  if (sessionInformation.linkedAccounts.includes('admitted')) {
    res.status(403)
      .render('error', {
        code: '403',
        description: 'Forbidden',
        explanation: 'Your Discord account is already linked to an admitted student profile.'
      })
    return false
  }
  if ('admitted' in sessionInformation.linksInProgress) {
    res.status(403)
      .render('error', {
        code: '403',
        description: 'Forbidden',
        explanation: 'You are already in the process of linking an admitted student profile. To change your inputted email, run the /verify command again from Discord.'
      })
    return false
  }
  return sessionInformation
}

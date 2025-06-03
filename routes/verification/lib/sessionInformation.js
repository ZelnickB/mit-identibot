import { dbClient } from '../../../lib/mongoClient.js'

const verificationSessionsCollection = dbClient.collection('verification.sessions')

export class SessionInformationRetrievalError extends Error {}
export class InvalidSessionIdError extends SessionInformationRetrievalError {}
export class MissingSessionIdCookieError extends SessionInformationRetrievalError {}

export async function isIdValid (sessionId) {
  return (await verificationSessionsCollection.countDocuments({ _sessionId: sessionId }) === 1)
}

export async function isRequestCookieValid (req) {
  if (!('verification.sessionId' in req.cookies)) throw new MissingSessionIdCookieError()
  return isIdValid(req.cookies['verification.sessionId'])
}

export async function checkRequestCookieAndHandleError (req, res) {
  try {
    if (await isRequestCookieValid(req)) {
      return true
    } else {
      res.clearCookie('verification.sessionId')
        .status(400)
        .render('error', {
          code: '400',
          description: 'Bad Request',
          explanation: 'Invalid session ID. Use the proper Discord command to restart the verification process.'
        })
      return false
    }
  } catch (e) {
    if (e instanceof MissingSessionIdCookieError) {
      res.status(400)
        .render('error', {
          code: '400',
          description: 'Bad Request',
          explanation: 'Missing session ID. Use the proper Discord command to restart the verification process.'
        })
    } else throw e
  }
}

export async function getFromId (sessionId) {
  const foundDocument = await verificationSessionsCollection.findOne({ _sessionId: sessionId })
  if (foundDocument === null) throw new InvalidSessionIdError()
  return foundDocument
}

export async function getFromRequestCookie (req) {
  if (!('verification.sessionId' in req.cookies)) throw new MissingSessionIdCookieError()
  return getFromId(req.cookies['verification.sessionId'])
}

export async function getFromRequestCookieAndHandleError (req, res) {
  try {
    return await getFromRequestCookie(req)
  } catch (e) {
    if (e instanceof MissingSessionIdCookieError) {
      res.status(400)
        .render('error', {
          code: '400',
          description: 'Bad Request',
          explanation: 'Missing session ID. Use the proper Discord command to restart the verification process.'
        })
    } else if (e instanceof InvalidSessionIdError) {
      res.clearCookie('verification.sessionId')
        .status(400)
        .render('error', {
          code: '400',
          description: 'Bad Request',
          explanation: 'Invalid session ID. Use the proper Discord command to restart the verification process.'
        })
    }
    return null
  }
}

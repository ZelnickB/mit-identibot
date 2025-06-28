import * as path from 'path'
import * as crypto from 'node:crypto'
import * as timersPromises from 'timers/promises'
import { dbClient } from '../../lib/mongoClient.js'
import sendMail from '../../lib/smtpClient.js'
import { cachedConfig } from '../../lib/preferencesReader.js'
import { emailSubmissionPageValidateInitialRequestAndRespond } from './lib/admittedVerificationSessions.js'

const verificationSessionsCollection = dbClient.collection('verification.sessions')
const verificationLinksCollection = dbClient.collection('verification.links')
const admittedStudentsCollection = dbClient.collection('admittedStudents')

export async function get (req, res) {
  if (!await emailSubmissionPageValidateInitialRequestAndRespond(req, res)) return

  res.sendFile(path.resolve(import.meta.dirname, 'endpointAssets', 'admitted', 'ui.html'))
}

export async function post (req, res) {
  const sessionInformation = await emailSubmissionPageValidateInitialRequestAndRespond(req, res)
  if (!sessionInformation) return

  if (!req.is('application/x-www-form-urlencoded')) {
    return res.status(415)
      .render('error', {
        code: '415',
        description: 'Unsupported Media Type',
        explanation: 'Your browser sent an unsupported request to the server. Ensure that your browser is up-to-date and supported, and try again.'
      })
  }
  if (!('admissionsPortalEmail' in req.body) || req.body.admissionsPortalEmail === '') {
    return res.status(400)
      .render('error', {
        code: '400',
        description: 'Bad Request',
        explanation: 'You must specify the email that you used in the MIT admissions portal in order to continue.'
      })
  }
  if (!(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(req.body.admissionsPortalEmail))) {
    return res.status(400)
      .render('error', {
        code: '400',
        description: 'Bad Request',
        explanation: `"${req.body.admissionsPortalEmail}" is not a valid email address.`
      })
  }
  const admittedStudentDocument = await admittedStudentsCollection.findOne({ email: req.body.admissionsPortalEmail.toLowerCase() })
  if (admittedStudentDocument && !(await verificationLinksCollection.countDocuments({ 'admitted.uuid': admittedStudentDocument.uuid }))) {
    const challengeString = crypto.randomBytes(32).toString('base64url')
    await Promise.all([
      verificationSessionsCollection.updateOne(
        { _sessionId: req.cookies['verification.sessionId'] },
        {
          $set: {
            'linksInProgress.admitted': {
              uuid: admittedStudentDocument.uuid,
              emailVerified: false,
              challengeString
            }
          }
        }
      ),
      sendMail({
        to: admittedStudentDocument.email,
        replyTo: cachedConfig.supportContacts.emails.admittedVerification,
        subject: 'Verify Your Discord Account',
        text:
`Hi, ${admittedStudentDocument.preferredName}!

Congratulations on your acceptance to MIT!

We have received a request to link a Discord account, @${sessionInformation.discordUser.username}, to your admitted student profile. This will allow you to access private Discord servers and engage with the MIT community (and your fellow adMITs!). For security reasons, note that you can only verify ONE Discord account with your admitted student profile.

To confirm that the Discord account @${sessionInformation.discordUser.username} is yours and verify it, please click on the following link or copy and paste it into your browser:
${cachedConfig.baseURL}/verification/callbacks/admitted?challenge=${challengeString}
This link is specific to you and should not be shared with anyone else.

If you did not request this email, you may safely ignore it.

Cheers,
MIT IdentiBot`
      })
    ])
  } else {
    await Promise.all([
      verificationSessionsCollection.updateOne(
        { _sessionId: req.cookies['verification.sessionId'] },
        {
          $set: {
            'linksInProgress.admitted': null
          }
        }
      ),
      timersPromises.setTimeout(crypto.randomInt(750, 2001)) // Simulate a (relatively slow) mail server request to reduce the risk of timing attacks determining whether an email corresponds to an admitted student.
    ])
  }
  res.render(
    path.resolve(import.meta.dirname, 'endpointAssets', 'admitted', 'emailSent.hbs'),
    {
      email: req.body.admissionsPortalEmail,
      admittedSupportEmail: cachedConfig.supportContacts.emails.admittedVerification
    }
  )
}

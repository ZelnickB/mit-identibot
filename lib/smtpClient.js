import nodemailer from 'nodemailer'
import * as preferencesReader from './preferencesReader.js'

const config = await preferencesReader.config()
const secrets = await preferencesReader.secrets()

export const transporter = nodemailer.createTransport({
  host: config.smtp.hostname,
  port: config.smtp.port,
  secure: true,
  requireTLS: true,
  auth: {
    user: config.smtp.username,
    pass: secrets.smtpPassword
  }
})

export default function sendMail (data, callback) {
  return transporter.sendMail(
    {
      from: config.smtp.fromUser,
      replyTo: config.smtp.replyTo,
      ...data
    },
    callback
  )
}

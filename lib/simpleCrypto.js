import * as crypto from 'crypto'
import { secretsSync } from './preferencesReader.js'

export function encrypt (data, key = Buffer.from(secretsSync().symmetricCipherKey, 'base64')) {
  if (typeof data === 'string') {
    data = Buffer.from(data, 'utf8')
  }
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  return Buffer.concat([iv, cipher.update(data), cipher.final(), cipher.getAuthTag()])
}

export function decrypt (encryptedData, key = Buffer.from(secretsSync().symmetricCipherKey, 'base64')) {
  if (typeof encryptedData === 'string') {
    encryptedData = Buffer.from(encryptedData, 'base64')
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, encryptedData.subarray(0, 16))
  decipher.setAuthTag(encryptedData.subarray(-16))
  return Buffer.concat([decipher.update(encryptedData.subarray(16, -16)), decipher.final()])
}

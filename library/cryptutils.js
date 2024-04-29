const crypto = require('crypto')
const preferences = require('./preferences')

const aesKey = Buffer.from(preferences.cryptutils.keys.encryption, 'base64')
const hmacKey = Buffer.from(preferences.cryptutils.keys.hmac, 'base64')

module.exports = {
  encrypt: (data) => {
    if (typeof data === 'string') {
      data = Buffer.from(data, 'utf8')
    }
    const hmac = crypto.createHmac('sha256', hmacKey)
    const iv = hmac.update(data).digest().subarray(0, 16)
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv)
    return Buffer.concat([iv, cipher.update(data, 'utf8'), cipher.final(), cipher.getAuthTag()])
  },
  decrypt: (encryptedData) => {
    const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, encryptedData.subarray(0, 16))
    decipher.setAuthTag(encryptedData.subarray(-16))
    return Buffer.concat([decipher.update(encryptedData.subarray(16, -16)), decipher.final()])
  }
}

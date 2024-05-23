import * as openidClient from 'openid-client'
import * as preferencesReader from '../lib/preferencesReader.js'

const config = await preferencesReader.config()
const secrets = await preferencesReader.secrets()

const issuers = {
  petrock: await openidClient.Issuer.discover('https://petrock.mit.edu'),
  discord: await openidClient.Issuer.discover('https://discord.com')
}

export const petrock = new issuers.petrock.Client({
  client_id: config.petrock.clientID,
  client_secret: secrets.oauthClientSecrets.petrock
})
export const discord = new issuers.discord.Client({
  client_id: config.discord.clientID,
  client_secret: secrets.oauthClientSecrets.discord
})

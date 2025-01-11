import * as openidClient from 'openid-client'
import * as preferencesReader from '../lib/preferencesReader.js'

const config = await preferencesReader.config()
const secrets = await preferencesReader.secrets()

export const petrock = await openidClient.discovery(
  new URL('https://petrock.mit.edu'),
  config.petrock.clientID,
  secrets.oauthClientSecrets.petrock,
  openidClient.ClientSecretBasic(secrets.oauthClientSecrets.petrock)
)
export const discord = await openidClient.discovery(
  new URL('https://discord.com'),
  config.discord.clientID,
  secrets.oauthClientSecrets.discord
)

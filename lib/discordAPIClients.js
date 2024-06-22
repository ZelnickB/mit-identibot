import * as discord from 'discord.js'
import { GatewayIntentBits, Routes } from 'discord-api-types/v10'
import * as preferencesReader from './preferencesReader.js'

const config = await preferencesReader.config()
const secrets = await preferencesReader.secrets()

const rest = new discord.REST({
  version: 10
})
rest.setToken(secrets.discordBotToken)

const gateway = new discord.Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
})
await gateway.login(secrets.discordBotToken)

export { rest, gateway, Routes }
export const clientID = config.discord.clientID

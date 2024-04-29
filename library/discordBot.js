const discord = require('discord.js')
const discordAPITypes = require('discord-api-types')

const preferences = require('./preferences')

module.exports = {
  rest: new discord.REST({ version: '10' }).setToken(preferences.api_keys.discord.bot_token),
  client: await discord.Client().login(preferences.api_keys.discord.bot_token)
}

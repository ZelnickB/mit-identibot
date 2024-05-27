import { configDb } from '../../lib/preferencesReader.js'

export async function authorize (interaction) {
  return Object.keys(await configDb.getDocumentByName('servers')).includes(interaction.guildId)
}

export async function authorizeAndReply (interaction, ephemeralResponse = true) {
  if (await authorize(interaction)) {
    return true
  } else {
    await interaction.reply({
      content: '**Error!** This server is not authorized to perform the attempted action.',
      ephemeral: ephemeralResponse
    })
    return false
  }
}

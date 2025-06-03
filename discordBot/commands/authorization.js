import { dbClient } from '../../lib/mongoClient.js'
import { getServerConfigDocument } from '../../lib/configurationReaders.js'

const verificationLinksCollection = dbClient.collection('verification.links')

export function authorizeServer (interaction) {
  return getServerConfigDocument(interaction.guildId).then((doc) => {
    return !(doc === null || !('authorized' in doc && doc.authorized === true))
  })
}

export async function authorizeServerAndReply (interaction, ephemeralResponse = true) {
  if (await authorizeServer(interaction)) {
    return true
  } else {
    await interaction.reply({
      content: '**Error!** This server is not authorized to perform the attempted action.',
      ephemeral: ephemeralResponse
    })
    return false
  }
}

export async function checkUserVerification (interaction) {
  return verificationLinksCollection.countDocuments(
    {
      discordAccountId: interaction.user.id
    }
  ).then((count) => {
    return count !== 0
  })
}

export async function checkUserVerificationAndReply (interaction, ephemeralResponse = true) {
  if (await checkUserVerification(interaction)) {
    return true
  } else {
    await interaction.reply({
      content: '**Error!** Access to the requested information is restricted to verified users. Please verify your Kerberos identity and then try again.',
      ephemeral: ephemeralResponse
    })
    return false
  }
}

export async function checkUserInServer (interaction, user) {
  if (!interaction.inGuild()) return false
  return interaction.guild.members.fetch(user.id).then(() => true, () => false)
}

export async function checkUserInServerAndReply (interaction, user, ephemeralResponse = true) {
  if (await checkUserInServer(interaction, user)) {
    return true
  } else {
    await interaction.reply({
      content: `**Error!** The specified user, <@${user.id}>, is not a member of this server.`,
      ephemeral: ephemeralResponse
    })
    return false
  }
}

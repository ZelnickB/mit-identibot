import { dbClient } from '../../lib/mongoClient.js'
import { getServerConfigDocument } from '../../lib/configurationReaders.js'

const verificationUserInfoCollection = dbClient.collection('verification.userInfo')

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
  return verificationUserInfoCollection.countDocuments(
    {
      'discord.id': interaction.user.id
    }
  ).then((doc) => {
    return doc !== null
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

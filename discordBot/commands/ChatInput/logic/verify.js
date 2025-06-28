import * as crypto from 'node:crypto'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import { dbClient } from '../../../../lib/mongoClient.js'
import { configSync } from '../../../../lib/preferencesReader.js'
import mapVerificationLinkFieldsToAccountTypes from '../../../../routes/verification/lib/mapVerificationLinkFieldsToAccountTypes.js'

const verificationLinksCollection = dbClient.collection('verification.links')
const verificationSessionsCollection = dbClient.collection('verification.sessions')

export default async function (interaction) {
  await interaction.deferReply({ ephemeral: interaction.guild !== null })
  const sessionId = crypto.randomBytes(32)
  const sessionIdBase64url = sessionId.toString('base64url')
  const expiration = new Date(Date.now() + 3600000)
  return verificationLinksCollection.findOne(
    {
      discordAccountId: interaction.user.id
    }
  )
    .then((verificationLinks) => {
      const linkedAccounts = verificationLinks === null ? [] : mapVerificationLinkFieldsToAccountTypes(Object.keys(verificationLinks))
      return verificationSessionsCollection.updateOne(
        {
          'discordUser.id': interaction.user.id
        },
        {
          $set: {
            _expires: expiration,
            _sessionId: sessionIdBase64url,
            discordUser: interaction.user,
            linkedAccounts
          },
          $setOnInsert: {
            linksInProgress: {}
          }
        },
        {
          upsert: true
        }
      )
    })
    .then(async updateResult => {
      await verificationSessionsCollection.updateOne(
        {
          'discordUser.id': interaction.user.id
        },
        {
          $unset: {
            'linksInProgress.admitted': null
          }
        }
      )
      return updateResult
    })
    .then(updateResult => interaction.editReply({
      content: `**Use the button below to verify your account.**\n-# :clock1: **This link expires** <t:${Math.round(expiration.getTime() / 1000)}:R>. It will be deactivated and replaced if you run this command again.${updateResult.upsertedCount === 0 ? '\n-# :no_entry_sign: **A previously generated link was deactivated when you ran this command.** You can no longer use any previously generated links to perform verification.' : ''}\n-# :warning: **This link is specific to you.** If you share it with other people, then they may be able to make changes to your verification settings.`,
      components: [
        new ActionRowBuilder().addComponents([new ButtonBuilder()
          .setLabel('Verify account')
          .setStyle(ButtonStyle.Link)
          .setURL(configSync().baseURL + `/verification/start?sessionId=${sessionIdBase64url}`)
        ])
      ]
    }))
}

import { AttachmentBuilder } from 'discord.js'

import { getUserInfo, UnlinkedUserError } from '../../../lib/userLinks.js'
import { whoisResult } from '../../embedBuilders.js'
import { UserNotFoundError } from '../../../lib/mitDeveloperConnection/people.js'

export async function respond (interaction) {
  try {
    const userInfo = await getUserInfo(interaction.options.get('user').user)
    const files = []
    if (userInfo.image !== undefined) {
      files.push(new AttachmentBuilder(userInfo.image, { name: 'user.jpeg' }))
    }
    const embed = await whoisResult(interaction.options.get('user').user.id, userInfo)
    interaction.editReply({
      embeds: [embed],
      files
    })
  } catch (e) {
    if (e instanceof UnlinkedUserError) {
      return interaction.editReply({
        content: `**Error:** <@${interaction.options.get('user').user.id}> is not linked to a Kerberos identity.`,
        allowedMentions: {
          parse: []
        }
      })
    }
    if (e instanceof UserNotFoundError) {
      return interaction.editReply({
        content: '**Error:** Information about the user was unavailable. This error may occur if the user has enabled directory suppression or if they are no longer at MIT.'
      })
    }
    interaction.editReply({
      content: '**Error:** IdentiBot encountered a problem while fetching the information for this user.'
    })
  }
}

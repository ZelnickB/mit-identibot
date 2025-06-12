import { AttachmentBuilder } from 'discord.js'

import { getUserInfo } from '../../../lib/userLinks.js'
import { whoisResult } from '../../embedBuilders.js'
import { BadGatewayError, EmbeddableError } from '../../../lib/errorBases.js'

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
    if (e instanceof EmbeddableError) {
      return e.editReplyWithEmbed(interaction)
    }
    new BadGatewayError('IdentiBot encountered a problem while fetching the information for this user.').editReplyWithEmbed(interaction)
  }
}

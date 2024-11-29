import { getUserInfo, UnlinkedUserError } from './retrievers.js'
import { AttachmentBuilder } from 'discord.js'
import { whoisResult } from './embedBuilders.js'

export default async function respond (interaction) {
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
    interaction.editReply({
      content: '**Error:** IdentiBot encountered a problem while fetching the information for this user.'
    })
  }
}

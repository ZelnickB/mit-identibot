import { getUserInfo } from '../../common/whois/retrievers.js'
import { authorizeAndReply } from '../../serverAuthorization.js'
import { whoisResult } from '../../common/whois/embedBuilders.js'

export default async function (interaction) {
  if (!await authorizeAndReply(interaction)) return
  try {
    const embed = await whoisResult(interaction.options.get('user').user.id, await getUserInfo(interaction.options.get('user').user))
    interaction.reply({
      embeds: [embed],
      allowedMentions: {
        parse: []
      },
      ephemeral: interaction.options.get('onlyme') !== null && interaction.options.get('onlyme').value
    })
  } catch {
    interaction.reply({
      content: '**Error:** IdentiBot encountered a problem while fetching the information for this user.',
      ephemeral: true
    })
  }
}

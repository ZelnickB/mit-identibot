import { profileText } from '../../common/whois.js'
import { authorizeAndReply } from '../../serverAuthorization.js'

export default async function (interaction) {
  if (!await authorizeAndReply(interaction)) return
  interaction.reply({
    content: await profileText(interaction.options.get('user').user),
    allowedMentions: {
      parse: []
    },
    ephemeral: true
  })
}

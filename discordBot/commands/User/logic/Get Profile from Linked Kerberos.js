import { profileText } from '../../common/kerbid.js'

export default async function (interaction) {
  interaction.reply({
    content: await profileText(interaction.options.get('user').user),
    allowedMentions: {
      parse: []
    },
    ephemeral: true
  })
}

import { authorizeServerAndReply } from '../../authorization.js'
import { getAutoNickname } from '../../../../lib/userLinks.js'

export default async function (interaction) {
  if (!await authorizeServerAndReply(interaction)) return
  const targetUser = interaction.options.get('user').user
  const newNickname = await getAutoNickname(targetUser)
  if (newNickname === false) {
    interaction.reply({
      content: `**Error:** User <@${targetUser.id}> has not linked a Kerberos account. Their nickname cannot be reset.`,
      allowedMentions: {
        parse: []
      },
      ephemeral: true
    })
    return
  }
  interaction.guild.members.fetch(targetUser.id).then((member) => {
    return member.setNickname(newNickname, `Nickname reset requested by user ${interaction.user.id}.`)
  }).then(
    () => {
      interaction.reply({
        content: `Nickname of user <@${targetUser.id}> reset to ${newNickname}.`,
        allowedMentions: {
          parse: []
        },
        ephemeral: true
      })
    },
    () => {
      interaction.reply({
        content: `**Error:** Nickname of user <@${targetUser.id}> could not be reset.`,
        ephemeral: true
      })
    })
}

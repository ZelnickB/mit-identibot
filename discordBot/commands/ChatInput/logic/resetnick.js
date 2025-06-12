import { authorizeServerAndReply } from '../../authorization.js'
import { getAutoNickname } from '../../../../lib/userLinks.js'
import { EmbeddableError } from '../../../../lib/errorBases.js'

export class ResetNicknameError extends EmbeddableError {
  constructor (userId, { referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: `Could not reset nickname for user ${userId}.`,
        embedMessage: `**The nickname of user <@${userId}> could not be reset.** The most likely reason for this is that IdentiBot lacks the appropriate Discord permissions to reset this user's nickname.\nCheck to make sure that the user is not the server owner and does not have any roles that are higher in the role list than IdentiBot's highest role.`,
        summaryMessage: 'Nickname reset failed',
        referenceNumber,
        code: 'IB-B.54B6E5CD'
      },
      {
        cause
      }
    )
    this.name = this.constructor.name
  }
}

export default async function (interaction) {
  if (!await authorizeServerAndReply(interaction)) return
  const targetUser = interaction.options.get('user').user
  try {
    const newNickname = await getAutoNickname(targetUser)
    return interaction.guild.members.fetch(targetUser.id)
      .then((member) => {
        return member.setNickname(newNickname, `Nickname reset requested by user ${interaction.user.id}.`)
      })
      .then(
        () => {
          return interaction.reply({
            content: `Nickname of user <@${targetUser.id}> reset to ${newNickname}.`,
            allowedMentions: {
              parse: []
            },
            ephemeral: true
          })
        },
        () => {
          return new ResetNicknameError(targetUser.id).replyWithEmbed(interaction)
        })
  } catch (err) {
    if (err instanceof EmbeddableError) {
      return err.replyWithEmbed(interaction)
    }
  }
}

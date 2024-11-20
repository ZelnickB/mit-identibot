import { getUserInfo, UnlinkedUserError } from '../../common/whois/retrievers.js'
import { authorizeServerAndReply, checkUserVerificationAndReply } from '../../authorization.js'
import { whoisResult } from '../../common/whois/embedBuilders.js'

export default async function (interaction) {
  if (!(await authorizeServerAndReply(interaction) && await checkUserVerificationAndReply(interaction))) return
  try {
    const embed = await whoisResult(interaction.options.get('user').user.id, await getUserInfo(interaction.options.get('user').user))
    interaction.reply({
      embeds: [embed],
      allowedMentions: {
        parse: []
      },
      ephemeral: interaction.options.get('onlyme') !== null && interaction.options.get('onlyme').value
    })
  } catch (e) {
    if (e instanceof UnlinkedUserError) {
      return interaction.reply({
        content: `**Error:** <@${interaction.options.get('user').user.id}> is not linked to a Kerberos identity.`,
        ephemeral: true,
        allowedMentions: {
          parse: []
        }
      })
    }
    interaction.reply({
      content: '**Error:** IdentiBot encountered a problem while fetching the information for this user.',
      ephemeral: true
    })
  }
}

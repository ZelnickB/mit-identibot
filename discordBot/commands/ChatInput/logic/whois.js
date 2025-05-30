import { authorizeServerAndReply, checkUserVerificationAndReply } from '../../authorization.js'
import { respond } from '../../common/whois.js'

export default async function (interaction) {
  if (!(await authorizeServerAndReply(interaction) && await checkUserVerificationAndReply(interaction))) return
  await interaction.deferReply({
    ephemeral: interaction.options.get('onlyme') !== null && interaction.options.get('onlyme').value
  })
  await respond(interaction)
}

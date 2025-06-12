import * as webDirectory from '../../../../lib/publicAPIs/webDirectory.js'
import { directoryResult, directoryResultList } from '../../../embedBuilders.js'
import { EmbeddableError } from '../../../../lib/errorBases.js'

export default async function (interaction) {
  interaction.deferReply()
  try {
    const result = (await webDirectory.detailSearch(interaction.options.get('query').value))[0]
    interaction.editReply({
      embeds: [await directoryResult(result)]
    })
  } catch (e) {
    if (e instanceof webDirectory.MultipleDirectoryResultsError) {
      return interaction.editReply({
        embeds: [await directoryResultList(e.results, interaction.options.get('query').value)]
      })
    }
    if (e instanceof EmbeddableError) {
      return e.editReplyWithEmbed(interaction)
    }
  }
}

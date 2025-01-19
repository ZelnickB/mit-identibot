import * as webDirectory from '../../../../lib/publicAPIs/webDirectory.js'
import { directoryResult, directoryResultList } from '../../../embedBuilders.js'

export default async function (interaction) {
  try {
    const result = (await webDirectory.detailSearch(interaction.options.get('query').value))[0]
    interaction.reply({
      embeds: [await directoryResult(result)]
    })
  } catch (e) {
    if (e instanceof webDirectory.NoDirectoryResultsError) {
      interaction.reply({
        content: `**Error:** The specified query, \`${interaction.options.get('query').value}\`, returned no directory results.`,
        ephemeral: true
      })
    }
    if (e instanceof webDirectory.MultipleDirectoryResultsError) {
      interaction.reply({
        embeds: [await directoryResultList(e.results, interaction.options.get('query').value)],
        ephemeral: true
      })
    }
  }
}

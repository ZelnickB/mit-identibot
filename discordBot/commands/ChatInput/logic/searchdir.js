import { detailSearch, NoDirectoryResultsError } from '../../common/directory/retrievers.js'
import { directoryResult } from '../../common/directory/embedBuilders.js'

export default async function (interaction) {
  try {
    const result = await detailSearch(interaction.options.get('query').value)
    interaction.reply({
      embeds: [await directoryResult(result)]
    })
  } catch (e) {
    if (e instanceof NoDirectoryResultsError) {
      interaction.reply({
        content: `**Error:** The specified query, \`${interaction.options.get('query').value}\`, returned no directory results.`,
        ephemeral: true
      })
    }
  }
}

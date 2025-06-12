import { buildingQuery } from '../../../../lib/publicAPIs/whereis.js'
import { buildingInfo } from '../../../embedBuilders.js'
import { EmbeddableError } from '../../../../lib/errorBases.js'

export default async function (interaction) {
  const query = interaction.options.get('query').value
  try {
    const queryResult = await buildingQuery(query, true)
    if (queryResult.length === 1) {
      interaction.reply({
        embeds: [buildingInfo(queryResult[0])]
      })
    } else {
      let resultListString = ''
      for (const i of queryResult) {
        if (resultListString !== '') resultListString += '\n'
        if ('name' in i) {
          resultListString += `* ${i.name}${'bldgnum' in i ? ' — `' + i.bldgnum + '`' : ''}`
        } else resultListString += `* ${i.bldgnum}`
      }
      interaction.reply({
        content: `Multiple results were found for the query \`${query}\`. To get detailed information, use a more specific query.\n${resultListString}`,
        ephemeral: true
      })
    }
  } catch (e) {
    if (e instanceof EmbeddableError) {
      e.replyWithEmbed(interaction)
    }
  }
}

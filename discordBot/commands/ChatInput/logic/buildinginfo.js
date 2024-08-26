import { buildingInfo } from '../../common/buildings/embedBuilders.js'
import { buildingQuery } from '../../common/buildings/retrievers.js'
import { BadGatewayError } from '../../../lib/errors.js'

export default async function (interaction) {
  const query = interaction.options.get('query').value
  try {
    const queryResult = await buildingQuery(query)
    if (queryResult.length === 0) {
      interaction.reply({
        content: `**Error:** The specified query, \`${query}\`, returned no building results.`,
        ephemeral: true
      })
    } else if (queryResult.length === 1) {
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
    if (e instanceof BadGatewayError) {
      interaction.reply({
        content: '**Error:** The upstream server encountered an internal error when performing the requested search.',
        ephemeral: true
      })
    }
  }
}

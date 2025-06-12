import * as courses from '../../../../lib/publicAPIs/courses.js'
import { courseInfo, departmentInfo } from '../../../embedBuilders.js'
import { EmbeddableError } from '../../../../lib/errorBases.js'
import { UnknownPrefixError } from '../../../../lib/publicAPIs/courses.js'

export default async function (interaction) {
  const idQuery = interaction.options.get('id').value
  if (idQuery.includes('.')) {
    try {
      const courseInformation = await courses.courseInformation(idQuery)
      interaction.reply({
        embeds: [courseInfo(courseInformation)]
      })
    } catch (e) {
      if (e instanceof EmbeddableError) {
        e.replyWithEmbed(interaction)
      }
    }
  } else {
    if (idQuery in courses.departmentInformation) {
      return interaction.reply({
        embeds: [departmentInfo(idQuery, courses.departmentInformation[idQuery])]
      })
    } else {
      return UnknownPrefixError(idQuery).replyWithEmbed(interaction)
    }
  }
}

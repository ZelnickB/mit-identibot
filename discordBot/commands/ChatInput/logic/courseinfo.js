import * as courses from '../../../../lib/publicAPIs/courses.js'
import { courseInfo, departmentInfo } from '../../../embedBuilders.js'

export default async function (interaction) {
  const idQuery = interaction.options.get('id').value
  if (idQuery.includes('.')) {
    try {
      const courseInformation = await courses.courseInformation(idQuery)
      interaction.reply({
        embeds: [courseInfo(courseInformation)]
      })
    } catch (e) {
      if (e instanceof courses.CourseNotFoundError) {
        interaction.reply({
          content: `**Error:** The specified course ID, \`${idQuery}\`, was not found in the course catalog.`,
          ephemeral: true
        })
      }
    }
  } else {
    if (idQuery in courses.departmentInformation) {
      interaction.reply({
        embeds: [departmentInfo(idQuery, courses.departmentInformation[idQuery])]
      })
    } else {
      interaction.reply({
        content: `**Error:** The specified prefix, \`${idQuery}\`, is not known.`,
        ephemeral: true
      })
    }
  }
}

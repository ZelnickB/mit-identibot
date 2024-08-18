import { courseInformation as courseInformationEmbed, departmentInformation as departmentInformationEmbed } from '../../common/courses/embedBuilders.js'
import { courseInformation as getCourseInformation, departmentInformation, CourseNotFoundError } from '../../common/courses/retrievers.js'

export default async function (interaction) {
  const idQuery = interaction.options.get('id').value
  if (idQuery.includes('.')) {
    try {
      const courseInformation = await getCourseInformation(idQuery)
      interaction.reply({
        embeds: [courseInformationEmbed(courseInformation)]
      })
    } catch (e) {
      if (e instanceof CourseNotFoundError) {
        interaction.reply({
          content: `**Error:** The specified course ID, \`${idQuery}\`, was not found in the course catalog.`,
          ephemeral: true
        })
      }
    }
  } else {
    if (idQuery in departmentInformation) {
      interaction.reply({
        embeds: [departmentInformationEmbed(idQuery, departmentInformation[idQuery])]
      })
    } else {
      interaction.reply({
        content: `**Error:** The specified prefix, \`${idQuery}\`, is not known.`,
        ephemeral: true
      })
    }
  }
}

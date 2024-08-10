import { courseInformation as courseInformationEmbed } from '../../common/courses/embedBuilders.js'
import { courseInformation as getCourseInformation, CourseNotFoundError } from '../../common/courses/retrievers.js'

export default async function (interaction) {
  try {
    const courseInformation = await getCourseInformation(interaction.options.get('id').value)
    interaction.reply({
      embeds: [courseInformationEmbed(courseInformation)]
    })
  } catch (e) {
    if (e instanceof CourseNotFoundError) {
      interaction.reply({
        content: `**Error:** The specified course ID, \`${interaction.options.get('id').value}\`, was not found in the course catalog.`,
        ephemeral: true
      })
    }
  }
}

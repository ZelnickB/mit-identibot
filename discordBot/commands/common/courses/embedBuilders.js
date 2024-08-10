import { EmbedBuilder } from 'discord.js'
import { config as configReader } from '../../../../lib/preferencesReader.js'
import { boolToYesNo } from '../../../../lib/utils.js'

const config = await configReader()

export function courseInformation (information) {
  const offeredTimes = []
  if (information.offered_fall) {
    offeredTimes.push('Fall')
  }
  if (information.offered_iap) {
    offeredTimes.push('IAP')
  }
  if (information.offered_spring) {
    offeredTimes.push('Spring')
  }
  if (information.offered_summer) {
    offeredTimes.push('Summer')
  }
  const embedBuilder = new EmbedBuilder()
    .setColor(0x750014)
    .setTitle(
      (
        'level' in information
          ? (information.level === 'U'
              ? `<:undergraduate:${config.emoji.undergraduate}> `
              : `<:graduate:${config.emoji.graduate}> `)
          : ''
      ) +
      (
        'communication_requirement' in information
          ? (information.communication_requirement === 'CI-H'
              ? `<:ci_h:${config.emoji.ci_h}> `
              : `<:ci_hw:${config.emoji.ci_hw}> `)
          : ''
      ) +
      `${information.subject_id}: ${information.title}`)
    .setDescription(information.description)
    .addFields([
      {
        name: 'Offered',
        value: offeredTimes.join(', '),
        inline: true
      },
      {
        name: 'Instructors',
        value: 'instructors' in information ? information.instructors.join('\n') : '*Instructors not listed.*',
        inline: true
      },
      {
        name: 'Average Class Size',
        value: information.enrollment_number.toString(),
        inline: true
      },
      {
        name: 'Hours',
        value: `* **In Class:** ${information.in_class_hours}\n* **Out of Class:** ${information.out_of_class_hours}`,
        inline: true
      },
      {
        name: 'Units',
        value: `${information.is_variable_units ? '*This course counts for variable units.*\n' : ''}* **Lecture:** ${information.lecture_units}\n* **Lab:** ${information.lab_units}\n* **Design:** ${information.design_units}\n* **Preparation:** ${information.preparation_units}\n* **Total:** ${information.total_units}`,
        inline: true
      },
      {
        name: 'Has final?',
        value: boolToYesNo(information.has_final),
        inline: true
      }
    ])
  if ('url' in information) {
    embedBuilder.setURL(information.url)
  }
  return embedBuilder
}

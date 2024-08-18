import { EmbedBuilder } from 'discord.js'
import { config as configReader } from '../../../../lib/preferencesReader.js'
import { boolToYesNo } from '../../../../lib/utils.js'

const config = await configReader()

export function departmentInformation (prefix, information) {
  const embedBuilder = new EmbedBuilder()
    .setTitle(
      (
        'emojiName' in information
          ? `<:${information.emojiName}:${config.emoji[information.emojiName]}> `
          : ''
      ) + information.name
    )
    .setColor(0x808080)
    .setURL(`https://catalog.mit.edu/subjects/${prefix.toString().toLowerCase()}/`)
    .addFields([
      {
        name: 'Course Prefix',
        value: prefix,
        inline: true
      }
    ])
  if ('abbreviation' in information && information.abbreviation !== prefix) {
    embedBuilder.addFields([{
      name: 'Abbreviation',
      value: information.abbreviation,
      inline: true
    }])
  }
  if ('website' in information) {
    embedBuilder.addFields([{
      name: 'Website',
      value: `[${URL.parse(information.website).host}](${information.website})`,
      inline: true
    }])
  }
  return embedBuilder
}

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
  if ('level' in information) {
    if (information.level === 'U') embedBuilder.setColor(0x0080FF)
    else embedBuilder.setColor(0x008040)
  } else {
    embedBuilder.setColor(0xFFFFFF)
  }
  return embedBuilder
}

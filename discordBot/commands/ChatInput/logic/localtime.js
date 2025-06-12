import { DateTime } from 'luxon'
import { EmbeddableError } from '../../../../lib/errorBases.js'

export class InvalidTimeZoneError extends EmbeddableError {
  constructor (timeZone, { referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: `Time zone "${timeZone} is invalid.`,
        embedMessage: `**The specified time zone, \`${timeZone}\`, is invalid.** Time zones must be specified in UTC offset format (e.g., \`UTC-05:00\`) or in [IANA/tz database format](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) (e.g., \`America/New_York\`).`,
        summaryMessage: 'Invalid time zone',
        referenceNumber,
        code: 'IB-U.6A5C748D'
      },
      {
        cause
      }
    )
    this.name = this.constructor.name
  }
}

export default async function (interaction) {
  const timeZoneUnspecified = interaction.options.get('timezone') === null
  const timeZone = timeZoneUnspecified ? 'America/New_York' : interaction.options.get('timezone').value
  const time = DateTime.now().setZone(timeZone)
  let formattedTime = time.toLocaleString(DateTime.DATETIME_MED)
  if (time.isValid) {
    formattedTime = `**The local time ${
      timeZoneUnspecified
        ? 'at MIT (' + time.offsetNameShort + ')'
        : 'in `' + timeZone + '`'
    } is:** ${formattedTime}\n` +
      `-# **Corresponding time in your current time zone:** <t:${time.toUnixInteger()}:f>\n` +
      `-# **Created:** <t:${time.toUnixInteger()}:R>`
    return interaction.reply({
      content: formattedTime,
      ephemeral: interaction.guild !== null
    })
  } else {
    return new InvalidTimeZoneError(timeZone).replyWithEmbed(interaction)
  }
}

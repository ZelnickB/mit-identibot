import { DateTime } from 'luxon'

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
    interaction.reply({
      content: formattedTime,
      ephemeral: interaction.guild !== null
    })
  } else {
    interaction.reply({
      content: `**Error:** The specified time zone, \`${timeZone}\`, is not valid.`,
      ephemeral: true
    })
  }
}

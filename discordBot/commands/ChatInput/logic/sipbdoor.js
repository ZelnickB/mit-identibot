import { EmbedBuilder } from 'discord.js'
import { DateTime } from 'luxon'

export default async function (interaction) {
  const sipbDoorResponseText = await fetch('https://sipb-door.mit.edu/text').then(res => res.text())
  const sipbDoorResponse = Object(sipbDoorResponseText.match(/(?<status>Open|Closed) since (?<fullTimestamp>(?<year>[0-9]{4})-(?<month>[0-9]{2})-(?<day>[0-9]{2}) (?<hour>[0-9]{2}):(?<minute>[0-9]{2}):(?<second>[0-9]{2}))/).groups)
  const currentTime = DateTime.now()
  const lastChanged = DateTime.fromObject({
    year: sipbDoorResponse.year,
    month: sipbDoorResponse.month,
    day: sipbDoorResponse.day,
    hour: sipbDoorResponse.hour,
    minute: sipbDoorResponse.minute,
    second: sipbDoorResponse.second
  }, { zone: 'America/New_York' })
  sipbDoorResponse.open = sipbDoorResponse.status === 'Open'
  const embed = new EmbedBuilder()
    .setTitle('SIPB Door Status')
    .setFields([
      {
        name: 'Status',
        value: (sipbDoorResponse.open ? ':unlock:' : ':lock:') + ' ' + sipbDoorResponse.status,
        inline: true
      },
      {
        name: 'Most recent activity',
        value: `Door was **${sipbDoorResponse.open ? 'opened' : 'closed'}** at <t:${lastChanged.toUnixInteger()}:f> (<t:${lastChanged.toUnixInteger()}:R>)`,
        inline: true
      },
      {
        name: 'Updated at',
        value: `<t:${currentTime.toUnixInteger()}:f> (<t:${currentTime.toUnixInteger()}:R>)`
      }
    ])
    .setFooter({
      text: 'The Student Information Processing Board (SIPB) office is located in W20-557, on the fifth floor of the Stratton Student Center (W20).'
    })
    .setURL('https://sipb-door.mit.edu/')
    .setColor(
      sipbDoorResponse.open ? 0x57F287 : 0xED4245
    )
  interaction.reply({
    embeds: [embed]
  })
}

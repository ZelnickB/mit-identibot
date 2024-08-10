import { gateway } from '../../../../lib/discordAPIClients.js'

export default async function (interaction) {
  const footnotes = []
  let latencyEstimate = Date.now() - interaction.createdTimestamp
  if (latencyEstimate < 0) {
    latencyEstimate = latencyEstimate.toString() + 'ms\\*'
    footnotes.push('-# \\* A negative latency estimate indicates that the IdentiBot server clock is behind that of the Discord server.')
  } else {
    latencyEstimate = latencyEstimate.toString() + 'ms'
  }
  let content = `IdentiBot is **online**!\n**Estimated Latency:** ${latencyEstimate}\n**Gateway Ping:** ${gateway.ws.ping}ms`
  if (footnotes.length > 0) {
    content += '\n'
    content += footnotes.join('\n')
  }
  interaction.reply({
    content,
    ephemeral: true
  })
}

import { isServerConfigured } from '../../lib/configurationReaders.js'
import { assignRolesToGuildMember } from '../../lib/guildUserModifier.js'

export default async function handler (member) {
  if (await isServerConfigured(member.guild.id)) {
    return assignRolesToGuildMember(member)
  }
}

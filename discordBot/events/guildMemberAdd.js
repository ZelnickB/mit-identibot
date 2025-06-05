import { isServerConfigured } from '../../lib/configurationReaders.js'
import { assignRolesToGuildMember } from '../../lib/guildUserModifier.js'
import { UnlinkedUserError } from '../../lib/userLinks.js'

export default async function handler (member) {
  if (await isServerConfigured(member.guild.id)) {
    try {
      return await assignRolesToGuildMember(member)
    } catch (e) {
      if (!(e instanceof UnlinkedUserError)) throw e
    }
  }
}

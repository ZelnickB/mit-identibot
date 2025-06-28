import * as configReaders from '../../lib/configurationReaders.js'
import { assignRolesToGuildMember } from '../../lib/guildUserModifier.js'
import { getAutoNickname, UnlinkedUserError } from '../../lib/userLinks.js'

export default async function handler (member) {
  if (await configReaders.isServerConfigured(member.guild.id)) {
    try {
      return await Promise.all([
        assignRolesToGuildMember(member),
        configReaders.getServerConfigDocument(member.guild.id)
          .then(async (serverConfig) => {
            if (serverConfig.verification.autochangeNickname) return member.setNickname(await getAutoNickname(member), 'Updated user nickname based on linked account (per server configuration).')
          })
      ])
    } catch (e) {
      if (!(e instanceof UnlinkedUserError)) throw e
    }
  }
}

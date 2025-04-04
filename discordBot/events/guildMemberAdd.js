import { parseNickname } from '../../lib/utils.js'
import { isServerConfigured, getServerConfigDocument } from '../../lib/configurationReaders.js'
import { getUserInfo } from '../../lib/userLinks.js'

export default async function handler (member) {
  let serverConfig
  if (isServerConfigured(member.guild.id)) {
    serverConfig = await getServerConfigDocument(member.guild.id)
  } else return
  return getUserInfo(member, false).then(
    (userInfo) => {
      if (!userInfo.userInfo) return
      const tasks = []
      if (serverConfig.verification.allowedAffiliations.includes(userInfo.userInfo.affiliations[0].type)) {
        tasks.push(
          member.roles.add(
            serverConfig.verification.verifiedRole,
            `User verified to control Kerberos identity ${userInfo.userInfo.kerberosId}.`
          )
        )
      }
      if (serverConfig.verification.autochangeNickname === true) {
        tasks.push(
          member.setNickname(
            parseNickname(userInfo.userInfo.givenName, userInfo.userInfo.familyName),
            `Automatically updated nickname to reflect name on record for user's verified Kerberos identity: ${userInfo.userInfo.displayName}`
          )
        )
      }
      return Promise.allSettled(tasks)
    },
    () => {}
  )
}

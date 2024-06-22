import { dbClient } from '../../lib/mongoClient.js'
import { configDb } from '../../lib/preferencesReader.js'
import { parseNickname } from '../../lib/utils.js'

export default async function handler (member) {
  let serverConfig = await configDb.getDocumentByName('servers')
  if (member.guild.id in serverConfig) {
    serverConfig = serverConfig[member.guild]
  } else return
  return dbClient.collection('verification.userInfo').findOne({
    'discord.id': member.id
  }).then((doc) => {
    if (doc === null) return
    const tasks = []
    if (serverConfig.verification.allowedAffiliations.includes(doc.petrock.affiliation)) {
      tasks.push(
        member.roles.add(
          serverConfig.verification.verifiedRole,
            `User verified to control Kerberos identity ${doc.petrock.email}.`
        )
      )
    }
    if (serverConfig.verification.autochangeNickname === true) {
      tasks.push(
        member.setNickname(
          parseNickname(doc.petrock.given_name, doc.petrock.family_name),
            `Automatically updated nickname to reflect name on record for user's verified Kerberos identity: ${doc.petrock.name}`
        )
      )
    }
    return Promise.allSettled(tasks)
  })
}

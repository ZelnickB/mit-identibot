import * as crypto from 'crypto'
import * as timersPromises from 'timers/promises'
import { DiscordAPIError } from 'discord.js'
import * as configReaders from './configurationReaders.js'
import * as peopleAPI from './mitDeveloperConnection/people.js'
import { gateway } from './discordAPIClients.js'
import { getKerberos } from './userLinks.js'
import { UserNotFoundError } from './mitDeveloperConnection/people.js'

export async function getInformationForAssignment (accountSnowflake) {
  const kerberos = await getKerberos({ id: accountSnowflake })
  try {
    const userInfo = await peopleAPI.getByKerberos(kerberos)
    const affiliation = peopleAPI.getAffiliationFromUserInfo(userInfo)
    const studentYear = peopleAPI.getStudentYearFromUserInfo(userInfo)
    return {
      kerberos,
      affiliation,
      studentYear
    }
  } catch (e) {
    if (e instanceof UserNotFoundError) return { kerberos, affiliation: undefined, studentYear: undefined }
    throw e
  }
}

export async function assignRolesFromIDs (serverSnowflake, accountSnowflake, info = undefined) {
  const guild = await gateway.guilds.fetch(serverSnowflake)
  return guild.members.fetch(accountSnowflake).then(
    async (member) => {
      info = info || await getInformationForAssignment(accountSnowflake)
      return assignRolesToGuildMember(member, info)
    },
    (err) => {
      if (!(err instanceof DiscordAPIError && err.code === 10007)) throw err
    }
  )
}

export async function assignRolesToGuildMember (guildMember, info = undefined) {
  const verificationRoleConfig = (await configReaders.getServerConfigDocument(guildMember.guild.id)).verification.roleConfig
  info = info || await getInformationForAssignment(guildMember.user.id)
  let rolesToAssign = []
  rolesToAssign.push(verificationRoleConfig.anyAffiliation)
  rolesToAssign.push(verificationRoleConfig.affiliations[info.affiliation])
  rolesToAssign.push(verificationRoleConfig.studentYears[info.studentYear])
  rolesToAssign = rolesToAssign.filter(i => i !== undefined)
  return guildMember.roles.add(rolesToAssign)
}

export async function assignRolesToUserInAllServers (
  accountSnowflake,
  info = undefined,
  {
    bufferRequests = true
  } = {}
) {
  let configuredServers
  [configuredServers, info] = await Promise.all([
    configReaders.getConfiguredServersList(),
    info || getInformationForAssignment(accountSnowflake)
  ])
  const roleAssignmentTasks = []
  let delay = 0
  const delayIncrement = 500
  if (bufferRequests) {
    delay = crypto.randomInt(delayIncrement + 1)
  }
  for (const serverID of configuredServers) {
    roleAssignmentTasks.push(timersPromises.setTimeout(delay).then(() => {
      assignRolesFromIDs(serverID, accountSnowflake, info)
    }))
    if (bufferRequests) {
      delay += delayIncrement
    }
  }
  return Promise.allSettled(roleAssignmentTasks)
}

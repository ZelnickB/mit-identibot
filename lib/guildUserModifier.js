import * as crypto from 'crypto'
import * as timersPromises from 'timers/promises'
import { DiscordAPIError } from 'discord.js'
import * as configReaders from './configurationReaders.js'
import { gateway } from './discordAPIClients.js'
import { getAutoNickname, getIdentifiers, getUserInfoFromIdentifiers } from './userLinks.js'
import { getAffiliationFromUserInfo, getStudentYearFromUserInfo } from './mitDeveloperConnection/people.js'

export async function getInformationForAssignment (accountSnowflake) {
  const userIdentifiers = await getIdentifiers({ id: accountSnowflake })
  const information = {
    kerberos: userIdentifiers.kerberos,
    affiliation: undefined,
    studentYear: undefined,
    admittedStudentClassYear: undefined
  }
  const userInfo = await getUserInfoFromIdentifiers(userIdentifiers)
  if ('kerberos' in userInfo && !(userInfo.kerberos instanceof Error)) {
    information.affiliation = getAffiliationFromUserInfo(userInfo.kerberos)
    information.studentYear = getStudentYearFromUserInfo(userInfo.kerberos)
  }
  if ('admitted' in userInfo && !(userInfo.admitted instanceof Error)) {
    information.admittedStudentClassYear = userInfo.admitted.years.gapYearClassYear || userInfo.admitted.years.originalClassYear
  }
  return information
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
  if (info.affiliation) rolesToAssign.push(verificationRoleConfig.anyAffiliation) // Do not assign the anyAffiliation role to admitted students
  rolesToAssign.push(verificationRoleConfig.affiliations[info.affiliation])
  rolesToAssign.push(verificationRoleConfig.admittedStudentClassYears[info.admittedStudentClassYear])
  rolesToAssign.push(verificationRoleConfig.studentYears[info.studentYear])
  rolesToAssign = rolesToAssign.filter(i => i !== undefined)
  return guildMember.roles.add(rolesToAssign)
}

export async function assignRolesToUserInAllServers (
  accountSnowflake,
  info = undefined,
  {
    bufferRequests = true,
    updateNicknames = true
  } = {}
) {
  let configuredServers
  [configuredServers, info] = await Promise.all([
    configReaders.getConfiguredServersList(),
    info || getInformationForAssignment(accountSnowflake)
  ])
  const userUpdateTasks = []
  let newNickname
  if (updateNicknames) newNickname = await getAutoNickname({ id: accountSnowflake })
  let delay = 0
  const delayIncrement = 500
  if (bufferRequests) {
    delay = crypto.randomInt(delayIncrement)
  }
  for (const serverID of configuredServers) {
    userUpdateTasks.push(
      timersPromises.setTimeout(delay).then(() => {
        return assignRolesFromIDs(serverID, accountSnowflake, info)
      })
        .catch((err) => {
          if (!(err instanceof DiscordAPIError && err.code === 10004)) throw err
        }) // Do not crash if a server has removed the bot without the database being updated.
    )
    if (updateNicknames && (await configReaders.getServerConfigDocument(serverID)).verification.autochangeNickname) {
      if (bufferRequests) delay += delayIncrement
      userUpdateTasks.push(
        timersPromises.setTimeout(delay)
          .then(() => {
            return gateway.guilds.fetch(serverID)
          })
          .then((guild) => {
            return guild.members.fetch(accountSnowflake)
          })
          .then(
            (member) => {
              return member.setNickname(newNickname, 'Updated user nickname based on linked account (per server configuration).')
            },
            (err) => {
              if (!(err instanceof DiscordAPIError && err.code === 10007)) throw err
            }
          )
          .catch((err) => {
            if (!(err instanceof DiscordAPIError && err.code === 10004)) throw err
          }) // Do not crash if a server has removed the bot without the database being updated.
      )
    }
    if (bufferRequests) {
      delay += delayIncrement
    }
  }
  return Promise.allSettled(userUpdateTasks)
}

import { dbClient } from '../../../lib/mongoClient.js'
import { gateway } from '../../../lib/discordAPIClients.js'
import { getConfiguredServersList, getServerConfigDocument } from '../../../lib/configurationReaders.js'
import { botHeaders, parseNickname } from '../../../lib/utils.js'

const verificationSessions = dbClient.collection('verification.sessions')
const verificationUserInfoCollection = dbClient.collection('verification.userInfo')

export function get (req, res) {
  verificationSessions.findOne({ sessionID: req.cookies['verification.sessionID'] })
    .then(async (sessionInformation) => {
      // STEP 1: Check if the provided Kerberos identity has already been used to verify a different Discord account.
      const returnVal = {
        sessionInformation,
        ok: true
      }
      const matchingKerberosDocument = await verificationUserInfoCollection.findOne({
        'petrock.sub': sessionInformation.petrockUser.sub
      })
      if (matchingKerberosDocument !== null && matchingKerberosDocument.discord.id !== sessionInformation.discordUser.id) {
        res.status(401).render('error', {
          code: '401',
          description: 'Unauthorized',
          explanation: 'This Kerberos identity has already been used to verify a Discord account.'
        })
        returnVal.ok = false
      }
      return returnVal
    })
    .then(async (x) => {
      // STEP 2: Add linked Kerberos identity information to the database.
      if (!x.ok) {
        return x
      }
      await verificationUserInfoCollection.updateOne(
        {
          $or: [
            { 'petrock.sub': x.sessionInformation.petrockUser.sub },
            { 'discord.id': x.sessionInformation.discordUser.id }
          ]
        },
        {
          $set: {
            petrock: x.sessionInformation.petrockUser,
            discord: x.sessionInformation.discordUser
          }
        },
        {
          upsert: true
        }
      )
      return x
    })
    .then(async (x) => {
      // STEP 3: Get list of registered servers and their configurations.
      if (!x.ok) {
        return x
      }
      const serverList = []
      for (const serverID of await getConfiguredServersList()) {
        serverList.push(Promise.allSettled([getServerConfigDocument(serverID), gateway.guilds.fetch(serverID)]))
      }
      return {
        ...x,
        serverList: await Promise.all(serverList)
      }
    })
    .then(async (x) => {
      // STEP 4: Add roles and update nicknames in servers where the user is a member.
      if (!x.ok) {
        return x
      }
      const tasks = []
      for (const [config, guild] of x.serverList) {
        if (guild.status === 'rejected') continue
        if (config.value.verification.allowedAffiliations.includes(x.sessionInformation.petrockUser.affiliation)) {
          tasks.push(
            guild.value.members.fetch(x.sessionInformation.discordUser.id).then((member) => {
              return member.roles.add(
                config.value.verification.verifiedRole,
                `User verified to control Kerberos identity ${x.sessionInformation.petrockUser.email}.`
              )
            })
          )
          if (config.value.verification.autochangeNickname === true) {
            tasks.push(
              guild.value.members.fetch(x.sessionInformation.discordUser.id).then((member) => {
                return member.setNickname(
                  parseNickname(x.sessionInformation.petrockUser.given_name, x.sessionInformation.petrockUser.family_name),
                  `Automatically updated nickname to reflect name on record for user's verified Kerberos identity: ${x.sessionInformation.petrockUser.name}`
                )
              })
            )
          }
        }
      }
      return {
        ...x,
        tasks: await Promise.allSettled(tasks)
      }
    })
    .then(async (x) => {
      // STEP 5: Clear session from database and cookies and redirect to success page.
      if (!x.ok) {
        return x
      }
      // BEGIN CLASS OF 2028 SERVER-SPECIFIC CODE
      fetch(`https://tlepeopledir.mit.edu/q/${x.sessionInformation.petrockUser.sub}`).then((x) => x.json()).then(directoryResponse => {
        if (directoryResponse.result[0] !== undefined && directoryResponse.result[0].student_year === '1') {
          fetch(
            `https://discord.com/api/v10/guilds/1186456227425828926/members/${x.sessionInformation.discordUser.id}/roles/1186460225943912539`,
            {
              method: 'PUT',
              headers: {
                ...botHeaders,
                'X-Audit-Log-Reason': 'User verified as year 1 student in MIT directory.'
              }
            }
          )
        } else if (directoryResponse.result[0] !== undefined) {
          fetch(
            `https://discord.com/api/v10/guilds/1186456227425828926/members/${x.sessionInformation.discordUser.id}/roles/1218369208409395301`,
            {
              method: 'PUT',
              headers: {
                ...botHeaders,
                'X-Audit-Log-Reason': `User verified as student in MIT directory, currently in year ${directoryResponse.result[0].student_year}.`
              }
            }
          )
        }
      })
      // END CLASS OF 2028 SERVER-SPECIFIC CODE
      await verificationSessions.deleteOne({ sessionID: req.cookies['verification.sessionID'] })
      res.clearCookie('verification.sessionID')
      return res.redirect(302, '/verification/confirmed')
    })
}

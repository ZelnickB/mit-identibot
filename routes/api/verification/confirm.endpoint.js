import { TokenSet } from 'openid-client'
import { discord, petrock } from '../../../lib/oauthClients.js'
import { dbClient } from '../../../lib/mongoClient.js'
import { decrypt } from '../../../lib/simpleCrypto.js'
import { configDb } from '../../../lib/preferencesReader.js'
import { botHeaders, parseNickname } from '../../../lib/utils.js'
import { gateway } from '../../../lib/discordAPIClients.js'

const verificationUserInfoCollection = dbClient.collection('verification.userInfo')
const oauthTokenCollections = {
  petrock: dbClient.collection('verification.oauthTokens.petrock'),
  discord: dbClient.collection('verification.oauthTokens.discord')
}

export function get (req, res) {
  let petrockTokenSetJSON, discordTokenSetJSON
  try {
    petrockTokenSetJSON = JSON.parse(
      decrypt(Buffer.from(req.cookies['oauthTokens.petrock'], 'base64url'))
        .toString('utf8')
    )
    discordTokenSetJSON = JSON.parse(
      decrypt(Buffer.from(req.cookies['oauthTokens.discord'], 'base64url'))
        .toString('utf8')
    )
  } catch {
    return res.sendStatus(400)
  }
  Promise.all([
    petrock.userinfo(new TokenSet(petrockTokenSetJSON)),
    discord.requestResource('https://discord.com/api/v10/users/@me', new TokenSet(new TokenSet(discordTokenSetJSON)))
  ]).then(([petrockUserInfo, discordUserInfo]) => {
    discordUserInfo = JSON.parse(discordUserInfo.body.toString('utf8'))
    return Promise.all([
      Promise.resolve([petrockUserInfo, discordUserInfo]),
      verificationUserInfoCollection.findOne(
        {
          'petrock.sub': petrockUserInfo.sub
        }
      )
    ])
  }).then(([[petrockUserInfo, discordUserInfo], matchingKerberosDocument]) => {
    if (matchingKerberosDocument !== null && matchingKerberosDocument.discord.id !== discordUserInfo.id) {
      res.render('error', {
        code: '401',
        description: 'Unauthorized',
        explanation: 'This Kerberos identity has already been used to verify a Discord account.'
      })
      return Promise.resolve(false)
    }
    return Promise.all([
      Promise.resolve([petrockUserInfo, discordUserInfo]),
      oauthTokenCollections.petrock.updateOne(
        { _sub: petrockUserInfo.sub },
        {
          $set: {
            _sub: petrockUserInfo.sub,
            ...petrockTokenSetJSON
          }
        },
        {
          upsert: true
        }
      ),
      oauthTokenCollections.discord.updateOne(
        { _sub: discordUserInfo.id },
        {
          $set: {
            _sub: discordUserInfo.id,
            ...discordTokenSetJSON
          }
        },
        {
          upsert: true
        }
      )
    ])
  }).then((val) => {
    if (val === false) {
      return Promise.resolve(false)
    }
    const [petrockUserInfo, discordUserInfo] = val[0]
    return Promise.all([
      Promise.resolve([petrockUserInfo, discordUserInfo]),
      verificationUserInfoCollection.updateOne(
        {
          $or: [
            { 'petrock.sub': petrockUserInfo.sub },
            { 'discord.id': discordUserInfo.id }
          ]
        },
        {
          $set: {
            petrock: petrockUserInfo,
            discord: discordUserInfo
          }
        },
        {
          upsert: true
        }
      )
    ])
  }).then((val) => {
    if (val === false) {
      return Promise.resolve(false)
    }
    return Promise.all([
      Promise.resolve(val[0]),
      configDb.getDocumentByName('servers')
    ])
  }).then((val) => {
    if (val === false) {
      return Promise.resolve(false)
    }
    const [petrockUserInfo, discordUserInfo] = val[0]
    const serversDynamicConfig = val[1]
    const promises = [Promise.resolve(val[0])]
    for (const serverID in serversDynamicConfig) {
      if (serverID.startsWith('_')) {
        continue
      }
      const serverConfig = serversDynamicConfig[serverID]
      promises.push(gateway.guilds.fetch(serverID).then((server) => {
        const innerPromises = []
        if (serverConfig.verification.allowedAffiliations.includes(petrockUserInfo.affiliation)) {
          innerPromises.push(
            server.members.fetch(discordUserInfo.id).then((member) => {
              return member.roles.add(
                serverConfig.verification.verifiedRole,
                `User verified to control Kerberos identity ${petrockUserInfo.email}.`
              )
            })
          )
          if (serverConfig.verification.autochangeNickname === true) {
            innerPromises.push(
              server.members.fetch(discordUserInfo.id).then((member) => {
                return member.setNickname(
                  parseNickname(petrockUserInfo.given_name, petrockUserInfo.family_name),
                  `Automatically updated nickname to reflect name on record for user's verified Kerberos identity: ${petrockUserInfo.name}`
                )
              })
            )
          }
          return Promise.allSettled(innerPromises)
        }
      }))
    }
    return Promise.allSettled(promises)
  }).then((val) => {
    const [petrockUserInfo, discordUserInfo] = val[0].value
    // BEGIN CLASS OF 2028 SERVER-SPECIFIC CODE
    fetch(`https://tlepeopledir.mit.edu/q/${petrockUserInfo.sub}`).then((x) => x.json()).then(directoryResponse => {
      if (directoryResponse.result[0] !== undefined && directoryResponse.result[0].student_year === undefined) {
        fetch(
          `https://discord.com/api/v10/guilds/1186456227425828926/members/${discordUserInfo.id}/roles/1186460225943912539`,
          {
            method: 'PUT',
            headers: {
              ...botHeaders,
              'X-Audit-Log-Reason': 'User verified as student in MIT directory without class year (implies that student is \'28er).'
            }
          }
        )
      } else if (directoryResponse.result[0] !== undefined) {
        fetch(
          `https://discord.com/api/v10/guilds/1186456227425828926/members/${discordUserInfo.id}/roles/1218369208409395301`,
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
    return res.redirect(302, '/verification/confirmed')
  })
}

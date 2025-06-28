import { dbClient } from './mongoClient.js'
import * as peopleAPI from './mitDeveloperConnection/people.js'
import { parseNickname } from './utils.js'
import { EmbeddableError } from './errorBases.js'

const verificationLinksCollection = dbClient.collection('verification.links')
const petrockUserInfoCacheCollection = dbClient.collection('cache.userInfo.petrock')
const admittedStudentsCollection = dbClient.collection('admittedStudents')

export class UnlinkedUserError extends EmbeddableError {
  constructor (userId, { referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: `Discord user ${userId} has not linked any accounts.`,
        embedMessage: `**The user <@${userId}> has not linked any accounts.** Ask the user to verify themself, and then try again.`,
        summaryMessage: 'Unlinked user',
        referenceNumber,
        code: 'IB-U.95C1B42B'
      },
      {
        cause
      }
    )
    this.name = this.constructor.name
  }
}

export class MissingLinkError extends EmbeddableError {
  constructor (userId, missingLinkType, showMissingLinkTypeInEmbed = true, { referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: `Discord user ${userId} has not linked the required account type (${missingLinkType}) for this action.`,
        embedMessage: `**The user <@${userId}> has not linked ${showMissingLinkTypeInEmbed ? `an account of type \`${missingLinkType}\`, which is required to perform this action.` : 'an account of the type required to perform this action.'}** Ask the user to verify themself using the proper account type, and then try again.`,
        summaryMessage: 'Missing user link',
        referenceNumber,
        code: 'IB-U.501FD0BB'
      },
      {
        cause
      }
    )
    this.name = this.constructor.name
  }
}

export async function getIdentifiers (user) {
  const linksDocument = await verificationLinksCollection.findOne({
    discordAccountId: user.id
  })
  if (linksDocument === null) throw new UnlinkedUserError(user.id)
  const identifierNames = []
  const promises = []
  if ('petrock' in linksDocument) {
    identifierNames.push('kerberos')
    promises.push(
      petrockUserInfoCacheCollection.findOne({
        sub: linksDocument.petrock.sub
      }).then((cachedUserInfo) => {
        return cachedUserInfo.email.replace(/@mit\.edu/gi, '')
      })
    )
  }
  if ('admitted' in linksDocument) {
    identifierNames.push('admitted')
    promises.push(linksDocument.admitted.uuid)
  }
  // Code to get other identifiers
  const identifiers = await Promise.all(promises)
  return Object.fromEntries(identifierNames.map((val, idx) => [val, identifiers[idx]]))
}

export async function getUserInfoFromIdentifiers (identifiers) {
  const identifierNames = []
  const promises = []
  for (const name in identifiers) {
    identifierNames.push(name)
    switch (name) {
      case 'kerberos':
        promises.push(peopleAPI.getByKerberos(identifiers.kerberos))
        break
      case 'admitted':
        promises.push(admittedStudentsCollection.findOne({ uuid: identifiers.admitted }))
      // Code to get user info based on other identifiers
    }
  }
  const userInfo = flattenPromiseSettledResult(await Promise.allSettled(promises))
  return Object.fromEntries(identifierNames.map((val, idx) => [val, userInfo[idx]]))
}

export function getPrioritizedUserInfo (userInfo) {
  // Fetches the information that IdentiBot should "prioritize" when performing operations against this user.
  // Order of priority: (1) Kerberos
  let infoObject
  if ('kerberos' in userInfo && !(userInfo.kerberos instanceof Error)) {
    infoObject = userInfo.kerberos
    infoObject.infoSource = 'kerberos'
  } else throw new peopleAPI.UserNotFoundError()
  return infoObject
}

export async function getUserInfo (user) {
  return getUserInfoFromIdentifiers(await getIdentifiers(user))
}

export async function getAutoNickname (user) {
  return getUserInfo(user).then((userInfo) => {
    if (userInfo.kerberos !== undefined && !(userInfo.kerberos instanceof Error)) {
      return parseNickname(userInfo.kerberos.givenName, userInfo.kerberos.familyName)
    }
    if (userInfo.admitted !== undefined && !(userInfo.admitted instanceof Error)) {
      return userInfo.admitted.preferredName
    }
  })
}

function flattenPromiseSettledResult (settledResult) {
  const resultArray = []
  for (const i of settledResult) {
    if (i.status === 'fulfilled') {
      resultArray.push(i.value)
    } else {
      resultArray.push(i.reason)
    }
  }
  return resultArray
}

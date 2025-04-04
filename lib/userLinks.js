import { dbClient } from './mongoClient.js'
import { getByKerberos } from './mitDeveloperConnection/people.js'
import { readUserConfig } from './configurationReaders.js'
import { get } from './mitDeveloperConnection/peoplePictures.js'
import { parseNickname } from './utils.js'

const verificationLinksCollection = dbClient.collection('verification.links')

export class UnlinkedUserError extends Error {
  constructor (userId) {
    super(`User ${userId} has not linked a Discord account.`)
    this.name = this.constructor.name
  }
}

export async function getKerberos (user) {
  return verificationLinksCollection.findOne(
    {
      discordId: user.id
    }
  ).then((doc) => {
    if (doc === null) {
      return Promise.reject(new UnlinkedUserError(user.id))
    } else {
      return doc.petrockEmail.replace(/@mit\.edu/gi, '')
    }
  })
}

export async function getUserInfo (user, withProfilePicture) {
  const kerberos = await getKerberos(user)
  if (withProfilePicture === undefined) {
    const userConfig = await readUserConfig(user.id)
    withProfilePicture = userConfig.allowIdPhotoLookup.moderator || userConfig.allowIdPhotoLookup.member
  }
  const promises = [getByKerberos(kerberos)]
  if (withProfilePicture) promises.push(get(kerberos))
  return Promise.all(promises).then(([userInfo, image]) => ({ userInfo, image }))
}

export async function getAutoNickname (user) {
  return getUserInfo(user, false).then(
    (userInfo) => {
      if (!userInfo) {
        return false
      }
      return parseNickname(userInfo.userInfo.givenName, userInfo.userInfo.familyName)
    },
    () => false)
}

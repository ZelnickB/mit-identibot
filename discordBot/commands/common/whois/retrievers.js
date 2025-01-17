import { dbClient } from '../../../../lib/mongoClient.js'
import { getByKerberos } from '../../../../lib/mitDeveloperConnection/people.js'
import { readUserConfig } from '../../../../lib/configurationReaders.js'
import { get } from '../../../../lib/mitDeveloperConnection/peoplePictures.js'

const verificationUserInfoCollection = dbClient.collection('verification.userInfo')

export class UnlinkedUserError extends Error {
  constructor (userId) {
    super(`User ${userId} has not linked a Discord account.`)
    this.name = this.constructor.name
  }
}

export async function getKerberos (user) {
  return verificationUserInfoCollection.findOne(
    {
      'discord.id': user.id
    }
  ).then((doc) => {
    if (doc === null) {
      return Promise.reject(new UnlinkedUserError(user.id))
    } else {
      return doc.petrock.email.replace(/@mit\.edu/gi, '')
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

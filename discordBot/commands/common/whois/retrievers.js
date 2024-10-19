import { dbClient } from '../../../../lib/mongoClient.js'
import { getByKerberos } from '../../../../lib/mitDeveloperConnection/people.js'

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
      throw UnlinkedUserError(user.id)
    } else {
      return doc.petrock.email
    }
  })
}

export async function getUserInfo (user) {
  return getByKerberos(await getKerberos(user.id))
}

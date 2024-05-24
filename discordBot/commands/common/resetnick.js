import { dbClient } from '../../../lib/mongoClient.js'
import { parseNickname } from '../../../lib/utils.js'

const verificationUserInfoCollection = dbClient.collection('verification.userInfo')

export async function getNewNickname (user) {
  return verificationUserInfoCollection.findOne(
    {
      'discord.id': user.id
    }
  ).then((doc) => {
    if (doc === null) {
      return false
    } else {
      return parseNickname(doc.petrock.given_name, doc.petrock.family_name)
    }
  })
}

import { dbClient } from '../../../lib/mongoClient.js'

const verificationUserInfoCollection = dbClient.collection('verification.userInfo')

export async function profileText (user) {
  return verificationUserInfoCollection.findOne(
    {
      'discord.id': user.id
    }
  ).then((doc) => {
    if (doc === null) {
      return '**Error:** The specified Discord user is not linked to a Kerberos account.'
    } else {
      return `<@${user.id}> is verified to control the Kerberos account with the following profile information:\n**${doc.petrock.name}**\n**Affiliation:** ${doc.petrock.affiliation}\n**Email:** \`${doc.petrock.email}\``
    }
  })
}

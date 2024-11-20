import { EmbedBuilder } from 'discord.js'
import { config as configReader } from '../../../../lib/preferencesReader.js'
import { dbClient } from '../../../../lib/mongoClient.js'

const config = await configReader()
const verificationUserInfoCollection = dbClient.collection('verification.userInfo')

export async function whoisResult (discordID, userInfo) {
  let affiliationColorCode
  let affiliationEmoji = ' '
  const embedBuilder = new EmbedBuilder()
    .setTitle('Verified User Information')
    .setDescription(`The Discord user <@${discordID}> has been identified as the following individual.`)
    .addFields(
      {
        name: 'Legal Name',
        value: `${userInfo.familyName}, ${userInfo.givenName}${userInfo.middleName ? ' ' + userInfo.middleName : ''}`,
        inline: true
      },
      {
        name: 'Display Name',
        value: userInfo.displayName,
        inline: true
      },
      {
        name: 'Email/Kerberos',
        value: `${userInfo.email.replaceAll('_', '\\_')} (\`${userInfo.kerberosId}\`)`
      }
    )
  if (userInfo.phoneNumber) {
    embedBuilder.addFields({
      name: 'Phone Number',
      value: userInfo.phoneNumber
    })
  }
  let positionTitle, officeLocation
  const departmentNames = []
  let affiliationType
  if (userInfo.affiliations.length > 0) {
    affiliationType = userInfo.affiliations[0].type
    if ('departments' in userInfo.affiliations[0]) {
      for (const department of userInfo.affiliations[0].departments) {
        departmentNames.push(department.name)
      }
    }
    positionTitle = userInfo.affiliations[0].title
    officeLocation = userInfo.affiliations[0].office
    switch (userInfo.affiliations[0].type) {
      case 'faculty':
        affiliationColorCode = 0x8800FF
        affiliationEmoji = `<:faculty:${config.emoji.faculty}> `
        break
      case 'staff':
        affiliationColorCode = 0x00CCFF
        affiliationEmoji = `<:staff:${config.emoji.staff}> `
        break
      case 'affiliate':
        affiliationColorCode = 0xFFD900
        affiliationEmoji = `<:affiliate:${config.emoji.affiliate}> `
        break
      case 'student':
        affiliationColorCode = 0x88FF00
        affiliationEmoji = `<:student:${config.emoji.student}> `
        break
      default:
        affiliationColorCode = 0xFFFFFF
        break
    }
    embedBuilder.addFields({
      name: 'Affiliation Type',
      value: affiliationEmoji + affiliationType.charAt(0).toUpperCase() + affiliationType.substring(1),
      inline: true
    })
  } else affiliationColorCode = 0xFFFFFF
  if (positionTitle) {
    embedBuilder.addFields({
      name: 'Title',
      value: positionTitle,
      inline: true
    })
  }
  if (departmentNames.length > 0) {
    embedBuilder.addFields({
      name: 'Departments',
      value: departmentNames.join(', '),
      inline: true
    })
  }
  if (affiliationType === 'student') {
    let classYear = userInfo.affiliations[0].classYear
    if (classYear === 'G') {
      classYear = 'Graduate Student'
    } else {
      classYear = 'Year ' + classYear
    }
    embedBuilder.addFields({
      name: 'Class Year',
      value: classYear,
      inline: true
    })
  }
  if (officeLocation) {
    embedBuilder.addFields({
      name: 'Office',
      value: officeLocation,
      inline: true
    })
  }
  embedBuilder.setColor(affiliationColorCode)
  return embedBuilder
}

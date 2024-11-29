import { EmbedBuilder } from 'discord.js'
import { config as configReader } from '../../../../lib/preferencesReader.js'

const config = await configReader()

export async function whoisResult (discordID, userInfo) {
  let affiliationColorCode
  let affiliationEmoji = ' '
  const embedBuilder = new EmbedBuilder()
    .setTitle('Verified User Information')
    .setDescription(`The Discord user <@${discordID}> has been identified as the following individual.`)
    .addFields(
      {
        name: 'Legal Name',
        value: `${userInfo.userInfo.familyName}, ${userInfo.userInfo.givenName}${userInfo.userInfo.middleName ? ' ' + userInfo.userInfo.middleName : ''}`,
        inline: true
      },
      {
        name: 'Display Name',
        value: userInfo.userInfo.displayName,
        inline: true
      },
      {
        name: 'Email/Kerberos',
        value: `${userInfo.userInfo.email.replaceAll('_', '\\_')} (\`${userInfo.userInfo.kerberosId}\`)`
      }
    )
  if (userInfo.userInfo.phoneNumber) {
    embedBuilder.addFields({
      name: 'Phone Number',
      value: userInfo.userInfo.phoneNumber
    })
  }
  let positionTitle, officeLocation
  const departmentNames = []
  let affiliationType
  if (userInfo.userInfo.affiliations.length > 0) {
    affiliationType = userInfo.userInfo.affiliations[0].type
    if ('departments' in userInfo.userInfo.affiliations[0]) {
      for (const department of userInfo.userInfo.affiliations[0].departments) {
        departmentNames.push(department.name)
      }
    }
    positionTitle = userInfo.userInfo.affiliations[0].title
    officeLocation = userInfo.userInfo.affiliations[0].office
    switch (userInfo.userInfo.affiliations[0].type) {
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
    let classYear = userInfo.userInfo.affiliations[0].classYear
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
  if (userInfo.image !== undefined) {
    embedBuilder.setThumbnail('attachment://user.jpeg')
  }
  embedBuilder.setColor(affiliationColorCode)
  return embedBuilder
}

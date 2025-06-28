import { EmbedBuilder } from 'discord.js'
import { config as configReader } from '../lib/preferencesReader.js'
import { boolToYesNo } from '../lib/utils.js'
import { dbClient } from '../lib/mongoClient.js'
import { createHash } from 'crypto'
import getMarkdownFromName from '../lib/applicationEmojis.js'
import { getStudentYearFromUserInfo } from '../lib/mitDeveloperConnection/people.js'

const config = await configReader()
const verificationLinksCollection = dbClient.collection('verification.links')

export function buildingInfo (info) {
  const embedBuilder = new EmbedBuilder()
  if ('name' in info) {
    embedBuilder.setTitle(info.name + ('bldgnum' in info && (info.name.includes(`(${info.bldgnum})`) || info.name === info.bldgnum) ? '' : ` (${info.bldgnum})`))
  } else if ('bldgnum' in info) embedBuilder.setTitle(info.bldgnum)
  else embedBuilder.setTitle('Building Information')
  if ('bldgimg' in info) embedBuilder.setThumbnail(info.bldgimg)
  if ('street' in info) {
    let streetLinkText
    if (info.id !== undefined && info.id.startsWith('object-')) {
      streetLinkText = `[${info.street}](https://whereis.mit.edu/?go=${info.id.slice(7)})`
    } else streetLinkText = info.street
    embedBuilder.addFields({
      name: 'Street Address',
      value: streetLinkText,
      inline: true
    })
  }
  if ('mailing' in info && info.mailing !== info.street) {
    embedBuilder.addFields({
      name: 'Mailing Address',
      value: info.mailing,
      inline: true
    })
  }
  if ('lat_wgs84' in info && 'long_wgs84' in info) {
    embedBuilder.addFields({
      name: 'Geodetic Coordinates',
      value: `${Math.abs(info.lat_wgs84)} ${info.lat_wgs84 >= 0 ? '°N' : '°S'}, ${Math.abs(info.long_wgs84)} ${info.long_wgs84 >= 0 ? '°E' : '°W'}`,
      inline: true
    })
  }
  if ('architect' in info) {
    embedBuilder.addFields({
      name: 'Architect',
      value: info.architect,
      inline: true
    })
  }
  if ('floorplans' in info) {
    let floorplanLinkText = ''
    for (const i of info.floorplans) {
      if (floorplanLinkText !== '') floorplanLinkText += ', '
      floorplanLinkText += `[${i}](https://floorplans.mit.edu/pdfs/${info.bldgnum}_${i}.pdf)`
    }
    embedBuilder.addFields({
      name: 'Floorplans',
      value: floorplanLinkText,
      inline: true
    })
  }
  if ('contents' in info && info.contents.length > 0) {
    let contentsString = ''
    for (const i of info.contents) {
      let contentsStringNew = contentsString
      if (contentsString !== '') contentsStringNew += '\n'
      if ('url' in i) contentsStringNew += `* [${i.name}](${i.url})`
      else contentsStringNew += `* ${i.name}`
      if (contentsStringNew.length <= 1024 - 47) {
        contentsString = contentsStringNew
      } else {
        contentsString += '\n* *More building contents are available but not shown here.*'
        break
      }
    }
    embedBuilder.addFields({
      name: 'Building Contents',
      value: contentsString
    })
  }
  if ('website' in info) embedBuilder.setURL(info.website)
  return embedBuilder
}

export function departmentInfo (prefix, information) {
  const embedBuilder = new EmbedBuilder()
    .setTitle(
      (
        'emojiName' in information
          ? getMarkdownFromName(information.emojiName, true)
          : ''
      ) + information.name
    )
    .setColor(0x808080)
    .setURL(`https://catalog.mit.edu/subjects/${prefix.toString().toLowerCase()}/`)
    .addFields([
      {
        name: 'Course Prefix',
        value: prefix,
        inline: true
      }
    ])
  if ('abbreviation' in information && information.abbreviation !== prefix) {
    embedBuilder.addFields([{
      name: 'Abbreviation',
      value: information.abbreviation,
      inline: true
    }])
  }
  if ('website' in information) {
    embedBuilder.addFields([{
      name: 'Website',
      value: `[${URL.parse(information.website).host}](${information.website})`,
      inline: true
    }])
  }
  return embedBuilder
}

export function courseInfo (information) {
  const offeredTimes = []
  if (information.offered_fall) {
    offeredTimes.push('Fall')
  }
  if (information.offered_iap) {
    offeredTimes.push('IAP')
  }
  if (information.offered_spring) {
    offeredTimes.push('Spring')
  }
  if (information.offered_summer) {
    offeredTimes.push('Summer')
  }
  const embedBuilder = new EmbedBuilder()
    .setTitle(
      (
        'level' in information
          ? (information.level === 'U'
              ? getMarkdownFromName('undergraduate', true)
              : getMarkdownFromName('graduate', true))
          : ''
      ) +
      (
        'communication_requirement' in information
          ? (information.communication_requirement === 'CI-H'
              ? getMarkdownFromName('ci_h', true)
              : getMarkdownFromName('ci_hw', true)
            )
          : ''
      ) +
      `${information.subject_id}: ${information.title}`)
    .setDescription(information.description)
    .addFields([
      {
        name: 'Offered',
        value: offeredTimes.join(', '),
        inline: true
      },
      {
        name: 'Instructors',
        value: 'instructors' in information ? information.instructors.join('\n') : '*Instructors not listed.*',
        inline: true
      },
      {
        name: 'Average Class Size',
        value: 'enrollment_number' in information ? information.enrollment_number.toString() : '*Information not available.*',
        inline: true
      },
      {
        name: 'Hours',
        value: `* **In Class:** ${information.in_class_hours}\n* **Out of Class:** ${information.out_of_class_hours}`,
        inline: true
      },
      {
        name: 'Units',
        value: `${information.is_variable_units ? '*This course counts for variable units.*\n' : ''}* **Lecture:** ${information.lecture_units}\n* **Lab:** ${information.lab_units}\n* **Design:** ${information.design_units}\n* **Preparation:** ${information.preparation_units}\n* **Total:** ${information.total_units}`,
        inline: true
      },
      {
        name: 'Has final?',
        value: boolToYesNo(information.has_final),
        inline: true
      }
    ])
  if ('url' in information) {
    embedBuilder.setURL(information.url)
  }
  if ('level' in information) {
    if (information.level === 'U') embedBuilder.setColor(0x0080FF)
    else embedBuilder.setColor(0x008040)
  } else {
    embedBuilder.setColor(0xFFFFFF)
  }
  return embedBuilder
}

export async function directoryResultList (searchResult, query) {
  const embedBuilder = new EmbedBuilder()
    .setColor(0x750014)
    .setTitle('Directory Search Results')
    .setDescription(`Multiple results were found for the query \`${query}\`. To get detailed information, use a more specific query.\n*${searchResult.length} results${searchResult.length > 25
      ? '; 25 shown'
      : ''}*`)
  for (let i = 0; i < Math.min(searchResult.length, 25); i++) {
    embedBuilder.addFields([{
      name: searchResult[i].name,
      value: `${searchResult[i].email_id}@${searchResult[i].email_domain}`
    }])
  }
  return embedBuilder
}

export async function directoryResult (detailSearchResult) {
  const embedBuilder = new EmbedBuilder()
    .setColor(0x750014)
    .setTitle(detailSearchResult.search.name)
  const detailDefined = detailSearchResult.detail !== undefined
  if (detailDefined && 'title' in detailSearchResult.detail) {
    embedBuilder.addFields([{
      name: 'Title',
      value: detailSearchResult.detail.title
    }])
  }
  let department
  if ('department' in detailSearchResult.search) {
    department = detailSearchResult.search.department
  } else if (detailDefined && 'department' in detailSearchResult.detail) {
    department = detailSearchResult.detail.department
  }
  if (department !== undefined) {
    switch (department) {
      case 'Aeronautics and Astronautics':
      case 'Department of Aeronautics and Astronautics':
        department = getMarkdownFromName('aeroastro', true) + department
        break
      case 'Brain and Cognitive Sciences':
      case 'Department of Brain and Cognitive Sciences':
        department = getMarkdownFromName('bcs', true) + department
        break
      case 'Civil and Environmental Engineering':
      case 'Department of Civil and Environmental Engineering':
        department = getMarkdownFromName('cee', true) + department
        break
      case 'Comparative Media Studies/Writing':
        department = getMarkdownFromName('cms', true) + department
        break
      case 'Materials Science and Engineering':
      case 'Department of Materials Science and Engineering':
        department = getMarkdownFromName('dmse', true) + department
        break
      case 'Urban Studies and Planning':
      case 'Department of Urban Studies and Planning':
        department = getMarkdownFromName('dusp', true) + department
        break
      case 'Edgerton Center':
        department = getMarkdownFromName('edgerton', true) + department
        break
      case 'Electrical Engineering and Computer Science':
      case 'Dept of Electrical Engineering & Computer Science':
        department = getMarkdownFromName('eecs', true) + department
        break
      case 'Experimental Study Group':
        department = getMarkdownFromName('esg', true) + department
        break
      case 'Literature':
      case 'Literature Section':
        department = getMarkdownFromName('lit', true) + department
        break
      case 'Mechanical Engineering':
      case 'Department of Mechanical Engineering':
        department = getMarkdownFromName('meche', true) + department
        break
      case 'Physics':
      case 'Department of Physics':
        department = getMarkdownFromName('physics', true) + department
        break
      case 'Supply Chain Management Program':
        department = getMarkdownFromName('scm', true) + department
        break
      case 'MIT Program in Women\'s and Gender Studies':
        department = getMarkdownFromName('wgs', true) + department
        break
    }
    embedBuilder.addFields([{
      name: 'Department',
      value: department,
      inline: true
    }])
  }
  if (detailDefined && 'school' in detailSearchResult.detail) {
    embedBuilder.addFields([{
      name: 'School',
      value: detailSearchResult.detail.school,
      inline: true
    }])
  }
  if (detailDefined && 'student_year' in detailSearchResult.detail) {
    embedBuilder.addFields([{
      name: 'Student Year',
      value: detailSearchResult.detail.student_year,
      inline: true
    }])
  }
  const email = `${detailSearchResult.search.email_id}@${detailSearchResult.search.email_domain}`
  embedBuilder.addFields([{
    name: 'Email',
    value: `\`${email}\``,
    inline: true
  }])
  if (detailDefined && 'phone' in detailSearchResult.detail) {
    embedBuilder.addFields([{
      name: 'Phone',
      value: detailSearchResult.detail.phone,
      inline: true
    }])
  }
  if (detailDefined && 'address' in detailSearchResult.detail) {
    embedBuilder.addFields([{
      name: 'Address',
      value: detailSearchResult.detail.address,
      inline: true
    }])
  }
  if (detailDefined && 'url' in detailSearchResult.detail) {
    embedBuilder.setURL(detailSearchResult.detail.url)
  }
  if (config.commandSettings.directory.enableAccountLinkStatusInDirectorySearch) {
    await verificationLinksCollection.findOne(
      {
        'petrock.sub': email
      }
    ).then(doc => {
      if (doc === null) {
        return `${getMarkdownFromName('no_discord')} No Discord account linked`
      } else {
        return `${getMarkdownFromName('discord')} Discord account linked`
      }
    }).then(val => {
      embedBuilder.addFields([{
        name: 'IdentiBot Connection',
        value: val
      }])
    })
  }
  const gravatarURL = 'https://gravatar.com/avatar/' +
    createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
  await fetch(`${gravatarURL}?d=404`, { method: 'HEAD' }).then(res => {
    if (res.ok) {
      embedBuilder.setThumbnail(`${gravatarURL}?s=1024`)
    }
  })
  return embedBuilder
}

export function whoisResult (discordID, infoSource, userInfo, thumbnailURL) {
  let affiliationColorCode = 0xFFFFFF
  let affiliationEmoji = ''
  const embedBuilder = new EmbedBuilder()
    .setTitle('Verified User Information')
    .setDescription(`The Discord user <@${discordID}> has been identified as the following individual.`)
  switch (infoSource) {
    case 'kerberos': {
      embedBuilder.addFields(
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
            affiliationEmoji = getMarkdownFromName('faculty', true)
            break
          case 'staff':
            affiliationColorCode = 0x00CCFF
            affiliationEmoji = getMarkdownFromName('staff', true)
            break
          case 'affiliate':
            affiliationColorCode = 0xFFD900
            affiliationEmoji = getMarkdownFromName('affiliate', true)
            break
          case 'student':
            affiliationColorCode = 0x88FF00
            affiliationEmoji = getMarkdownFromName('student', true)
            break
        }
        embedBuilder.addFields({
          name: 'Affiliation Type',
          value: affiliationEmoji + affiliationType.charAt(0).toUpperCase() + affiliationType.substring(1),
          inline: true
        })
      }
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
      let classYear = getStudentYearFromUserInfo(userInfo)
      if (classYear === 'G') {
        classYear = 'Graduate Student'
      } else if (classYear !== undefined) {
        classYear = `Year ${classYear}`
      }
      if (classYear) {
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
      embedBuilder.setFooter({
        text: 'Information retrieved from the MIT People database.'
      })
      break
    }
    case 'admitted': {
      embedBuilder.addFields(
        {
          name: 'Preferred Name',
          value: userInfo.preferredName,
          inline: true
        },
        {
          name: 'Admitted to',
          value: `Class of **${userInfo.years.originalClassYear}**`,
          inline: true
        }
      )
      if (userInfo.years.gapYearClassYear) {
        embedBuilder.addFields({
          name: 'Final class year',
          value: `Class of **${userInfo.years.gapYearClassYear}**\n-# Class year of the user, taking into account gap years taken.`,
          inline: true
        })
      }
      embedBuilder.addFields(
        {
          name: 'Admissions Cycle',
          value: `${userInfo.years.cycleYear}\u2013${parseInt(userInfo.years.cycleYear) + 1}`,
          inline: true
        },
        {
          name: 'Affiliation Type',
          value: `${getMarkdownFromName('admitted')} Admitted Student\n-# IdentiBot has **not verified** that the user has committed to attending MIT.`,
          inline: true
        }
      )
      affiliationColorCode = 0xFF00FF
      embedBuilder.setFooter({
        text: `Information retrieved from the IdentiBot admitted students database (populated by the MIT Admissions Office).\nAccess to admitted student information via IdentiBot is limited. If you need more information about a specific admitted student, contact ${config.supportContacts.emails.admittedVerification}.`
      })
    }
  }
  if (thumbnailURL) {
    embedBuilder.setThumbnail(thumbnailURL)
  }
  embedBuilder.setColor(affiliationColorCode)
  return embedBuilder
}

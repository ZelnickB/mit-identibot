import { createHash } from 'crypto'

import { EmbedBuilder } from 'discord.js'
import { config as configReader } from '../../../../lib/preferencesReader.js'
import { dbClient } from '../../../../lib/mongoClient.js'

const config = await configReader()
const verificationUserInfoCollection = dbClient.collection('verification.userInfo')

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
        department = `<:aeroastro:${config.emoji.aeroastro}> ` + department
        break
      case 'Brain and Cognitive Sciences':
      case 'Department of Brain and Cognitive Sciences':
        department = `<:bcs:${config.emoji.bcs}> ` + department
        break
      case 'Civil and Environmental Engineering':
      case 'Department of Civil and Environmental Engineering':
        department = `<:cee:${config.emoji.cee}> ` + department
        break
      case 'Comparative Media Studies/Writing':
        department = `<:cms:${config.emoji.cms}> ` + department
        break
      case 'Materials Science and Engineering':
      case 'Department of Materials Science and Engineering':
        department = `<:dmse:${config.emoji.dmse}> ` + department
        break
      case 'Urban Studies and Planning':
      case 'Department of Urban Studies and Planning':
        department = `<:dusp:${config.emoji.dusp}> ` + department
        break
      case 'Edgerton Center':
        department = `<:edgerton:${config.emoji.edgerton}> ` + department
        break
      case 'Electrical Engineering and Computer Science':
      case 'Dept of Electrical Engineering & Computer Science':
        department = `<:eecs:${config.emoji.eecs}> ` + department
        break
      case 'Experimental Study Group':
        department = `<:esg:${config.emoji.esg}> ` + department
        break
      case 'Literature':
      case 'Literature Section':
        department = `<:lit:${config.emoji.lit}> ` + department
        break
      case 'Mechanical Engineering':
      case 'Department of Mechanical Engineering':
        department = `<:meche:${config.emoji.meche}> ` + department
        break
      case 'Physics':
      case 'Department of Physics':
        department = `<:physics:${config.emoji.physics}> ` + department
        break
      case 'Supply Chain Management Program':
        department = `<:scm:${config.emoji.scm}> ` + department
        break
      case "MIT Program in Women's and Gender Studies":
        department = `<:wgs:${config.emoji.wgs}> ` + department
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
    await verificationUserInfoCollection.findOne(
      {
        'petrock.email': email
      }
    ).then(doc => {
      if (doc === null) {
        return `<:no_discord:${config.emoji.no_discord}> No Discord account linked`
      } else {
        return `<:discord:${config.emoji.discord}> Discord account linked`
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

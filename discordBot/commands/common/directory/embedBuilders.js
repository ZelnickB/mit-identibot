import { EmbedBuilder } from 'discord.js'
import { config as configReader } from '../../../../lib/preferencesReader.js'

const config = await configReader()

export function directoryResult (detailSearchResult) {
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
  embedBuilder.addFields([{
    name: 'Email',
    value: `\`${detailSearchResult.search.email_id}@${detailSearchResult.search.email_domain}\``,
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
  return embedBuilder
}

import { EmbedBuilder } from 'discord.js'

// export const buildingTypeColorMap = {
//
// }

export function buildingInfo (info) {
  const embedBuilder = new EmbedBuilder()
  if ('name' in info) {
    embedBuilder.setTitle(info.name + ('bldgnum' in info && info.name.includes(`(${info.bldgnum})`) ? '' : ` (${info.bldgnum})`))
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

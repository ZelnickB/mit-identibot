import { AttachmentBuilder } from 'discord.js'
import { getUserInfo } from '../../../lib/userLinks.js'
import { whoisResult } from '../../embedBuilders.js'
import { EmbeddableError } from '../../../lib/errorBases.js'
import { readUserConfig } from '../../../lib/configurationReaders.js'
import { get as getIdPhoto } from '../../../lib/mitDeveloperConnection/peoplePictures.js'

export async function respond (interaction) {
  const userInfo = await getUserInfo(interaction.options.get('user').user)
  const kerberosInfoAvailable = userInfo.kerberos !== undefined && !(userInfo.kerberos instanceof Error)
  let embed
  const files = []
  if ('kerberos' in userInfo) {
    if (userInfo.kerberos instanceof EmbeddableError) return userInfo.kerberos.editReplyWithEmbed(interaction)
    const userConfig = await readUserConfig(interaction.options.get('user').user.id)
    if (userConfig.allowIdPhotoLookup.moderator || userConfig.allowIdPhotoLookup.member) {
      files.push(new AttachmentBuilder(await getIdPhoto(userInfo.kerberos.kerberosId), { name: 'user.jpeg' }))
    }
    embed = whoisResult(interaction.options.get('user').user.id, 'kerberos', userInfo.kerberos, files.length !== 0 ? 'attachment://user.jpeg' : undefined)
  }
  return interaction.editReply({
    embeds: [embed],
    files
  })
}

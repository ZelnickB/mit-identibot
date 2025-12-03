import { AttachmentBuilder } from 'discord.js'
import { getUserInfo } from '../../../lib/userLinks.js'
import { whoisResult } from '../../embedBuilders.js'
import { EmbeddableError } from '../../../lib/errorBases.js'
import { readUserConfig } from '../../../lib/configurationReaders.js'
import { get as getIdPhoto } from '../../../lib/mitDeveloperConnection/peoplePictures.js'
import { checkUserInServer } from '../authorization.js'

export async function respond (interaction) {
  const targetUser = interaction.options.get('user').user
  try {
    await checkUserInServer(interaction, targetUser)
  } catch (e) {
    if (e instanceof EmbeddableError) return e.editReplyWithEmbed(interaction)
  }
  try {
    const userInfo = await getUserInfo(targetUser)
    let embed
    const files = []
    if ('kerberos' in userInfo) {
      if (userInfo.kerberos instanceof EmbeddableError) return userInfo.kerberos.editReplyWithEmbed(interaction)
      const userConfig = await readUserConfig(targetUser.id)
      if (userConfig.allowIdPhotoLookup.moderator || userConfig.allowIdPhotoLookup.member) {
        files.push(new AttachmentBuilder(await getIdPhoto(userInfo.kerberos.kerberosId), { name: 'user.jpeg' }))
      }
      embed = whoisResult(targetUser.id, 'kerberos', userInfo.kerberos, files.length !== 0 ? 'attachment://user.jpeg' : undefined)
    } else if ('admitted' in userInfo) embed = whoisResult(targetUser.id, 'admitted', userInfo.admitted)
    return interaction.editReply({
      embeds: [embed],
      files
    })
  } catch (err) {
    if (err instanceof EmbeddableError) {
      return err.editReplyWithEmbed(interaction)
    } else throw err
  }
}

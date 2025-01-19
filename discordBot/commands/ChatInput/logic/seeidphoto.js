import { AttachmentBuilder, EmbedBuilder } from 'discord.js'
import * as authorization from '../../authorization.js'
import { readUserConfig } from '../../../../lib/configurationReaders.js'
import { getKerberos, UnlinkedUserError } from '../../../../lib/userLinks.js'
import { get as getPhoto } from '../../../../lib/mitDeveloperConnection/peoplePictures.js'

export default async function (interaction) {
  const targetUser = interaction.options.get('user').user
  if (!(
    await authorization.authorizeServerAndReply(interaction) &&
    await authorization.checkUserVerificationAndReply(interaction) &&
    await authorization.checkUserInServerAndReply(interaction, targetUser)
  )) return
  await interaction.deferReply({ ephemeral: true })
  const targetUserConfig = await readUserConfig(targetUser.id)
  if (targetUserConfig.allowIdPhotoLookup.member && !(targetUserConfig.blocked.users.includes(interaction.user.id) || targetUserConfig.blocked.servers.includes(interaction.guild.id))) {
    return getKerberos(targetUser)
      .then(kerb => getPhoto(kerb))
      .then(photo => {
        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setTitle('MIT ID Card Photo')
              .setColor(0x750014)
              .setFields([
                {
                  name: 'Discord user',
                  value: `<@${targetUser.id}> (\`${targetUser.id}\`)`
                },
                {
                  name: 'Retrieved',
                  value: `<t:${Math.round(Date.now() / 1000)}:f>`
                }
              ])
              .setImage('attachment://user.jpeg')
          ],
          files: [new AttachmentBuilder(photo, { name: 'user.jpeg' })]
        })
      })
      .catch(err => {
        if (err instanceof UnlinkedUserError) {
          return interaction.editReply({
            content: '**Error:** This user does not have a linked Kerberos identity.'
          })
        }
      })
  } else {
    return interaction.editReply({
      content: '**Error:** You do not have permission to perform this action.\n-# The user may not have enabled member ID card photo access for their account, or they may have blocked you or this server.'
    })
  }
}

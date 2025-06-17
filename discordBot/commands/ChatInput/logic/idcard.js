import { AttachmentBuilder, EmbedBuilder } from 'discord.js'
import { EmbeddableError } from '../../../../lib/errorBases.js'
import * as userLinks from '../../../../lib/userLinks.js'
import { get as getIdPhoto } from '../../../../lib/mitDeveloperConnection/peoplePictures.js'

export default async function (interaction) {
  const showIdPhoto = interaction.options.get('withpicture') === null || interaction.options.getBoolean('withpicture')
  const ephemeral = interaction.options.getBoolean('preview') === true
  await interaction.deferReply({ ephemeral })
  try {
    const userInfo = (await userLinks.getUserInfo(interaction.user)).kerberos
    if (userInfo === undefined) return new userLinks.MissingLinkError(interaction.user.id, 'kerberos', false).editReplyWithEmbed(interaction)
    const embedBuilder = new EmbedBuilder()
      .setAuthor({
        name: 'Massachusetts Institute of Technology'
      })
      .setColor(0x750014)
      .setTitle('Discord ID Card')
      .addFields([
        {
          name: 'Discord User',
          value: `<@${interaction.user.id}> (\`${interaction.user.id}\`)`
        },
        {
          name: 'Name',
          value: userInfo.displayName,
          inline: true
        }
      ])
      .setTimestamp(new Date())
      .setFooter({
        text: 'Not valid for official identification purposes. Sent upon request.'
      })
    if (userInfo.affiliations.length > 0) {
      const affiliationType = userInfo.affiliations[0].type
      embedBuilder.addFields({
        name: 'Affiliation',
        value: affiliationType.charAt(0).toUpperCase() + affiliationType.substring(1),
        inline: true
      })
    }
    embedBuilder.addFields({
      name: 'Email/Kerberos',
      value: `${userInfo.email.replaceAll('_', '\\_')} (\`${userInfo.kerberosId}\`)`,
      inline: true
    })
    const files = []
    if (showIdPhoto) {
      files.push(new AttachmentBuilder(await getIdPhoto(userInfo.kerberosId), { name: 'user.jpeg' }))
      embedBuilder.setThumbnail('attachment://user.jpeg')
    }
    return interaction.editReply({
      embeds: [embedBuilder],
      files
    })
  } catch (e) {
    if (e instanceof EmbeddableError) {
      return e.editReplyWithEmbed(interaction)
    }
  }
}

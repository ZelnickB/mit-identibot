import { AttachmentBuilder, EmbedBuilder } from 'discord.js'
import { getUserInfo, UnlinkedUserError } from '../../../../lib/userLinks.js'

export default async function (interaction) {
  const showIdPhoto = interaction.options.getBoolean('withpicture') !== false
  const ephemeral = interaction.options.getBoolean('preview') === true
  interaction.deferReply({ ephemeral })
  try {
    const userInfo = await getUserInfo(interaction.user, showIdPhoto)
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
          value: userInfo.userInfo.displayName,
          inline: true
        }
      ])
      .setTimestamp(new Date())
      .setFooter({
        text: 'Not valid for official identification purposes. Sent upon request.'
      })
    if (userInfo.userInfo.affiliations.length > 0) {
      const affiliationType = userInfo.userInfo.affiliations[0].type
      embedBuilder.addFields({
        name: 'Affiliation',
        value: affiliationType.charAt(0).toUpperCase() + affiliationType.substring(1),
        inline: true
      })
    }
    embedBuilder.addFields({
      name: 'Email/Kerberos',
      value: `${userInfo.userInfo.email.replaceAll('_', '\\_')} (\`${userInfo.userInfo.kerberosId}\`)`,
      inline: true
    })
    const files = []
    if (userInfo.image !== undefined) {
      files.push(new AttachmentBuilder(userInfo.image, { name: 'user.jpeg' }))
      embedBuilder.setThumbnail('attachment://user.jpeg')
    }
    return await interaction.editReply({
      embeds: [embedBuilder],
      files
    })
  } catch (e) {
    if (e instanceof UnlinkedUserError) {
      return await interaction.editReply({
        content: `The user <@${interaction.user.id}> does not have a linked Kerberos identity.`,
        allowedMentions: {
          parse: []
        }
      })
    }
  }
}

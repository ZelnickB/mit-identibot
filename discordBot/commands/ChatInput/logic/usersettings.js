import { readUserConfig, userConfigCollection } from '../../../../lib/configurationReaders.js'

export default async function (interaction) {
  const isServerInteraction = interaction.guild !== null
  if (interaction.options.getSubcommandGroup() === null) {
    switch (interaction.options.getSubcommand()) {
      case 'allowmoderatoridphotolookup': {
        const argValue = interaction.options.getBoolean('value')
        if (argValue === null) {
          const userConfig = await readUserConfig(interaction.user.id)
          let replyContent
          if (userConfig.allowIdPhotoLookup.moderator) {
            replyContent = 'Moderator ID photo access is currently **enabled** for your account.\n-# MIT-affiliated moderators of your servers are able to view your MIT ID card photo using your Discord username.'
          } else {
            replyContent = `Moderator ID photo access is currently ${userConfig.allowIdPhotoLookup.member ? '~~' : ''}**disabled**${userConfig.allowIdPhotoLookup.member ? '~~' : ''} for your account.\n-# ${userConfig.allowIdPhotoLookup.member ? '~~' : ''}MIT-affiliated moderators of your servers are *not* able to view your MIT ID card photo using your Discord username.${userConfig.allowIdPhotoLookup.member ? '~~' : ''}`
            if (userConfig.allowIdPhotoLookup.member) {
              replyContent += '\n-# :warning: **WARNING:** You have enabled server member ID photo access, so this setting is currently ignored.'
            }
          }
          return interaction.reply({
            content: replyContent,
            ephemeral: isServerInteraction
          })
        } else {
          await userConfigCollection.updateOne({ _userId: interaction.user.id },
            {
              $set: {
                _userId: interaction.user.id,
                'allowIdPhotoLookup.moderator': argValue
              }
            },
            {
              upsert: true
            }
          )
          return interaction.reply({
            content: 'Server moderator ID photo access is now **' + (argValue ? 'enabled' : 'disabled') + '** for your account.',
            ephemeral: isServerInteraction
          })
        }
      }
      case 'allowmemberidphotolookup': {
        const argValue = interaction.options.getBoolean('value')
        if (argValue === null) {
          if ((await readUserConfig(interaction.user.id)).allowIdPhotoLookup.member) {
            return interaction.reply({
              content: 'Server member ID photo access is currently **enabled** for your account.\n-# MIT-affiliated members of your servers are able to view your MIT ID card photo using your Discord username.',
              ephemeral: isServerInteraction
            })
          } else {
            return interaction.reply({
              content: 'Server member ID photo access is currently **disabled** for your account.\n-# MIT-affiliated members of your servers are *not* able to view your MIT ID card photo using your Discord username.',
              ephemeral: isServerInteraction
            })
          }
        } else {
          await userConfigCollection.updateOne({ _userId: interaction.user.id },
            {
              $set: {
                _userId: interaction.user.id,
                'allowIdPhotoLookup.member': argValue
              }
            },
            {
              upsert: true
            }
          )
          return interaction.reply({
            content: 'Server member ID photo access is now **' + (argValue ? 'enabled' : 'disabled') + '** for your account.',
            ephemeral: isServerInteraction
          })
        }
      }
      case 'blockserver': {
        const targetServer = interaction.guild
        if (targetServer === null) {
          return interaction.reply({
            content: '**Error:** This command must be run in a server, not in a direct message.',
            ephemeral: true
          })
        }
        await userConfigCollection.updateOne({ _userId: interaction.user.id },
          {
            $set: {
              _userId: interaction.user.id
            },
            $push: {
              'blocked.servers': targetServer.id
            }
          },
          {
            upsert: true
          }
        )
        return interaction.reply({
          content: 'This server has been **blocked** successfully.',
          ephemeral: true
        })
      }
      case 'blockuser': {
        const targetUser = interaction.options.getUser('user')
        await userConfigCollection.updateOne({ _userId: interaction.user.id },
          {
            $set: {
              _userId: interaction.user.id
            },
            $push: {
              'blocked.users': targetUser.id
            }
          },
          {
            upsert: true
          }
        )
        return interaction.reply({
          content: `User <@${targetUser.id}> has been **blocked** successfully.`,
          ephemeral: isServerInteraction
        })
      }
      case 'unblockserver': {
        const targetServer = interaction.guild
        if (targetServer === null) {
          return interaction.reply({
            content: '**Error:** This command must be run in a server, not in a direct message.',
            ephemeral: true
          })
        }
        await userConfigCollection.updateOne({ _userId: interaction.user.id },
          {
            $set: {
              _userId: interaction.user.id
            },
            $pull: {
              'blocked.servers': targetServer.id
            }
          },
          {
            upsert: true
          }
        )
        return interaction.reply({
          content: 'This server has been **unblocked** successfully.',
          ephemeral: true
        })
      }
      case 'unblockuser': {
        const targetUser = interaction.options.getUser('user')
        await userConfigCollection.updateOne({ _userId: interaction.user.id },
          {
            $set: {
              _userId: interaction.user.id
            },
            $pull: {
              'blocked.users': targetUser.id
            }
          },
          {
            upsert: true
          }
        )
        return interaction.reply({
          content: `User <@${targetUser.id}> has been **unblocked** successfully.`,
          ephemeral: isServerInteraction
        })
      }
    }
  } else {
    return 0
  }
}

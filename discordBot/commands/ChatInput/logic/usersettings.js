import { readUserConfig, userConfigCollection } from '../../../../lib/configurationReaders.js'

export default async function (interaction) {
  const isServerInteraction = interaction.guild !== null
  if (interaction.options.getSubcommandGroup() === null) {
    switch (interaction.options.getSubcommand()) {
      case 'allowidphotolookup': {
        const argValue = interaction.options.getBoolean('value')
        if (argValue === null) {
          if ((await readUserConfig(interaction.user.id)).allowIdPhotoLookup) {
            return interaction.reply({
              content: 'ID photo access is currently **enabled** for your account.\n-# MIT-affiliated moderators of your servers are able to view your MIT ID card photo using your Discord username.',
              ephemeral: isServerInteraction
            })
          } else {
            return interaction.reply({
              content: 'ID photo access is currently **disabled** for your account.\n-# MIT-affiliated moderators of your servers are *not* able to view your MIT ID card photo using your Discord username.',
              ephemeral: isServerInteraction
            })
          }
        } else {
          await userConfigCollection.updateOne({ _userId: interaction.user.id },
            {
              $set: {
                _userId: interaction.user.id,
                allowIdPhotoLookup: argValue
              }
            },
            {
              upsert: true
            }
          )
          return interaction.reply({
            content: 'ID photo access is now **' + (argValue ? 'enabled' : 'disabled') + '** for your account.',
            ephemeral: isServerInteraction
          })
        }
      }
    }
  } else {
    return 0
  }
}

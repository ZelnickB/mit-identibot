import { EmbedBuilder } from 'discord.js'
import * as emergency from '../../../../lib/publicAPIs/emergency.js'

const emergencyCommandDisclaimer = 'The creators of MIT IdentiBot are not responsible for any damages caused by malfunctions, including those that occur during emergency situations. MIT IdentiBot is not guaranteed to work in emergency situations.'

export default async function (interaction) {
  if (interaction.options.getSubcommandGroup() === null) {
    switch (interaction.options.getSubcommand()) {
      case 'contacts': {
        const embed = new EmbedBuilder()
          .setColor(0xdd3812)
          .setAuthor({
            name: 'Massachusetts Institute of Technology'
          })
          .setTitle('Emergency Contacts')
          .setFooter({
            text: emergencyCommandDisclaimer + '\nFor availability in emergency situations, you should memorize these phone numbers and/or store them in a safe location.\nEmergency contacts last updated 2025-01-17.'
          })
        for (const contact of emergency.hardcodedEmergencyContactInformation) {
          const isPoliceEmergencyNumber = contact.name === 'MIT Police (emergency)'
          embed.addFields({
            name: contact.name,
            value: (isPoliceEmergencyNumber ? '**' : '') + contact.phone + (isPoliceEmergencyNumber ? '**' : '') + ('description' in contact ? `\n*${contact.description}*` : ''),
            inline: true
          })
        }
        return interaction.reply({
          embeds: [embed]
        })
      }
      case 'alerts': {
        const [, message] = await Promise.all([interaction.deferReply(), emergency.currentEmergencyMessage()])
        const embed = new EmbedBuilder()
          .setAuthor({
            name: 'Massachusetts Institute of Technology'
          })
          .setTitle('Campus Emergency Alert')
          .setURL('https://emergency.mit.edu/')
          .setFooter({
            text: emergencyCommandDisclaimer
          })
        if (message === null) {
          embed.setColor(0x12de37)
          embed.setDescription('There is currently no major emergency on campus.')
        } else {
          embed.setColor(0xdd3812)
          embed.setDescription(message.announcement_text)
        }
        return interaction.editReply({
          embeds: [embed]
        })
      }
    }
  } /* else {
    // Area for subcommand groups (unimplemented)
  } */
}

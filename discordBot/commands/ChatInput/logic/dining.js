import { CommandUnavailableError } from '../../../../lib/errorBases.js'

export default async function (interaction) {
  new CommandUnavailableError().replyWithEmbed(interaction)
}

/*
import _ from 'lodash'
import { DateTime } from 'luxon'
import { EmbedBuilder } from 'discord.js'
import * as dining from '../../../../lib/publicAPIs/dining.js'

export default async function (interaction) {
  if (interaction.options.getSubcommandGroup() === null) {
    switch (interaction.options.getSubcommand()) {
      case 'menus': {
        const venue = interaction.options.getString('venue')
        const fullVenueName = dining.getVenueFullName(venue)
        const meal = interaction.options.getString('meal')
        const [, mealInfo] = await Promise.all([interaction.deferReply(), dining.getMealInfo(venue, meal)])
        if (mealInfo === undefined) {
          return interaction.editReply({
            content: `**Error:** ${fullVenueName} is not open for ${meal.toLowerCase()} today, or the menu is not available.`
          })
        }
        const menu = dining.parseMenu(mealInfo)
        let embedColor = 0x808080
        switch (meal) {
          case 'Breakfast': {
            embedColor = 0xff8000
            break
          }
          case 'Brunch': {
            embedColor = 0x00ff60
            break
          }
          case 'Lunch': {
            embedColor = 0x0080ff
            break
          }
          case 'Dinner': {
            embedColor = 0xc000ff
            break
          }
          case 'Late Night': {
            embedColor = 0x001060
            break
          }
        }
        const embed = new EmbedBuilder()
          .setTitle(`${fullVenueName} ${meal} Menu`)
          .setAuthor({
            name: 'Massachusetts Institute of Technology Dining'
          })
          .setDescription(`${meal} is being served at ${venue} from ${mealInfo.start_time} to ${mealInfo.end_time} today.`)
          .setFooter({
            text: `Menu for ${meal.toLowerCase()} at ${fullVenueName}, ${DateTime.now().setZone('America/New_York').toFormat('ccc d LLLL, yyyy')}.`
          })
          .setColor(embedColor)
        for (const station in menu) {
          if (['beverages', 'condiments'].includes(station.toLowerCase())) continue
          embed.addFields({
            name: _.upperFirst(station),
            value: '* ' + menu[station].map(x => _.upperFirst(x.name)).join('\n* '),
            inline: true
          })
        }
        return interaction.editReply({
          embeds: [embed]
        })
      }
    }
  }
}
*/

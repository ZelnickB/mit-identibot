import { EmbedBuilder } from 'discord.js'
import { cachedConfig } from './preferencesReader.js'

export class IdentiBotError extends Error {
  constructor (message, { cause = undefined } = {}) {
    super(message)
    this.name = this.constructor.name
    this.cause = cause
  }
}

export class EmbeddableError extends IdentiBotError {
  #embedInfo = {}
  ibErrorCode
  summaryMessage
  referenceNumber

  constructor ({ errorMessage, embedMessage = errorMessage, summaryMessage, referenceNumber, title = ':warning: IdentiBot Error', code, color = 0xD32F2F }, { cause = undefined } = {}) {
    super(errorMessage, { cause })
    this.ibErrorCode = code
    this.summaryMessage = summaryMessage
    this.referenceNumber = referenceNumber
    this.#embedInfo.title = title
    this.#embedInfo.message = embedMessage
    this.#embedInfo.color = color
  }

  get embed () {
    const builder = new EmbedBuilder()
    builder.setColor(this.#embedInfo.color)
      .setTitle(this.#embedInfo.title)
      .setDescription(this.#embedInfo.message)
      .setFooter({
        text: `For support, contact ${cachedConfig.supportContacts.emails.general}.`
      })
    if (this.ibErrorCode) {
      builder.addFields({
        name: 'Error Code',
        value: this.ibErrorCode ? `\`${this.ibErrorCode}\`` : '*Not applicable*',
        inline: true
      })
    }
    if (this.summaryMessage) {
      builder.addFields({
        name: 'Error Message',
        value: this.summaryMessage,
        inline: true
      })
    }
    if (this.referenceNumber) {
      builder.addFields({
        name: 'Reference Number',
        value: this.referenceNumber,
        inline: true
      })
    }
    return builder
  }

  replyWithEmbed (interaction) {
    return interaction.reply({
      embeds: [this.embed],
      ephemeral: true
    })
  }

  editReplyWithEmbed (interaction) {
    return interaction.editReply({
      embeds: [this.embed]
    })
  }
}

export class BadGatewayError extends EmbeddableError {
  constructor (message, { code, referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: message,
        embedMessage: '**IdentiBot encountered an error while communicating with an upstream server.** This error may be temporary. Please try again later.',
        summaryMessage: 'Bad gateway',
        referenceNumber,
        code: code || 'IB-B.D6C3158A'
      },
      {
        cause
      }
    )
    this.name = this.constructor.name
  }
}

export class GuildOnlyCommandError extends EmbeddableError {
  constructor ({ referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: 'Command cannot be executed outside of guild.',
        embedMessage: '**This command cannot be executed outside of a server.** Try executing this command in a server.',
        summaryMessage: 'Server-only command',
        referenceNumber,
        code: 'IB-U.9F6209DD'
      },
      {
        cause
      }
    )
    this.name = this.constructor.name
  }
}

export class CommandUnavailableError extends EmbeddableError {
  constructor ({ referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: 'Command unavailable.',
        embedMessage: '**The requested command is unavailable.** Try again later.',
        summaryMessage: 'Command unavailable',
        referenceNumber,
        code: 'IB-B.28E3C875'
      },
      {
        cause
      }
    )
    this.name = this.constructor.name
  }
}

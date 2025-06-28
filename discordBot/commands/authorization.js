import { dbClient } from '../../lib/mongoClient.js'
import { getServerConfigDocument } from '../../lib/configurationReaders.js'
import { EmbeddableError, GuildOnlyCommandError } from '../../lib/errorBases.js'

const verificationLinksCollection = dbClient.collection('verification.links')

export class UnauthorizedServerError extends EmbeddableError {
  constructor (serverId, { referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: `Server ${serverId} not authorized.`,
        embedMessage: '**This server is not authorized to perform the requested action.** Certain IdentiBot features are restricted for use in approved servers. Apply for server approval, and then try again.',
        summaryMessage: 'Unauthorized server',
        referenceNumber,
        code: 'IB-U.4C0A73FB'
      },
      {
        cause
      }
    )
    this.name = this.constructor.name
  }
}

export class UnauthorizedUserError extends EmbeddableError {
  constructor (userId, { referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: `User ${userId} not authorized.`,
        embedMessage: `**This user <@${userId}> is not authorized to perform the requested action.** This error may occur if the user is not verified.`,
        summaryMessage: 'Unauthorized user',
        referenceNumber,
        code: 'IB-U.1BE0130B'
      },
      {
        cause
      }
    )
    this.name = this.constructor.name
  }
}

export class UserNotInServerError extends EmbeddableError {
  constructor (userId, { referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: `User ${userId} not in server.`,
        embedMessage: `**The user <@${userId}> is not in this server, so the action cannot be completed.** The requested action may be performed only on users in this server.`,
        summaryMessage: 'User not in server',
        referenceNumber,
        code: 'IB-U.1B8E46CF'
      },
      {
        cause
      }
    )
    this.name = this.constructor.name
  }
}

export const authorizedVerificationMethods = [
  'petrock'
]

export function authorizeServer (interaction) {
  return getServerConfigDocument(interaction.guildId).then((doc) => {
    if (doc === null || !('authorized' in doc && doc.authorized === true)) {
      throw new UnauthorizedServerError(interaction.guildId)
    } else return true
  })
}

export async function authorizeServerAndReply (interaction, ephemeralResponse = true) {
  try {
    return await authorizeServer(interaction)
  } catch (err) {
    if (err instanceof EmbeddableError) {
      await err.replyWithEmbed(interaction)
    }
    return false
  }
}

export async function checkUserVerification (interaction) {
  return verificationLinksCollection.findOne(
    {
      discordAccountId: interaction.user.id
    }
  ).then((doc) => {
    if (!doc) throw new UnauthorizedUserError(interaction.user.id)
    for (const allowedMethod of authorizedVerificationMethods) {
      if (allowedMethod in doc) return true
    }
    throw new UnauthorizedUserError(interaction.user.id)
  })
}

export async function checkUserVerificationAndReply (interaction, ephemeralResponse = true) {
  try {
    return await checkUserVerification(interaction)
  } catch (err) {
    if (err instanceof EmbeddableError) {
      await err.replyWithEmbed(interaction)
    }
    return false
  }
}

export async function checkUserInServer (interaction, user) {
  if (!interaction.inGuild()) throw new GuildOnlyCommandError()
  return interaction.guild.members.fetch(user.id).then(
    () => true,
    () => {
      throw new UserNotInServerError(user.id)
    }
  )
}

export async function checkUserInServerAndReply (interaction, user, ephemeralResponse = true) {
  try {
    return await checkUserInServer(interaction, user)
  } catch (err) {
    if (err instanceof EmbeddableError) {
      await err.replyWithEmbed(interaction)
    }
    return false
  }
}

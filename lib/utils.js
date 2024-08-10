import { secrets } from './preferencesReader.js'

export function boolToYesNo (value, capitalize = true) {
  let result = value ? 'yes' : 'no'
  if (capitalize) {
    result = result[0].toUpperCase() + result.slice(1).toLowerCase()
  }
  return result
}

export function parseNickname (givenName, familyName) {
  const splitGivenName = givenName.split(' ')
  let initialedGivenName = splitGivenName[0]
  for (let i = 1; i < splitGivenName.length; i++) {
    if (i === 1) {
      initialedGivenName += ' '
    }
    initialedGivenName += splitGivenName[i].charAt(0) + '.'
  }
  return `${initialedGivenName} ${familyName.charAt(0)}.`
}

export const botHeaders = {
  Authorization: `Bot ${(await secrets()).discordBotToken}`,
  'User-Agent': 'DiscordBot (https://github.com/zelnickb/mit-identibot, Nova)'
}

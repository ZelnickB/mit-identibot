import { gateway } from './discordAPIClients.js'

const emojis = await gateway.application.emojis.fetch()

export function getFromName (name) {
  return emojis.find((i) => i.name === name)
}

export function getIdFromName (name) {
  return getFromName(name).id
}

export default function getMarkdownFromName (name, withSpace = false) {
  return `<:${name}:${getIdFromName(name)}>${withSpace ? ' ' : ''}`
}

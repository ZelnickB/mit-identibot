import { promises as fs } from 'fs'
import path from 'path'
import { dbClient } from './mongoClient.js'

const defaultConfigs = {
  user: JSON.parse(await fs.readFile(path.resolve(import.meta.dirname, './assets/defaultConfigs/user.json'), 'utf8'))
}

export const serverConfigCollection = dbClient.collection('config.servers')

export function getServerConfigDocument (id) {
  return serverConfigCollection.findOne({ _serverId: id })
}

export async function isServerConfigured (id) {
  return (await serverConfigCollection.countDocuments({ _serverId: id })) === 1
}

export function getConfiguredServersList () {
  return serverConfigCollection.distinct('_serverId')
}

export const userConfigCollection = dbClient.collection('config.users')

export function getUserConfigDocument (id) {
  return userConfigCollection.findOne({ _userId: id })
}

export function applyDefaults (defaults, setValues) {
  const result = structuredClone(defaults)
  for (const key in result) {
    if (setValues[key] !== undefined) {
      if (typeof setValues[key] === 'object' && !Array.isArray(setValues[key])) {
        result[key] = applyDefaults(defaults[key], setValues[key])
      } else {
        result[key] = setValues[key]
      }
    }
  }
  return result
}

export async function readUserConfig (id, withDefaults = true) {
  let config = await getUserConfigDocument(id).then(doc => {
    if (doc === null) return null
    return doc
  })
  if (config === null) return defaultConfigs.user
  if (withDefaults) {
    config = applyDefaults(defaultConfigs.user, config)
  }
  return config
}

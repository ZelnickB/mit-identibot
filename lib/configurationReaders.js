import { dbClient } from './mongoClient.js'

export function getServerConfigDocument (id) {
  return dbClient.collection('config.servers').findOne({ _serverId: id })
}

export async function isServerConfigured (id) {
  return (await dbClient.collection('config.servers').countDocuments({ _serverId: id })) === 1
}

export function getConfiguredServersList () {
  return dbClient.collection('config.servers').distinct('_serverId')
}


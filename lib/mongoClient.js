import * as mongo from 'mongodb'
import * as preferencesReader from '../lib/preferencesReader.js'

const config = await preferencesReader.config()
const secrets = await preferencesReader.secrets()

let userInfoComponent
if (config.mongodb.connection.username === undefined || secrets.mongodb.connectionPassword === undefined) {
  userInfoComponent = ''
} else {
  userInfoComponent = `${encodeURIComponent(config.mongodb.connection.username)}:${encodeURIComponent(secrets.mongodb.connectionPassword)}@`
}

export const client = new mongo.MongoClient(`mongodb://${userInfoComponent}${config.mongodb.connection.server}/${config.mongodb.connection.urlExtra}`, config.mongodb.connection.options)
export const dbClient = client.db(config.mongodb.dbName)

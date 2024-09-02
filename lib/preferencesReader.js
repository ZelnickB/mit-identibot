import * as path from 'path'
import * as fs from 'fs'
import * as yaml from 'yaml'
import { dbClient } from './mongoClient.js'

export async function config () {
  return yaml.parse(await fs.promises.readFile(path.resolve(import.meta.dirname, '../usr/config.yml'), 'utf8'))
}

export function configSync () {
  return yaml.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../usr/config.yml'), 'utf8'))
}

export async function secrets () {
  return yaml.parse(await fs.promises.readFile(path.resolve(import.meta.dirname, '../usr/secrets.yml'), 'utf8'))
}

export function secretsSync () {
  return yaml.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../usr/secrets.yml'), 'utf8'))
}

const configDb = dbClient.collection('config')
configDb.getDocumentByName = (name) => {
  return configDb.findOne({ _name: name }).then(doc => doc.data)
}

export { configDb }

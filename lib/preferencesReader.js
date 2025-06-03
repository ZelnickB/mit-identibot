import * as path from 'path'
import * as fs from 'fs'
import * as yaml from 'yaml'

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

export const cachedConfig = await config()
export const cachedSecrets = await secrets()

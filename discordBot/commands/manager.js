import * as path from 'path'
import { promises as fs } from 'fs'

export class CommandSet {
  #registryPath
  #logicPath
  #commandLogicMap

  constructor (registryPath, logicPath = path.join(path.dirname(registryPath), 'logic')) {
    this.#registryPath = registryPath
    this.#logicPath = logicPath
  }

  async getAppCommandObjects () {
    return JSON.parse(
      await fs.readFile(
        this.#registryPath,
        'utf8'
      )
    )
  }

  async getAppCommandNames () {
    return (await this.getAppCommandObjects()).map(x => x.name)
  }

  getAppCommand (name) {
    return this.#commandLogicMap[name]
  }

  autoRunCommand (interaction) {
    return this.getAppCommand(interaction.commandName)(interaction)
  }

  async importAll () {
    const commandNames = await this.getAppCommandNames()

    const importPromises = []
    for (const commandName of commandNames) {
      importPromises.push(
        import(path.join(this.#logicPath, `${commandName}.js`))
      )
    }

    this.#commandLogicMap = await Promise.all(importPromises).then(importedModulesArray => {
      const result = {}
      for (let i = 0; i < importedModulesArray.length; i++) {
        result[commandNames[i]] = importedModulesArray[i].default
      }
      return result
    })
    return this.#commandLogicMap
  }
}

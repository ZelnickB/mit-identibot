import * as path from 'path'
import { promises as fs } from 'fs'
import * as clients from '../lib/discordAPIClients.js'
import { CommandSet } from './commands/manager.js'

const ChatInputCommandSet = new CommandSet(path.join(import.meta.dirname, 'commands', 'ChatInput', 'registry.json'))
const UserCommandSet = new CommandSet(path.join(import.meta.dirname, 'commands', 'User', 'registry.json'))
await Promise.all([ChatInputCommandSet.importAll(), UserCommandSet.importAll()])

await clients.rest.put(
  clients.Routes.applicationCommands(clients.clientID),
  {
    body: [
      ...await ChatInputCommandSet.getAppCommandObjects(),
      ...await UserCommandSet.getAppCommandObjects()
    ]
  }
)

clients.gateway.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) ChatInputCommandSet.autoRunCommand(interaction)
  else if (interaction.isUserContextMenuCommand()) UserCommandSet.autoRunCommand(interaction)
})

fs.readdir(path.join(import.meta.dirname, 'events'), { withFileTypes: true }).then(files => {
  files = files
    .filter(c => c.isFile() && c.name.endsWith('.js'))
    .map((c) => path.join(c.parentPath, c.name))
  const importPromises = []
  const eventNames = []
  for (const c of files) {
    importPromises.push(import(c))
    eventNames.push(path.parse(c).name)
  }
  return Promise.all([Promise.all(importPromises), eventNames])
}).then(eventsAndHandlers => {
  if (eventsAndHandlers[0].length !== eventsAndHandlers[1].length) {
    throw new RangeError('Event name and handler module arrays have unequal lengths.')
  }
  for (let i = 0; i < eventsAndHandlers[0].length; i++) {
    clients.gateway.on(eventsAndHandlers[1][i], eventsAndHandlers[0][i].default)
  }
})

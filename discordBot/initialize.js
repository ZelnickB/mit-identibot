import * as path from 'path'
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

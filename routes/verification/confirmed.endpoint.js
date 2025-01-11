import * as path from 'path'
import { configSync } from '../../lib/preferencesReader.js'

export function get (req, res) {
  res.status(200).render(path.resolve(import.meta.dirname, 'endpointAssets', 'confirmed', 'ui.hbs'), {
    messageVariables: {
      whereServers: configSync().singleServerMessages ? 'this server' : 'all participating Discord servers'
    }
  })
}

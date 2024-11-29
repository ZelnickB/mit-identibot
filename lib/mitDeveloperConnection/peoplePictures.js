import * as preferencesReader from '../preferencesReader.js'

const config = await preferencesReader.config()
const secrets = await preferencesReader.secrets()

export async function get (identifier) {
  return fetch(
    `https://mit-people-pictures-v2.cloudhub.io/people/v2/pictures/${identifier}`,
    {
      headers: {
        client_id: config.mitDeveloperConnection.clientID,
        client_secret: secrets.mitDeveloperConnectionClientSecret
      }
    }
  ).then(res => {
    return res.body
  })
}

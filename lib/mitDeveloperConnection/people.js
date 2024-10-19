import * as preferencesReader from '../preferencesReader.js'

const config = await preferencesReader.config()
const secrets = await preferencesReader.secrets()

export class UserNotFoundError extends Error {
  constructor (kerb) {
    super(`Information about user with Kerberos identity ${kerb} was not found.`)
    this.name = this.constructor.name
  }
}

export async function getByKerberos (kerb) {
  return fetch(
    `https://mit-people-v3.cloudhub.io/people/v3/people/${kerb}`,
    {
      headers: {
        client_id: config.mitDeveloperConnection.clientID,
        client_secret: secrets.mitDeveloperConnectionClientSecret
      }
    }
  ).then(res => {
    if (res.status === 404) return Promise.reject(new UserNotFoundError(kerb))
    return res.json()
  }).then(responseJSON => responseJSON.item)
}

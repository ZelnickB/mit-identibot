import { BadGatewayError } from '../genericErrors.js'

export async function buildingQuery (query) {
  return fetch(`http://whereis.mit.edu/search?type=query&q=${query}&output=json`) // Using HTTPS here produces ERR_SSL_DH_KEY_TOO_SMALL
    .then(res => {
      if (!res.ok) return Promise.reject(new BadGatewayError())
      return res.json()
    })
}

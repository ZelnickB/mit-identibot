import { BadGatewayError } from '../../../lib/errors.js'

export class NoDirectoryResultsError extends Error {
  constructor (query) {
    super(`No results in directory for "${query}."`)
    this.name = this.constructor.name
  }
}

export async function directorySearch (query) {
  return fetch(`https://tlepeopledir.mit.edu/q/${query}`).then(res => {
    if (!res.ok) {
      return Promise.reject(new BadGatewayError(`Response returned status code ${res.status}.`))
    }
    return res.json()
  }).then(
    x => x.result
  )
}

export async function directoryDetail (emailAddress, emailDomain) {
  return fetch(`https://tlepeopledir.mit.edu/q/${emailAddress}?_format=json&m=i&d=${emailDomain}`).then(res => {
    if (!res.ok) {
      return Promise.reject(new BadGatewayError(`Response returned status code ${res.status}.`))
    }
    return res.json()
  }).then(
    x => x.result
  )
}

export async function detailSearch (query) {
  const searchResult = await directorySearch(query)
  if (searchResult.length > 0) {
    const detailResult = await directoryDetail(searchResult[0].email_id, searchResult[0].email_domain)
    return {
      search: searchResult[0],
      detail: detailResult[0]
    }
  } else {
    return Promise.reject(new NoDirectoryResultsError(query))
  }
}

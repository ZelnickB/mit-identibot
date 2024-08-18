import { BadGatewayError } from '../../../lib/errors.js'

export class NoDirectoryResultsError extends Error {
  constructor (query) {
    super(`No results in directory for "${query}."`)
    this.name = this.constructor.name
  }
}

export class MultipleDirectoryResultsError extends Error {
  constructor (query, results) {
    super(`Multiple results in directory for "${query}."`)
    this.name = this.constructor.name
    this.results = results
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

export async function detailSearch (query, retrieveAll = false) {
  const searchResult = await directorySearch(query)
  if (searchResult.length === 0) {
    return Promise.reject(new NoDirectoryResultsError(query))
  }
  if (searchResult.length > 1 && !retrieveAll) {
    return Promise.reject(new MultipleDirectoryResultsError(query, searchResult))
  }
  const results = []
  for (const r of searchResult) {
    const detailResult = await directoryDetail(r.email_id, r.email_domain)
    results.push({
      search: r,
      detail: detailResult[0]
    })
  }
  return results
}

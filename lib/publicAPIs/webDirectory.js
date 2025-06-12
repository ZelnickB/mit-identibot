import { BadGatewayError, EmbeddableError } from '../errorBases.js'

export class NoDirectoryResultsError extends EmbeddableError {
  constructor (query, { referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: `No results in directory for "${query}".`,
        embedMessage: `**There are no results in the public MIT directory for \`${query}\`.** The user may not exist, may have removed themselves from the public directory, or may be ineligible for inclusion in the directory.`,
        summaryMessage: 'No directory results',
        referenceNumber,
        code: 'IB-U.BA138FC5'
      },
      {
        cause
      }
    )
    this.name = this.constructor.name
  }
}

export class MultipleDirectoryResultsError extends EmbeddableError {
  constructor (query, results, { referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: `Multiple results in directory for "${query}".`,
        embedMessage: `**More than one user in the public MIT directory matches the query \`${query}\`.** Try using a more specific query.`,
        summaryMessage: 'Multiple directory results',
        referenceNumber,
        code: 'IB-U.C8FF0FB0'
      },
      {
        cause
      }
    )
    this.results = results
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

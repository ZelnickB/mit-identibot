import { BadGatewayError, EmbeddableError } from '../errorBases.js'

export class BuildingQueryNoResultsError extends EmbeddableError {
  constructor (query, { referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: `Building query "${query}" returned no results.`,
        embedMessage: `**The specified query, \`${query}\`, returned no building results.** Check that the query was inputted correctly.`,
        summaryMessage: 'Building not found',
        referenceNumber,
        code: 'IB-U.3AB7D712'
      },
      {
        cause
      }
    )
    this.name = this.constructor.name
  }
}

export async function buildingQuery (query, throwIfNoResults = false) {
  return fetch(`http://whereis.mit.edu/search?type=query&q=${query}&output=json`) // Using HTTPS here produces ERR_SSL_DH_KEY_TOO_SMALL
    .then(res => {
      if (!res.ok) return Promise.reject(new BadGatewayError())
      return res.json()
    })
    .then(data => {
      if (throwIfNoResults && data.length === 0) throw new BuildingQueryNoResultsError(query)
      return data
    })
}

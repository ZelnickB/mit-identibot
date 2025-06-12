import * as preferencesReader from '../preferencesReader.js'
import { EmbeddableError } from '../errorBases.js'

const config = await preferencesReader.config()
const secrets = await preferencesReader.secrets()

export class UserNotFoundError extends EmbeddableError {
  constructor (kerb, { referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: `Information about user with Kerberos identity ${kerb} was not found.`,
        embedMessage: `**IdentiBot could not retrieve information about the requested user.** The MIT system failed to return information on the user with Kerberos identity \`${kerb}\`. This may be a result of the user having directory suppression enabled or being newly created in the system.`,
        summaryMessage: 'Existent user not found',
        referenceNumber,
        code: 'IB-B.8041A968'
      },
      {
        cause
      }
    )
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
    if (res.status === 404 || res.status === 400) return Promise.reject(new UserNotFoundError(kerb))
    return res.json()
  }).then(responseJSON => responseJSON.item)
}

export function getAffiliationFromUserInfo (userInfo) {
  if (userInfo === undefined) return undefined
  return userInfo.affiliations[0].type
}

export async function getAffiliationFromKerberos (kerb) {
  return getAffiliationFromUserInfo(await getByKerberos(kerb))
}

export function getStudentYearFromUserInfo (userInfo) {
  if (userInfo === undefined) return undefined
  const reportedClassYear = userInfo.affiliations[0].classYear
  if (reportedClassYear === null) return 0
  else return reportedClassYear
}

export async function getStudentYearFromKerberos (kerb) {
  return getStudentYearFromUserInfo(await getByKerberos(kerb))
}

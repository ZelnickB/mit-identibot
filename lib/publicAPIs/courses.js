import { promises as fs } from 'fs'
import * as path from 'path'

import { BadGatewayError, EmbeddableError } from '../errorBases.js'

export class CourseNotFoundError extends EmbeddableError {
  constructor (course, { referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: `Course ${course} was not found.`,
        embedMessage: `**The MIT course catalog does not contain information about the requested course.** Check that the course number, \`${course}\`, was inputted correctly.`,
        summaryMessage: 'Course not found',
        referenceNumber,
        code: 'IB-U.BBAC647F'
      },
      {
        cause
      }
    )
    this.name = this.constructor.name
  }
}

export class UnknownPrefixError extends EmbeddableError {
  constructor (prefix, { referenceNumber, cause } = {}) {
    super(
      {
        errorMessage: `Course prefix "${prefix}" is unknown.`,
        embedMessage: `**The course prefix \`${prefix}\` is unknown.** Check that it was inputted correctly.`,
        summaryMessage: 'Unknown course prefix',
        referenceNumber,
        code: 'IB-U.ABC572EE'
      },
      {
        cause
      }
    )
    this.name = this.constructor.name
  }
}

export async function courseInformation (id) {
  return fetch(`https://fireroad.mit.edu//courses/lookup/${id}`).then(res => {
    if (res.status === 404) {
      return Promise.reject(new CourseNotFoundError(id))
    }
    if (!res.ok) {
      return Promise.reject(new BadGatewayError())
    }
    return res.json()
  })
}

export const departmentInformation = JSON.parse(await fs.readFile(path.resolve(import.meta.dirname, '../assets/departmentInfo.json'), 'utf8'))

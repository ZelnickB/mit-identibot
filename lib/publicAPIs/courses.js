import { promises as fs } from 'fs'
import * as path from 'path'
import { BadGatewayError } from '../genericErrors.js'

export class CourseNotFoundError extends Error {
  constructor (course) {
    super(`Course ${course} not found.`)
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

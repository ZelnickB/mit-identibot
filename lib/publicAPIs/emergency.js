import fs from 'fs'
import path from 'path'

export async function getContacts () {
  return fetch('https://m.mit.edu/apis/emergency_info/contacts')
    .then(response => response.json())
}

export async function currentEmergencyMessage () {
  return fetch('https://m.mit.edu/apis/emergency_info/announcement')
    .then(response => response.json())
    .then(messageJSON => {
      if (messageJSON.announcement_text === 'There is currently no major emergency on campus.') return null
      else return messageJSON
    })
}

export const hardcodedEmergencyContactInformation = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../assets/emergencyContacts.json'), 'utf8'))

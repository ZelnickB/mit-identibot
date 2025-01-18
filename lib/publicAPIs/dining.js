import _ from 'lodash'
import { DateTime } from 'luxon'
import { config } from '../preferencesReader.js'
import { dbClient } from '../mongoClient.js'

const cacheEnabled = (await config()).caching.dining
const diningCache = dbClient.collection('cache.dining')

export function getVenueFullName (shortName) {
  switch (shortName) {
    case 'Maseeh': return 'Maseeh Hall (W1)'
    case 'McCormick': return 'McCormick Hall (W4)'
    case 'Baker': return 'Baker Hall (W7)'
    case 'New Vassar': return 'New Vassar (W46)'
    case 'Next': return 'Next House (W71)'
    case 'Simmons': return 'Simmons Hall (W79)'
  }
}

export async function getTodayDiningInfo (withCache) {
  if (withCache === undefined) withCache = cacheEnabled
  let saveToCache = false
  const currentDay = DateTime.now().setZone('America/New_York').startOf('day').toJSDate()
  if (withCache) {
    if (await diningCache.countDocuments({ _date: currentDay }) >= 1) {
      return diningCache.findOne({ _date: currentDay })
    } else {
      saveToCache = true
    }
  }
  return fetch('https://m.mit.edu/apis/dining/')
    .then(response => response.json())
    .then(async diningJSON => {
      diningJSON = {
        _date: currentDay,
        ...diningJSON
      }
      if (saveToCache) {
        await diningCache.insertOne(diningJSON)
      }
      return diningJSON
    })
}

export async function getMealInfo (venue, meal, withCache) {
  const currentDay = DateTime.now().setZone('America/New_York')
  const diningInfo = await getTodayDiningInfo(withCache)
  let venueInfo = [...diningInfo.venues.house, ...diningInfo.venues.retail]
  venueInfo = _.find(venueInfo, v => v.name === venue)
  let mealInfo = _.find(venueInfo.meals_by_day, m => m.date === currentDay.toFormat('LL/dd/yyyy'))
  mealInfo = _.find(mealInfo.meals, m => m.name === meal)
  return mealInfo
}

export function parseMenu (mealInfo) {
  if (mealInfo === undefined) return undefined
  return _.groupBy(mealInfo.items, 'station')
}

export async function getMenu (venue, meal, withCache) {
  return parseMenu(await getMealInfo(venue, meal, withCache))
}

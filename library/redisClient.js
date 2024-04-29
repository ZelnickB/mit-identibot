const redis = require('redis')

const preferences = require('./preferences')

const client = redis.createClient({
  url: preferences.redis.url
})
client.connect()
module.exports = client

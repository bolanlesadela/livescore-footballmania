require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  API_KEY: process.env.FOOTBALL_API_KEY,
  BASE_URL: 'https://api.football-data.org/v4',
  CACHE_TTL_MS: 60 * 1000,         // fresh for 1 minute
  STALE_MAX_MS: 10 * 60 * 1000,    // keep old copies 10 more minutes as backup
  MAX_CALLS_PER_MINUTE: 9,         // provider allows 10, keep 1 spare
};
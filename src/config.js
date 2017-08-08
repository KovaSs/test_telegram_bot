const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const env = process.env;

module.exports = {
  TOKEN: env.TELEGRAM_TOKEN || env.HD_TELEGRAM_TOKEN,
  DB_URL: env.DB_URL || env.HD_DB_URL
}
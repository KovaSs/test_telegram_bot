// const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const mongoose = require('mongoose');
const config = require('./config')
const helpers = require('./helpers')
const keyboard = require('./keyboard')
const { ACTION_TYPE } = require('./constants')
const kb = require('./keyboard-btns')
const bot = require('./bot')

// Server
const app = express();
app.use(express.static(__dirname + '/public'));
app.use('/', function(req,res) {
  res.sendFile(__dirname + '/index.html');
})
app.listen(process.env.PORT || 5000);

/** Connecting for Mongo Database */
mongoose.connect(config.DB_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
})
.then(() => console.log('💾 Mongo DB. Connected...'))
.catch((err) => console.log('❌Mongo DB. Error', err))

// Bot controllers
bot.on('message', (msg) => {
  const chatId = helpers.getMessageChatId(msg);
  const userId = helpers.getMsgTelegramId(msg);
  console.log('message', chatId, msg.text)

  switch (msg.text) {
    case kb.home.favourite:
      helpers.showFavouriteFilms(chatId, userId)
      break;
    case kb.home.films:
      bot.sendMessage(chatId, 'Выберите жанр', {
        reply_markup: { keyboard: keyboard.films }
      })
      break;
    case kb.home.cinemas:
      bot.sendMessage(chatId, 'Отправьте местоположение', {
        reply_markup: { keyboard: keyboard.cinemas }
      })
      break;
    case kb.film.action:
      helpers.sendsFilmsByQuery(chatId, { type: 'action' });
      break;
    case kb.film.comedy:
      helpers.sendsFilmsByQuery(chatId, { type: 'comedy' });
      break;
    case kb.film.random:
      helpers.sendsFilmsByQuery(chatId, {});
      break;
    case kb.back:
      bot.sendMessage(chatId, 'Что хотите посмотреть?', {
        reply_markup: { keyboard: keyboard.home }
      })
      break;
  }

  if (msg.location) {
    helpers.getCinemasInCord(chatId, msg.location)
  }
})

bot.on('callback_query', (query) => {
  const userId = query.from.id;
  const action = helpers.parseData(query.data);

  switch (action.type) {
    case ACTION_TYPE.SHOW_CINEMAS:
      helpers.showCinemasByQuery(userId, action.cinemaUuids)
      break;
    case ACTION_TYPE.SHOW_CINEMAS_MAP:
      bot.sendLocation(query.message.chat.id, action.lat, action.lot)
      break;
    case ACTION_TYPE.TOGGLE_FAV_FILMS:
      helpers.toggleFavouriteFilm(query.from, query.id, action);
      break;
    case ACTION_TYPE.SHOW_FILMS:
      helpers.sendsFilmsByQuery(userId, {uuid:{'$in': action.filmsUuid}});
      break;
  }
})

bot.on('inline_query', (query) => {
  helpers.showFilmsInInlineSearch(query.id);
})

bot.onText(/\/start/, (msg) => {
  const chatId = helpers.getMessageChatId(msg);
  const text = `Здравствуйте, ${msg.from.first_name}\nВыберите команду для начала работы:`
  bot.sendMessage(chatId, text, {
    reply_markup: { keyboard: keyboard.home }
  })
})

bot.onText(/\/f(.+)/, (msg, [source]) => {
  const filmId = helpers.getItemUUid(source);
  helpers.getFilmByUuid(msg, filmId);
})

bot.onText(/\/c(.+)/, (msg, [source]) => {
  const chatId = helpers.getMessageChatId(msg);
  const cinemaId = helpers.getItemUUid(source);
  helpers.getCinemaByUuid(chatId, cinemaId);
})

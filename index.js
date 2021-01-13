require('dotenv').config();

const { Telegraf } = require('telegraf');
const Parser = require('rss-parser');
const { html } = require('common-tags');
const striptags = require('striptags');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start(startWatchFeed);
bot.launch();

/**
 * Watches the RSS feed and sends Telegram message for each item.
 * 
 * @param {object} ctx Telegraf library context
 */
async function startWatchFeed(ctx) {
  try {
    const feed = await new Parser().parseURL(process.env.FEED_URL);

    for (const item of feed.items) {
      if (new Date(item.pubDate) < dateSinceLastUpdate()) {
        break;
      }

      ctx.telegram.sendMessage(process.env.CHAT_ID, buildMessage(item), {parse_mode: 'HTML'});
    }
  } catch (e) {
    console.error(e);
    ctx.reply('Не удалось загрузить ленту');
  }

  setTimeout(startWatchFeed, process.env.UPDATE_PERIOD_MILLISECONDS, ctx);
}

/**
 * Returns the date since last update period
 * 
 * @returns {Date} date
 */
function dateSinceLastUpdate() {
  const date = new Date();
  date.setTime(date.getTime() - process.env.UPDATE_PERIOD_MILLISECONDS);
  return date;
}

/**
 * Builds Telegram message
 * 
 * @param {object} item of RSS feed 
 */
function buildMessage({link, title, content}) {
  return html`
    <b>Мероприятие</b>

    <a href='${link}'>${title}</a>

    ${stripHtmlTags(content.trim())}
  `;
}

/**
 * Keeps only Telegram supported tags and strips unsupported tags
 * 
 * @param {string} html 
 */
function stripHtmlTags(html) {
  return striptags(html, ['b', 'strong', 'i', 's', 'u', 'a']);
}

require('dotenv').config();

const { Telegraf } = require('telegraf');
const Parser = require('rss-parser');
const { html } = require('common-tags');
const striptags = require('striptags');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start(startWatchFeed);
bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

/**
 * Watches the RSS feed and sends Telegram message for each item.
 * 
 * @param {object} ctx Telegraf library context
 */
async function startWatchFeed(ctx) {
  try {
    const feed = await new Parser().parseURL(process.env.FEED_URL);
    const itemsToPublish = getItemsToPublish(feed.items);
    
    itemsToPublish.forEach((item) =>
      ctx.telegram.sendMessage(process.env.CHAT_ID, buildMessage(item), {
        parse_mode: 'HTML',
      })
    );
  } catch (e) {
    console.error(e);
    ctx.reply('Не удалось загрузить ленту');
  }

  setTimeout(startWatchFeed, process.env.UPDATE_PERIOD_MILLISECONDS, ctx);
}

/**
 * Returns filtered items to publish by pubDate and update period
 * 
 * @param {array} items RSS feed items 
 * @param {array} itemsToPublish filtered items to publish
 * 
 * @returns {array} items
 */
function getItemsToPublish([firstItem, ...items], itemsToPublish = []) {
  const isBreak = new Date(firstItem.pubDate) < dateSinceLastUpdate();
  
  if (isBreak) {
    return itemsToPublish;
  } else {
    return getItemsToPublish(items, [firstItem, ...itemsToPublish]);
  }
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

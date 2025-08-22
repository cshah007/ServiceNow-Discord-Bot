require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const fetch = require('node-fetch');

const token = process.env.DISCORD_TOKEN;
const ingestUrl = process.env.SN_INGEST_URL;
const snApiKey = process.env.SN_API_KEY;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const payload = {
    message_id: message.id,
    channel_id: message.channel.id,
    channel_name: message.channel?.name || '',
    author_id: message.author.id,
    author_name: message.author.username,
    content: message.content || '',
    message_ts: new Date(message.createdTimestamp).toISOString(),
    raw: {
      attachments: message.attachments?.map?.(a => ({ url: a.url, name: a.name })),
      embeds: message.embeds,
      mentions: {
        users: message.mentions.users.map(u => u.id),
        roles: message.mentions.roles.map(r => r.id)
      }
    }
  };

  try {
    const res = await fetch(ingestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': snApiKey
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('ServiceNow ingest failed:', res.status, text);
    }
  } catch (err) {
    console.error('Ingest error:', err);
  }
});

client.login(token);
const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require("discord.js");

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMembers
]
});

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
console.error("DISCORD_TOKEN není nastavený!");
process.exit(1);
}

const STAFF_ROLES = [
"👑 Hlavní administrátor",
"🔴 Senior administrátor",
"🟠 Administrátor",
"🟡 Junior administrátor",
"⚪ Zkušební administrátor"
];

function staffPermissions(guild) {
const permissions = [
{
id: guild.roles.everyone.id,
deny: [
PermissionsBitField.Flags.ViewChannel
]
}
];

for (const roleName of STAFF_ROLES) {
const role = guild.roles.cache.find(
role => role.name === roleName
);

```
if (role) {
  permissions.push({
    id: role.id,
    allow: [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.ReadMessageHistory
    ]
  });
}
```

}

return permissions;
}

async function createCategory(guild, name, permissions) {
let category = guild.channels.cache.find(
channel =>
channel.type === ChannelType.GuildCategory &&
channel.name === name
);

if (!category) {
category = await guild.channels.create({
name: name,
type: ChannelType.GuildCategory,
permissionOverwrites: permissions
});
}

return category;
}

async function createChannel(guild, name, category, permissions) {
let channel = guild.channels.cache.find(
channel =>
channel.type === ChannelType.GuildText &&
channel.name === name
);

if (!channel) {
channel = await guild.channels.create({
name: name,
type: ChannelType.GuildText,
parent: category.id,
permissionOverwrites: permissions
});
}

return channel;
}

async function createVoiceChannel(guild, name, category, permissions) {
let channel = guild.channels.cache.find(
channel =>
channel.type === ChannelType.GuildVoice &&
channel.name === name
);

if (!channel) {
channel = await guild.channels.create({
name: name,
type: ChannelType.GuildVoice,
parent: category.id,
permissionOverwrites: permissions
});
}

return channel;
}

async function setupServer(guild) {
console.log("Začínám nastavovat server:", guild.name);

const publicCategory = await createCategory(
guild,
"🏛️・IMPERIAL"
);

await createChannel(
guild,
"📢・oznámení",
publicCategory
);

await createChannel(
guild,
"🎉・eventy",
publicCategory
);

await createChannel(
guild,
"📜・pravidla",
publicCategory
);

await createChannel(
guild,
"📰・novinky",
publicCategory
);

await createChannel(
guild,
"💬・chat",
publicCategory
);

const notificationCategory = await createCategory(
guild,
"🔔・OZNÁMENÍ"
);

await createChannel(
guild,
"🎉・eventy-oznámení",
notificationCategory
);

await createChannel(
guild,
"📢・server-oznámení",
notificationCategory
);

await createChannel(
guild,
"🚨・rm-oznámení",
notificationCategory
);

const ticketCategory = await createCategory(
guild,
"🎫・TICKETY"
);

await createChannel(
guild,
"🎫・ticket",
ticketCategory
);

await createChannel(
guild,
"🏠・koupení-domu",
ticketCategory
);

const staffCategory = await createCategory(
guild,
"🛡️・ADMIN TEAM",
staffPermissions(guild)
);

await createChannel(
guild,
"💬・admin-chat",
staffCategory,
staffPermissions(guild)
);

await createChannel(
guild,
"📋・zápis-trestů",
staffCategory,
staffPermissions(guild)
);

await createChannel(
guild,
"⚠️・warny",
staffCategory,
staffPermissions(guild)
);

await createChannel(
guild,
"🔨・bany",
staffCategory,
staffPermissions(guild)
);

const adminCalls = await createCategory(
guild,
"🔊・ADMIN CALLS",
staffPermissions(guild)
);

await createVoiceChannel(
guild,
"AT1",
adminCalls,
staffPermissions(guild)
);

await createVoiceChannel(
guild,
"AT2",
adminCalls,
staffPermissions(guild)
);

await createVoiceChannel(
guild,
"AT3",
adminCalls,
staffPermissions(guild)
);

await createVoiceChannel(
guild,
"AT5",
adminCalls,
staffPermissions(guild)
);

await createVoiceChannel(
guild,
"AT6",
adminCalls,
staffPermissions(guild)
);

const managementCategory = await createCategory(
guild,
"👑・VEDENÍ",
[
{
id: guild.roles.everyone.id,
deny: [
PermissionsBitField.Flags.ViewChannel
]
}
]
);

await createChannel(
guild,
"👑・vedení-chat",
managementCategory
);

await createVoiceChannel(
guild,
"👑・vedení-call",
managementCategory
);

console.log("Server byl úspěšně nastaven!");
}

client.once("ready", async () => {
console.log("================================");
console.log("🤖 Imperial bot je ONLINE");
console.log("👤 Bot:", client.user.tag);
console.log("================================");

for (const guild of client.guilds.cache.values()) {
try {
await setupServer(guild);
} catch (error) {
console.error(
"Chyba při nastavování serveru:",
error
);
}
}
});

client.on("error", error => {
console.error("Discord chyba:", error);
});

process.on("unhandledRejection", error => {
console.error("Unhandled Rejection:", error);
});

process.on("uncaughtException", error => {
console.error("Uncaught Exception:", error);
});

client.login(TOKEN);

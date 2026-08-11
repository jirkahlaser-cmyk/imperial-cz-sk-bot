const {
Client,
GatewayIntentBits,
ChannelType,
PermissionsBitField,
EmbedBuilder,
ActionRowBuilder,
StringSelectMenuBuilder,
ButtonBuilder,
ButtonStyle,
ModalBuilder,
TextInputBuilder,
TextInputStyle
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
console.error("❌ DISCORD_TOKEN není nastavený v Railway.");
process.exit(1);
}

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMembers
]
});

const DATA_FILE = path.join(__dirname, "punishments.json");

let data = {
warns: {},
bans: []
};

try {
if (fs.existsSync(DATA_FILE)) {
data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
} catch (error) {
console.error("❌ Chyba při načítání dat.");
}

function saveData() {
try {
fs.writeFileSync(
DATA_FILE,
JSON.stringify(data, null, 2)
);
} catch (error) {
console.error("❌ Chyba při ukládání dat:", error);
}
}

const STAFF_ROLES = [
"👑 Hlavní administrátor",
"🔴 Senior administrátor",
"🟠 Administrátor",
"🟡 Junior administrátor",
"⚪ Zkušební administrátor"
];

function isStaff(member) {
return member.roles.cache.some(role =>
STAFF_ROLES.includes(role.name)
);
}

async function getOrCreateCategory(guild, name) {
let category = guild.channels.cache.find(
channel =>
channel.type === ChannelType.GuildCategory &&
channel.name === name
);

if (!category) {
category = await guild.channels.create({
name,
type: ChannelType.GuildCategory
});
}

return category;
}

async function getOrCreateChannel(
guild,
name,
category,
options = {}
) {
let channel = guild.channels.cache.find(
channel =>
channel.type === ChannelType.GuildText &&
channel.name === name
);

if (!channel) {
channel = await guild.channels.create({
name,
type: ChannelType.GuildText,
parent: category.id,
...options
});
}

return channel;
}

async function setupServer(guild) {
console.log(`⚙️ Nastavuji server: ${guild.name}`);

const ticketCategory =
await getOrCreateCategory(
guild,
"🎫・TICKETY"
);

const ticketChannel =
await getOrCreateChannel(
guild,
"🎫・ticket",
ticketCategory
);

const punishmentCategory =
await getOrCreateCategory(
guild,
"🛡️・TRESTY"
);

const punishmentChannel =
await getOrCreateChannel(
guild,
"📋・zapis-trestu",
punishmentCategory
);

const logCategory =
await getOrCreateCategory(
guild,
"📑・TRESTOVE LOGY"
);

const warnChannel =
await getOrCreateChannel(
guild,
"⚠️・warny",
logCategory
);

const banChannel =
await getOrCreateChannel(
guild,
"🔨・bany",
logCategory
);

await sendTicketPanel(ticketChannel);
await sendPunishmentPanel(punishmentChannel);

if (!warnChannel.topic) {
await warnChannel.setTopic(
"Automatické logy WARN trestů."
);
}

if (!banChannel.topic) {
await banChannel.setTopic(
"Automatické logy BAN trestů."
);
}

console.log(
`✅ Server připraven: ${guild.name}`
);
}

async function sendTicketPanel(channel) {
const messages = await channel.messages.fetch({
limit: 30
});

const exists = messages.some(
message =>
message.author.id === client.user.id &&
message.embeds[0]?.title ===
"🎫 Imperial Ticket Centrum"
);

if (exists) return;

const menu =
new StringSelectMenuBuilder()
.setCustomId("imperial_ticket")
.setPlaceholder(
"🎫 Vyber typ ticketu"
)
.addOptions([
{
label: "Stížnost na admina",
value: "admin",
emoji: "🚨"
},
{
label: "Mafie 1",
value: "mafia1",
emoji: "🕵️"
},
{
label: "Mafie 2",
value: "mafia2",
emoji: "🕵️"
},
{
label: "Mafie 3",
value: "mafia3",
emoji: "🕵️"
},
{
label: "Stížnost na hráče",
value: "player",
emoji: "👤"
},
{
label: "Žádost o unban",
value: "unban",
emoji: "🔓"
},
{
label: "Jiný požadavek",
value: "other",
emoji: "📋"
}
]);

const embed =
new EmbedBuilder()
.setTitle(
"🎫 Imperial Ticket Centrum"
)
.setDescription(
"Potřebuješ pomoc, chceš něco nahlásit nebo požádat o unban?\n\n" +
"Vyber správnou možnost z nabídky níže.\n\n" +
"🚨 Stížnost na admina\n" +
"🕵️ Mafie 1 / 2 / 3\n" +
"👤 Stížnost na hráče\n" +
"🔓 Žádost o unban\n" +
"📋 Jiný požadavek\n\n" +
"Po výběru ti bot vytvoří soukromý ticket."
)
.setColor(0x5865f2)
.setFooter({
text:
"Imperial CZ/SK RP • Ticket System"
});

await channel.send({
embeds: [embed],
components: [
new ActionRowBuilder()
.addComponents(menu)
]
});
}

async function sendPunishmentPanel(channel) {
const messages = await channel.messages.fetch({
limit: 30
});

const exists = messages.some(
message =>
message.author.id === client.user.id &&
message.embeds[0]?.title ===
"🛡️ Imperial Trestový systém"
);

if (exists) return;

const menu =
new StringSelectMenuBuilder()
.setCustomId(
"imperial_punishment"
)
.setPlaceholder(
"🛡️ Vyber typ trestu"
)
.addOptions([
{
label: "WARN",
value: "warn",
emoji: "⚠️"
},
{
label: "BAN",
value: "ban",
emoji: "🔨"
}
]);

const embed =
new EmbedBuilder()
.setTitle(
"🛡️ Imperial Trestový systém"
)
.setDescription(
"Administrátorský systém pro evidenci trestů.\n\n" +
"⚠️ **WARN**\n" +
"Zapíše varování hráče.\n\n" +
"🔨 **BAN**\n" +
"Zapíše ban a jeho délku.\n\n" +
"Všechny tresty se automaticky uloží do příslušného logu."
)
.setColor(0xe67e22);

await channel.send({
embeds: [embed],
components: [
new ActionRowBuilder()
.addComponents(menu)
]
});
}

async function createTicket(interaction) {
const existing =
interaction.guild.channels.cache.find(
channel =>
channel.type === ChannelType.GuildText &&
channel.topic ===
`ticket-owner:${interaction.user.id}`
);

if (existing) {
return interaction.reply({
content:
`❌ Už máš otevřený ticket: ${existing}`,
ephemeral: true
});
}

const category =
await getOrCreateCategory(
interaction.guild,
"🎫・OTEVRENE TICKETY"
);

const names = {
admin: "stiznost-admin",
mafia1: "mafia-1",
mafia2: "mafia-2",
mafia3: "mafia-3",
player: "stiznost-hrac",
unban: "zadost-unban",
other: "jiny-ticket"
};

const channel =
await interaction.guild.channels.create({
name:
`${names[interaction.values[0]]}-${interaction.user.username}`
.toLowerCase()
.replace(/[^a-z0-9-_]/g, ""),
type: ChannelType.GuildText,
parent: category.id,
topic:
`ticket-owner:${interaction.user.id}`,
permissionOverwrites: [
{
id:
interaction.guild.roles.everyone.id,
deny: [
PermissionsBitField.Flags.ViewChannel
]
},
{
id: interaction.user.id,
allow: [
PermissionsBitField.Flags.ViewChannel,
PermissionsBitField.Flags.SendMessages,
PermissionsBitField.Flags.ReadMessageHistory
]
}
]
});

for (const role of interaction.guild.roles.cache.values()) {
if (STAFF_ROLES.includes(role.name)) {
await channel.permissionOverwrites.edit(
role.id,
{
ViewChannel: true,
SendMessages: true,
ReadMessageHistory: true
}
);
}
}

const close =
new ButtonBuilder()
.setCustomId("close_ticket")
.setLabel("🔒 Zavřít ticket")
.setStyle(ButtonStyle.Danger);

const embed =
new EmbedBuilder()
.setTitle("🎫 Ticket vytvořen")
.setDescription(
"Vítej v ticketu Imperial CZ/SK RP.\n\n" +
"Popiš svůj problém co nejpodrobněji.\n" +
"Staff se ti bude věnovat."
)
.setColor(0x5865f2);

await channel.send({
content: `${interaction.user}`,
embeds: [embed],
components: [
new ActionRowBuilder()
.addComponents(close)
]
});

await interaction.reply({
content:
`✅ Ticket byl vytvořen: ${channel}`,
ephemeral: true
});
}

async function handlePunishment(interaction) {
if (!isStaff(interaction.member)) {
return interaction.reply({
content:
"❌ K této funkci nemáš oprávnění.",
ephemeral: true
});
}

const type = interaction.values[0];

if (type === "warn") {
const modal =
new ModalBuilder()
.setCustomId("warn_modal")
.setTitle("⚠️ Udělit WARN");

```
const roblox =
  new TextInputBuilder()
    .setCustomId("roblox")
    .setLabel("Roblox jméno")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

const reason =
  new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Důvod WARNu")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

modal.addComponents(
  new ActionRowBuilder()
    .addComponents(roblox),
  new ActionRowBuilder()
    .addComponents(reason)
);

return interaction.showModal(modal);
```

}

if (type === "ban") {
const modal =
new ModalBuilder()
.setCustomId("ban_modal")
.setTitle("🔨 Zapsat BAN");

```
const roblox =
  new TextInputBuilder()
    .setCustomId("roblox")
    .setLabel("Roblox jméno")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

const reason =
  new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Důvod BANu")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

const days =
  new TextInputBuilder()
    .setCustomId("days")
    .setLabel("Počet dní")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("Např. 3");

modal.addComponents(
  new ActionRowBuilder()
    .addComponents(roblox),
  new ActionRowBuilder()
    .addComponents(reason),
  new ActionRowBuilder()
    .addComponents(days)
);

return interaction.showModal(modal);
```

}
}

async function handleWarn(interaction) {
const roblox =
interaction.fields.getTextInputValue(
"roblox"
);

const reason =
interaction.fields.getTextInputValue(
"reason"
);

const key = roblox.toLowerCase();

if (!data.warns[key]) {
data.warns[key] = [];
}

data.warns[key].push({
roblox,
reason,
moderator: interaction.user.tag,
moderatorId: interaction.user.id,
date: new Date().toISOString()
});

saveData();

const count = data.warns[key].length;

const log =
interaction.guild.channels.cache.find(
channel =>
channel.name === "⚠️・warny"
);

if (log) {
const embed =
new EmbedBuilder()
.setTitle(`⚠️ WARN #${count}`)
.addFields(
{
name: "🎮 Roblox hráč",
value: roblox,
inline: true
},
{
name: "🛡️ Udělil",
value: interaction.user.toString(),
inline: true
},
{
name: "📊 WARN",
value: `${count}/3`,
inline: true
},
{
name: "📝 Důvod",
value: reason
}
)
.setColor(0xffa500)
.setTimestamp();

```
await log.send({
  embeds: [embed]
});
```

}

if (count >= 3) {
const staffChat =
interaction.guild.channels.cache.find(
channel =>
channel.name ===
"🛡️・staff-chat"
);

```
if (staffChat) {
  await staffChat.send({
    embeds: [
      new EmbedBuilder()
        .setTitle(
          "🚨 3 WARNY — UPOZORNĚNÍ"
        )
        .setDescription(
          `Hráč **${roblox}** dosáhl 3 WARNů.\n\n` +
          "Podle nastavení serveru má následovat **BAN na 3 dny**."
        )
        .setColor(0xff0000)
        .setTimestamp()
    ]
  });
}
```

}

await interaction.reply({
content:
`✅ WARN zapsán.\n` +
`🎮 Hráč: **${roblox}**\n` +
`⚠️ WARNY: **${count}/3**`,
ephemeral: true
});
}

async function handleBan(interaction) {
const roblox =
interaction.fields.getTextInputValue(
"roblox"
);

const reason =
interaction.fields.getTextInputValue(
"reason"
);

const daysText =
interaction.fields.getTextInputValue(
"days"
);

const days = Number(daysText);

if (
!Number.isInteger(days) ||
days < 1 ||
days > 3650
) {
return interaction.reply({
content:
"❌ Počet dní musí být celé číslo od 1 do 3650.",
ephemeral: true
});
}

const ban = {
id: data.bans.length + 1,
roblox,
reason,
days,
moderator: interaction.user.tag,
moderatorId: interaction.user.id,
date: new Date().toISOString()
};

data.bans.push(ban);
saveData();

const log =
interaction.guild.channels.cache.find(
channel =>
channel.name === "🔨・bany"
);

if (log) {
const embed =
new EmbedBuilder()
.setTitle(
`🔨 BAN #${ban.id}`
)
.addFields(
{
name: "🎮 Roblox hráč",
value: roblox,
inline: true
},
{
name: "🛡️ Udělil",
value: interaction.user.toString(),
inline: true
},
{
name: "⏱️ Délka",
value: `${days} dní`,
inline: true
},
{
name: "📝 Důvod",
value: reason
}
)
.setColor(0xff0000)
.setTimestamp();

```
await log.send({
  embeds: [embed]
});
```

}

await interaction.reply({
content:
`✅ BAN zapsán.\n` +
`🎮 Hráč: **${roblox}**\n` +
`🔨 Délka: **${days} dní**`,
ephemeral: true
});
}

client.once("ready", async () => {
console.log(
`✅ Bot je online jako ${client.user.tag}`
);

for (const guild of client.guilds.cache.values()) {
try {
await setupServer(guild);
} catch (error) {
console.error(
`❌ Chyba při setupu ${guild.name}:`,
error
);
}
}
});

client.on(
"interactionCreate",
async interaction => {
try {

```
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId ===
      "imperial_ticket"
  ) {
    return await createTicket(
      interaction
    );
  }

  if (
    interaction.isButton() &&
    interaction.customId ===
      "close_ticket"
  ) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({
        content:
          "❌ Ticket může zavřít pouze Staff.",
        ephemeral: true
      });
    }

    await interaction.reply({
      content:
        "🔒 Ticket bude uzavřen za 5 sekund."
    });

    setTimeout(() => {
      interaction.channel
        .delete()
        .catch(() => {});
    }, 5000);

    return;
  }

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId ===
      "imperial_punishment"
  ) {
    return await handlePunishment(
      interaction
    );
  }

  if (
    interaction.isModalSubmit() &&
    interaction.customId ===
      "warn_modal"
  ) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({
        content:
          "❌ Nemáš oprávnění.",
        ephemeral: true
      });
    }

    return await handleWarn(
      interaction
    );
  }

  if (
    interaction.isModalSubmit() &&
    interaction.customId ===
      "ban_modal"
  ) {
    if (!isStaff(interaction.member)) {
      return interaction.reply({
        content:
          "❌ Nemáš oprávnění.",
        ephemeral: true
      });
    }

    return await handleBan(
      interaction
    );
  }

} catch (error) {
  console.error(
    "❌ Interaction error:",
    error
  );

  if (!interaction.replied &&
      !interaction.deferred) {
    await interaction.reply({
      content:
        "❌ Nastala chyba. Zkus to znovu.",
      ephemeral: true
    }).catch(() => {});
  }
}
```

}
);

process.on(
"unhandledRejection",
error => {
console.error(
"❌ Unhandled rejection:",
error
);
}
);

process.on(
"uncaughtException",
error => {
console.error(
"❌ Uncaught exception:",
error
);
}
);

client.login(TOKEN);

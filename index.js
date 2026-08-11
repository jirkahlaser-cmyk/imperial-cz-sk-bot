const {
Client,
GatewayIntentBits,
ChannelType,
PermissionFlagsBits,
EmbedBuilder,
ActionRowBuilder,
StringSelectMenuBuilder,
StringSelectMenuOptionBuilder,
SlashCommandBuilder,
REST,
Routes
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
console.error("CHYBI DISCORD_TOKEN V RAILWAY VARIABLES");
process.exit(1);
}

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMembers
]
});

/* =========================================================
ROLE
========================================================= */

const ROLES = {
member: ["Člen", "#5865F2"],
admin: ["Admin", "#E74C3C"],
moderator: ["Moderátor", "#F1C40F"],
management: ["Vedení", "#9B59B6"],
owner: ["Majitel", "#FFD700"],

pd: ["🚔 PD", "#3498DB"],
fire: ["🚒 Hasiči", "#E74C3C"],
ems: ["🚑 Záchranáři", "#2ECC71"],
civilian: ["👤 Civilista", "#95A5A6"],

event: ["🔔 Eventy", "#2ECC71"],
announcements: ["📢 Oznámení", "#3498DB"],
rm: ["📣 RM Oznámení", "#9B59B6"],

at1: ["AT1", "#7289DA"],
at2: ["AT2", "#7289DA"],
at3: ["AT3", "#7289DA"],
at5: ["AT5", "#7289DA"],
at6: ["AT6", "#7289DA"]
};

async function getRole(guild, key) {
const [name, color] = ROLES[key];

let role = guild.roles.cache.find(r => r.name === name);

if (!role) {
role = await guild.roles.create({
name,
color,
reason: "Imperial CZ/SK server setup"
});
}

return role;
}

/* =========================================================
CHANNEL HELPERS
========================================================= */

async function getCategory(guild, name) {
let category = guild.channels.cache.find(
c =>
c.type === ChannelType.GuildCategory &&
c.name === name
);

if (!category) {
category = await guild.channels.create({
name,
type: ChannelType.GuildCategory
});
}

return category;
}

async function getText(guild, name, category) {
let channel = guild.channels.cache.find(
c =>
c.type === ChannelType.GuildText &&
c.name === name &&
c.parentId === category.id
);

if (!channel) {
channel = await guild.channels.create({
name,
type: ChannelType.GuildText,
parent: category.id
});
}

return channel;
}

async function getVoice(guild, name, category) {
let channel = guild.channels.cache.find(
c =>
c.type === ChannelType.GuildVoice &&
c.name === name &&
c.parentId === category.id
);

if (!channel) {
channel = await guild.channels.create({
name,
type: ChannelType.GuildVoice,
parent: category.id
});
}

return channel;
}

/* =========================================================
PERMISSIONS
========================================================= */

function hideEveryone(guild) {
return {
id: guild.roles.everyone.id,
deny: [PermissionFlagsBits.ViewChannel]
};
}

function textAccess(role) {
return {
id: role.id,
allow: [
PermissionFlagsBits.ViewChannel,
PermissionFlagsBits.SendMessages,
PermissionFlagsBits.ReadMessageHistory,
PermissionFlagsBits.AttachFiles,
PermissionFlagsBits.EmbedLinks,
PermissionFlagsBits.UseApplicationCommands
]
};
}

function voiceAccess(role) {
return {
id: role.id,
allow: [
PermissionFlagsBits.ViewChannel,
PermissionFlagsBits.Connect,
PermissionFlagsBits.Speak
]
};
}

function ownerAccess(guild) {
return {
id: guild.ownerId,
allow: [
PermissionFlagsBits.ViewChannel,
PermissionFlagsBits.SendMessages,
PermissionFlagsBits.ReadMessageHistory,
PermissionFlagsBits.Connect,
PermissionFlagsBits.Speak,
PermissionFlagsBits.ManageChannels,
PermissionFlagsBits.ManageMessages
]
};
}

async function lockCategory(guild, category, roles) {
const overwrites = [hideEveryone(guild)];

for (const role of roles) {
overwrites.push(textAccess(role));
}

overwrites.push(ownerAccess(guild));

await category.permissionOverwrites.set(overwrites);
}

async function lockVoice(guild, channel, roles) {
const overwrites = [hideEveryone(guild)];

for (const role of roles) {
overwrites.push(voiceAccess(role));
}

overwrites.push(ownerAccess(guild));

await channel.permissionOverwrites.set(overwrites);
}

/* =========================================================
LONG INFORMATION TEXTS
========================================================= */

const welcomeText = `
Vítej na oficiálním Discord serveru Imperial CZ/SK! 👑

Tento server slouží jako hlavní komunitní centrum našeho projektu. Najdeš zde důležité informace, oznámení, výběr rolí, možnost kontaktovat administraci, informace o serveru a další důležité části komunity.

Po příchodu si nejdříve projdi pravidla a následně si v sekci výběru nastav oznámení, která chceš dostávat. Můžeš si vybrat mezi eventy, běžnými oznámeními a RM oznámeními. Díky tomu nebudeš dostávat zprávy, které tě nezajímají.

Následně si vyber jednu hlavní složku. Na výběr je Policie, Hasiči, Záchranáři nebo Civilista. Výběr složky je omezen na jednu možnost, aby měl každý člen jasně nastavenou svou hlavní pozici.

Pokud si vybereš jednu ze složek IZS, bude ti přidělena také role Člen. Interní komunikace jednotlivých složek je oddělená od veřejné části serveru.

Administrace má vlastní neveřejné prostory pro řešení problémů, trestů, reportů a dalších záležitostí. Vedení má navíc vlastní oddělenou sekci.

Chovej se slušně, respektuj ostatní členy a dodržuj pravidla Imperial CZ/SK. Úmyslné obcházení pravidel, zneužívání systému nebo narušování práce administrace může vést k trestu.

Přejeme ti příjemnou zábavu a hodně úspěchů v Imperial CZ/SK! 🇨🇿 🇸🇰
`;

const rulesText = `
📜 PRAVIDLA IMPERIAL CZ/SK

1. Respektuj všechny členy serveru bez ohledu na jejich roli nebo postavení.

2. Je zakázáno spamovat, floodovat, zbytečně označovat členy nebo narušovat chod serveru.

3. Je zakázáno úmyslně obcházet tresty. Pokud máš ban nebo jiný trest, použij příslušný ticket.

4. Respektuj rozhodnutí administrace. Pokud s rozhodnutím nesouhlasíš, můžeš podat stížnost prostřednictvím ticket systému.

5. Zákaz vydávání se za administrátora, moderátora, vedení nebo jiného člena týmu.

6. Zákaz zveřejňování osobních údajů ostatních členů.

7. Zákaz reklamy bez povolení vedení.

8. Zákaz zneužívání chyb, bugů nebo funkcí Discordu či herního systému.

9. V ticketech uváděj pravdivé a co nejpřesnější informace.

10. Administrace může v odůvodněných případech použít varování, dočasný ban nebo jiný trest.

11. Tresty se zapisují do interního systému. Opakované porušování pravidel může vést k přísnějšímu trestu.

12. Za tři platné warny může administrátor řešit udělení třídenního banu podle okolností případu.

13. Nezneužívej ticket systém k trollingu, falešným reportům nebo spamování.

14. V interních kanálech administrace a vedení se nesmí sdílet informace mimo tým.

15. Všichni členové jsou povinni respektovat aktuální rozhodnutí vedení.

Pravidla mohou být průběžně aktualizována. Připojením a používáním serveru souhlasíš s jejich dodržováním.
`;

const selectionText = `
🎛️ VÝBĚR NASTAVENÍ

Tato sekce slouží k nastavení tvého profilu na serveru.

🔔 VÝBĚR OZNÁMENÍ
Vyber si, jaké typy oznámení chceš dostávat:
🎉 Eventy
📢 Oznámení
📣 RM Oznámení

Můžeš si vybrat jednu nebo více možností.

🎖️ VÝBĚR SLOŽKY
Vyber si právě jednu hlavní složku:
🚔 Policie
🚒 Hasiči
🚑 Záchranáři
👤 Civilista

Pokud změníš svou volbu, předchozí složka bude automaticky odebrána.

Výběr složky neslouží jako automatický nábor. U složek IZS může být pro skutečné členství potřeba projít dalším náborovým procesem.
`;

/* =========================================================
SETUP
========================================================= */

async function setupServer(guild) {
console.log("START SETUP:", guild.name);

const member = await getRole(guild, "member");
const admin = await getRole(guild, "admin");
const moderator = await getRole(guild, "moderator");
const management = await getRole(guild, "management");
const owner = await getRole(guild, "owner");

const pd = await getRole(guild, "pd");
const fire = await getRole(guild, "fire");
const ems = await getRole(guild, "ems");
const civilian = await getRole(guild, "civilian");

const eventRole = await getRole(guild, "event");
const announcementRole = await getRole(guild, "announcements");
const rmRole = await getRole(guild, "rm");

const at1 = await getRole(guild, "at1");
const at2 = await getRole(guild, "at2");
const at3 = await getRole(guild, "at3");
const at5 = await getRole(guild, "at5");
const at6 = await getRole(guild, "at6");

/* PUBLIC */

const information = await getCategory(guild, "📢・INFORMACE");
const selection = await getCategory(guild, "🎛️・VÝBĚR");
const server = await getCategory(guild, "🗺️・SERVER");
const tickets = await getCategory(guild, "🎫・TICKETY");

const welcome = await getText(guild, "👋・vítej", information);
const rules = await getText(guild, "📜・pravidla", information);
const news = await getText(guild, "📢・oznámení", information);
const events = await getText(guild, "🎉・eventy", information);
const rmNews = await getText(guild, "📣・rm-oznámení", information);

const notificationSelect = await getText(
guild,
"🔔・výběr-oznámení",
selection
);

const factionSelect = await getText(
guild,
"🎖️・výběr-složky",
selection
);

await getText(guild, "🗺️・mapa", server);
await getText(guild, "🏠・domy", server);
await getText(guild, "ℹ️・informace-o-serveru", server);
await getText(guild, "📌・důležité-odkazy", server);

const ticketPanel = await getText(
guild,
"🎫・vytvořit-ticket",
tickets
);

/* ADMIN */

const adminCategory = await getCategory(
guild,
"🛡️・ADMIN TEAM"
);

await lockCategory(guild, adminCategory, [
admin,
moderator,
management,
owner
]);

await getText(guild, "💬・admin-chat", adminCategory);
await getText(guild, "📜・admin-pravidla", adminCategory);
await getText(guild, "📋・admin-info", adminCategory);
await getText(guild, "📊・admin-statistiky", adminCategory);
await getText(guild, "📝・admin-úkoly", adminCategory);

/* ADMIN CALL */

const adminCalls = await getCategory(
guild,
"📞・ADMIN CALL"
);

await lockCategory(guild, adminCalls, [
admin,
moderator,
management,
owner
]);

for (const [name, role] of [
["🔊・AT1", at1],
["🔊・AT2", at2],
["🔊・AT3", at3],
["🔊・AT5", at5],
["🔊・AT6", at6]
]) {
const call = await getVoice(guild, name, adminCalls);

```
await lockVoice(guild, call, [
  role,
  admin,
  moderator,
  management,
  owner
]);
```

}

/* MANAGEMENT */

const managementCategory = await getCategory(
guild,
"👑・VEDENÍ"
);

await lockCategory(guild, managementCategory, [
management,
owner
]);

await getText(guild, "👑・vedení-chat", managementCategory);
await getText(guild, "📋・vedení-plány", managementCategory);
await getText(guild, "📢・vedení-oznámení", managementCategory);

const managementCall = await getVoice(
guild,
"🔊・vedení-call",
managementCategory
);

await lockVoice(guild, managementCall, [
management,
owner
]);

/* PUNISHMENTS */

const punishments = await getCategory(
guild,
"⚠️・TRESTY"
);

await lockCategory(guild, punishments, [
admin,
moderator,
management,
owner
]);

await getText(guild, "📝・zápis-trestu", punishments);
await getText(guild, "⚠️・warn", punishments);
await getText(guild, "🔨・ban", punishments);
await getText(guild, "📊・přehled-trestů", punishments);

const logs = await getCategory(
guild,
"📋・LOGY"
);

await lockCategory(guild, logs, [
admin,
moderator,
management,
owner
]);

await getText(guild, "⚠️・warn-log", logs);
await getText(guild, "🔨・ban-log", logs);
await getText(guild, "🎫・ticket-log", logs);
await getText(guild, "👤・role-log", logs);

/* PD */

const pdCategory = await getCategory(
guild,
"🚔・POLICIE"
);

await lockCategory(guild, pdCategory, [
pd,
admin,
moderator,
management,
owner
]);

await getText(guild, "🚔・pd-chat", pdCategory);

const pdCall = await getVoice(
guild,
"🔊・pd-call",
pdCategory
);

await lockVoice(guild, pdCall, [
pd,
admin,
moderator,
management,
owner
]);

/* FIRE */

const fireCategory = await getCategory(
guild,
"🚒・HASIČI"
);

await lockCategory(guild, fireCategory, [
fire,
admin,
moderator,
management,
owner
]);

await getText(guild, "🚒・hasici-chat", fireCategory);

const fireCall = await getVoice(
guild,
"🔊・hasici-call",
fireCategory
);

await lockVoice(guild, fireCall, [
fire,
admin,
moderator,
management,
owner
]);

/* EMS */

const emsCategory = await getCategory(
guild,
"🚑・ZÁCHRANÁŘI"
);

await lockCategory(guild, emsCategory, [
ems,
admin,
moderator,
management,
owner
]);

await getText(
guild,
"🚑・zachranari-chat",
emsCategory
);

const emsCall = await getVoice(
guild,
"🔊・zachranari-call",
emsCategory
);

await lockVoice(guild, emsCall, [
ems,
admin,
moderator,
management,
owner
]);

/* =====================================================
EMBEDS
===================================================== */

if (welcome.messages.cache.size === 0) {
await welcome.send({
embeds: [
new EmbedBuilder()
.setTitle("👑 VÍTEJ V IMPERIAL CZ/SK")
.setDescription(welcomeText)
.setColor("#5865F2")
.setFooter({
text: "Imperial CZ/SK • Oficiální server"
})
]
});
}

if (rules.messages.cache.size === 0) {
await rules.send({
embeds: [
new EmbedBuilder()
.setTitle("📜 PRAVIDLA IMPERIAL CZ/SK")
.setDescription(rulesText)
.setColor("#E74C3C")
.setFooter({
text: "Před používáním serveru si pravidla přečti."
})
]
});
}

if (notificationSelect.messages.cache.size === 0) {
const menu = new StringSelectMenuBuilder()
.setCustomId("notification_select")
.setPlaceholder("🔔 Vyber oznámení")
.setMinValues(1)
.setMaxValues(3)
.addOptions(
new StringSelectMenuOptionBuilder()
.setLabel("Eventy")
.setDescription("Oznámení o eventech")
.setValue("event")
.setEmoji("🎉"),

```
    new StringSelectMenuOptionBuilder()
      .setLabel("Oznámení")
      .setDescription("Důležitá serverová oznámení")
      .setValue("announcement")
      .setEmoji("📢"),

    new StringSelectMenuOptionBuilder()
      .setLabel("RM Oznámení")
      .setDescription("Oznámení RM")
      .setValue("rm")
      .setEmoji("📣")
  );

await notificationSelect.send({
  embeds: [
    new EmbedBuilder()
      .setTitle("🔔 NASTAVENÍ OZNÁMENÍ")
      .setDescription(selectionText)
      .setColor("#3498DB")
  ],
  components: [
    new ActionRowBuilder().addComponents(menu)
  ]
});
```

}

if (factionSelect.messages.cache.size === 0) {
const menu = new StringSelectMenuBuilder()
.setCustomId("faction_select")
.setPlaceholder("🎖️ Vyber jednu složku")
.setMinValues(1)
.setMaxValues(1)
.addOptions(
new StringSelectMenuOptionBuilder()
.setLabel("Policie")
.setDescription("Vyber si Policii")
.setValue("pd")
.setEmoji("🚔"),

```
    new StringSelectMenuOptionBuilder()
      .setLabel("Hasiči")
      .setDescription("Vyber si Hasiče")
      .setValue("fire")
      .setEmoji("🚒"),

    new StringSelectMenuOptionBuilder()
      .setLabel("Záchranáři")
      .setDescription("Vyber si Záchranáře")
      .setValue("ems")
      .setEmoji("🚑"),

    new StringSelectMenuOptionBuilder()
      .setLabel("Civilista")
      .setDescription("Vyber si Civilistu")
      .setValue("civilian")
      .setEmoji("👤")
  );

await factionSelect.send({
  embeds: [
    new EmbedBuilder()
      .setTitle("🎖️ VÝBĚR HLAVNÍ SLOŽKY")
      .setDescription(
        "Vyber si **právě jednu** hlavní složku.\n\n" +
        "🚔 **Policie** – policejní složka\n" +
        "🚒 **Hasiči** – hasičská složka\n" +
        "🚑 **Záchranáři** – zdravotnická složka\n" +
        "👤 **Civilista** – civilní člen komunity\n\n" +
        "Po změně volby bude předchozí složka automaticky odebrána.\n\n" +
        "⚠️ Výběr role není automatickým přijetím do dané složky."
      )
      .setColor("#5865F2")
  ],
  components: [
    new ActionRowBuilder().addComponents(menu)
  ]
});
```

}

if (ticketPanel.messages.cache.size === 0) {
const menu = new StringSelectMenuBuilder()
.setCustomId("ticket_select")
.setPlaceholder("🎫 Vyber typ ticketu")
.addOptions(
new StringSelectMenuOptionBuilder()
.setLabel("Stížnost na admina")
.setValue("admin_complaint")
.setEmoji("🛡️"),

```
    new StringSelectMenuOptionBuilder()
      .setLabel("Stížnost na hráče")
      .setValue("player_complaint")
      .setEmoji("👤"),

    new StringSelectMenuOptionBuilder()
      .setLabel("Mafie")
      .setValue("mafia")
      .setEmoji("🔫"),

    new StringSelectMenuOptionBuilder()
      .setLabel("Mafie 1")
      .setValue("mafia1")
      .setEmoji("1️⃣"),

    new StringSelectMenuOptionBuilder()
      .setLabel("Mafie 2")
      .setValue("mafia2")
      .setEmoji("2️⃣"),

    new StringSelectMenuOptionBuilder()
      .setLabel("Mafie 3")
      .setValue("mafia3")
      .setEmoji("3️⃣"),

    new StringSelectMenuOptionBuilder()
      .setLabel("Žádost o unban")
      .setValue("unban")
      .setEmoji("🔓")
  );

await ticketPanel.send({
  embeds: [
    new EmbedBuilder()
      .setTitle("🎫 TICKET CENTRUM")
      .setDescription(
        "Potřebuješ kontaktovat administraci?\n\n" +
        "Vyber kategorii, která nejlépe odpovídá tvému problému.\n\n" +
        "🛡️ Stížnost na admina\n" +
        "👤 Stížnost na hráče\n" +
        "🔫 Mafie\n" +
        "1️⃣ Mafie 1\n" +
        "2️⃣ Mafie 2\n" +
        "3️⃣ Mafie 3\n" +
        "🔓 Žádost o unban\n\n" +
        "Piš do ticketu pravdivé informace a přilož důkazy, pokud je máš."
      )
      .setColor("#F1C40F")
  ],
  components: [
    new ActionRowBuilder().addComponents(menu)
  ]
});
```

}

console.log("SETUP HOTOV");
}

/* =========================================================
READY
========================================================= */

client.once("ready", async () => {
console.log(`BOT ONLINE: ${client.user.tag}`);

for (const guild of client.guilds.cache.values()) {
try {
const command = new SlashCommandBuilder()
.setName("setup")
.setDescription("Vytvoří a nastaví Imperial CZ/SK server.");

```
  const rest = new REST({ version: "10" })
    .setToken(TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      client.user.id,
      guild.id
    ),
    {
      body: [command.toJSON()]
    }
  );

  console.log(`/setup pripraven: ${guild.name}`);
} catch (error) {
  console.error("CHYBA REGISTRACE:", error);
}
```

}
});

/* =========================================================
INTERACTIONS
========================================================= */

client.on("interactionCreate", async interaction => {
try {
if (interaction.isChatInputCommand()) {
if (interaction.commandName === "setup") {

```
    if (interaction.guild.ownerId !== interaction.user.id) {
      return interaction.reply({
        content: "❌ Tento příkaz může použít pouze majitel serveru.",
        ephemeral: true
      });
    }

    await interaction.deferReply({
      ephemeral: true
    });

    await setupServer(interaction.guild);

    return interaction.editReply(
      "✅ Imperial CZ/SK server byl úspěšně nastaven."
    );
  }
}

if (
  interaction.isStringSelectMenu() &&
  interaction.customId === "notification_select"
) {
  const map = {
    event: "🔔 Eventy",
    announcement: "📢 Oznámení",
    rm: "📣 RM Oznámení"
  };

  for (const roleName of Object.values(map)) {
    const role = interaction.guild.roles.cache.find(
      r => r.name === roleName
    );

    if (
      role &&
      interaction.member.roles.cache.has(role.id)
    ) {
      await interaction.member.roles.remove(role).catch(() => {});
    }
  }

  for (const value of interaction.values) {
    const role = interaction.guild.roles.cache.find(
      r => r.name === map[value]
    );

    if (role) {
      await interaction.member.roles.add(role).catch(() => {});
    }
  }

  return interaction.reply({
    content: "✅ Nastavení oznámení bylo uloženo.",
    ephemeral: true
  });
}

if (
  interaction.isStringSelectMenu() &&
  interaction.customId === "faction_select"
) {
  const factionMap = {
    pd: "🚔 PD",
    fire: "🚒 Hasiči",
    ems: "🚑 Záchranáři",
    civilian: "👤 Civilista"
  };

  for (const roleName of Object.values(factionMap)) {
    const role = interaction.guild.roles.cache.find(
      r => r.name === roleName
    );

    if (
      role &&
      interaction.member.roles.cache.has(role.id)
    ) {
      await interaction.member.roles.remove(role).catch(() => {});
    }
  }

  const selectedRole = interaction.guild.roles.cache.find(
    r => r.name === factionMap[interaction.values[0]]
  );

  const memberRole = interaction.guild.roles.cache.find(
    r => r.name === "Člen"
  );

  if (selectedRole) {
    await interaction.member.roles.add(selectedRole).catch(() => {});
  }

  if (memberRole) {
    await interaction.member.roles.add(memberRole).catch(() => {});
  }

  return interaction.reply({
    content:
      `✅ Vybral/a sis ${selectedRole ? selectedRole.name : "Civilista"}.\n` +
      "✅ Byla ti přidělena také role Člen.",
    ephemeral: true
  });
}

if (
  interaction.isStringSelectMenu() &&
  interaction.customId === "ticket_select"
) {
  return interaction.reply({
    content:
      "🎫 Kategorie ticketu byla vybrána. Ticketovací místnosti doplníme v další části systému.",
    ephemeral: true
  });
}
```

} catch (error) {
console.error("INTERACTION ERROR:", error);

```
if (!interaction.replied && !interaction.deferred) {
  await interaction.reply({
    content: "❌ Při zpracování požadavku nastala chyba.",
    ephemeral: true
  }).catch(() => {});
}
```

}
});

client.login(TOKEN);

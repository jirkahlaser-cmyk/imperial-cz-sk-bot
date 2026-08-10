const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  PermissionsBitField,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const fs = require("fs");
const path = require("path");

/* =====================================================
   BOT
===================================================== */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error("❌ DISCORD_TOKEN není nastavený v Railway.");
  process.exit(1);
}

/* =====================================================
   DATA
===================================================== */

const dataFile = path.join(__dirname, "staff-hours.json");

let staffData = {
  users: {}
};

function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      staffData = JSON.parse(
        fs.readFileSync(dataFile, "utf8")
      );
    }
  } catch (error) {
    console.error("❌ Chyba staff-hours.json:", error);
    staffData = { users: {} };
  }
}

function saveData() {
  try {
    fs.writeFileSync(
      dataFile,
      JSON.stringify(staffData, null, 2)
    );
  } catch (error) {
    console.error("❌ Nepodařilo se uložit staff data:", error);
  }
}

loadData();

/* =====================================================
   ROLE
===================================================== */

const ROLE_CONFIG = [
  ["👑 Majitel", 0xff0000],
  ["💎 Spolumajitel", 0xff00ff],
  ["🏆 Zakladatel", 0xffd700],
  ["🧠 Ředitel projektu", 0x9b59b6],
  ["📋 Vedoucí projektu", 0x3498db],
  ["📱 Vedoucí médií", 0xe91e63],
  ["🎉 Vedoucí eventů", 0xf1c40f],
  ["🤝 Vedoucí partnerství", 0x1abc9c],
  ["👥 Vedoucí náboru", 0x2ecc71],
  ["⚙️ Vývojář", 0x95a5a6],

  ["👑 Hlavní administrátor", 0xc0392b],
  ["🔴 Senior administrátor", 0xe74c3c],
  ["🟠 Administrátor", 0xe67e22],
  ["🟡 Junior administrátor", 0xf1c40f],
  ["⚪ Zkušební administrátor", 0x7f8c8d],

  ["🚓 Velitel policie", 0x2980db],
  ["👮 Policista", 0x3498db],

  ["🚒 Velitel hasičů", 0xc0392b],
  ["🔥 Hasič", 0xe74c3c],

  ["🚑 Velitel záchranářů", 0x27ae60],
  ["🩺 Záchranář", 0x2ecc71],

  ["⭐ Event tým", 0x9b59b6],
  ["📸 Media tým", 0xe91e63],
  ["💎 Podporovatel", 0x00ffff],
  ["🏆 VIP", 0xffd700],
  ["🎮 Člen", 0x5865f2]
];

const STAFF_ROLES = [
  "👑 Hlavní administrátor",
  "🔴 Senior administrátor",
  "🟠 Administrátor",
  "🟡 Junior administrátor",
  "⚪ Zkušební administrátor"
];

const MANAGEMENT_ROLES = [
  "👑 Majitel",
  "💎 Spolumajitel",
  "🏆 Zakladatel",
  "🧠 Ředitel projektu",
  "📋 Vedoucí projektu"
];

function isStaff(member) {
  return member.roles.cache.some(role =>
    STAFF_ROLES.includes(role.name)
  );
}

function isManagement(member) {
  return member.roles.cache.some(role =>
    MANAGEMENT_ROLES.includes(role.name)
  );
}

/* =====================================================
   ROLE FUNCTIONS
===================================================== */

async function getOrCreateRole(guild, name, color) {
  let role = guild.roles.cache.find(
    r => r.name === name
  );

  if (!role) {
    role = await guild.roles.create({
      name,
      color,
      reason: "RP server setup"
    });
  }

  return role;
}

/* =====================================================
   PERMISSIONS
===================================================== */

function staffPermissions(guild) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [
        PermissionsBitField.Flags.ViewChannel
      ]
    }
  ];

  for (const roleName of STAFF_ROLES) {
    const role = guild.roles.cache.find(
      r => r.name === roleName
    );

    if (role) {
      overwrites.push({
        id: role.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles,
          PermissionsBitField.Flags.EmbedLinks
        ]
      });
    }
  }

  return overwrites;
}

function managementPermissions(guild) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [
        PermissionsBitField.Flags.ViewChannel
      ]
    }
  ];

  for (const roleName of MANAGEMENT_ROLES) {
    const role = guild.roles.cache.find(
      r => r.name === roleName
    );

    if (role) {
      overwrites.push({
        id: role.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles,
          PermissionsBitField.Flags.EmbedLinks
        ]
      });
    }
  }

  return overwrites;
}

function publicPermissions(guild) {
  return [
    {
      id: guild.roles.everyone.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory
      ]
    }
  ];
}

/* =====================================================
   CATEGORY
===================================================== */

async function getOrCreateCategory(
  guild,
  name,
  permissionOverwrites = undefined
) {
  let category = guild.channels.cache.find(
    channel =>
      channel.type === ChannelType.GuildCategory &&
      channel.name === name
  );

  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      permissionOverwrites
    });
  } else if (permissionOverwrites) {
    await category.permissionOverwrites.set(
      permissionOverwrites
    );
  }

  return category;
}

/* =====================================================
   CHANNEL
===================================================== */

async function getOrCreateChannel(
  guild,
  name,
  parent,
  permissionOverwrites = undefined
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
      parent: parent.id,
      permissionOverwrites
    });
  } else {
    if (channel.parentId !== parent.id) {
      await channel.setParent(parent.id);
    }

    if (permissionOverwrites) {
      await channel.permissionOverwrites.set(
        permissionOverwrites
      );
    }
  }

  return channel;
}

/* =====================================================
   SEND ONCE
===================================================== */

async function sendOnce(channel, content) {
  const messages = await channel.messages.fetch({
    limit: 10
  });

  const botMessage = messages.find(
    message =>
      message.author.id === client.user.id
  );

  if (!botMessage) {
    await channel.send(content);
  }
}

/* =====================================================
   TEXTY
===================================================== */

const TEXT = {

rules: `
📜 **PRAVIDLA DISCORD SERVERU**

1️⃣ Chovej se slušně k ostatním.
2️⃣ Zákaz šikany a cíleného obtěžování.
3️⃣ Zákaz spamu a floodu.
4️⃣ Zákaz nevyžádané reklamy.
5️⃣ Zákaz vydávání se za staff.
6️⃣ Zákaz zveřejňování osobních údajů.
7️⃣ Respektuj ostatní členy.
8️⃣ Dodržuj pravidla Discordu.
9️⃣ Respektuj rozhodnutí moderace.
🔟 Závažné problémy řeš přes ticket.

⚠️ Porušení pravidel může vést k warnu, timeoutu, kicku nebo banu.
`,

rpRules: `
🎭 **RP PRAVIDLA**

🔹 **FailRP**
Jednání, které nedává smysl v rámci RP.

🔹 **RDM**
Napadení nebo zabití bez odpovídajícího RP důvodu.

🔹 **VDM**
Použití vozidla jako zbraně bez odpovídajícího RP důvodu.

🔹 **NLR**
Po smrti se nesmíš bezdůvodně vracet do stejné situace.

🔹 **Metagaming**
Používání informací získaných mimo RP.

🔹 **Powergaming**
Nucení nereálných akcí ostatním hráčům.

🔹 **FearRP**
Postava musí přiměřeně reagovat na ohrožení života.

🔹 **Combat Logging**
Úmyslné odpojení během RP situace.

🔹 **Cop Baiting**
Úmyslné a nesmyslné provokování policie.

🔹 **NVL**
Ignorování vlastního života.

🔹 **Revenge RP**
Pomsta za situaci, kterou si postava nemá pamatovat.

🎭 Hraj realisticky a respektuj ostatní hráče.
`,

staffRules: `
🛡️ **STAFF RP PRAVIDLA**

1️⃣ Staff musí být nestranný.
2️⃣ Staff nesmí zvýhodňovat kamarády.
3️⃣ Staff nesmí používat pravomoci pro vlastní RP výhodu.
4️⃣ Staff nesmí využívat OORP informace v RP.
5️⃣ Pokud není nutný zásah, nech RP pokračovat.
6️⃣ Report nejprve vyslechni z obou stran.
7️⃣ U závažných trestů požaduj důkazy.
8️⃣ Sporné případy předávej Senior Adminovi.
9️⃣ Konflikt zájmů řeší jiný staff.
🔟 Závažné případy lze předat vedení.

⚠️ Zneužití pravomocí může znamenat odebrání staff role.
`,

punishments: `
⚖️ **STAFF TRESTY**

🟢 **Upozornění**
Drobné nebo první porušení.

🟡 **WARN**
Opakované nebo závažnější porušení.

🟠 **TIMEOUT**
Spam, toxicita nebo narušování Discordu.

🔴 **KICK**
Závažné narušování serveru.

⛔ **DOČASNÝ BAN**
Závažné nebo opakované porušování.

🚫 **PERMANENTNÍ BAN**
Extrémně závažné případy nebo opakované porušování.

🛡️ **ODEBRÁNÍ STAFF ROLE**
Zneužití pravomocí, zvýhodňování nebo porušení důvěry.

👑 **PŘEDÁNÍ VEDENÍ**
Používá se u závažných nebo sporných případů.

⚠️ Trest musí odpovídat situaci.
`,

applications: `
📋 **PŘIHLÁŠKY DO STAFF TÝMU**

🔒 Tento kanál je určen pouze pro STAFF.

Zde staff řeší:
• přihlášky administrátorů
• náborové pohovory
• zkušební období
• přijetí / zamítnutí
• hodnocení kandidátů

👮 Kandidáti se přihlašují přes ticket.

⚠️ Interní informace z tohoto kanálu se nesmí zveřejňovat.
`,

publicEvents: `
🎉 **EVENTY**

🌎 Tento kanál je veřejný.

Zde budou zveřejňovány aktuální a plánované eventy.

🚗 Car Meet
🏁 Závody
🚓 Policejní akce
🚒 Hasičský zásah
🚑 Hromadná nehoda
🚨 Policejní honička
🏦 Bankovní loupež
💎 Loupež klenotnictví
🚧 Dopravní uzavírka
🚌 Veřejná doprava
🎭 Velké městské RP
📸 Screenshot event
🏆 Turnaj
🎁 Soutěž

📢 U každého eventu bude zveřejněn čas, místo a pravidla.
`,

staffEvents: `
🎉 **STAFF EVENTY**

🔒 Tento kanál je pouze pro STAFF.

Zde se eventy připravují před zveřejněním.

🎯 Možné eventy:

🚗 Car Meet
🏁 Závody
🚓 Policejní akce
🚒 Hasičský zásah
🚑 Hromadná nehoda
🚨 Policejní honička
🏦 Bankovní loupež
💎 Loupež klenotnictví
🚧 Dopravní uzavírka
🚌 Veřejná doprava
🎭 Velké městské RP
📸 Screenshot event
🏆 Turnaj
🎁 Soutěž

📋 Při plánování určete:
• datum
• čas
• místo
• organizátora
• potřebné složky
• scénář
• pravidla
• počet hráčů
`,

properties: `
🏠 **POZEMKY**

O pozemek se žádá přes ticket.

Uveď:
• Discord jméno
• požadované místo
• účel pozemku
• případný screenshot

👑 Vedení žádost schválí nebo zamítne.

⚠️ Discord evidence sama o sobě nemění vlastnictví v Robloxu.
`,

businesses: `
🏢 **PODNIKY**

Možné RP podniky:

🍔 Restaurace
🔧 Autoservis
🏪 Obchod
⛽ Čerpací stanice
🏢 Firma

O podnik se žádá přes ticket.

Vedení může žádost schválit, upravit nebo zamítnout.
`,

economy: `
💰 **EKONOMIKA RP**

• Peníze musí mít RP původ.
• Podniky musí být schválené.
• Pozemky se evidují přes vedení.
• Zákaz zneužívání systému.
• Zákaz OORP výhod.
`,

map: `
🗺️ **MAPA EMERGENCY HAMBURG**

Oficiální hra:
https://www.roblox.com/games/7711635737/Emergency-Hamburg

📍 Důležité typy míst:

🚓 Policie
🚒 Hasiči
🚑 ZZS
🏦 Banka
💎 Klenotnictví
⛽ Čerpací stanice
🚉 Nádraží
🏭 Průmyslové oblasti
🏙️ Centrum

⚠️ Mapa se může měnit s aktualizacemi hry.
`,

shift: `
⏱️ **STAFF OORP SMĚNY**

`!startshift`
Začne staff směnu.

`!endshift`
Ukončí staff směnu a započítá čas.

`!shift`
Zobrazí aktuální směnu.

`!myhours`
Zobrazí tvůj celkový čas.

`!leaderboard`
Zobrazí leaderboard.

🏆 Čas se počítá pouze mezi startem a koncem směny.
`,

staffInfo: `
📋 **STAFF INFO**

Při řešení reportu:

1️⃣ Zjisti situaci.
2️⃣ Vyslechni všechny strany.
3️⃣ Vyžádej důkazy.
4️⃣ Rozhodni podle pravidel.
5️⃣ Zapiš závažný případ.
6️⃣ V případě pochybností kontaktuj Senior Admina.
7️⃣ Závažné případy předávej vedení.

🛡️ Buď profesionální a nestranný.
`,

ticket: `
🎫 **TICKET SYSTÉM**

Vyber typ ticketu:

🛠️ Podpora
🚨 Report hráče
🏠 Pozemek
🏢 Podnik
👮 Nábor
🔓 Unban
🤝 Partnerství

🛡️ Staff může ticket převzít.
👑 Staff může ticket předat vedení.
🔒 Ticket lze následně uzavřít.
`
};

/* =====================================================
   SETUP COMMAND
===================================================== */

const setupCommand = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Vytvoří a aktualizuje celý RP server.")
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Administrator
  );

/* =====================================================
   READY
===================================================== */

client.once("ready", async () => {

  console.log(
    `✅ Bot je online jako ${client.user.tag}`
  );

  for (const guild of client.guilds.cache.values()) {

    try {

      const rest = new REST({
        version: "10"
      }).setToken(TOKEN);

      await rest.put(
        Routes.applicationGuildCommands(
          client.user.id,
          guild.id
        ),
        {
          body: [
            setupCommand.toJSON()
          ]
        }
      );

      console.log(
        `✅ /setup registrován: ${guild.name}`
      );

    } catch (error) {
      console.error(
        "❌ Registrace commandu:",
        error
      );
    }
  }
});

/* =====================================================
   SETUP
===================================================== */

client.on("interactionCreate", async interaction => {

  if (
    !interaction.isChatInputCommand() ||
    interaction.commandName !== "setup"
  ) {
    return;
  }

  if (
    !interaction.memberPermissions.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    return interaction.reply({
      content:
        "❌ /setup může použít pouze administrátor.",
      ephemeral: true
    });
  }

  await interaction.deferReply({
    ephemeral: true
  });

  try {

    const guild = interaction.guild;

    /* ROLE */

    for (const [name, color] of ROLE_CONFIG) {
      await getOrCreateRole(
        guild,
        name,
        color
      );
    }

    const staffPerms =
      staffPermissions(guild);

    const managementPerms =
      managementPermissions(guild);

    const publicPerms =
      publicPermissions(guild);

    /* =================================================
       INFORMACE
    ================================================= */

    const info = await getOrCreateCategory(
      guild,
      "📌 INFORMACE"
    );

    const rules = await getOrCreateChannel(
      guild,
      "📜・pravidla",
      info
    );

    const rpRules = await getOrCreateChannel(
      guild,
      "🎭・rp-pravidla",
      info
    );

    const faq = await getOrCreateChannel(
      guild,
      "❓・faq",
      info
    );

    /* 🔒 PŘIHLÁŠKY = STAFF ONLY */
    const applications =
      await getOrCreateChannel(
        guild,
        "📋・přihlášky",
        info,
        staffPerms
      );

    const announcements =
      await getOrCreateChannel(
        guild,
        "📢・oznámení",
        info
      );

    const map =
      await getOrCreateChannel(
        guild,
        "🗺️・mapa-emergency",
        info
      );

    /* =================================================
       HRA
    ================================================= */

    const game =
      await getOrCreateCategory(
        guild,
        "🎮 HRA"
      );

    const properties =
      await getOrCreateChannel(
        guild,
        "🏠・pozemky",
        game
      );

    const businesses =
      await getOrCreateChannel(
        guild,
        "🏢・podniky",
        game
      );

    const economy =
      await getOrCreateChannel(
        guild,
        "💰・ekonomika",
        game
      );

    const police =
      await getOrCreateChannel(
        guild,
        "🚓・policie",
        game
      );

    const fire =
      await getOrCreateChannel(
        guild,
        "🚒・hasiči",
        game
      );

    const medic =
      await getOrCreateChannel(
        guild,
        "🚑・záchranáři",
        game
      );

    const criminal =
      await getOrCreateChannel(
        guild,
        "🔫・kriminální-rp",
        game
      );

    const traffic =
      await getOrCreateChannel(
        guild,
        "🚗・dopravní-pravidla",
        game
      );

    /* =================================================
       KOMUNITA
    ================================================= */

    const community =
      await getOrCreateCategory(
        guild,
        "💬 KOMUNITA"
      );

    const chat =
      await getOrCreateChannel(
        guild,
        "💬・chat",
        community
      );

    /* 🌎 EVENTY = VEŘEJNÉ */
    const publicEvents =
      await getOrCreateChannel(
        guild,
        "🎉・eventy",
        community,
        publicPerms
      );

    /* =================================================
       STAFF
    ================================================= */

    const staff =
      await getOrCreateCategory(
        guild,
        "🛡️ STAFF",
        staffPerms
      );

    const staffChat =
      await getOrCreateChannel(
        guild,
        "🛡️・staff-chat",
        staff,
        staffPerms
      );

    const staffAnnouncements =
      await getOrCreateChannel(
        guild,
        "📢・staff-oznámení",
        staff,
        staffPerms
      );

    const staffInfo =
      await getOrCreateChannel(
        guild,
        "📋・staff-info",
        staff,
        staffPerms
      );

    const staffRP =
      await getOrCreateChannel(
        guild,
        "📜・staff-rp-pravidla",
        staff,
        staffPerms
      );

    const staffPunishments =
      await getOrCreateChannel(
        guild,
        "⚖️・staff-tresty",
        staff,
        staffPerms
      );

    const staffReports =
      await getOrCreateChannel(
        guild,
        "🚨・staff-reporty",
        staff,
        staffPerms
      );

    const staffShifts =
      await getOrCreateChannel(
        guild,
        "⏱️・staff-směny",
        staff,
        staffPerms
      );

    const leaderboard =
      await getOrCreateChannel(
        guild,
        "🏆・staff-leaderboard",
        staff,
        staffPerms
      );

    /* 🔒 STAFF EVENTY = STAFF ONLY */
    const staffEvents =
      await getOrCreateChannel(
        guild,
        "🎉・staff-eventy",
        staff,
        staffPerms
      );

    const staffMeetings =
      await getOrCreateChannel(
        guild,
        "📅・staff-porady",
        staff,
        staffPerms
      );

    /* =================================================
       TICKETY
    ================================================= */

    const tickets =
      await getOrCreateCategory(
        guild,
        "🎫 TICKETY"
      );

    const ticketPanel =
      await getOrCreateChannel(
        guild,
        "🎫・vytvořit-ticket",
        tickets
      );

    /* =================================================
       VEDENÍ
    ================================================= */

    const management =
      await getOrCreateCategory(
        guild,
        "👑 VEDENÍ",
        managementPerms
      );

    const managementChat =
      await getOrCreateChannel(
        guild,
        "👑・vedení",
        management,
        managementPerms
      );

    const managementMeetings =
      await getOrCreateChannel(
        guild,
        "📋・porady-vedení",
        management,
        managementPerms
      );

    /* =================================================
       LOGY
    ================================================= */

    const logs =
      await getOrCreateCategory(
        guild,
        "📊 LOGY",
        staffPerms
      );

    const ticketLogs =
      await getOrCreateChannel(
        guild,
        "🎫・ticket-log",
        logs,
        staffPerms
      );

    const staffLogs =
      await getOrCreateChannel(
        guild,
        "🛡️・staff-log",
        logs,
        staffPerms
      );

    /* =================================================
       TEXTY
    ================================================= */

    await sendOnce(
      rules,
      TEXT.rules
    );

    await sendOnce(
      rpRules,
      TEXT.rpRules
    );

    await sendOnce(
      faq,
      `
❓ **FAQ**

🎫 Report hráče → vytvoř Report ticket.
🏠 Pozemek → vytvoř Pozemek ticket.
🏢 Podnik → vytvoř Podnik ticket.
🔓 Unban → vytvoř Unban ticket.
👮 Nábor → vytvoř Nábor ticket.
🎉 Eventy → sleduj veřejný kanál 🎉・eventy.
🛡️ Staff → přihlášky řeší staff.
`
    );

    await sendOnce(
      applications,
      TEXT.applications
    );

    await sendOnce(
      announcements,
      "📢 **OZNÁMENÍ SERVERU**\n\nDůležitá oznámení budou zveřejňována zde."
    );

    await sendOnce(
      map,
      TEXT.map
    );

    await sendOnce(
      properties,
      TEXT.properties
    );

    await sendOnce(
      businesses,
      TEXT.businesses
    );

    await sendOnce(
      economy,
      TEXT.economy
    );

    await sendOnce(
      police,
      "🚓 **POLICIE**\n\nRP informace a pravidla policejní složky."
    );

    await sendOnce(
      fire,
      "🚒 **HASIČI**\n\nRP informace a pravidla hasičské složky."
    );

    await sendOnce(
      medic,
      "🚑 **ZZS**\n\nRP informace a pravidla zdravotnické složky."
    );

    await sendOnce(
      criminal,
      "🔫 **KRIMINÁLNÍ RP**\n\nKriminální RP musí být realistické a férové."
    );

    await sendOnce(
      traffic,
      "🚗 **DOPRAVNÍ RP**\n\nRespektuj dopravní pravidla a zákaz VDM."
    );

    await sendOnce(
      chat,
      "💬 **VÍTEJ NA SERVERU!**\n\nBav se, respektuj ostatní a užij si RP."
    );

    /* 🌎 VEŘEJNÉ EVENTY */
    await sendOnce(
      publicEvents,
      TEXT.publicEvents
    );

    /* STAFF */

    await sendOnce(
      staffChat,
      "🛡️ **STAFF CHAT**\n\nInterní komunikace staff týmu."
    );

    await sendOnce(
      staffAnnouncements,
      "📢 **STAFF OZNÁMENÍ**\n\nDůležitá interní oznámení vedení."
    );

    await sendOnce(
      staffInfo,
      TEXT.staffInfo
    );

    await sendOnce(
      staffRP,
      TEXT.staffRules
    );

    await sendOnce(
      staffPunishments,
      TEXT.punishments
    );

    await sendOnce(
      staffReports,
      `
🚨 **STAFF REPORTY**

Při evidenci případu uveď:

👤 Hráč:
🕐 Datum:
📝 Popis:
📸 Důkazy:
⚖️ Výsledek:

Závažné případy předávej Senior Adminovi nebo vedení.
`
    );

    await sendOnce(
      staffShifts,
      TEXT.shift
    );

    await sendOnce(
      staffEvents,
      TEXT.staffEvents
    );

    await sendOnce(
      staffMeetings,
      `
📅 **STAFF PORADY**

Témata:
• pravidla
• nábor
• eventy
• stížnosti
• aktivita staffu
• plánování serveru
`
    );

    await sendOnce(
      managementChat,
      "👑 **VEDENÍ**\n\nInterní komunikace vedení."
    );

    await sendOnce(
      managementMeetings,
      "📋 **PORADY VEDENÍ**\n\nInterní plánování vedení."
    );

    await sendOnce(
      ticketLogs,
      "🎫 **TICKET LOG**"
    );

    await sendOnce(
      staffLogs,
      "🛡️ **STAFF LOG**"
    );

    /* =================================================
       TICKET PANEL
    ================================================= */

    const existingBotMessages =
      await ticketPanel.messages.fetch({
        limit: 20
      });

    const hasTicketPanel =
      existingBotMessages.some(
        message =>
          message.author.id === client.user.id
      );

    if (!hasTicketPanel) {

      const embed =
        new EmbedBuilder()
          .setTitle(
            "🎫 TICKET SYSTÉM"
          )
          .setDescription(
            TEXT.ticket
          )
          .setColor(0x5865f2);

      const row1 =
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId("ticket_support")
              .setLabel("🛠️ Podpora")
              .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
              .setCustomId("ticket_report")
              .setLabel("🚨 Report")
              .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
              .setCustomId("ticket_property")
              .setLabel("🏠 Pozemek")
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId("ticket_business")
              .setLabel("🏢 Podnik")
              .setStyle(ButtonStyle.Success)
          );

      const row2 =
        new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId("ticket_recruitment")
              .setLabel("👮 Nábor")
              .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
              .setCustomId("ticket_unban")
              .setLabel("🔓 Unban")
              .setStyle(ButtonStyle.Secondary),

            new ButtonBuilder()
              .setCustomId("ticket_partner")
              .setLabel("🤝 Partnerství")
              .setStyle(ButtonStyle.Secondary)
          );

      await ticketPanel.send({
        embeds: [embed],
        components: [row1, row2]
      });
    }

    await updateLeaderboard(
      leaderboard
    );

    await interaction.editReply(
      "✅ **SERVER AKTUALIZOVÁN!**\n\n" +
      "📋 Přihlášky → STAFF ONLY 🔒\n" +
      "🎉 Eventy → VEŘEJNÉ 🌎\n" +
      "🎉 Staff eventy → STAFF ONLY 🔒\n" +
      "🛡️ Staff pravidla → HOTOVO\n" +
      "⚖️ Staff tresty → HOTOVO\n" +
      "🎫 Tickety → HOTOVO\n" +
      "⏱️ OORP směny → HOTOVO\n" +
      "🏆 Leaderboard → HOTOVO\n" +
      "🗺️ Mapa → HOTOVO\n" +
      "🏠 Pozemky → HOTOVO\n" +
      "🏢 Podniky → HOTOVO\n\n" +
      "🔥 Všechno je nastavené!"
    );

  } catch (error) {

    console.error(
      "❌ SETUP ERROR:",
      error
    );

    await interaction.editReply(
      "❌ Setup se nepodařilo dokončit.\n\n" +
      "Zkontroluj Railway logy a oprávnění bota."
    );
  }
});

/* =====================================================
   TICKET DATA
===================================================== */

const TICKET_TYPES = {
  ticket_support: ["podpora", "🛠️ Podpora"],
  ticket_report: ["report", "🚨 Report"],
  ticket_property: ["pozemek", "🏠 Pozemek"],
  ticket_business: ["podnik", "🏢 Podnik"],
  ticket_recruitment: ["nabor", "👮 Nábor"],
  ticket_unban: ["unban", "🔓 Unban"],
  ticket_partner: ["partnerstvi", "🤝 Partnerství"]
};

/* =====================================================
   TICKET CREATE
===================================================== */

client.on("interactionCreate", async interaction => {

  if (!interaction.isButton()) {
    return;
  }

  const type =
    TICKET_TYPES[interaction.customId];

  if (!type) {
    return;
  }

  const guild =
    interaction.guild;

  const category =
    guild.channels.cache.find(
      channel =>
        channel.type === ChannelType.GuildCategory &&
        channel.name === "🎫 TICKETY"
    );

  if (!category) {
    return interaction.reply({
      content:
        "❌ Ticket kategorie neexistuje. Použij /setup.",
      ephemeral: true
    });
  }

  const channelName =
    `${type[0]}-${interaction.user.id}`;

  const existing =
    guild.channels.cache.find(
      channel =>
        channel.name === channelName
    );

  if (existing) {
    return interaction.reply({
      content:
        `❌ Už máš otevřený ticket: ${existing}`,
      ephemeral: true
    });
  }

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [
        PermissionsBitField.Flags.ViewChannel
      ]
    },

    {
      id: interaction.user.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles
      ]
    }
  ];

  for (const roleName of STAFF_ROLES) {

    const role =
      guild.roles.cache.find(
        r => r.name === roleName
      );

    if (role) {
      overwrites.push({
        id: role.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles
        ]
      });
    }
  }

  const channel =
    await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: overwrites
    });

  const embed =
    new EmbedBuilder()
      .setTitle(type[1])
      .setDescription(
        `👤 **Autor:** ${interaction.user}\n\n` +
        "📝 Popiš svůj problém co nejpodrobněji.\n" +
        "📸 Přilož důkazy, pokud je máš.\n\n" +
        "🛡️ Staff může ticket převzít.\n" +
        "👑 Staff může ticket předat vedení.\n" +
        "🔒 Po vyřešení ticket uzavři."
      )
      .setColor(0x5865f2);

  const buttons =
    new ActionRowBuilder()
      .addComponents(

        new ButtonBuilder()
          .setCustomId("ticket_claim")
          .setLabel("🛡️ Převzít")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("ticket_management")
          .setLabel("👑 Předat vedení")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId("ticket_close")
          .setLabel("🔒 Zavřít")
          .setStyle(ButtonStyle.Danger)
      );

  await channel.send({
    content:
      `${interaction.user} ${getStaffMentions(guild)}`,
    embeds: [embed],
    components: [buttons]
  });

  await interaction.reply({
    content:
      `✅ Ticket vytvořen: ${channel}`,
    ephemeral: true
  });
});

/* =====================================================
   TICKET ACTIONS
===================================================== */

client.on("interactionCreate", async interaction => {

  if (!interaction.isButton()) {
    return;
  }

  if (
    ![
      "ticket_claim",
      "ticket_management",
      "ticket_close"
    ].includes(interaction.customId)
  ) {
    return;
  }

  if (
    !isStaff(interaction.member) &&
    !isManagement(interaction.member)
  ) {
    return interaction.reply({
      content:
        "❌ Tuto akci může použít pouze staff.",
      ephemeral: true
    });
  }

  if (
    interaction.customId === "ticket_claim"
  ) {

    await interaction.reply(
      `🛡️ Ticket převzal ${interaction.user}.`
    );

    return;
  }

  if (
    interaction.customId === "ticket_management"
  ) {

    for (const roleName of MANAGEMENT_ROLES) {

      const role =
        interaction.guild.roles.cache.find(
          r => r.name === roleName
        );

      if (role) {

        await interaction.channel.permissionOverwrites.edit(
          role.id,
          {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
          }
        );
      }
    }

    await interaction.reply(
      "👑 **Ticket byl předán vedení.**\n\n" +
      getManagementMentions(
        interaction.guild
      )
    );

    return;
  }

  if (
    interaction.customId === "ticket_close"
  ) {

    await interaction.reply(
      "🔒 Ticket se zavře za 5 sekund."
    );

    setTimeout(async () => {

      try {
        await interaction.channel.delete(
          "Ticket uzavřen"
        );
      } catch {}

    }, 5000);
  }
});

/* =====================================================
   SHIFT COMMANDS
===================================================== */

client.on("messageCreate", async message => {

  if (
    message.author.bot ||
    !message.guild
  ) {
    return;
  }

  const command =
    message.content.trim().toLowerCase();

  const commands = [
    "!startshift",
    "!endshift",
    "!shift",
    "!myhours",
    "!leaderboard"
  ];

  if (!commands.includes(command)) {
    return;
  }

  if (!isStaff(message.member)) {
    return message.reply(
      "❌ Tento příkaz je pouze pro staff."
    );
  }

  const id =
    message.author.id;

  if (!staffData.users[id]) {
    staffData.users[id] = {
      username: message.author.username,
      totalSeconds: 0,
      activeSince: null
    };
  }

  const user =
    staffData.users[id];

  user.username =
    message.author.username;

  /* START */

  if (command === "!startshift") {

    if (user.activeSince) {
      return message.reply(
        "🟡 Už máš aktivní směnu."
      );
    }

    user.activeSince =
      Date.now();

    saveData();

    await message.reply(
      "🟢 **OORP SMĚNA ZAHÁJENA**\n\n" +
      `👤 ${message.author}\n` +
      `🕐 ${new Date().toLocaleString("cs-CZ")}\n\n` +
      "Po skončení použij `!endshift`."
    );

    await logStaff(
      message.guild,
      `🟢 ${message.author.tag} zahájil OORP směnu.`
    );

    return;
  }

  /* END */

  if (command === "!endshift") {

    if (!user.activeSince) {
      return message.reply(
        "🔴 Nemáš aktivní směnu."
      );
    }

    const seconds =
      Math.floor(
        (Date.now() -
          user.activeSince) / 1000
      );

    user.totalSeconds +=
      seconds;

    user.activeSince =
      null;

    saveData();

    await message.reply(
      "🔴 **OORP SMĚNA UKONČENA**\n\n" +
      `⏱️ Tato směna: **${formatTime(seconds)}**\n` +
      `🏆 Celkem: **${formatTime(user.totalSeconds)}**`
    );

    await logStaff(
      message.guild,
      `🔴 ${message.author.tag} ukončil směnu. Délka: ${formatTime(seconds)}`
    );

    await refreshLeaderboard(
      message.guild
    );

    return;
  }

  /* STATUS */

  if (command === "!shift") {

    if (!user.activeSince) {
      return message.reply(
        "🔴 Nemáš aktivní směnu."
      );
    }

    const seconds =
      Math.floor(
        (Date.now() -
          user.activeSince) / 1000
      );

    return message.reply(
      `🟢 **Aktivní směna:** ${formatTime(seconds)}`
    );
  }

  /* HOURS */

  if (command === "!myhours") {

    let seconds =
      user.totalSeconds;

    if (user.activeSince) {
      seconds +=
        Math.floor(
          (Date.now() -
            user.activeSince) / 1000
        );
    }

    return message.reply(
      `🏆 **Tvůj OORP čas:** ${formatTime(seconds)}`
    );
  }

  /* LEADERBOARD */

  if (command === "!leaderboard") {

    return message.reply(
      createLeaderboard()
    );
  }
});

/* =====================================================
   TIME
===================================================== */

function formatTime(seconds) {

  seconds =
    Math.max(0, Math.floor(seconds));

  const hours =
    Math.floor(seconds / 3600);

  const minutes =
    Math.floor(
      (seconds % 3600) / 60
    );

  const secs =
    seconds % 60;

  return `${hours} h ${minutes} min ${secs} s`;
}

/* =====================================================
   LEADERBOARD
===================================================== */

function createLeaderboard() {

  const users =
    Object.entries(
      staffData.users
    )
      .map(([id, data]) => {

        let seconds =
          data.totalSeconds || 0;

        if (data.activeSince) {
          seconds +=
            Math.floor(
              (Date.now() -
                data.activeSince) / 1000
            );
        }

        return {
          id,
          username:
            data.username || "Neznámý",
          seconds
        };
      })
      .sort(
        (a, b) =>
          b.seconds - a.seconds
      );

  if (users.length === 0) {
    return (
      "🏆 **STAFF OORP LEADERBOARD**\n\n" +
      "Zatím nejsou žádné směny."
    );
  }

  let text =
    "🏆 **STAFF OORP LEADERBOARD**\n\n";

  const medals = [
    "🥇",
    "🥈",
    "🥉"
  ];

  users
    .slice(0, 10)
    .forEach((user, index) => {

      const medal =
        medals[index] ||
        `${index + 1}.`;

      text +=
        `${medal} **${user.username}** — ${formatTime(user.seconds)}\n`;
    });

  return text;
}

/* =====================================================
   LEADERBOARD CHANNEL
===================================================== */

async function updateLeaderboard(channel) {

  const messages =
    await channel.messages.fetch({
      limit: 20
    });

  const botMessage =
    messages.find(
      message =>
        message.author.id === client.user.id
    );

  const embed =
    new EmbedBuilder()
      .setTitle(
        "🏆 STAFF OORP LEADERBOARD"
      )
      .setDescription(
        createLeaderboard()
      )
      .setColor(0xffd700)
      .setFooter({
        text:
          "Aktualizuje se automaticky."
      });

  if (botMessage) {

    await botMessage.edit({
      embeds: [embed]
    });

  } else {

    await channel.send({
      embeds: [embed]
    });

  }
}

async function refreshLeaderboard(guild) {

  const channel =
    guild.channels.cache.find(
      c =>
        c.name ===
        "🏆・staff-leaderboard"
    );

  if (!channel) {
    return;
  }

  await updateLeaderboard(channel);
}

/* =====================================================
   STAFF LOG
===================================================== */

async function logStaff(guild, text) {

  const channel =
    guild.channels.cache.find(
      c =>
        c.name ===
        "🛡️・staff-log"
    );

  if (!channel) {
    return;
  }

  await channel.send(text);
}

/* =====================================================
   MENTIONS
===================================================== */

function getStaffMentions(guild) {

  return STAFF_ROLES
    .map(name =>
      guild.roles.cache.find(
        r => r.name === name
      )
    )
    .filter(Boolean)
    .map(role =>
      `<@&${role.id}>`
    )
    .join(" ");
}

function getManagementMentions(guild) {

  return MANAGEMENT_ROLES
    .map(name =>
      guild.roles.cache.find(
        r => r.name === name
      )
    )
    .filter(Boolean)
    .map(role =>
      `<@&${role.id}>`
    )
    .join(" ");
}

/* =====================================================
   AUTO LEADERBOARD
===================================================== */

setInterval(async () => {

  for (const guild of client.guilds.cache.values()) {

    try {
      await refreshLeaderboard(guild);
    } catch (error) {
      console.error(
        "❌ Leaderboard:",
        error
      );
    }
  }

}, 60000);

/* =====================================================
   MEMBER LOG
===================================================== */

client.on("guildMemberAdd", async member => {

  const channel =
    member.guild.channels.cache.find(
      c =>
        c.name ===
        "🛡️・staff-log"
    );

  if (channel) {
    await channel.send(
      `📥 **NOVÝ ČLEN**\n👤 ${member.user.tag}\n🆔 ${member.id}`
    );
  }
});

client.on("guildMemberRemove", async member => {

  const channel =
    member.guild.channels.cache.find(
      c =>
        c.name ===
        "🛡️・staff-log"
    );

  if (channel) {
    await channel.send(
      `📤 **ČLEN ODEŠEL**\n👤 ${member.user.tag}\n🆔 ${member.id}`
    );
  }
});

/* =====================================================
   LOGIN
===================================================== */

client.login(TOKEN);

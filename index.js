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

// =====================================================
// BOT
// =====================================================

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

// =====================================================
// DATA
// =====================================================

const dataFile = path.join(__dirname, "bot-data.json");

let data = {
  users: {},
  warnings: {}
};

function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    }
  } catch (error) {
    console.error("❌ Chyba při načítání dat:", error);
    data = {
      users: {},
      warnings: {}
    };
  }
}

function saveData() {
  try {
    fs.writeFileSync(
      dataFile,
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error("❌ Chyba při ukládání dat:", error);
  }
}

loadData();

// =====================================================
// ROLE
// =====================================================

const ROLE_CONFIG = [

  // VEDENÍ
  ["👑 Majitel", 0xff0000],
  ["💎 Spolumajitel", 0xff00ff],
  ["🏆 Zakladatel", 0xffd700],
  ["🧠 Ředitel projektu", 0x9b59b6],
  ["📋 Vedoucí projektu", 0x3498db],

  // STAFF
  ["👑 Hlavní administrátor", 0xc0392b],
  ["🔴 Senior administrátor", 0xe74c3c],
  ["🟠 Administrátor", 0xe67e22],
  ["🟡 Junior administrátor", 0xf1c40f],
  ["⚪ Zkušební administrátor", 0x7f8c8d],

  // POLICIE
  ["🚓 Policejní prezident", 0x1f5eff],
  ["⭐ Vrchní komisař", 0x2874a6],
  ["👮 Komisař", 0x3498db],
  ["🚔 Inspektor", 0x2980b9],
  ["👮 Strážník", 0x5dade2],
  ["🎓 Kadet policie", 0x85c1e9],

  // HASIČI
  ["🚒 Generální ředitel HZS", 0xc0392b],
  ["🔥 Velitel hasičů", 0xe74c3c],
  ["🚒 Zástupce velitele HZS", 0xd35400],
  ["🧯 Hasič", 0xe67e22],
  ["🎓 Hasič nováček", 0xf5b041],

  // ZZS
  ["🚑 Ředitel ZZS", 0x27ae60],
  ["🩺 Vrchní lékař", 0x229954],
  ["🚑 Lékař", 0x2ecc71],
  ["💉 Zdravotník", 0x58d68d],
  ["🎓 Záchranář nováček", 0x82e0aa],

  // KRIMINÁLNÍ RP
  ["💀 Boss", 0x000000],
  ["🔫 Underboss", 0x17202a],
  ["🕶️ Capo", 0x212f3d],
  ["🔪 Člen gangu", 0x34495e],
  ["🎓 Nováček gangu", 0x566573],

  // OSTATNÍ
  ["🎉 Event tým", 0x9b59b6],
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

const FRACTION_ROLES = [
  "🚓 Policejní prezident",
  "⭐ Vrchní komisař",
  "👮 Komisař",
  "🚔 Inspektor",
  "👮 Strážník",
  "🎓 Kadet policie",

  "🚒 Generální ředitel HZS",
  "🔥 Velitel hasičů",
  "🚒 Zástupce velitele HZS",
  "🧯 Hasič",
  "🎓 Hasič nováček",

  "🚑 Ředitel ZZS",
  "🩺 Vrchní lékař",
  "🚑 Lékař",
  "💉 Zdravotník",
  "🎓 Záchranář nováček",

  "💀 Boss",
  "🔫 Underboss",
  "🕶️ Capo",
  "🔪 Člen gangu",
  "🎓 Nováček gangu"
];

// =====================================================
// POMOCNÉ FUNKCE
// =====================================================

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

async function getOrCreateCategory(
  guild,
  name,
  permissionOverwrites = undefined
) {

  let category = guild.channels.cache.find(
    c =>
      c.type === ChannelType.GuildCategory &&
      c.name === name
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

async function getOrCreateChannel(
  guild,
  name,
  parent,
  permissionOverwrites = undefined
) {

  let channel = guild.channels.cache.find(
    c =>
      c.type === ChannelType.GuildText &&
      c.name === name
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

async function sendOnce(channel, content) {

  const messages = await channel.messages.fetch({
    limit: 20
  });

  const botMessage = messages.find(
    message =>
      message.author.id === client.user.id
  );

  if (!botMessage) {
    await channel.send(content);
  }
}

function formatTime(seconds) {

  seconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const hours = Math.floor(
    seconds / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const secs = seconds % 60;

  return `${hours} h ${minutes} min ${secs} s`;
}

function getStaffMentions(guild) {

  return STAFF_ROLES
    .map(name =>
      guild.roles.cache.find(
        r => r.name === name
      )
    )
    .filter(Boolean)
    .map(role => `<@&${role.id}>`)
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
    .map(role => `<@&${role.id}>`)
    .join(" ");
}

// =====================================================
// TEXTY
// =====================================================

const TEXT = {

rules: `
📜 **PRAVIDLA DISCORDU**

1️⃣ Chovej se slušně.
2️⃣ Zákaz šikany.
3️⃣ Zákaz spamu a floodu.
4️⃣ Zákaz reklamy bez povolení.
5️⃣ Zákaz vydávání se za staff.
6️⃣ Zákaz zveřejňování osobních údajů.
7️⃣ Respektuj ostatní.
8️⃣ Dodržuj Discord ToS.
9️⃣ Respektuj moderaci.
🔟 Problémy řeš přes ticket.

⚠️ Porušení může vést k warnu, timeoutu, kicku nebo banu.
`,

rpRules: `
🎭 **RP PRAVIDLA**

🔹 **FailRP** – nereálné RP.
🔹 **RDM** – útok/zabití bez RP důvodu.
🔹 **VDM** – použití vozidla jako zbraně.
🔹 **NLR** – návrat do situace po smrti.
🔹 **Metagaming** – využití OORP informací.
🔹 **Powergaming** – nucení nereálných akcí.
🔹 **FearRP** – respektování ohrožení života.
🔹 **Combat Logging** – odpojení během RP.
🔹 **Cop Baiting** – nesmyslné provokování policie.
🔹 **NVL** – ignorování vlastního života.
🔹 **Revenge RP** – nepovolená pomsta.

🎭 Hraj realisticky.
`,

staffRules: `
🛡️ **STAFF PRAVIDLA**

1️⃣ Staff musí být nestranný.
2️⃣ Staff nesmí zvýhodňovat kamarády.
3️⃣ Zákaz zneužívání pravomocí.
4️⃣ Zákaz využívání OORP informací.
5️⃣ Respektuj probíhající RP.
6️⃣ Vyslechni obě strany.
7️⃣ Vyžaduj důkazy.
8️⃣ Sporné případy předávej Senior Adminovi.
9️⃣ Konflikt zájmů řeší jiný staff.
🔟 Závažné případy předávej vedení.
`,

factions: `
🏛️ **FRAKCE A HODNOSTI**

🚓 **POLICIE**
• Policejní prezident
• Vrchní komisař
• Komisař
• Inspektor
• Strážník
• Kadet policie

🚒 **HASIČI**
• Generální ředitel HZS
• Velitel hasičů
• Zástupce velitele HZS
• Hasič
• Hasič nováček

🚑 **ZZS**
• Ředitel ZZS
• Vrchní lékař
• Lékař
• Zdravotník
• Záchranář nováček

🔫 **KRIMINÁLNÍ RP**
• Boss
• Underboss
• Capo
• Člen gangu
• Nováček gangu
`,

punishments: `
⚖️ **STAFF TRESTY**

🟢 Upozornění
🟡 Warn
🟠 Timeout
🔴 Kick
⛔ Dočasný ban
🚫 Permanentní ban
🛡️ Odebrání staff role
👑 Předání vedení

⚠️ Trest musí odpovídat situaci.
`,

economy: `
💰 **EKONOMIKA RP**

• Peníze musí mít RP původ.
• Podniky musí být schválené.
• Pozemky eviduje vedení.
• Zákaz zneužívání systému.
• Zákaz OORP výhod.
`,

events: `
🎉 **EVENTY**

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
`,

properties: `
🏠 **POZEMKY**

O pozemek se žádá přes ticket.

Uveď:
• Discord jméno
• požadované místo
• účel
• screenshot

👑 Vedení žádost schválí nebo zamítne.
`,

businesses: `
🏢 **PODNIKY**

Možné RP podniky:

🍔 Restaurace
🔧 Autoservis
🏪 Obchod
⛽ Čerpací stanice
🏢 Firma

Žádost vytvoř přes ticket.
`,

shift: `
⏱️ **STAFF SMĚNY**

\`!startshift\`
Začne směnu.

\`!endshift\`
Ukončí směnu.

\`!shift\`
Zobrazí aktuální směnu.

\`!myhours\`
Zobrazí tvůj čas.

\`!leaderboard\`
Zobrazí leaderboard.
`
};

// =====================================================
// SLASH COMMANDS
// =====================================================

const commands = [

  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Nastaví celý RP Discord server.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Zobrazí informace o serveru."),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Zobrazí informace o uživateli.")
    .addUserOption(option =>
      option
        .setName("uzivatel")
        .setDescription("Uživatel")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Udělí uživateli warn.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers
    )
    .addUserOption(option =>
      option
        .setName("uzivatel")
        .setDescription("Uživatel")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("duvod")
        .setDescription("Důvod")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Zobrazí warny uživatele.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers
    )
    .addUserOption(option =>
      option
        .setName("uzivatel")
        .setDescription("Uživatel")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Smaže zprávy.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageMessages
    )
    .addIntegerOption(option =>
      option
        .setName("pocet")
        .setDescription("1–100")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Vyhodí uživatele.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.KickMembers
    )
    .addUserOption(option =>
      option
        .setName("uzivatel")
        .setDescription("Uživatel")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("duvod")
        .setDescription("Důvod")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Zabanuje uživatele.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.BanMembers
    )
    .addUserOption(option =>
      option
        .setName("uzivatel")
        .setDescription("Uživatel")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("duvod")
        .setDescription("Důvod")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Dá uživateli timeout.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ModerateMembers
    )
    .addUserOption(option =>
      option
        .setName("uzivatel")
        .setDescription("Uživatel")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName("minuty")
        .setDescription("Délka timeoutu")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("duvod")
        .setDescription("Důvod")
        .setRequired(false)
    )
];

// =====================================================
// READY
// =====================================================

client.once("ready", async () => {

  console.log(
    `✅ Bot je online jako ${client.user.tag}`
  );

  const rest = new REST({
    version: "10"
  }).setToken(TOKEN);

  for (const guild of client.guilds.cache.values()) {

    try {

      await rest.put(
        Routes.applicationGuildCommands(
          client.user.id,
          guild.id
        ),
        {
          body: commands.map(
            command => command.toJSON()
          )
        }
      );

      console.log(
        `✅ Příkazy registrovány: ${guild.name}`
      );

    } catch (error) {

      console.error(
        `❌ Registrace příkazů ${guild.name}:`,
        error
      );
    }
  }
});

// =====================================================
// SETUP
// =====================================================

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
        "❌ Tento příkaz může použít pouze administrátor.",
      ephemeral: true
    });
  }

  await interaction.deferReply({
    ephemeral: true
  });

  try {

    const guild = interaction.guild;

    console.log(
      `⚙️ Spouštím setup pro ${guild.name}`
    );

    // ROLE
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

    // =================================================
    // INFORMACE
    // =================================================

    const info =
      await getOrCreateCategory(
        guild,
        "📌 INFORMACE"
      );

    const rules =
      await getOrCreateChannel(
        guild,
        "📜・pravidla",
        info
      );

    const rpRules =
      await getOrCreateChannel(
        guild,
        "🎭・rp-pravidla",
        info
      );

    const factions =
      await getOrCreateChannel(
        guild,
        "🏛️・frakce-a-hodnosti",
        info
      );

    const faq =
      await getOrCreateChannel(
        guild,
        "❓・faq",
        info
      );

    const announcements =
      await getOrCreateChannel(
        guild,
        "📢・oznámení",
        info
      );

    // =================================================
    // HRA
    // =================================================

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

    // =================================================
    // KOMUNITA
    // =================================================

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

    const events =
      await getOrCreateChannel(
        guild,
        "🎉・eventy",
        community,
        publicPerms
      );

    // =================================================
    // STAFF
    // =================================================

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

    const staffInfo =
      await getOrCreateChannel(
        guild,
        "📋・staff-info",
        staff,
        staffPerms
      );

    const staffRules =
      await getOrCreateChannel(
        guild,
        "📜・staff-pravidla",
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

    // =================================================
    // TICKETY
    // =================================================

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

    // =================================================
    // VEDENÍ
    // =================================================

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

    const meetings =
      await getOrCreateChannel(
        guild,
        "📋・porady-vedení",
        management,
        managementPerms
      );

    // =================================================
    // LOGY
    // =================================================

    const logs =
      await getOrCreateCategory(
        guild,
        "📊 LOGY",
        staffPerms
      );

    const staffLogs =
      await getOrCreateChannel(
        guild,
        "🛡️・staff-log",
        logs,
        staffPerms
      );

    const ticketLogs =
      await getOrCreateChannel(
        guild,
        "🎫・ticket-log",
        logs,
        staffPerms
      );

    const moderationLogs =
      await getOrCreateChannel(
        guild,
        "⚖️・moderation-log",
        logs,
        staffPerms
      );

    // =================================================
    // TEXTY
    // =================================================

    await sendOnce(
      rules,
      TEXT.rules
    );

    await sendOnce(
      rpRules,
      TEXT.rpRules
    );

    await sendOnce(
      factions,
      TEXT.factions
    );

    await sendOnce(
      faq,
      `
❓ **FAQ**

🎫 Report → vytvoř ticket.
🏠 Pozemek → vytvoř ticket.
🏢 Podnik → vytvoř ticket.
🔓 Unban → vytvoř ticket.
👮 Nábor → vytvoř ticket.
🎉 Eventy → sleduj #🎉・eventy.
🛡️ Staff → kontaktuj administraci.
`
    );

    await sendOnce(
      announcements,
      "📢 **OZNÁMENÍ SERVERU**\n\nDůležitá oznámení budou zveřejňována zde."
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
      "🚓 **POLICIE**\n\nInformace pro policejní RP."
    );

    await sendOnce(
      fire,
      "🚒 **HASIČI**\n\nInformace pro hasičské RP."
    );

    await sendOnce(
      medic,
      "🚑 **ZZS**\n\nInformace pro zdravotnické RP."
    );

    await sendOnce(
      criminal,
      "🔫 **KRIMINÁLNÍ RP**\n\nInformace pro kriminální RP."
    );

    await sendOnce(
      chat,
      "💬 **VÍTEJ NA SERVERU!**\n\nRespektuj ostatní a užij si RP."
    );

    await sendOnce(
      events,
      TEXT.events
    );

    await sendOnce(
      staffChat,
      "🛡️ **STAFF CHAT**\n\nInterní komunikace staff týmu."
    );

    await sendOnce(
      staffInfo,
      TEXT.staffRules
    );

    await sendOnce(
      staffRules,
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

👤 Hráč:
🕐 Datum:
📝 Popis:
📸 Důkazy:
⚖️ Výsledek:
`
    );

    await sendOnce(
      staffShifts,
      TEXT.shift
    );

    await sendOnce(
      managementChat,
      "👑 **VEDENÍ**\n\nInterní komunikace vedení."
    );

    await sendOnce(
      meetings,
      "📋 **PORADY VEDENÍ**\n\nInterní plánování vedení."
    );

    await sendOnce(
      staffLogs,
      "🛡️ **STAFF LOG**"
    );

    await sendOnce(
      ticketLogs,
      "🎫 **TICKET LOG**"
    );

    await sendOnce(
      moderationLogs,
      "⚖️ **MODERATION LOG**"
    );

    // =================================================
    // TICKET PANEL
    // =================================================

    const messages =
      await ticketPanel.messages.fetch({
        limit: 20
      });

    const existing =
      messages.find(
        message =>
          message.author.id === client.user.id
      );

    if (!existing) {

      const embed =
        new EmbedBuilder()
          .setTitle("🎫 TICKET SYSTÉM")
          .setDescription(
            "Vyber typ ticketu níže."
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
        components: [
          row1,
          row2
        ]
      });
    }

    await updateLeaderboard(
      leaderboard
    );

    await interaction.editReply(
      "✅ **SERVER ÚSPĚŠNĚ NASTAVEN!**\n\n" +
      "🏛️ Frakce a hodnosti → HOTOVO\n" +
      "🛡️ Staff systém → HOTOVO\n" +
      "🎫 Tickety → HOTOVO\n" +
      "⏱️ Směny → HOTOVO\n" +
      "🏆 Leaderboard → HOTOVO\n" +
      "⚖️ Moderace → HOTOVO\n" +
      "📊 Logy → HOTOVO\n" +
      "🎉 Eventy → HOTOVO\n" +
      "🏠 Pozemky → HOTOVO\n" +
      "🏢 Podniky → HOTOVO\n\n" +
      "🔥 **Všechno je připravené!**"
    );

  } catch (error) {

    console.error(
      "❌ SETUP ERROR:",
      error
    );

    await interaction.editReply(
      "❌ Setup se nepodařilo dokončit.\n\n" +
      "Podívej se do Railway Logs."
    );
  }
});

// =====================================================
// TICKETY
// =====================================================

const TICKET_TYPES = {

  ticket_support:
    ["podpora", "🛠️ Podpora"],

  ticket_report:
    ["report", "🚨 Report"],

  ticket_property:
    ["pozemek", "🏠 Pozemek"],

  ticket_business:
    ["podnik", "🏢 Podnik"],

  ticket_recruitment:
    ["nabor", "👮 Nábor"],

  ticket_unban:
    ["unban", "🔓 Unban"],

  ticket_partner:
    ["partnerstvi", "🤝 Partnerství"]
};

// =====================================================
// BUTTONS
// =====================================================

client.on("interactionCreate", async interaction => {

  if (!interaction.isButton()) {
    return;
  }

  // ---------------------------------------------------
  // CREATE TICKET
  // ---------------------------------------------------

  const type =
    TICKET_TYPES[
      interaction.customId
    ];

  if (type) {

    const guild =
      interaction.guild;

    const category =
      guild.channels.cache.find(
        c =>
          c.type === ChannelType.GuildCategory &&
          c.name === "🎫 TICKETY"
      );

    if (!category) {

      return interaction.reply({
        content:
          "❌ Ticket kategorie neexistuje. Použij `/setup`.",
        ephemeral: true
      });
    }

    const channelName =
      `${type[0]}-${interaction.user.id}`;

    const existing =
      guild.channels.cache.find(
        c =>
          c.name === channelName
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
          r =>
            r.name === roleName
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
          "👑 Ticket lze předat vedení.\n" +
          "🔒 Ticket lze následně zavřít."
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

    return;
  }

  // ---------------------------------------------------
  // TICKET ACTIONS
  // ---------------------------------------------------

  if (
    ![
      "ticket_claim",
      "ticket_management",
      "ticket_close"
    ].includes(
      interaction.customId
    )
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
    interaction.customId ===
    "ticket_claim"
  ) {

    await interaction.reply(
      `🛡️ Ticket převzal ${interaction.user}.`
    );

    return;
  }

  if (
    interaction.customId ===
    "ticket_management"
  ) {

    for (
      const roleName of MANAGEMENT_ROLES
    ) {

      const role =
        interaction.guild.roles.cache.find(
          r =>
            r.name === roleName
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
    interaction.customId ===
    "ticket_close"
  ) {

    await interaction.reply(
      "🔒 Ticket bude uzavřen za 5 sekund."
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

// =====================================================
// MODERACE
// =====================================================

client.on("interactionCreate", async interaction => {

  if (
    !interaction.isChatInputCommand()
  ) {
    return;
  }

  const command =
    interaction.commandName;

  // ---------------------------------------------------
  // SERVERINFO
  // ---------------------------------------------------

  if (command === "serverinfo") {

    const guild =
      interaction.guild;

    const embed =
      new EmbedBuilder()
        .setTitle(
          `📊 ${guild.name}`
        )
        .addFields(
          {
            name: "👥 Členové",
            value:
              `${guild.memberCount}`,
            inline: true
          },
          {
            name: "📁 Kanály",
            value:
              `${guild.channels.cache.size}`,
            inline: true
          },
          {
            name: "🎭 Role",
            value:
              `${guild.roles.cache.size}`,
            inline: true
          }
        )
        .setColor(0x5865f2);

    return interaction.reply({
      embeds: [embed]
    });
  }

  // ---------------------------------------------------
  // USERINFO
  // ---------------------------------------------------

  if (command === "userinfo") {

    const user =
      interaction.options.getUser(
        "uzivatel"
      ) || interaction.user;

    const member =
      await interaction.guild.members.fetch(
        user.id
      );

    const embed =
      new EmbedBuilder()
        .setTitle(
          `👤 ${user.username}`
        )
        .setThumbnail(
          user.displayAvatarURL()
        )
        .addFields(
          {
            name: "🆔 ID",
            value: user.id
          },
          {
            name: "📅 Účet vytvořen",
            value:
              `<t:${Math.floor(
                user.createdTimestamp / 1000
              )}:F>`
          },
          {
            name: "📥 Na serveru od",
            value:
              member.joinedTimestamp
                ? `<t:${Math.floor(
                    member.joinedTimestamp / 1000
                  )}:F>`
                : "Neznámé"
          },
          {
            name: "🎭 Role",
            value:
              member.roles.cache
                .filter(r => r.id !== interaction.guild.id)
                .map(r => r.toString())
                .slice(0, 15)
                .join(" ") ||
              "Žádné"
          }
        )
        .setColor(0x5865f2);

    return interaction.reply({
      embeds: [embed]
    });
  }

  // ---------------------------------------------------
  // WARN
  // ---------------------------------------------------

  if (command === "warn") {

    const user =
      interaction.options.getUser(
        "uzivatel"
      );

    const reason =
      interaction.options.getString(
        "duvod"
      );

    if (
      user.id === interaction.user.id
    ) {

      return interaction.reply({
        content:
          "❌ Nemůžeš warnovat sám sebe.",
        ephemeral: true
      });
    }

    if (!data.warnings[user.id]) {
      data.warnings[user.id] = [];
    }

    data.warnings[user.id].push({
      reason,
      moderator:
        interaction.user.id,
      date:
        new Date().toISOString()
    });

    saveData();

    await interaction.reply(
      `⚠️ **${user.tag} dostal WARN.**\n\n` +
      `📝 Důvod: ${reason}`
    );

    await sendModerationLog(
      interaction.guild,
      `⚠️ ${user.tag} dostal WARN od ${interaction.user.tag}. Důvod: ${reason}`
    );

    return;
  }

  // ---------------------------------------------------
  // WARNINGS
  // ---------------------------------------------------

  if (command === "warnings") {

    const user =
      interaction.options.getUser(
        "uzivatel"
      );

    const warnings =
      data.warnings[user.id] || [];

    if (!warnings.length) {

      return interaction.reply({
        content:
          `✅ ${user.tag} nemá žádné warny.`,
        ephemeral: true
      });
    }

    let text =
      `⚠️ **Warny uživatele ${user.tag}**\n\n`;

    warnings.forEach(
      (warn, index) => {

        text +=
          `**${index + 1}.** ${warn.reason}\n`;
      }
    );

    return interaction.reply({
      content: text,
      ephemeral: true
    });
  }

  // ---------------------------------------------------
  // CLEAR
  // ---------------------------------------------------

  if (command === "clear") {

    const amount =
      interaction.options.getInteger(
        "pocet"
      );

    await interaction.channel.bulkDelete(
      amount,
      true
    );

    return interaction.reply({
      content:
        `🧹 Smazáno ${amount} zpráv.`,
      ephemeral: true
    });
  }

  // ---------------------------------------------------
  // KICK
  // ---------------------------------------------------

  if (command === "kick") {

    const user =
      interaction.options.getUser(
        "uzivatel"
      );

    const reason =
      interaction.options.getString(
        "duvod"
      ) || "Bez důvodu";

    const member =
      await interaction.guild.members.fetch(
        user.id
      );

    if (!member.kickable) {

      return interaction.reply({
        content:
          "❌ Tohoto uživatele nemohu kicknout.",
        ephemeral: true
      });
    }

    await member.kick(reason);

    await interaction.reply(
      `👢 **${user.tag} byl kicknut.**\n📝 ${reason}`
    );

    await sendModerationLog(
      interaction.guild,
      `👢 ${user.tag} byl kicknut uživatelem ${interaction.user.tag}. Důvod: ${reason}`
    );

    return;
  }

  // ---------------------------------------------------
  // BAN
  // ---------------------------------------------------

  if (command === "ban") {

    const user =
      interaction.options.getUser(
        "uzivatel"
      );

    const reason =
      interaction.options.getString(
        "duvod"
      ) || "Bez důvodu";

    const member =
      await interaction.guild.members.fetch(
        user.id
      );

    if (!member.bannable) {

      return interaction.reply({
        content:
          "❌ Tohoto uživatele nemohu banovat.",
        ephemeral: true
      });
    }

    await member.ban({
      reason
    });

    await interaction.reply(
      `🔨 **${user.tag} byl zabanován.**\n📝 ${reason}`
    );

    await sendModerationLog(
      interaction.guild,
      `🔨 ${user.tag} byl zabanován uživatelem ${interaction.user.tag}. Důvod: ${reason}`
    );

    return;
  }

  // ---------------------------------------------------
  // TIMEOUT
  // ---------------------------------------------------

  if (command === "timeout") {

    const user =
      interaction.options.getUser(
        "uzivatel"
      );

    const minutes =
      interaction.options.getInteger(
        "minuty"
      );

    const reason =
      interaction.options.getString(
        "duvod"
      ) || "Bez důvodu";

    const member =
      await interaction.guild.members.fetch(
        user.id
      );

    if (!member.moderatable) {

      return interaction.reply({
        content:
          "❌ Tomuto uživateli nemohu dát timeout.",
        ephemeral: true
      });
    }

    await member.timeout(
      minutes * 60 * 1000,
      reason
    );

    await interaction.reply(
      `⏳ **${user.tag} dostal timeout na ${minutes} minut.**\n📝 ${reason}`
    );

    await sendModerationLog(
      interaction.guild,
      `⏳ ${user.tag} dostal timeout od ${interaction.user.tag} na ${minutes} minut. Důvod: ${reason}`
    );

    return;
  }
});

// =====================================================
// STAFF SMĚNY
// =====================================================

client.on("messageCreate", async message => {

  if (
    message.author.bot ||
    !message.guild
  ) {
    return;
  }

  const command =
    message.content
      .trim()
      .toLowerCase();

  const commands =
    [
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

  if (!data.users[id]) {

    data.users[id] = {
      username:
        message.author.username,
      totalSeconds: 0,
      activeSince: null
    };
  }

  const user =
    data.users[id];

  user.username =
    message.author.username;

  // START
  if (
    command === "!startshift"
  ) {

    if (user.activeSince) {

      return message.reply(
        "🟡 Už máš aktivní směnu."
      );
    }

    user.activeSince =
      Date.now();

    saveData();

    await message.reply(
      "🟢 **STAFF SMĚNA ZAHÁJENA**\n\n" +
      `👤 ${message.author}\n` +
      "Po skončení použij `!endshift`."
    );

    await sendStaffLog(
      message.guild,
      `🟢 ${message.author.tag} zahájil směnu.`
    );

    return;
  }

  // END
  if (
    command === "!endshift"
  ) {

    if (!user.activeSince) {

      return message.reply(
        "🔴 Nemáš aktivní směnu."
      );
    }

    const seconds =
      Math.floor(
        (Date.now() -
          user.activeSince) /
        1000
      );

    user.totalSeconds +=
      seconds;

    user.activeSince =
      null;

    saveData();

    await message.reply(
      "🔴 **STAFF SMĚNA UKONČENA**\n\n" +
      `⏱️ Směna: **${formatTime(seconds)}**\n` +
      `🏆 Celkem: **${formatTime(user.totalSeconds)}**`
    );

    await refreshLeaderboard(
      message.guild
    );

    return;
  }

  // STATUS
  if (
    command === "!shift"
  ) {

    if (!user.activeSince) {

      return message.reply(
        "🔴 Nemáš aktivní směnu."
      );
    }

    const seconds =
      Math.floor(
        (Date.now() -
          user.activeSince) /
        1000
      );

    return message.reply(
      `🟢 **Aktivní směna:** ${formatTime(seconds)}`
    );
  }

  // HOURS
  if (
    command === "!myhours"
  ) {

    let seconds =
      user.totalSeconds;

    if (user.activeSince) {

      seconds +=
        Math.floor(
          (Date.now() -
            user.activeSince) /
          1000
        );
    }

    return message.reply(
      `🏆 **Tvůj staff čas:** ${formatTime(seconds)}`
    );
  }

  // LEADERBOARD
  if (
    command === "!leaderboard"
  ) {

    return message.reply(
      createLeaderboard()
    );
  }
});

// =====================================================
// LEADERBOARD
// =====================================================

function createLeaderboard() {

  const users =
    Object.entries(
      data.users
    )
      .map(
        ([id, user]) => {

          let seconds =
            user.totalSeconds || 0;

          if (user.activeSince) {

            seconds +=
              Math.floor(
                (Date.now() -
                  user.activeSince) /
                1000
              );
          }

          return {
            id,
            username:
              user.username ||
              "Neznámý",
            seconds
          };
        }
      )
      .sort(
        (a, b) =>
          b.seconds -
          a.seconds
      );

  if (!users.length) {

    return (
      "🏆 **STAFF LEADERBOARD**\n\n" +
      "Zatím nejsou žádné směny."
    );
  }

  const medals =
    [
      "🥇",
      "🥈",
      "🥉"
    ];

  let text =
    "🏆 **STAFF LEADERBOARD**\n\n";

  users
    .slice(0, 10)
    .forEach(
      (user, index) => {

        const medal =
          medals[index] ||
          `${index + 1}.`;

        text +=
          `${medal} **${user.username}** — ${formatTime(user.seconds)}\n`;
      }
    );

  return text;
}

async function updateLeaderboard(
  channel
) {

  const messages =
    await channel.messages.fetch({
      limit: 20
    });

  const botMessage =
    messages.find(
      message =>
        message.author.id ===
        client.user.id
    );

  const embed =
    new EmbedBuilder()
      .setTitle(
        "🏆 STAFF LEADERBOARD"
      )
      .setDescription(
        createLeaderboard()
      )
      .setColor(0xffd700)
      .setFooter({
        text:
          "Automaticky aktualizováno."
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

async function refreshLeaderboard(
  guild
) {

  const channel =
    guild.channels.cache.find(
      c =>
        c.name ===
        "🏆・staff-leaderboard"
    );

  if (!channel) {
    return;
  }

  await updateLeaderboard(
    channel
  );
}

// =====================================================
// LOGY
// =====================================================

async function sendStaffLog(
  guild,
  text
) {

  const channel =
    guild.channels.cache.find(
      c =>
        c.name ===
        "🛡️・staff-log"
    );

  if (channel) {
    await channel.send(text);
  }
}

async function sendModerationLog(
  guild,
  text
) {

  const channel =
    guild.channels.cache.find(
      c =>
        c.name ===
        "⚖️・moderation-log"
    );

  if (channel) {
    await channel.send(text);
  }
}

// =====================================================
// MEMBER LOG
// =====================================================

client.on(
  "guildMemberAdd",
  async member => {

    const channel =
      member.guild.channels.cache.find(
        c =>
          c.name ===
          "🛡️・staff-log"
      );

    if (channel) {

      await channel.send(
        `📥 **NOVÝ ČLEN**\n` +
        `👤 ${member.user.tag}\n` +
        `🆔 ${member.id}`
      );
    }
  }
);

client.on(
  "guildMemberRemove",
  async member => {

    const channel =
      member.guild.channels.cache.find(
        c =>
          c.name ===
          "🛡️・staff-log"
      );

    if (channel) {

      await channel.send(
        `📤 **ČLEN ODEŠEL**\n` +
        `👤 ${member.user.tag}\n` +
        `🆔 ${member.id}`
      );
    }
  }
);

// =====================================================
// AUTO LEADERBOARD
// =====================================================

setInterval(
  async () => {

    for (
      const guild of client.guilds.cache.values()
    ) {

      try {

        await refreshLeaderboard(
          guild
        );

      } catch (error) {

        console.error(
          "❌ Leaderboard:",
          error
        );
      }
    }

  },
  60000
);

// =====================================================
// LOGIN
// =====================================================

client.login(TOKEN);

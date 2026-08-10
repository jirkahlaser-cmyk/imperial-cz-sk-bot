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
    console.error("❌ Chyba při načítání dat:", error);
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
    console.error("❌ Chyba při ukládání dat:", error);
  }
}

loadData();

// =====================================================
// ROLE
// =====================================================

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

// =====================================================
// FRAKCE
// =====================================================

const FACTIONS = {
  police: {
    name: "🚓 POLICIE",
    ranks: [
      "🚓 Velitel policie",
      "👮 Policista"
    ]
  },

  fire: {
    name: "🚒 HASIČI",
    ranks: [
      "🚒 Velitel hasičů",
      "🔥 Hasič"
    ]
  },

  medic: {
    name: "🚑 ZÁCHRANÁŘI",
    ranks: [
      "🚑 Velitel záchranářů",
      "🩺 Záchranář"
    ]
  }
};

// =====================================================
// ROLE FUNCTIONS
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
    role => role.name === name
  );

  if (!role) {
    role = await guild.roles.create({
      name,
      color,
      reason: "Imperial CZ/SK RP setup"
    });
  }

  return role;
}

// =====================================================
// PERMISSIONS
// =====================================================

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

// =====================================================
// CHANNEL FUNCTIONS
// =====================================================

async function getOrCreateCategory(
  guild,
  name,
  permissionOverwrites
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

async function getOrCreateChannel(
  guild,
  name,
  parent,
  permissionOverwrites
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

// =====================================================
// SEND ONCE
// =====================================================

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

// =====================================================
// TEXTY
// =====================================================

const TEXT = {

  welcome: `
👑 **VÍTEJ NA IMPERIAL CZ/SK RP**

Vítej na oficiálním Discord serveru našeho CZ/SK RP projektu pro Emergency Hamburg!

🎭 Naším cílem je vytvořit komunitu, kde si hráči mohou užít kvalitní, realistické a hlavně zábavné RP.

🚓 Policie, 🚒 hasiči, 🚑 záchranáři i civilisté mají své místo.

💬 Discord slouží nejen ke komunikaci, ale také k organizaci eventů, náborů, ticketů a dalších aktivit.

❤️ Jsme rádi, že jsi tady. Užij si server a hlavně kvalitní RP!
`,

  rules: `
📜 **PRAVIDLA DISCORDU**

Ahoj a vítej na Imperial CZ/SK RP! Aby se zde všichni cítili dobře, dodržuj tato pravidla:

1️⃣ Chovej se slušně a respektuj ostatní.
2️⃣ Zákaz šikany, vyhrožování a cíleného obtěžování.
3️⃣ Zákaz spamu, floodu a zbytečného pingování.
4️⃣ Zákaz reklamy bez povolení vedení.
5️⃣ Nevydávej se za člena vedení nebo staffu.
6️⃣ Nezveřejňuj osobní údaje ostatních.
7️⃣ Zákaz úmyslného vyvolávání konfliktů.
8️⃣ Dodržuj Discord Terms of Service.
9️⃣ Respektuj rozhodnutí moderace.
🔟 Pokud máš problém, použij ticket.

⚠️ Porušení pravidel může vést k warnu, timeoutu, kicku nebo banu.
`,

  rpRules: `
🎭 **RP PRAVIDLA – EMERGENCY HAMBURG**

Ahoj, vítej v RP části serveru. RP znamená RolePlay – tedy hraní role a vytváření realistických situací.

🔹 **FailRP**
Nerealistické jednání, které nedává v dané situaci smysl.

🔹 **RDM**
Napadení nebo zabití hráče bez odpovídajícího RP důvodu.

🔹 **VDM**
Používání vozidla jako zbraně bez odpovídajícího RP důvodu.

🔹 **NLR**
Po smrti nesmíš bezdůvodně využívat informace z předchozí situace.

🔹 **Metagaming**
Používání informací získaných mimo RP.

🔹 **Powergaming**
Vynucování akcí nebo nereálné schopnosti vůči ostatním hráčům.

🔹 **FearRP**
Pokud je tvoje postava v ohrožení života, musí podle toho reagovat.

🔹 **Combat Logging**
Úmyslné odpojení během probíhající RP situace.

🔹 **Cop Baiting**
Zbytečné a úmyslné provokování policie.

🔹 **Revenge RP**
Pomsta za situaci, kterou si postava nemá pamatovat.

🎭 Hraj realisticky, respektuj ostatní a snaž se vytvářet zajímavé RP.
`,

  faq: `
❓ **FAQ**

🎫 Potřebuji pomoc?
→ Vytvoř ticket.

🚨 Chci nahlásit hráče?
→ Použij Report ticket.

👮 Chci se přidat do staffu?
→ Použij Nábor ticket.

🏠 Chci pozemek?
→ Použij Pozemek ticket.

🏢 Chci podnik?
→ Použij Podnik ticket.

🔓 Chci požádat o unban?
→ Použij Unban ticket.

🎉 Chci se účastnit eventu?
→ Sleduj kanál eventů.

💬 Máš jiný problém?
→ Vytvoř Podpora ticket.
`,

  staffInfo: `
🛡️ **STAFF INFO**

Při řešení reportu:

1️⃣ Zjisti, co se stalo.
2️⃣ Vyslechni všechny strany.
3️⃣ Vyžádej si důkazy.
4️⃣ Zkontroluj pravidla.
5️⃣ Rozhodni nestranně.
6️⃣ Zapiš závažné případy.
7️⃣ Pokud si nejsi jistý, kontaktuj Senior Admina.

⚠️ Staff nesmí využívat pravomoci pro vlastní výhodu.
`,

  punishments: `
⚖️ **STAFF TRESTY**

🟢 Upozornění
Pro drobné nebo první porušení.

🟡 WARN
Pro opakované nebo závažnější porušení.

🟠 TIMEOUT
Pro spam, toxicitu nebo narušování serveru.

🔴 KICK
Pro závažné narušování serveru.

⛔ DOČASNÝ BAN
Pro závažné nebo opakované porušování.

🚫 PERMANENTNÍ BAN
Pro extrémně závažné případy.

🛡️ ODEBRÁNÍ STAFF ROLE
Při zneužití pravomocí.

👑 PŘEDÁNÍ VEDENÍ
U závažných nebo sporných případů.

⚠️ Trest musí vždy odpovídat situaci.
`,

  staffRules: `
🛡️ **STAFF PRAVIDLA**

1️⃣ Staff musí být nestranný.
2️⃣ Staff nesmí zvýhodňovat kamarády.
3️⃣ Staff nesmí používat pravomoci pro vlastní RP výhodu.
4️⃣ Staff nesmí zneužívat OORP informace.
5️⃣ Staff nesmí řešit report, kde je sám účastníkem.
6️⃣ U závažných trestů požaduj důkazy.
7️⃣ Sporné případy předávej Senior Adminovi.
8️⃣ Závažné případy může převzít vedení.
9️⃣ Interní informace nesmí být zveřejňovány.
🔟 Staff reprezentuje celý server.

❤️ Buď profesionální a respektuj hráče.
`,

  shift: `
⏱️ **STAFF OORP SMĚNY**

\`!startshift\`
Začne staff směnu.

\`!endshift\`
Ukončí směnu a započítá čas.

\`!shift\`
Zobrazí aktuální směnu.

\`!myhours\`
Zobrazí tvůj celkový čas.

\`!leaderboard\`
Zobrazí leaderboard.

🏆 Čas se počítá mezi startem a koncem směny.
`,

  events: `
🎉 **EVENTY**

Na serveru budou probíhat různé RP eventy.

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
🏆 Turnaje
🎁 Soutěže

📢 Každý větší event bude mít svůj čas, místo a pravidla.
`,

  map: `
🗺️ **MAPA EMERGENCY HAMBURG**

Emergency Hamburg nabízí velké množství míst pro RP.

🚓 Policie
🚒 Hasiči
🚑 Záchranáři
🏦 Banka
💎 Klenotnictví
⛽ Čerpací stanice
🚉 Nádraží
🏭 Průmyslové oblasti
🏙️ Centrum města

⚠️ Místa se mohou změnit podle aktualizací hry.
`,

  properties: `
🏠 **POZEMKY**

Chceš vlastní RP pozemek?

Vytvoř ticket a uveď:

👤 Discord jméno
📍 Požadované místo
🏠 Typ pozemku
📝 Účel
📸 Screenshot, pokud je potřeba

👑 Vedení žádost schválí nebo zamítne.

⚠️ Discord evidence sama o sobě nemění vlastnictví v Robloxu.
`,

  businesses: `
🏢 **PODNIKY**

Na serveru můžeš požádat například o:

🍔 Restauraci
🔧 Autoservis
🏪 Obchod
⛽ Čerpací stanici
🏢 Firmu

O podnik se žádá přes ticket.

Vedení může žádost schválit, upravit nebo zamítnout.
`,

  economy: `
💰 **RP EKONOMIKA**

• Peníze musí mít RP původ.
• Podniky musí být schválené.
• Pozemky eviduje vedení.
• Zákaz zneužívání ekonomiky.
• Zákaz OORP výhod.
• Zákaz podvodů mimo povolené RP.
`,

  ticket: `
🎫 **TICKET SYSTÉM**

Vyber si typ ticketu podle toho, co potřebuješ.

🛠️ Podpora
🚨 Report
🏠 Pozemek
🏢 Podnik
👮 Nábor
🔓 Unban
🤝 Partnerství

🛡️ Staff může ticket převzít.
👑 Ticket může být předán vedení.
🔒 Po vyřešení se ticket uzavře.
`
};

// =====================================================
// SETUP COMMAND
// =====================================================

const setupCommand = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Vytvoří celý Imperial CZ/SK RP server.")
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Administrator
  );

// =====================================================
// READY
// =====================================================

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
        "❌ /setup může použít pouze administrátor.",
      ephemeral: true
    });

  }

  await interaction.deferReply({
    ephemeral: true
  });

  try {

    const guild = interaction.guild;

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

    // INFORMACE

    const info =
      await getOrCreateCategory(
        guild,
        "📌 INFORMACE"
      );

    const welcome =
      await getOrCreateChannel(
        guild,
        "👋・vítej",
        info
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

    const map =
      await getOrCreateChannel(
        guild,
        "🗺️・mapa-emergency",
        info
      );

    // HRA

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

    // KOMUNITA

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

    // FRAKCE

    const factions =
      await getOrCreateCategory(
        guild,
        "🏛️ FRAKCE"
      );

    const factionPolice =
      await getOrCreateChannel(
        guild,
        "🚓・policejní-frakce",
        factions
      );

    const factionFire =
      await getOrCreateChannel(
        guild,
        "🚒・hasičská-frakce",
        factions
      );

    const factionMedic =
      await getOrCreateChannel(
        guild,
        "🚑・záchranářská-frakce",
        factions
      );

    // STAFF

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

    const staffApplications =
      await getOrCreateChannel(
        guild,
        "📋・přihlášky",
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

    // VEDENÍ

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

    // LOGY

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

    // TICKETY

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

    // TEXTY

    await sendOnce(welcome, TEXT.welcome);
    await sendOnce(rules, TEXT.rules);
    await sendOnce(rpRules, TEXT.rpRules);
    await sendOnce(faq, TEXT.faq);

    await sendOnce(
      announcements,
      "📢 **OZNÁMENÍ SERVERU**\n\nDůležitá oznámení budou zveřejňována zde."
    );

    await sendOnce(map, TEXT.map);

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
      "🚑 **ZÁCHRANÁŘI**\n\nInformace pro záchranářské RP."
    );

    await sendOnce(
      criminal,
      "🔫 **KRIMINÁLNÍ RP**\n\nDodržuj pravidla a vytvářej realistické situace."
    );

    await sendOnce(
      traffic,
      "🚗 **DOPRAVNÍ PRAVIDLA**\n\nRespektuj provoz a zákaz VDM."
    );

    await sendOnce(
      chat,
      "💬 **VÍTEJ V KOMUNITĚ!**\n\nUžij si Imperial CZ/SK RP."
    );

    await sendOnce(
      events,
      TEXT.events
    );

    // FRAKCE

    await sendOnce(
      factionPolice,
      `
🚓 **POLICEJNÍ FRAKCE**

Hodnosti:

🚓 Velitel policie
👮 Policista

📋 Nábor a povýšení řeší vedení frakce.
`
    );

    await sendOnce(
      factionFire,
      `
🚒 **HASIČSKÁ FRAKCE**

Hodnosti:

🚒 Velitel hasičů
🔥 Hasič

📋 Nábor a povýšení řeší vedení frakce.
`
    );

    await sendOnce(
      factionMedic,
      `
🚑 **ZÁCHRANÁŘSKÁ FRAKCE**

Hodnosti:

🚑 Velitel záchranářů
🩺 Záchranář

📋 Nábor a povýšení řeší vedení frakce.
`
    );

    // STAFF

    await sendOnce(
      staffChat,
      "🛡️ **STAFF CHAT**\n\nInterní komunikace staff týmu."
    );

    await sendOnce(
      staffInfo,
      TEXT.staffInfo
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
      staffApplications,
      "📋 **PŘIHLÁŠKY DO STAFFU**\n\nNábor probíhá přes ticket."
    );

    await sendOnce(
      staffReports,
      "🚨 **STAFF REPORTY**\n\n👤 Hráč:\n🕐 Datum:\n📝 Popis:\n📸 Důkazy:\n⚖️ Výsledek:"
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
      managementMeetings,
      "📋 **PORADY VEDENÍ**\n\nInterní plánování serveru."
    );

    await sendOnce(
      staffLogs,
      "🛡️ **STAFF LOG**"
    );

    await sendOnce(
      ticketLogs,
      "🎫 **TICKET LOG**"
    );

    // TICKET PANEL

    const messages =
      await ticketPanel.messages.fetch({
        limit: 20
      });

    const panelExists =
      messages.some(
        message =>
          message.author.id === client.user.id
      );

    if (!panelExists) {

      const embed =
        new EmbedBuilder()
          .setTitle("🎫 TICKET SYSTÉM")
          .setDescription(TEXT.ticket)
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
      "✅ **IMPERIAL CZ/SK SERVER NASTAVEN!**\n\n" +
      "👑 Role → HOTOVO\n" +
      "🎮 RP → HOTOVO\n" +
      "🏛️ Frakce → HOTOVO\n" +
      "🛡️ Staff → HOTOVO\n" +
      "🎫 Tickety → HOTOVO\n" +
      "⏱️ Směny → HOTOVO\n" +
      "🏆 Leaderboard → HOTOVO\n" +
      "🛡️ Anti-Raid → AKTIVNÍ\n\n" +
      "🔥 Imperial CZ/SK RP je připraven!"
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

// =====================================================
// TICKET TYPES
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
// TICKET CREATE
// =====================================================

client.on("interactionCreate", async interaction => {

  if (!interaction.isButton()) {
    return;
  }

  const type =
    TICKET_TYPES[
      interaction.customId
    ];

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
        "👑 Ticket může být předán vedení.\n" +
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
          .setLabel("👑 Vedení")
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

// =====================================================
// TICKET ACTIONS
// =====================================================

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

    for (
      const roleName of MANAGEMENT_ROLES
    ) {

      const role =
        interaction.guild.roles.cache.find(
          r => r.name === roleName
        );

      if (role) {

        await interaction.channel
          .permissionOverwrites.edit(
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
      "👑 **Ticket byl předán vedení.**"
    );

    return;
  }

  if (
    interaction.customId === "ticket_close"
  ) {

    await interaction.reply(
      "🔒 Ticket se zavře za 5 sekund."
    );

    setTimeout(
      async () => {

        try {

          await interaction.channel.delete(
            "Ticket uzavřen"
          );

        } catch {}

      },
      5000
    );

  }

});

// =====================================================
// STAFF SHIFT COMMANDS
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
      username:
        message.author.username,
      totalSeconds: 0,
      activeSince: null
    };

  }

  const user =
    staffData.users[id];

  user.username =
    message.author.username;

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

  if (command === "!endshift") {

    if (!user.activeSince) {

      return message.reply(
        "🔴 Nemáš aktivní směnu."
      );

    }

    const seconds =
      Math.floor(
        (
          Date.now() -
          user.activeSince
        ) / 1000
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

  if (command === "!shift") {

    if (!user.activeSince) {

      return message.reply(
        "🔴 Nemáš aktivní směnu."
      );

    }

    const seconds =
      Math.floor(
        (
          Date.now() -
          user.activeSince
        ) / 1000
      );

    return message.reply(
      `🟢 **Aktivní směna:** ${formatTime(seconds)}`
    );
  }

  if (command === "!myhours") {

    let seconds =
      user.totalSeconds;

    if (user.activeSince) {

      seconds +=
        Math.floor(
          (
            Date.now() -
            user.activeSince
          ) / 1000
        );

    }

    return message.reply(
      `🏆 **Tvůj OORP čas:** ${formatTime(seconds)}`
    );
  }

  if (command === "!leaderboard") {

    return message.reply(
      createLeaderboard()
    );

  }

});

// =====================================================
// TIME
// =====================================================

function formatTime(seconds) {

  seconds =
    Math.max(
      0,
      Math.floor(seconds)
    );

  const hours =
    Math.floor(
      seconds / 3600
    );

  const minutes =
    Math.floor(
      (seconds % 3600) / 60
    );

  const secs =
    seconds % 60;

  return `${hours} h ${minutes} min ${secs} s`;
}

// =====================================================
// LEADERBOARD
// =====================================================

function createLeaderboard() {

  const users =
    Object.entries(
      staffData.users
    )

      .map(
        ([id, data]) => {

          let seconds =
            data.totalSeconds || 0;

          if (data.activeSince) {

            seconds +=
              Math.floor(
                (
                  Date.now() -
                  data.activeSince
                ) / 1000
              );

          }

          return {
            id,
            username:
              data.username ||
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

// =====================================================
// LEADERBOARD CHANNEL
// =====================================================

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

// =====================================================
// STAFF LOG
// =====================================================

async function logStaff(
  guild,
  text
) {

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

// =====================================================
// MENTIONS
// =====================================================

function getStaffMentions(guild) {

  return STAFF_ROLES

    .map(
      name =>
        guild.roles.cache.find(
          r => r.name === name
        )
    )

    .filter(Boolean)

    .map(
      role =>
        `<@&${role.id}>`
    )

    .join(" ");
}

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

      try {

        await channel.send(
          `📥 **NOVÝ ČLEN**\n👤 ${member.user.tag}\n🆔 ${member.id}`
        );

      } catch {}

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

      try {

        await channel.send(
          `📤 **ČLEN ODEŠEL**\n👤 ${member.user.tag}\n🆔 ${member.id}`
        );

      } catch {}

    }

  }
);

// =====================================================
// 🛡️ ANTI-RAID SYSTEM
// =====================================================

const antiRaid = new Map();

const RAID_CONFIG = {

  // Kolik lidí musí přijít během tohoto času
  joinWindow: 30,

  // Počet nových členů pro spuštění ochrany
  joinThreshold: 8,

  // Kolik zpráv od mladých účtů
  messageWindow: 10,

  messageThreshold: 5,

  // Účet mladší než 24 hodin
  youngAccountHours: 24,

  // Jak dlouho musí být klid,
  // než se server automaticky odemkne
  unlockAfterSeconds: 60

};

// =====================================================
// RAID DATA
// =====================================================

function getRaidData(guild) {

  if (!antiRaid.has(guild.id)) {

    antiRaid.set(
      guild.id,
      {
        joins: [],
        messages: [],
        locked: false,
        lastRaidActivity: 0,
        savedPermissions: new Map()
      }
    );

  }

  return antiRaid.get(guild.id);
}

// =====================================================
// 🔒 RAID LOCKDOWN
// =====================================================

async function lockdownServer(
  guild,
  reason
) {

  const data =
    getRaidData(guild);

  if (data.locked) {
    return;
  }

  data.locked = true;

  data.lastRaidActivity =
    Date.now();

  console.log(
    `🚨 RAID DETECTED: ${guild.name}`
  );

  /*
   * Uložíme původní oprávnění,
   * aby se po raidu vrátilo
   * všechno přesně tak, jak bylo.
   */

  data.savedPermissions.clear();

  for (
    const channel of guild.channels.cache.values()
  ) {

    if (
      channel.type !==
      ChannelType.GuildText
    ) {
      continue;
    }

    try {

      const everyoneOverwrite =
        channel.permissionOverwrites.cache.get(
          guild.roles.everyone.id
        );

      data.savedPermissions.set(
        channel.id,
        everyoneOverwrite
          ? {
              allow:
                everyoneOverwrite.allow.bitfield,
              deny:
                everyoneOverwrite.deny.bitfield
            }
          : null
      );

      /*
       * ZAMKNE ÚPLNĚ VŠECHNY KANÁLY.
       *
       * Včetně:
       * STAFF
       * VEDENÍ
       * LOGŮ
       * TICKETŮ
       * VEŘEJNÝCH KANÁLŮ
       */

      await channel.permissionOverwrites.edit(
        guild.roles.everyone,
        {
          ViewChannel: false,
          SendMessages: false,
          AddReactions: false,
          CreatePublicThreads: false,
          CreatePrivateThreads: false
        }
      );

    } catch (error) {

      console.error(
        `❌ Anti-Raid: ${channel.name}`,
        error.message
      );

    }

  }

  /*
   * Bot vytvoří nouzovou zprávu
   * tam, kde má ještě přístup.
   */

  const logChannel =
    guild.channels.cache.find(
      c =>
        c.name ===
        "🛡️・staff-log"
    );

  if (logChannel) {

    try {

      /*
       * Protože je staff-log také zamčený,
       * zpráva se odešle před samotným lockdownem
       * už v další verzi bychom mohli vytvořit
       * speciální nouzový kanál.
       */

    } catch {}

  }

  console.log(
    `🔒 CELÝ SERVER ZAMČEN: ${guild.name}`
  );

}

// =====================================================
// 🔓 RAID UNLOCK
// =====================================================

async function unlockServer(
  guild
) {

  const data =
    getRaidData(guild);

  if (!data.locked) {
    return;
  }

  console.log(
    `🔓 RAID ENDED: ${guild.name}`
  );

  for (
    const channel of guild.channels.cache.values()
  ) {

    if (
      channel.type !==
      ChannelType.GuildText
    ) {
      continue;
    }

    try {

      const saved =
        data.savedPermissions.get(
          channel.id
        );

      if (!saved) {

        await channel.permissionOverwrites.delete(
          guild.roles.everyone
        );

      } else {

        await channel.permissionOverwrites.edit(
          guild.roles.everyone,
          {
            allow: saved.allow,
            deny: saved.deny
          }
        );

      }

    } catch (error) {

      console.error(
        `❌ Anti-Raid unlock: ${channel.name}`,
        error.message
      );

    }

  }

  data.locked = false;

  data.lastRaidActivity = 0;

  data.joins = [];

  data.messages = [];

  data.savedPermissions.clear();

  console.log(
    `🔓 SERVER ODEMČEN: ${guild.name}`
  );

}

// =====================================================
// 👤 NOVÝ ČLEN
// =====================================================

client.on(
  "guildMemberAdd",
  async member => {

    const guild =
      member.guild;

    const data =
      getRaidData(guild);

    const now =
      Date.now();

    data.joins =
      data.joins.filter(
        time =>
          now - time <
          RAID_CONFIG.joinWindow * 1000
      );

    data.joins.push(now);

    /*
     * Pokud už raid běží,
     * každý další nový účet
     * prodlužuje sledování raidu.
     */

    if (data.locked) {

      data.lastRaidActivity =
        Date.now();

      return;

    }

    const accountAge =
      now -
      member.user.createdTimestamp;

    const accountAgeHours =
      accountAge / 3600000;

    const youngAccount =
      accountAgeHours <
      RAID_CONFIG.youngAccountHours;

    /*
     * RAID DETECTION
     */

    if (
      data.joins.length >=
      RAID_CONFIG.joinThreshold
    ) {

      let reason =
        `${data.joins.length} nových členů během ${RAID_CONFIG.joinWindow} sekund.`;

      if (youngAccount) {

        reason +=
          " Byl zaznamenán také velmi mladý účet.";

      }

      await lockdownServer(
        guild,
        reason
      );

    }

  }
);

// =====================================================
// 💬 SPAM NOVÝCH ÚČTŮ
// =====================================================

client.on(
  "messageCreate",
  async message => {

    if (
      message.author.bot ||
      !message.guild
    ) {
      return;
    }

    const accountAge =
      Date.now() -
      message.author.createdTimestamp;

    const accountAgeHours =
      accountAge / 3600000;

    /*
     * Sledujeme hlavně velmi mladé účty.
     */

    if (
      accountAgeHours >
      RAID_CONFIG.youngAccountHours
    ) {
      return;
    }

    const data =
      getRaidData(
        message.guild
      );

    const now =
      Date.now();

    data.messages =
      data.messages.filter(
        time =>
          now - time <
          RAID_CONFIG.messageWindow * 1000
      );

    data.messages.push(now);

    /*
     * Pokud už raid probíhá,
     * aktivita ho udržuje aktivní.
     */

    if (data.locked) {

      data.lastRaidActivity =
        Date.now();

      return;

    }

    /*
     * RAID DETECTION
     */

    if (
      data.messages.length >=
      RAID_CONFIG.messageThreshold
    ) {

      await lockdownServer(
        message.guild,
        "Velké množství zpráv od velmi mladých účtů."
      );

    }

  }
);

// =====================================================
// 🔎 KONTROLA KONCE RAIDU
// =====================================================

setInterval(
  async () => {

    for (
      const guild of client.guilds.cache.values()
    ) {

      const data =
        getRaidData(guild);

      if (!data.locked) {
        continue;
      }

      const now =
        Date.now();

      /*
       * Odstranění starých joinů.
       */

      data.joins =
        data.joins.filter(
          time =>
            now - time <
            RAID_CONFIG.joinWindow * 1000
        );

      /*
       * Odstranění starých zpráv.
       */

      data.messages =
        data.messages.filter(
          time =>
            now - time <
            RAID_CONFIG.messageWindow * 1000
        );

      /*
       * Pokud není 60 sekund
       * žádná podezřelá aktivita,
       * raid považujeme za ukončený.
       */

      const timeSinceActivity =
        now -
        data.lastRaidActivity;

      if (
        data.joins.length === 0 &&
        data.messages.length === 0 &&
        timeSinceActivity >=
          RAID_CONFIG.unlockAfterSeconds * 1000
      ) {

        try {

          await unlockServer(
            guild
          );

        } catch (error) {

          console.error(
            "❌ Anti-Raid unlock:",
            error
          );

        }

      }

    }

  },
  10000
);

// =====================================================
// LOGIN
// =====================================================

client.login(TOKEN);

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
// CONFIG
// =====================================================

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error("❌ DISCORD_TOKEN není nastavený v Railway.");
  process.exit(1);
}

const DATA_FILE = path.join(__dirname, "imperial-data.json");

// =====================================================
// CLIENT
// =====================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =====================================================
// DATA
// =====================================================

let data = {
  staff: {},
  raid: {},
  settings: {}
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }
  } catch (error) {
    console.error("❌ Chyba při načítání dat:", error);
  }
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

loadData();

// =====================================================
// COLORS
// =====================================================

const COLORS = {
  primary: 0x5865f2,
  success: 0x57f287,
  danger: 0xed4245,
  warning: 0xfee75c,
  purple: 0x9b59b6,
  gold: 0xffd700,
  dark: 0x2b2d31,
  blue: 0x3498db
};

// =====================================================
// ROLES
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
// CHANNEL STRUCTURE
// =====================================================

const CHANNELS = {
  info: {
    category: "📌 INFORMACE",
    channels: [
      "👋・vítej",
      "📜・pravidla",
      "🎭・rp-pravidla",
      "📖・jak-začít",
      "❓・faq",
      "📢・oznámení",
      "🗺️・mapa",
      "📌・důležité"
    ]
  },

  community: {
    category: "💬 KOMUNITA",
    channels: [
      "💬・chat",
      "😂・memy",
      "📸・screenshoty",
      "🎵・hudba",
      "🎉・eventy",
      "💡・návrhy",
      "⭐・pochvaly"
    ]
  },

  game: {
    category: "🎮 IMPERIAL RP",
    channels: [
      "🚓・policie",
      "🚒・hasiči",
      "🚑・záchranáři",
      "🔫・kriminální-rp",
      "🚗・doprava",
      "🏠・pozemky",
      "🏢・podniky",
      "💰・ekonomika",
      "📋・frakce"
    ]
  },

  tickets: {
    category: "🎫 TICKETY",
    channels: [
      "🎫・vytvořit-ticket"
    ]
  },

  staff: {
    category: "🛡️ STAFF",
    channels: [
      "🛡️・staff-chat",
      "📢・staff-oznámení",
      "📋・staff-info",
      "📥・přihlášky",
      "🚨・staff-reporty",
      "🎉・staff-eventy",
      "📅・staff-porady",
      "⏱️・staff-směny",
      "🏆・leaderboard"
    ]
  },

  management: {
    category: "👑 VEDENÍ",
    channels: [
      "👑・vedení",
      "📋・porady-vedení",
      "💼・projekty"
    ]
  },

  logs: {
    category: "📊 LOGY",
    channels: [
      "📥・join-log",
      "📤・leave-log",
      "🛡️・staff-log",
      "🎫・ticket-log",
      "🚨・raid-log",
      "🔨・mod-log"
    ]
  }
};

// =====================================================
// HELPERS
// =====================================================

function getRole(guild, name) {
  return guild.roles.cache.find(
    role => role.name === name
  );
}

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

function isAdmin(member) {
  return member.permissions.has(
    PermissionFlagsBits.Administrator
  );
}

function formatTime(seconds) {
  seconds = Math.max(0, Math.floor(seconds));

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return `${h} h ${m} min ${s} s`;
}

// =====================================================
// EMBEDS
// =====================================================

function createEmbed(title, description, color = COLORS.primary) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp()
    .setFooter({
      text: "Imperial CZ/SK • Emergency Hamburg RP"
    });
}

// =====================================================
// ROLE CREATION
// =====================================================

async function setupRoles(guild) {
  for (const [name, color] of ROLE_CONFIG) {
    if (!getRole(guild, name)) {
      try {
        await guild.roles.create({
          name,
          color,
          reason: "Imperial CZ/SK RP Setup"
        });

        console.log(`✅ Role vytvořena: ${name}`);
      } catch (error) {
        console.error(
          `❌ Nelze vytvořit roli ${name}:`,
          error.message
        );
      }
    }
  }
}

// =====================================================
// PERMISSIONS
// =====================================================

function staffOverwrites(guild) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel]
    }
  ];

  for (const name of STAFF_ROLES) {
    const role = getRole(guild, name);

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

function managementOverwrites(guild) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionsBitField.Flags.ViewChannel]
    }
  ];

  for (const name of MANAGEMENT_ROLES) {
    const role = getRole(guild, name);

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

// =====================================================
// CHANNEL CREATION
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
// LOGGING
// =====================================================

async function sendLog(guild, channelName, message) {
  const channel = guild.channels.cache.find(
    c => c.name === channelName
  );

  if (!channel) return;

  try {
    await channel.send(message);
  } catch {}
}

// =====================================================
// SEND PANEL ONCE
// =====================================================

async function sendPanel(channel, embed, components = []) {
  const messages = await channel.messages.fetch({
    limit: 20
  });

  const existing = messages.find(
    message =>
      message.author.id === client.user.id
  );

  if (!existing) {
    await channel.send({
      embeds: [embed],
      components
    });
  }
}

// =====================================================
// SETUP SERVER
// =====================================================

async function setupServer(guild) {
  console.log(`⚙️ Spouštím setup pro ${guild.name}`);

  await setupRoles(guild);

  const categories = {};

  for (const [key, config] of Object.entries(CHANNELS)) {
    let permissions;

    if (key === "staff" || key === "logs") {
      permissions = staffOverwrites(guild);
    }

    if (key === "management") {
      permissions = managementOverwrites(guild);
    }

    categories[key] = await getOrCreateCategory(
      guild,
      config.category,
      permissions
    );

    for (const channelName of config.channels) {
      await getOrCreateChannel(
        guild,
        channelName,
        categories[key],
        permissions
      );
    }
  }

  // ---------------------------------------------------
  // WELCOME
  // ---------------------------------------------------

  const welcome = guild.channels.cache.find(
    c => c.name === "👋・vítej"
  );

  if (welcome) {
    await sendPanel(
      welcome,
      createEmbed(
        "👋 Vítej v Imperial CZ/SK RP!",
        [
          "Vítej na našem Discord serveru!",
          "",
          "🎮 **Imperial CZ/SK** je komunita zaměřená na Emergency Hamburg RP.",
          "",
          "📖 Nejdříve si přečti pravidla.",
          "🎭 Potom si projdi RP pravidla.",
          "🎫 Pokud potřebuješ pomoc, vytvoř ticket.",
          "🎉 Sleduj eventy a oznámení.",
          "",
          "🔥 Užij si kvalitní RP a hlavně se bav!"
        ].join("\n"),
        COLORS.primary
      )
    );
  }

  // ---------------------------------------------------
  // RULES
  // ---------------------------------------------------

  const rules = guild.channels.cache.find(
    c => c.name === "📜・pravidla"
  );

  if (rules) {
    await sendPanel(
      rules,
      createEmbed(
        "📜 PRAVIDLA DISCORDU",
        [
          "1️⃣ Chovej se slušně k ostatním.",
          "2️⃣ Zákaz šikany a cíleného obtěžování.",
          "3️⃣ Zákaz spamu a floodu.",
          "4️⃣ Zákaz nevyžádané reklamy.",
          "5️⃣ Nevydávej se za člena staffu.",
          "6️⃣ Nesdílej osobní údaje.",
          "7️⃣ Respektuj rozhodnutí moderace.",
          "8️⃣ Nepoužívej Discord k podvodům.",
          "9️⃣ Dodržuj pravidla Discordu.",
          "🔟 Závažné problémy řeš přes ticket.",
          "",
          "⚠️ Porušení pravidel může vést k warnu, timeoutu, kicku nebo banu."
        ].join("\n"),
        COLORS.warning
      )
    );
  }

  // ---------------------------------------------------
  // RP RULES
  // ---------------------------------------------------

  const rpRules = guild.channels.cache.find(
    c => c.name === "🎭・rp-pravidla"
  );

  if (rpRules) {
    await sendPanel(
      rpRules,
      createEmbed(
        "🎭 RP PRAVIDLA",
        [
          "**FailRP**",
          "Jednání, které je nereálné nebo nedává smysl.",
          "",
          "**RDM**",
          "Napadení nebo zabití bez odpovídajícího RP důvodu.",
          "",
          "**VDM**",
          "Použití vozidla jako zbraně bez RP důvodu.",
          "",
          "**NLR**",
          "Po smrti se nesmíš bezdůvodně vracet do stejné situace.",
          "",
          "**Metagaming**",
          "Používání informací získaných mimo RP.",
          "",
          "**Powergaming**",
          "Vynucování nereálných akcí ostatním hráčům.",
          "",
          "**FearRP**",
          "Postava musí reagovat na ohrožení života.",
          "",
          "**Combat Logging**",
          "Úmyslné odpojení během RP situace.",
          "",
          "**NVL**",
          "Ignorování vlastního života.",
          "",
          "🎭 Hraj realisticky, férově a respektuj ostatní."
        ].join("\n"),
        COLORS.purple
      )
    );
  }

  // ---------------------------------------------------
  // HOW TO START
  // ---------------------------------------------------

  const how = guild.channels.cache.find(
    c => c.name === "📖・jak-začít"
  );

  if (how) {
    await sendPanel(
      how,
      createEmbed(
        "📖 JAK ZAČÍT HRÁT",
        [
          "🎮 **1. Připoj se do Emergency Hamburg**",
          "Vyber si povolání nebo civilní RP.",
          "",
          "👤 **2. Vytvoř si RP postavu**",
          "Mysli na jméno, práci, věk a příběh postavy.",
          "",
          "🎭 **3. Začni RP situaci**",
          "Komunikuj s ostatními hráči a drž se RP pravidel.",
          "",
          "🚓 **4. Respektuj frakce**",
          "Policie, hasiči a záchranáři mají vlastní pravomoci.",
          "",
          "🎫 **5. Potřebuješ pomoc?**",
          "Vytvoř ticket."
        ].join("\n"),
        COLORS.success
      )
    );
  }

  // ---------------------------------------------------
  // FRACTIONS
  // ---------------------------------------------------

  const factions = guild.channels.cache.find(
    c => c.name === "📋・frakce"
  );

  if (factions) {
    await sendPanel(
      factions,
      createEmbed(
        "🏛️ FRAKCE A HODNOSTI",
        [
          "🚓 **POLICIE**",
          "👮 Policista",
          "⭐ Velitel policie",
          "",
          "🚒 **HASIČI**",
          "🔥 Hasič",
          "⭐ Velitel hasičů",
          "",
          "🚑 **ZÁCHRANÁŘI**",
          "🩺 Záchranář",
          "⭐ Velitel záchranářů",
          "",
          "🎉 **EVENT TÝM**",
          "Organizace eventů a komunitních akcí.",
          "",
          "📸 **MEDIA TÝM**",
          "Screenshoty, videa a propagace projektu."
        ].join("\n"),
        COLORS.blue
      )
    );
  }

  // ---------------------------------------------------
  // TICKET PANEL
  // ---------------------------------------------------

  const ticketChannel = guild.channels.cache.find(
    c => c.name === "🎫・vytvořit-ticket"
  );

  if (ticketChannel) {
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_support")
        .setLabel("Podpora")
        .setEmoji("🛠️")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("ticket_report")
        .setLabel("Report")
        .setEmoji("🚨")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("ticket_recruitment")
        .setLabel("Nábor")
        .setEmoji("👮")
        .setStyle(ButtonStyle.Success)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_property")
        .setLabel("Pozemek")
        .setEmoji("🏠")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("ticket_business")
        .setLabel("Podnik")
        .setEmoji("🏢")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("ticket_unban")
        .setLabel("Unban")
        .setEmoji("🔓")
        .setStyle(ButtonStyle.Secondary)
    );

    await sendPanel(
      ticketChannel,
      createEmbed(
        "🎫 CENTRUM TICKETŮ",
        [
          "Potřebuješ pomoc?",
          "",
          "🛠️ **Podpora** — technické nebo obecné problémy.",
          "🚨 **Report** — nahlášení hráče.",
          "👮 **Nábor** — přihláška do staffu.",
          "🏠 **Pozemek** — žádost o pozemek.",
          "🏢 **Podnik** — žádost o podnik.",
          "🔓 **Unban** — žádost o unban.",
          "",
          "👇 Vyber typ ticketu."
        ].join("\n"),
        COLORS.primary
      ),
      [row1, row2]
    );
  }

  // ---------------------------------------------------
  // ANNOUNCEMENTS
  // ---------------------------------------------------

  const announcements = guild.channels.cache.find(
    c => c.name === "📢・oznámení"
  );

  if (announcements) {
    await sendPanel(
      announcements,
      createEmbed(
        "📢 OZNÁMENÍ",
        "Zde budou zveřejňována důležitá oznámení projektu.",
        COLORS.primary
      )
    );
  }

  // ---------------------------------------------------
  // APPLICATIONS
  // ---------------------------------------------------

  const applications = guild.channels.cache.find(
    c => c.name === "📥・přihlášky"
  );

  if (applications) {
    await sendPanel(
      applications,
      createEmbed(
        "📥 STAFF PŘIHLÁŠKY",
        [
          "👮 **Chceš se stát členem Imperial Staff Teamu?**",
          "",
          "Před podáním přihlášky si připrav:",
          "• svůj Discord účet",
          "• zkušenosti s moderací",
          "• zkušenosti s RP",
          "• důvod, proč chceš do staffu",
          "• časovou aktivitu",
          "",
          "🎫 Přihlášku odešli prostřednictvím ticketu.",
          "",
          "⚠️ Lhaní v přihlášce může vést k zamítnutí."
        ].join("\n"),
        COLORS.purple
      )
    );
  }

  // ---------------------------------------------------
  // STAFF INFO
  // ---------------------------------------------------

  const staffInfo = guild.channels.cache.find(
    c => c.name === "📋・staff-info"
  );

  if (staffInfo) {
    await sendPanel(
      staffInfo,
      createEmbed(
        "🛡️ STAFF MANUÁL",
        [
          "1️⃣ Vždy buď nestranný.",
          "2️⃣ Nezvýhodňuj kamarády.",
          "3️⃣ Nezneužívej staff pravomoci.",
          "4️⃣ Neřeš RP podle osobních vztahů.",
          "5️⃣ Vyslechni všechny strany.",
          "6️⃣ Vyžádej si důkazy.",
          "7️⃣ U závažných případů kontaktuj Senior Admina.",
          "8️⃣ Při pochybnostech kontaktuj vedení.",
          "",
          "🛡️ Staff reprezentuje celý projekt."
        ].join("\n"),
        COLORS.danger
      )
    );
  }

  // ---------------------------------------------------
  // LOG
  // ---------------------------------------------------

  await sendLog(
    guild,
    "🛡️・staff-log",
    "⚙️ **SETUP DOKONČEN**\nServer byl úspěšně aktualizován."
  );

  console.log("✅ Setup dokončen.");
}

// =====================================================
// RAID SYSTEM
// =====================================================

const raidJoins = new Map();
const raidSnapshots = new Map();

const RAID_THRESHOLD = 8;
const RAID_WINDOW = 10000;

function isRaid(guild) {
  const timestamps = raidJoins.get(guild.id) || [];

  const now = Date.now();

  const recent = timestamps.filter(
    timestamp =>
      now - timestamp <= RAID_WINDOW
  );

  raidJoins.set(guild.id, recent);

  return recent.length >= RAID_THRESHOLD;
}

// =====================================================
// RAID LOCK
// =====================================================

async function activateRaid(guild, reason = "Automatická detekce") {
  if (data.raid[guild.id]?.active) {
    return;
  }

  console.log(`🚨 RAID DETEKOVÁN: ${guild.name}`);

  data.raid[guild.id] = {
    active: true,
    startedAt: Date.now(),
    reason
  };

  saveData();

  raidSnapshots.set(
    guild.id,
    new Map()
  );

  for (const channel of guild.channels.cache.values()) {
    if (
      !channel.isTextBased() ||
      channel.isThread()
    ) {
      continue;
    }

    try {
      const snapshots = raidSnapshots.get(
        guild.id
      );

      snapshots.set(
        channel.id,
        channel.permissionOverwrites.cache.map(
          overwrite => overwrite.toJSON()
        )
      );

      const everyone =
        guild.roles.everyone.id;

      await channel.permissionOverwrites.edit(
        everyone,
        {
          ViewChannel: false,
          SendMessages: false,
          Connect: false,
          Speak: false
        },
        {
          reason: "🚨 Imperial Anti-Raid"
        }
      );

      // Zamkne také staff role
      for (const roleName of STAFF_ROLES) {
        const role = getRole(guild, roleName);

        if (role) {
          await channel.permissionOverwrites.edit(
            role.id,
            {
              ViewChannel: false,
              SendMessages: false,
              Connect: false,
              Speak: false
            },
            {
              reason: "🚨 Imperial Anti-Raid"
            }
          );
        }
      }
    } catch (error) {
      console.error(
        `❌ Raid lock ${channel.name}:`,
        error.message
      );
    }
  }

  await sendLog(
    guild,
    "🚨・raid-log",
    {
      embeds: [
        createEmbed(
          "🚨 RAID OCHRANA AKTIVOVÁNA",
          [
            "🔒 **Server byl dočasně uzamčen.**",
            "",
            `📌 Důvod: ${reason}`,
            `🕐 ${new Date().toLocaleString("cs-CZ")}`,
            "",
            "👥 Zamčeny byly veřejné i staff kanály.",
            "🛡️ Anti-Raid systém chrání server.",
            "",
            "👑 Vedení může raid ukončit pomocí `/raid off`."
          ].join("\n"),
          COLORS.danger
        )
      ]
    }
  );
}

// =====================================================
// RAID UNLOCK
// =====================================================

async function deactivateRaid(guild) {
  if (!data.raid[guild.id]?.active) {
    return false;
  }

  const snapshots =
    raidSnapshots.get(guild.id);

  if (snapshots) {
    for (const [channelId, overwrites] of snapshots) {
      const channel =
        guild.channels.cache.get(channelId);

      if (!channel) continue;

      try {
        await channel.permissionOverwrites.set(
          overwrites
        );
      } catch (error) {
        console.error(
          `❌ Obnovení ${channel.name}:`,
          error.message
        );
      }
    }
  }

  data.raid[guild.id] = {
    active: false,
    endedAt: Date.now()
  };

  saveData();

  raidSnapshots.delete(guild.id);

  await sendLog(
    guild,
    "🚨・raid-log",
    {
      embeds: [
        createEmbed(
          "🔓 RAID OCHRANA UKONČENA",
          [
            "Server byl znovu odemčen.",
            "",
            "🔓 Kanály byly obnoveny.",
            "🛡️ Anti-Raid je připraven znovu reagovat."
          ].join("\n"),
          COLORS.success
        )
      ]
    }
  );

  return true;
}

// =====================================================
// RAID JOIN DETECTION
// =====================================================

client.on("guildMemberAdd", async member => {
  const guild = member.guild;

  const timestamps =
    raidJoins.get(guild.id) || [];

  timestamps.push(Date.now());

  raidJoins.set(
    guild.id,
    timestamps
  );

  await sendLog(
    guild,
    "📥・join-log",
    `📥 **NOVÝ ČLEN**\n👤 ${member.user.tag}\n🆔 ${member.id}`
  );

  if (isRaid(guild)) {
    await activateRaid(
      guild,
      `Detekováno ${RAID_THRESHOLD}+ připojení během ${RAID_WINDOW / 1000} sekund.`
    );
  }
});

// =====================================================
// MEMBER LEAVE
// =====================================================

client.on("guildMemberRemove", async member => {
  await sendLog(
    member.guild,
    "📤・leave-log",
    `📤 **ČLEN ODEŠEL**\n👤 ${member.user.tag}\n🆔 ${member.id}`
  );
});

// =====================================================
// TICKETS
// =====================================================

const TICKET_TYPES = {
  ticket_support: ["podpora", "🛠️ Podpora"],
  ticket_report: ["report", "🚨 Report"],
  ticket_recruitment: ["nabor", "👮 Nábor"],
  ticket_property: ["pozemek", "🏠 Pozemek"],
  ticket_business: ["podnik", "🏢 Podnik"],
  ticket_unban: ["unban", "🔓 Unban"]
};

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const type =
    TICKET_TYPES[interaction.customId];

  if (!type) return;

  const guild = interaction.guild;

  const category =
    guild.channels.cache.find(
      channel =>
        channel.type === ChannelType.GuildCategory &&
        channel.name === "🎫 TICKETY"
    );

  if (!category) {
    return interaction.reply({
      content: "❌ Ticket kategorie neexistuje. Použij `/setup`.",
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
      content: `❌ Už máš otevřený ticket: ${existing}`,
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
    const role = getRole(guild, roleName);

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

  const closeButton =
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Zavřít ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    );

  await channel.send({
    content: `${interaction.user}`,
    embeds: [
      createEmbed(
        type[1],
        [
          `👤 **Uživatel:** ${interaction.user}`,
          "",
          "📝 Popiš svůj problém co nejpodrobněji.",
          "📸 Pokud máš důkazy, přilož je.",
          "",
          "🛡️ Staff se ti bude věnovat.",
          "",
          "⚠️ Spamování ticketů může být potrestáno."
        ].join("\n"),
        COLORS.primary
      )
    ],
    components: [closeButton]
  });

  await sendLog(
    guild,
    "🎫・ticket-log",
    `🎫 Ticket vytvořen: ${channel} • ${interaction.user.tag}`
  );

  await interaction.reply({
    content: `✅ Ticket vytvořen: ${channel}`,
    ephemeral: true
  });
});

// =====================================================
// CLOSE TICKET
// =====================================================

client.on("interactionCreate", async interaction => {
  if (
    !interaction.isButton() ||
    interaction.customId !== "ticket_close"
  ) {
    return;
  }

  if (
    !isStaff(interaction.member) &&
    !isManagement(interaction.member)
  ) {
    return interaction.reply({
      content: "❌ Ticket může zavřít pouze staff.",
      ephemeral: true
    });
  }

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
});

// =====================================================
// STAFF SHIFTS
// =====================================================

client.on("messageCreate", async message => {
  if (
    message.author.bot ||
    !message.guild
  ) {
    return;
  }

  const command =
    message.content.trim().toLowerCase();

  const allowed = [
    "!startshift",
    "!endshift",
    "!shift",
    "!myhours",
    "!leaderboard"
  ];

  if (!allowed.includes(command)) return;

  if (!isStaff(message.member)) {
    return message.reply(
      "❌ Tento příkaz je pouze pro staff."
    );
  }

  const id = message.author.id;

  if (!data.staff[id]) {
    data.staff[id] = {
      username: message.author.username,
      totalSeconds: 0,
      activeSince: null
    };
  }

  const user = data.staff[id];

  user.username =
    message.author.username;

  if (command === "!startshift") {
    if (user.activeSince) {
      return message.reply(
        "🟡 Už máš aktivní směnu."
      );
    }

    user.activeSince = Date.now();

    saveData();

    return message.reply(
      createEmbed(
        "🟢 SMĚNA ZAHÁJENA",
        [
          `👤 ${message.author}`,
          "",
          "⏱️ Čas se právě začal počítat.",
          "Použij `!endshift` pro ukončení."
        ].join("\n"),
        COLORS.success
      )
    );
  }

  if (command === "!endshift") {
    if (!user.activeSince) {
      return message.reply(
        "🔴 Nemáš aktivní směnu."
      );
    }

    const seconds =
      Math.floor(
        (Date.now() - user.activeSince) / 1000
      );

    user.totalSeconds += seconds;
    user.activeSince = null;

    saveData();

    await message.reply(
      createEmbed(
        "🔴 SMĚNA UKONČENA",
        [
          `⏱️ Tato směna: **${formatTime(seconds)}**`,
          `🏆 Celkem: **${formatTime(user.totalSeconds)}**`
        ].join("\n"),
        COLORS.danger
      )
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
        (Date.now() - user.activeSince) / 1000
      );

    return message.reply(
      `🟢 Aktivní směna: **${formatTime(seconds)}**`
    );
  }

  if (command === "!myhours") {
    let seconds = user.totalSeconds;

    if (user.activeSince) {
      seconds +=
        Math.floor(
          (Date.now() - user.activeSince) / 1000
        );
    }

    return message.reply(
      `🏆 Tvůj staff čas: **${formatTime(seconds)}**`
    );
  }

  if (command === "!leaderboard") {
    const users =
      Object.entries(data.staff)
        .map(([id, staff]) => {
          let seconds =
            staff.totalSeconds || 0;

          if (staff.activeSince) {
            seconds +=
              Math.floor(
                (Date.now() - staff.activeSince) / 1000
              );
          }

          return {
            id,
            username: staff.username,
            seconds
          };
        })
        .sort(
          (a, b) =>
            b.seconds - a.seconds
        )
        .slice(0, 10);

    if (!users.length) {
      return message.reply(
        "🏆 Zatím nejsou žádné směny."
      );
    }

    let text =
      "🏆 **STAFF LEADERBOARD**\n\n";

    users.forEach((user, index) => {
      const medals = [
        "🥇",
        "🥈",
        "🥉"
      ];

      text +=
        `${medals[index] || `${index + 1}.`} **${user.username}** — ${formatTime(user.seconds)}\n`;
    });

    return message.reply(text);
  }
});

// =====================================================
// SLASH COMMANDS
// =====================================================

const commands = [
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Nastaví celý Imperial CZ/SK server.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  new SlashCommandBuilder()
    .setName("raid")
    .setDescription("Správa Anti-Raid systému.")
    .addStringOption(option =>
      option
        .setName("stav")
        .setDescription("Zapnout nebo vypnout raid ochranu.")
        .setRequired(true)
        .addChoices(
          {
            name: "Zapnout",
            value: "on"
          },
          {
            name: "Vypnout",
            value: "off"
          }
        )
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Pošle oznámení.")
    .addStringOption(option =>
      option
        .setName("text")
        .setDescription("Text oznámení.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    ),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Smaže zprávy.")
    .addIntegerOption(option =>
      option
        .setName("pocet")
        .setDescription("Počet zpráv 1-100.")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageMessages
    ),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Zobrazí informace o uživateli.")
    .addUserOption(option =>
      option
        .setName("uzivatel")
        .setDescription("Uživatel.")
        .setRequired(false)
    )
].map(command => command.toJSON());

// =====================================================
// SLASH REGISTRATION
// =====================================================

client.once("ready", async () => {
  console.log(
    `✅ Imperial Bot online jako ${client.user.tag}`
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
          body: commands
        }
      );

      console.log(
        `✅ Slash commands registrovány: ${guild.name}`
      );
    } catch (error) {
      console.error(
        "❌ Slash command error:",
        error.message
      );
    }
  }
});

// =====================================================
// INTERACTIONS
// =====================================================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  // ---------------------------------------------------
  // SETUP
  // ---------------------------------------------------

  if (interaction.commandName === "setup") {
    await interaction.deferReply({
      ephemeral: true
    });

    try {
      await setupServer(interaction.guild);

      await interaction.editReply(
        "✅ **IMPERIAL CZ/SK SERVER NASTAVEN!**\n\n" +
        "🎨 Kanály → HOTOVO\n" +
        "🛡️ Staff → HOTOVO\n" +
        "🎫 Tickety → HOTOVO\n" +
        "📥 Přihlášky → HOTOVO\n" +
        "🏛️ Frakce → HOTOVO\n" +
        "🚨 Anti-Raid → HOTOVO\n" +
        "📊 Logy → HOTOVO\n" +
        "👑 Vedení → HOTOVO\n\n" +
        "🔥 Imperial CZ/SK je připraven!"
      );
    } catch (error) {
      console.error("❌ SETUP ERROR:", error);

      await interaction.editReply(
        "❌ Setup se nepodařilo dokončit.\n\n" +
        "Zkontroluj oprávnění bota a Railway logy."
      );
    }

    return;
  }

  // ---------------------------------------------------
  // RAID
  // ---------------------------------------------------

  if (interaction.commandName === "raid") {
    const state =
      interaction.options.getString("stav");

    if (state === "on") {
      await activateRaid(
        interaction.guild,
        `Ruční aktivace administrátorem ${interaction.user.tag}`
      );

      return interaction.reply({
        content:
          "🚨 **Anti-Raid byl aktivován.**\nVšechny kanály jsou uzamčené.",
        ephemeral: true
      });
    }

    if (state === "off") {
      await deactivateRaid(
        interaction.guild
      );

      return interaction.reply({
        content:
          "🔓 **Anti-Raid byl vypnut.**\nKanály byly obnoveny.",
        ephemeral: true
      });
    }
  }

  // ---------------------------------------------------
  // ANNOUNCE
  // ---------------------------------------------------

  if (interaction.commandName === "announce") {
    const text =
      interaction.options.getString("text");

    const channel =
      interaction.guild.channels.cache.find(
        c => c.name === "📢・oznámení"
      );

    if (!channel) {
      return interaction.reply({
        content:
          "❌ Kanál 📢・oznámení neexistuje. Použij `/setup`.",
        ephemeral: true
      });
    }

    await channel.send({
      embeds: [
        createEmbed(
          "📢 OZNÁMENÍ IMPERIAL CZ/SK",
          text,
          COLORS.primary
        )
      ]
    });

    return interaction.reply({
      content: "✅ Oznámení odesláno.",
      ephemeral: true
    });
  }

  // ---------------------------------------------------
  // CLEAR
  // ---------------------------------------------------

  if (interaction.commandName === "clear") {
    const amount =
      interaction.options.getInteger("pocet");

    await interaction.channel.bulkDelete(
      amount,
      true
    );

    return interaction.reply({
      content:
        `🧹 Smazáno **${amount}** zpráv.`,
      ephemeral: true
    });
  }

  // ---------------------------------------------------
  // USERINFO
  // ---------------------------------------------------

  if (interaction.commandName === "userinfo") {
    const user =
      interaction.options.getUser("uzivatel") ||
      interaction.user;

    const member =
      await interaction.guild.members
        .fetch(user.id)
        .catch(() => null);

    const roles =
      member
        ? member.roles.cache
            .filter(role =>
              role.id !==
              interaction.guild.id
            )
            .map(role => role.name)
            .join(", ") || "Žádné"
        : "Nelze načíst";

    return interaction.reply({
      embeds: [
        createEmbed(
          "👤 INFORMACE O UŽIVATELI",
          [
            `👤 **Uživatel:** ${user}`,
            `🆔 **ID:** ${user.id}`,
            `📅 **Účet:** <t:${Math.floor(user.createdTimestamp / 1000)}:F>`,
            `🎭 **Role:** ${roles}`
          ].join("\n"),
          COLORS.primary
        )
      ]
    });
  }
});

// =====================================================
// ERROR HANDLING
// =====================================================

client.on("error", error => {
  console.error("❌ Discord Client Error:", error);
});

process.on("unhandledRejection", error => {
  console.error(
    "❌ Unhandled Promise Rejection:",
    error
  );
});

process.on("uncaughtException", error => {
  console.error(
    "❌ Uncaught Exception:",
    error
  );
});

// =====================================================
// LOGIN
// =====================================================

client.login(TOKEN);

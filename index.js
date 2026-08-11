const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error("❌ Chybí DISCORD_TOKEN v Railway Variables.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// =====================================================
// KONFIGURACE
// =====================================================

const ROLE_NAMES = {
  member: "👤 Člen",
  civilian: "🚶 Civilista",
  pd: "🚓 Policie",
  fire: "🚒 Hasiči",
  ems: "🚑 Záchranáři",

  owner: "👑 Majitel",
  coowner: "💎 Spolumajitel",
  founder: "🏆 Zakladatel",
  director: "🧠 Ředitel projektu",
  projectLead: "📋 Vedoucí projektu",

  headAdmin: "👑 Hlavní administrátor",
  seniorAdmin: "🔴 Senior administrátor",
  admin: "🟠 Administrátor",
  juniorAdmin: "🟡 Junior administrátor",
  trialAdmin: "⚪ Zkušební administrátor"
};

const STAFF_ROLES = [
  ROLE_NAMES.owner,
  ROLE_NAMES.coowner,
  ROLE_NAMES.founder,
  ROLE_NAMES.director,
  ROLE_NAMES.projectLead,
  ROLE_NAMES.headAdmin,
  ROLE_NAMES.seniorAdmin,
  ROLE_NAMES.admin,
  ROLE_NAMES.juniorAdmin,
  ROLE_NAMES.trialAdmin
];

const MANAGEMENT_ROLES = [
  ROLE_NAMES.owner,
  ROLE_NAMES.coowner,
  ROLE_NAMES.founder,
  ROLE_NAMES.director,
  ROLE_NAMES.projectLead
];

// =====================================================
// BARVY ROLÍ
// =====================================================

const ROLE_COLORS = {
  [ROLE_NAMES.member]: 0x5865F2,
  [ROLE_NAMES.civilian]: 0x95A5A6,
  [ROLE_NAMES.pd]: 0x3498DB,
  [ROLE_NAMES.fire]: 0xE74C3C,
  [ROLE_NAMES.ems]: 0x2ECC71,

  [ROLE_NAMES.owner]: 0xFF0000,
  [ROLE_NAMES.coowner]: 0xFF00FF,
  [ROLE_NAMES.founder]: 0xFFD700,
  [ROLE_NAMES.director]: 0x9B59B6,
  [ROLE_NAMES.projectLead]: 0x3498DB,

  [ROLE_NAMES.headAdmin]: 0xC0392B,
  [ROLE_NAMES.seniorAdmin]: 0xE74C3C,
  [ROLE_NAMES.admin]: 0xE67E22,
  [ROLE_NAMES.juniorAdmin]: 0xF1C40F,
  [ROLE_NAMES.trialAdmin]: 0x7F8C8D
};

// =====================================================
// POMOCNÉ FUNKCE
// =====================================================

function findRole(guild, name) {
  return guild.roles.cache.find(role => role.name === name);
}

async function getOrCreateRole(guild, name) {
  let role = findRole(guild, name);

  if (!role) {
    role = await guild.roles.create({
      name,
      color: ROLE_COLORS[name] || 0x5865F2,
      reason: "Imperial CZ/SK RP setup"
    });

    console.log(`✅ Vytvořena role: ${name}`);
  }

  return role;
}

async function getOrCreateCategory(guild, name, permissions = []) {
  let category = guild.channels.cache.find(
    channel =>
      channel.type === ChannelType.GuildCategory &&
      channel.name === name
  );

  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      permissionOverwrites: permissions
    });

    console.log(`📁 Vytvořena kategorie: ${name}`);
  }

  return category;
}

async function getOrCreateTextChannel(
  guild,
  name,
  parent,
  permissions = []
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
      permissionOverwrites: permissions
    });

    console.log(`💬 Vytvořen kanál: ${name}`);
  }

  return channel;
}

async function getOrCreateVoiceChannel(
  guild,
  name,
  parent,
  permissions = []
) {
  let channel = guild.channels.cache.find(
    channel =>
      channel.type === ChannelType.GuildVoice &&
      channel.name === name
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: parent.id,
      permissionOverwrites: permissions
    });

    console.log(`🔊 Vytvořen voice: ${name}`);
  }

  return channel;
}

// =====================================================
// PERMISSIONY
// =====================================================

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
    const role = findRole(guild, roleName);

    if (role) {
      permissions.push({
        id: role.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.AttachFiles,
          PermissionsBitField.Flags.EmbedLinks,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.Speak
        ]
      });
    }
  }

  return permissions;
}

function managementPermissions(guild) {
  const permissions = [
    {
      id: guild.roles.everyone.id,
      deny: [
        PermissionsBitField.Flags.ViewChannel
      ]
    }
  ];

  for (const roleName of MANAGEMENT_ROLES) {
    const role = findRole(guild, roleName);

    if (role) {
      permissions.push({
        id: role.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory,
          PermissionsBitField.Flags.Connect,
          PermissionsBitField.Flags.Speak
        ]
      });
    }
  }

  return permissions;
}

// =====================================================
// ROLE SETUP
// =====================================================

async function setupRoles(guild) {
  console.log("🎭 Nastavuji role...");

  for (const roleName of Object.values(ROLE_NAMES)) {
    await getOrCreateRole(guild, roleName);
  }

  console.log("✅ Role jsou připravené.");
}

// =====================================================
// HLAVNÍ SETUP SERVERU
// =====================================================

async function setupServer(guild) {
  console.log("========================================");
  console.log(`🚀 START SETUP: ${guild.name}`);
  console.log("========================================");

  await setupRoles(guild);

  // ---------------------------------------------------
  // IMPERIAL
  // ---------------------------------------------------

  const imperial = await getOrCreateCategory(
    guild,
    "🏛️・IMPERIAL"
  );

  const rules = await getOrCreateTextChannel(
    guild,
    "📜・pravidla",
    imperial
  );

  const announcements = await getOrCreateTextChannel(
    guild,
    "📢・oznámení",
    imperial
  );

  const events = await getOrCreateTextChannel(
    guild,
    "🎉・eventy",
    imperial
  );

  const news = await getOrCreateTextChannel(
    guild,
    "📰・novinky",
    imperial
  );

  const chat = await getOrCreateTextChannel(
    guild,
    "💬・chat",
    imperial
  );

  // ---------------------------------------------------
  // VÝBĚR OZNÁMENÍ
  // ---------------------------------------------------

  const notifications = await getOrCreateCategory(
    guild,
    "🔔・OZNÁMENÍ"
  );

  const eventNotifications = await getOrCreateTextChannel(
    guild,
    "🎉・eventy-oznámení",
    notifications
  );

  const serverNotifications = await getOrCreateTextChannel(
    guild,
    "📢・oznámení",
    notifications
  );

  const rmNotifications = await getOrCreateTextChannel(
    guild,
    "🚨・rm-oznámení",
    notifications
  );

  // ---------------------------------------------------
  // TICKETY
  // ---------------------------------------------------

  const tickets = await getOrCreateCategory(
    guild,
    "🎫・TICKETY"
  );

  const ticket = await getOrCreateTextChannel(
    guild,
    "🎫・ticket",
    tickets
  );

  const house = await getOrCreateTextChannel(
    guild,
    "🏠・koupení-domu",
    tickets
  );

  // ---------------------------------------------------
  // ADMIN TEAM
  // ---------------------------------------------------

  const staff = await getOrCreateCategory(
    guild,
    "🛡️・ADMIN TEAM",
    staffPermissions(guild)
  );

  const adminChat = await getOrCreateTextChannel(
    guild,
    "💬・admin-chat",
    staff,
    staffPermissions(guild)
  );

  const punishments = await getOrCreateTextChannel(
    guild,
    "📋・zápis-trestů",
    staff,
    staffPermissions(guild)
  );

  const warns = await getOrCreateTextChannel(
    guild,
    "⚠️・warny",
    staff,
    staffPermissions(guild)
  );

  const bans = await getOrCreateTextChannel(
    guild,
    "🔨・bany",
    staff,
    staffPermissions(guild)
  );

  // ---------------------------------------------------
  // ADMIN CALLS
  // ---------------------------------------------------

  const adminCalls = await getOrCreateCategory(
    guild,
    "🔊・ADMIN CALLS",
    staffPermissions(guild)
  );

  await getOrCreateVoiceChannel(
    guild,
    "AT1",
    adminCalls,
    staffPermissions(guild)
  );

  await getOrCreateVoiceChannel(
    guild,
    "AT2",
    adminCalls,
    staffPermissions(guild)
  );

  await getOrCreateVoiceChannel(
    guild,
    "AT3",
    adminCalls,
    staffPermissions(guild)
  );

  await getOrCreateVoiceChannel(
    guild,
    "AT5",
    adminCalls,
    staffPermissions(guild)
  );

  await getOrCreateVoiceChannel(
    guild,
    "AT6",
    adminCalls,
    staffPermissions(guild)
  );

  // ---------------------------------------------------
  // VEDENÍ
  // ---------------------------------------------------

  const management = await getOrCreateCategory(
    guild,
    "👑・VEDENÍ",
    managementPermissions(guild)
  );

  await getOrCreateTextChannel(
    guild,
    "👑・vedení-chat",
    management,
    managementPermissions(guild)
  );

  await getOrCreateVoiceChannel(
    guild,
    "👑・vedení-call",
    management,
    managementPermissions(guild)
  );

  // ---------------------------------------------------
  // ÚVODNÍ TEXTY
  // ---------------------------------------------------

  try {
    await rules.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("📜 PRAVIDLA IMPERIAL CZ/SK RP")
          .setDescription(
            "Vítej na oficiálním serveru Imperial CZ/SK RP.\n\n" +
            "Před zapojením do komunity si prosím přečti pravidla a respektuj ostatní hráče i členy týmu.\n\n" +
            "🎮 Hraj férově\n" +
            "🤝 Respektuj ostatní\n" +
            "🚫 Žádné zneužívání chyb\n" +
            "🛡️ Respektuj rozhodnutí administrace"
          )
          .setColor(0x5865F2)
      ]
    });
  } catch (error) {
    console.log("⚠️ Pravidla už možná obsahují zprávu.");
  }

  try {
    await ticket.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎫 CENTRUM TICKETŮ")
          .setDescription(
            "Potřebuješ pomoc? Vyber typ požadavku.\n\n" +
            "🛡️ Stížnost na administrátora\n" +
            "👤 Stížnost na hráče\n" +
            "🚫 Žádost o unban\n" +
            "💀 Stížnost / problém s mafií\n" +
            "🏠 Koupě domu\n\n" +
            "Administrace se tvému požadavku bude věnovat co nejdříve."
          )
          .setColor(0x5865F2)
      ]
    });
  } catch (error) {
    console.log("⚠️ Ticket panel už možná existuje.");
  }

  try {
    await eventNotifications.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎉 EVENTY")
          .setDescription(
            "Zde budou zveřejňovány informace o připravovaných eventech."
          )
          .setColor(0xF1C40F)
      ]
    });
  } catch (error) {}

  console.log("========================================");
  console.log("✅ SETUP DOKONČEN");
  console.log("========================================");

  return {
    rules,
    announcements,
    events,
    news,
    chat,
    eventNotifications,
    serverNotifications,
    rmNotifications,
    ticket,
    house,
    adminChat,
    punishments,
    warns,
    bans
  };
}

// =====================================================
// SLASH COMMAND
// =====================================================

const setupCommand = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Nastaví celý Imperial CZ/SK RP server.");

// =====================================================
// READY
// =====================================================

client.once("ready", async () => {
  console.log("========================================");
  console.log(`🤖 BOT ONLINE: ${client.user.tag}`);
  console.log(`🌐 Servery: ${client.guilds.cache.size}`);
  console.log("========================================");

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(client.user.id),
      {
        body: [setupCommand.toJSON()]
      }
    );

    console.log("✅ Slash command /setup je zaregistrován.");
  } catch (error) {
    console.error("❌ Nepodařilo se zaregistrovat /setup:", error);
  }
});

// =====================================================
// INTERAKCE
// =====================================================

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName !== "setup") {
    return;
  }

  // Jen administrátoři
  if (
    !interaction.memberPermissions.has(
      PermissionsBitField.Flags.Administrator
    )
  ) {
    return interaction.reply({
      content: "❌ Tento příkaz může použít pouze administrátor.",
      ephemeral: true
    });
  }

  await interaction.reply({
    content: "⏳ Spouštím setup Imperial CZ/SK RP...",
    ephemeral: true
  });

  try {
    await setupServer(interaction.guild);

    await interaction.editReply({
      content:
        "✅ **Setup dokončen!**\n\n" +
        "Role, kategorie, textové kanály a hlasové kanály byly vytvořeny."
    });
  } catch (error) {
    console.error("❌ SETUP ERROR:", error);

    await interaction.editReply({
      content:
        "❌ Setup se nepodařilo dokončit.\n\n" +
        "Zkontroluj Railway Logs."
    });
  }
});

// =====================================================
// CHYBY
// =====================================================

client.on("error", error => {
  console.error("❌ Discord Client Error:", error);
});

process.on("unhandledRejection", error => {
  console.error("❌ Unhandled Rejection:", error);
});

process.on("uncaughtException", error => {
  console.error("❌ Uncaught Exception:", error);
});

// =====================================================
// LOGIN
// =====================================================

client.login(TOKEN);

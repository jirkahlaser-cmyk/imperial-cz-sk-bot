const {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes,
} = require("discord.js");

// ======================================================
// IMPERIAL CZ/SK BOT - NOVÝ SERVER SETUP
// ======================================================

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

if (!TOKEN) {
  console.error("❌ Chybí DISCORD_TOKEN v Railway Variables.");
  process.exit(1);
}

if (!CLIENT_ID) {
  console.error("❌ Chybí CLIENT_ID v Railway Variables.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

// ======================================================
// POMOCNÉ FUNKCE
// ======================================================

function channelPermissions(guild, options = {}) {
  const everyone = guild.roles.everyone;

  const overwrites = [
    {
      id: everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
  ];

  // MAJITEL SERVERU - VŽDY VŠUDE
  overwrites.push({
    id: guild.ownerId,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.AttachFiles,
    ],
  });

  if (options.roles) {
    for (const role of options.roles) {
      if (!role) continue;

      overwrites.push({
        id: role.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak,
        ],
      });
    }
  }

  return overwrites;
}

async function createCategory(guild, name, roles = []) {
  return guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: channelPermissions(guild, {
      roles,
    }),
  });
}

async function createText(guild, name, parent, roles = [], topic = "") {
  return guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: parent.id,
    topic,
    permissionOverwrites: channelPermissions(guild, {
      roles,
    }),
  });
}

async function createVoice(guild, name, parent, roles = []) {
  return guild.channels.create({
    name,
    type: ChannelType.GuildVoice,
    parent: parent.id,
    permissionOverwrites: channelPermissions(guild, {
      roles,
    }),
  });
}

async function createRole(guild, name, color = null) {
  const existing = guild.roles.cache.find(
    (role) => role.name.toLowerCase() === name.toLowerCase()
  );

  if (existing) return existing;

  return guild.roles.create({
    name,
    color: color || undefined,
    reason: "Imperial CZ/SK server setup",
  });
}

// ======================================================
// SETUP
// ======================================================

async function setupServer(guild) {
  console.log(`🚀 Spouštím setup serveru: ${guild.name}`);

  // ----------------------------------------------------
  // ROLE
  // ----------------------------------------------------

  const roles = {};

  roles.clen = await createRole(guild, "Člen", "#5865F2");
  roles.admin = await createRole(guild, "Admin", "#E74C3C");
  roles.mod = await createRole(guild, "Moderátor", "#F1C40F");
  roles.vedeni = await createRole(guild, "Vedení", "#9B59B6");

  roles.pd = await createRole(guild, "🚔 PD", "#3498DB");
  roles.hasici = await createRole(guild, "🚒 Hasiči", "#E74C3C");
  roles.zachranka = await createRole(guild, "🚑 Záchranáři", "#2ECC71");
  roles.civilista = await createRole(guild, "👤 Civilista", "#95A5A6");

  // ----------------------------------------------------
  // KATEGORIE
  // ----------------------------------------------------

  const publicCategory = await createCategory(
    guild,
    "📢・INFORMACE",
    [roles.clen]
  );

  const selectionCategory = await createCategory(
    guild,
    "🎛️・VÝBĚR",
    [roles.clen]
  );

  const ticketCategory = await createCategory(
    guild,
    "🎫・TICKETY",
    [roles.admin]
  );

  const adminCategory = await createCategory(
    guild,
    "🛡️・ADMIN TEAM",
    [roles.admin]
  );

  const adminCallCategory = await createCategory(
    guild,
    "📞・ADMIN CALL",
    [roles.admin]
  );

  const leadershipCategory = await createCategory(
    guild,
    "👑・VEDENÍ",
    [roles.vedeni]
  );

  const punishCategory = await createCategory(
    guild,
    "⚠️・TRESTY",
    [roles.admin]
  );

  const logsCategory = await createCategory(
    guild,
    "📋・LOGY",
    [roles.admin]
  );

  const mapCategory = await createCategory(
    guild,
    "🗺️・SERVER",
    [roles.clen]
  );

  // ----------------------------------------------------
  // VEŘEJNÉ KANÁLY
  // ----------------------------------------------------

  const welcome = await createText(
    guild,
    "👋・vítej",
    publicCategory,
    [roles.clen],
    "Vítej na oficiálním Imperial CZ/SK Discord serveru."
  );

  const rules = await createText(
    guild,
    "📜・pravidla",
    publicCategory,
    [roles.clen],
    "Pravidla Imperial CZ/SK."
  );

  const announcements = await createText(
    guild,
    "📢・oznámení",
    publicCategory,
    [roles.clen],
    "Oficiální oznámení serveru."
  );

  const events = await createText(
    guild,
    "🎉・eventy",
    publicCategory,
    [roles.clen],
    "Informace o eventech."
  );

  const rm = await createText(
    guild,
    "📣・rm-oznámení",
    publicCategory,
    [roles.clen],
    "Oznámení RM."
  );

  // ----------------------------------------------------
  // VÝBĚR
  // ----------------------------------------------------

  const notificationSelect = await createText(
    guild,
    "🔔・výběr-oznámení",
    selectionCategory,
    [roles.clen],
    "Vyber si, která oznámení chceš dostávat."
  );

  const factionSelect = await createText(
    guild,
    "🎖️・výběr-složky",
    selectionCategory,
    [roles.clen],
    "Vyber si PD, Hasiče, Záchranáře nebo Civilistu."
  );

  // ----------------------------------------------------
  // TICKETY
  // ----------------------------------------------------

  const ticketPanel = await createText(
    guild,
    "🎫・ticket",
    ticketCategory,
    [roles.clen],
    "Zde si můžeš vytvořit ticket."
  );

  const ticketAdmin = await createText(
    guild,
    "📨・ticket-admin",
    ticketCategory,
    [roles.admin],
    "Admin centrum ticketů."
  );

  // ----------------------------------------------------
  // ADMIN CHATY
  // ----------------------------------------------------

  const adminChat = await createText(
    guild,
    "💬・admin-chat",
    adminCategory,
    [roles.admin],
    "Interní komunikace admin týmu."
  );

  const adminRules = await createText(
    guild,
    "📜・admin-pravidla",
    adminCategory,
    [roles.admin],
    "Interní pravidla administrace."
  );

  const adminLogs = await createText(
    guild,
    "📋・admin-log",
    adminCategory,
    [roles.admin],
    "Interní admin log."
  );

  // ----------------------------------------------------
  // ADMIN CALL - POUZE AT1, AT2, AT3, AT5, AT6
  // ----------------------------------------------------

  const at1 = await createRole(guild, "AT1", "#3498DB");
  const at2 = await createRole(guild, "AT2", "#3498DB");
  const at3 = await createRole(guild, "AT3", "#3498DB");
  const at5 = await createRole(guild, "AT5", "#3498DB");
  const at6 = await createRole(guild, "AT6", "#3498DB");

  await createVoice(guild, "🔊・AT1", adminCallCategory, [
    roles.admin,
    at1,
  ]);

  await createVoice(guild, "🔊・AT2", adminCallCategory, [
    roles.admin,
    at2,
  ]);

  await createVoice(guild, "🔊・AT3", adminCallCategory, [
    roles.admin,
    at3,
  ]);

  await createVoice(guild, "🔊・AT5", adminCallCategory, [
    roles.admin,
    at5,
  ]);

  await createVoice(guild, "🔊・AT6", adminCallCategory, [
    roles.admin,
    at6,
  ]);

  // ----------------------------------------------------
  // VEDENÍ
  // ----------------------------------------------------

  await createText(
    guild,
    "👑・vedení-chat",
    leadershipCategory,
    [roles.vedeni],
    "Soukromý chat vedení."
  );

  await createText(
    guild,
    "📋・vedení-plány",
    leadershipCategory,
    [roles.vedeni],
    "Plány a rozhodnutí vedení."
  );

  await createVoice(
    guild,
    "🔊・vedení-call",
    leadershipCategory,
    [roles.vedeni]
  );

  // ----------------------------------------------------
  // TRESTY
  // ----------------------------------------------------

  const punishmentPanel = await createText(
    guild,
    "⚠️・zápis-trestů",
    punishCategory,
    [roles.admin],
    "Panel pro udělování Warnů a Banů."
  );

  await createText(
    guild,
    "⚠️・warn",
    punishCategory,
    [roles.admin],
    "Formulář pro udělení Warnu."
  );

  await createText(
    guild,
    "🔨・ban",
    punishCategory,
    [roles.admin],
    "Formulář pro udělení Banu."
  );

  // ----------------------------------------------------
  // LOGY
  // ----------------------------------------------------

  const warnLog = await createText(
    guild,
    "📋・warn-log",
    logsCategory,
    [roles.admin],
    "Automatický zápis všech Warnů."
  );

  const banLog = await createText(
    guild,
    "🔨・ban-log",
    logsCategory,
    [roles.admin],
    "Automatický zápis všech Banů."
  );

  // ----------------------------------------------------
  // SERVER
  // ----------------------------------------------------

  await createText(
    guild,
    "🗺️・mapa",
    mapCategory,
    [roles.clen],
    "Mapa Imperial serveru."
  );

  await createText(
    guild,
    "🏠・domy",
    mapCategory,
    [roles.clen],
    "Informace o domech a jejich koupi."
  );

  // ----------------------------------------------------
  // EMBEDY
  // ----------------------------------------------------

  const welcomeEmbed = new EmbedBuilder()
    .setTitle("🇨🇿🇸🇰 Imperial CZ/SK")
    .setDescription(
      "Vítej na oficiálním Discord serveru Imperial CZ/SK!\n\n" +
      "Vyber si své oznámení a následně svou složku."
    )
    .setColor("#5865F2");

  await welcome.send({ embeds: [welcomeEmbed] });

  // ----------------------------------------------------
  // VÝBĚR OZNÁMENÍ
  // ----------------------------------------------------

  const notificationMenu = new StringSelectMenuBuilder()
    .setCustomId("notification_select")
    .setPlaceholder("🔔 Vyber oznámení")
    .setMinValues(0)
    .setMaxValues(3)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Eventy")
        .setDescription("Dostávej informace o eventech.")
        .setValue("eventy")
        .setEmoji("🎉"),

      new StringSelectMenuOptionBuilder()
        .setLabel("Oznámení")
        .setDescription("Dostávej důležitá oznámení.")
        .setValue("oznameni")
        .setEmoji("📢"),

      new StringSelectMenuOptionBuilder()
        .setLabel("RM oznámení")
        .setDescription("Dostávej RM oznámení.")
        .setValue("rm")
        .setEmoji("📣")
    );

  await notificationSelect.send({
    content:
      "**🔔 VÝBĚR OZNÁMENÍ**\n\n" +
      "Vyber si, která oznámení chceš dostávat.",
    components: [
      new ActionRowBuilder().addComponents(notificationMenu),
    ],
  });

  // ----------------------------------------------------
  // VÝBĚR SLOŽKY
  // ----------------------------------------------------

  const factionMenu = new StringSelectMenuBuilder()
    .setCustomId("faction_select")
    .setPlaceholder("🎖️ Vyber svou složku")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Policie")
        .setDescription("Chci působit u Policie.")
        .setValue("pd")
        .setEmoji("🚔"),

      new StringSelectMenuOptionBuilder()
        .setLabel("Hasiči")
        .setDescription("Chci působit u Hasičů.")
        .setValue("hasici")
        .setEmoji("🚒"),

      new StringSelectMenuOptionBuilder()
        .setLabel("Záchranáři")
        .setDescription("Chci působit u Záchranářů.")
        .setValue("zachranka")
        .setEmoji("🚑"),

      new StringSelectMenuOptionBuilder()
        .setLabel("Civilista")
        .setDescription("Chci hrát jako civilista.")
        .setValue("civilista")
        .setEmoji("👤")
    );

  await factionSelect.send({
    content:
      "**🎖️ VÝBĚR SLOŽKY**\n\n" +
      "Vyber si, za koho chceš na Imperialu hrát.",
    components: [
      new ActionRowBuilder().addComponents(factionMenu),
    ],
  });

  // ----------------------------------------------------
  // TICKET PANEL
  // ----------------------------------------------------

  const ticketMenu = new StringSelectMenuBuilder()
    .setCustomId("ticket_select")
    .setPlaceholder("🎫 Vyber typ ticketu")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Stížnost na admina")
        .setValue("admin_complaint")
        .setEmoji("🛡️"),

      new StringSelectMenuOptionBuilder()
        .setLabel("Stížnost na hráče")
        .setValue("player_complaint")
        .setEmoji("👤"),

      new StringSelectMenuOptionBuilder()
        .setLabel("Mafie")
        .setValue("mafia")
        .setEmoji("🔫"),

      new StringSelectMenuOptionBuilder()
        .setLabel("Žádost o unban")
        .setValue("unban")
        .setEmoji("🔓"),

      new StringSelectMenuOptionBuilder()
        .setLabel("Jiný problém")
        .setValue("other")
        .setEmoji("❓")
    );

  await ticketPanel.send({
    content:
      "**🎫 TICKET SYSTÉM**\n\n" +
      "Vyber důvod, proč chceš kontaktovat administraci.",
    components: [
      new ActionRowBuilder().addComponents(ticketMenu),
    ],
  });

  // ----------------------------------------------------
  // TRESTY
  // ----------------------------------------------------

  const punishmentMenu = new StringSelectMenuBuilder()
    .setCustomId("punishment_select")
    .setPlaceholder("⚠️ Vyber typ trestu")
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel("Warn")
        .setDescription("Udělit hráči Warn.")
        .setValue("warn")
        .setEmoji("⚠️"),

      new StringSelectMenuOptionBuilder()
        .setLabel("Ban")
        .setDescription("Udělit hráči Ban.")
        .setValue("ban")
        .setEmoji("🔨")
    );

  await punishmentPanel.send({
    content:
      "**⚠️ ZÁPIS TRESTU**\n\n" +
      "Vyber typ trestu, který chceš řešit.",
    components: [
      new ActionRowBuilder().addComponents(punishmentMenu),
    ],
  });

  console.log("======================================");
  console.log("✅ IMPERIAL SERVER SETUP HOTOV");
  console.log("======================================");
}

// ======================================================
// INTERAKCE
// ======================================================

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "setup") {
        if (interaction.user.id !== interaction.guild.ownerId) {
          return interaction.reply({
            content: "❌ Tento příkaz může použít pouze majitel serveru.",
            ephemeral: true,
          });
        }

        await interaction.reply({
          content: "⏳ Vytvářím Imperial server...",
          ephemeral: true,
        });

        await setupServer(interaction.guild);

        return interaction.editReply({
          content: "✅ Imperial server byl vytvořen.",
        });
      }
    }

    if (interaction.isStringSelectMenu()) {

      // -----------------------------------------------
      // OZNÁMENÍ
      // -----------------------------------------------

      if (interaction.customId === "notification_select") {
        const roleMap = {
          eventy: "Eventy",
          oznameni: "Oznámení",
          rm: "RM Oznámení",
        };

        for (const value of interaction.values) {
          const role = interaction.guild.roles.cache.find(
            (r) => r.name === roleMap[value]
          );

          if (role) {
            await interaction.member.roles.add(role).catch(() => {});
          }
        }

        return interaction.reply({
          content: "✅ Tvé nastavení oznámení bylo uloženo.",
          ephemeral: true,
        });
      }

      // -----------------------------------------------
      // SLOŽKA
      // -----------------------------------------------

      if (interaction.customId === "faction_select") {
        const roleMap = {
          pd: "🚔 PD",
          hasici: "🚒 Hasiči",
          zachranka: "🚑 Záchranáři",
          civilista: "👤 Civilista",
        };

        const selected = interaction.values[0];
        const selectedRole = interaction.guild.roles.cache.find(
          (r) => r.name === roleMap[selected]
        );

        const memberRole = interaction.guild.roles.cache.find(
          (r) => r.name === "Člen"
        );

        if (selectedRole) {
          await interaction.member.roles.add(selectedRole).catch(() => {});
        }

        if (memberRole) {
          await interaction.member.roles.add(memberRole).catch(() => {});
        }

        return interaction.reply({
          content:
            "✅ Role byla přidána.\n\n" +
            "Pokud jsi vybral složku IZS, další část bude pokračovat na příslušném serveru.",
          ephemeral: true,
        });
      }

      // -----------------------------------------------
      // TICKET
      // -----------------------------------------------

      if (interaction.customId === "ticket_select") {
        return interaction.reply({
          content:
            "🎫 Ticket systém je připraven.\n" +
            "Další část následně vytvoří samotný ticket kanál.",
          ephemeral: true,
        });
      }

      // -----------------------------------------------
      // TREST
      // -----------------------------------------------

      if (interaction.customId === "punishment_select") {
        if (!interaction.member.roles.cache.some(
          (r) => r.name === "Admin" || r.name === "Vedení"
        ) && interaction.user.id !== interaction.guild.ownerId) {
          return interaction.reply({
            content: "❌ Na tento systém nemáš oprávnění.",
            ephemeral: true,
          });
        }

        return interaction.reply({
          content:
            interaction.values[0] === "warn"
              ? "⚠️ Zvolen WARN. Formulář doplníme v další části."
              : "🔨 Zvolen BAN. Formulář doplníme v další části.",
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error("❌ Chyba interaction:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Nastala chyba.",
        ephemeral: true,
      }).catch(() => {});
    }
  }
});

// ======================================================
// READY
// ======================================================

client.once("ready", async () => {
  console.log(`✅ Bot je online jako ${client.user.tag}`);

  const commands = [
    new SlashCommandBuilder()
      .setName("setup")
      .setDescription("Vytvoří celý Imperial CZ/SK server."),
  ].map((command) => command.toJSON());

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Slash příkaz /setup byl zaregistrován.");
  } catch (error) {
    console.error("❌ Nepodařilo se zaregistrovat /setup:", error);
  }
});

// ======================================================
// LOGIN
// ======================================================

client.login(TOKEN);

const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandBuilder,
  REST,
  Routes
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

const ROLE_NAMES = {
  member: "Člen",
  admin: "Admin",
  moderator: "Moderátor",
  management: "Vedení",
  owner: "Majitel",

  pd: "🚔 PD",
  fire: "🚒 Hasiči",
  ems: "🚑 Záchranáři",
  civilian: "👤 Civilista",

  event: "🔔 Eventy",
  announcements: "🔔 Oznámení",
  rm: "🔔 RM Oznámení",

  at1: "AT1",
  at2: "AT2",
  at3: "AT3",
  at5: "AT5",
  at6: "AT6"
};

const punishments = new Map();

function getRole(guild, name) {
  return guild.roles.cache.find(role => role.name === name);
}

async function getOrCreateRole(guild, name, color = null) {
  let role = getRole(guild, name);

  if (!role) {
    role = await guild.roles.create({
      name,
      color: color || undefined,
      reason: "Imperial CZ/SK setup"
    });
  }

  return role;
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

async function getOrCreateText(guild, name, parent) {
  let channel = guild.channels.cache.find(
    channel =>
      channel.type === ChannelType.GuildText &&
      channel.name === name &&
      channel.parentId === parent.id
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: parent.id
    });
  }

  return channel;
}

async function getOrCreateVoice(guild, name, parent) {
  let channel = guild.channels.cache.find(
    channel =>
      channel.type === ChannelType.GuildVoice &&
      channel.name === name &&
      channel.parentId === parent.id
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: parent.id
    });
  }

  return channel;
}

function denyEveryone(guild) {
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
      PermissionFlagsBits.EmbedLinks
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
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageMessages
    ]
  };
}

async function setPrivateCategory(guild, category, roles) {
  const overwrites = [
    denyEveryone(guild)
  ];

  for (const role of roles) {
    overwrites.push(textAccess(role));
  }

  overwrites.push(ownerAccess(guild));

  await category.permissionOverwrites.set(overwrites);
}

async function setPrivateVoice(guild, channel, roles) {
  const overwrites = [
    denyEveryone(guild)
  ];

  for (const role of roles) {
    overwrites.push(voiceAccess(role));
  }

  overwrites.push(ownerAccess(guild));

  await channel.permissionOverwrites.set(overwrites);
}

async function setupServer(guild) {
  console.log(`🔧 Spouštím setup serveru: ${guild.name}`);

  const member = await getOrCreateRole(guild, ROLE_NAMES.member, "#5865F2");
  const admin = await getOrCreateRole(guild, ROLE_NAMES.admin, "#E74C3C");
  const moderator = await getOrCreateRole(guild, ROLE_NAMES.moderator, "#F1C40F");
  const management = await getOrCreateRole(guild, ROLE_NAMES.management, "#9B59B6");
  const owner = await getOrCreateRole(guild, ROLE_NAMES.owner, "#FFD700");

  const pd = await getOrCreateRole(guild, ROLE_NAMES.pd, "#3498DB");
  const fire = await getOrCreateRole(guild, ROLE_NAMES.fire, "#E74C3C");
  const ems = await getOrCreateRole(guild, ROLE_NAMES.ems, "#2ECC71");
  const civilian = await getOrCreateRole(guild, ROLE_NAMES.civilian, "#95A5A6");

  const eventRole = await getOrCreateRole(guild, ROLE_NAMES.event, "#2ECC71");
  const announcementRole = await getOrCreateRole(guild, ROLE_NAMES.announcements, "#3498DB");
  const rmRole = await getOrCreateRole(guild, ROLE_NAMES.rm, "#9B59B6");

  const at1 = await getOrCreateRole(guild, ROLE_NAMES.at1);
  const at2 = await getOrCreateRole(guild, ROLE_NAMES.at2);
  const at3 = await getOrCreateRole(guild, ROLE_NAMES.at3);
  const at5 = await getOrCreateRole(guild, ROLE_NAMES.at5);
  const at6 = await getOrCreateRole(guild, ROLE_NAMES.at6);

  const info = await getOrCreateCategory(guild, "📢・INFORMACE");
  const selection = await getOrCreateCategory(guild, "🎛️・VÝBĚR");
  const serverCategory = await getOrCreateCategory(guild, "🗺️・SERVER");
  const tickets = await getOrCreateCategory(guild, "🎫・TICKETY");

  const adminCategory = await getOrCreateCategory(guild, "🛡️・ADMIN TEAM");
  const adminCalls = await getOrCreateCategory(guild, "📞・ADMIN CALL");
  const managementCategory = await getOrCreateCategory(guild, "👑・VEDENÍ");

  const punishmentCategory = await getOrCreateCategory(guild, "⚠️・TRESTY");
  const logsCategory = await getOrCreateCategory(guild, "📋・LOGY");

  const pdCategory = await getOrCreateCategory(guild, "🚔・POLICIE");
  const fireCategory = await getOrCreateCategory(guild, "🚒・HASIČI");
  const emsCategory = await getOrCreateCategory(guild, "🚑・ZÁCHRANÁŘI");

  await setPrivateCategory(guild, adminCategory, [
    admin,
    moderator,
    management,
    owner
  ]);

  await setPrivateCategory(guild, adminCalls, [
    admin,
    moderator,
    management,
    owner
  ]);

  await setPrivateCategory(guild, managementCategory, [
    management,
    owner
  ]);

  await setPrivateCategory(guild, punishmentCategory, [
    admin,
    moderator,
    management,
    owner
  ]);

  await setPrivateCategory(guild, logsCategory, [
    admin,
    moderator,
    management,
    owner
  ]);

  await setPrivateCategory(guild, pdCategory, [
    pd,
    admin,
    moderator,
    management,
    owner
  ]);

  await setPrivateCategory(guild, fireCategory, [
    fire,
    admin,
    moderator,
    management,
    owner
  ]);

  await setPrivateCategory(guild, emsCategory, [
    ems,
    admin,
    moderator,
    management,
    owner
  ]);

  await getOrCreateText(guild, "👋・vítej", info);
  await getOrCreateText(guild, "📜・pravidla", info);
  await getOrCreateText(guild, "📢・oznámení", info);
  await getOrCreateText(guild, "🎉・eventy", info);
  await getOrCreateText(guild, "📣・rm-oznámení", info);

  const notificationChannel = await getOrCreateText(
    guild,
    "🔔・výběr-oznámení",
    selection
  );

  const factionChannel = await getOrCreateText(
    guild,
    "🎖️・výběr-složky",
    selection
  );

  await getOrCreateText(guild, "🗺️・mapa", serverCategory);
  await getOrCreateText(guild, "🏠・domy", serverCategory);

  const ticketChannel = await getOrCreateText(
    guild,
    "🎫・ticket",
    tickets
  );

  await getOrCreateText(guild, "💬・admin-chat", adminCategory);
  await getOrCreateText(guild, "📜・admin-pravidla", adminCategory);
  await getOrCreateText(guild, "📋・admin-log", adminCategory);

  await getOrCreateText(
    guild,
    "👑・vedení-chat",
    managementCategory
  );

  await getOrCreateText(
    guild,
    "📋・vedení-plány",
    managementCategory
  );

  const managementCall = await getOrCreateVoice(
    guild,
    "🔊・vedení-call",
    managementCategory
  );

  await setPrivateVoice(guild, managementCall, [
    management,
    owner
  ]);

  const atChannels = [
    ["🔊・AT1", at1],
    ["🔊・AT2", at2],
    ["🔊・AT3", at3],
    ["🔊・AT5", at5],
    ["🔊・AT6", at6]
  ];

  for (const [name, role] of atChannels) {
    const channel = await getOrCreateVoice(
      guild,
      name,
      adminCalls
    );

    await setPrivateVoice(guild, channel, [
      role,
      admin,
      moderator,
      management,
      owner
    ]);
  }

  const pdChat = await getOrCreateText(
    guild,
    "🚔・pd-chat",
    pdCategory
  );

  const pdCall = await getOrCreateVoice(
    guild,
    "🔊・pd-call",
    pdCategory
  );

  await pdChat.permissionOverwrites.set([
    denyEveryone(guild),
    textAccess(pd),
    textAccess(admin),
    textAccess(moderator),
    textAccess(management),
    ownerAccess(guild)
  ]);

  await setPrivateVoice(guild, pdCall, [
    pd,
    admin,
    moderator,
    management,
    owner
  ]);

  const fireChat = await getOrCreateText(
    guild,
    "🚒・hasici-chat",
    fireCategory
  );

  const fireCall = await getOrCreateVoice(
    guild,
    "🔊・hasici-call",
    fireCategory
  );

  await fireChat.permissionOverwrites.set([
    denyEveryone(guild),
    textAccess(fire),
    textAccess(admin),
    textAccess(moderator),
    textAccess(management),
    ownerAccess(guild)
  ]);

  await setPrivateVoice(guild, fireCall, [
    fire,
    admin,
    moderator,
    management,
    owner
  ]);

  const emsChat = await getOrCreateText(
    guild,
    "🚑・zachranari-chat",
    emsCategory
  );

  const emsCall = await getOrCreateVoice(
    guild,
    "🔊・zachranari-call",
    emsCategory
  );

  await emsChat.permissionOverwrites.set([
    denyEveryone(guild),
    textAccess(ems),
    textAccess(admin),
    textAccess(moderator),
    textAccess(management),
    ownerAccess(guild)
  ]);

  await setPrivateVoice(guild, emsCall, [
    ems,
    admin,
    moderator,
    management,
    owner
  ]);

  const punishmentMain = await getOrCreateText(
    guild,
    "⚠️・zápis-trestů",
    punishmentCategory
  );

  const warnChannel = await getOrCreateText(
    guild,
    "⚠️・warn",
    punishmentCategory
  );

  const banChannel = await getOrCreateText(
    guild,
    "🔨・ban",
    punishmentCategory
  );

  const warnLog = await getOrCreateText(
    guild,
    "⚠️・warn-log",
    logsCategory
  );

  const banLog = await getOrCreateText(
    guild,
    "🔨・ban-log",
    logsCategory
  );

  const punishmentButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("open_warn")
      .setLabel("⚠️ Udělit WARN")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("open_ban")
      .setLabel("🔨 Udělit BAN")
      .setStyle(ButtonStyle.Danger)
  );

  if ((await punishmentMain.messages.fetch({ limit: 10 })).size === 0) {
    await punishmentMain.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚠️ Zápis trestů")
          .setDescription(
            "Administrace zde může udělovat tresty hráčům.\n\n" +
            "⚠️ **WARN** – upozornění hráče\n" +
            "🔨 **BAN** – zákaz přístupu hráče\n\n" +
            "Po třetím Warnu bot automaticky upozorní administraci."
          )
          .setColor("#E67E22")
      ],
      components: [punishmentButtons]
    });
  }

  if ((await warnChannel.messages.fetch({ limit: 10 })).size === 0) {
    await warnChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚠️ WARN")
          .setDescription(
            "Klikni na tlačítko níže a otevři formulář pro udělení Warnu."
          )
          .setColor("#F1C40F")
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("open_warn")
            .setLabel("⚠️ Udělit WARN")
            .setStyle(ButtonStyle.Secondary)
        )
      ]
    });
  }

  if ((await banChannel.messages.fetch({ limit: 10 })).size === 0) {
    await banChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔨 BAN")
          .setDescription(
            "Klikni na tlačítko níže a otevři formulář pro udělení Banu."
          )
          .setColor("#E74C3C")
      ],
      components: [
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("open_ban")
            .setLabel("🔨 Udělit BAN")
            .setStyle(ButtonStyle.Danger)
        )
      ]
    });
  }

  if ((await notificationChannel.messages.fetch({ limit: 10 })).size === 0) {
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

        new StringSelectMenuOptionBuilder()
          .setLabel("Oznámení")
          .setDescription("Důležitá oznámení")
          .setValue("announcement")
          .setEmoji("📢"),

        new StringSelectMenuOptionBuilder()
          .setLabel("RM Oznámení")
          .setDescription("RM oznámení")
          .setValue("rm")
          .setEmoji("📣")
      );

    await notificationChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔔 Výběr oznámení")
          .setDescription(
            "Vyber si, jaká oznámení chceš dostávat.\n\n" +
            "Můžeš vybrat jednu nebo více možností."
          )
          .setColor("#5865F2")
      ],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  if ((await factionChannel.messages.fetch({ limit: 10 })).size === 0) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("faction_select")
      .setPlaceholder("🎖️ Vyber JEDNU složku")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Policie")
          .setDescription("Přístup do sekce Policie")
          .setValue("pd")
          .setEmoji("🚔"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Hasiči")
          .setDescription("Přístup do sekce Hasičů")
          .setValue("fire")
          .setEmoji("🚒"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Záchranáři")
          .setDescription("Přístup do sekce Záchranářů")
          .setValue("ems")
          .setEmoji("🚑"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Civilista")
          .setDescription("Běžný civilista")
          .setValue("civilian")
          .setEmoji("👤")
      );

    await factionChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎖️ Výběr složky")
          .setDescription(
            "Vyber si **JEDNU** možnost.\n\n" +
            "🚔 Policie\n" +
            "🚒 Hasiči\n" +
            "🚑 Záchranáři\n" +
            "👤 Civilista\n\n" +
            "Při nové volbě bot odebere předchozí složku.\n" +
            "Každý, kdo si vybere složku, dostane také roli **Člen**."
          )
          .setColor("#5865F2")
      ],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  if ((await ticketChannel.messages.fetch({ limit: 10 })).size === 0) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_select")
      .setPlaceholder("🎫 Vyber typ ticketu")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Stížnost na admina")
          .setDescription("Stížnost na člena administrace")
          .setValue("admin_complaint")
          .setEmoji("🛡️"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Stížnost na hráče")
          .setDescription("Nahlášení hráče")
          .setValue("player_complaint")
          .setEmoji("👤"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Mafie")
          .setDescription("Obecná záležitost týkající se mafie")
          .setValue("mafia")
          .setEmoji("🔫"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Mafie 1")
          .setDescription("Mafie 1")
          .setValue("mafia1")
          .setEmoji("1️⃣"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Mafie 2")
          .setDescription("Mafie 2")
          .setValue("mafia2")
          .setEmoji("2️⃣"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Mafie 3")
          .setDescription("Mafie 3")
          .setValue("mafia3")
          .setEmoji("3️⃣"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Žádost o unban")
          .setDescription("Žádost o zrušení banu")
          .setValue("unban")
          .setEmoji("🔓")
      );

    await ticketChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎫 Ticket systém")
          .setDescription(
            "Vyber důvod, proč chceš kontaktovat administraci."
          )
          .setColor("#5865F2")
      ],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  console.log("✅ SETUP DOKONČEN");
}

function isStaff(member) {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.roles.cache.some(role =>
      [
        ROLE_NAMES.admin,
        ROLE_NAMES.moderator,
        ROLE_NAMES.management,
        ROLE_NAMES.owner
      ].includes(role.name)
    )
  );
}

async function createTicket(interaction, type) {
  const guild = interaction.guild;

  const existing = guild.channels.cache.find(
    channel =>
      channel.type === ChannelType.GuildText &&
      channel.topic === `ticket:${interaction.user.id}`
  );

  if (existing) {
    return interaction.reply({
      content: `❌ Už máš otevřený ticket: ${existing}`,
      ephemeral: true
    });
  }

  const category = guild.channels.cache.find(
    channel =>
      channel.type === ChannelType.GuildCategory &&
      channel.name === "🎫・TICKETY"
  );

  const staffRoles = [
    getRole(guild, ROLE_NAMES.admin),
    getRole(guild, ROLE_NAMES.moderator),
    getRole(guild, ROLE_NAMES.management),
    getRole(guild, ROLE_NAMES.owner)
  ].filter(Boolean);

  const typeNames = {
    admin_complaint: "Stížnost na admina",
    player_complaint: "Stížnost na hráče",
    mafia: "Mafie",
    mafia1: "Mafie 1",
    mafia2: "Mafie 2",
    mafia3: "Mafie 3",
    unban: "Žádost o unban"
  };

  const channel = await guild.channels.create({
    name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 90),
    type: ChannelType.GuildText,
    parent: category?.id,
    topic: `ticket:${interaction.user.id}`,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      },
      ...staffRoles.map(role => ({
        id: role.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.AttachFiles
        ]
      })),
      ownerAccess(guild)
    ]
  });

  const closeButton = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("🔒 Zavřít ticket")
      .setStyle(ButtonStyle.Danger)
  );

  await channel.send({
    content: `${interaction.user}`,
    embeds: [
      new EmbedBuilder()
        .setTitle(`🎫 ${typeNames[type] || "Ticket"}`)
        .setDescription(
          `Ticket vytvořil: ${interaction.user}\n\n` +
          `**Typ:** ${typeNames[type] || type}\n\n` +
          "Popiš zde svůj problém nebo žádost. Administrace se ti bude věnovat."
        )
        .setColor("#5865F2")
    ],
    components: [closeButton]
  });

  return interaction.reply({
    content: `✅ Ticket byl vytvořen: ${channel}`,
    ephemeral: true
  });
}

client.once("ready", async () => {
  console.log(`✅ Bot online: ${client.user.tag}`);

  try {
    const command = new SlashCommandBuilder()
      .setName("setup")
      .setDescription("Vytvoří a nastaví celý Imperial CZ/SK server.");

    const rest = new REST({ version: "10" }).setToken(TOKEN);

    for (const guild of client.guilds.cache.values()) {
      await rest.put(
        Routes.applicationGuildCommands(
          client.user.id,
          guild.id
        ),
        {
          body: [command.toJSON()]
        }
      );

      console.log(`✅ /setup registrován: ${guild.name}`);
    }
  } catch (error) {
    console.error("❌ Chyba registrace /setup:", error);
  }
});

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "setup") {
        if (interaction.guild.ownerId !== interaction.user.id) {
          return interaction.reply({
            content: "❌ /setup může použít pouze majitel serveru.",
            ephemeral: true
          });
        }

        await interaction.deferReply({
          ephemeral: true
        });

        await setupServer(interaction.guild);

        return interaction.editReply(
          "✅ Imperial CZ/SK server byl kompletně nastaven."
        );
      }
    }

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "notification_select"
    ) {
      const roleMap = {
        event: ROLE_NAMES.event,
        announcement: ROLE_NAMES.announcements,
        rm: ROLE_NAMES.rm
      };

      for (const roleName of Object.values(roleMap)) {
        const role = getRole(interaction.guild, roleName);

        if (role && interaction.member.roles.cache.has(role.id)) {
          await interaction.member.roles.remove(role).catch(() => {});
        }
      }

      for (const value of interaction.values) {
        const role = getRole(
          interaction.guild,
          roleMap[value]
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
      const factionNames = [
        ROLE_NAMES.pd,
        ROLE_NAMES.fire,
        ROLE_NAMES.ems,
        ROLE_NAMES.civilian
      ];

      for (const name of factionNames) {
        const role = getRole(interaction.guild, name);

        if (role && interaction.member.roles.cache.has(role.id)) {
          await interaction.member.roles.remove(role).catch(() => {});
        }
      }

      const selectedName = {
        pd: ROLE_NAMES.pd,
        fire: ROLE_NAMES.fire,
        ems: ROLE_NAMES.ems,
        civilian: ROLE_NAMES.civilian
      }[interaction.values[0]];

      const selectedRole = getRole(
        interaction.guild,
        selectedName
      );

      const memberRole = getRole(
        interaction.guild,
        ROLE_NAMES.member
      );

      if (selectedRole) {
        await interaction.member.roles.add(selectedRole).catch(() => {});
      }

      if (memberRole) {
        await interaction.member.roles.add(memberRole).catch(() => {});
      }

      return interaction.reply({
        content:
          `✅ Vybral/a sis: ${selectedName}.\n` +
          "Dostal/a jsi také roli Člen.",
        ephemeral: true
      });
    }

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "ticket_select"
    ) {
      return createTicket(
        interaction,
        interaction.values[0]
      );
    }

    if (interaction.isButton()) {
      if (
        interaction.customId === "open_warn" ||
        interaction.customId === "open_ban"
      ) {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: "❌ Na tuto funkci nemáš oprávnění.",
            ephemeral: true
          });
        }

        const isBan = interaction.customId === "open_ban";

        const modal = new ModalBuilder()
          .setCustomId(isBan ? "ban_modal" : "warn_modal")
          .setTitle(isBan ? "🔨 Udělit BAN" : "⚠️ Udělit WARN");

        const robloxName = new TextInputBuilder()
          .setCustomId("roblox_name")
          .setLabel("Roblox jméno hráče")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100);

        const reason = new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("Důvod trestu")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000);

        const duration = new TextInputBuilder()
          .setCustomId("duration")
          .setLabel("Počet dní banu")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder("Např. 3");

        const row1 = new ActionRowBuilder().addComponents(robloxName);
        const row2 = new ActionRowBuilder().addComponents(reason);

        if (isBan) {
          const row3 = new ActionRowBuilder().addComponents(duration);

          modal.addComponents(
            row1,
            row2,
            row3
          );
        } else {
          modal.addComponents(
            row1,
            row2
          );
        }

        return interaction.showModal(modal);
      }

      if (interaction.customId === "close_ticket") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: "❌ Ticket může zavřít pouze administrace.",
            ephemeral: true
          });
        }

        await interaction.reply("🔒 Ticket bude uzavřen...");

        setTimeout(async () => {
          await interaction.channel.delete().catch(() => {});
        }, 3000);

        return;
      }
    }

    if (interaction.isModalSubmit()) {
      if (
        interaction.customId !== "warn_modal" &&
        interaction.customId !== "ban_modal"
      ) {
        return;
      }

      if (!isStaff(interaction.member)) {
        return interaction.reply({
          content: "❌ Na tuto funkci nemáš oprávnění.",
          ephemeral: true
        });
      }

      const robloxName = interaction.fields.getTextInputValue(
        "roblox_name"
      );

      const reason = interaction.fields.getTextInputValue(
        "reason"
      );

      const isBan = interaction.customId === "ban_modal";

      let duration = null;

      if (isBan) {
        duration = interaction.fields.getTextInputValue(
          "duration"
        );

        if (!/^\d+$/.test(duration) || Number(duration) <= 0) {
          return interaction.reply({
            content: "❌ Počet dní musí být kladné celé číslo.",
            ephemeral: true
          });
        }
      }

      const key = `${interaction.guild.id}:${robloxName.toLowerCase()}`;

      if (!punishments.has(key)) {
        punishments.set(key, {
          warns: 0,
          bans: 0
        });
      }

      const data = punishments.get(key);

      if (!isBan) {
        data.warns++;

        const warnLog = interaction.guild.channels.cache.find(
          channel =>
            channel.type === ChannelType.GuildText &&
            channel.name === "⚠️・warn-log"
        );

        const embed = new EmbedBuilder()
          .setTitle("⚠️ NOVÝ WARN")
          .addFields(
            {
              name: "Roblox hráč",
              value: robloxName,
              inline: true
            },
            {
              name: "Uděleno",
              value: interaction.user.toString(),
              inline: true
            },
            {
              name: "Počet Warnů",
              value: String(data.warns),
              inline: true
            },
            {
              name: "Důvod",
              value: reason
            }
          )
          .setColor("#F1C40F")
          .setTimestamp();

        if (warnLog) {
          await warnLog.send({
            embeds: [embed]
          });
        }

        if (data.warns >= 3) {
          const alert = await warnLog?.send({
            content:
              `🚨 **UPOZORNĚNÍ ADMINISTRACI** 🚨\n` +
              `Hráč **${robloxName}** má ${data.warns} Warny.\n` +
              `➡️ Podle pravidel má dostat **BAN NA 3 DNY**.`
          });

          if (alert) {
            setTimeout(() => {
              alert.delete().catch(() => {});
            }, 60000);
          }
        }

        return interaction.reply({
          content:
            `✅ Warn byl zapsán.\n` +
            `👤 ${robloxName}\n` +
            `⚠️ Celkem Warnů: ${data.warns}`,
          ephemeral: true
        });
      }

      data.bans++;

      const banLog = interaction.guild.channels.cache.find(
        channel =>
          channel.type === ChannelType.GuildText &&
          channel.name === "🔨・ban-log"
      );

      const embed = new EmbedBuilder()
        .setTitle("🔨 NOVÝ BAN")
        .addFields(
          {
            name: "Roblox hráč",
            value: robloxName,
            inline: true
          },
          {
            name: "Uděleno",
            value: interaction.user.toString(),
            inline: true
          },
          {
            name: "Délka",
            value: `${duration} dní`,
            inline: true
          },
          {
            name: "Důvod",
            value: reason
          }
        )
        .setColor("#E74C3C")
        .setTimestamp();

      if (banLog) {
        await banLog.send({
          embeds: [embed]
        });
      }

      return interaction.reply({
        content:
          `✅ Ban byl zapsán.\n` +
          `👤 ${robloxName}\n` +
          `🔨 Délka: ${duration} dní`,
        ephemeral: true
      });
    }
  } catch (error) {
    console.error("❌ Interaction error:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Nastala chyba při zpracování požadavku.",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

client.login(TOKEN);

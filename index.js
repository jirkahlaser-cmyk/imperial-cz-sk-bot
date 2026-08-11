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

const createdRoles = {};

async function getOrCreateRole(guild, name, color = null) {
  let role = guild.roles.cache.find(r => r.name === name);

  if (!role) {
    role = await guild.roles.create({
      name,
      color: color || "Default",
      reason: "Imperial CZ/SK server setup"
    });
  }

  createdRoles[name] = role;
  return role;
}

async function getOrCreateCategory(guild, name) {
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

async function getOrCreateText(guild, name, category) {
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

async function getOrCreateVoice(guild, name, category) {
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

function everyoneHidden(guild) {
  return {
    id: guild.roles.everyone.id,
    deny: [PermissionFlagsBits.ViewChannel]
  };
}

function allowText(role) {
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

function allowVoice(role) {
  return {
    id: role.id,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak
    ]
  };
}

async function privateCategory(guild, name, allowedRoles) {
  const category = await getOrCreateCategory(guild, name);

  const overwrites = [
    everyoneHidden(guild),
    {
      id: guild.id,
      allow: []
    }
  ];

  for (const role of allowedRoles) {
    overwrites.push(allowText(role));
  }

  overwrites.push({
    id: guild.ownerId,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak
    ]
  });

  await category.permissionOverwrites.set(overwrites);

  return category;
}

async function privateVoice(guild, channel, allowedRoles) {
  const overwrites = [
    everyoneHidden(guild)
  ];

  for (const role of allowedRoles) {
    overwrites.push(allowVoice(role));
  }

  overwrites.push({
    id: guild.ownerId,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak
    ]
  });

  await channel.permissionOverwrites.set(overwrites);
}

async function setupServer(guild) {
  console.log(`🔧 Spouštím setup: ${guild.name}`);

  const member = await getOrCreateRole(
    guild,
    ROLE_NAMES.member,
    "#5865F2"
  );

  const admin = await getOrCreateRole(
    guild,
    ROLE_NAMES.admin,
    "#E74C3C"
  );

  const moderator = await getOrCreateRole(
    guild,
    ROLE_NAMES.moderator,
    "#F1C40F"
  );

  const management = await getOrCreateRole(
    guild,
    ROLE_NAMES.management,
    "#9B59B6"
  );

  const owner = await getOrCreateRole(
    guild,
    ROLE_NAMES.owner,
    "#FFD700"
  );

  const pd = await getOrCreateRole(
    guild,
    ROLE_NAMES.pd,
    "#3498DB"
  );

  const fire = await getOrCreateRole(
    guild,
    ROLE_NAMES.fire,
    "#E74C3C"
  );

  const ems = await getOrCreateRole(
    guild,
    ROLE_NAMES.ems,
    "#2ECC71"
  );

  const civilian = await getOrCreateRole(
    guild,
    ROLE_NAMES.civilian,
    "#95A5A6"
  );

  const eventRole = await getOrCreateRole(
    guild,
    ROLE_NAMES.event,
    "#2ECC71"
  );

  const announcementRole = await getOrCreateRole(
    guild,
    ROLE_NAMES.announcements,
    "#3498DB"
  );

  const rmRole = await getOrCreateRole(
    guild,
    ROLE_NAMES.rm,
    "#9B59B6"
  );

  const at1 = await getOrCreateRole(guild, ROLE_NAMES.at1);
  const at2 = await getOrCreateRole(guild, ROLE_NAMES.at2);
  const at3 = await getOrCreateRole(guild, ROLE_NAMES.at3);
  const at5 = await getOrCreateRole(guild, ROLE_NAMES.at5);
  const at6 = await getOrCreateRole(guild, ROLE_NAMES.at6);

  const info = await getOrCreateCategory(
    guild,
    "📢・INFORMACE"
  );

  const selection = await getOrCreateCategory(
    guild,
    "🎛️・VÝBĚR"
  );

  const serverCategory = await getOrCreateCategory(
    guild,
    "🗺️・SERVER"
  );

  const tickets = await getOrCreateCategory(
    guild,
    "🎫・TICKETY"
  );

  const adminCategory = await privateCategory(
    guild,
    "🛡️・ADMIN TEAM",
    [admin, moderator, management, owner]
  );

  const adminCalls = await privateCategory(
    guild,
    "📞・ADMIN CALL",
    [admin, moderator, management, owner]
  );

  const managementCategory = await privateCategory(
    guild,
    "👑・VEDENÍ",
    [management, owner]
  );

  const punishmentCategory = await privateCategory(
    guild,
    "⚠️・TRESTY",
    [admin, moderator, management, owner]
  );

  const logsCategory = await privateCategory(
    guild,
    "📋・LOGY",
    [admin, moderator, management, owner]
  );

  const pdCategory = await privateCategory(
    guild,
    "🚔・POLICIE",
    [pd, admin, moderator, management, owner]
  );

  const fireCategory = await privateCategory(
    guild,
    "🚒・HASIČI",
    [fire, admin, moderator, management, owner]
  );

  const emsCategory = await privateCategory(
    guild,
    "🚑・ZÁCHRANÁŘI",
    [ems, admin, moderator, management, owner]
  );

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

  await getOrCreateText(
    guild,
    "🗺️・mapa",
    serverCategory
  );

  await getOrCreateText(
    guild,
    "🏠・domy",
    serverCategory
  );

  const ticketChannel = await getOrCreateText(
    guild,
    "🎫・ticket",
    tickets
  );

  await getOrCreateText(
    guild,
    "💬・admin-chat",
    adminCategory
  );

  await getOrCreateText(
    guild,
    "📜・admin-pravidla",
    adminCategory
  );

  await getOrCreateText(
    guild,
    "📋・admin-log",
    adminCategory
  );

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

  await privateVoice(
    guild,
    managementCall,
    [management, owner]
  );

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

    await privateVoice(
      guild,
      channel,
      [role, admin, moderator, management, owner]
    );
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
    everyoneHidden(guild),
    allowText(pd),
    allowText(admin),
    allowText(moderator),
    allowText(management),
    allowText(owner)
  ]);

  await privateVoice(
    guild,
    pdCall,
    [pd, admin, moderator, management, owner]
  );

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
    everyoneHidden(guild),
    allowText(fire),
    allowText(admin),
    allowText(moderator),
    allowText(management),
    allowText(owner)
  ]);

  await privateVoice(
    guild,
    fireCall,
    [fire, admin, moderator, management, owner]
  );

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
    everyoneHidden(guild),
    allowText(ems),
    allowText(admin),
    allowText(moderator),
    allowText(management),
    allowText(owner)
  ]);

  await privateVoice(
    guild,
    emsCall,
    [ems, admin, moderator, management, owner]
  );

  await getOrCreateText(
    guild,
    "⚠️・zápis-trestů",
    punishmentCategory
  );

  await getOrCreateText(
    guild,
    "⚠️・warn",
    punishmentCategory
  );

  await getOrCreateText(
    guild,
    "🔨・ban",
    punishmentCategory
  );

  await getOrCreateText(
    guild,
    "⚠️・warn-log",
    logsCategory
  );

  await getOrCreateText(
    guild,
    "🔨・ban-log",
    logsCategory
  );

  if (notificationChannel.messages.cache.size === 0) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("notification_select")
      .setPlaceholder("🔔 Vyber oznámení")
      .setMinValues(1)
      .setMaxValues(3)
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Eventy")
          .setDescription("Chci dostávat oznámení o eventech")
          .setValue("event")
          .setEmoji("🎉"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Oznámení")
          .setDescription("Chci dostávat důležitá oznámení")
          .setValue("announcement")
          .setEmoji("📢"),

        new StringSelectMenuOptionBuilder()
          .setLabel("RM Oznámení")
          .setDescription("Chci dostávat RM oznámení")
          .setValue("rm")
          .setEmoji("📣")
      );

    await notificationChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔔 Výběr oznámení")
          .setDescription(
            "Vyber si, jaká oznámení chceš dostávat.\n\n" +
            "Můžeš si vybrat jednu nebo více možností."
          )
          .setColor("#5865F2")
      ],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  if (factionChannel.messages.cache.size === 0) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("faction_select")
      .setPlaceholder("🎖️ Vyber jednu složku")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Policie")
          .setDescription("Přístup do soukromé sekce Policie")
          .setValue("pd")
          .setEmoji("🚔"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Hasiči")
          .setDescription("Přístup do soukromé sekce Hasičů")
          .setValue("fire")
          .setEmoji("🚒"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Záchranáři")
          .setDescription("Přístup do soukromé sekce Záchranářů")
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
            "Vyber si **JEDNU** složku.\n\n" +
            "🚔 Policie\n" +
            "🚒 Hasiči\n" +
            "🚑 Záchranáři\n" +
            "👤 Civilista\n\n" +
            "Po změně volby ti bot automaticky odebere předchozí složku."
          )
          .setColor("#5865F2")
      ],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  if (ticketChannel.messages.cache.size === 0) {
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
          .setDescription("Záležitost týkající se mafie")
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

client.once("ready", async () => {
  console.log(`✅ Bot online: ${client.user.tag}`);

  try {
    for (const guild of client.guilds.cache.values()) {
      const command = new SlashCommandBuilder()
        .setName("setup")
        .setDescription(
          "Vytvoří kompletní Imperial CZ/SK server."
        );

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

      console.log(
        `✅ /setup registrován na: ${guild.name}`
      );
    }
  } catch (error) {
    console.error("❌ Chyba registrace příkazu:");
    console.error(error);
  }
});

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "setup") {

        if (interaction.guild.ownerId !== interaction.user.id) {
          return interaction.reply({
            content:
              "❌ /setup může použít pouze majitel serveru.",
            ephemeral: true
          });
        }

        await interaction.deferReply({
          ephemeral: true
        });

        await setupServer(interaction.guild);

        return interaction.editReply(
          "✅ Kompletní Imperial CZ/SK server byl vytvořen."
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
        const role = interaction.guild.roles.cache.find(
          r => r.name === roleName
        );

        if (
          role &&
          interaction.member.roles.cache.has(role.id)
        ) {
          await interaction.member.roles.remove(role)
            .catch(() => {});
        }
      }

      for (const value of interaction.values) {
        const role = interaction.guild.roles.cache.find(
          r => r.name === roleMap[value]
        );

        if (role) {
          await interaction.member.roles.add(role)
            .catch(() => {});
        }
      }

      return interaction.reply({
        content:
          "✅ Nastavení oznámení bylo uloženo.",
        ephemeral: true
      });
    }

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "faction_select"
    ) {

      const factionRoles = [
        ROLE_NAMES.pd,
        ROLE_NAMES.fire,
        ROLE_NAMES.ems,
        ROLE_NAMES.civilian
      ];

      for (const roleName of factionRoles) {
        const role = interaction.guild.roles.cache.find(
          r => r.name === roleName
        );

        if (
          role &&
          interaction.member.roles.cache.has(role.id)
        ) {
          await interaction.member.roles.remove(role)
            .catch(() => {});
        }
      }

      const selectedNames = {
        pd: ROLE_NAMES.pd,
        fire: ROLE_NAMES.fire,
        ems: ROLE_NAMES.ems,
        civilian: ROLE_NAMES.civilian
      };

      const selectedRole =
        interaction.guild.roles.cache.find(
          r =>
            r.name ===
            selectedNames[interaction.values[0]]
        );

      const memberRole =
        interaction.guild.roles.cache.find(
          r => r.name === ROLE_NAMES.member
        );

      if (selectedRole) {
        await interaction.member.roles.add(selectedRole)
          .catch(() => {});
      }

      if (memberRole) {
        await interaction.member.roles.add(memberRole)
          .catch(() => {});
      }

      return interaction.reply({
        content:
          `✅ Vybral/a sis: ${selectedRole ? selectedRole.name : "Civilista"}.\n` +
          "Dostal/a jsi také roli Člen.",
        ephemeral: true
      });
    }

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "ticket_select"
    ) {

      return interaction.reply({
        content:
          "🎫 Výběr ticketu byl zaznamenán. " +
          "Automatické vytváření jednotlivých ticket místností doplníme v další části.",
        ephemeral: true
      });
    }

  } catch (error) {
    console.error("❌ Interaction error:");
    console.error(error);

    if (
      !interaction.replied &&
      !interaction.deferred
    ) {
      await interaction.reply({
        content:
          "❌ Nastala chyba při zpracování požadavku.",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

client.login(TOKEN);

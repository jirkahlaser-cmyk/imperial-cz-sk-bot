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
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// =====================================================
// CONFIG
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

const dataFile = path.join(__dirname, "imperial-data.json");

let data = {
  staff: {},
  warnings: {},
  raid: {},
  tickets: {}
};

function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    }
  } catch (error) {
    console.error("❌ Chyba při načítání dat:", error);
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
// COLORS
// =====================================================

const COLORS = {
  imperial: 0x5865f2,
  success: 0x57f287,
  danger: 0xed4245,
  warning: 0xfee75c,
  gold: 0xffd700,
  staff: 0x9b59b6,
  police: 0x3498db,
  fire: 0xe74c3c,
  medic: 0x2ecc71,
  criminal: 0x111111
};

// =====================================================
// ROLES
// =====================================================

const ROLES = [
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

  ["🔫 Velitel kriminálky", 0x111111],
  ["🕵️ Kriminálník", 0x2c2c2c],

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
// HELPERS
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

function hasAdmin(member) {
  return member.permissions.has(
    PermissionFlagsBits.Administrator
  );
}

async function createRole(guild, name, color) {
  let role = guild.roles.cache.find(
    r => r.name === name
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

async function createCategory(
  guild,
  name,
  permissions
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
      permissionOverwrites: permissions
    });
  } else if (permissions) {
    await category.permissionOverwrites.set(
      permissions
    );
  }

  return category;
}

async function createChannel(
  guild,
  name,
  parent,
  permissions
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
      permissionOverwrites: permissions
    });
  } else {
    if (channel.parentId !== parent.id) {
      await channel.setParent(parent.id);
    }

    if (permissions) {
      await channel.permissionOverwrites.set(
        permissions
      );
    }
  }

  return channel;
}

async function sendOnce(channel, message) {
  const messages = await channel.messages.fetch({
    limit: 20
  });

  const existing = messages.find(
    m => m.author.id === client.user.id
  );

  if (!existing) {
    await channel.send(message);
  }
}

// =====================================================
// PERMISSIONS
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

  for (const name of STAFF_ROLES) {
    const role = guild.roles.cache.find(
      r => r.name === name
    );

    if (role) {
      permissions.push({
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

  for (const name of MANAGEMENT_ROLES) {
    const role = guild.roles.cache.find(
      r => r.name === name
    );

    if (role) {
      permissions.push({
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

  return permissions;
}

// =====================================================
// EMBEDS
// =====================================================

function welcomeEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.imperial)
    .setTitle("🏛️ IMPERIAL CZ/SK RP")
    .setDescription(
      "Vítej na oficiálním Discord serveru Imperial CZ/SK RP!\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n\n" +
      "🎭 **REALISTICKÉ ROLEPLAY**\n" +
      "Naším cílem je vytvořit prostředí, kde má každá RP situace svůj smysl.\n\n" +
      "🚓 **PROPRACOVANÉ FRAKCE**\n" +
      "Policie, hasiči, záchranáři i kriminální svět.\n\n" +
      "🎉 **PRAVIDELNÉ EVENTY**\n" +
      "Organizované akce, závody, zásahy a speciální scénáře.\n\n" +
      "🛡️ **AKTIVNÍ STAFF**\n" +
      "Staff tým řeší reporty, podporu a dohled nad komunitou.\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n\n" +
      "💙 Užij si hru a staň se součástí Imperial CZ/SK RP!"
    )
    .setFooter({
      text: "Imperial CZ/SK RP • Tvoje RP, tvoje příběhy."
    });
}

function rulesEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.warning)
    .setTitle("📜 PRAVIDLA IMPERIAL CZ/SK RP")
    .setDescription(
      "**🎭 ROLEPLAY**\n" +
      "RP musí být realistické a odpovídat situaci.\n\n" +

      "🔹 **FailRP** – nereálné nebo nesmyslné jednání.\n" +
      "🔹 **RDM** – útok nebo zabití bez RP důvodu.\n" +
      "🔹 **VDM** – použití vozidla jako zbraně bez důvodu.\n" +
      "🔹 **NLR** – návrat do situace po smrti.\n" +
      "🔹 **Metagaming** – používání informací mimo RP.\n" +
      "🔹 **Powergaming** – nucení nereálných akcí ostatním.\n" +
      "🔹 **FearRP** – přiměřená reakce na ohrožení života.\n" +
      "🔹 **Combat Logging** – odpojení během RP situace.\n\n" +

      "━━━━━━━━━━━━━━━━━━━━\n\n" +

      "**💬 DISCORD**\n" +
      "• Respektuj ostatní členy.\n" +
      "• Zákaz spamu a floodu.\n" +
      "• Zákaz nevyžádané reklamy.\n" +
      "• Zákaz vydávání se za staff.\n" +
      "• Nezveřejňuj osobní údaje.\n" +
      "• Dodržuj pravidla Discordu.\n\n" +

      "━━━━━━━━━━━━━━━━━━━━\n\n" +

      "⚠️ Porušení pravidel může vést k warnu, timeoutu, kicku nebo banu."
    );
}

function recruitmentEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.staff)
    .setTitle("👮 NÁBOR DO STAFF TÝMU")
    .setDescription(
      "Chceš se stát součástí Imperial CZ/SK RP staff týmu?\n\n" +
      "━━━━━━━━━━━━━━━━━━━━\n\n" +
      "### 📋 CO OČEKÁVÁME\n" +
      "• Aktivitu\n" +
      "• Slušné vystupování\n" +
      "• Znalost RP pravidel\n" +
      "• Nestrannost\n" +
      "• Schopnost řešit konflikty\n" +
      "• Ochotu pomáhat hráčům\n\n" +

      "### 📝 JAK PROBÍHÁ NÁBOR\n" +
      "1️⃣ Odešleš přihlášku.\n" +
      "2️⃣ Staff ji zkontroluje.\n" +
      "3️⃣ Proběhne pohovor.\n" +
      "4️⃣ Může následovat zkušební období.\n" +
      "5️⃣ Vedení rozhodne o přijetí.\n\n" +

      "━━━━━━━━━━━━━━━━━━━━\n\n" +
      "🟡 **Přihláška čeká na vyřízení**\n" +
      "🟢 **Přijato**\n" +
      "🔴 **Zamítnuto**"
    )
    .setFooter({
      text: "Imperial CZ/SK • Nábor"
    });
}

function ticketEmbed() {
  return new EmbedBuilder()
    .setColor(COLORS.imperial)
    .setTitle("🎫 IMPERIAL TICKET SYSTEM")
    .setDescription(
      "Potřebuješ pomoc? Vyber kategorii níže.\n\n" +
      "🛠️ **Podpora**\n" +
      "Obecné otázky a pomoc.\n\n" +
      "🚨 **Report**\n" +
      "Nahlášení hráče nebo situace.\n\n" +
      "🏠 **Pozemek**\n" +
      "Žádost o RP pozemek.\n\n" +
      "🏢 **Podnik**\n" +
      "Žádost o RP podnik.\n\n" +
      "👮 **Nábor**\n" +
      "Přihláška do staff týmu.\n\n" +
      "🔓 **Unban**\n" +
      "Žádost o přezkoumání banu.\n\n" +
      "🤝 **Partnerství**\n" +
      "Partnerská spolupráce."
    )
    .setFooter({
      text: "Imperial CZ/SK • Support System"
    });
}

// =====================================================
// SETUP
// =====================================================

const setupCommand = new SlashCommandBuilder()
  .setName("setup")
  .setDescription(
    "Nastaví kompletní Imperial CZ/SK RP server."
  )
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Administrator
  );

const raidCommand = new SlashCommandBuilder()
  .setName("raid")
  .setDescription("Správa raid ochrany.")
  .addSubcommand(sub =>
    sub
      .setName("lock")
      .setDescription("Manuálně uzamkne server.")
  )
  .addSubcommand(sub =>
    sub
      .setName("unlock")
      .setDescription("Odemkne server.")
  )
  .addSubcommand(sub =>
    sub
      .setName("status")
      .setDescription("Zobrazí stav raid ochrany.")
  );

// =====================================================
// READY
// =====================================================

client.once("clientReady", async () => {
  console.log(
    `✅ Imperial bot online jako ${client.user.tag}`
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
            setupCommand.toJSON(),
            raidCommand.toJSON()
          ]
        }
      );

      console.log(
        `✅ Commandy registrovány: ${guild.name}`
      );
    } catch (error) {
      console.error(
        "❌ Command registration:",
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

  if (!hasAdmin(interaction.member)) {
    return interaction.reply({
      content: "❌ Tento příkaz může použít pouze administrátor.",
      ephemeral: true
    });
  }

  await interaction.deferReply({
    ephemeral: true
  });

  try {
    const guild = interaction.guild;

    // ROLE
    for (const [name, color] of ROLES) {
      await createRole(guild, name, color);
    }

    const staffPerms = staffPermissions(guild);
    const managementPerms =
      managementPermissions(guild);

    // INFORMACE
    const info = await createCategory(
      guild,
      "📌 INFORMACE"
    );

    const welcome = await createChannel(
      guild,
      "👋・vítej",
      info
    );

    const rules = await createChannel(
      guild,
      "📜・pravidla",
      info
    );

    const recruitment = await createChannel(
      guild,
      "👮・nábor",
      info
    );

    const announcements = await createChannel(
      guild,
      "📢・oznámení",
      info
    );

    // KOMUNITA
    const community = await createCategory(
      guild,
      "💬 KOMUNITA"
    );

    const chat = await createChannel(
      guild,
      "💬・chat",
      community
    );

    const events = await createChannel(
      guild,
      "🎉・eventy",
      community
    );

    // HRA
    const game = await createCategory(
      guild,
      "🎮 ROLEPLAY"
    );

    await createChannel(
      guild,
      "🚓・policie",
      game
    );

    await createChannel(
      guild,
      "🚒・hasiči",
      game
    );

    await createChannel(
      guild,
      "🚑・záchranáři",
      game
    );

    await createChannel(
      guild,
      "🔫・kriminální-rp",
      game
    );

    await createChannel(
      guild,
      "🏠・pozemky",
      game
    );

    await createChannel(
      guild,
      "🏢・podniky",
      game
    );

    await createChannel(
      guild,
      "💰・ekonomika",
      game
    );

    // TICKETY
    const ticketCategory =
      await createCategory(
        guild,
        "🎫 TICKETY"
      );

    const ticketPanel =
      await createChannel(
        guild,
        "🎫・vytvořit-ticket",
        ticketCategory
      );

    // STAFF
    const staffCategory =
      await createCategory(
        guild,
        "🛡️ STAFF",
        staffPerms
      );

    const staffChat =
      await createChannel(
        guild,
        "🛡️・staff-chat",
        staffCategory,
        staffPerms
      );

    const staffLogs =
      await createChannel(
        guild,
        "📊・staff-log",
        staffCategory,
        staffPerms
      );

    const staffShifts =
      await createChannel(
        guild,
        "⏱️・staff-směny",
        staffCategory,
        staffPerms
      );

    const leaderboard =
      await createChannel(
        guild,
        "🏆・staff-leaderboard",
        staffCategory,
        staffPerms
      );

    const staffReports =
      await createChannel(
        guild,
        "🚨・staff-reporty",
        staffCategory,
        staffPerms
      );

    // VEDENÍ
    const management =
      await createCategory(
        guild,
        "👑 VEDENÍ",
        managementPerms
      );

    await createChannel(
      guild,
      "👑・vedení",
      management,
      managementPerms
    );

    await createChannel(
      guild,
      "📋・porady-vedení",
      management,
      managementPerms
    );

    // SEND EMBEDS

    await sendOnce(
      welcome,
      { embeds: [welcomeEmbed()] }
    );

    await sendOnce(
      rules,
      { embeds: [rulesEmbed()] }
    );

    const recruitmentButtons =
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("apply_staff")
          .setLabel("📝 Podat přihlášku")
          .setStyle(ButtonStyle.Primary)
      );

    await sendOnce(
      recruitment,
      {
        embeds: [recruitmentEmbed()],
        components: [recruitmentButtons]
      }
    );

    await sendOnce(
      announcements,
      {
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.imperial)
            .setTitle("📢 OZNÁMENÍ")
            .setDescription(
              "Zde budou zveřejňována důležitá oznámení Imperial CZ/SK RP."
            )
        ]
      }
    );

    await sendOnce(
      chat,
      {
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.success)
            .setTitle("💬 KOMUNITNÍ CHAT")
            .setDescription(
              "Vítej v komunitě Imperial CZ/SK RP!\n\n" +
              "Bav se, seznamuj se a hlavně respektuj ostatní."
            )
        ]
      }
    );

    const ticketButtons =
      new ActionRowBuilder().addComponents(
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

    const ticketButtons2 =
      new ActionRowBuilder().addComponents(
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

    await sendOnce(
      ticketPanel,
      {
        embeds: [ticketEmbed()],
        components: [
          ticketButtons,
          ticketButtons2
        ]
      }
    );

    await sendOnce(
      staffChat,
      {
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.staff)
            .setTitle("🛡️ STAFF CHAT")
            .setDescription(
              "Interní komunikace staff týmu."
            )
        ]
      }
    );

    await sendOnce(
      staffReports,
      {
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.danger)
            .setTitle("🚨 STAFF REPORTY")
            .setDescription(
              "**👤 Hráč:**\n" +
              "**🕐 Datum:**\n" +
              "**📝 Popis:**\n" +
              "**📸 Důkazy:**\n" +
              "**⚖️ Výsledek:**"
            )
        ]
      }
    );

    await sendOnce(
      staffShifts,
      {
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.staff)
            .setTitle("⏱️ STAFF SMĚNY")
            .setDescription(
              "`!startshift` — zahájit směnu\n" +
              "`!endshift` — ukončit směnu\n" +
              "`!shift` — aktuální směna\n" +
              "`!myhours` — celkový čas\n" +
              "`!leaderboard` — leaderboard"
            )
        ]
      }
    );

    await sendOnce(
      leaderboard,
      {
        embeds: [
          new EmbedBuilder()
            .setColor(COLORS.gold)
            .setTitle("🏆 STAFF LEADERBOARD")
            .setDescription(
              "Zatím nejsou zaznamenány žádné směny."
            )
        ]
      }
    );

    await interaction.editReply(
      "✅ **IMPERIAL CZ/SK RP BYL NASTAVEN!**\n\n" +
      "🎨 Vizuální systém → HOTOVO\n" +
      "📋 Nábor → HOTOVO\n" +
      "🎫 Tickety → HOTOVO\n" +
      "🛡️ Staff → HOTOVO\n" +
      "👮 Frakce → HOTOVO\n" +
      "🏆 Leaderboard → HOTOVO\n" +
      "🚨 Raid Protection → AKTIVNÍ"
    );

  } catch (error) {
    console.error(
      "❌ SETUP ERROR:",
      error
    );

    await interaction.editReply(
      "❌ Setup se nepodařilo dokončit.\n" +
      "Podívej se do Railway Logs."
    );
  }
});

// =====================================================
// APPLICATION MODAL
// =====================================================

client.on("interactionCreate", async interaction => {
  if (
    !interaction.isButton() ||
    interaction.customId !== "apply_staff"
  ) {
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId("staff_application")
    .setTitle("👮 Staff přihláška");

  const age = new TextInputBuilder()
    .setCustomId("age")
    .setLabel("Kolik ti je?")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(3);

  const experience = new TextInputBuilder()
    .setCustomId("experience")
    .setLabel("Jaké máš zkušenosti?")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(500);

  const reason = new TextInputBuilder()
    .setCustomId("reason")
    .setLabel("Proč chceš být staff?")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(700);

  const activity = new TextInputBuilder()
    .setCustomId("activity")
    .setLabel("Kolik času můžeš věnovat serveru?")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(200);

  modal.addComponents(
    new ActionRowBuilder().addComponents(age),
    new ActionRowBuilder().addComponents(experience),
    new ActionRowBuilder().addComponents(reason),
    new ActionRowBuilder().addComponents(activity)
  );

  await interaction.showModal(modal);
});

// =====================================================
// APPLICATION RESULT
// =====================================================

client.on("interactionCreate", async interaction => {
  if (
    !interaction.isModalSubmit() ||
    interaction.customId !== "staff_application"
  ) {
    return;
  }

  const guild = interaction.guild;

  const staffCategory =
    guild.channels.cache.find(
      c =>
        c.type === ChannelType.GuildCategory &&
        c.name === "🛡️ STAFF"
    );

  if (!staffCategory) {
    return interaction.reply({
      content:
        "❌ Staff systém ještě není nastaven. Použij `/setup`.",
      ephemeral: true
    });
  }

  const channelName =
    `nábor-${interaction.user.id}`;

  const existing =
    guild.channels.cache.find(
      c => c.name === channelName
    );

  if (existing) {
    return interaction.reply({
      content:
        `❌ Už máš otevřenou přihlášku: ${existing}`,
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
        PermissionsBitField.Flags.ReadMessageHistory
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
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      });
    }
  }

  const channel =
    await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: staffCategory.id,
      permissionOverwrites: overwrites
    });

  const embed =
    new EmbedBuilder()
      .setColor(COLORS.staff)
      .setTitle("👮 NOVÁ STAFF PŘIHLÁŠKA")
      .setDescription(
        `👤 **Uchazeč:** ${interaction.user}\n\n` +
        `🎂 **Věk:** ${interaction.fields.getTextInputValue("age")}\n\n` +
        `🛠️ **Zkušenosti:**\n${interaction.fields.getTextInputValue("experience")}\n\n` +
        `🎯 **Proč chce být staff:**\n${interaction.fields.getTextInputValue("reason")}\n\n` +
        `⏱️ **Aktivita:**\n${interaction.fields.getTextInputValue("activity")}\n\n` +
        "━━━━━━━━━━━━━━━━━━━━\n" +
        "🟡 **STAV: ČEKÁ NA VYŘÍZENÍ**"
      )
      .setFooter({
        text: "Imperial CZ/SK • Staff Recruitment"
      });

  const buttons =
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("application_accept")
        .setLabel("🟢 Přijmout")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("application_reject")
        .setLabel("🔴 Zamítnout")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("application_close")
        .setLabel("🔒 Zavřít")
        .setStyle(ButtonStyle.Secondary)
    );

  await channel.send({
    content: getStaffMentions(guild),
    embeds: [embed],
    components: [buttons]
  });

  await interaction.reply({
    content:
      `✅ Přihláška byla vytvořena: ${channel}`,
    ephemeral: true
  });
});

// =====================================================
// TICKET SYSTEM
// =====================================================

const TICKET_TYPES = {
  ticket_support: ["podpora", "🛠️ Podpora"],
  ticket_report: ["report", "🚨 Report"],
  ticket_property: ["pozemek", "🏠 Pozemek"],
  ticket_business: ["podnik", "🏢 Podnik"],
  ticket_recruitment: ["nabor", "👮 Nábor"],
  ticket_unban: ["unban", "🔓 Unban"],
  ticket_partner: ["partnerstvi", "🤝 Partnerství"]
};

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const type =
    TICKET_TYPES[interaction.customId];

  if (!type) return;

  const guild = interaction.guild;

  const category =
    guild.channels.cache.find(
      c =>
        c.type === ChannelType.GuildCategory &&
        c.name === "🎫 TICKETY"
    );

  if (!category) {
    return interaction.reply({
      content:
        "❌ Ticket systém není nastaven. Použij `/setup`.",
      ephemeral: true
    });
  }

  const name =
    `${type[0]}-${interaction.user.id}`;

  const existing =
    guild.channels.cache.find(
      c => c.name === name
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
      name,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: overwrites
    });

  const embed =
    new EmbedBuilder()
      .setColor(COLORS.imperial)
      .setTitle(type[1])
      .setDescription(
        "━━━━━━━━━━━━━━━━━━━━\n\n" +
        `👤 **Autor:** ${interaction.user}\n\n` +
        "📝 Popiš svůj problém co nejpodrobněji.\n" +
        "📸 Přilož důkazy, pokud je máš.\n\n" +
        "🛡️ Staff ticket převezme.\n" +
        "👑 V případě potřeby bude předán vedení.\n\n" +
        "━━━━━━━━━━━━━━━━━━━━"
      )
      .setFooter({
        text: "Imperial CZ/SK • Ticket System"
      });

  const buttons =
    new ActionRowBuilder().addComponents(
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
  if (!interaction.isButton()) return;

  if (
    ![
      "ticket_claim",
      "ticket_management",
      "ticket_close",
      "application_accept",
      "application_reject",
      "application_close"
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
    return interaction.reply({
      content:
        `🛡️ Ticket převzal ${interaction.user}.`
    });
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

    return interaction.reply({
      content:
        "👑 **Ticket byl předán vedení.**"
    });
  }

  if (
    interaction.customId === "ticket_close" ||
    interaction.customId === "application_close"
  ) {
    await interaction.reply(
      "🔒 Tento kanál bude uzavřen za 5 sekund."
    );

    setTimeout(async () => {
      try {
        await interaction.channel.delete(
          "Imperial ticket uzavřen"
        );
      } catch {}
    }, 5000);

    return;
  }

  if (
    interaction.customId === "application_accept"
  ) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.success)
          .setTitle("🟢 PŘIHLÁŠKA PŘIJATA")
          .setDescription(
            `Přihlášku vyřídil ${interaction.user}.\n\n` +
            "Uchazeč byl přijat do další fáze náboru."
          )
      ]
    });
  }

  if (
    interaction.customId === "application_reject"
  ) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.danger)
          .setTitle("🔴 PŘIHLÁŠKA ZAMÍTNUTA")
          .setDescription(
            `Přihlášku vyřídil ${interaction.user}.`
          )
      ]
    });
  }
});

// =====================================================
// STAFF SHIFTS
// =====================================================

function formatTime(seconds) {
  seconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const h = Math.floor(
    seconds / 3600
  );

  const m = Math.floor(
    (seconds % 3600) / 60
  );

  const s = seconds % 60;

  return `${h} h ${m} min ${s} s`;
}

function getStaff(user) {
  if (!data.staff[user.id]) {
    data.staff[user.id] = {
      username: user.username,
      totalSeconds: 0,
      activeSince: null
    };
  }

  data.staff[user.id].username =
    user.username;

  return data.staff[user.id];
}

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

  if (
    ![
      "!startshift",
      "!endshift",
      "!shift",
      "!myhours",
      "!leaderboard"
    ].includes(command)
  ) {
    return;
  }

  if (!isStaff(message.member)) {
    return message.reply(
      "❌ Tento příkaz je pouze pro staff."
    );
  }

  const user =
    getStaff(message.author);

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

    return message.reply(
      "🟢 **STAFF SMĚNA ZAHÁJENA**\n\n" +
      `👤 ${message.author}\n` +
      "⏱️ Čas se nyní počítá."
    );
  }

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

    user.activeSince = null;

    saveData();

    return message.reply(
      "🔴 **STAFF SMĚNA UKONČENA**\n\n" +
      `⏱️ Směna: **${formatTime(seconds)}**\n` +
      `🏆 Celkem: **${formatTime(user.totalSeconds)}**`
    );
  }

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

  if (
    command === "!leaderboard"
  ) {
    const users =
      Object.values(data.staff)
        .sort(
          (a, b) =>
            b.totalSeconds -
            a.totalSeconds
        )
        .slice(0, 10);

    let text =
      "🏆 **STAFF LEADERBOARD**\n\n";

    if (!users.length) {
      text +=
        "Zatím nejsou žádné směny.";
    }

    users.forEach(
      (u, i) => {
        const medals = [
          "🥇",
          "🥈",
          "🥉"
        ];

        text +=
          `${medals[i] || `${i + 1}.`} **${u.username}** — ${formatTime(u.totalSeconds)}\n`;
      }
    );

    return message.reply(text);
  }
});

// =====================================================
// RAID PROTECTION
// =====================================================

const raidConfig = {
  joinWindow: 30,
  joinLimit: 8,
  accountAgeDays: 3
};

const joinTracker = new Map();

async function lockServer(guild) {
  if (data.raid[guild.id]?.locked) {
    return;
  }

  if (!data.raid[guild.id]) {
    data.raid[guild.id] = {};
  }

  data.raid[guild.id].locked = true;

  const channels =
    guild.channels.cache.filter(
      c =>
        c.type === ChannelType.GuildText ||
        c.type === ChannelType.GuildAnnouncement
    );

  for (const channel of channels.values()) {
    try {
      await channel.permissionOverwrites.edit(
        guild.roles.everyone,
        {
          SendMessages: false,
          AddReactions: false,
          CreatePublicThreads: false,
          CreatePrivateThreads: false
        }
      );
    } catch {}
  }

  saveData();

  const log =
    guild.channels.cache.find(
      c =>
        c.name ===
        "📊・staff-log"
    );

  if (log) {
    await log.send({
      embeds: [
        new EmbedBuilder()
          .setColor(COLORS.danger)
          .setTitle(
            "🚨 RAID PROTECTION AKTIVOVÁNA"
          )
          .setDescription(
            "Server byl automaticky uzamčen.\n\n" +
            "🔒 Veřejné kanály\n" +
            "🔒 STAFF kanály\n" +
            "🔒 Ostatní textové kanály\n\n" +
            "🛡️ Probíhá bezpečnostní kontrola."
          )
      ]
    });
  }

  console.log(
    `🚨 RAID LOCK: ${guild.name}`
  );
}

async function unlockServer(guild) {
  if (!data.raid[guild.id]?.locked) {
    return;
  }

  data.raid[guild.id].locked =
    false;

  const channels =
    guild.channels.cache.filter(
      c =>
        c.type === ChannelType.GuildText ||
        c.type === ChannelType.GuildAnnouncement
    );

  for (const channel of channels.values()) {
    try {
      await channel.permissionOverwrites.edit(
        guild.roles.everyone,
        {
          SendMessages: true,
          AddReactions: true,
          CreatePublicThreads: true,
          CreatePrivateThreads: true
        }
      );
    } catch {}
  }

  saveData();

  console.log(
    `🔓 RAID UNLOCK: ${guild.name}`
  );
}

client.on(
  "guildMemberAdd",
  async member => {
    const guild =
      member.guild;

    const now =
      Date.now();

    if (!joinTracker.has(guild.id)) {
      joinTracker.set(
        guild.id,
        []
      );
    }

    const joins =
      joinTracker.get(guild.id);

    joins.push({
      time: now,
      user: member.user.id
    });

    const recent =
      joins.filter(
        x =>
          now - x.time <
          raidConfig.joinWindow * 1000
      );

    joinTracker.set(
      guild.id,
      recent
    );

    const accountAge =
      now -
      member.user.createdTimestamp;

    const accountAgeDays =
      accountAge /
      86400000;

    if (
      recent.length >=
        raidConfig.joinLimit ||
      accountAgeDays <
        raidConfig.accountAgeDays
    ) {
      await lockServer(guild);
    }
  }
);

// =====================================================
// RAID COMMAND
// =====================================================

client.on("interactionCreate", async interaction => {
  if (
    !interaction.isChatInputCommand() ||
    interaction.commandName !== "raid"
  ) {
    return;
  }

  if (!hasAdmin(interaction.member)) {
    return interaction.reply({
      content:
        "❌ Pouze administrátor.",
      ephemeral: true
    });
  }

  const sub =
    interaction.options.getSubcommand();

  if (sub === "lock") {
    await lockServer(
      interaction.guild
    );

    return interaction.reply({
      content:
        "🔒 **Server byl uzamčen.**",
      ephemeral: true
    });
  }

  if (sub === "unlock") {
    await unlockServer(
      interaction.guild
    );

    return interaction.reply({
      content:
        "🔓 **Server byl odemčen.**",
      ephemeral: true
    });
  }

  if (sub === "status") {
    const locked =
      data.raid[
        interaction.guild.id
      ]?.locked;

    return interaction.reply({
      content:
        locked
          ? "🔴 Raid ochrana je **AKTIVNÍ**."
          : "🟢 Raid ochrana je **NEAKTIVNÍ**.",
      ephemeral: true
    });
  }
});

// =====================================================
// JOIN / LEAVE LOG
// =====================================================

client.on(
  "guildMemberRemove",
  async member => {
    const channel =
      member.guild.channels.cache.find(
        c =>
          c.name ===
          "📊・staff-log"
      );

    if (channel) {
      await channel.send(
        `📤 **ČLEN ODEŠEL**\n👤 ${member.user.tag}`
      );
    }
  }
);

// =====================================================
// STAFF MENTIONS
// =====================================================

function getStaffMentions(guild) {
  return STAFF_ROLES
    .map(name =>
      guild.roles.cache.find(
        r => r.name === name
      )
    )
    .filter(Boolean)
    .map(
      role => `<@&${role.id}>`
    )
    .join(" ");
}

// =====================================================
// AUTO SAVE
// =====================================================

setInterval(() => {
  saveData();
}, 30000);

// =====================================================
// LOGIN
// =====================================================

client.login(TOKEN);

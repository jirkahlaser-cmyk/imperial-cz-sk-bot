const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  ChannelType,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionsBitField
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.DISCORD_TOKEN;

const setupCommand = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Vytvoří strukturu serveru Imperial CZ/SK.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

client.once("ready", async () => {
  console.log(`✅ ${client.user.tag} je online!`);

  for (const guild of client.guilds.cache.values()) {
    try {
      const rest = new REST({ version: "10" }).setToken(TOKEN);

      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guild.id),
        {
          body: [setupCommand.toJSON()]
        }
      );

      console.log(`✅ /setup připraven pro ${guild.name}`);
    } catch (error) {
      console.error("❌ Registrace příkazu selhala:", error);
    }
  }
});

async function getOrCreateRole(guild, name, color) {
  let role = guild.roles.cache.find(r => r.name === name);

  if (!role) {
    role = await guild.roles.create({
      name,
      color,
      reason: "Imperial CZ/SK setup"
    });
  }

  return role;
}

async function getOrCreateCategory(guild, name, overwrites = []) {
  let category = guild.channels.cache.find(
    c =>
      c.type === ChannelType.GuildCategory &&
      c.name === name
  );

  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      permissionOverwrites: overwrites
    });
  }

  return category;
}

async function getOrCreateTextChannel(guild, name, parent, overwrites = []) {
  let channel = guild.channels.cache.find(
    c =>
      c.type === ChannelType.GuildText &&
      c.name === name &&
      c.parentId === parent.id
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: parent.id,
      permissionOverwrites: overwrites
    });
  }

  return channel;
}

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "setup") return;

  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: "❌ Tento příkaz může použít pouze administrátor.",
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const guild = interaction.guild;

    /*
     * =========================
     * ROLE
     * =========================
     */

    const owner = await getOrCreateRole(guild, "👑 Majitel", "FF0000");
    const coOwner = await getOrCreateRole(guild, "💎 Spolumajitel", "FF00FF");
    const founder = await getOrCreateRole(guild, "🏆 Zakladatel", "FFD700");

    const projectDirector = await getOrCreateRole(
      guild,
      "🧠 Ředitel projektu",
      "9B59B6"
    );

    const projectLead = await getOrCreateRole(
      guild,
      "📋 Vedoucí projektu",
      "3498DB"
    );

    const mediaLead = await getOrCreateRole(
      guild,
      "📱 Vedoucí médií",
      "E91E63"
    );

    const eventLead = await getOrCreateRole(
      guild,
      "🎉 Vedoucí eventů",
      "F1C40F"
    );

    const partnershipLead = await getOrCreateRole(
      guild,
      "🤝 Vedoucí partnerství",
      "1ABC9C"
    );

    const recruitmentLead = await getOrCreateRole(
      guild,
      "👥 Vedoucí náboru",
      "2ECC71"
    );

    const developer = await getOrCreateRole(
      guild,
      "⚙️ Vývojář",
      "95A5A6"
    );

    const headAdmin = await getOrCreateRole(
      guild,
      "👑 Hlavní administrátor",
      "C0392B"
    );

    const seniorAdmin = await getOrCreateRole(
      guild,
      "🔴 Senior administrátor",
      "E74C3C"
    );

    const admin = await getOrCreateRole(
      guild,
      "🟠 Administrátor",
      "E67E22"
    );

    const juniorAdmin = await getOrCreateRole(
      guild,
      "🟡 Junior administrátor",
      "F1C40F"
    );

    const trialAdmin = await getOrCreateRole(
      guild,
      "⚪ Zkušební administrátor",
      "7F8C8D"
    );

    const eventTeam = await getOrCreateRole(
      guild,
      "⭐ Event tým",
      "9B59B6"
    );

    const supporter = await getOrCreateRole(
      guild,
      "💎 Podporovatel",
      "00FFFF"
    );

    const vip = await getOrCreateRole(
      guild,
      "🏆 VIP",
      "FFD700"
    );

    const memberRole = await getOrCreateRole(
      guild,
      "🎮 Člen",
      "5865F2"
    );

    /*
     * =========================
     * ROLE SKUPINY
     * =========================
     */

    const managementRoles = [
      owner.id,
      coOwner.id,
      founder.id,
      projectDirector.id,
      projectLead.id,
      mediaLead.id,
      eventLead.id,
      partnershipLead.id,
      recruitmentLead.id
    ];

    const adminRoles = [
      owner.id,
      coOwner.id,
      founder.id,
      projectDirector.id,
      projectLead.id,
      headAdmin.id,
      seniorAdmin.id,
      admin.id,
      juniorAdmin.id,
      trialAdmin.id
    ];

    /*
     * =========================
     * INFORMACE
     * =========================
     */

    const info = await getOrCreateCategory(
      guild,
      "📌 INFORMACE"
    );

    await getOrCreateTextChannel(
      guild,
      "📢・oznámení",
      info
    );

    await getOrCreateTextChannel(
      guild,
      "📜・pravidla",
      info
    );

    await getOrCreateTextChannel(
      guild,
      "ℹ️・informace",
      info
    );

    await getOrCreateTextChannel(
      guild,
      "🎮・jak-začít",
      info
    );

    /*
     * =========================
     * KOMUNITA
     * =========================
     */

    const community = await getOrCreateCategory(
      guild,
      "💬 KOMUNITA"
    );

    await getOrCreateTextChannel(
      guild,
      "💬・chat",
      community
    );

    await getOrCreateTextChannel(
      guild,
      "📸・media",
      community
    );

    await getOrCreateTextChannel(
      guild,
      "🎉・eventy",
      community
    );

    await getOrCreateTextChannel(
      guild,
      "🤖・bot-příkazy",
      community
    );

    /*
     * =========================
     * PODPORA
     * =========================
     */

    const support = await getOrCreateCategory(
      guild,
      "🎫 PODPORA"
    );

    await getOrCreateTextChannel(
      guild,
      "🎫・vytvořit-ticket",
      support
    );

    await getOrCreateTextChannel(
      guild,
      "📖・faq",
      support
    );

    /*
     * =========================
     * ADMINISTRACE
     * =========================
     */

    const adminOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      },
      {
        id: headAdmin.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      },
      {
        id: seniorAdmin.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      },
      {
        id: admin.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      },
      {
        id: juniorAdmin.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      },
      {
        id: trialAdmin.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      }
    ];

    const administration = await getOrCreateCategory(
      guild,
      "🛡️ ADMINISTRACE",
      adminOverwrites
    );

    await getOrCreateTextChannel(
      guild,
      "🛡️・admin-chat",
      administration,
      adminOverwrites
    );

    await getOrCreateTextChannel(
      guild,
      "📋・admin-nábory",
      administration,
      adminOverwrites
    );

    await getOrCreateTextChannel(
      guild,
      "🚨・hlášení",
      administration,
      adminOverwrites
    );

    await getOrCreateTextChannel(
      guild,
      "🔨・tresty",
      administration,
      adminOverwrites
    );

    /*
     * =========================
     * VEDENÍ
     * =========================
     */

    const managementOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      }
    ];

    for (const roleId of managementRoles) {
      managementOverwrites.push({
        id: roleId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      });
    }

    const management = await getOrCreateCategory(
      guild,
      "👑 VEDENÍ",
      managementOverwrites
    );

    await getOrCreateTextChannel(
      guild,
      "👑・vedení",
      management,
      managementOverwrites
    );

    await getOrCreateTextChannel(
      guild,
      "📋・porady",
      management,
      managementOverwrites
    );

    await getOrCreateTextChannel(
      guild,
      "🤝・partnerství",
      management,
      managementOverwrites
    );

    /*
     * =========================
     * FRAKCE
     * =========================
     */

    const factions = await getOrCreateCategory(
      guild,
      "🚓 FRAKCE"
    );

    await getOrCreateTextChannel(
      guild,
      "🚓・policie",
      factions
    );

    await getOrCreateTextChannel(
      guild,
      "🚒・hasiči",
      factions
    );

    await getOrCreateTextChannel(
      guild,
      "🚑・záchranáři",
      factions
    );

    /*
     * =========================
     * LOGY
     * =========================
     */

    const logOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel]
      }
    ];

    for (const roleId of adminRoles) {
      logOverwrites.push({
        id: roleId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages
        ]
      });
    }

    const logs = await getOrCreateCategory(
      guild,
      "📊 LOGY",
      logOverwrites
    );

    await getOrCreateTextChannel(
      guild,
      "📥・member-log",
      logs,
      logOverwrites
    );

    await getOrCreateTextChannel(
      guild,
      "💬・message-log",
      logs,
      logOverwrites
    );

    await getOrCreateTextChannel(
      guild,
      "🔨・mod-log",
      logs,
      logOverwrites
    );

    await getOrCreateTextChannel(
      guild,
      "🎫・ticket-log",
      logs,
      logOverwrites
    );

    /*
     * =========================
     * HOTOVO
     * =========================
     */

    await interaction.editReply(
      "✅ **Imperial CZ/SK byl úspěšně nastaven!**\n\n" +
      "👑 Role vytvořeny\n" +
      "📁 Kategorie vytvořeny\n" +
      "💬 Textové kanály vytvořeny\n" +
      "🔐 Admin sekce zabezpečena\n" +
      "👑 Vedení zabezpečeno\n" +
      "📊 Logy zabezpečeny\n\n" +
      "🚀 Další krok: tickety, logy a moderace."
    );

  } catch (error) {
    console.error("❌ SETUP ERROR:", error);

    if (interaction.deferred) {
      await interaction.editReply(
        "❌ Při nastavování serveru nastala chyba.\n" +
        "Zkontroluj oprávnění bota a jeho pozici v seznamu rolí."
      );
    }
  }
});

client.login(TOKEN);

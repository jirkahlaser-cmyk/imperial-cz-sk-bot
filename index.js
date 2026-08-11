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
  console.error("❌ V Railway chybí DISCORD_TOKEN.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

// ======================================================
// POMOCNÉ FUNKCE
// ======================================================

function ownerPermissions(guild) {
  return {
    id: guild.ownerId,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.AttachFiles
    ]
  };
}

function makePermissions(guild, allowedRoles = [], deniedRoles = []) {
  const permissions = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    ownerPermissions(guild)
  ];

  for (const role of allowedRoles) {
    if (!role) continue;

    permissions.push({
      id: role.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles
      ]
    });
  }

  for (const role of deniedRoles) {
    if (!role) continue;

    permissions.push({
      id: role.id,
      deny: [PermissionFlagsBits.ViewChannel]
    });
  }

  return permissions;
}

async function getOrCreateRole(guild, name, color) {
  let role = guild.roles.cache.find(
    r => r.name.toLowerCase() === name.toLowerCase()
  );

  if (!role) {
    role = await guild.roles.create({
      name,
      color,
      reason: "Imperial CZ/SK setup"
    });
  }

  return role;
}

async function getOrCreateCategory(guild, name, permissions) {
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
  }

  return category;
}

async function getOrCreateText(guild, name, category, permissions, topic = "") {
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
      parent: category.id,
      topic,
      permissionOverwrites: permissions
    });
  }

  return channel;
}

async function getOrCreateVoice(guild, name, category, permissions) {
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
      parent: category.id,
      permissionOverwrites: permissions
    });
  }

  return channel;
}

// ======================================================
// SERVER SETUP
// ======================================================

async function setupServer(guild) {
  console.log("======================================");
  console.log("🚀 IMPERIAL SETUP START");
  console.log("Server:", guild.name);
  console.log("======================================");

  // ====================================================
  // ROLE
  // ====================================================

  const clen = await getOrCreateRole(guild, "Člen", "#5865F2");
  const admin = await getOrCreateRole(guild, "Admin", "#E74C3C");
  const moderator = await getOrCreateRole(guild, "Moderátor", "#F1C40F");
  const vedeni = await getOrCreateRole(guild, "Vedení", "#9B59B6");

  const pd = await getOrCreateRole(guild, "🚔 PD", "#3498DB");
  const hasici = await getOrCreateRole(guild, "🚒 Hasiči", "#E74C3C");
  const zachranari = await getOrCreateRole(guild, "🚑 Záchranáři", "#2ECC71");
  const civilista = await getOrCreateRole(guild, "👤 Civilista", "#95A5A6");

  const at1 = await getOrCreateRole(guild, "AT1", "#3498DB");
  const at2 = await getOrCreateRole(guild, "AT2", "#3498DB");
  const at3 = await getOrCreateRole(guild, "AT3", "#3498DB");
  const at5 = await getOrCreateRole(guild, "AT5", "#3498DB");
  const at6 = await getOrCreateRole(guild, "AT6", "#3498DB");

  // ====================================================
  // OZNÁMENÍ ROLE
  // ====================================================

  const roleEventy = await getOrCreateRole(
    guild,
    "🔔 Eventy",
    "#2ECC71"
  );

  const roleOznameni = await getOrCreateRole(
    guild,
    "🔔 Oznámení",
    "#3498DB"
  );

  const roleRM = await getOrCreateRole(
    guild,
    "🔔 RM Oznámení",
    "#9B59B6"
  );

  // ====================================================
  // KATEGORIE
  // ====================================================

  const info = await getOrCreateCategory(
    guild,
    "📢・INFORMACE",
    makePermissions(guild, [clen])
  );

  const vyber = await getOrCreateCategory(
    guild,
    "🎛️・VÝBĚR",
    makePermissions(guild, [clen])
  );

  const server = await getOrCreateCategory(
    guild,
    "🗺️・SERVER",
    makePermissions(guild, [clen])
  );

  const tickety = await getOrCreateCategory(
    guild,
    "🎫・TICKETY",
    makePermissions(guild, [clen, admin])
  );

  const adminTeam = await getOrCreateCategory(
    guild,
    "🛡️・ADMIN TEAM",
    makePermissions(guild, [admin, vedeni])
  );

  const adminCall = await getOrCreateCategory(
    guild,
    "📞・ADMIN CALL",
    makePermissions(guild, [admin, vedeni])
  );

  const vedenikategorie = await getOrCreateCategory(
    guild,
    "👑・VEDENÍ",
    makePermissions(guild, [vedeni])
  );

  const tresty = await getOrCreateCategory(
    guild,
    "⚠️・TRESTY",
    makePermissions(guild, [admin, vedeni])
  );

  const logy = await getOrCreateCategory(
    guild,
    "📋・LOGY",
    makePermissions(guild, [admin, vedeni])
  );

  // ====================================================
  // INFORMACE
  // ====================================================

  const vitej = await getOrCreateText(
    guild,
    "👋・vítej",
    info,
    makePermissions(guild, [clen]),
    "Vítej na Imperial CZ/SK."
  );

  await getOrCreateText(
    guild,
    "📜・pravidla",
    info,
    makePermissions(guild, [clen]),
    "Pravidla Imperial CZ/SK."
  );

  const oznameni = await getOrCreateText(
    guild,
    "📢・oznámení",
    info,
    makePermissions(guild, [clen]),
    "Oficiální oznámení."
  );

  const eventy = await getOrCreateText(
    guild,
    "🎉・eventy",
    info,
    makePermissions(guild, [clen]),
    "Oznámení o eventech."
  );

  const rmOznameni = await getOrCreateText(
    guild,
    "📣・rm-oznámení",
    info,
    makePermissions(guild, [clen]),
    "Oznámení RM."
  );

  // ====================================================
  // VÝBĚR
  // ====================================================

  const vyberOznameni = await getOrCreateText(
    guild,
    "🔔・výběr-oznámení",
    vyber,
    makePermissions(guild, [clen]),
    "Vyber si oznámení, která chceš dostávat."
  );

  const vyberSlozky = await getOrCreateText(
    guild,
    "🎖️・výběr-složky",
    vyber,
    makePermissions(guild, [clen]),
    "Vyber si svou složku."
  );

  // ====================================================
  // SERVER
  // ====================================================

  await getOrCreateText(
    guild,
    "🗺️・mapa",
    server,
    makePermissions(guild, [clen]),
    "Mapa Imperial."
  );

  await getOrCreateText(
    guild,
    "🏠・domy",
    server,
    makePermissions(guild, [clen]),
    "Koupě a informace o domech."
  );

  // ====================================================
  // TICKETY
  // ====================================================

  const ticket = await getOrCreateText(
    guild,
    "🎫・ticket",
    tickety,
    makePermissions(guild, [clen, admin]),
    "Vytvoření ticketu."
  );

  await getOrCreateText(
    guild,
    "📨・ticket-admin",
    tickety,
    makePermissions(guild, [admin, vedeni]),
    "Admin centrum ticketů."
  );

  // ====================================================
  // ADMIN TEAM
  // ====================================================

  await getOrCreateText(
    guild,
    "💬・admin-chat",
    adminTeam,
    makePermissions(guild, [admin, vedeni]),
    "Interní komunikace adminů."
  );

  await getOrCreateText(
    guild,
    "📜・admin-pravidla",
    adminTeam,
    makePermissions(guild, [admin, vedeni]),
    "Pravidla admin týmu."
  );

  await getOrCreateText(
    guild,
    "📋・admin-log",
    adminTeam,
    makePermissions(guild, [admin, vedeni]),
    "Interní admin log."
  );

  // ====================================================
  // ADMIN CALLY
  // ====================================================

  await getOrCreateVoice(
    guild,
    "🔊・AT1",
    adminCall,
    makePermissions(guild, [admin, vedeni, at1])
  );

  await getOrCreateVoice(
    guild,
    "🔊・AT2",
    adminCall,
    makePermissions(guild, [admin, vedeni, at2])
  );

  await getOrCreateVoice(
    guild,
    "🔊・AT3",
    adminCall,
    makePermissions(guild, [admin, vedeni, at3])
  );

  await getOrCreateVoice(
    guild,
    "🔊・AT5",
    adminCall,
    makePermissions(guild, [admin, vedeni, at5])
  );

  await getOrCreateVoice(
    guild,
    "🔊・AT6",
    adminCall,
    makePermissions(guild, [admin, vedeni, at6])
  );

  // ====================================================
  // VEDENÍ
  // ====================================================

  await getOrCreateText(
    guild,
    "👑・vedení-chat",
    vedenikategorie,
    makePermissions(guild, [vedeni]),
    "Soukromý chat vedení."
  );

  await getOrCreateText(
    guild,
    "📋・vedení-plány",
    vedenikategorie,
    makePermissions(guild, [vedeni]),
    "Plány vedení."
  );

  await getOrCreateVoice(
    guild,
    "🔊・vedení-call",
    vedenikategorie,
    makePermissions(guild, [vedeni])
  );

  // ====================================================
  // TRESTY
  // ====================================================

  const zapisTrestu = await getOrCreateText(
    guild,
    "⚠️・zápis-trestů",
    tresty,
    makePermissions(guild, [admin, vedeni]),
    "Formulář pro zápis trestů."
  );

  await getOrCreateText(
    guild,
    "⚠️・warn",
    tresty,
    makePermissions(guild, [admin, vedeni]),
    "Warn systém."
  );

  await getOrCreateText(
    guild,
    "🔨・ban",
    tresty,
    makePermissions(guild, [admin, vedeni]),
    "Ban systém."
  );

  // ====================================================
  // LOGY
  // ====================================================

  await getOrCreateText(
    guild,
    "⚠️・warn-log",
    logy,
    makePermissions(guild, [admin, vedeni]),
    "Automatický zápis Warnů."
  );

  await getOrCreateText(
    guild,
    "🔨・ban-log",
    logy,
    makePermissions(guild, [admin, vedeni]),
    "Automatický zápis Banů."
  );

  // ====================================================
  // EMBED - VÍTEJ
  // ====================================================

  if (vitej.messages.cache.size === 0) {
    const embed = new EmbedBuilder()
      .setTitle("🇨🇿🇸🇰 Imperial CZ/SK")
      .setDescription(
        "Vítej na oficiálním Discord serveru Imperial CZ/SK!\n\n" +
        "Začni výběrem oznámení a následně si vyber svou složku."
      )
      .setColor("#5865F2");

    await vitej.send({
      embeds: [embed]
    });
  }

  // ====================================================
  // MENU OZNÁMENÍ
  // ====================================================

  if (vyberOznameni.messages.cache.size === 0) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("vyber_oznameni")
      .setPlaceholder("🔔 Vyber oznámení")
      .setMinValues(1)
      .setMaxValues(3)
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Eventy")
          .setDescription("Oznámení o eventech.")
          .setValue("eventy")
          .setEmoji("🎉"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Oznámení")
          .setDescription("Důležitá serverová oznámení.")
          .setValue("oznameni")
          .setEmoji("📢"),

        new StringSelectMenuOptionBuilder()
          .setLabel("RM oznámení")
          .setDescription("Oznámení RM.")
          .setValue("rm")
          .setEmoji("📣")
      );

    await vyberOznameni.send({
      content:
        "## 🔔 VÝBĚR OZNÁMENÍ\n\n" +
        "Vyber si, která oznámení chceš dostávat.",
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  // ====================================================
  // MENU SLOŽKY
  // ====================================================

  if (vyberSlozky.messages.cache.size === 0) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("vyber_slozky")
      .setPlaceholder("🎖️ Vyber svou složku")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Policie")
          .setDescription("Vybrat Policii.")
          .setValue("pd")
          .setEmoji("🚔"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Hasiči")
          .setDescription("Vybrat Hasiče.")
          .setValue("hasici")
          .setEmoji("🚒"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Záchranáři")
          .setDescription("Vybrat Záchranáře.")
          .setValue("zachranari")
          .setEmoji("🚑"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Civilista")
          .setDescription("Vybrat Civilistu.")
          .setValue("civilista")
          .setEmoji("👤")
      );

    await vyberSlozky.send({
      content:
        "## 🎖️ VÝBĚR SLOŽKY\n\n" +
        "Vyber si svou složku na Imperialu.",
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  // ====================================================
  // TICKET MENU
  // ====================================================

  if (ticket.messages.cache.size === 0) {
    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_menu")
      .setPlaceholder("🎫 Vyber typ ticketu")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Stížnost na admina")
          .setValue("admin")
          .setEmoji("🛡️"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Stížnost na hráče")
          .setValue("hrac")
          .setEmoji("👤"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Mafie")
          .setValue("mafie")
          .setEmoji("🔫"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Žádost o unban")
          .setValue("unban")
          .setEmoji("🔓"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Jiný problém")
          .setValue("jiny")
          .setEmoji("❓")
      );

    await ticket.send({
      content:
        "## 🎫 TICKET\n\n" +
        "Vyber důvod, proč chceš kontaktovat administraci.",
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  console.log("======================================");
  console.log("✅ IMPERIAL SETUP HOTOV");
  console.log("======================================");
}

// ======================================================
// INTERAKCE
// ======================================================

client.on("interactionCreate", async interaction => {
  try {

    // --------------------------------------------------
    // SETUP
    // --------------------------------------------------

    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "setup") {

        if (interaction.user.id !== interaction.guild.ownerId) {
          return interaction.reply({
            content: "❌ /setup může použít pouze majitel serveru.",
            ephemeral: true
          });
        }

        await interaction.reply({
          content: "⏳ Vytvářím Imperial server...",
          ephemeral: true
        });

        await setupServer(interaction.guild);

        return interaction.editReply({
          content: "✅ Hotovo! Imperial server byl vytvořen."
        });
      }
    }

    // --------------------------------------------------
    // OZNÁMENÍ
    // --------------------------------------------------

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "vyber_oznameni"
    ) {

      const roleNames = {
        eventy: "🔔 Eventy",
        oznameni: "🔔 Oznámení",
        rm: "🔔 RM Oznámení"
      };

      const allRoles = Object.values(roleNames);

      for (const roleName of allRoles) {
        const role = interaction.guild.roles.cache.find(
          r => r.name === roleName
        );

        if (role && interaction.member.roles.cache.has(role.id)) {
          await interaction.member.roles.remove(role).catch(() => {});
        }
      }

      for (const value of interaction.values) {
        const role = interaction.guild.roles.cache.find(
          r => r.name === roleNames[value]
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

    // --------------------------------------------------
    // SLOŽKA
    // --------------------------------------------------

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "vyber_slozky"
    ) {

      const roleNames = {
        pd: "🚔 PD",
        hasici: "🚒 Hasiči",
        zachranari: "🚑 Záchranáři",
        civilista: "👤 Civilista"
      };

      const allRoles = Object.values(roleNames);

      for (const roleName of allRoles) {
        const role = interaction.guild.roles.cache.find(
          r => r.name === roleName
        );

        if (role && interaction.member.roles.cache.has(role.id)) {
          await interaction.member.roles.remove(role).catch(() => {});
        }
      }

      const selectedRole = interaction.guild.roles.cache.find(
        r => r.name === roleNames[interaction.values[0]]
      );

      const memberRole = interaction.guild.roles.cache.find(
        r => r.name === "Člen"
      );

      if (selectedRole) {
        await interaction.member.roles.add(selectedRole).catch(() => {});
      }

      if (memberRole) {
        await interaction.member.roles.add(memberRole).catch(() => {});
      }

      return interaction.reply({
        content:
          "✅ Výběr byl uložen.\n\n" +
          "Dostal/a jsi také roli **Člen**.",
        ephemeral: true
      });
    }

    // --------------------------------------------------
    // TICKET
    // --------------------------------------------------

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "ticket_menu"
    ) {

      const names = {
        admin: "stížnost na admina",
        hrac: "stížnost na hráče",
        mafie: "mafie",
        unban: "žádost o unban",
        jiny: "jiný problém"
      };

      return interaction.reply({
        content:
          `🎫 Vybral/a jsi: **${names[interaction.values[0]]}**.\n\n` +
          "Ticket systém dokončíme v další části.",
        ephemeral: true
      });
    }

  } catch (error) {
    console.error("❌ Interaction error:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Nastala chyba.",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

// ======================================================
// READY
// ======================================================

client.once("ready", async () => {

  console.log("======================================");
  console.log(`✅ Bot online: ${client.user.tag}`);
  console.log(`🆔 CLIENT ID: ${client.user.id}`);
  console.log("======================================");

  const commands = [
    new SlashCommandBuilder()
      .setName("setup")
      .setDescription("Vytvoří Imperial CZ/SK server.")
      .toJSON()
  ];

  try {

    const rest = new REST({
      version: "10"
    }).setToken(TOKEN);

    await rest.put(
      Routes.applicationCommands(client.user.id),
      {
        body: commands
      }
    );

    console.log("✅ /setup zaregistrován.");

  } catch (error) {
    console.error("❌ Chyba registrace /setup:", error);
  }
});

// ======================================================
// LOGIN
// ======================================================

client.login(TOKEN);

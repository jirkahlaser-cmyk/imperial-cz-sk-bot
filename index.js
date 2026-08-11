const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

// ======================================================
// IMPERIAL CZ/SK RP BOT
// ======================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error("DISCORD_TOKEN není nastavený v Railway.");
  process.exit(1);
}

// ======================================================
// NÁZVY
// ======================================================

const CATEGORIES = {
  INFO: "📌・INFORMACE",
  COMMUNITY: "💬・KOMUNITA",
  NOTIFY: "🔔・OZNÁMENÍ",
  RP: "🎮・RP",
  STAFF: "🛡️・STAFF",
  ADMIN_VOICE: "🔊・ADMIN CALL",
  MANAGEMENT: "👑・VEDENÍ"
};

const CHANNELS = {
  INFO: "📜・informace",
  RULES: "📕・pravidla",
  NEWS: "📢・novinky",

  CHAT: "💬・chat",
  MEDIA: "📸・media",

  EVENT: "🎉・eventy",
  ANNOUNCEMENTS: "📢・oznámení",
  RM: "🚨・rm-oznámení",

  START: "🚀・začni-zde",
  CHOICE: "🎯・výběr-role",

  STAFF: "🛡️・staff-chat",
  APPLICATIONS: "📋・nábor",
  LOGS: "📑・logy",

  AT1: "AT1",
  AT2: "AT2",
  AT3: "AT3",
  AT5: "AT5",
  AT6: "AT6",

  MANAGEMENT: "👑・call-vedení"
};

// ======================================================
// POMOCNÉ FUNKCE
// ======================================================

async function getCategory(guild, name, permissions = []) {
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

async function getTextChannel(guild, name, category) {
  let channel = guild.channels.cache.find(
    c =>
      c.type === ChannelType.GuildText &&
      c.name === name
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: category.id
    });
  } else if (channel.parentId !== category.id) {
    await channel.setParent(category.id);
  }

  return channel;
}

async function getVoiceChannel(guild, name, category) {
  let channel = guild.channels.cache.find(
    c =>
      c.type === ChannelType.GuildVoice &&
      c.name === name
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: category.id
    });
  } else if (channel.parentId !== category.id) {
    await channel.setParent(category.id);
  }

  return channel;
}

async function getRole(guild, name, color = null) {
  let role = guild.roles.cache.find(
    r => r.name === name
  );

  if (!role) {
    role = await guild.roles.create({
      name,
      color: color || undefined,
      reason: "Imperial CZ/SK RP setup"
    });
  }

  return role;
}

// ======================================================
// SETUP
// ======================================================

async function setupGuild(guild) {
  console.log(`Spouštím setup serveru: ${guild.name}`);

  // ====================================================
  // ROLE
  // ====================================================

  const memberRole = await getRole(
    guild,
    "Člen",
    0x5865f2
  );

  const pdRole = await getRole(
    guild,
    "🚓・Policie",
    0x3498db
  );

  const fireRole = await getRole(
    guild,
    "🚒・Hasiči",
    0xe74c3c
  );

  const emsRole = await getRole(
    guild,
    "🚑・Záchranáři",
    0x2ecc71
  );

  const civilianRole = await getRole(
    guild,
    "👤・Civilista",
    0x95a5a6
  );

  const staffRole = await getRole(
    guild,
    "🛡️・Staff",
    0x9b59b6
  );

  const adminRole = await getRole(
    guild,
    "👑・Administrátor",
    0xff0000
  );

  // ====================================================
  // KATEGORIE
  // ====================================================

  const info = await getCategory(
    guild,
    CATEGORIES.INFO
  );

  const community = await getCategory(
    guild,
    CATEGORIES.COMMUNITY
  );

  const notify = await getCategory(
    guild,
    CATEGORIES.NOTIFY
  );

  const rp = await getCategory(
    guild,
    CATEGORIES.RP
  );

  const staff = await getCategory(
    guild,
    CATEGORIES.STAFF
  );

  const adminVoice = await getCategory(
    guild,
    CATEGORIES.ADMIN_VOICE
  );

  const management = await getCategory(
    guild,
    CATEGORIES.MANAGEMENT
  );

  // ====================================================
  // INFORMAČNÍ KANÁLY
  // ====================================================

  const infoChannel = await getTextChannel(
    guild,
    CHANNELS.INFO,
    info
  );

  const rulesChannel = await getTextChannel(
    guild,
    CHANNELS.RULES,
    info
  );

  const newsChannel = await getTextChannel(
    guild,
    CHANNELS.NEWS,
    info
  );

  // ====================================================
  // KOMUNITA
  // ====================================================

  const chatChannel = await getTextChannel(
    guild,
    CHANNELS.CHAT,
    community
  );

  const mediaChannel = await getTextChannel(
    guild,
    CHANNELS.MEDIA,
    community
  );

  // ====================================================
  // OZNÁMENÍ
  // ====================================================

  const eventChannel = await getTextChannel(
    guild,
    CHANNELS.EVENT,
    notify
  );

  const announcementChannel = await getTextChannel(
    guild,
    CHANNELS.ANNOUNCEMENTS,
    notify
  );

  const rmChannel = await getTextChannel(
    guild,
    CHANNELS.RM,
    notify
  );

  // ====================================================
  // RP
  // ====================================================

  const startChannel = await getTextChannel(
    guild,
    CHANNELS.START,
    rp
  );

  const choiceChannel = await getTextChannel(
    guild,
    CHANNELS.CHOICE,
    rp
  );

  // ====================================================
  // STAFF
  // ====================================================

  const staffChannel = await getTextChannel(
    guild,
    CHANNELS.STAFF,
    staff
  );

  const applicationsChannel = await getTextChannel(
    guild,
    CHANNELS.APPLICATIONS,
    staff
  );

  const logsChannel = await getTextChannel(
    guild,
    CHANNELS.LOGS,
    staff
  );

  // ====================================================
  // ADMIN CALLY
  // ====================================================

  await getVoiceChannel(
    guild,
    CHANNELS.AT1,
    adminVoice
  );

  await getVoiceChannel(
    guild,
    CHANNELS.AT2,
    adminVoice
  );

  await getVoiceChannel(
    guild,
    CHANNELS.AT3,
    adminVoice
  );

  await getVoiceChannel(
    guild,
    CHANNELS.AT5,
    adminVoice
  );

  await getVoiceChannel(
    guild,
    CHANNELS.AT6,
    adminVoice
  );

  // ====================================================
  // CALL VEDENÍ
  // ====================================================

  await getVoiceChannel(
    guild,
    CHANNELS.MANAGEMENT,
    management
  );

  // ====================================================
  // INFORMACE
  // ====================================================

  await infoChannel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🏛️ Imperial CZ/SK RP")
        .setDescription(
          "Vítej na oficiálním Discord serveru Imperial CZ/SK RP.\n\n" +
          "Tento server slouží jako hlavní centrum projektu, " +
          "komunity, oznámení a organizace RP."
        )
        .setColor(0x5865f2)
    ]
  }).catch(() => {});

  await rulesChannel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("📕 Pravidla serveru")
        .setDescription(
          "Respektuj ostatní členy, dodržuj pravidla Discordu " +
          "a pravidla našeho RP projektu.\n\n" +
          "Porušování pravidel může vést k upozornění, " +
          "timeoutu nebo odebrání přístupu."
        )
        .setColor(0xff0000)
    ]
  }).catch(() => {});

  // ====================================================
  // VÝBĚR OZNÁMENÍ
  // ====================================================

  const notificationMenu =
    new StringSelectMenuBuilder()
      .setCustomId("notification_select")
      .setPlaceholder("🔔 Vyber oznámení, která chceš dostávat")
      .setMinValues(0)
      .setMaxValues(3)
      .addOptions([
        {
          label: "Eventy",
          description: "Oznámení o eventech",
          value: "event",
          emoji: "🎉"
        },
        {
          label: "Oznámení",
          description: "Důležitá oznámení projektu",
          value: "announcements",
          emoji: "📢"
        },
        {
          label: "RM oznámení",
          description: "Důležitá RP/RM oznámení",
          value: "rm",
          emoji: "🚨"
        }
      ]);

  await announcementChannel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🔔 Nastavení oznámení")
        .setDescription(
          "Vyber si, jaká oznámení chceš dostávat.\n\n" +
          "Můžeš vybrat jednu, dvě nebo všechny možnosti."
        )
        .setColor(0x5865f2)
    ],
    components: [
      new ActionRowBuilder().addComponents(
        notificationMenu
      )
    ]
  }).catch(() => {});

  // ====================================================
  // VÝBĚR ROLE
  // ====================================================

  const roleMenu =
    new StringSelectMenuBuilder()
      .setCustomId("faction_select")
      .setPlaceholder("🎯 Vyber svou roli")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions([
        {
          label: "Policie",
          description: "Chci se připojit k Policii",
          value: "pd",
          emoji: "🚓"
        },
        {
          label: "Hasiči",
          description: "Chci se připojit k hasičům",
          value: "fire",
          emoji: "🚒"
        },
        {
          label: "Záchranáři",
          description: "Chci se připojit k záchranářům",
          value: "ems",
          emoji: "🚑"
        },
        {
          label: "Civilista",
          description: "Chci hrát jako civilista",
          value: "civilian",
          emoji: "👤"
        }
      ]);

  await choiceChannel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🎯 Vyber svou cestu")
        .setDescription(
          "Vyber si, jakou roli chceš mít v Imperial CZ/SK RP.\n\n" +
          "Pokud zvolíš jednu ze složek IZS, dostaneš zároveň roli **Člen**. " +
          "Později tě bot může přesměrovat na příslušný server dané složky."
        )
        .setColor(0x5865f2)
    ],
    components: [
      new ActionRowBuilder().addComponents(
        roleMenu
      )
    ]
  }).catch(() => {});

  // ====================================================
  // HOTOVO
  // ====================================================

  console.log("=================================");
  console.log("✅ IMPERIAL SETUP DOKONČEN");
  console.log(`Server: ${guild.name}`);
  console.log(`ID: ${guild.id}`);
  console.log("=================================");
}

// ======================================================
// INTERAKCE
// ======================================================

client.on("interactionCreate", async interaction => {

  if (!interaction.isStringSelectMenu()) return;

  // ====================================================
  // OZNÁMENÍ
  // ====================================================

  if (interaction.customId === "notification_select") {

    const roles = {
      event: "🔔・Eventy",
      announcements: "🔔・Oznámení",
      rm: "🔔・RM oznámení"
    };

    const selected = interaction.values;

    try {

      for (const value of Object.values(roles)) {
        const role = interaction.guild.roles.cache.find(
          r => r.name === value
        );

        if (role && interaction.member.roles.cache.has(role.id)) {
          await interaction.member.roles.remove(role);
        }
      }

      for (const value of selected) {

        const roleName = roles[value];

        let role = interaction.guild.roles.cache.find(
          r => r.name === roleName
        );

        if (!role) {
          role = await interaction.guild.roles.create({
            name: roleName,
            reason: "Imperial notification role"
          });
        }

        await interaction.member.roles.add(role);
      }

      await interaction.reply({
        content: "✅ Nastavení oznámení bylo aktualizováno.",
        ephemeral: true
      });

    } catch (error) {

      console.error(error);

      await interaction.reply({
        content: "❌ Nepodařilo se změnit oznámení.",
        ephemeral: true
      }).catch(() => {});

    }

    return;
  }

  // ====================================================
  // VÝBĚR SLOŽKY
  // ====================================================

  if (interaction.customId === "faction_select") {

    const roleNames = {
      pd: "🚓・Policie",
      fire: "🚒・Hasiči",
      ems: "🚑・Záchranáři",
      civilian: "👤・Civilista"
    };

    try {

      const memberRole =
        interaction.guild.roles.cache.find(
          r => r.name === "Člen"
        );

      const selectedRole =
        interaction.guild.roles.cache.find(
          r => r.name === roleNames[interaction.values[0]]
        );

      if (memberRole) {
        await interaction.member.roles.add(memberRole);
      }

      if (selectedRole) {
        await interaction.member.roles.add(selectedRole);
      }

      await interaction.reply({
        content:
          "✅ Tvoje role byla nastavena.\n\n" +
          "Pokud sis vybral složku IZS, později tě systém " +
          "přesměruje na její samostatný server.",
        ephemeral: true
      });

    } catch (error) {

      console.error(error);

      await interaction.reply({
        content:
          "❌ Nastala chyba při nastavování role.",
        ephemeral: true
      }).catch(() => {});

    }
  }
});

// ======================================================
// READY
// ======================================================

client.once("ready", async () => {

  console.log("");
  console.log("=================================");
  console.log("🤖 IMPERIAL BOT ONLINE");
  console.log(`👤 ${client.user.tag}`);
  console.log("=================================");

  for (const guild of client.guilds.cache.values()) {

    try {
      await setupGuild(guild);
    } catch (error) {

      console.error(
        `❌ Setup serveru ${guild.name} selhal:`
      );

      console.error(error);
    }

  }

});

// ======================================================
// CHYBY
// ======================================================

process.on("unhandledRejection", error => {
  console.error("❌ Unhandled rejection:", error);
});

process.on("uncaughtException", error => {
  console.error("❌ Uncaught exception:", error);
});

// ======================================================
// LOGIN
// ======================================================

client.login(TOKEN);

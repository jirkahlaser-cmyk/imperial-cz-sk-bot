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
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
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

const roleCache = {};

async function getOrCreateRole(guild, name, color = null) {
  let role = guild.roles.cache.find(r => r.name === name);

  if (!role) {
    role = await guild.roles.create({
      name,
      color: color || "Default",
      reason: "Imperial CZ/SK Server Setup"
    });
  }

  roleCache[name] = role;
  return role;
}

async function createCategory(guild, name, overwrites = []) {
  const category = await guild.channels.create({
    name,
    type: ChannelType.GuildCategory,
    permissionOverwrites: overwrites
  });

  return category;
}

async function createText(guild, name, category, overwrites = []) {
  return await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: overwrites,
    topic: "Imperial CZ/SK"
  });
}

async function createVoice(guild, name, category, overwrites = []) {
  return await guild.channels.create({
    name,
    type: ChannelType.GuildVoice,
    parent: category.id,
    permissionOverwrites: overwrites
  });
}

function hiddenEveryone(guild) {
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

function ownerPermissions(guild) {
  return {
    id: guild.ownerId,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks
    ]
  };
}

function privateTextPermissions(guild, roles) {
  return [
    hiddenEveryone(guild),
    ...roles.map(allowText),
    ownerPermissions(guild)
  ];
}

function privateVoicePermissions(guild, roles) {
  return [
    hiddenEveryone(guild),
    ...roles.map(allowVoice),
    {
      id: guild.ownerId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak
      ]
    }
  ];
}

async function deleteEverything(guild) {
  console.log("🗑️ Mažu současné kanály...");

  const channels = [...guild.channels.cache.values()];

  for (const channel of channels) {
    try {
      await channel.delete("Imperial CZ/SK nový server setup");
      console.log(`🗑️ Smazáno: ${channel.name}`);
    } catch (error) {
      console.error(`❌ Nepodařilo se smazat ${channel.name}:`, error.message);
    }
  }

  console.log("✅ Všechny současné kanály byly odstraněny.");
}

async function setupServer(guild) {
  console.log(`🚀 Spouštím nový setup pro: ${guild.name}`);

  /*
   * ============================
   * 1. SMAZÁNÍ STARÝCH KANÁLŮ
   * ============================
   */

  await deleteEverything(guild);

  /*
   * ============================
   * 2. ROLE
   * ============================
   */

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

  /*
   * ============================
   * 3. HLAVNÍ KATEGORIE
   * ============================
   */

  const welcome = await createCategory(
    guild,
    "🏛️・IMPERIAL CZ/SK"
  );

  const information = await createCategory(
    guild,
    "📢・INFORMACE"
  );

  const selection = await createCategory(
    guild,
    "🎛️・VÝBĚR"
  );

  const server = await createCategory(
    guild,
    "🗺️・SERVER"
  );

  const tickets = await createCategory(
    guild,
    "🎫・TICKETY"
  );

  /*
   * ============================
   * 4. ADMIN
   * ============================
   */

  const adminRoles = [
    admin,
    moderator,
    management,
    owner
  ];

  const adminCategory = await createCategory(
    guild,
    "🛡️・ADMIN TEAM",
    privateTextPermissions(guild, adminRoles)
  );

  const adminCalls = await createCategory(
    guild,
    "📞・ADMIN CALL",
    privateVoicePermissions(guild, adminRoles)
  );

  /*
   * ============================
   * 5. VEDENÍ
   * ============================
   */

  const managementRoles = [
    management,
    owner
  ];

  const managementCategory = await createCategory(
    guild,
    "👑・VEDENÍ",
    privateTextPermissions(guild, managementRoles)
  );

  /*
   * ============================
   * 6. TRESTY
   * ============================
   */

  const punishmentCategory = await createCategory(
    guild,
    "⚠️・TRESTY",
    privateTextPermissions(guild, adminRoles)
  );

  const logsCategory = await createCategory(
    guild,
    "📋・LOGY",
    privateTextPermissions(guild, adminRoles)
  );

  /*
   * ============================
   * 7. IZS
   * ============================
   */

  const pdCategory = await createCategory(
    guild,
    "🚔・POLICIE",
    privateTextPermissions(guild, [
      pd,
      admin,
      moderator,
      management,
      owner
    ])
  );

  const fireCategory = await createCategory(
    guild,
    "🚒・HASIČI",
    privateTextPermissions(guild, [
      fire,
      admin,
      moderator,
      management,
      owner
    ])
  );

  const emsCategory = await createCategory(
    guild,
    "🚑・ZÁCHRANÁŘI",
    privateTextPermissions(guild, [
      ems,
      admin,
      moderator,
      management,
      owner
    ])
  );

  /*
   * ============================
   * 8. UVÍTÁNÍ
   * ============================
   */

  const welcomeChannel = await createText(
    guild,
    "👋・vítej",
    welcome
  );

  const welcomeText =
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "👑 **VÍTEJ V IMPERIAL CZ/SK** 👑\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +

    "Vítej na oficiálním Discord serveru Imperial CZ/SK. " +
    "Tento server slouží jako hlavní komunitní centrum pro naši " +
    "Roblox komunitu, komunikaci mezi hráči, administrací a jednotlivými " +
    "složkami integrovaného záchranného systému. Na serveru najdeš " +
    "informace o dění, oznámení, eventy, podporu, tickety, mapu, " +
    "informace o domech a další důležité funkce.\n\n" +

    "Po připojení doporučujeme nejprve navštívit sekci výběru. " +
    "Zde si nastavíš, jaká oznámení chceš dostávat, a následně si " +
    "vybereš svou hlavní složku. Na výběr máš Policii, Hasiče, " +
    "Záchranáře nebo Civilistu. Vybrat můžeš pouze jednu hlavní " +
    "složku, aby byl server přehledný a aby každý člen měl správný " +
    "přístup ke svým kanálům.\n\n" +

    "Pokud se rozhodneš pro některou ze složek IZS, dostaneš také " +
    "roli Člen, protože hlavní komunikace a komunitní část serveru " +
    "zůstává společná. Samotný nábor do jednotlivých složek může " +
    "probíhat na jejich samostatných serverech.\n\n" +

    "Respektuj ostatní členy, administraci a pravidla serveru. " +
    "Chceme zde vytvořit prostředí, kde se budou dobře cítit noví " +
    "i dlouhodobí hráči. Pokud si nejsi něč jistý, použij ticket " +
    "nebo kontaktuj člena administrace.\n\n" +

    "❤️ Užij si Imperial CZ/SK a přejeme příjemnou hru!\n\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

  await welcomeChannel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("👑 Vítej v Imperial CZ/SK")
        .setDescription(welcomeText)
        .setColor("#5865F2")
        .setFooter({
          text: "Imperial CZ/SK • Oficiální server"
        })
    ]
  });

  /*
   * ============================
   * 9. PRAVIDLA
   * ============================
   */

  const rulesChannel = await createText(
    guild,
    "📜・pravidla",
    information
  );

  const rulesText =
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
    "📜 **PRAVIDLA IMPERIAL CZ/SK**\n" +
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +

    "**1. Respekt**\n" +
    "Každý člen je povinen chovat se slušně. Urážky, osobní útoky, " +
    "provokace, obtěžování nebo úmyslné vyvolávání konfliktů mohou " +
    "být potrestány administrací.\n\n" +

    "**2. Spam a reklama**\n" +
    "Je zakázáno zahlcovat chat opakovanými zprávami, posílat " +
    "nevyžádanou reklamu nebo propagovat jiné servery bez povolení.\n\n" +

    "**3. Role a oprávnění**\n" +
    "Role získané výběrovým systémem nesmí být zneužívány. Pokusy " +
    "o obcházení oprávnění nebo vydávání se za administraci jsou " +
    "považovány za závažné porušení pravidel.\n\n" +

    "**4. Ticket systém**\n" +
    "Tickety používej pouze pro skutečné žádosti, stížnosti, " +
    "nahlášení nebo žádosti o pomoc. Spamování ticketů může vést " +
    "k omezení přístupu k ticket systému.\n\n" +

    "**5. RP pravidla**\n" +
    "Ve hře dodržuj pravidla daného RP serveru. Administrace Discordu " +
    "může řešit také závažné případy, které mají dopad na komunitu.\n\n" +

    "**6. Tresty**\n" +
    "Administrace může podle závažnosti použít upozornění, warn, " +
    "dočasný ban nebo trvalý ban. Tři warny mohou vést k automatickému " +
    "upozornění administrace na udělení třídenního banu.\n\n" +

    "Pravidla se mohou průběžně měnit podle potřeby projektu. " +
    "Pokud dojde k aktualizaci pravidel, členové jsou povinni " +
    "se s novou verzí seznámit.\n\n" +

    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━";

  await rulesChannel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("📜 Pravidla Imperial CZ/SK")
        .setDescription(rulesText)
        .setColor("#E67E22")
    ]
  });

  /*
   * ============================
   * 10. OZNÁMENÍ
   * ============================
   */

  const announcements = await createText(
    guild,
    "📢・oznámení",
    information,
    [
      {
        id: guild.roles.everyone.id,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.SendMessages]
      },
      ownerPermissions(guild)
    ]
  );

  await createText(
    guild,
    "🎉・eventy",
    information,
    [
      {
        id: guild.roles.everyone.id,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.SendMessages]
      },
      ownerPermissions(guild)
    ]
  );

  await createText(
    guild,
    "📣・rm-oznámení",
    information,
    [
      {
        id: guild.roles.everyone.id,
        allow: [PermissionFlagsBits.ViewChannel],
        deny: [PermissionFlagsBits.SendMessages]
      },
      ownerPermissions(guild)
    ]
  );

  await announcements.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("📢 Oznámení")
        .setDescription(
          "Tento kanál slouží pro důležitá oficiální oznámení " +
          "týkající se Imperial CZ/SK. Pokud sis při výběru oznámení " +
          "zvolil/a možnost Oznámení, budeš zde dostávat aktuální " +
          "informace o důležitých změnách, aktualizacích a událostech."
        )
        .setColor("#3498DB")
    ]
  });

  /*
   * ============================
   * 11. VÝBĚR OZNÁMENÍ
   * ============================
   */

  const notificationChannel = await createText(
    guild,
    "🔔・výběr-oznámení",
    selection
  );

  const notificationMenu =
    new StringSelectMenuBuilder()
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
          .setDescription("Důležitá serverová oznámení")
          .setValue("announcement")
          .setEmoji("📢"),

        new StringSelectMenuOptionBuilder()
          .setLabel("RM Oznámení")
          .setDescription("Oznámení RM")
          .setValue("rm")
          .setEmoji("📣")
      );

  await notificationChannel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🔔 Vyber si oznámení")
        .setDescription(
          "Zde si můžeš nastavit, jaká oznámení chceš dostávat. " +
          "Můžeš si vybrat jednu, dvě nebo všechny tři možnosti. " +
          "Výběr můžeš kdykoliv změnit."
        )
        .setColor("#5865F2")
    ],
    components: [
      new ActionRowBuilder().addComponents(notificationMenu)
    ]
  });

  /*
   * ============================
   * 12. VÝBĚR SLOŽKY
   * ============================
   */

  const factionChannel = await createText(
    guild,
    "🎖️・výběr-složky",
    selection
  );

  const factionMenu =
    new StringSelectMenuBuilder()
      .setCustomId("faction_select")
      .setPlaceholder("🎖️ Vyber jednu složku")
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Policie")
          .setDescription("Vyber si Policii")
          .setValue("pd")
          .setEmoji("🚔"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Hasiči")
          .setDescription("Vyber si Hasiče")
          .setValue("fire")
          .setEmoji("🚒"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Záchranáři")
          .setDescription("Vyber si Záchranáře")
          .setValue("ems")
          .setEmoji("🚑"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Civilista")
          .setDescription("Hraj jako Civilista")
          .setValue("civilian")
          .setEmoji("👤")
      );

  await factionChannel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🎖️ Výběr složky")
        .setDescription(
          "Vyber si **JEDNU** hlavní složku.\n\n" +
          "🚔 **Policie** – přístup do policejní sekce.\n" +
          "🚒 **Hasiči** – přístup do hasičské sekce.\n" +
          "🚑 **Záchranáři** – přístup do zdravotnické sekce.\n" +
          "👤 **Civilista** – běžný přístup pro civilní hráče.\n\n" +
          "⚠️ Vybrat lze pouze jednu možnost. " +
          "Při změně výběru bot automaticky odebere starou roli " +
          "a přidá novou. Každý vybraný člen zároveň dostane roli Člen."
        )
        .setColor("#5865F2")
    ],
    components: [
      new ActionRowBuilder().addComponents(factionMenu)
    ]
  });

  /*
   * ============================
   * 13. MAPA + DOMY
   * ============================
   */

  await createText(guild, "🗺️・mapa", server);

  await createText(guild, "🏠・domy", server);

  /*
   * ============================
   * 14. TICKETY
   * ============================
   */

  const ticketChannel = await createText(
    guild,
    "🎫・vytvořit-ticket",
    tickets
  );

  const ticketMenu =
    new StringSelectMenuBuilder()
      .setCustomId("ticket_select")
      .setPlaceholder("🎫 Vyber typ ticketu")
      .addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("Stížnost na admina")
          .setDescription("Nahlášení člena administrace")
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
          .setDescription("Záležitost Mafie 1")
          .setValue("mafia1")
          .setEmoji("1️⃣"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Mafie 2")
          .setDescription("Záležitost Mafie 2")
          .setValue("mafia2")
          .setEmoji("2️⃣"),

        new StringSelectMenuOptionBuilder()
          .setLabel("Mafie 3")
          .setDescription("Záležitost Mafie 3")
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
        .setTitle("🎫 TICKET CENTRUM")
        .setDescription(
          "Potřebuješ pomoc administrace? Vyber níže důvod ticketu. " +
          "Ticket používej pouze pro skutečné požadavky. " +
          "Po vytvoření ticketu se ti zobrazí soukromý kanál, " +
          "ke kterému budou mít přístup ty a administrace.\n\n" +
          "Vyber správnou kategorii, aby mohla administrace tvůj " +
          "požadavek co nejrychleji vyřešit."
        )
        .setColor("#5865F2")
    ],
    components: [
      new ActionRowBuilder().addComponents(ticketMenu)
    ]
  });

  /*
   * ============================
   * 15. ADMIN TEAM
   * ============================
   */

  await createText(guild, "💬・admin-chat", adminCategory);

  await createText(guild, "📜・admin-pravidla", adminCategory);

  await createText(guild, "📋・admin-log", adminCategory);

  /*
   * ============================
   * 16. AT CALLY
   * ============================
   */

  const atChannels = [
    ["🔊・AT1", at1],
    ["🔊・AT2", at2],
    ["🔊・AT3", at3],
    ["🔊・AT5", at5],
    ["🔊・AT6", at6]
  ];

  for (const [name, role] of atChannels) {
    const channel = await createVoice(
      guild,
      name,
      adminCalls,
      privateVoicePermissions(guild, [
        role,
        admin,
        moderator,
        management,
        owner
      ])
    );
  }

  /*
   * ============================
   * 17. VEDENÍ
   * ============================
   */

  await createText(
    guild,
    "👑・vedení-chat",
    managementCategory
  );

  await createText(
    guild,
    "📋・vedení-plány",
    managementCategory
  );

  await createText(
    guild,
    "📢・vedení-oznámení",
    managementCategory
  );

  await createVoice(
    guild,
    "🔊・vedení-call",
    managementCategory,
    privateVoicePermissions(guild, [
      management,
      owner
    ])
  );

  /*
   * ============================
   * 18. TRESTY
   * ============================
   */

  const punishmentChannel = await createText(
    guild,
    "⚠️・zápis-trestů",
    punishmentCategory
  );

  const warnChannel = await createText(
    guild,
    "⚠️・warn",
    punishmentCategory
  );

  const banChannel = await createText(
    guild,
    "🔨・ban",
    punishmentCategory
  );

  await punishmentChannel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("⚠️ ZÁPIS TRESTŮ")
        .setDescription(
          "**WARN**\n" +
          "Použij `/warn` pro udělení varování hráči.\n\n" +

          "**BAN**\n" +
          "Použij `/ban` pro udělení dočasného nebo trvalého banu.\n\n" +

          "**3 WARNa**\n" +
          "Po třetím aktivním warnu bot automaticky upozorní " +
          "administraci, že hráč má být potrestán třídenním banem.\n\n" +

          "Všechny tresty se automaticky zapisují do příslušných logů."
        )
        .setColor("#E67E22")
    ]
  });

  await warnChannel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("⚠️ WARN SYSTÉM")
        .setDescription(
          "Warn uděluj pouze v případě skutečného porušení pravidel. " +
          "Při zadávání musí administrátor uvést Roblox jméno hráče " +
          "a důvod trestu. Bot následně vytvoří záznam v warn logu."
        )
        .setColor("#F1C40F")
    ]
  });

  await banChannel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle("🔨 BAN SYSTÉM")
        .setDescription(
          "Ban používej podle závažnosti porušení pravidel. " +
          "Při udělení banu musí administrátor uvést Roblox jméno, " +
          "délku banu a důvod. Záznam bude automaticky uložen " +
          "do ban logu."
        )
        .setColor("#E74C3C")
    ]
  });

  /*
   * ============================
   * 19. LOGY
   * ============================
   */

  await createText(
    guild,
    "⚠️・warn-log",
    logsCategory
  );

  await createText(
    guild,
    "🔨・ban-log",
    logsCategory
  );

  /*
   * ============================
   * 20. POLICIE
   * ============================
   */

  await createText(
    guild,
    "🚔・pd-chat",
    pdCategory,
    privateTextPermissions(guild, [
      pd,
      admin,
      moderator,
      management,
      owner
    ])
  );

  await createVoice(
    guild,
    "🔊・pd-call",
    pdCategory,
    privateVoicePermissions(guild, [
      pd,
      admin,
      moderator,
      management,
      owner
    ])
  );

  await createText(
    guild,
    "📋・pd-info",
    pdCategory,
    privateTextPermissions(guild, [
      pd,
      admin,
      moderator,
      management,
      owner
    ])
  );

  /*
   * ============================
   * 21. HASIČI
   * ============================
   */

  await createText(
    guild,
    "🚒・hasici-chat",
    fireCategory,
    privateTextPermissions(guild, [
      fire,
      admin,
      moderator,
      management,
      owner
    ])
  );

  await createVoice(
    guild,
    "🔊・hasici-call",
    fireCategory,
    privateVoicePermissions(guild, [
      fire,
      admin,
      moderator,
      management,
      owner
    ])
  );

  await createText(
    guild,
    "📋・hasici-info",
    fireCategory,
    privateTextPermissions(guild, [
      fire,
      admin,
      moderator,
      management,
      owner
    ])
  );

  /*
   * ============================
   * 22. ZÁCHRANÁŘI
   * ============================
   */

  await createText(
    guild,
    "🚑・zachranari-chat",
    emsCategory,
    privateTextPermissions(guild, [
      ems,
      admin,
      moderator,
      management,
      owner
    ])
  );

  await createVoice(
    guild,
    "🔊・zachranari-call",
    emsCategory,
    privateVoicePermissions(guild, [
      ems,
      admin,
      moderator,
      management,
      owner
    ])
  );

  await createText(
    guild,
    "📋・zachranari-info",
    emsCategory,
    privateTextPermissions(guild, [
      ems,
      admin,
      moderator,
      management,
      owner
    ])
  );

  /*
   * ============================
   * HOTOVO
   * ============================
   */

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ IMPERIAL CZ/SK SETUP HOTOVÝ");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

/*
 * =====================================
 * READY
 * =====================================
 */

client.once("ready", async () => {
  console.log(`✅ Bot online: ${client.user.tag}`);

  try {
    const rest = new REST({ version: "10" })
      .setToken(TOKEN);

    for (const guild of client.guilds.cache.values()) {

      const commands = [

        new SlashCommandBuilder()
          .setName("setup")
          .setDescription(
            "Smaže současné kanály a vytvoří nový Imperial server."
          ),

        new SlashCommandBuilder()
          .setName("warn")
          .setDescription("Udělí hráči warn.")
          .addStringOption(option =>
            option
              .setName("hrac")
              .setDescription("Roblox jméno hráče")
              .setRequired(true)
          )
          .addStringOption(option =>
            option
              .setName("duvod")
              .setDescription("Důvod warnu")
              .setRequired(true)
          ),

        new SlashCommandBuilder()
          .setName("ban")
          .setDescription("Udělí hráči ban.")
          .addStringOption(option =>
            option
              .setName("hrac")
              .setDescription("Roblox jméno hráče")
              .setRequired(true)
          )
          .addIntegerOption(option =>
            option
              .setName("dny")
              .setDescription("Počet dní. 0 = permanentní ban")
              .setRequired(true)
              .setMinValue(0)
          )
          .addStringOption(option =>
            option
              .setName("duvod")
              .setDescription("Důvod banu")
              .setRequired(true)
          )
      ];

      await rest.put(
        Routes.applicationGuildCommands(
          client.user.id,
          guild.id
        ),
        {
          body: commands.map(command => command.toJSON())
        }
      );

      console.log(
        `✅ Příkazy registrovány: ${guild.name}`
      );
    }

  } catch (error) {
    console.error(
      "❌ Chyba při registraci příkazů:",
      error
    );
  }
});

/*
 * =====================================
 * INTERACTIONS
 * =====================================
 */

client.on("interactionCreate", async interaction => {

  try {

    /*
     * ==========================
     * SETUP
     * ==========================
     */

    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "setup"
    ) {

      if (
        interaction.guild.ownerId !==
        interaction.user.id
      ) {
        return interaction.reply({
          content:
            "❌ Tento příkaz může použít pouze majitel serveru.",
          ephemeral: true
        });
      }

      await interaction.reply({
        content:
          "⏳ Začínám vytvářet nový server. " +
          "Současné kanály budou odstraněny.",
        ephemeral: true
      });

      await setupServer(interaction.guild);

      return interaction.editReply(
        "✅ Hotovo! Staré kanály byly odstraněny a nový Imperial CZ/SK server byl vytvořen."
      );
    }

    /*
     * ==========================
     * WARN
     * ==========================
     */

    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "warn"
    ) {

      const allowed =
        interaction.member.roles.cache.some(role =>
          [
            ROLE_NAMES.admin,
            ROLE_NAMES.moderator,
            ROLE_NAMES.management,
            ROLE_NAMES.owner
          ].includes(role.name)
        ) ||
        interaction.guild.ownerId === interaction.user.id;

      if (!allowed) {
        return interaction.reply({
          content:
            "❌ Nemáš oprávnění udělovat warny.",
          ephemeral: true
        });
      }

      const player =
        interaction.options.getString("hrac");

      const reason =
        interaction.options.getString("duvod");

      const warnLog =
        interaction.guild.channels.cache.find(
          c => c.name === "⚠️・warn-log"
        );

      const embed = new EmbedBuilder()
        .setTitle("⚠️ NOVÝ WARN")
        .addFields(
          {
            name: "👤 Roblox hráč",
            value: player,
            inline: true
          },
          {
            name: "🛡️ Udělil",
            value: interaction.user.tag,
            inline: true
          },
          {
            name: "📄 Důvod",
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

      return interaction.reply({
        content:
          `⚠️ Warn byl zapsán pro **${player}**.\nDůvod: ${reason}`,
        ephemeral: true
      });
    }

    /*
     * ==========================
     * BAN
     * ==========================
     */

    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "ban"
    ) {

      const allowed =
        interaction.member.roles.cache.some(role =>
          [
            ROLE_NAMES.admin,
            ROLE_NAMES.moderator,
            ROLE_NAMES.management,
            ROLE_NAMES.owner
          ].includes(role.name)
        ) ||
        interaction.guild.ownerId === interaction.user.id;

      if (!allowed) {
        return interaction.reply({
          content:
            "❌ Nemáš oprávnění udělovat bany.",
          ephemeral: true
        });
      }

      const player =
        interaction.options.getString("hrac");

      const days =
        interaction.options.getInteger("dny");

      const reason =
        interaction.options.getString("duvod");

      const banLog =
        interaction.guild.channels.cache.find(
          c => c.name === "🔨・ban-log"
        );

      const duration =
        days === 0
          ? "Permanentní"
          : `${days} dní`;

      const embed = new EmbedBuilder()
        .setTitle("🔨 NOVÝ BAN")
        .addFields(
          {
            name: "👤 Roblox hráč",
            value: player,
            inline: true
          },
          {
            name: "⏱️ Délka",
            value: duration,
            inline: true
          },
          {
            name: "🛡️ Udělil",
            value: interaction.user.tag,
            inline: true
          },
          {
            name: "📄 Důvod",
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
          `🔨 Ban byl zapsán pro **${player}**.\n` +
          `Délka: **${duration}**\n` +
          `Důvod: ${reason}`,
        ephemeral: true
      });
    }

    /*
     * ==========================
     * OZNÁMENÍ
     * ==========================
     */

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId ===
        "notification_select"
    ) {

      const roleMap = {
        event: ROLE_NAMES.event,
        announcement: ROLE_NAMES.announcements,
        rm: ROLE_NAMES.rm
      };

      for (
        const roleName of
        Object.values(roleMap)
      ) {

        const role =
          interaction.guild.roles.cache.find(
            r => r.name === roleName
          );

        if (
          role &&
          interaction.member.roles.cache.has(
            role.id
          )
        ) {
          await interaction.member.roles
            .remove(role)
            .catch(() => {});
        }
      }

      for (
        const value of interaction.values
      ) {

        const role =
          interaction.guild.roles.cache.find(
            r => r.name === roleMap[value]
          );

        if (role) {
          await interaction.member.roles
            .add(role)
            .catch(() => {});
        }
      }

      return interaction.reply({
        content:
          "✅ Tvoje nastavení oznámení bylo uloženo.",
        ephemeral: true
      });
    }

    /*
     * ==========================
     * VÝBĚR SLOŽKY
     * ==========================
     */

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId ===
        "faction_select"
    ) {

      const factionRoles = [
        ROLE_NAMES.pd,
        ROLE_NAMES.fire,
        ROLE_NAMES.ems,
        ROLE_NAMES.civilian
      ];

      for (
        const roleName of factionRoles
      ) {

        const role =
          interaction.guild.roles.cache.find(
            r => r.name === roleName
          );

        if (
          role &&
          interaction.member.roles.cache.has(
            role.id
          )
        ) {
          await interaction.member.roles
            .remove(role)
            .catch(() => {});
        }
      }

      const selected =
        interaction.values[0];

      const roleNames = {
        pd: ROLE_NAMES.pd,
        fire: ROLE_NAMES.fire,
        ems: ROLE_NAMES.ems,
        civilian: ROLE_NAMES.civilian
      };

      const selectedRole =
        interaction.guild.roles.cache.find(
          r =>
            r.name ===
            roleNames[selected]
        );

      const memberRole =
        interaction.guild.roles.cache.find(
          r =>
            r.name === ROLE_NAMES.member
        );

      if (selectedRole) {
        await interaction.member.roles
          .add(selectedRole)
          .catch(() => {});
      }

      if (memberRole) {
        await interaction.member.roles
          .add(memberRole)
          .catch(() => {});
      }

      return interaction.reply({
        content:
          `✅ Vybral/a sis **${selectedRole?.name || "Civilista"}**.\n` +
          "👤 Zároveň ti byla přidána role **Člen**.",
        ephemeral: true
      });
    }

    /*
     * ==========================
     * TICKET
     * ==========================
     */

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId ===
        "ticket_select"
    ) {

      const type =
        interaction.values[0];

      const typeNames = {
        admin_complaint: "Stížnost na admina",
        player_complaint: "Stížnost na hráče",
        mafia: "Mafie",
        mafia1: "Mafie 1",
        mafia2: "Mafie 2",
        mafia3: "Mafie 3",
        unban: "Žádost o unban"
      };

      const existing =
        interaction.guild.channels.cache.find(
          channel =>
            channel.type === ChannelType.GuildText &&
            channel.name ===
              `ticket-${interaction.user.id}`
        );

      if (existing) {
        return interaction.reply({
          content:
            `❌ Už máš otevřený ticket: ${existing}`,
          ephemeral: true
        });
      }

      const adminRoles =
        [
          interaction.guild.roles.cache.find(
            r => r.name === ROLE_NAMES.admin
          ),
          interaction.guild.roles.cache.find(
            r => r.name === ROLE_NAMES.moderator
          ),
          interaction.guild.roles.cache.find(
            r => r.name === ROLE_NAMES.management
          ),
          interaction.guild.roles.cache.find(
            r => r.name === ROLE_NAMES.owner
          )
        ].filter(Boolean);

      const ticket = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.id}`,
        type: ChannelType.GuildText,
        parent:
          interaction.channel.parentId,
        permissionOverwrites: [
          {
            id:
              interaction.guild.roles.everyone.id,
            deny: [
              PermissionFlagsBits.ViewChannel
            ]
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
          ...adminRoles.map(role => ({
            id: role.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageMessages
            ]
          })),
          ownerPermissions(interaction.guild)
        ]
      });

      const closeButton =
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("🔒 Zavřít ticket")
          .setStyle(ButtonStyle.Danger);

      await ticket.send({
        content:
          `<@${interaction.user.id}>`,
        embeds: [
          new EmbedBuilder()
            .setTitle("🎫 Nový ticket")
            .setDescription(
              `**Typ:** ${typeNames[type]}\n\n` +
              "Popiš zde co nejpřesněji svůj problém. " +
              "Pokud řešíš hráče, uveď Roblox jméno, čas, " +
              "popis situace a pokud možno důkazy.\n\n" +
              "Administrace se ti bude věnovat co nejdříve."
            )
            .setColor("#5865F2")
            .setTimestamp()
        ],
        components: [
          new ActionRowBuilder().addComponents(
            closeButton
          )
        ]
      });

      return interaction.reply({
        content:
          `✅ Ticket byl vytvořen: ${ticket}`,
        ephemeral: true
      });
    }

    /*
     * ==========================
     * ZAVŘENÍ TICKETU
     * ==========================
     */

    if (
      interaction.isButton() &&
      interaction.customId ===
        "close_ticket"
    ) {

      const allowed =
        interaction.member.roles.cache.some(role =>
          [
            ROLE_NAMES.admin,
            ROLE_NAMES.moderator,
            ROLE_NAMES.management,
            ROLE_NAMES.owner
          ].includes(role.name)
        ) ||
        interaction.guild.ownerId ===
          interaction.user.id;

      if (!allowed) {
        return interaction.reply({
          content:
            "❌ Ticket může zavřít pouze administrace.",
          ephemeral: true
        });
      }

      await interaction.reply(
        "🔒 Ticket bude za chvíli uzavřen."
      );

      setTimeout(async () => {
        await interaction.channel
          .delete("Ticket uzavřen administrací")
          .catch(() => {});
      }, 3000);
    }

  } catch (error) {

    console.error(
      "❌ Interaction error:",
      error
    );

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

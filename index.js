const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  ChannelType,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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

if (!TOKEN) {
  console.error("❌ Chybí DISCORD_TOKEN v Railway Variables.");
  process.exit(1);
}

/* =========================================================
   POMOCNÉ FUNKCE
========================================================= */

async function findOrCreateRole(guild, name, color) {
  let role = guild.roles.cache.find(r => r.name === name);

  if (!role) {
    role = await guild.roles.create({
      name,
      color,
      reason: "Imperial CZ/SK RP Setup"
    });
  }

  return role;
}

async function findOrCreateCategory(guild, name, overwrites = []) {
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

async function findOrCreateChannel(
  guild,
  name,
  parent,
  overwrites = []
) {
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

async function sendIfEmpty(channel, message) {
  const messages = await channel.messages.fetch({
    limit: 10
  });

  if (messages.size === 0) {
    await channel.send(message);
  }
}

/* =========================================================
   ROLE
========================================================= */

const roleDefinitions = [
  ["👑 Majitel", "FF0000"],
  ["💎 Spolumajitel", "FF00FF"],
  ["🏆 Zakladatel", "FFD700"],
  ["🧠 Ředitel projektu", "9B59B6"],
  ["📋 Vedoucí projektu", "3498DB"],
  ["📱 Vedoucí médií", "E91E63"],
  ["🎉 Vedoucí eventů", "F1C40F"],
  ["🤝 Vedoucí partnerství", "1ABC9C"],
  ["👥 Vedoucí náboru", "2ECC71"],
  ["⚙️ Vývojář", "95A5A6"],

  ["👑 Hlavní administrátor", "C0392B"],
  ["🔴 Senior administrátor", "E74C3C"],
  ["🟠 Administrátor", "E67E22"],
  ["🟡 Junior administrátor", "F1C40F"],
  ["⚪ Zkušební administrátor", "7F8C8D"],

  ["🚓 Velitel policie", "2980DB"],
  ["👮 Policista", "3498DB"],

  ["🚒 Velitel hasičů", "C0392B"],
  ["🔥 Hasič", "E74C3C"],

  ["🚑 Velitel záchranářů", "27AE60"],
  ["🩺 Záchranář", "2ECC71"],

  ["⭐ Event tým", "9B59B6"],
  ["💎 Podporovatel", "00FFFF"],
  ["🏆 VIP", "FFD700"],
  ["🎮 Člen", "5865F2"]
];

/* =========================================================
   COMMAND
========================================================= */

const setupCommand = new SlashCommandBuilder()
  .setName("setup")
  .setDescription(
    "Vytvoří kompletní strukturu Imperial CZ/SK RP."
  )
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Administrator
  );

/* =========================================================
   READY
========================================================= */

client.once("ready", async () => {
  console.log(
    `✅ Imperial CZ/SK RP je online jako ${client.user.tag}`
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
          body: [setupCommand.toJSON()]
        }
      );

      console.log(
        `✅ /setup registrován na ${guild.name}`
      );
    } catch (error) {
      console.error(
        "❌ Chyba registrace /setup:",
        error
      );
    }
  }
});

/* =========================================================
   SETUP
========================================================= */

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName !== "setup") return;

  if (
    !interaction.memberPermissions.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    return interaction.reply({
      content:
        "❌ Tento příkaz může použít pouze administrátor.",
      ephemeral: true
    });
  }

  await interaction.deferReply({
    ephemeral: true
  });

  try {
    const guild = interaction.guild;

    /* =========================
       VYTVOŘENÍ ROLÍ
    ========================= */

    const roles = {};

    for (const [name, color] of roleDefinitions) {
      roles[name] = await findOrCreateRole(
        guild,
        name,
        color
      );
    }

    const everyone = guild.roles.everyone;

    /* =========================
       ADMIN OPRÁVNĚNÍ
    ========================= */

    const adminRoleIds = [
      roles["👑 Hlavní administrátor"].id,
      roles["🔴 Senior administrátor"].id,
      roles["🟠 Administrátor"].id,
      roles["🟡 Junior administrátor"].id,
      roles["⚪ Zkušební administrátor"].id
    ];

    const managementRoleIds = [
      roles["👑 Majitel"].id,
      roles["💎 Spolumajitel"].id,
      roles["🏆 Zakladatel"].id,
      roles["🧠 Ředitel projektu"].id,
      roles["📋 Vedoucí projektu"].id,
      roles["📱 Vedoucí médií"].id,
      roles["🎉 Vedoucí eventů"].id,
      roles["🤝 Vedoucí partnerství"].id,
      roles["👥 Vedoucí náboru"].id
    ];

    const adminOverwrites = [
      {
        id: everyone.id,
        deny: [
          PermissionsBitField.Flags.ViewChannel
        ]
      }
    ];

    for (const roleId of adminRoleIds) {
      adminOverwrites.push({
        id: roleId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      });
    }

    const managementOverwrites = [
      {
        id: everyone.id,
        deny: [
          PermissionsBitField.Flags.ViewChannel
        ]
      }
    ];

    for (const roleId of managementRoleIds) {
      managementOverwrites.push({
        id: roleId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      });
    }

    const logOverwrites = [
      {
        id: everyone.id,
        deny: [
          PermissionsBitField.Flags.ViewChannel
        ]
      }
    ];

    for (const roleId of adminRoleIds) {
      logOverwrites.push({
        id: roleId,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      });
    }

    /* =====================================================
       INFORMACE
    ===================================================== */

    const info = await findOrCreateCategory(
      guild,
      "📌 INFORMACE"
    );

    const ozn = await findOrCreateChannel(
      guild,
      "📢・oznámení",
      info
    );

    const rules = await findOrCreateChannel(
      guild,
      "📜・pravidla",
      info
    );

    const rpRules = await findOrCreateChannel(
      guild,
      "🎭・rp-pravidla",
      info
    );

    const start = await findOrCreateChannel(
      guild,
      "🎮・jak-začít",
      info
    );

    const faq = await findOrCreateChannel(
      guild,
      "❓・faq",
      info
    );

    const infoChannel = await findOrCreateChannel(
      guild,
      "ℹ️・informace-o-serveru",
      info
    );

    /* =====================================================
       HRA
    ===================================================== */

    const game = await findOrCreateCategory(
      guild,
      "🎮 HRA"
    );

    const map = await findOrCreateChannel(
      guild,
      "🗺️・mapa-emergency",
      game
    );

    const locations = await findOrCreateChannel(
      guild,
      "📍・lokace",
      game
    );

    const jobs = await findOrCreateChannel(
      guild,
      "💼・jobs",
      game
    );

    const economy = await findOrCreateChannel(
      guild,
      "💰・ekonomika",
      game
    );

    const vehicles = await findOrCreateChannel(
      guild,
      "🚗・vozidla",
      game
    );

    const properties = await findOrCreateChannel(
      guild,
      "🏠・pozemky",
      game
    );

    const businesses = await findOrCreateChannel(
      guild,
      "🏢・podniky",
      game
    );

    /* =====================================================
       KOMUNITA
    ===================================================== */

    const community = await findOrCreateCategory(
      guild,
      "💬 KOMUNITA"
    );

    const chat = await findOrCreateChannel(
      guild,
      "💬・chat",
      community
    );

    const media = await findOrCreateChannel(
      guild,
      "📸・media",
      community
    );

    const events = await findOrCreateChannel(
      guild,
      "🎉・eventy",
      community
    );

    const botCommands = await findOrCreateChannel(
      guild,
      "🤖・bot-příkazy",
      community
    );

    /* =====================================================
       FRAKCE
    ===================================================== */

    const factions = await findOrCreateCategory(
      guild,
      "🚓 FRAKCE"
    );

    const police = await findOrCreateChannel(
      guild,
      "🚓・policie",
      factions
    );

    const firefighters = await findOrCreateChannel(
      guild,
      "🚒・hasiči",
      factions
    );

    const medic = await findOrCreateChannel(
      guild,
      "🚑・záchranáři",
      factions
    );

    const civilian = await findOrCreateChannel(
      guild,
      "👤・civilní-rp",
      factions
    );

    const criminals = await findOrCreateChannel(
      guild,
      "🔫・kriminální-rp",
      factions
    );

    /* =====================================================
       NÁBORY
    ===================================================== */

    const recruitment = await findOrCreateCategory(
      guild,
      "📋 NÁBORY"
    );

    const adminRecruitment = await findOrCreateChannel(
      guild,
      "🛡️・nábor-admin",
      recruitment
    );

    const policeRecruitment = await findOrCreateChannel(
      guild,
      "🚓・nábor-policie",
      recruitment
    );

    const fireRecruitment = await findOrCreateChannel(
      guild,
      "🚒・nábor-hasiči",
      recruitment
    );

    const medicRecruitment = await findOrCreateChannel(
      guild,
      "🚑・nábor-záchranáři",
      recruitment
    );

    /* =====================================================
       TICKETY
    ===================================================== */

    const support = await findOrCreateCategory(
      guild,
      "🎫 TICKETY"
    );

    const ticketChannel = await findOrCreateChannel(
      guild,
      "🎫・vytvořit-ticket",
      support
    );

    const ticketInfo = new EmbedBuilder()
      .setTitle("🎫 Imperial CZ/SK RP — Podpora")
      .setDescription(
        "Potřebuješ pomoc? Vyber typ požadavku níže.\n\n" +
        "🛠️ **Podpora** — obecná pomoc\n" +
        "🚨 **Report** — nahlášení hráče\n" +
        "🏠 **Pozemek** — žádost o pozemek\n" +
        "🏢 **Podnik** — žádost o podnik\n" +
        "👮 **Nábor** — přihláška do týmu\n" +
        "🔓 **Unban** — žádost o zrušení banu\n" +
        "🤝 **Partnerství** — spolupráce\n\n" +
        "Prosíme o slušné jednání se členy týmu."
      )
      .setColor(0x5865F2);

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
          .setCustomId("ticket_unban")
          .setLabel("🔓 Unban")
          .setStyle(ButtonStyle.Secondary)
      );

    await sendIfEmpty(ticketChannel, {
      embeds: [ticketInfo],
      components: [ticketButtons]
    });

    /* =====================================================
       ADMINISTRACE
    ===================================================== */

    const administration =
      await findOrCreateCategory(
        guild,
        "🛡️ ADMINISTRACE",
        adminOverwrites
      );

    const adminChat =
      await findOrCreateChannel(
        guild,
        "🛡️・admin-chat",
        administration,
        adminOverwrites
      );

    const adminRules =
      await findOrCreateChannel(
        guild,
        "📜・pravidla-adminů",
        administration,
        adminOverwrites
      );

    const adminPunishments =
      await findOrCreateChannel(
        guild,
        "⚖️・tresty",
        administration,
        adminOverwrites
      );

    const adminReports =
      await findOrCreateChannel(
        guild,
        "🚨・admin-hlášení",
        administration,
        adminOverwrites
      );

    const adminApplications =
      await findOrCreateChannel(
        guild,
        "📋・admin-nábory",
        administration,
        adminOverwrites
      );

    const adminMeetings =
      await findOrCreateChannel(
        guild,
        "📅・admin-porady",
        administration,
        adminOverwrites
      );

    /* =====================================================
       VEDENÍ
    ===================================================== */

    const management =
      await findOrCreateCategory(
        guild,
        "👑 VEDENÍ",
        managementOverwrites
      );

    const managementChat =
      await findOrCreateChannel(
        guild,
        "👑・vedení",
        management,
        managementOverwrites
      );

    const managementMeetings =
      await findOrCreateChannel(
        guild,
        "📋・porady-vedení",
        management,
        managementOverwrites
      );

    const partnerships =
      await findOrCreateChannel(
        guild,
        "🤝・partnerství",
        management,
        managementOverwrites
      );

    /* =====================================================
       LOGY
    ===================================================== */

    const logs =
      await findOrCreateCategory(
        guild,
        "📊 LOGY",
        logOverwrites
      );

    const memberLog =
      await findOrCreateChannel(
        guild,
        "📥・member-log",
        logs,
        logOverwrites
      );

    const modLog =
      await findOrCreateChannel(
        guild,
        "🔨・mod-log",
        logs,
        logOverwrites
      );

    const ticketLog =
      await findOrCreateChannel(
        guild,
        "🎫・ticket-log",
        logs,
        logOverwrites
      );

    const roleLog =
      await findOrCreateChannel(
        guild,
        "🏷️・role-log",
        logs,
        logOverwrites
      );

    /* =====================================================
       AUTOMATICKÉ ZPRÁVY
    ===================================================== */

    await sendIfEmpty(
      ozn,
      new EmbedBuilder()
        .setTitle("📢 Imperial CZ/SK RP")
        .setDescription(
          "Vítej na oficiálním Discord serveru **Imperial CZ/SK RP**!\n\n" +
          "Zde najdeš informace o našem Emergency Hamburg RP, náborech, eventech, frakcích a komunitě.\n\n" +
          "🔥 Bav se, respektuj ostatní a dodržuj pravidla."
        )
        .setColor(0x5865F2)
    );

    await sendIfEmpty(
      rules,
      new EmbedBuilder()
        .setTitle("📜 PRAVIDLA DISCORDU")
        .setDescription(
          "**1.** Chovej se slušně k ostatním.\n" +
          "**2.** Zákaz spamování a floodování.\n" +
          "**3.** Zákaz reklamy bez povolení vedení.\n" +
          "**4.** Zákaz obtěžování a vyhrožování.\n" +
          "**5.** Nepoužívej obsah, který porušuje pravidla Discordu.\n" +
          "**6.** Respektuj rozhodnutí administrace.\n" +
          "**7.** Nezneužívej boty ani chyby serveru.\n" +
          "**8.** Zákaz vydávání se za členy vedení.\n\n" +
          "Porušení pravidel může vést k timeoutu, kicku nebo banu."
        )
        .setColor(0xE74C3C)
    );

    await sendIfEmpty(
      rpRules,
      new EmbedBuilder()
        .setTitle("🎭 RP PRAVIDLA")
        .setDescription(
          "**FailRP** — jednání mimo realitu RP.\n" +
          "**RDM** — bezdůvodné zabíjení hráčů.\n" +
          "**VDM** — bezdůvodné najíždění vozidlem do hráčů.\n" +
          "**NLR** — návrat do situace po smrti bez respektování pravidel.\n" +
          "**Metagaming** — používání informací získaných mimo RP.\n" +
          "**Powergaming** — nucení nereálných akcí na ostatní hráče.\n" +
          "**Combat logging** — odpojení během RP situace.\n" +
          "**FearRP** — respektování ohrožení života.\n" +
          "**Cop baiting** — úmyslné provokování policie bez RP důvodu.\n\n" +
          "Vždy se snaž o realistické a zábavné RP."
        )
        .setColor(0x9B59B6)
    );

    await sendIfEmpty(
      start,
      new EmbedBuilder()
        .setTitle("🎮 JAK ZAČÍT")
        .setDescription(
          "1️⃣ Přečti si pravidla.\n" +
          "2️⃣ Připoj se do Emergency Hamburg.\n" +
          "3️⃣ Vyber si RP roli.\n" +
          "4️⃣ Dodržuj RP pravidla.\n" +
          "5️⃣ Pro pomoc použij ticket.\n\n" +
          "Užij si své RP na **Imperial CZ/SK RP**!"
        )
        .setColor(0x2ECC71)
    );

    await sendIfEmpty(
      faq,
      new EmbedBuilder()
        .setTitle("❓ FAQ")
        .setDescription(
          "**Jak získám roli?**\n" +
          "Sleduj informace a nábory.\n\n" +
          "**Jak nahlásím hráče?**\n" +
          "Použij ticket.\n\n" +
          "**Jak požádám o pozemek?**\n" +
          "Použij ticket v sekci pozemků.\n\n" +
          "**Jak požádám o unban?**\n" +
          "Vytvoř ticket typu Unban."
        )
        .setColor(0x3498DB)
    );

    await sendIfEmpty(
      infoChannel,
      new EmbedBuilder()
        .setTitle("ℹ️ O SERVERU")
        .setDescription(
          "**Název:** Imperial CZ/SK RP\n" +
          "**Hra:** Emergency Hamburg\n" +
          "**Komunita:** CZ/SK\n" +
          "**Typ:** Emergency Hamburg RP\n\n" +
          "Cílem serveru je vytvořit kvalitní, férovou a zábavnou RP komunitu."
        )
        .setColor(0x5865F2)
    );

    await sendIfEmpty(
      map,
      new EmbedBuilder()
        .setTitle("🗺️ MAPA EMERGENCY HAMBURG")
        .setDescription(
          "Tento kanál slouží pro mapu a důležité lokace Emergency Hamburg.\n\n" +
          "📍 Přehled lokací\n" +
          "🚓 Policejní stanice\n" +
          "🚒 Hasičské stanice\n" +
          "🚑 Zdravotnická zařízení\n" +
          "🏦 Banka\n" +
          "💎 Klenotnictví\n" +
          "⛽ Čerpací stanice\n" +
          "🚉 Nádraží\n" +
          "🏭 Průmyslové oblasti\n\n" +
          "Aktuální mapu doporučujeme používat podle aktuální verze hry."
        )
        .setColor(0x2ECC71)
    );

    await sendIfEmpty(
      locations,
      "📍 **DŮLEŽITÉ LOKACE**\n\n" +
      "🚓 Policie\n" +
      "🚒 Hasiči\n" +
      "🚑 Záchranka\n" +
      "🏦 Banka\n" +
      "💎 Klenotnictví\n" +
      "⛽ Čerpací stanice\n" +
      "🚉 Nádraží\n" +
      "🏭 Průmyslové oblasti\n\n" +
      "Další lokace mohou být přidány vedením."
    );

    await sendIfEmpty(
      jobs,
      "💼 **JOBS / POVOLÁNÍ**\n\n" +
      "👮 Policie\n" +
      "🚒 Hasiči\n" +
      "🚑 Záchranáři\n" +
      "🚌 Doprava\n" +
      "🔧 Mechanik\n" +
      "🚛 Kamionová doprava\n" +
      "👤 Civilista\n" +
      "🔫 Kriminální RP\n\n" +
      "Aktuální dostupnost povolání se řídí hrou a pravidly serveru."
    );

    await sendIfEmpty(
      economy,
      "💰 **EKONOMIKA RP**\n\n" +
      "Ekonomika slouží k vytvoření realistického RP.\n\n" +
      "💵 Peníze získávej pouze RP způsobem.\n" +
      "🏠 Nákupy eviduj přes Discord.\n" +
      "🏢 Podniky musí být schválené vedením.\n" +
      "🚫 Zákaz podvodů mimo schválené RP situace."
    );

    await sendIfEmpty(
      vehicles,
      "🚗 **PRAVIDLA VOZIDEL**\n\n" +
      "• Jezdi realisticky.\n" +
      "• Nezneužívej vozidla k VDM.\n" +
      "• Respektuj dopravní situace.\n" +
      "• Používej vhodná vozidla pro svou RP roli.\n" +
      "• Závody pořádej pouze v určených RP situacích."
    );

    await sendIfEmpty(
      properties,
      new EmbedBuilder()
        .setTitle("🏠 POZEMKY")
        .setDescription(
          "Pozemky jsou součástí našeho RP systému.\n\n" +
          "🏠 Chceš pozemek?\n" +
          "➡️ Vytvoř ticket.\n\n" +
          "V ticketu uveď:\n" +
          "• Discord jméno\n" +
          "• požadované místo\n" +
          "• účel pozemku\n" +
          "• případně screenshot místa\n\n" +
          "💰 Ceny pozemků stanovuje vedení podle konkrétní nabídky."
        )
        .setColor(0xF1C40F)
    );

    await sendIfEmpty(
      businesses,
      new EmbedBuilder()
        .setTitle("🏢 PODNIKY")
        .setDescription(
          "Chceš vlastnit RP podnik?\n\n" +
          "🏪 Obchod\n" +
          "🍔 Restaurace\n" +
          "🔧 Autoservis\n" +
          "⛽ Čerpací stanice\n" +
          "🏢 Jiný RP podnik\n\n" +
          "Žádost vytvoř přes ticket."
        )
        .setColor(0x3498DB)
    );

    await sendIfEmpty(
      chat,
      "💬 **Vítej v chatu Imperial CZ/SK RP!**\n\n" +
      "Bav se, seznamuj se a respektuj ostatní. ❤️"
    );

    await sendIfEmpty(
      events,
      "🎉 **EVENTY**\n\n" +
      "Zde budou zveřejňovány RP eventy, závody, srazy a další akce.\n\n" +
      "📢 Sleduj oznámení, ať ti nic neuteče!"
    );

    await sendIfEmpty(
      botCommands,
      "🤖 **BOT PŘÍKAZY**\n\n" +
      "`/setup` — nastaví server\n" +
      "Další příkazy budou přidány v dalších verzích bota."
    );

    await sendIfEmpty(
      police,
      "🚓 **POLICIE**\n\n" +
      "Kanál pro informace týkající se policejního RP.\n\n" +
      "Dodržuj pravidla RP a pokyny vedení frakce."
    );

    await sendIfEmpty(
      firefighters,
      "🚒 **HASIČI**\n\n" +
      "Kanál pro informace týkající se hasičského RP."
    );

    await sendIfEmpty(
      medic,
      "🚑 **ZÁCHRANÁŘI**\n\n" +
      "Kanál pro informace týkající se zdravotnického RP."
    );

    await sendIfEmpty(
      civilian,
      "👤 **CIVILNÍ RP**\n\n" +
      "Prostor pro civilní RP, podnikání, dopravu a běžný život."
    );

    await sendIfEmpty(
      criminals,
      "🔫 **KRIMINÁLNÍ RP**\n\n" +
      "Kriminální RP musí mít důvod a musí respektovat pravidla serveru.\n\n" +
      "Zákaz RDM, VDM, FailRP a dalších porušení pravidel."
    );

    /* =====================================================
       ADMIN PRAVIDLA
    ===================================================== */

    await sendIfEmpty(
      adminRules,
      new EmbedBuilder()
        .setTitle("📜 PRAVIDLA ADMIN TÝMU")
        .setDescription(
          "**1. Nestrannost**\n" +
          "Admin nesmí zneužívat svou pozici ve prospěch sebe nebo kamarádů.\n\n" +
          "**2. Respekt**\n" +
          "Admin komunikuje slušně s hráči i ostatními členy týmu.\n\n" +
          "**3. Důkazy**\n" +
          "Tresty by měly být založené na dostupných důkazech.\n\n" +
          "**4. Zneužití pravomocí**\n" +
          "Zneužití administrátorských pravomocí může vést k odebrání role.\n\n" +
          "**5. Soukromí**\n" +
          "Interní informace administrace se nesmí bezdůvodně zveřejňovat.\n\n" +
          "**6. Konflikt zájmů**\n" +
          "Admin by neměl rozhodovat vlastní spor bez dalšího člena týmu.\n\n" +
          "**7. Eskalace**\n" +
          "Závažné případy předávej vyššímu administrátorovi.\n\n" +
          "**8. Aktivita**\n" +
          "Admin má být aktivní a sledovat důležité informace."
        )
        .setColor(0xE74C3C)
    );

    await sendIfEmpty(
      adminPunishments,
      new EmbedBuilder()
        .setTitle("⚖️ TRESTNÍ SYSTÉM")
        .setDescription(
          "Trest se vždy přizpůsobuje závažnosti situace a historii hráče.\n\n" +
          "🟢 **Upozornění** — drobné porušení.\n" +
          "🟡 **Warn** — opakované nebo závažnější porušení.\n" +
          "🟠 **Timeout** — nevhodné chování / spam.\n" +
          "🔴 **Kick** — závažné narušování serveru.\n" +
          "⛔ **Ban** — závažné nebo opakované porušování.\n" +
          "🚫 **Permanentní ban** — extrémně závažné případy.\n\n" +
          "Admin má vždy uvést důvod trestu.\n" +
          "Tresty nesmí být používány k osobní mstě."
        )
        .setColor(0xF1C40F)
    );

    await sendIfEmpty(
      adminChat,
      "🛡️ **ADMIN CHAT**\n\n" +
      "Interní komunikace administrace.\n" +
      "Respektujte ostatní členy týmu a zachovávejte profesionalitu."
    );

    await sendIfEmpty(
      adminReports,
      "🚨 **ADMIN HLÁŠENÍ**\n\n" +
      "Sem zapisujte závažné případy, které vyžadují řešení vedení.\n\n" +
      "U každého případu uvádějte:\n" +
      "• hráče\n" +
      "• datum/čas\n" +
      "• popis situace\n" +
      "• důkazy\n" +
      "• navrhované řešení"
    );

    await sendIfEmpty(
      adminApplications,
      "📋 **NÁBOR ADMIN TÝMU**\n\n" +
      "Nábory do administrace probíhají podle rozhodnutí vedení.\n\n" +
      "Doporučený postup:\n" +
      "1. Přihláška\n" +
      "2. Kontrola aktivity\n" +
      "3. Pohovor\n" +
      "4. Zkušební období\n" +
      "5. Rozhodnutí vedení"
    );

    await sendIfEmpty(
      adminMeetings,
      "📅 **ADMIN PORADY**\n\n" +
      "Zde se budou řešit interní porady administrace, změny pravidel a důležitá rozhodnutí."
    );

    /* =====================================================
       VEDENÍ
    ===================================================== */

    await sendIfEmpty(
      managementChat,
      "👑 **VEDENÍ IMPERIAL CZ/SK RP**\n\n" +
      "Interní prostor pro vedení projektu."
    );

    await sendIfEmpty(
      managementMeetings,
      "📋 **PORADY VEDENÍ**\n\n" +
      "Zde se plánují porady, změny systému, nové projekty a důležitá rozhodnutí."
    );

    await sendIfEmpty(
      partnerships,
      "🤝 **PARTNERSTVÍ**\n\n" +
      "Žádosti o partnerství řeší vedení projektu.\n\n" +
      "Veřejné partnerství bez schválení není povoleno."
    );

    /* =====================================================
       NÁBORY
    ===================================================== */

    await sendIfEmpty(
      adminRecruitment,
      "🛡️ **NÁBOR ADMIN TÝMU**\n\n" +
      "Chceš se přidat do administrace?\n\n" +
      "Sleduj aktuální náborové informace a postupuj podle pokynů vedení."
    );

    await sendIfEmpty(
      policeRecruitment,
      "🚓 **NÁBOR POLICIE**\n\n" +
      "Přihlášky do policejní frakce budou zveřejněny zde."
    );

    await sendIfEmpty(
      fireRecruitment,
      "🚒 **NÁBOR HASIČŮ**\n\n" +
      "Přihlášky do hasičské frakce budou zveřejněny zde."
    );

    await sendIfEmpty(
      medicRecruitment,
      "🚑 **NÁBOR ZÁCHRANÁŘŮ**\n\n" +
      "Přihlášky do zdravotnické frakce budou zveřejněny zde."
    );

    /* =====================================================
       LOGY
    ===================================================== */

    await sendIfEmpty(
      memberLog,
      "📥 **MEMBER LOG**\n\n" +
      "Kanál určený pro budoucí automatické logování členů."
    );

    await sendIfEmpty(
      modLog,
      "🔨 **MOD LOG**\n\n" +
      "Kanál určený pro budoucí logování moderace."
    );

    await sendIfEmpty(
      ticketLog,
      "🎫 **TICKET LOG**\n\n" +
      "Kanál určený pro budoucí logování ticketů."
    );

    await sendIfEmpty(
      roleLog,
      "🏷️ **ROLE LOG**\n\n" +
      "Kanál určený pro budoucí logování změn rolí."
    );

    /* =====================================================
       HOTOVO
    ===================================================== */

    await interaction.editReply(
      "✅ **Imperial CZ/SK RP – Setup dokončen!**\n\n" +
      "👑 Role vytvořeny\n" +
      "📁 Kategorie vytvořeny\n" +
      "💬 Textové kanály vytvořeny\n" +
      "📜 Pravidla vložena\n" +
      "🎭 RP pravidla vložena\n" +
      "🛡️ Admin sekce zabezpečena\n" +
      "👑 Vedení zabezpečeno\n" +
      "⚖️ Trestní systém vložen\n" +
      "🎫 Ticket panel vytvořen\n" +
      "🏠 Pozemky připraveny\n" +
      "🏢 Podniky připraveny\n" +
      "🗺️ Mapa připravena\n" +
      "🚓 Frakce připraveny\n" +
      "📊 Logy připraveny\n\n" +
      "🔥 **Imperial CZ/SK RP je připraven!**"
    );

  } catch (error) {
    console.error(
      "❌ Chyba při Imperial setup:",
      error
    );

    if (interaction.deferred) {
      await interaction.editReply(
        "❌ Setup narazil na chybu.\n\n" +
        "Zkontroluj oprávnění bota a jeho pozici mezi rolemi."
      );
    }
  }
});

/* =========================================================
   TICKET TLAČÍTKA – ZATÍM ZÁKLAD
========================================================= */

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const ticketTypes = {
    ticket_support: "🛠️ Podpora",
    ticket_report: "🚨 Report",
    ticket_property: "🏠 Pozemek",
    ticket_unban: "🔓 Unban"
  };

  const type = ticketTypes[interaction.customId];

  if (!type) return;

  await interaction.reply({
    content:
      `🎫 Vybral jsi **${type}**.\n\n` +
      "Kompletní automatické vytváření ticket místností přidáme v další části systému.",
    ephemeral: true
  });
});

client.login(TOKEN);

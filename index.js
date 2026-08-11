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
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const fs = require("fs");
const path = require("path");

// =====================================================
// CLIENT
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

const DATA_FILE = path.join(__dirname, "staff-hours.json");

let data = {
  users: {},
  raid: {}
};

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    }

    if (!data.users) data.users = {};
    if (!data.raid) data.raid = {};

  } catch (error) {
    console.error("❌ Chyba při načítání dat:", error);
    data = {
      users: {},
      raid: {}
    };
  }
}

function saveData() {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(data, null, 2)
    );
  } catch (error) {
    console.error("❌ Chyba při ukládání dat:", error);
  }
}

loadData();

// =====================================================
// ROLE
// =====================================================

const ROLE_CONFIG = [
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
  if (!member || !member.roles) return false;

  return member.roles.cache.some(role =>
    STAFF_ROLES.includes(role.name)
  );
}

function isManagement(member) {
  if (!member || !member.roles) return false;

  return member.roles.cache.some(role =>
    MANAGEMENT_ROLES.includes(role.name)
  );
}

async function getOrCreateRole(guild, name, color) {
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

async function getOrCreateCategory(
  guild,
  name,
  overwrites = []
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
      permissionOverwrites: overwrites
    });
  }

  if (overwrites.length) {
    try {
      await category.permissionOverwrites.set(
        overwrites
      );
    } catch {}
  }

  return category;
}

async function getOrCreateChannel(
  guild,
  name,
  parent,
  overwrites = []
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
      permissionOverwrites: overwrites
    });
  } else {
    if (channel.parentId !== parent.id) {
      try {
        await channel.setParent(parent.id);
      } catch {}
    }

    if (overwrites.length) {
      try {
        await channel.permissionOverwrites.set(
          overwrites
        );
      } catch {}
    }
  }

  return channel;
}

async function sendOnce(channel, content) {
  try {
    const messages = await channel.messages.fetch({
      limit: 20
    });

    const existing = messages.find(
      m => m.author.id === client.user.id
    );

    if (!existing) {
      await channel.send(content);
    }
  } catch (error) {
    console.error(
      `❌ Chyba v kanálu ${channel.name}:`,
      error.message
    );
  }
}

// =====================================================
// PERMISSIONS
// =====================================================

function staffPermissions(guild) {
  const overwrites = [
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
      overwrites.push({
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

  return overwrites;
}

function managementPermissions(guild) {
  const overwrites = [
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

  return overwrites;
}

// =====================================================
// TEXT
// =====================================================

const TEXT = {

  welcome: `
👑 **VÍTEJ NA IMPERIAL CZ/SK RP**

Vítej na našem Discord serveru.

Imperial CZ/SK je RP komunita zaměřená na Emergency Hamburg v Robloxu.

🎭 Naším cílem je vytvořit prostředí, kde má RP smysl, hráči spolupracují a pravidla platí pro všechny.

🚓 Policie
🚒 Hasiči
🚑 Záchranáři
🏢 Podniky
🏠 Pozemky
🎉 Eventy
🛡️ Staff tým

📢 Sleduj oznámení a informace na serveru.

Užij si hru a hlavně kvalitní RP!
`,

  rules: `
📜 **PRAVIDLA DISCORDU**

1️⃣ Respektuj ostatní členy.
2️⃣ Zákaz šikany a cíleného obtěžování.
3️⃣ Zákaz spamu a floodu.
4️⃣ Zákaz nevyžádané reklamy.
5️⃣ Nevydávej se za staff.
6️⃣ Nesdílej cizí osobní údaje.
7️⃣ Nevyvolávej zbytečné konflikty.
8️⃣ Dodržuj pravidla Discordu.
9️⃣ Respektuj rozhodnutí moderace.
🔟 Závažné problémy řeš přes ticket.

⚠️ Porušení pravidel může vést k warnu, timeoutu, kicku nebo banu.
`,

  rpRules: `
🎭 **RP PRAVIDLA**

🔹 **FailRP**
Nerealistické nebo nesmyslné chování v RP.

🔹 **RDM**
Napadení nebo zabití bez RP důvodu.

🔹 **VDM**
Použití vozidla jako zbraně bez RP důvodu.

🔹 **NLR**
Po smrti se nesmíš bezdůvodně vracet do stejné situace.

🔹 **Metagaming**
Používání informací získaných mimo RP.

🔹 **Powergaming**
Nucení nereálných akcí druhému hráči.

🔹 **FearRP**
Při ohrožení života musí postava reagovat realisticky.

🔹 **Combat Logging**
Odpojení během probíhající RP situace.

🔹 **Cop Baiting**
Úmyslné nesmyslné provokování policie.

🔹 **Revenge RP**
Pomsta za událost, kterou si postava nemá pamatovat.

🎭 Hraj realisticky a respektuj ostatní.
`,

  applications: `
📋 **NÁBOR DO STAFF TÝMU**

Chceš se stát součástí Imperial Staff Teamu?

🛡️ Hledáme hlavně:
• aktivní hráče
• férové lidi
• zkušené RP hráče
• lidi schopné řešit konflikty
• členy, kteří znají pravidla

📝 Přihlášku vytvoříš přes ticket.

Každá přihláška se posuzuje individuálně.

⚠️ Lhaní v přihlášce může vést k zamítnutí.
`,

  staffInfo: `
🛡️ **STAFF INFO**

Staff musí být:
• nestranný
• aktivní
• slušný
• zodpovědný
• důsledný

📌 Při reportu:
1. Vyslechni obě strany.
2. Zkontroluj důkazy.
3. Zkontroluj pravidla.
4. Rozhodni nestranně.
5. Závažné případy předávej Senior Adminovi.
`,

  events: `
🎉 **EVENTY**

Na serveru mohou probíhat například:

🚗 Car Meet
🏁 Závody
🚓 Policejní akce
🚒 Hasičský zásah
🚑 Hromadná nehoda
🚨 Policejní honička
🏦 Bankovní loupež
💎 Loupež klenotnictví
🚧 Dopravní uzavírka
🎭 Velké městské RP
🏆 Turnaje
🎁 Soutěže

📢 Aktuální eventy budou zveřejněny zde.
`,

  properties: `
🏠 **POZEMKY**

Chceš vlastní RP pozemek?

Vytvoř ticket a uveď:

👤 Discord jméno
📍 Požadované místo
🏠 Typ pozemku
📝 Účel
📸 Případný screenshot

👑 Vedení žádost schválí nebo zamítne.
`,

  businesses: `
🏢 **PODNIKY**

Možné RP podniky:

🍔 Restaurace
🔧 Autoservis
🏪 Obchod
⛽ Čerpací stanice
🏢 Firma

O podnik požádej přes ticket.

Vedení může žádost schválit, upravit nebo zamítnout.
`,

  shifts: `
⏱️ **STAFF SMĚNY**

🟢 \`!startshift\`
Začne směnu.

🔴 \`!endshift\`
Ukončí směnu.

🟡 \`!shift\`
Zobrazí aktivní směnu.

🏆 \`!myhours\`
Zobrazí tvůj čas.

📊 \`!leaderboard\`
Zobrazí leaderboard.

⚠️ Směna se počítá pouze od startu do konce.
`,

  ticket: `
🎫 **TICKET SYSTÉM**

Vyber si kategorii:

🛠️ Podpora
🚨 Report hráče
🏠 Pozemek
🏢 Podnik
👮 Nábor
🔓 Unban
🤝 Partnerství

🔒 Každý ticket vidí pouze autor a oprávněný staff.
`
};

// =====================================================
// TIME SYSTEM
// =====================================================

function getUserData(user) {
  if (!data.users[user.id]) {
    data.users[user.id] = {
      username: user.username,
      totalSeconds: 0,
      activeSince: null
    };
  }

  data.users[user.id].username =
    user.username;

  return data.users[user.id];
}

function formatTime(seconds) {
  seconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const hours =
    Math.floor(seconds / 3600);

  const minutes =
    Math.floor(
      (seconds % 3600) / 60
    );

  const secs =
    seconds % 60;

  return `${hours} h ${minutes} min ${secs} s`;
}

function getCurrentSeconds(userData) {
  let seconds =
    userData.totalSeconds || 0;

  if (userData.activeSince) {
    seconds += Math.floor(
      (Date.now() -
        userData.activeSince) / 1000
    );
  }

  return seconds;
}

function createLeaderboard() {
  const users =
    Object.entries(data.users)
      .map(([id, user]) => ({
        id,
        username:
          user.username || "Neznámý",
        seconds:
          getCurrentSeconds(user)
      }))
      .sort(
        (a, b) =>
          b.seconds - a.seconds
      );

  if (!users.length) {
    return "Zatím nejsou žádné směny.";
  }

  const medals = [
    "🥇",
    "🥈",
    "🥉"
  ];

  return users
    .slice(0, 10)
    .map((user, index) => {
      const medal =
        medals[index] ||
        `**${index + 1}.**`;

      return `${medal} ${user.username} — **${formatTime(user.seconds)}**`;
    })
    .join("\n");
}

// =====================================================
// LOG
// =====================================================

async function staffLog(guild, text) {
  const channel =
    guild.channels.cache.find(
      c =>
        c.name === "🛡️・staff-log"
    );

  if (!channel) return;

  try {
    await channel.send(text);
  } catch {}
}

// =====================================================
// RAID SYSTEM
// =====================================================

async function lockServer(guild) {
  if (data.raid[guild.id]) return;

  data.raid[guild.id] = {
    locked: true,
    channels: {}
  };

  for (const channel of guild.channels.cache.values()) {
    if (
      channel.type !== ChannelType.GuildText &&
      channel.type !== ChannelType.GuildAnnouncement
    ) {
      continue;
    }

    try {
      const everyone =
        guild.roles.everyone;

      const current =
        channel.permissionOverwrites.cache.get(
          everyone.id
        );

      data.raid[guild.id].channels[
        channel.id
      ] = current
        ? {
            allow:
              current.allow.bitfield.toString(),
            deny:
              current.deny.bitfield.toString()
          }
        : null;

      await channel.permissionOverwrites.edit(
        everyone,
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

  await staffLog(
    guild,
    "🚨 **RAID LOCKDOWN AKTIVOVÁN**\n\nVšechny veřejné kanály byly dočasně uzamčeny."
  );
}

async function unlockServer(guild) {
  const raid =
    data.raid[guild.id];

  if (!raid) return;

  for (const [channelId, permissions] of Object.entries(
    raid.channels
  )) {
    const channel =
      guild.channels.cache.get(
        channelId
      );

    if (!channel) continue;

    try {
      if (permissions) {
        await channel.permissionOverwrites.edit(
          guild.roles.everyone,
          {
            SendMessages:
              !BigInt(permissions.deny) &
              BigInt(
                PermissionsBitField.Flags.SendMessages
              )
          }
        );
      } else {
        await channel.permissionOverwrites.delete(
          guild.roles.everyone
        );
      }
    } catch {}
  }

  delete data.raid[guild.id];

  saveData();

  await staffLog(
    guild,
    "🔓 **RAID LOCKDOWN UKONČEN**\n\nServer byl znovu odemčen."
  );
}

// =====================================================
// SETUP COMMAND
// =====================================================

const setupCommand =
  new SlashCommandBuilder()
    .setName("setup")
    .setDescription(
      "Nastaví Imperial CZ/SK RP server."
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    );

// =====================================================
// RAID COMMAND
// =====================================================

const raidCommand =
  new SlashCommandBuilder()
    .setName("raid")
    .setDescription(
      "Správa ochrany proti raidu."
    )
    .addSubcommand(sub =>
      sub
        .setName("on")
        .setDescription(
          "Uzamkne server."
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("off")
        .setDescription(
          "Odemkne server."
        )
    );

// =====================================================
// READY
// =====================================================

client.once("clientReady", async () => {
  console.log(
    `✅ Bot je online jako ${client.user.tag}`
  );

  const rest =
    new REST({
      version: "10"
    }).setToken(TOKEN);

  for (const guild of client.guilds.cache.values()) {
    try {
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
        `✅ Příkazy registrovány: ${guild.name}`
      );
    } catch (error) {
      console.error(
        `❌ Command error ${guild.name}:`,
        error.message
      );
    }
  }
});

// =====================================================
// SETUP
// =====================================================

client.on(
  "interactionCreate",
  async interaction => {

    if (
      !interaction.isChatInputCommand()
    ) {
      return;
    }

    if (
      interaction.commandName === "setup"
    ) {
      if (
        !interaction.memberPermissions.has(
          PermissionFlagsBits.Administrator
        )
      ) {
        return interaction.reply({
          content:
            "❌ Potřebuješ Administrator.",
          ephemeral: true
        });
      }

      await interaction.deferReply({
        ephemeral: true
      });

      try {
        const guild =
          interaction.guild;

        // ROLE
        for (const [name, color] of ROLE_CONFIG) {
          await getOrCreateRole(
            guild,
            name,
            color
          );
        }

        const staffPerms =
          staffPermissions(guild);

        const managementPerms =
          managementPermissions(guild);

        // INFORMACE
        const info =
          await getOrCreateCategory(
            guild,
            "📌 INFORMACE"
          );

        const welcome =
          await getOrCreateChannel(
            guild,
            "👋・vítej",
            info
          );

        const rules =
          await getOrCreateChannel(
            guild,
            "📜・pravidla",
            info
          );

        const rpRules =
          await getOrCreateChannel(
            guild,
            "🎭・rp-pravidla",
            info
          );

        const applications =
          await getOrCreateChannel(
            guild,
            "📋・přihlášky",
            info,
            staffPerms
          );

        // HRA
        const game =
          await getOrCreateCategory(
            guild,
            "🎮 HRA"
          );

        const properties =
          await getOrCreateChannel(
            guild,
            "🏠・pozemky",
            game
          );

        const businesses =
          await getOrCreateChannel(
            guild,
            "🏢・podniky",
            game
          );

        const economy =
          await getOrCreateChannel(
            guild,
            "💰・ekonomika",
            game
          );

        // KOMUNITA
        const community =
          await getOrCreateCategory(
            guild,
            "💬 KOMUNITA"
          );

        const chat =
          await getOrCreateChannel(
            guild,
            "💬・chat",
            community
          );

        const events =
          await getOrCreateChannel(
            guild,
            "🎉・eventy",
            community
          );

        // STAFF
        const staff =
          await getOrCreateCategory(
            guild,
            "🛡️ STAFF",
            staffPerms
          );

        const staffChat =
          await getOrCreateChannel(
            guild,
            "🛡️・staff-chat",
            staff,
            staffPerms
          );

        const staffInfo =
          await getOrCreateChannel(
            guild,
            "📋・staff-info",
            staff,
            staffPerms
          );

        const staffApplications =
          await getOrCreateChannel(
            guild,
            "📝・staff-nábor",
            staff,
            staffPerms
          );

        const staffShifts =
          await getOrCreateChannel(
            guild,
            "⏱️・staff-směny",
            staff,
            staffPerms
          );

        const leaderboard =
          await getOrCreateChannel(
            guild,
            "🏆・staff-leaderboard",
            staff,
            staffPerms
          );

        const staffLogChannel =
          await getOrCreateChannel(
            guild,
            "🛡️・staff-log",
            staff,
            staffPerms
          );

        // TICKETY
        const tickets =
          await getOrCreateCategory(
            guild,
            "🎫 TICKETY"
          );

        const ticketPanel =
          await getOrCreateChannel(
            guild,
            "🎫・vytvořit-ticket",
            tickets
          );

        // VEDENÍ
        const management =
          await getOrCreateCategory(
            guild,
            "👑 VEDENÍ",
            managementPerms
          );

        const managementChat =
          await getOrCreateChannel(
            guild,
            "👑・vedení",
            management,
            managementPerms
          );

        // TEXTY
        await sendOnce(
          welcome,
          TEXT.welcome
        );

        await sendOnce(
          rules,
          TEXT.rules
        );

        await sendOnce(
          rpRules,
          TEXT.rpRules
        );

        await sendOnce(
          applications,
          TEXT.applications
        );

        await sendOnce(
          events,
          TEXT.events
        );

        await sendOnce(
          properties,
          TEXT.properties
        );

        await sendOnce(
          businesses,
          TEXT.businesses
        );

        await sendOnce(
          chat,
          "💬 **VÍTEJ V KOMUNITĚ**\n\nChovej se slušně a užij si RP."
        );

        await sendOnce(
          economy,
          "💰 **EKONOMIKA RP**\n\nVeškerá ekonomická aktivita musí mít RP původ."
        );

        await sendOnce(
          staffChat,
          "🛡️ **STAFF CHAT**\n\nInterní komunikace staff týmu."
        );

        await sendOnce(
          staffInfo,
          TEXT.staffInfo
        );

        await sendOnce(
          staffApplications,
          "📝 **STAFF NÁBOR**\n\nPřihlášky a hodnocení kandidátů."
        );

        await sendOnce(
          staffShifts,
          TEXT.shifts
        );

        await sendOnce(
          managementChat,
          "👑 **VEDENÍ SERVERU**\n\nInterní komunikace vedení."
        );

        await sendOnce(
          staffLogChannel,
          "🛡️ **STAFF LOG**\n\nAutomatické systémové záznamy."
        );

        // TICKET PANEL
        const messages =
          await ticketPanel.messages.fetch({
            limit: 20
          });

        const panelExists =
          messages.some(
            m =>
              m.author.id ===
              client.user.id
          );

        if (!panelExists) {
          const embed =
            new EmbedBuilder()
              .setTitle(
                "🎫 IMPERIAL TICKET SYSTEM"
              )
              .setDescription(
                TEXT.ticket
              )
              .setColor(0x5865f2)
              .setFooter({
                text:
                  "Imperial CZ/SK • Support System"
              });

          const row =
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId(
                    "ticket_support"
                  )
                  .setLabel(
                    "🛠️ Podpora"
                  )
                  .setStyle(
                    ButtonStyle.Primary
                  ),

                new ButtonBuilder()
                  .setCustomId(
                    "ticket_report"
                  )
                  .setLabel(
                    "🚨 Report"
                  )
                  .setStyle(
                    ButtonStyle.Danger
                  ),

                new ButtonBuilder()
                  .setCustomId(
                    "ticket_property"
                  )
                  .setLabel(
                    "🏠 Pozemek"
                  )
                  .setStyle(
                    ButtonStyle.Success
                  ),

                new ButtonBuilder()
                  .setCustomId(
                    "ticket_business"
                  )
                  .setLabel(
                    "🏢 Podnik"
                  )
                  .setStyle(
                    ButtonStyle.Success
                  )
              );

          const row2 =
            new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId(
                    "ticket_recruitment"
                  )
                  .setLabel(
                    "👮 Nábor"
                  )
                  .setStyle(
                    ButtonStyle.Primary
                  ),

                new ButtonBuilder()
                  .setCustomId(
                    "ticket_unban"
                  )
                  .setLabel(
                    "🔓 Unban"
                  )
                  .setStyle(
                    ButtonStyle.Secondary
                  ),

                new ButtonBuilder()
                  .setCustomId(
                    "ticket_partner"
                  )
                  .setLabel(
                    "🤝 Partnerství"
                  )
                  .setStyle(
                    ButtonStyle.Secondary
                  )
              );

          await ticketPanel.send({
            embeds: [embed],
            components: [
              row,
              row2
            ]
          });
        }

        await updateLeaderboard(
          leaderboard
        );

        await interaction.editReply(
          "✅ **IMPERIAL CZ/SK SETUP HOTOVÝ!**\n\n" +
          "👑 Role: HOTOVO\n" +
          "📌 Informace: HOTOVO\n" +
          "🎮 RP kanály: HOTOVO\n" +
          "🛡️ Staff systém: HOTOVO\n" +
          "⏱️ Směny: HOTOVO\n" +
          "🏆 Leaderboard: HOTOVO\n" +
          "🎫 Tickety: HOTOVO\n" +
          "👑 Vedení: HOTOVO\n" +
          "🚨 Raid ochrana: HOTOVO\n\n" +
          "🔥 Server je připraven."
        );

      } catch (error) {
        console.error(
          "❌ SETUP ERROR:",
          error
        );

        await interaction.editReply(
          "❌ Setup selhal.\n\n" +
          "Podívej se do Railway Logs."
        );
      }

      return;
    }

    // =================================================
    // RAID COMMAND
    // =================================================

    if (
      interaction.commandName ===
      "raid"
    ) {
      if (
        !interaction.memberPermissions.has(
          PermissionFlagsBits.Administrator
        )
      ) {
        return interaction.reply({
          content:
            "❌ Raid ochranu může ovládat pouze administrátor.",
          ephemeral: true
        });
      }

      const action =
        interaction.options.getSubcommand();

      await interaction.deferReply({
        ephemeral: true
      });

      if (action === "on") {
        await lockServer(
          interaction.guild
        );

        return interaction.editReply(
          "🚨 **RAID LOCKDOWN AKTIVOVÁN.**\n\nVeřejné kanály byly uzamčeny."
        );
      }

      if (action === "off") {
        await unlockServer(
          interaction.guild
        );

        return interaction.editReply(
          "🔓 **RAID LOCKDOWN UKONČEN.**\n\nServer byl odemčen."
        );
      }
    }
  }
);

// =====================================================
// TICKET SYSTEM
// =====================================================

const TICKET_TYPES = {
  ticket_support: [
    "podpora",
    "🛠️ Podpora"
  ],
  ticket_report: [
    "report",
    "🚨 Report"
  ],
  ticket_property: [
    "pozemek",
    "🏠 Pozemek"
  ],
  ticket_business: [
    "podnik",
    "🏢 Podnik"
  ],
  ticket_recruitment: [
    "nabor",
    "👮 Nábor"
  ],
  ticket_unban: [
    "unban",
    "🔓 Unban"
  ],
  ticket_partner: [
    "partnerstvi",
    "🤝 Partnerství"
  ]
};

client.on(
  "interactionCreate",
  async interaction => {

    if (!interaction.isButton()) {
      return;
    }

    const type =
      TICKET_TYPES[
        interaction.customId
      ];

    if (!type) {
      return;
    }

    const guild =
      interaction.guild;

    const category =
      guild.channels.cache.find(
        c =>
          c.type ===
            ChannelType.GuildCategory &&
          c.name === "🎫 TICKETY"
      );

    if (!category) {
      return interaction.reply({
        content:
          "❌ Nejdřív použij `/setup`.",
        ephemeral: true
      });
    }

    const channelName =
      `${type[0]}-${interaction.user.id}`;

    const existing =
      guild.channels.cache.find(
        c =>
          c.name ===
          channelName
      );

    if (existing) {
      return interaction.reply({
        content:
          `❌ Už máš ticket: ${existing}`,
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

    for (const name of STAFF_ROLES) {
      const role =
        guild.roles.cache.find(
          r => r.name === name
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
        name: channelName,
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites:
          overwrites
      });

    const embed =
      new EmbedBuilder()
        .setTitle(type[1])
        .setDescription(
          `👤 **Autor:** ${interaction.user}\n\n` +
          "📝 Popiš svůj problém co nejpodrobněji.\n" +
          "📸 Přilož důkazy, pokud je máš.\n\n" +
          "🛡️ Staff se ti bude věnovat."
        )
        .setColor(0x5865f2)
        .setFooter({
          text:
            "Imperial CZ/SK Support"
        });

    const buttons =
      new ActionRowBuilder()
        .addComponents(

          new ButtonBuilder()
            .setCustomId(
              "ticket_claim"
            )
            .setLabel(
              "🛡️ Převzít"
            )
            .setStyle(
              ButtonStyle.Primary
            ),

          new ButtonBuilder()
            .setCustomId(
              "ticket_management"
            )
            .setLabel(
              "👑 Vedení"
            )
            .setStyle(
              ButtonStyle.Secondary
            ),

          new ButtonBuilder()
            .setCustomId(
              "ticket_close"
            )
            .setLabel(
              "🔒 Zavřít"
            )
            .setStyle(
              ButtonStyle.Danger
            )
        );

    await channel.send({
      content:
        `${interaction.user}`,
      embeds: [embed],
      components: [buttons]
    });

    await interaction.reply({
      content:
        `✅ Ticket vytvořen: ${channel}`,
      ephemeral: true
    });
  }
);

// =====================================================
// TICKET ACTIONS
// =====================================================

client.on(
  "interactionCreate",
  async interaction => {

    if (!interaction.isButton()) {
      return;
    }

    if (
      ![
        "ticket_claim",
        "ticket_management",
        "ticket_close"
      ].includes(
        interaction.customId
      )
    ) {
      return;
    }

    if (
      !isStaff(
        interaction.member
      ) &&
      !isManagement(
        interaction.member
      )
    ) {
      return interaction.reply({
        content:
          "❌ Tuto akci může použít pouze staff.",
        ephemeral: true
      });
    }

    if (
      interaction.customId ===
      "ticket_claim"
    ) {
      return interaction.reply(
        `🛡️ Ticket převzal ${interaction.user}.`
      );
    }

    if (
      interaction.customId ===
      "ticket_management"
    ) {
      for (
        const name of MANAGEMENT_ROLES
      ) {
        const role =
          interaction.guild.roles.cache.find(
            r => r.name === name
          );

        if (role) {
          try {
            await interaction.channel.permissionOverwrites.edit(
              role.id,
              {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true
              }
            );
          } catch {}
        }
      }

      return interaction.reply(
        "👑 **Ticket byl předán vedení.**"
      );
    }

    if (
      interaction.customId ===
      "ticket_close"
    ) {
      await interaction.reply(
        "🔒 Ticket bude uzavřen za 5 sekund."
      );

      setTimeout(async () => {
        try {
          await interaction.channel.delete(
            "Ticket uzavřen"
          );
        } catch {}
      }, 5000);
    }
  }
);

// =====================================================
// SHIFT COMMANDS
// =====================================================

client.on(
  "messageCreate",
  async message => {

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

    const allowed = [
      "!startshift",
      "!endshift",
      "!shift",
      "!myhours",
      "!leaderboard"
    ];

    if (!allowed.includes(command)) {
      return;
    }

    if (
      !isStaff(
        message.member
      )
    ) {
      return message.reply(
        "❌ Tento příkaz je pouze pro staff."
      );
    }

    const user =
      getUserData(
        message.author
      );

    // START
    if (
      command === "!startshift"
    ) {
      if (user.activeSince) {
        return message.reply(
          "🟡 **Už máš aktivní směnu.**"
        );
      }

      user.activeSince =
        Date.now();

      saveData();

      await message.reply(
        "🟢 **SMĚNA ZAHÁJENA**\n\n" +
        `👤 ${message.author}\n` +
        `🕐 ${new Date().toLocaleString("cs-CZ")}\n\n` +
        "Pro ukončení použij `!endshift`."
      );

      await staffLog(
        message.guild,
        `🟢 **SMĚNA START**\n👤 ${message.author.tag}`
      );

      return;
    }

    // END
    if (
      command === "!endshift"
    ) {
      if (!user.activeSince) {
        return message.reply(
          "🔴 **Nemáš aktivní směnu.**"
        );
      }

      const seconds =
        Math.floor(
          (Date.now() -
            user.activeSince) /
            1000
        );

      user.totalSeconds =
        (user.totalSeconds || 0) +
        seconds;

      user.activeSince =
        null;

      saveData();

      await message.reply(
        "🔴 **SMĚNA UKONČENA**\n\n" +
        `⏱️ Tato směna: **${formatTime(seconds)}**\n` +
        `🏆 Celkem: **${formatTime(user.totalSeconds)}**`
      );

      await staffLog(
        message.guild,
        `🔴 **SMĚNA END**\n👤 ${message.author.tag}\n⏱️ ${formatTime(seconds)}`
      );

      await refreshLeaderboard(
        message.guild
      );

      return;
    }

    // STATUS
    if (
      command === "!shift"
    ) {
      if (!user.activeSince) {
        return message.reply(
          "🔴 **Nemáš aktivní směnu.**"
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

    // HOURS
    if (
      command === "!myhours"
    ) {
      return message.reply(
        `🏆 **Tvůj staff čas:** ${formatTime(
          getCurrentSeconds(user)
        )}`
      );
    }

    // LEADERBOARD
    if (
      command === "!leaderboard"
    ) {
      return message.reply(
        `🏆 **STAFF LEADERBOARD**\n\n${createLeaderboard()}`
      );
    }
  }
);

// =====================================================
// LEADERBOARD
// =====================================================

async function updateLeaderboard(channel) {
  try {
    const messages =
      await channel.messages.fetch({
        limit: 20
      });

    const botMessage =
      messages.find(
        m =>
          m.author.id ===
          client.user.id
      );

    const embed =
      new EmbedBuilder()
        .setTitle(
          "🏆 IMPERIAL STAFF LEADERBOARD"
        )
        .setDescription(
          createLeaderboard()
        )
        .setColor(0xffd700)
        .setFooter({
          text:
            "Imperial CZ/SK • Aktualizace každou minutu"
        })
        .setTimestamp();

    if (botMessage) {
      await botMessage.edit({
        embeds: [embed]
      });
    } else {
      await channel.send({
        embeds: [embed]
      });
    }
  } catch (error) {
    console.error(
      "❌ Leaderboard error:",
      error.message
    );
  }
}

async function refreshLeaderboard(guild) {
  const channel =
    guild.channels.cache.find(
      c =>
        c.name ===
        "🏆・staff-leaderboard"
    );

  if (!channel) return;

  await updateLeaderboard(
    channel
  );
}

// =====================================================
// AUTO LEADERBOARD
// =====================================================

setInterval(
  async () => {
    for (
      const guild of client.guilds.cache.values()
    ) {
      try {
        await refreshLeaderboard(
          guild
        );
      } catch {}
    }
  },
  60000
);

// =====================================================
// MEMBER LOG
// =====================================================

client.on(
  "guildMemberAdd",
  async member => {
    await staffLog(
      member.guild,
      `📥 **NOVÝ ČLEN**\n👤 ${member.user.tag}\n🆔 ${member.id}`
    );
  }
);

client.on(
  "guildMemberRemove",
  async member => {
    await staffLog(
      member.guild,
      `📤 **ČLEN ODEŠEL**\n👤 ${member.user.tag}\n🆔 ${member.id}`
    );
  }
);

// =====================================================
// ERROR PROTECTION
// =====================================================

client.on(
  "error",
  error => {
    console.error(
      "❌ Discord Client Error:",
      error
    );
  }
);

process.on(
  "unhandledRejection",
  error => {
    console.error(
      "❌ Unhandled Promise Rejection:",
      error
    );
  }
);

process.on(
  "uncaughtException",
  error => {
    console.error(
      "❌ Uncaught Exception:",
      error
    );
  }
);

// =====================================================
// LOGIN
// =====================================================

client.login(TOKEN);

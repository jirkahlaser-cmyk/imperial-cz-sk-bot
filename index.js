```js
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
// CONFIG
// =====================================================

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error("❌ DISCORD_TOKEN není nastavený v Railway.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

// =====================================================
// DATA
// =====================================================

const dataFile = path.join(__dirname, "staff-hours.json");

let staffData = {
  users: {}
};

function loadData() {
  try {
    if (fs.existsSync(dataFile)) {
      staffData = JSON.parse(
        fs.readFileSync(dataFile, "utf8")
      );
    }

    if (!staffData.users) {
      staffData.users = {};
    }

  } catch (error) {
    console.error("❌ Chyba při načítání staff-hours.json:", error);
    staffData = { users: {} };
  }
}

function saveData() {
  try {
    fs.writeFileSync(
      dataFile,
      JSON.stringify(staffData, null, 2)
    );
  } catch (error) {
    console.error("❌ Chyba při ukládání staff-hours.json:", error);
  }
}

loadData();

// =====================================================
// ROLES
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
// ROLE HELPERS
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

  for (const roleName of MANAGEMENT_ROLES) {
    const role = guild.roles.cache.find(
      r => r.name === roleName
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

function publicPermissions(guild) {
  return [
    {
      id: guild.roles.everyone.id,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory
      ]
    }
  ];
}

// =====================================================
// CHANNEL HELPERS
// =====================================================

async function getOrCreateCategory(
  guild,
  name,
  permissionOverwrites
) {
  let category = guild.channels.cache.find(
    channel =>
      channel.type === ChannelType.GuildCategory &&
      channel.name === name
  );

  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      permissionOverwrites
    });
  } else if (permissionOverwrites) {
    await category.permissionOverwrites.set(
      permissionOverwrites
    );
  }

  return category;
}

async function getOrCreateChannel(
  guild,
  name,
  parent,
  permissionOverwrites
) {
  let channel = guild.channels.cache.find(
    channel =>
      channel.type === ChannelType.GuildText &&
      channel.name === name
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildText,
      parent: parent.id,
      permissionOverwrites
    });
  } else {
    if (channel.parentId !== parent.id) {
      await channel.setParent(parent.id);
    }

    if (permissionOverwrites) {
      await channel.permissionOverwrites.set(
        permissionOverwrites
      );
    }
  }

  return channel;
}

async function sendOnce(channel, content, options = {}) {
  const messages = await channel.messages.fetch({
    limit: 20
  });

  const botMessage = messages.find(
    message =>
      message.author.id === client.user.id
  );

  if (!botMessage) {
    await channel.send({
      content,
      ...options
    });
  }
}

// =====================================================
// TEXTS
// =====================================================

const TEXT = {

  rules: `
📜 **PRAVIDLA DISCORD SERVERU — IMPERIAL CZ/SK**

👋 Vítej na našem Discord serveru!

1️⃣ Respektuj ostatní členy.
2️⃣ Zákaz urážek, šikany a cíleného obtěžování.
3️⃣ Zákaz spamu, floodu a zbytečného pingování.
4️⃣ Zákaz reklamy bez povolení vedení.
5️⃣ Nevydávej se za staff nebo jiného člena.
6️⃣ Nesdílej osobní údaje ostatních.
7️⃣ Nepoužívej NSFW obsah mimo povolená místa.
8️⃣ Dodržuj pravidla Discordu.
9️⃣ Respektuj rozhodnutí staff týmu.
🔟 Spory řeš přes ticket.

⚠️ Porušení pravidel může vést k warnu, timeoutu, kicku nebo banu.

❤️ Hlavním cílem je vytvořit přátelskou komunitu pro hráče Emergency Hamburg.
`,

  rpRules: `
🎭 **RP PRAVIDLA — EMERGENCY HAMBURG**

RP znamená RolePlay – hraní role své postavy realistickým způsobem.

🔹 **RDM**
Útok nebo zabití hráče bez odpovídajícího RP důvodu.

🔹 **VDM**
Používání vozidla jako zbraně bez RP důvodu.

🔹 **FailRP**
Nerealistické nebo nesmyslné jednání.

🔹 **Metagaming**
Použití informací získaných mimo RP.

🔹 **Powergaming**
Vynucování nereálných akcí ostatním hráčům.

🔹 **FearRP**
Postava musí reagovat na reálné ohrožení života.

🔹 **NLR**
Po smrti se hráč nemá vracet do předchozí situace.

🔹 **Combat Logging**
Úmyslné odpojení během RP situace.

🔹 **Revenge RP**
Pomsta za událost, kterou si postava nemá pamatovat.

🔹 **Cop Baiting**
Úmyslné nesmyslné provokování policie.

🔹 **NVL**
Ignorování hodnoty vlastního života.

🎭 Hraj realisticky, komunikuj a respektuj ostatní hráče.
`,

  applications: `
📋 **PŘIHLÁŠKY DO STAFF TÝMU**

👋 Chceš se stát součástí Imperial CZ/SK staff týmu?

V přihlášce očekáváme:

👤 Discord jméno
🎮 Roblox jméno
📅 Věk
🕐 Aktivitu
🧠 Zkušenosti se staff pozicí
🎭 RP zkušenosti
💡 Proč chceš být staff
🛠️ Co můžeš serveru nabídnout

⭐ Nejvíce si vážíme aktivity, slušného jednání a schopnosti řešit konflikty.

⚠️ Přihláška automaticky neznamená přijetí.

👑 O přijetí rozhoduje vedení a příslušní členové staff týmu.
`,

  staffInfo: `
🛡️ **STAFF INFO**

Při řešení reportu:

1️⃣ Vyslechni všechny strany.
2️⃣ Získej důkazy.
3️⃣ Zachovej nestrannost.
4️⃣ Zkontroluj pravidla.
5️⃣ Rozhodni přiměřeně.
6️⃣ Závažné případy zapiš.
7️⃣ V případě pochybností kontaktuj Senior Admina.

❌ Staff nesmí zneužívat pravomoci.
❌ Staff nesmí zvýhodňovat kamarády.
❌ Staff nesmí používat OORP informace pro vlastní výhodu.

🛡️ Staff má být příkladem pro komunitu.
`,

  staffPunishments: `
⚖️ **SYSTÉM TRESTŮ**

🟢 UPOZORNĚNÍ
Pro drobné nebo první porušení.

🟡 WARN
Pro opakované nebo závažnější porušení.

🟠 TIMEOUT
Pro toxicitu, spam nebo narušování komunity.

🔴 KICK
Pro závažné narušení serveru.

⛔ TEMP BAN
Pro závažné nebo opakované porušení.

🚫 PERMANENT BAN
Pro extrémně závažné případy.

🛡️ ODEBRÁNÍ STAFF ROLE
Při zneužití pravomocí.

👑 PŘEDÁNÍ VEDENÍ
U velmi závažných nebo sporných případů.

⚠️ Trest musí vždy odpovídat situaci.
`,

  events: `
🎉 **IMPERIAL EVENTY**

Na serveru budou probíhat pravidelné komunitní eventy.

🚗 Car Meet
🏁 Závody
🚓 Policejní akce
🚒 Hasičské zásahy
🚑 Hromadné nehody
🚨 Policejní honičky
🏦 Bankovní loupeže
💎 Loupeže klenotnictví
🎭 Velké RP scénáře
📸 Screenshot eventy
🏆 Soutěže

📢 Každý event bude mít informace o:
• času
• místě
• organizátorovi
• pravidlech
• scénáři
`,

  staffEvents: `
🎉 **STAFF EVENTY**

Tento kanál slouží k přípravě eventů před jejich zveřejněním.

📋 U každého eventu určete:

📅 Datum
🕐 Čas
📍 Místo
👤 Organizátora
🚓 Potřebné složky
📝 Scénář
⚖️ Pravidla
👥 Předpokládaný počet hráčů

💡 Event musí být připraven tak, aby byl férový a zábavný pro všechny.
`,

  properties: `
🏠 **POZEMKY**

O pozemek se žádá přes ticket.

Do žádosti uveď:

👤 Discord jméno
🎮 Roblox jméno
📍 Požadované místo
🏠 Účel pozemku
📸 Screenshot, pokud je potřeba

👑 Vedení žádost schválí nebo zamítne.

⚠️ Discord evidence sama o sobě nemění vlastnictví v Robloxu.
`,

  businesses: `
🏢 **RP PODNIKY**

Na serveru lze vytvořit například:

🍔 Restauraci
🔧 Autoservis
🏪 Obchod
⛽ Čerpací stanici
🏢 Firmu
🚕 Taxi službu

O podnik se žádá přes ticket.

Vedení může žádost:
✅ schválit
✏️ upravit
❌ zamítnout
`,

  economy: `
💰 **RP EKONOMIKA**

Ekonomika slouží k rozvoji RP.

💵 Peníze musí mít RP původ.
🏢 Podniky musí být schválené.
🏠 Pozemky se evidují přes vedení.
🚫 Zákaz zneužívání systému.
🚫 Zákaz OORP výhod.
⚖️ Obchody musí být férové.

🎭 Cílem není jen vydělávat, ale vytvářet kvalitní RP.
`,

  map: `
🗺️ **EMERGENCY HAMBURG**

Imperial CZ/SK využívá hru Emergency Hamburg v Robloxu.

📍 Důležitá místa:

🚓 Policie
🚒 Hasiči
🚑 ZZS
🏦 Banka
💎 Klenotnictví
⛽ Čerpací stanice
🚉 Nádraží
🏭 Průmyslové oblasti
🏙️ Centrum

⚠️ Mapa a herní mechaniky se mohou měnit podle aktualizací hry.
`,

  shift: `
⏱️ **STAFF OORP SMĚNY**

Staff směny slouží k evidenci aktivity staff týmu.

🟢 `/startshift`
Začne směnu.

🔴 `/endshift`
Ukončí směnu.

📊 `/shift`
Zobrazí aktuální směnu.

🏆 `/myhours`
Zobrazí celkový čas.

🥇 `/leaderboard`
Zobrazí staff leaderboard.

⚠️ Čas se počítá od začátku do ukončení směny.
`,

  ticket: `
🎫 **IMPERIAL TICKET SYSTÉM**

Vyber důvod ticketu:

🛠️ Podpora
🚨 Report hráče
🏠 Pozemek
🏢 Podnik
👮 Nábor
🔓 Unban
🤝 Partnerství

🛡️ Staff může ticket převzít.
👑 Ticket lze předat vedení.
🔒 Po vyřešení ticketu se ticket uzavře.
`
};

// =====================================================
// SLASH COMMANDS
// =====================================================

const commands = [

  new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Nastaví celý Imperial CZ/SK server.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    ),

  new SlashCommandBuilder()
    .setName("startshift")
    .setDescription("Začne tvoji staff OORP směnu."),

  new SlashCommandBuilder()
    .setName("endshift")
    .setDescription("Ukončí tvoji staff OORP směnu."),

  new SlashCommandBuilder()
    .setName("shift")
    .setDescription("Zobrazí tvoji aktuální směnu."),

  new SlashCommandBuilder()
    .setName("myhours")
    .setDescription("Zobrazí tvůj celkový staff čas."),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Zobrazí staff leaderboard.")
].map(command => command.toJSON());

// =====================================================
// REGISTER COMMANDS
// =====================================================

async function registerCommands() {

  const rest = new REST({
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
          body: commands
        }
      );

      console.log(
        `✅ Slash příkazy registrovány: ${guild.name}`
      );

    } catch (error) {

      console.error(
        `❌ Chyba registrace příkazů pro ${guild.name}:`,
        error
      );

    }
  }
}

// =====================================================
// READY
// =====================================================

client.once("ready", async () => {

  console.log(
    `✅ Bot je online jako ${client.user.tag}`
  );

  await registerCommands();

  console.log("🚀 Imperial CZ/SK bot je připraven.");
});

// =====================================================
// TIME
// =====================================================

function formatTime(seconds) {

  seconds = Math.max(
    0,
    Math.floor(seconds)
  );

  const hours = Math.floor(
    seconds / 3600
  );

  const minutes = Math.floor(
    (seconds % 3600) / 60
  );

  const secs = seconds % 60;

  return `${hours} h ${minutes} min ${secs} s`;
}

function getCurrentShiftSeconds(user) {

  if (!user.activeSince) {
    return 0;
  }

  return Math.floor(
    (Date.now() - user.activeSince) / 1000
  );
}

// =====================================================
// STAFF USER
// =====================================================

function getStaffUser(user) {

  const id = user.id;

  if (!staffData.users[id]) {

    staffData.users[id] = {
      username: user.username,
      totalSeconds: 0,
      activeSince: null
    };
  }

  staffData.users[id].username =
    user.username;

  return staffData.users[id];
}

// =====================================================
// LEADERBOARD
// =====================================================

function createLeaderboard() {

  const users = Object.entries(
    staffData.users
  )
    .map(([id, data]) => {

      let seconds =
        Number(data.totalSeconds) || 0;

      if (data.activeSince) {

        seconds +=
          getCurrentShiftSeconds(data);
      }

      return {
        id,
        username:
          data.username || "Neznámý",
        seconds
      };
    })
    .sort(
      (a, b) =>
        b.seconds - a.seconds
    );

  if (users.length === 0) {

    return (
      "🏆 **STAFF LEADERBOARD**\n\n" +
      "Zatím nejsou žádné evidované směny."
    );
  }

  const medals = [
    "🥇",
    "🥈",
    "🥉"
  ];

  let text =
    "🏆 **STAFF OORP LEADERBOARD**\n\n";

  users
    .slice(0, 10)
    .forEach((user, index) => {

      const medal =
        medals[index] ||
        `${index + 1}.`;

      text +=
        `${medal} **${user.username}** — ${formatTime(user.seconds)}\n`;
    });

  return text;
}

// =====================================================
// LEADERBOARD CHANNEL
// =====================================================

async function updateLeaderboard(channel) {

  const messages =
    await channel.messages.fetch({
      limit: 20
    });

  const botMessage =
    messages.find(
      message =>
        message.author.id === client.user.id
    );

  const embed =
    new EmbedBuilder()
      .setTitle("🏆 STAFF OORP LEADERBOARD")
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
}

async function refreshLeaderboard(guild) {

  const channel =
    guild.channels.cache.find(
      c =>
        c.name ===
        "🏆・staff-leaderboard"
    );

  if (!channel) {
    return;
  }

  await updateLeaderboard(channel);
}

// =====================================================
// STAFF LOG
// =====================================================

async function logStaff(guild, text) {

  const channel =
    guild.channels.cache.find(
      c =>
        c.name ===
        "🛡️・staff-log"
    );

  if (!channel) {
    return;
  }

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setDescription(text)
        .setColor(0x5865f2)
        .setTimestamp()
    ]
  });
}

// =====================================================
// MENTIONS
// =====================================================

function getStaffMentions(guild) {

  return STAFF_ROLES
    .map(name =>
      guild.roles.cache.find(
        role => role.name === name
      )
    )
    .filter(Boolean)
    .map(role =>
      `<@&${role.id}>`
    )
    .join(" ");
}

function getManagementMentions(guild) {

  return MANAGEMENT_ROLES
    .map(name =>
      guild.roles.cache.find(
        role => role.name === name
      )
    )
    .filter(Boolean)
    .map(role =>
      `<@&${role.id}>`
    )
    .join(" ");
}

// =====================================================
// SETUP
// =====================================================

async function setupServer(guild) {

  // -----------------------------
  // ROLES
  // -----------------------------

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

  const publicPerms =
    publicPermissions(guild);

  // =================================================
  // INFORMACE
  // =================================================

  const info =
    await getOrCreateCategory(
      guild,
      "📌 INFORMACE"
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

  const faq =
    await getOrCreateChannel(
      guild,
      "❓・faq",
      info
    );

  const applications =
    await getOrCreateChannel(
      guild,
      "📋・přihlášky",
      info,
      staffPerms
    );

  const announcements =
    await getOrCreateChannel(
      guild,
      "📢・oznámení",
      info
    );

  const map =
    await getOrCreateChannel(
      guild,
      "🗺️・mapa-emergency",
      info
    );

  // =================================================
  // HRA
  // =================================================

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

  const police =
    await getOrCreateChannel(
      guild,
      "🚓・policie",
      game
    );

  const fire =
    await getOrCreateChannel(
      guild,
      "🚒・hasiči",
      game
    );

  const medic =
    await getOrCreateChannel(
      guild,
      "🚑・záchranáři",
      game
    );

  const criminal =
    await getOrCreateChannel(
      guild,
      "🔫・kriminální-rp",
      game
    );

  const traffic =
    await getOrCreateChannel(
      guild,
      "🚗・dopravní-pravidla",
      game
    );

  // =================================================
  // KOMUNITA
  // =================================================

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

  const publicEvents =
    await getOrCreateChannel(
      guild,
      "🎉・eventy",
      community,
      publicPerms
    );

  // =================================================
  // STAFF
  // =================================================

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

  const staffAnnouncements =
    await getOrCreateChannel(
      guild,
      "📢・staff-oznámení",
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

  const staffRP =
    await getOrCreateChannel(
      guild,
      "📜・staff-rp-pravidla",
      staff,
      staffPerms
    );

  const staffPunishments =
    await getOrCreateChannel(
      guild,
      "⚖️・staff-tresty",
      staff,
      staffPerms
    );

  const staffReports =
    await getOrCreateChannel(
      guild,
      "🚨・staff-reporty",
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

  const staffEvents =
    await getOrCreateChannel(
      guild,
      "🎉・staff-eventy",
      staff,
      staffPerms
    );

  const staffMeetings =
    await getOrCreateChannel(
      guild,
      "📅・staff-porady",
      staff,
      staffPerms
    );

  // =================================================
  // TICKETY
  // =================================================

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

  // =================================================
  // VEDENÍ
  // =================================================

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

  const managementMeetings =
    await getOrCreateChannel(
      guild,
      "📋・porady-vedení",
      management,
      managementPerms
    );

  // =================================================
  // LOGY
  // =================================================

  const logs =
    await getOrCreateCategory(
      guild,
      "📊 LOGY",
      staffPerms
    );

  const ticketLogs =
    await getOrCreateChannel(
      guild,
      "🎫・ticket-log",
      logs,
      staffPerms
    );

  const staffLogs =
    await getOrCreateChannel(
      guild,
      "🛡️・staff-log",
      logs,
      staffPerms
    );

  // =================================================
  // SEND TEXTS
  // =================================================

  await sendOnce(rules, TEXT.rules);
  await sendOnce(rpRules, TEXT.rpRules);

  await sendOnce(
    faq,
    `
❓ **FAQ — IMPERIAL CZ/SK**

🎫 Problém → vytvoř ticket.
🚨 Report → použij report ticket.
🏠 Pozemek → použij pozemkový ticket.
🏢 Podnik → použij podnikový ticket.
👮 Nábor → použij náborový ticket.
🔓 Unban → použij unban ticket.
🎉 Event → sleduj kanál eventů.
🛡️ Staff → sleduj informace pro staff.
`
  );

  await sendOnce(
    applications,
    TEXT.applications
  );

  await sendOnce(
    announcements,
    "📢 **OZNÁMENÍ IMPERIAL CZ/SK**\n\nDůležitá oznámení budou zveřejňována zde."
  );

  await sendOnce(map, TEXT.map);

  await sendOnce(
    properties,
    TEXT.properties
  );

  await sendOnce(
    businesses,
    TEXT.businesses
  );

  await sendOnce(
    economy,
    TEXT.economy
  );

  await sendOnce(
    police,
    "🚓 **POLICIE**\n\nInformace, hodnosti a RP pravidla policejní složky."
  );

  await sendOnce(
    fire,
    "🚒 **HASIČI**\n\nInformace, hodnosti a RP pravidla hasičské složky."
  );

  await sendOnce(
    medic,
    "🚑 **ZÁCHRANÁŘI**\n\nInformace, hodnosti a RP pravidla ZZS."
  );

  await sendOnce(
    criminal,
    "🔫 **KRIMINÁLNÍ RP**\n\nKriminální RP musí být realistické a respektovat pravidla serveru."
  );

  await sendOnce(
    traffic,
    "🚗 **DOPRAVNÍ PRAVIDLA**\n\nRespektuj dopravní pravidla a používej vozidla realisticky."
  );

  await sendOnce(
    chat,
    "💬 **VÍTEJ V IMPERIAL CZ/SK!**\n\nUžij si komunitu, respektuj ostatní a hlavně si užij RP."
  );

  await sendOnce(
    publicEvents,
    TEXT.events
  );

  await sendOnce(
    staffChat,
    "🛡️ **STAFF CHAT**\n\nInterní komunikace staff týmu."
  );

  await sendOnce(
    staffAnnouncements,
    "📢 **STAFF OZNÁMENÍ**\n\nDůležitá interní oznámení."
  );

  await sendOnce(
    staffInfo,
    TEXT.staffInfo
  );

  await sendOnce(
    staffRP,
    "📜 **STAFF RP PRAVIDLA**\n\nStaff nesmí používat své pravomoci k vlastní RP výhodě."
  );

  await sendOnce(
    staffPunishments,
    TEXT.staffPunishments
  );

  await sendOnce(
    staffReports,
    `
🚨 **STAFF REPORTY**

👤 Hráč:
🎮 Roblox:
🕐 Datum:
📝 Popis:
📸 Důkazy:
⚖️ Výsledek:
👮 Staff:

Závažné případy předávej Senior Adminovi nebo vedení.
`
  );

  await sendOnce(
    staffShifts,
    TEXT.shift
  );

  await sendOnce(
    staffEvents,
    TEXT.staffEvents
  );

  await sendOnce(
    staffMeetings,
    `
📅 **STAFF PORADY**

Témata porad:

• pravidla
• nábor
• eventy
• stížnosti
• aktivita staffu
• nové funkce
• problémy serveru
`
  );

  await sendOnce(
    managementChat,
    "👑 **VEDENÍ IMPERIAL CZ/SK**\n\nInterní komunikace vedení."
  );

  await sendOnce(
    managementMeetings,
    "📋 **PORADY VEDENÍ**\n\nInterní plánování vedení."
  );

  await sendOnce(
    ticketLogs,
    "🎫 **TICKET LOG**"
  );

  await sendOnce(
    staffLogs,
    "🛡️ **STAFF LOG**"
  );

  // =================================================
  // TICKET PANEL
  // =================================================

  const messages =
    await ticketPanel.messages.fetch({
      limit: 20
    });

  const hasPanel =
    messages.some(
      message =>
        message.author.id === client.user.id
    );

  if (!hasPanel) {

    const embed =
      new EmbedBuilder()
        .setTitle("🎫 IMPERIAL TICKET SYSTÉM")
        .setDescription(
          TEXT.ticket
        )
        .setColor(0x5865f2)
        .setFooter({
          text: "Imperial CZ/SK Support"
        });

    const row1 =
      new ActionRowBuilder()
        .addComponents(

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

    const row2 =
      new ActionRowBuilder()
        .addComponents(

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

    await ticketPanel.send({
      embeds: [embed],
      components: [
        row1,
        row2
      ]
    });
  }

  await updateLeaderboard(
    leaderboard
  );
}

// =====================================================
// COMMAND HANDLER
// =====================================================

client.on(
  "interactionCreate",
  async interaction => {

    if (!interaction.isChatInputCommand()) {
      return;
    }

    // =================================================
    // SETUP
    // =================================================

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
            "❌ Tento příkaz může použít pouze administrátor.",
          ephemeral: true
        });
      }

      await interaction.deferReply({
        ephemeral: true
      });

      try {

        await setupServer(
          interaction.guild
        );

        await interaction.editReply(
          "✅ **IMPERIAL CZ/SK SERVER JE NASTAVENÝ!**\n\n" +
          "👑 Role → HOTOVO\n" +
          "📌 Informace → HOTOVO\n" +
          "🎮 RP → HOTOVO\n" +
          "🛡️ Staff → HOTOVO\n" +
          "🎫 Tickety → HOTOVO\n" +
          "👑 Vedení → HOTOVO\n" +
          "📊 Logy → HOTOVO\n" +
          "⏱️ Směny → OPRAVENO\n" +
          "🏆 Leaderboard → HOTOVO"
        );

      } catch (error) {

        console.error(
          "❌ SETUP ERROR:",
          error
        );

        await interaction.editReply(
          "❌ Setup selhal.\n\n" +
          "Zkontroluj Railway logy a oprávnění bota."
        );
      }

      return;
    }

    // =================================================
    // STAFF COMMANDS
    // =================================================

    const staffCommands = [
      "startshift",
      "endshift",
      "shift",
      "myhours",
      "leaderboard"
    ];

    if (
      staffCommands.includes(
        interaction.commandName
      )
    ) {

      if (
        !interaction.guild
      ) {
        return interaction.reply({
          content:
            "❌ Tento příkaz lze použít pouze na serveru.",
          ephemeral: true
        });
      }

      if (
        !isStaff(interaction.member)
      ) {
        return interaction.reply({
          content:
            "❌ Tento příkaz je pouze pro STAFF.",
          ephemeral: true
        });
      }

      const user =
        getStaffUser(
          interaction.user
        );

      // =================================================
      // START SHIFT
      // =================================================

      if (
        interaction.commandName ===
        "startshift"
      ) {

        if (user.activeSince) {

          const current =
            getCurrentShiftSeconds(
              user
            );

          return interaction.reply({
            content:
              `🟡 **Směnu už máš aktivní.**\n\n` +
              `⏱️ Aktuálně: **${formatTime(current)}**`,
            ephemeral: true
          });
        }

        user.activeSince =
          Date.now();

        saveData();

        await logStaff(
          interaction.guild,
          `🟢 ${interaction.user} zahájil staff směnu.`
        );

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                "🟢 STAFF SMĚNA ZAHÁJENA"
              )
              .setDescription(
                `👤 **Staff:** ${interaction.user}\n\n` +
                `🕐 **Začátek:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                `Použij **/endshift** až směnu ukončíš.`
              )
              .setColor(0x2ecc71)
              .setTimestamp()
          ]
        });
      }

      // =================================================
      // END SHIFT
      // =================================================

      if (
        interaction.commandName ===
        "endshift"
      ) {

        if (!user.activeSince) {

          return interaction.reply({
            content:
              "🔴 **Nemáš aktivní směnu.**\n\nPoužij nejdříve `/startshift`.",
            ephemeral: true
          });
        }

        const seconds =
          getCurrentShiftSeconds(
            user
          );

        user.totalSeconds =
          Number(user.totalSeconds || 0) +
          seconds;

        user.activeSince =
          null;

        saveData();

        await refreshLeaderboard(
          interaction.guild
        );

        await logStaff(
          interaction.guild,
          `🔴 ${interaction.user} ukončil staff směnu.\n⏱️ Délka: **${formatTime(seconds)}**`
        );

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                "🔴 STAFF SMĚNA UKONČENA"
              )
              .setDescription(
                `👤 **Staff:** ${interaction.user}\n\n` +
                `⏱️ **Tato směna:** ${formatTime(seconds)}\n` +
                `🏆 **Celkem:** ${formatTime(user.totalSeconds)}`
              )
              .setColor(0xe74c3c)
              .setTimestamp()
          ]
        });
      }

      // =================================================
      // CURRENT SHIFT
      // =================================================

      if (
        interaction.commandName ===
        "shift"
      ) {

        if (!user.activeSince) {

          return interaction.reply({
            content:
              "🔴 **Momentálně nemáš aktivní směnu.**",
            ephemeral: true
          });
        }

        const seconds =
          getCurrentShiftSeconds(
            user
          );

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                "⏱️ TVOJE AKTUÁLNÍ SMĚNA"
              )
              .setDescription(
                `🟢 **Stav:** Aktivní\n\n` +
                `⏱️ **Délka:** ${formatTime(seconds)}\n\n` +
                `🕐 **Začátek:** <t:${Math.floor(user.activeSince / 1000)}:R>`
              )
              .setColor(0x2ecc71)
              .setTimestamp()
          ],
          ephemeral: true
        });
      }

      // =================================================
      // MY HOURS
      // =================================================

      if (
        interaction.commandName ===
        "myhours"
      ) {

        let total =
          Number(user.totalSeconds || 0);

        if (user.activeSince) {

          total +=
            getCurrentShiftSeconds(
              user
            );
        }

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                "🏆 TVŮJ STAFF ČAS"
              )
              .setDescription(
                `👤 **Staff:** ${interaction.user}\n\n` +
                `⏱️ **Celkem:** ${formatTime(total)}`
              )
              .setColor(0xffd700)
              .setTimestamp()
          ],
          ephemeral: true
        });
      }

      // =================================================
      // LEADERBOARD
      // =================================================

      if (
        interaction.commandName ===
        "leaderboard"
      ) {

        return interaction.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(
                "🏆 STAFF OORP LEADERBOARD"
              )
              .setDescription(
                createLeaderboard()
              )
              .setColor(0xffd700)
              .setTimestamp()
          ]
        });
      }
    }
  }
);

// =====================================================
// TICKET TYPES
// =====================================================

const TICKET_TYPES = {

  ticket_support:
    ["podpora", "🛠️ Podpora"],

  ticket_report:
    ["report", "🚨 Report"],

  ticket_property:
    ["pozemek", "🏠 Pozemek"],

  ticket_business:
    ["podnik", "🏢 Podnik"],

  ticket_recruitment:
    ["nabor", "👮 Nábor"],

  ticket_unban:
    ["unban", "🔓 Unban"],

  ticket_partner:
    ["partnerstvi", "🤝 Partnerství"]
};

// =====================================================
// BUTTON HANDLER
// =====================================================

client.on(
  "interactionCreate",
  async interaction => {

    if (!interaction.isButton()) {
      return;
    }

    // =================================================
    // CREATE TICKET
    // =================================================

    const type =
      TICKET_TYPES[
        interaction.customId
      ];

    if (type) {

      const guild =
        interaction.guild;

      const category =
        guild.channels.cache.find(
          channel =>
            channel.type ===
              ChannelType.GuildCategory &&
            channel.name ===
              "🎫 TICKETY"
        );

      if (!category) {

        return interaction.reply({
          content:
            "❌ Ticket kategorie neexistuje. Použij `/setup`.",
          ephemeral: true
        });
      }

      const channelName =
        `${type[0]}-${interaction.user.id}`;

      const existing =
        guild.channels.cache.find(
          channel =>
            channel.name ===
            channelName
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
            PermissionsBitField.Flags.AttachFiles,
            PermissionsBitField.Flags.EmbedLinks
          ]
        }
      ];

      for (
        const roleName
        of STAFF_ROLES
      ) {

        const role =
          guild.roles.cache.find(
            r =>
              r.name === roleName
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
            `📝 Popiš svůj problém co nejpodrobněji.\n` +
            `📸 Přilož důkazy, pokud je máš.\n\n` +
            `🛡️ Staff může ticket převzít.\n` +
            `👑 Ticket lze předat vedení.\n` +
            `🔒 Po vyřešení ticket uzavři.`
          )
          .setColor(0x5865f2)
          .setTimestamp();

      const buttons =
        new ActionRowBuilder()
          .addComponents(

            new ButtonBuilder()
              .setCustomId(
                "ticket_claim"
              )
              .setLabel("🛡️ Převzít")
              .setStyle(
                ButtonStyle.Primary
              ),

            new ButtonBuilder()
              .setCustomId(
                "ticket_management"
              )
              .setLabel(
                "👑 Předat vedení"
              )
              .setStyle(
                ButtonStyle.Secondary
              ),

            new ButtonBuilder()
              .setCustomId(
                "ticket_close"
              )
              .setLabel("🔒 Zavřít")
              .setStyle(
                ButtonStyle.Danger
              )
          );

      await channel.send({
        content:
          `${interaction.user}\n${getStaffMentions(guild)}`,
        embeds: [embed],
        components: [buttons]
      });

      await interaction.reply({
        content:
          `✅ Ticket vytvořen: ${channel}`,
        ephemeral: true
      });

      return;
    }

    // =================================================
    // TICKET ACTIONS
    // =================================================

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
      !isStaff(interaction.member) &&
      !isManagement(interaction.member)
    ) {

      return interaction.reply({
        content:
          "❌ Tuto akci může použít pouze staff.",
        ephemeral: true
      });
    }

    // CLAIM

    if (
      interaction.customId ===
      "ticket_claim"
    ) {

      return interaction.reply({
        content:
          `🛡️ Ticket převzal ${interaction.user}.`
      });
    }

    // MANAGEMENT

    if (
      interaction.customId ===
      "ticket_management"
    ) {

      for (
        const roleName
        of MANAGEMENT_ROLES
      ) {

        const role =
          interaction.guild.roles.cache.find(
            r =>
              r.name === roleName
          );

        if (role) {

          await interaction.channel
            .permissionOverwrites.edit(
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
          "👑 **Ticket byl předán vedení.**\n\n" +
          getManagementMentions(
            interaction.guild
          )
      });
    }

    // CLOSE

    if (
      interaction.customId ===
      "ticket_close"
    ) {

      await interaction.reply({
        content:
          "🔒 **Ticket se zavře za 5 sekund.**"
      });

      setTimeout(
        async () => {

          try {

            await interaction.channel.delete(
              "Ticket uzavřen"
            );

          } catch (error) {

            console.error(
              "❌ Ticket delete:",
              error
            );
          }

        },
        5000
      );
    }
  }
);

// =====================================================
// AUTO LEADERBOARD
// =====================================================

setInterval(
  async () => {

    for (
      const guild
      of client.guilds.cache.values()
    ) {

      try {

        await refreshLeaderboard(
          guild
        );

      } catch (error) {

        console.error(
          "❌ Automatický leaderboard:",
          error
        );
      }
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

    const channel =
      member.guild.channels.cache.find(
        c =>
          c.name ===
          "🛡️・staff-log"
      );

    if (channel) {

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              "📥 NOVÝ ČLEN"
            )
            .setDescription(
              `👤 ${member.user.tag}\n` +
              `🆔 ${member.id}`
            )
            .setColor(0x2ecc71)
            .setTimestamp()
        ]
      });
    }
  }
);

client.on(
  "guildMemberRemove",
  async member => {

    const channel =
      member.guild.channels.cache.find(
        c =>
          c.name ===
          "🛡️・staff-log"
      );

    if (channel) {

      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              "📤 ČLEN ODEŠEL"
            )
            .setDescription(
              `👤 ${member.user.tag}\n` +
              `🆔 ${member.id}`
            )
            .setColor(0xe74c3c)
            .setTimestamp()
        ]
      });
    }
  }
);

// =====================================================
// ERROR HANDLING
// =====================================================

process.on(
  "unhandledRejection",
  error => {

    console.error(
      "❌ UNHANDLED REJECTION:",
      error
    );
  }
);

process.on(
  "uncaughtException",
  error => {

    console.error(
      "❌ UNCAUGHT EXCEPTION:",
      error
    );
  }
);

// =====================================================
// LOGIN
// =====================================================

client.login(TOKEN);
```

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
// BOT
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
  } catch (error) {
    console.error("❌ Chyba při načítání dat:", error);
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
// ROLE FUNCTIONS
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
    role => role.name === name
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
      deny: [PermissionsBitField.Flags.ViewChannel]
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
      deny: [PermissionsBitField.Flags.ViewChannel]
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
// CHANNEL FUNCTIONS
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

// =====================================================
// SEND ONCE
// =====================================================

async function sendOnce(channel, content) {
  const messages = await channel.messages.fetch({
    limit: 20
  });

  const botMessage = messages.find(
    message =>
      message.author.id === client.user.id
  );

  if (!botMessage) {
    await channel.send(content);
  }
}

// =====================================================
// TIME
// =====================================================

function formatTime(seconds) {
  seconds = Math.max(0, Math.floor(seconds));

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(
    (seconds % 3600) / 60
  );
  const secs = seconds % 60;

  return `${hours} h ${minutes} min ${secs} s`;
}

// =====================================================
// LOGIN
// =====================================================

client.once("ready", () => {
  console.log(
    `✅ Bot je online jako ${client.user.tag}`
  );
});

client.login(TOKEN);

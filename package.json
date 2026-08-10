const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  ChannelType,
  SlashCommandBuilder,
  REST,
  Routes
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

const command = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Automaticky nastaví základ serveru Imperial CZ/SK.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

client.once("ready", async () => {
  console.log(`✅ Imperial CZ/SK je online jako ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    try {
      const rest = new REST({ version: "10" }).setToken(TOKEN);

      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guild.id),
        {
          body: [command.toJSON()]
        }
      );

      console.log(`✅ /setup zaregistrován na serveru ${guild.name}`);
    } catch (error) {
      console.error("❌ Chyba registrace příkazu:", error);
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "setup") return;

  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: "❌ Tento příkaz může použít pouze administrátor.",
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;

  const roles = [
    ["👑 Majitel", "ff0000"],
    ["💎 Spolumajitel", "ff00ff"],
    ["🏆 Zakladatel", "ffd700"],
    ["🧠 Ředitel projektu", "9b59b6"],
    ["📋 Vedoucí projektu", "3498db"],
    ["📱 Vedoucí médií", "e91e63"],
    ["🎉 Vedoucí eventů", "f1c40f"],
    ["🤝 Vedoucí partnerství", "1abc9c"],
    ["👥 Vedoucí náboru", "2ecc71"],
    ["⚙️ Vývojář", "95a5a6"],

    ["👑 Hlavní administrátor", "c0392b"],
    ["🔴 Senior administrátor", "e74c3c"],
    ["🟠 Administrátor", "e67e22"],
    ["🟡 Junior administrátor", "f1c40f"],
    ["⚪ Zkušební administrátor", "7f8c8d"],

    ["🚓 Velitel policie", "2980b9"],
    ["👮 Policista", "3498db"],
    ["🚒 Velitel hasičů", "c0392b"],
    ["🔥 Hasič", "e74c3c"],
    ["🚑 Velitel záchranářů", "e74c3c"],
    ["🩺 Záchranář", "2ecc71"],

    ["⭐ Event tým", "9b59b6"],
    ["💎 Podporovatel", "00ffff"],
    ["🏆 VIP", "ffd700"],
    ["🎮 Člen", "5865f2"]
  ];

  for (const [name, color] of roles) {
    const exists = guild.roles.cache.find(
      role => role.name === name
    );

    if (!exists) {
      await guild.roles.create({
        name: name,
        color: color,
        reason: "Imperial CZ/SK automatický setup"
      });
    }
  }

  const categories = [
    "📌 INFORMACE",
    "💬 KOMUNITA",
    "🎫 PODPORA",
    "🛡️ ADMINISTRACE",
    "👑 VEDENÍ",
    "🚓 FRAKCE",
    "📊 LOGY"
  ];

  for (const name of categories) {
    const exists = guild.channels.cache.find(
      channel =>
        channel.type === ChannelType.GuildCategory &&
        channel.name === name
    );

    if (!exists) {
      await guild.channels.create({
        name: name,
        type: ChannelType.GuildCategory
      });
    }
  }

  await interaction.editReply(
    "✅ **Imperial CZ/SK setup dokončen!**\n\n" +
    "👑 Role vytvořeny\n" +
    "📁 Kategorie vytvořeny\n" +
    "🤖 Bot je připraven na další nastavení."
  );
});

client.login(TOKEN);

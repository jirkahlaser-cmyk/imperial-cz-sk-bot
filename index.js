```js
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.log("DISCORD_TOKEN is missing");
  process.exit(1);
}

const command = new SlashCommandBuilder()
  .setName("clearchannels")
  .setDescription("Delete all channels")
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Administrator
  );

client.once("ready", async () => {
  console.log("BOT ONLINE");

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
          body: [command.toJSON()]
        }
      );

      console.log(
        "Command registered: " + guild.name
      );
    } catch (error) {
      console.log(
        "Command error: " + error.message
      );
    }
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  if (interaction.commandName !== "clearchannels") {
    return;
  }

  if (
    !interaction.memberPermissions.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    await interaction.reply({
      content: "Only administrators can use this command.",
      ephemeral: true
    });

    return;
  }

  await interaction.reply({
    content: "Deleting all channels...",
    ephemeral: true
  });

  const guild = interaction.guild;

  const channels = [
    ...guild.channels.cache.values()
  ];

  for (const channel of channels) {
    try {
      console.log(
        "Deleting: " + channel.name
      );

      await channel.delete(
        "Server channel reset"
      );
    } catch (error) {
      console.log(
        "Delete error: " + error.message
      );
    }
  }

  console.log(
    "All channels deleted."
  );
});

client.login(TOKEN);
```


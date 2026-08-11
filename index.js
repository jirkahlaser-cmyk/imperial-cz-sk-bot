```text
const { Client, GatewayIntentBits, PermissionFlagsBits, SlashCommandBuilder, REST, Routes } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.log("ERROR: DISCORD_TOKEN is missing.");
  process.exit(1);
}

const command = new SlashCommandBuilder()
  .setName("clearchannels")
  .setDescription("Delete all server channels.")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

client.once("ready", async () => {
  console.log("BOT ONLINE: " + client.user.tag);

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  for (const guild of client.guilds.cache.values()) {
    try {
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guild.id),
        {
          body: [command.toJSON()]
        }
      );

      console.log("COMMAND READY: " + guild.name);
    } catch (error) {
      console.log("COMMAND ERROR: " + error.message);
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName !== "clearchannels") return;

  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    await interaction.reply({
      content: "You need Administrator permission.",
      ephemeral: true
    });
    return;
  }

  await interaction.reply({
    content: "Deleting channels...",
    ephemeral: true
  });

  const guild = interaction.guild;

  const channels = Array.from(guild.channels.cache.values());

  for (const channel of channels) {
    try {
      console.log("Deleting: " + channel.name);
      await channel.delete("Imperial CZ/SK server reset");
    } catch (error) {
      console.log(
        "Could not delete " +
        channel.name +
        ": " +
        error.message
      );
    }
  }

  console.log("CHANNEL RESET FINISHED");
});

client.login(TOKEN);
```

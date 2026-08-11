```js
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error("❌ DISCORD_TOKEN není nastavený v Railway.");
  process.exit(1);
}

const clearChannelsCommand = new SlashCommandBuilder()
  .setName("clearchannels")
  .setDescription("⚠️ Smaže všechny kanály a kategorie na serveru.")
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Administrator
  );

client.once("ready", async () => {
  console.log(`✅ Bot je online jako ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(TOKEN);

  for (const guild of client.guilds.cache.values()) {
    try {
      await rest.put(
        Routes.applicationGuildCommands(
          client.user.id,
          guild.id
        ),
        {
          body: [
            clearChannelsCommand.toJSON()
          ]
        }
      );

      console.log(
        `✅ /clearchannels registrován na: ${guild.name}`
      );
    } catch (error) {
      console.error(
        `❌ Chyba registrace příkazu na ${guild.name}:`,
        error
      );
    }
  }
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName !== "clearchannels") return;

  if (!interaction.memberPermissions.has(
    PermissionFlagsBits.Administrator
  )) {
    return interaction.reply({
      content: "❌ Tento příkaz může použít pouze administrátor.",
      ephemeral: true
    });
  }

  await interaction.reply({
    content:
      "⚠️ **MAZÁNÍ KANÁLŮ ZAČÍNÁ...**\n\n" +
      "🗑️ Budou odstraněny všechny kategorie a kanály.",
    ephemeral: true
  });

  const guild = interaction.guild;

  try {
    const channels = [...guild.channels.cache.values()];

    // Nejprve smažeme kanály
    for (const channel of channels) {
      try {
        console.log(
          `🗑️ Mažu: ${channel.name}`
        );

        await channel.delete(
          "Imperial CZ/SK – kompletní reset kanálů"
        );
      } catch (error) {
        console.error(
          `❌ Nepodařilo se smazat ${channel.name}:`,
          error.message
        );
      }
    }

    console.log(
      `✅ Kanály na serveru ${guild.name} byly odstraněny.`
    );

  } catch (error) {
    console.error(
      "❌ Chyba při mazání kanálů:",
      error
    );
  }
});

client.login(TOKEN);
```

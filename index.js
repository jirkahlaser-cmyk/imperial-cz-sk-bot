```js
const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  SlashCommandBuilder,
  REST,
  Routes,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

// =====================================================
// KONFIGURACE
// =====================================================

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error("❌ DISCORD_TOKEN není nastavený v Railway.");
  process.exit(1);
}

// =====================================================
// BOT
// =====================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds
  ]
});

// =====================================================
// PŘÍKAZY
// =====================================================

const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Otestuje, jestli bot funguje."),

  new SlashCommandBuilder()
    .setName("resetserver")
    .setDescription("Bezpečně smaže všechny kategorie a kanály.")
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )
].map(command => command.toJSON());

// =====================================================
// READY
// =====================================================

client.once("ready", async () => {
  console.log(`✅ Bot je online jako ${client.user.tag}`);

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
        `✅ Příkazy registrovány na serveru: ${guild.name}`
      );

    } catch (error) {
      console.error(
        `❌ Chyba registrace příkazů na ${guild.name}:`,
        error
      );
    }
  }
});

// =====================================================
// INTERAKCE
// =====================================================

client.on("interactionCreate", async interaction => {

  // ---------------------------------------------------
  // SLASH COMMANDS
  // ---------------------------------------------------

  if (interaction.isChatInputCommand()) {

    // PING
    if (interaction.commandName === "ping") {

      return interaction.reply({
        content: "🏓 Pong! Bot funguje správně.",
        ephemeral: true
      });
    }

    // RESET SERVERU
    if (interaction.commandName === "resetserver") {

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

      const row = new ActionRowBuilder()
        .addComponents(

          new ButtonBuilder()
            .setCustomId("reset_confirm")
            .setLabel("🗑️ ANO, RESETOVAT")
            .setStyle(ButtonStyle.Danger),

          new ButtonBuilder()
            .setCustomId("reset_cancel")
            .setLabel("❌ ZRUŠIT")
            .setStyle(ButtonStyle.Secondary)

        );

      return interaction.reply({
        content:
          "⚠️ **POZOR – RESET SERVERU**\n\n" +
          "Tato akce smaže všechny **kategorie a kanály** tohoto serveru.\n\n" +
          "👑 Role zůstanou.\n" +
          "👤 Členové zůstanou.\n" +
          "🤖 Bot zůstane.\n" +
          "🏠 Server samotný zůstane.\n\n" +
          "❗ Akce je nevratná.\n\n" +
          "Pokud opravdu chceš pokračovat, potvrď tlačítkem.",
        components: [row],
        ephemeral: true
      });
    }
  }

  // ---------------------------------------------------
  // RESET BUTTON
  // ---------------------------------------------------

  if (interaction.isButton()) {

    // ZRUŠIT
    if (interaction.customId === "reset_cancel") {

      return interaction.update({
        content: "❌ Reset serveru byl zrušen.",
        components: []
      });
    }

    // POTVRDIT
    if (interaction.customId === "reset_confirm") {

      if (
        !interaction.memberPermissions.has(
          PermissionFlagsBits.Administrator
        )
      ) {
        return interaction.update({
          content:
            "❌ Nemáš oprávnění k resetování serveru.",
          components: []
        });
      }

      await interaction.update({
        content:
          "⏳ **Resetuji server...**\n\n" +
          "Prosím chvíli počkej.",
        components: []
      });

      const guild = interaction.guild;

      try {

        const channels = [
          ...guild.channels.cache.values()
        ];

        let deleted = 0;

        for (const channel of channels) {

          try {

            await channel.delete(
              "Imperial CZ/SK – reset serveru"
            );

            deleted++;

            // Malá pauza, aby Discord API nebylo zbytečně zahlcené.
            await new Promise(resolve =>
              setTimeout(resolve, 300)
            );

          } catch (error) {

            console.error(
              `❌ Nepodařilo se smazat ${channel.name}:`,
              error.message
            );
          }
        }

        console.log(
          `🗑️ Reset dokončen. Smazáno kanálů: ${deleted}`
        );

      } catch (error) {

        console.error(
          "❌ RESET ERROR:",
          error
        );

        return;
      }
    }
  }
});

// =====================================================
// LOGIN
// =====================================================

client.login(TOKEN);
```

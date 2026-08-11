```js
const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds
    ]
});

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    console.error("❌ DISCORD_TOKEN není nastavený.");
    process.exit(1);
}

client.once("clientReady", () => {
    console.log(`✅ Imperial CZ/SK bot je online jako ${client.user.tag}`);
});

client.login(TOKEN).catch((error) => {
    console.error("❌ Nepodařilo se přihlásit bota:");
    console.error(error);
});
```

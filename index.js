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

const fs = require("fs");
const path = require("path");

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

/* =====================================================
   DATA PRO OORP SMĚNY
===================================================== */

const dataFile = path.join(__dirname, "staff-hours.json");

let staffData = {
  users: {}
};

function loadData() {
  try {
    if (!fs.existsSync(dataFile)) {
      fs.writeFileSync(
        dataFile,
        JSON.stringify(staffData, null, 2)
      );
    }

    staffData = JSON.parse(
      fs.readFileSync(dataFile, "utf8")
    );
  } catch (error) {
    console.error("❌ Chyba při načítání staff-hours:", error);
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
    console.error("❌ Chyba při ukládání staff-hours:", error);
  }
}

loadData();

/* =====================================================
   ROLE
===================================================== */

const rolesList = [
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
  ["📸 Media tým", "E91E63"],
  ["💎 Podporovatel", "00FFFF"],
  ["🏆 VIP", "FFD700"],
  ["🎮 Člen", "5865F2"]
];

/* =====================================================
   STAFF ROLE NAMES
===================================================== */

const staffRoleNames = [
  "👑 Hlavní administrátor",
  "🔴 Senior administrátor",
  "🟠 Administrátor",
  "🟡 Junior administrátor",
  "⚪ Zkušební administrátor"
];

const managementRoleNames = [
  "👑 Majitel",
  "💎 Spolumajitel",
  "🏆 Zakladatel",
  "🧠 Ředitel projektu",
  "📋 Vedoucí projektu"
];

function isStaff(member) {
  return member.roles.cache.some(role =>
    staffRoleNames.includes(role.name)
  );
}

function isManagement(member) {
  return member.roles.cache.some(role =>
    managementRoleNames.includes(role.name)
  );
}

/* =====================================================
   ROLE / CHANNEL FUNKCE
===================================================== */

async function getRole(guild, name, color) {
  let role = guild.roles.cache.find(
    r => r.name === name
  );

  if (!role) {
    role = await guild.roles.create({
      name,
      color,
      reason: "Imperial CZ/SK RP Setup"
    });
  }

  return role;
}

async function getCategory(
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

  return category;
}

async function getChannel(
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

async function sendOnce(channel, content) {
  const messages = await channel.messages.fetch({
    limit: 10
  });

  if (messages.size === 0) {
    await channel.send(content);
  }
}

/* =====================================================
   TEXTY
===================================================== */

const TEXTS = {

  rules:
    "📜 **PRAVIDLA DISCORDU**\n\n" +
    "1️⃣ Chovej se slušně k ostatním.\n" +
    "2️⃣ Zákaz šikany a cíleného obtěžování.\n" +
    "3️⃣ Zákaz spamu a floodu.\n" +
    "4️⃣ Reklama pouze se souhlasem vedení.\n" +
    "5️⃣ Zákaz vydávání se za staff nebo vedení.\n" +
    "6️⃣ Zákaz zveřejňování soukromých informací ostatních.\n" +
    "7️⃣ Dodržuj Discord Terms of Service.\n" +
    "8️⃣ Respektuj rozhodnutí moderace.\n\n" +
    "⚠️ Za porušení může následovat upozornění, timeout, kick nebo ban.",

  rp:
    "🎭 **KOMPLETNÍ RP PRAVIDLA**\n\n" +

    "🔹 **FailRP**\n" +
    "Jednání, které nedává smysl v rámci RP.\n\n" +

    "🔹 **RDM**\n" +
    "Útok nebo zabití hráče bez dostatečného RP důvodu.\n\n" +

    "🔹 **VDM**\n" +
    "Úmyslné používání vozidla jako zbraně bez odpovídajícího RP důvodu.\n\n" +

    "🔹 **NLR**\n" +
    "Po smrti se nesmíš bezdůvodně vracet do stejné situace.\n\n" +

    "🔹 **Metagaming**\n" +
    "Používání informací získaných mimo RP.\n\n" +

    "🔹 **Powergaming**\n" +
    "Nucení nereálných akcí ostatním hráčům.\n\n" +

    "🔹 **FearRP**\n" +
    "Při ohrožení života musí postava reagovat přiměřeně.\n\n" +

    "🔹 **Combat Logging**\n" +
    "Úmyslné odpojení během RP situace.\n\n" +

    "🔹 **Cop Baiting**\n" +
    "Zbytečné provokování policie pouze za účelem vyvolání RP.\n\n" +

    "🔹 **NVL**\n" +
    "Ignorování vlastního života v nebezpečné situaci.\n\n" +

    "🔹 **Revenge RP**\n" +
    "Pomsta za situaci, kterou si postava nemá pamatovat.\n\n" +

    "🔹 **Realismus**\n" +
    "Vždy se snaž hrát tak, jak by podobná situace probíhala realisticky.",

  adminRules:
    "🛡️ **PRAVIDLA ADMIN TÝMU**\n\n" +

    "1️⃣ Admin nesmí zneužívat pravomoci.\n\n" +
    "2️⃣ Admin musí být nestranný.\n\n" +
    "3️⃣ Admin nesmí zvýhodňovat kamarády.\n\n" +
    "4️⃣ Admin musí mít u závažných trestů důkazy.\n\n" +
    "5️⃣ Admin nesmí trestat hráče z osobních důvodů.\n\n" +
    "6️⃣ Interní informace staffu se nesmí zveřejňovat.\n\n" +
    "7️⃣ Konflikt zájmů se předává jinému adminovi.\n\n" +
    "8️⃣ Závažné případy se předávají Senior Adminovi nebo vedení.\n\n" +
    "9️⃣ Admin nesmí používat pravomoci pro vlastní RP výhodu.\n\n" +
    "🔟 Při řešení situace musí admin komunikovat slušně.\n\n" +
    "👑 Vedení může rozhodnout o výjimkách nebo závažných případech.",

  staffRP:
    "🎭 **STAFF RP PRAVIDLA**\n\n" +

    "🛡️ Staff je při řešení RP situace nestranný.\n\n" +

    "1️⃣ Pokud není nutné zasáhnout, nech RP pokračovat.\n\n" +
    "2️⃣ Staff nesmí využívat OORP informace pro vlastní IC výhodu.\n\n" +
    "3️⃣ Staff nesmí během vlastního RP zvýhodňovat sebe ani kamarády.\n\n" +
    "4️⃣ Při řešení reportu si nejprve vyžádej informace a důkazy.\n\n" +
    "5️⃣ Pokud je případ sporný, předá se vyššímu staffu.\n\n" +
    "6️⃣ Staff nesmí používat admin příkazy jako RP schopnosti.\n\n" +
    "7️⃣ Při velkých akcích musí staff postupovat koordinovaně.\n\n" +
    "8️⃣ Staff musí rozlišovat IC a OOC komunikaci.\n\n" +
    "9️⃣ Pokud je staff účastníkem reportu, neměl by případ řešit sám.\n\n" +
    "🔟 Zneužití OORP pravomocí může vést k odebrání staff role.",

  punishments:
    "⚖️ **STAFF TRESTNÍ SYSTÉM**\n\n" +

    "🟢 **Upozornění**\n" +
    "Drobné první porušení pravidel.\n\n" +

    "🟡 **WARN**\n" +
    "Opakované nebo závažnější porušení.\n\n" +

    "🟠 **TIMEOUT**\n" +
    "Spam, toxicita nebo narušování Discordu.\n\n" +

    "🔴 **KICK**\n" +
    "Závažné narušování serveru.\n\n" +

    "⛔ **DOČASNÝ BAN**\n" +
    "Závažné nebo opakované porušování.\n\n" +

    "🚫 **PERMANENTNÍ BAN**\n" +
    "Extrémně závažné případy, opakované porušování nebo závažné zneužívání systému.\n\n" +

    "🛡️ **ODEBRÁNÍ STAFF ROLE**\n" +
    "Zneužití pravomocí, zvýhodňování hráčů nebo porušení důvěry.\n\n" +

    "👑 **PŘEDÁNÍ VEDENÍ**\n" +
    "Používá se u velmi závažných nebo sporných případů.\n\n" +

    "⚠️ Trest musí vždy odpovídat situaci. Ne každý problém automaticky znamená permanentní ban.",

  police:
    "🚓 **POLICEJNÍ RP**\n\n" +
    "• Respektuj služební postupy.\n" +
    "• Nepoužívej pravomoci bez RP důvodu.\n" +
    "• Zásahy musí mít odpovídající důvod.\n" +
    "• Respektuj FearRP.\n" +
    "• Nepoužívej policejní vybavení pro vlastní výhodu.\n" +
    "• Při velkých akcích spolupracuj s ostatními složkami.",

  fire:
    "🚒 **HASIČSKÉ RP**\n\n" +
    "• Hraj realistické zásahy.\n" +
    "• Spolupracuj s policií a ZZS.\n" +
    "• Nezneužívej hasičská vozidla.\n" +
    "• Při zásahu respektuj bezpečnost ostatních hráčů.",

  medic:
    "🚑 **ZZS RP**\n\n" +
    "• Ošetřuj hráče realisticky.\n" +
    "• Spolupracuj s policií a hasiči.\n" +
    "• Nepoužívej ZZS roli pro vlastní výhodu.\n" +
    "• Při zásahu zachovej profesionální RP.",

  criminal:
    "🔫 **KRIMINÁLNÍ RP**\n\n" +
    "Kriminální RP musí být hratelné pro všechny strany.\n\n" +
    "🚫 Žádné RDM.\n" +
    "🚫 Žádné VDM.\n" +
    "🚫 Žádný FailRP.\n" +
    "🚫 Žádný Powergaming.\n\n" +
    "🏦 Loupeže a velké akce musí mít realistický průběh.\n" +
    "👮 Počítej s odpovídající reakcí policie.",

  traffic:
    "🚗 **DOPRAVNÍ RP**\n\n" +
    "• Jezdi realisticky.\n" +
    "• Respektuj dopravní situace.\n" +
    "• Nejezdi úmyslně do ostatních hráčů.\n" +
    "• VDM je zakázané.\n" +
    "• Dopravní nehody mohou být součástí RP.\n" +
    "• Závody patří pouze do schválených eventů.",

  applications:
    "📋 **PŘIHLÁŠKY**\n\n" +

    "🛡️ **STAFF / ADMIN**\n" +
    "Pro aktivní, slušné a zodpovědné členy.\n" +
    "Přihláška → pohovor → zkušební období.\n\n" +

    "🚓 **POLICIE**\n" +
    "Přihláška do policejní frakce.\n\n" +

    "🚒 **HASIČI**\n" +
    "Přihláška do HZS.\n\n" +

    "🚑 **ZZS**\n" +
    "Přihláška do zdravotnické frakce.\n\n" +

    "🎉 **EVENT TÝM**\n" +
    "Pro členy, kteří chtějí připravovat eventy.\n\n" +

    "📸 **MEDIA TÝM**\n" +
    "Screenshoty, videa a propagace projektu.\n\n" +

    "🤝 **PARTNERSTVÍ**\n" +
    "Žádosti o spolupráci řeší vedení.\n\n" +

    "🎫 Přihlášku lze vytvořit přes ticket.",

  eventsPublic:
    "🎉 **EVENTY**\n\n" +
    "Zde budou zveřejňovány aktuální a plánované eventy.\n\n" +
    "🚗 Car Meet\n" +
    "🏁 Závody\n" +
    "🚓 Policejní akce\n" +
    "🚒 Hasičský zásah\n" +
    "🚑 Hromadná nehoda\n" +
    "🚨 Policejní honička\n" +
    "🏦 Bankovní loupež\n" +
    "💎 Loupež klenotnictví\n" +
    "🚧 Dopravní uzavírka\n" +
    "🚌 Veřejná doprava\n" +
    "🎭 Velké městské RP\n" +
    "📸 Screenshot event\n" +
    "🏆 Turnaj\n" +
    "🎁 Soutěž\n\n" +
    "📢 Konkrétní informace budou zveřejněny před každým eventem.",

  eventsStaff:
    "🎉 **STAFF EVENTY**\n\n" +

    "Zde staff plánuje eventy před jejich zveřejněním.\n\n" +

    "🚗 **Car Meet**\n" +
    "Sraz vozidel a společné focení.\n\n" +

    "🏁 **Závody**\n" +
    "Organizované závody na předem určené trase.\n\n" +

    "🚓 **Policejní akce**\n" +
    "Checkpoint, pátrání nebo koordinovaný zásah.\n\n" +

    "🚒 **Hasičský zásah**\n" +
    "Požár, nehoda nebo záchranná akce.\n\n" +

    "🚑 **Hromadná nehoda**\n" +
    "Koordinovaný event pro Policii, HZS a ZZS.\n\n" +

    "🏦 **Loupež banky**\n" +
    "Velké kriminální RP s reakcí bezpečnostních složek.\n\n" +

    "💎 **Loupež klenotnictví**\n" +
    "Kriminální scénář s policejním zásahem.\n\n" +

    "🚧 **Dopravní uzavírka**\n" +
    "Řízení dopravy a odklon vozidel.\n\n" +

    "🚌 **Veřejná doprava**\n" +
    "Speciální autobusový nebo dopravní event.\n\n" +

    "🎭 **Velké městské RP**\n" +
    "Scénář zapojující větší část serveru.\n\n" +

    "📋 Při přípravě eventu určete:\n" +
    "• datum a čas\n" +
    "• místo\n" +
    "• organizátory\n" +
    "• potřebné frakce\n" +
    "• pravidla\n" +
    "• maximální počet účastníků",

  properties:
    "🏠 **POZEMKY**\n\n" +
    "O pozemek se žádá přes ticket.\n\n" +
    "V žádosti uveď:\n" +
    "• Discord jméno\n" +
    "• požadované místo\n" +
    "• účel pozemku\n" +
    "• screenshot místa, pokud je potřeba\n\n" +
    "👑 Vedení žádost schválí nebo zamítne.\n\n" +
    "⚠️ Discord evidence pozemku sama o sobě nemění vlastnictví v Robloxu.",

  businesses:
    "🏢 **PODNIKY**\n\n" +
    "Možné RP podniky:\n\n" +
    "🍔 Restaurace\n" +
    "🔧 Autoservis\n" +
    "🏪 Obchod\n" +
    "⛽ Čerpací stanice\n" +
    "🏢 Firma\n\n" +
    "O podnik se žádá přes ticket.\n" +
    "Vedení může žádost schválit, upravit nebo zamítnout.",

  economy:
    "💰 **EKONOMIKA RP**\n\n" +
    "• Peníze musí mít RP původ.\n" +
    "• Podniky musí být schválené.\n" +
    "• Pozemky se evidují přes vedení.\n" +
    "• Podvody musí mít RP základ.\n" +
    "• Zakázáno je zneužívat systém pro OORP výhodu.",

  faq:
    "❓ **FAQ**\n\n" +
    "**Jak získám admina?**\n" +
    "Sleduj přihlášky a nábory.\n\n" +

    "**Jak nahlásím hráče?**\n" +
    "Vytvoř Report ticket.\n\n" +

    "**Jak požádám o pozemek?**\n" +
    "Vytvoř ticket Pozemek.\n\n" +

    "**Jak požádám o podnik?**\n" +
    "Vytvoř ticket Podnik.\n\n" +

    "**Jak požádám o unban?**\n" +
    "Vytvoř Unban ticket.\n\n" +

    "**Kde najdu eventy?**\n" +
    "V kanálu 🎉・eventy.\n\n" +

    "**Jak funguje staff směna?**\n" +
    "Použij !startshift a po skončení !endshift.",

  map:
    "🗺️ **MAPA — EMERGENCY HAMBURG**\n\n" +
    "Oficiální hra Emergency Hamburg:\n" +
    "https://www.roblox.com/games/7711635737/Emergency-Hamburg\n\n" +

    "📍 Důležité typy lokací:\n" +
    "🚓 Policie\n" +
    "🚒 Hasiči\n" +
    "🚑 ZZS\n" +
    "🏦 Banka\n" +
    "💎 Klenotnictví\n" +
    "⛽ Čerpací stanice\n" +
    "🚉 Nádraží\n" +
    "🏭 Průmyslové oblasti\n" +
    "🏙️ Centrum města\n\n" +

    "⚠️ Lokace se mohou změnit s aktualizacemi hry.",

  shiftInfo:
    "⏱️ **STAFF SMĚNY — OORP**\n\n" +

    "`!startshift`\n" +
    "Začne tvoji OORP staff směnu.\n\n" +

    "`!endshift`\n" +
    "Ukončí aktuální směnu a započítá čas.\n\n" +

    "`!shift`\n" +
    "Zobrazí aktuální stav směny.\n\n" +

    "`!myhours`\n" +
    "Zobrazí tvůj celkový OORP čas.\n\n" +

    "`!leaderboard`\n" +
    "Zobrazí staff leaderboard.\n\n" +

    "⚠️ Čas se počítá pouze mezi startem a koncem směny.",

  staffInfo:
    "🛡️ **STAFF INFO**\n\n" +

    "Staff má být aktivní, férový a profesionální.\n\n" +

    "📋 Při řešení reportu:\n" +
    "1. Zjisti situaci.\n" +
    "2. Vyslechni všechny strany.\n" +
    "3. Vyžádej důkazy.\n" +
    "4. Rozhodni podle pravidel.\n" +
    "5. Zapiš závažné případy.\n" +
    "6. V případě pochybností předávej vyššímu staffu.\n\n" +

    "👑 Závažné případy lze předat vedení.",

  staffAnnouncements:
    "📢 **STAFF OZNÁMENÍ**\n\n" +
    "Tento kanál slouží pro důležitá oznámení vedení směrem ke staff týmu.",

  staffChat:
    "🛡️ **STAFF CHAT**\n\n" +
    "Interní komunikace staff týmu.\n\n" +
    "⚠️ Neřeš zde veřejné hádky ani osobní konflikty.",

  staffReports:
    "🚨 **STAFF REPORTY**\n\n" +
    "Zde se evidují důležité případy.\n\n" +
    "Uveď:\n" +
    "👤 hráče\n" +
    "🕐 datum\n" +
    "📝 popis\n" +
    "📸 důkazy\n" +
    "⚖️ výsledek řešení.",

  staffMeetings:
    "📅 **STAFF PORADY**\n\n" +
    "Interní porady staff týmu.\n\n" +
    "Témata mohou být:\n" +
    "• změny pravidel\n" +
    "• nábor\n" +
    "• eventy\n" +
    "• stížnosti\n" +
    "• aktivita staffu\n" +
    "• plánování serveru.",

  ticket:
    "🎫 **TICKET SYSTÉM**\n\n" +
    "Vyber typ problému.\n\n" +
    "🛠️ Podpora\n" +
    "🚨 Report hráče\n" +
    "🏠 Pozemek\n" +
    "🏢 Podnik\n" +
    "👮 Nábor\n" +
    "🔓 Unban\n" +
    "🤝 Partnerství\n\n" +
    "V ticketu může staff použít:\n" +
    "🛡️ Převzít ticket\n" +
    "👑 Předat vedení\n" +
    "🔒 Zavřít ticket."
};

/* =====================================================
   SETUP COMMAND
===================================================== */

const setupCommand = new SlashCommandBuilder()
  .setName("setup")
  .setDescription("Vytvoří kompletní Imperial CZ/SK RP server.")
  .setDefaultMemberPermissions(
    PermissionFlagsBits.Administrator
  );

/* =====================================================
   READY
===================================================== */

client.once("ready", async () => {

  console.log(`✅ ${client.user.tag} je online.`);

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
          body: [
            setupCommand.toJSON()
          ]
        }
      );

      console.log(
        `✅ /setup registrován na ${guild.name}`
      );

    } catch (error) {
      console.error(error);
    }
  }
});

/* =====================================================
   SETUP
===================================================== */

client.on(
  "interactionCreate",
  async interaction => {

    if (
      !interaction.isChatInputCommand()
    ) return;

    if (
      interaction.commandName !== "setup"
    ) return;

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

      const guild =
        interaction.guild;

      const roles = {};

      /* ROLE */

      for (
        const [name, color]
        of rolesList
      ) {

        roles[name] =
          await getRole(
            guild,
            name,
            color
          );
      }

      const everyone =
        guild.roles.everyone;

      /* STAFF PERMISSIONS */

      const staffOverwrites = [
        {
          id: everyone.id,
          deny: [
            PermissionsBitField.Flags.ViewChannel
          ]
        }
      ];

      for (
        const roleName
        of staffRoleNames
      ) {

        const role =
          roles[roleName];

        if (role) {

          staffOverwrites.push({
            id: role.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          });

        }
      }

      /* MANAGEMENT */

      const managementOverwrites = [
        {
          id: everyone.id,
          deny: [
            PermissionsBitField.Flags.ViewChannel
          ]
        }
      ];

      for (
        const roleName
        of managementRoleNames
      ) {

        const role =
          roles[roleName];

        if (role) {

          managementOverwrites.push({
            id: role.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory
            ]
          });

        }
      }

      /* =================================================
         INFORMACE
      ================================================= */

      const info =
        await getCategory(
          guild,
          "📌 INFORMACE"
        );

      const rules =
        await getChannel(
          guild,
          "📜・pravidla",
          info
        );

      const rp =
        await getChannel(
          guild,
          "🎭・rp-pravidla",
          info
        );

      const faq =
        await getChannel(
          guild,
          "❓・faq",
          info
        );

      const applications =
        await getChannel(
          guild,
          "📋・přihlášky",
          info
        );

      const announcements =
        await getChannel(
          guild,
          "📢・oznámení",
          info
        );

      const map =
        await getChannel(
          guild,
          "🗺️・mapa-emergency",
          info
        );

      /* =================================================
         GAME
      ================================================= */

      const game =
        await getCategory(
          guild,
          "🎮 HRA"
        );

      const properties =
        await getChannel(
          guild,
          "🏠・pozemky",
          game
        );

      const businesses =
        await getChannel(
          guild,
          "🏢・podniky",
          game
        );

      const economy =
        await getChannel(
          guild,
          "💰・ekonomika",
          game
        );

      const police =
        await getChannel(
          guild,
          "🚓・policie",
          game
        );

      const fire =
        await getChannel(
          guild,
          "🚒・hasiči",
          game
        );

      const medic =
        await getChannel(
          guild,
          "🚑・záchranáři",
          game
        );

      const criminal =
        await getChannel(
          guild,
          "🔫・kriminální-rp",
          game
        );

      const traffic =
        await getChannel(
          guild,
          "🚗・dopravní-pravidla",
          game
        );

      /* =================================================
         COMMUNITY
      ================================================= */

      const community =
        await getCategory(
          guild,
          "💬 KOMUNITA"
        );

      const chat =
        await getChannel(
          guild,
          "💬・chat",
          community
        );

      const publicEvents =
        await getChannel(
          guild,
          "🎉・eventy",
          community
        );

      /* =================================================
         STAFF
      ================================================= */

      const staff =
        await getCategory(
          guild,
          "🛡️ STAFF",
          staffOverwrites
        );

      const staffChat =
        await getChannel(
          guild,
          "🛡️・staff-chat",
          staff,
          staffOverwrites
        );

      const staffAnnouncements =
        await getChannel(
          guild,
          "📢・staff-oznámení",
          staff,
          staffOverwrites
        );

      const staffInfo =
        await getChannel(
          guild,
          "📋・staff-info",
          staff,
          staffOverwrites
        );

      const staffRP =
        await getChannel(
          guild,
          "📜・staff-rp-pravidla",
          staff,
          staffOverwrites
        );

      const staffPunishments =
        await getChannel(
          guild,
          "⚖️・staff-tresty",
          staff,
          staffOverwrites
        );

      const staffReports =
        await getChannel(
          guild,
          "🚨・staff-reporty",
          staff,
          staffOverwrites
        );

      const staffShifts =
        await getChannel(
          guild,
          "⏱️・staff-směny",
          staff,
          staffOverwrites
        );

      const leaderboard =
        await getChannel(
          guild,
          "🏆・staff-leaderboard",
          staff,
          staffOverwrites
        );

      const staffEvents =
        await getChannel(
          guild,
          "🎉・staff-eventy",
          staff,
          staffOverwrites
        );

      const staffMeetings =
        await getChannel(
          guild,
          "📅・staff-porady",
          staff,
          staffOverwrites
        );

      /* =================================================
         TICKETS
      ================================================= */

      const ticketCategory =
        await getCategory(
          guild,
          "🎫 TICKETY"
        );

      const ticketPanel =
        await getChannel(
          guild,
          "🎫・vytvořit-ticket",
          ticketCategory
        );

      /* =================================================
         VEDENÍ
      ================================================= */

      const management =
        await getCategory(
          guild,
          "👑 VEDENÍ",
          managementOverwrites
        );

      const managementChat =
        await getChannel(
          guild,
          "👑・vedení",
          management,
          managementOverwrites
        );

      const managementMeetings =
        await getChannel(
          guild,
          "📋・porady-vedení",
          management,
          managementOverwrites
        );

      /* =================================================
         LOGY
      ================================================= */

      const logs =
        await getCategory(
          guild,
          "📊 LOGY",
          staffOverwrites
        );

      const ticketLogs =
        await getChannel(
          guild,
          "🎫・ticket-log",
          logs,
          staffOverwrites
        );

      const staffLogs =
        await getChannel(
          guild,
          "🛡️・staff-log",
          logs,
          staffOverwrites
        );

      /* =================================================
         TEXTY DO KANÁLŮ
      ================================================= */

      await sendOnce(
        rules,
        TEXTS.rules
      );

      await sendOnce(
        rp,
        TEXTS.rp
      );

      await sendOnce(
        faq,
        TEXTS.faq
      );

      await sendOnce(
        applications,
        TEXTS.applications
      );

      await sendOnce(
        announcements,
        "📢 **OZNÁMENÍ**\n\n" +
        "Zde budou zveřejňována důležitá oznámení serveru."
      );

      await sendOnce(
        map,
        TEXTS.map
      );

      await sendOnce(
        properties,
        TEXTS.properties
      );

      await sendOnce(
        businesses,
        TEXTS.businesses
      );

      await sendOnce(
        economy,
        TEXTS.economy
      );

      await sendOnce(
        police,
        TEXTS.police
      );

      await sendOnce(
        fire,
        TEXTS.fire
      );

      await sendOnce(
        medic,
        TEXTS.medic
      );

      await sendOnce(
        criminal,
        TEXTS.criminal
      );

      await sendOnce(
        traffic,
        TEXTS.traffic
      );

      await sendOnce(
        chat,
        "💬 **VÍTEJ V KOMUNITĚ!**\n\n" +
        "Bav se, seznamuj se a respektuj ostatní. ❤️"
      );

      await sendOnce(
        publicEvents,
        TEXTS.eventsPublic
      );

      /* STAFF */

      await sendOnce(
        staffChat,
        TEXTS.staffChat
      );

      await sendOnce(
        staffAnnouncements,
        TEXTS.staffAnnouncements
      );

      await sendOnce(
        staffInfo,
        TEXTS.staffInfo
      );

      await sendOnce(
        staffRP,
        TEXTS.staffRP
      );

      await sendOnce(
        staffPunishments,
        TEXTS.punishments
      );

      await sendOnce(
        staffReports,
        TEXTS.staffReports
      );

      await sendOnce(
        staffShifts,
        TEXTS.shiftInfo
      );

      await sendOnce(
        staffEvents,
        TEXTS.eventsStaff
      );

      await sendOnce(
        staffMeetings,
        TEXTS.staffMeetings
      );

      await sendOnce(
        managementChat,
        "👑 **VEDENÍ**\n\n" +
        "Interní komunikace vedení projektu."
      );

      await sendOnce(
        managementMeetings,
        "📋 **PORADY VEDENÍ**\n\n" +
        "Interní plánování a rozhodnutí vedení."
      );

      await sendOnce(
        ticketLogs,
        "🎫 **TICKET LOG**\n\n" +
        "Logy ticket systému."
      );

      await sendOnce(
        staffLogs,
        "🛡️ **STAFF LOG**\n\n" +
        "Logy staff aktivit a směn."
      );

      /* =================================================
         TICKET PANEL
      ================================================= */

      const ticketEmbed =
        new EmbedBuilder()
          .setTitle(
            "🎫 IMPERIAL CZ/SK RP — TICKETY"
          )
          .setDescription(
            TEXTS.ticket
          )
          .setColor(0x5865F2);

      const row1 =
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

      const messages =
        await ticketPanel.messages.fetch({
          limit: 20
        });

      if (messages.size === 0) {

        await ticketPanel.send({
          embeds: [
            ticketEmbed
          ],
          components: [
            row1,
            row2
          ]
        });

      }

      /* =================================================
         LEADERBOARD
      ================================================= */

      await updateLeaderboard(
        leaderboard
      );

      await interaction.editReply(
        "✅ **SETUP DOKONČEN!**\n\n" +
        "📁 Kategorie vytvořeny\n" +
        "📜 Pravidla vložena\n" +
        "🎭 RP pravidla vložena\n" +
        "🛡️ Staff sekce vytvořena\n" +
        "⚖️ Staff tresty vloženy\n" +
        "📋 Přihlášky vytvořeny\n" +
        "🎉 Eventy vytvořeny\n" +
        "🎫 Ticket systém připraven\n" +
        "⏱️ OORP směny připraveny\n" +
        "🏆 Staff leaderboard připraven\n\n" +
        "🔥 Server je připraven!"
      );

    } catch (error) {

      console.error(
        "❌ SETUP ERROR:",
        error
      );

      await interaction.editReply(
        "❌ Setup selhal.\n\n" +
        "Zkontroluj, že má bot potřebná oprávnění."
      );
    }
  }
);

/* =====================================================
   TICKET SYSTÉM
===================================================== */

const ticketTypes = {
  ticket_support: {
    name: "podpora",
    label: "🛠️ Podpora"
  },

  ticket_report: {
    name: "report",
    label: "🚨 Report"
  },

  ticket_property: {
    name: "pozemek",
    label: "🏠 Pozemek"
  },

  ticket_business: {
    name: "podnik",
    label: "🏢 Podnik"
  },

  ticket_recruitment: {
    name: "nábor",
    label: "👮 Nábor"
  },

  ticket_unban: {
    name: "unban",
    label: "🔓 Unban"
  },

  ticket_partner: {
    name: "partnerstvi",
    label: "🤝 Partnerství"
  }
};

client.on(
  "interactionCreate",
  async interaction => {

    if (!interaction.isButton())
      return;

    const type =
      ticketTypes[
        interaction.customId
      ];

    if (!type)
      return;

    const guild =
      interaction.guild;

    const ticketCategory =
      guild.channels.cache.find(
        c =>
          c.type ===
            ChannelType.GuildCategory &&
          c.name === "🎫 TICKETY"
      );

    if (!ticketCategory) {
      return interaction.reply({
        content:
          "❌ Ticket kategorie neexistuje. Použij /setup.",
        ephemeral: true
      });
    }

    const safeName =
      `${type.name}-${interaction.user.username}`
        .toLowerCase()
        .replace(
          /[^a-z0-9-]/gi,
          "-"
        )
        .slice(0, 70);

    const existing =
      guild.channels.cache.find(
        c =>
          c.name === safeName &&
          c.type ===
            ChannelType.GuildText
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
        id:
          guild.roles.everyone.id,
        deny: [
          PermissionsBitField.Flags.ViewChannel
        ]
      },

      {
        id:
          interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      }
    ];

    for (
      const roleName
      of staffRoleNames
    ) {

      const role =
        guild.roles.cache.find(
          r =>
            r.name ===
            roleName
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

    const channel =
      await guild.channels.create({
        name: safeName,
        type:
          ChannelType.GuildText,
        parent:
          ticketCategory.id,
        permissionOverwrites:
          overwrites
      });

    const embed =
      new EmbedBuilder()
        .setTitle(
          type.label
        )
        .setDescription(
          `👤 **Autor:** ${interaction.user}\n\n` +
          "Děkujeme za vytvoření ticketu.\n\n" +
          "📝 Popiš problém co nejpodrobněji.\n" +
          "📸 Pokud máš důkazy, přilož je.\n\n" +
          "Staff může ticket převzít nebo předat vedení."
        )
        .setColor(0x5865F2);

    const buttons =
      new ActionRowBuilder()
        .addComponents(

          new ButtonBuilder()
            .setCustomId(
              "ticket_claim"
            )
            .setLabel(
              "🛡️ Převzít ticket"
            )
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
            .setLabel(
              "🔒 Zavřít"
            )
            .setStyle(
              ButtonStyle.Danger
            )
        );

    await channel.send({
      content:
        `${interaction.user} ${getStaffMentions(guild)}`,

      embeds: [
        embed
      ],

      components: [
        buttons
      ]
    });

    await interaction.reply({
      content:
        `✅ Ticket vytvořen: ${channel}`,
      ephemeral: true
    });
  }
);

/* =====================================================
   TICKET AKCE
===================================================== */

client.on(
  "interactionCreate",
  async interaction => {

    if (!interaction.isButton())
      return;

    if (
      ![
        "ticket_claim",
        "ticket_management",
        "ticket_close"
      ].includes(
        interaction.customId
      )
    ) return;

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

    /* CLAIM */

    if (
      interaction.customId ===
      "ticket_claim"
    ) {

      await interaction.reply(
        `🛡️ Ticket převzal ${interaction.user}.`
      );

      return;
    }

    /* MANAGEMENT */

    if (
      interaction.customId ===
      "ticket_management"
    ) {

      const management =
        managementRoleNames
          .map(name =>
            interaction.guild.roles.cache.find(
              r =>
                r.name === name
            )
          )
          .filter(Boolean);

      for (
        const role
        of management
      ) {

        await interaction.channel
          .permissionOverwrites
          .edit(
            role.id,
            {
              ViewChannel: true,
              SendMessages: true,
              ReadMessageHistory: true
            }
          );

      }

      await interaction.reply(
        "👑 **Ticket byl předán vedení.**\n\n" +
        getManagementMentions(
          interaction.guild
        )
      );

      return;
    }

    /* CLOSE */

    if (
      interaction.customId ===
      "ticket_close"
    ) {

      await interaction.reply(
        "🔒 Ticket bude uzavřen za 5 sekund."
      );

      setTimeout(
        async () => {

          try {

            await interaction.channel.delete(
              "Ticket uzavřen"
            );

          } catch {}

        },
        5000
      );
    }
  }
);

/* =====================================================
   STAFF SHIFT COMMANDS
===================================================== */

client.on(
  "messageCreate",
  async message => {

    if (message.author.bot)
      return;

    if (!message.guild)
      return;

    const content =
      message.content
        .trim()
        .toLowerCase();

    if (
      ![
        "!startshift",
        "!endshift",
        "!shift",
        "!myhours",
        "!leaderboard"
      ].includes(content)
    ) return;

    if (!isStaff(message.member)) {

      return message.reply(
        "❌ Tento příkaz je pouze pro staff."
      );

    }

    const userId =
      message.author.id;

    if (!staffData.users[userId]) {

      staffData.users[userId] = {
        totalSeconds: 0,
        activeSince: null,
        username:
          message.author.username
      };

    }

    const user =
      staffData.users[userId];

    user.username =
      message.author.username;

    /* START */

    if (
      content ===
      "!startshift"
    ) {

      if (user.activeSince) {

        return message.reply(
          "🟡 Už máš aktivní směnu."
        );

      }

      user.activeSince =
        Date.now();

      saveData();

      await message.reply(
        "🟢 **OORP SMĚNA ZAHÁJENA**\n\n" +
        `👤 ${message.author}\n` +
        `🕐 ${new Date().toLocaleString("cs-CZ")}\n\n` +
        "Použij `!endshift`, až směnu dokončíš."
      );

      await logShift(
        message.guild,
        `🟢 ${message.author.tag} zahájil OORP směnu.`
      );

      return;
    }

    /* END */

    if (
      content ===
      "!endshift"
    ) {

      if (!user.activeSince) {

        return message.reply(
          "🔴 Nemáš aktivní směnu."
        );

      }

      const now =
        Date.now();

      const seconds =
        Math.floor(
          (now -
            user.activeSince) /
            1000
        );

      user.totalSeconds +=
        seconds;

      user.activeSince =
        null;

      saveData();

      const duration =
        formatDuration(
          seconds
        );

      const total =
        formatDuration(
          user.totalSeconds
        );

      await message.reply(
        "🔴 **OORP SMĚNA UKONČENA**\n\n" +
        `👤 ${message.author}\n` +
        `⏱️ Délka směny: **${duration}**\n` +
        `🏆 Celkem: **${total}**`
      );

      await logShift(
        message.guild,
        `🔴 ${message.author.tag} ukončil OORP směnu. Délka: ${duration}`
      );

      await refreshLeaderboard(
        message.guild
      );

      return;
    }

    /* SHIFT */

    if (
      content ===
      "!shift"
    ) {

      if (!user.activeSince) {

        return message.reply(
          "🔴 Momentálně nemáš aktivní směnu."
        );

      }

      const seconds =
        Math.floor(
          (Date.now() -
            user.activeSince) /
            1000
        );

      return message.reply(
        "🟢 **TVÁ AKTIVNÍ SMĚNA**\n\n" +
        `⏱️ Aktuálně: **${formatDuration(seconds)}**`
      );
    }

    /* HOURS */

    if (
      content ===
      "!myhours"
    ) {

      let seconds =
        user.totalSeconds;

      if (user.activeSince) {

        seconds +=
          Math.floor(
            (Date.now() -
              user.activeSince) /
              1000
          );

      }

      return message.reply(
        "🏆 **TVŮJ OORP ČAS**\n\n" +
        `⏱️ ${formatDuration(seconds)}`
      );
    }

    /* LEADERBOARD */

    if (
      content ===
      "!leaderboard"
    ) {

      const text =
        createLeaderboard();

      return message.reply(
        text
      );
    }
  }
);

/* =====================================================
   FORMAT TIME
===================================================== */

function formatDuration(
  seconds
) {

  seconds =
    Math.max(
      0,
      Math.floor(seconds)
    );

  const hours =
    Math.floor(
      seconds / 3600
    );

  const minutes =
    Math.floor(
      (seconds % 3600) /
      60
    );

  const secs =
    seconds % 60;

  return (
    `${hours} h ` +
    `${minutes} min ` +
    `${secs} s`
  );
}

/* =====================================================
   LEADERBOARD
===================================================== */

function createLeaderboard() {

  const users =
    Object.entries(
      staffData.users
    )
      .map(
        ([id, data]) => {

          let seconds =
            data.totalSeconds;

          if (data.activeSince) {

            seconds +=
              Math.floor(
                (Date.now() -
                  data.activeSince) /
                  1000
              );

          }

          return {
            id,
            username:
              data.username ||
              "Neznámý",
            seconds
          };
        }
      )
      .sort(
        (a, b) =>
          b.seconds -
          a.seconds
      );

  if (users.length === 0) {

    return (
      "🏆 **STAFF OORP LEADERBOARD**\n\n" +
      "Zatím nejsou žádné směny."
    );

  }

  let text =
    "🏆 **STAFF OORP LEADERBOARD**\n\n";

  const medals = [
    "🥇",
    "🥈",
    "🥉"
  ];

  users
    .slice(0, 10)
    .forEach(
      (user, index) => {

        const medal =
          medals[index] ||
          `${index + 1}.`;

        text +=
          `${medal} **${user.username}** — ${formatDuration(user.seconds)}\n`;
      }
    );

  return text;
}

/* =====================================================
   LEADERBOARD CHANNEL
===================================================== */

async function updateLeaderboard(
  channel
) {

  const messages =
    await channel.messages.fetch({
      limit: 10
    });

  const text =
    createLeaderboard();

  if (messages.size === 0) {

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(
            "🏆 STAFF OORP LEADERBOARD"
          )
          .setDescription(
            text
          )
          .setColor(
            0xFFD700
          )
      ]
    });

  } else {

    const message =
      messages.first();

    if (
      message &&
      message.author.id ===
      client.user.id
    ) {

      await message.edit({
        embeds: [
          new EmbedBuilder()
            .setTitle(
              "🏆 STAFF OORP LEADERBOARD"
            )
            .setDescription(
              text
            )
            .setColor(
              0xFFD700
            )
        ]
      });

    }

  }
}

async function refreshLeaderboard(
  guild
) {

  const channel =
    guild.channels.cache.find(
      c =>
        c.name ===
        "🏆・staff-leaderboard"
    );

  if (!channel)
    return;

  await updateLeaderboard(
    channel
  );
}

/* =====================================================
   LOG SMĚN
===================================================== */

async function logShift(
  guild,
  text
) {

  const channel =
    guild.channels.cache.find(
      c =>
        c.name ===
        "🛡️・staff-log"
    );

  if (!channel)
    return;

  await channel.send(
    text
  );
}

/* =====================================================
   MENTIONS
===================================================== */

function getStaffMentions(
  guild
) {

  return staffRoleNames
    .map(name =>
      guild.roles.cache.find(
        r =>
          r.name === name
      )
    )
    .filter(Boolean)
    .map(role =>
      `<@&${role.id}>`
    )
    .join(" ");
}

function getManagementMentions(
  guild
) {

  return managementRoleNames
    .map(name =>
      guild.roles.cache.find(
        r =>
          r.name === name
      )
    )
    .filter(Boolean)
    .map(role =>
      `<@&${role.id}>`
    )
    .join(" ");
}

/* =====================================================
   AUTOMATICKÁ AKTUALIZACE LEADERBOARDU
===================================================== */

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
          "Leaderboard error:",
          error
        );

      }

    }

  },
  60000
);

/* =====================================================
   MEMBER LOG
===================================================== */

client.on(
  "guildMemberAdd",
  async member => {

    const channel =
      member.guild.channels.cache.find(
        c =>
          c.name ===
          "🛡️・staff-log"
      );

    if (!channel)
      return;

    await channel.send(
      `📥 **NOVÝ ČLEN**\n👤 ${member.user.tag}\n🆔 ${member.id}`
    );
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

    if (!channel)
      return;

    await channel.send(
      `📤 **ČLEN ODEŠEL**\n👤 ${member.user.tag}\n🆔 ${member.id}`
    );
  }
);

/* =====================================================
   LOGIN
===================================================== */

client.login(TOKEN);

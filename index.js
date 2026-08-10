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

const PREFIX = "!";

// RAID CONFIG
const RAID_WINDOW = 15000;       // 15 sekund
const RAID_THRESHOLD = 8;        // 8 joinů = podezření
const RAID_SCORE_LIMIT = 12;
const RAID_COOLDOWN = 10 * 60 * 1000;

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

// =====================================================
// DATA
// =====================================================

const dataFile = path.join(__dirname, "imperial-data.json");

let data = {
    users: {},
    raids: {},
    guilds: {}
};

function loadData() {
    try {
        if (fs.existsSync(dataFile)) {
            data = JSON.parse(
                fs.readFileSync(dataFile, "utf8")
            );
        }
    } catch (error) {
        console.error("❌ Chyba při načítání dat:", error);
        data = {
            users: {},
            raids: {},
            guilds: {}
        };
    }
}

function saveData() {
    try {
        fs.writeFileSync(
            dataFile,
            JSON.stringify(data, null, 2)
        );
    } catch (error) {
        console.error("❌ Chyba při ukládání dat:", error);
    }
}

loadData();

// =====================================================
// RAID MEMORY
// =====================================================

const raidMemory = new Map();

// guildId -> {
//   active: boolean,
//   startedAt,
//   snapshot: []
// }

const raidStates = new Map();

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

const FRACTION_ROLES = [
    "🚓 Velitel policie",
    "👮 Policista",
    "🚒 Velitel hasičů",
    "🔥 Hasič",
    "🚑 Velitel záchranářů",
    "🩺 Záchranář"
];

// =====================================================
// EMBED COLORS
// =====================================================

const COLORS = {
    imperial: 0x5865f2,
    success: 0x57f287,
    warning: 0xfee75c,
    danger: 0xed4245,
    dark: 0x23272a,
    gold: 0xffd700,
    staff: 0x9b59b6
};

// =====================================================
// HELPERS
// =====================================================

function isStaff(member) {
    if (!member) return false;

    return member.roles.cache.some(role =>
        STAFF_ROLES.includes(role.name)
    );
}

function isManagement(member) {
    if (!member) return false;

    return member.roles.cache.some(role =>
        MANAGEMENT_ROLES.includes(role.name)
    );
}

function isOwnerOrManagement(member) {
    if (!member) return false;

    return (
        member.permissions.has(
            PermissionFlagsBits.Administrator
        ) ||
        isManagement(member)
    );
}

function formatTime(seconds) {
    seconds = Math.max(0, Math.floor(seconds));

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${h} h ${m} min ${s} s`;
}

function createEmbed(title, description, color = COLORS.imperial) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp()
        .setFooter({
            text: "Imperial CZ/SK • Emergency Hamburg RP"
        });
}

async function sendOnce(channel, payload) {
    try {
        const messages = await channel.messages.fetch({
            limit: 20
        });

        const exists = messages.find(
            message =>
                message.author.id === client.user.id
        );

        if (!exists) {
            await channel.send(payload);
        }
    } catch (error) {
        console.error(
            `❌ sendOnce ${channel.name}:`,
            error.message
        );
    }
}

// =====================================================
// ROLE CREATION
// =====================================================

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

        console.log(`✅ Role vytvořena: ${name}`);
    }

    return role;
}

// =====================================================
// CHANNEL CREATION
// =====================================================

async function getOrCreateCategory(
    guild,
    name,
    permissionOverwrites = undefined
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
    permissionOverwrites = undefined
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
// RAID DETECTION
// =====================================================

function getRaidData(guildId) {
    if (!raidMemory.has(guildId)) {
        raidMemory.set(guildId, []);
    }

    return raidMemory.get(guildId);
}

function calculateRaidScore(member, recentJoins) {
    let score = 0;

    if (recentJoins >= RAID_THRESHOLD) {
        score += 8;
    }

    const accountAge =
        Date.now() - member.user.createdTimestamp;

    const daysOld =
        accountAge / (1000 * 60 * 60 * 24);

    if (daysOld < 1) {
        score += 6;
    } else if (daysOld < 3) {
        score += 4;
    } else if (daysOld < 7) {
        score += 2;
    }

    if (member.user.bot) {
        score += 8;
    }

    return score;
}

async function checkRaid(member) {
    const guild = member.guild;

    if (isRaidActive(guild.id)) {
        return;
    }

    const now = Date.now();
    const joins = getRaidData(guild.id);

    joins.push({
        id: member.id,
        time: now
    });

    const filtered = joins.filter(
        join => now - join.time <= RAID_WINDOW
    );

    raidMemory.set(
        guild.id,
        filtered
    );

    const recentJoins = filtered.length;

    const score =
        calculateRaidScore(
            member,
            recentJoins
        );

    console.log(
        `🛡️ RAID CHECK | ${guild.name} | joins=${recentJoins} score=${score}`
    );

    if (
        recentJoins >= RAID_THRESHOLD &&
        score >= RAID_SCORE_LIMIT
    ) {
        await activateRaidLockdown(
            guild,
            `Automatická detekce raidu: ${recentJoins} připojení během ${RAID_WINDOW / 1000} sekund.`
        );
    }
}

// =====================================================
// RAID STATUS
// =====================================================

function isRaidActive(guildId) {
    const state = raidStates.get(guildId);

    return Boolean(
        state &&
        state.active
    );
}

// =====================================================
// RAID LOCKDOWN
// =====================================================

async function activateRaidLockdown(
    guild,
    reason = "Podezření na raid"
) {
    if (isRaidActive(guild.id)) {
        return;
    }

    console.log(
        `🚨 RAID LOCKDOWN: ${guild.name}`
    );

    const snapshot = [];

    const channels =
        guild.channels.cache.filter(
            channel =>
                channel.type === ChannelType.GuildText ||
                channel.type === ChannelType.GuildAnnouncement ||
                channel.type === ChannelType.GuildForum ||
                channel.type === ChannelType.GuildVoice
        );

    for (const channel of channels.values()) {
        try {
            const original = [];

            for (
                const overwrite
                of channel.permissionOverwrites.cache.values()
            ) {
                original.push({
                    id: overwrite.id,
                    type: overwrite.type,
                    allow: overwrite.allow.bitfield.toString(),
                    deny: overwrite.deny.bitfield.toString()
                });
            }

            snapshot.push({
                channelId: channel.id,
                overwrites: original
            });

            await channel.permissionOverwrites.edit(
                guild.roles.everyone.id,
                {
                    ViewChannel: false,
                    SendMessages: false,
                    AddReactions: false,
                    Connect: false,
                    Speak: false
                },
                {
                    reason: "🚨 Imperial Anti-Raid Lockdown"
                }
            );

            for (
                const role
                of guild.roles.cache.values()
            ) {
                if (
                    role.id === guild.id ||
                    role.managed
                ) {
                    continue;
                }

                try {
                    await channel.permissionOverwrites.edit(
                        role.id,
                        {
                            ViewChannel: false,
                            SendMessages: false,
                            Connect: false,
                            Speak: false
                        },
                        {
                            reason: "🚨 Imperial Anti-Raid Lockdown"
                        }
                    );
                } catch {}
            }
        } catch (error) {
            console.error(
                `❌ Lockdown ${channel.name}:`,
                error.message
            );
        }
    }

    raidStates.set(
        guild.id,
        {
            active: true,
            startedAt: Date.now(),
            reason,
            snapshot
        }
    );

    if (!data.raids[guild.id]) {
        data.raids[guild.id] = {
            total: 0
        };
    }

    data.raids[guild.id].total++;
    saveData();

    const logChannel =
        guild.channels.cache.find(
            c =>
                c.name === "🛡️・security-log" &&
                c.isTextBased()
        );

    if (logChannel) {
        await logChannel.send({
            embeds: [
                createEmbed(
                    "🚨 RAID DETECTOVÁN",
                    `**Imperial Anti-Raid systém aktivoval LOCKDOWN.**\n\n` +
                    `🔒 **Stav:** SERVER UZAMČEN\n` +
                    `📋 **Důvod:** ${reason}\n\n` +
                    `⚠️ Během lockdownu jsou uzamčeny i STAFF kanály.\n` +
                    `👑 Odemknutí: \`/unlock\``,
                    COLORS.danger
                )
            ]
        }).catch(() => {});
    }
}

// =====================================================
// RAID UNLOCK
// =====================================================

async function deactivateRaidLockdown(guild) {
    const state = raidStates.get(guild.id);

    if (!state || !state.active) {
        return false;
    }

    console.log(
        `🔓 RAID LOCKDOWN UKONČEN: ${guild.name}`
    );

    for (const saved of state.snapshot) {
        const channel =
            guild.channels.cache.get(
                saved.channelId
            );

        if (!channel) {
            continue;
        }

        try {
            await channel.permissionOverwrites.set(
                saved.overwrites.map(
                    overwrite => ({
                        id: overwrite.id,
                        type: overwrite.type,
                        allow: BigInt(
                            overwrite.allow
                        ),
                        deny: BigInt(
                            overwrite.deny
                        )
                    })
                )
            );
        } catch (error) {
            console.error(
                `❌ Obnova ${channel.name}:`,
                error.message
            );
        }
    }

    raidStates.delete(guild.id);

    const logChannel =
        guild.channels.cache.find(
            c =>
                c.name === "🛡️・security-log" &&
                c.isTextBased()
        );

    if (logChannel) {
        await logChannel.send({
            embeds: [
                createEmbed(
                    "🔓 SERVER ODEMČEN",
                    "Anti-Raid lockdown byl ukončen.\n\n" +
                    "✅ Původní oprávnění kanálů byla obnovena.\n" +
                    "🟢 Server je opět dostupný.",
                    COLORS.success
                )
            ]
        }).catch(() => {});
    }

    return true;
}

// =====================================================
// TEXT CONTENT
// =====================================================

const TEXT = {

    welcome: `
# 🇨🇿🇸🇰 VÍTEJ V IMPERIAL CZ/SK

Vítej na oficiálním Discord serveru našeho Emergency Hamburg RP projektu.

🎭 **Co u nás najdeš**
• realistické CZ/SK RP
• policii, hasiče a záchranáře
• vlastní eventy
• komunitu hráčů
• staff tým
• systém ticketů
• nábor do týmu
• vlastní ekonomiku a RP systém

🎮 Naším cílem je vytvořit server, kde RP není pouze o honičkách a střelbě, ale hlavně o příběhu, komunikaci a spolupráci.

📌 Než začneš hrát, projdi si pravidla.
    `,

    rules: `
# 📜 PRAVIDLA DISCORDU

**1. Respekt**
Chovej se slušně ke všem členům. Urážky, šikana, vyhrožování a cílené obtěžování nejsou tolerovány.

**2. Spam**
Zákaz floodu, spamu, zbytečného pingování a zahlcování kanálů.

**3. Reklama**
Reklama jiných serverů, projektů nebo služeb bez povolení vedení je zakázána.

**4. Osobní údaje**
Nikdy nezveřejňuj cizí osobní údaje.

**5. Staff**
Nevydávej se za člena staffu a nepoužívej falešné informace o vedení.

**6. NSFW**
Nevhodný obsah na server nepatří.

**7. Konflikty**
Problémy řeš přes staff nebo ticket. Neřeš veřejně osobní konflikty.

**8. Discord ToS**
Každý člen musí dodržovat pravidla Discordu.

⚠️ Porušení může vést k warnu, timeoutu, kicku nebo banu.
    `,

    rpRules: `
# 🎭 RP PRAVIDLA

**FailRP**
Chování, které nedává smysl v dané RP situaci.

**RDM**
Napadení nebo zabití hráče bez odpovídajícího RP důvodu.

**VDM**
Použití vozidla jako zbraně bez odpovídajícího RP důvodu.

**NLR**
Po smrti si postava nesmí automaticky pamatovat předchozí situaci.

**Metagaming**
Používání informací získaných mimo RP.

**Powergaming**
Vynucování nereálných akcí nebo výsledků na jiném hráči.

**FearRP**
Pokud je tvoje postava v ohrožení života, musí se podle toho chovat.

**Combat Logging**
Odpojení ze hry za účelem vyhnutí se RP situaci.

**Cop Baiting**
Zbytečné a úmyslné provokování policie.

**Revenge RP**
Pomsta za situaci, kterou postava nemá možnost znát.

**NVL**
Ignorování hodnoty vlastního života.

🎭 Hraj realisticky, respektuj ostatní a dávej přednost kvalitnímu RP před výhrou.
    `,

    applications: `
# 📋 NÁBOR DO IMPERIAL TÝMU

Chceš se stát součástí našeho týmu?

👮 **ADMINISTRÁTOR**
Pomáhá hráčům, řeší reporty a dohlíží na pravidla.

🎉 **EVENT TÝM**
Připravuje a organizuje komunitní eventy.

📸 **MEDIA TÝM**
Tvoří videa, screenshoty a další obsah.

🤝 **PARTNERSHIP TÝM**
Stará se o spolupráce s dalšími projekty.

⚙️ **VÝVOJ**
Pomáhá s botem, Discordem a technickou částí projektu.

🎫 Přihlášku vytvoříš přes ticket.

⚠️ Falešné informace v přihlášce mohou vést k zamítnutí.
    `,

    staffRules: `
# 🛡️ STAFF PRAVIDLA

1️⃣ Staff je nestranný.
2️⃣ Staff nezvýhodňuje kamarády.
3️⃣ Pravomoci se nepoužívají pro vlastní výhodu.
4️⃣ Staff nesmí zneužívat OORP informace.
5️⃣ Každý report se musí nejprve objektivně prověřit.
6️⃣ Pokud je to možné, vyžádej důkazy.
7️⃣ Závažné tresty řeš se Senior Adminem.
8️⃣ Konflikt zájmů předávej jinému staff členovi.
9️⃣ Interní informace se nesmí zveřejňovat.
🔟 Zneužití pravomocí může znamenat okamžité odebrání role.
    `,

    events: `
# 🎉 IMPERIAL EVENTY

Na tomto místě budou zveřejňovány komunitní eventy.

🚗 Car Meet
🏁 Závody
🚓 Policejní akce
🚒 Hasičský zásah
🚑 Hromadná nehoda
🚨 Velká policejní honička
🏦 Bankovní loupež
💎 Loupež klenotnictví
🚌 Veřejná doprava
🎭 Velké městské RP
📸 Screenshot event
🏆 Turnaj
🎁 Soutěž

U každého eventu bude uvedeno:
📅 datum
🕐 čas
📍 místo
👥 potřebné složky
📜 pravidla
    `,

    factions: `
# 🚨 FRAKCE A HODNOSTI

## 🚓 POLICIE
👮 Policista
🚓 Velitel policie

## 🚒 HASIČI
🔥 Hasič
🚒 Velitel hasičů

## 🚑 ZÁCHRANÁŘI
🩺 Záchranář
🚑 Velitel záchranářů

Každá frakce má vlastní RP strukturu, pravomoci a odpovědnost.

⚠️ Hodnosti není možné získat pouze požádáním staffu. O jejich přidělení rozhoduje vedení nebo příslušné vedení frakce.
    `,

    ticket: `
# 🎫 IMPERIAL TICKET SYSTEM

Vyber si typ požadavku:

🛠️ **Podpora**
Pomoc s Discordem nebo RP.

🚨 **Report**
Nahlášení hráče nebo problému.

🏠 **Pozemek**
Žádost o RP pozemek.

🏢 **Podnik**
Žádost o RP podnik.

👮 **Nábor**
Přihláška do týmu.

🔓 **Unban**
Žádost o přezkoumání banu.

🤝 **Partnerství**
Nabídka spolupráce.

🔒 Ticket používej pouze pro skutečný problém.
    `
};

// =====================================================
// SLASH COMMANDS
// =====================================================

const commands = [

    new SlashCommandBuilder()
        .setName("setup")
        .setDescription(
            "Nastaví kompletní Imperial CZ/SK server."
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),

    new SlashCommandBuilder()
        .setName("raidstatus")
        .setDescription(
            "Zobrazí stav Anti-Raid systému."
        ),

    new SlashCommandBuilder()
        .setName("lockdown")
        .setDescription(
            "Ruční aktivace server lockdownu."
        ),

    new SlashCommandBuilder()
        .setName("unlock")
        .setDescription(
            "Ruční ukončení server lockdownu."
        )
];

// =====================================================
// READY
// =====================================================

client.once("ready", async () => {

    console.log(
        `✅ Imperial bot online jako ${client.user.tag}`
    );

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
                    body: commands.map(
                        command =>
                            command.toJSON()
                    )
                }
            );

            console.log(
                `✅ Slash commandy registrovány: ${guild.name}`
            );

        } catch (error) {

            console.error(
                `❌ Command registration ${guild.name}:`,
                error
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

                // ROLES

                for (
                    const [name, color]
                    of ROLE_CONFIG
                ) {
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

                const factions =
                    await getOrCreateChannel(
                        guild,
                        "🚨・frakce-a-hodnosti",
                        info
                    );

                const announcements =
                    await getOrCreateChannel(
                        guild,
                        "📢・oznámení",
                        info
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

                const staffLogs =
                    await getOrCreateChannel(
                        guild,
                        "📊・staff-log",
                        staff,
                        staffPerms
                    );

                const security =
                    await getOrCreateChannel(
                        guild,
                        "🛡️・security-log",
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

                const meetings =
                    await getOrCreateChannel(
                        guild,
                        "📋・porady-vedení",
                        management,
                        managementPerms
                    );

                // HRA

                const game =
                    await getOrCreateCategory(
                        guild,
                        "🎮 HRA"
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

                const economy =
                    await getOrCreateChannel(
                        guild,
                        "💰・ekonomika",
                        game
                    );

                // TEXTY

                await sendOnce(
                    welcome,
                    {
                        embeds: [
                            createEmbed(
                                "🇨🇿🇸🇰 VÍTEJ V IMPERIAL CZ/SK",
                                TEXT.welcome,
                                COLORS.imperial
                            )
                        ]
                    }
                );

                await sendOnce(
                    rules,
                    {
                        embeds: [
                            createEmbed(
                                "📜 PRAVIDLA DISCORDU",
                                TEXT.rules,
                                COLORS.warning
                            )
                        ]
                    }
                );

                await sendOnce(
                    rpRules,
                    {
                        embeds: [
                            createEmbed(
                                "🎭 RP PRAVIDLA",
                                TEXT.rpRules,
                                COLORS.imperial
                            )
                        ]
                    }
                );

                await sendOnce(
                    applications,
                    {
                        embeds: [
                            createEmbed(
                                "📋 NÁBOR DO IMPERIAL TÝMU",
                                TEXT.applications,
                                COLORS.staff
                            )
                        ]
                    }
                );

                await sendOnce(
                    factions,
                    {
                        embeds: [
                            createEmbed(
                                "🚨 FRAKCE A HODNOSTI",
                                TEXT.factions,
                                COLORS.imperial
                            )
                        ]
                    }
                );

                await sendOnce(
                    events,
                    {
                        embeds: [
                            createEmbed(
                                "🎉 IMPERIAL EVENTY",
                                TEXT.events,
                                COLORS.gold
                            )
                        ]
                    }
                );

                await sendOnce(
                    chat,
                    {
                        embeds: [
                            createEmbed(
                                "💬 KOMUNITNÍ CHAT",
                                "Vítej v komunitě Imperial CZ/SK.\n\n" +
                                "🤝 Respektuj ostatní.\n" +
                                "🎭 Užívej si RP.\n" +
                                "🎉 Zapoj se do eventů.",
                                COLORS.success
                            )
                        ]
                    }
                );

                await sendOnce(
                    police,
                    "🚓 **POLICIE**\n\nInformace a RP komunikace policie."
                );

                await sendOnce(
                    fire,
                    "🚒 **HASIČI**\n\nInformace a RP komunikace hasičů."
                );

                await sendOnce(
                    medic,
                    "🚑 **ZÁCHRANÁŘI**\n\nInformace a RP komunikace ZZS."
                );

                await sendOnce(
                    criminal,
                    "🔫 **KRIMINÁLNÍ RP**\n\nKriminální RP musí být realistické a respektovat pravidla."
                );

                await sendOnce(
                    economy,
                    "💰 **EKONOMIKA**\n\nRP peníze, podniky a ekonomické systémy."
                );

                await sendOnce(
                    staffChat,
                    {
                        embeds: [
                            createEmbed(
                                "🛡️ STAFF CHAT",
                                "Interní komunikace Imperial Staff týmu.",
                                COLORS.staff
                            )
                        ]
                    }
                );

                await sendOnce(
                    staffShifts,
                    {
                        embeds: [
                            createEmbed(
                                "⏱️ STAFF SMĚNY",
                                "`!startshift` — začít směnu\n" +
                                "`!endshift` — ukončit směnu\n" +
                                "`!shift` — aktuální směna\n" +
                                "`!myhours` — celkový čas\n" +
                                "`!leaderboard` — leaderboard",
                                COLORS.staff
                            )
                        ]
                    }
                );

                await sendOnce(
                    managementChat,
                    "👑 **VEDENÍ IMPERIAL**\n\nInterní komunikace vedení."
                );

                await sendOnce(
                    meetings,
                    "📋 **PORADY VEDENÍ**\n\nPlánování projektu, RP a dalších aktivit."
                );

                // SECURITY

                await sendOnce(
                    security,
                    {
                        embeds: [
                            createEmbed(
                                "🛡️ IMPERIAL SECURITY",
                                "Anti-Raid systém je aktivní.\n\n" +
                                "🚨 Automaticky sleduje podezřelé přílivy členů.\n" +
                                "🔒 Při potvrzeném raidu aktivuje lockdown.\n" +
                                "🔓 Po zásahu vedení lze server odemknout.",
                                COLORS.danger
                            )
                        ]
                    }
                );

                // TICKET PANEL

                const messages =
                    await ticketPanel.messages.fetch({
                        limit: 20
                    });

                const hasPanel =
                    messages.some(
                        message =>
                            message.author.id ===
                            client.user.id
                    );

                if (!hasPanel) {

                    const embed =
                        createEmbed(
                            "🎫 IMPERIAL TICKET SYSTEM",
                            TEXT.ticket,
                            COLORS.imperial
                        );

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
                                        "ticket_recruitment"
                                    )
                                    .setLabel(
                                        "👮 Nábor"
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
                                        "ticket_property"
                                    )
                                    .setLabel(
                                        "🏠 Pozemek"
                                    )
                                    .setStyle(
                                        ButtonStyle.Secondary
                                    ),

                                new ButtonBuilder()
                                    .setCustomId(
                                        "ticket_business"
                                    )
                                    .setLabel(
                                        "🏢 Podnik"
                                    )
                                    .setStyle(
                                        ButtonStyle.Secondary
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
                            row1,
                            row2
                        ]
                    });
                }

                await updateLeaderboard(
                    leaderboard
                );

                await interaction.editReply(
                    "✅ **IMPERIAL SERVER ÚSPĚŠNĚ NASTAVEN!**\n\n" +
                    "🎨 Vizuální systém → HOTOVO\n" +
                    "🎫 Tickety → HOTOVO\n" +
                    "🛡️ Staff → HOTOVO\n" +
                    "🚨 Anti-Raid → AKTIVNÍ\n" +
                    "👮 Frakce → HOTOVO\n" +
                    "⏱️ Směny → HOTOVO\n" +
                    "🏆 Leaderboard → HOTOVO\n" +
                    "📊 Security log → HOTOVO\n\n" +
                    "👑 Imperial CZ/SK je připraven."
                );

            } catch (error) {

                console.error(
                    "❌ SETUP ERROR:",
                    error
                );

                await interaction.editReply(
                    "❌ Setup se nepodařilo dokončit.\n\n" +
                    "Zkontroluj Railway logy a oprávnění bota."
                );
            }

            return;
        }

        // =================================================
        // RAID STATUS
        // =================================================

        if (
            interaction.commandName ===
            "raidstatus"
        ) {

            const active =
                isRaidActive(
                    interaction.guild.id
                );

            return interaction.reply({
                embeds: [
                    createEmbed(
                        active
                            ? "🚨 RAID LOCKDOWN AKTIVNÍ"
                            : "🟢 SERVER JE V POŘÁDKU",
                        active
                            ? "Server je momentálně uzamčen kvůli bezpečnostnímu incidentu."
                            : "Anti-Raid systém běží a server není v lockdownu.",
                        active
                            ? COLORS.danger
                            : COLORS.success
                    )
                ],
                ephemeral: true
            });
        }

        // =================================================
        // LOCKDOWN
        // =================================================

        if (
            interaction.commandName ===
            "lockdown"
        ) {

            if (
                !isOwnerOrManagement(
                    interaction.member
                )
            ) {
                return interaction.reply({
                    content:
                        "❌ Tento příkaz může použít pouze vedení.",
                    ephemeral: true
                });
            }

            await interaction.deferReply({
                ephemeral: true
            });

            await activateRaidLockdown(
                interaction.guild,
                "Ruční aktivace vedením."
            );

            return interaction.editReply(
                "🚨 **SERVER BYL UZAMČEN.**"
            );
        }

        // =================================================
        // UNLOCK
        // =================================================

        if (
            interaction.commandName ===
            "unlock"
        ) {

            if (
                !isOwnerOrManagement(
                    interaction.member
                )
            ) {
                return interaction.reply({
                    content:
                        "❌ Tento příkaz může použít pouze vedení.",
                    ephemeral: true
                });
            }

            await interaction.deferReply({
                ephemeral: true
            });

            const unlocked =
                await deactivateRaidLockdown(
                    interaction.guild
                );

            return interaction.editReply(
                unlocked
                    ? "🔓 **SERVER BYL ODEMČEN.**"
                    : "🟢 Server už není v lockdownu."
            );
        }
    }
);

// =====================================================
// TICKETS
// =====================================================

const TICKET_TYPES = {
    ticket_support: ["podpora", "🛠️ Podpora"],
    ticket_report: ["report", "🚨 Report"],
    ticket_property: ["pozemek", "🏠 Pozemek"],
    ticket_business: ["podnik", "🏢 Podnik"],
    ticket_recruitment: ["nabor", "👮 Nábor"],
    ticket_unban: ["unban", "🔓 Unban"],
    ticket_partner: ["partnerstvi", "🤝 Partnerství"]
};

client.on(
    "interactionCreate",
    async interaction => {

        if (
            !interaction.isButton()
        ) {
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
                channel =>
                    channel.type ===
                        ChannelType.GuildCategory &&
                    channel.name ===
                        "🎫 TICKETY"
            );

        if (!category) {
            return interaction.reply({
                content:
                    "❌ Ticket systém není nastaven. Použij `/setup`.",
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
                    PermissionsBitField.Flags.AttachFiles
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
                        r.name ===
                        roleName
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
            createEmbed(
                `${type[1]} • IMPERIAL`,
                `👤 **Autor:** ${interaction.user}\n\n` +
                `📝 Popiš svůj problém co nejpodrobněji.\n` +
                `📸 Pokud máš důkazy, přilož je.\n\n` +
                `🛡️ Staff se ti bude věnovat.\n` +
                `⚠️ Zbytečné tickety mohou být uzavřeny.`,
                COLORS.imperial
            );

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

        if (
            !interaction.isButton()
        ) {
            return;
        }

        if (
            ![
                "ticket_claim",
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
                    "❌ Tuto funkci může použít pouze staff.",
                ephemeral: true
            });
        }

        if (
            interaction.customId ===
            "ticket_claim"
        ) {

            await interaction.reply({
                embeds: [
                    createEmbed(
                        "🛡️ TICKET PŘEVZAT",
                        `Ticket převzal ${interaction.user}.`,
                        COLORS.success
                    )
                ]
            });

            return;
        }

        if (
            interaction.customId ===
            "ticket_close"
        ) {

            await interaction.reply({
                embeds: [
                    createEmbed(
                        "🔒 TICKET SE ZAVŘE",
                        "Ticket bude automaticky odstraněn za 5 sekund.",
                        COLORS.danger
                    )
                ]
            });

            setTimeout(
                async () => {

                    try {
                        await interaction.channel.delete(
                            "Imperial ticket closed"
                        );
                    } catch {}
                },
                5000
            );
        }
    }
);

// =====================================================
// STAFF COMMANDS
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

        const commands =
            [
                "!startshift",
                "!endshift",
                "!shift",
                "!myhours",
                "!leaderboard"
            ];

        if (
            !commands.includes(command)
        ) {
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

        const id =
            message.author.id;

        if (!data.users[id]) {
            data.users[id] = {
                username:
                    message.author.username,
                totalSeconds: 0,
                activeSince: null
            };
        }

        const user =
            data.users[id];

        user.username =
            message.author.username;

        if (
            command ===
            "!startshift"
        ) {

            if (
                user.activeSince
            ) {
                return message.reply(
                    "🟡 Už máš aktivní směnu."
                );
            }

            user.activeSince =
                Date.now();

            saveData();

            return message.reply({
                embeds: [
                    createEmbed(
                        "🟢 SMĚNA ZAHÁJENA",
                        `👤 ${message.author}\n` +
                        `🕐 ${new Date().toLocaleString("cs-CZ")}\n\n` +
                        "Po skončení použij `!endshift`.",
                        COLORS.success
                    )
                ]
            });
        }

        if (
            command ===
            "!endshift"
        ) {

            if (
                !user.activeSince
            ) {
                return message.reply(
                    "🔴 Nemáš aktivní směnu."
                );
            }

            const seconds =
                Math.floor(
                    (
                        Date.now() -
                        user.activeSince
                    ) / 1000
                );

            user.totalSeconds +=
                seconds;

            user.activeSince =
                null;

            saveData();

            return message.reply({
                embeds: [
                    createEmbed(
                        "🔴 SMĚNA UKONČENA",
                        `⏱️ Tato směna: **${formatTime(seconds)}**\n` +
                        `🏆 Celkem: **${formatTime(user.totalSeconds)}**`,
                        COLORS.danger
                    )
                ]
            });
        }

        if (
            command ===
            "!shift"
        ) {

            if (
                !user.activeSince
            ) {
                return message.reply(
                    "🔴 Nemáš aktivní směnu."
                );
            }

            const seconds =
                Math.floor(
                    (
                        Date.now() -
                        user.activeSince
                    ) / 1000
                );

            return message.reply(
                `🟢 **Aktivní směna:** ${formatTime(seconds)}`
            );
        }

        if (
            command ===
            "!myhours"
        ) {

            let seconds =
                user.totalSeconds;

            if (
                user.activeSince
            ) {
                seconds +=
                    Math.floor(
                        (
                            Date.now() -
                            user.activeSince
                        ) / 1000
                    );
            }

            return message.reply({
                embeds: [
                    createEmbed(
                        "🏆 TVŮJ STAFF ČAS",
                        `⏱️ Celkem: **${formatTime(seconds)}**`,
                        COLORS.gold
                    )
                ]
            });
        }

        if (
            command ===
            "!leaderboard"
        ) {

            return message.reply({
                embeds: [
                    createEmbed(
                        "🏆 STAFF LEADERBOARD",
                        createLeaderboard(),
                        COLORS.gold
                    )
                ]
            });
        }
    }
);

// =====================================================
// LEADERBOARD
// =====================================================

function createLeaderboard() {

    const users =
        Object.entries(
            data.users
        )
            .map(
                ([id, user]) => {

                    let seconds =
                        user.totalSeconds ||
                        0;

                    if (
                        user.activeSince
                    ) {
                        seconds +=
                            Math.floor(
                                (
                                    Date.now() -
                                    user.activeSince
                                ) / 1000
                            );
                    }

                    return {
                        id,
                        username:
                            user.username ||
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

    if (
        users.length === 0
    ) {
        return "Zatím nejsou zaznamenány žádné směny.";
    }

    const medals =
        ["🥇", "🥈", "🥉"];

    let result = "";

    users
        .slice(0, 10)
        .forEach(
            (user, index) => {

                result +=
                    `${medals[index] || `${index + 1}.`} ` +
                    `**${user.username}** — ` +
                    `${formatTime(user.seconds)}\n`;
            }
        );

    return result;
}

async function updateLeaderboard(
    channel
) {

    try {

        const messages =
            await channel.messages.fetch({
                limit: 20
            });

        const botMessage =
            messages.find(
                message =>
                    message.author.id ===
                    client.user.id
            );

        const embed =
            createEmbed(
                "🏆 STAFF OORP LEADERBOARD",
                createLeaderboard(),
                COLORS.gold
            );

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
            "❌ Leaderboard:",
            error.message
        );
    }
}

// =====================================================
// STAFF MENTIONS
// =====================================================

function getStaffMentions(guild) {

    return STAFF_ROLES
        .map(
            name =>
                guild.roles.cache.find(
                    role =>
                        role.name === name
                )
        )
        .filter(Boolean)
        .map(
            role =>
                `<@&${role.id}>`
        )
        .join(" ");
}

// =====================================================
// AUTOMATIC LEADERBOARD
// =====================================================

setInterval(
    async () => {

        for (
            const guild
            of client.guilds.cache.values()
        ) {

            const channel =
                guild.channels.cache.find(
                    c =>
                        c.name ===
                        "🏆・staff-leaderboard"
                );

            if (channel) {
                await updateLeaderboard(
                    channel
                );
            }
        }

    },
    60000
);

// =====================================================
// MEMBER JOIN = ANTI RAID
// =====================================================

client.on(
    "guildMemberAdd",
    async member => {

        try {

            await checkRaid(
                member
            );

            const log =
                member.guild.channels.cache.find(
                    c =>
                        c.name ===
                        "🛡️・security-log"
                );

            if (
                log &&
                log.isTextBased()
            ) {

                await log.send({
                    embeds: [
                        createEmbed(
                            "📥 NOVÝ ČLEN",
                            `👤 ${member.user.tag}\n` +
                            `🆔 ${member.id}\n` +
                            `📅 Účet vytvořen: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
                            COLORS.imperial
                        )
                    ]
                }).catch(() => {});
            }

        } catch (error) {

            console.error(
                "❌ Member join:",
                error
            );
        }
    }
);

// =====================================================
// MEMBER LEAVE
// =====================================================

client.on(
    "guildMemberRemove",
    async member => {

        try {

            const log =
                member.guild.channels.cache.find(
                    c =>
                        c.name ===
                        "🛡️・security-log"
                );

            if (
                log &&
                log.isTextBased()
            ) {

                await log.send({
                    embeds: [
                        createEmbed(
                            "📤 ČLEN ODEŠEL",
                            `👤 ${member.user.tag}\n` +
                            `🆔 ${member.id}`,
                            COLORS.warning
                        )
                    ]
                }).catch(() => {});
            }

        } catch {}
    }
);

// =====================================================
// ERROR HANDLING
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
            "❌ Unhandled Promise:",
            error
        );
    }
);

// =====================================================
// LOGIN
// =====================================================

client.login(TOKEN);

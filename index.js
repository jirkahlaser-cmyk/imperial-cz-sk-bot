const {
    Client,
    GatewayIntentBits,
    ChannelType,
    PermissionFlagsBits,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
    REST,
    Routes
} = require("discord.js");

// ============================================================
// IMPERIAL CZ/SK BOT
// ============================================================

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    console.error("❌ DISCORD_TOKEN není nastavený v Railway.");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

// ============================================================
// BARVY
// ============================================================

const COLORS = {
    red: 0xE74C3C,
    darkRed: 0x8E0000,
    blue: 0x3498DB,
    green: 0x2ECC71,
    yellow: 0xF1C40F,
    purple: 0x9B59B6,
    cyan: 0x00D9FF,
    orange: 0xE67E22,
    pink: 0xE91E63,
    dark: 0x111827
};

// ============================================================
// ROLE
// ============================================================

const ROLE_CONFIG = [
    ["👑 Majitel", 0xFF0000],
    ["💎 Spolumajitel", 0xFF00FF],
    ["🏆 Zakladatel", 0xFFD700],
    ["🧠 Ředitel projektu", 0x9B59B6],
    ["📋 Vedoucí projektu", 0x3498DB],

    ["🛡️ Hlavní administrátor", 0xC0392B],
    ["🔴 Senior administrátor", 0xE74C3C],
    ["🟠 Administrátor", 0xE67E22],
    ["🟡 Junior administrátor", 0xF1C40F],
    ["⚪ Zkušební administrátor", 0x95A5A6],

    ["👤 Člen", 0x5865F2],
    ["👤 Civilista", 0x95A5A6],
    ["👮 Policie", 0x3498DB],
    ["🚒 Hasiči", 0xE74C3C],
    ["🚑 Záchranáři", 0x2ECC71],

    ["🎉 Eventy", 0xF1C40F],
    ["📢 Oznámení", 0x3498DB],
    ["🎭 RP oznámení", 0x9B59B6],

    ["⭐ Event tým", 0x9B59B6],
    ["📸 Media tým", 0xE91E63],
    ["💎 Podporovatel", 0x00FFFF],
    ["🏆 VIP", 0xFFD700]
];

const STAFF_ROLES = [
    "🛡️ Hlavní administrátor",
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

// ============================================================
// POMOCNÉ FUNKCE
// ============================================================

function findRole(guild, name) {
    return guild.roles.cache.find(role => role.name === name);
}

function isOwner(interaction) {
    return interaction.guild && interaction.user.id === interaction.guild.ownerId;
}

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

async function createRoles(guild) {
    const roles = {};

    for (const [name, color] of ROLE_CONFIG) {
        let role = findRole(guild, name);

        if (!role) {
            role = await guild.roles.create({
                name,
                color,
                reason: "Imperial CZ/SK server setup"
            });

            console.log(`✅ Vytvořena role: ${name}`);
        }

        roles[name] = role;
    }

    return roles;
}

async function createCategory(guild, name, overwrites = []) {
    return guild.channels.create({
        name,
        type: ChannelType.GuildCategory,
        permissionOverwrites: overwrites
    });
}

async function createText(guild, name, parent, overwrites = []) {
    return guild.channels.create({
        name,
        type: ChannelType.GuildText,
        parent: parent.id,
        permissionOverwrites: overwrites
    });
}

async function createVoice(guild, name, parent, overwrites = []) {
    return guild.channels.create({
        name,
        type: ChannelType.GuildVoice,
        parent: parent.id,
        permissionOverwrites: overwrites
    });
}

async function sendEmbed(channel, title, description, color = COLORS.red) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setFooter({
            text: "Imperial CZ/SK • RP Community"
        })
        .setTimestamp();

    return channel.send({
        embeds: [embed]
    });
}

// ============================================================
// OPRÁVNĚNÍ
// ============================================================

function staffOverwrites(guild) {
    const overwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [
                PermissionFlagsBits.ViewChannel
            ]
        }
    ];

    for (const roleName of STAFF_ROLES) {
        const role = findRole(guild, roleName);

        if (role) {
            overwrites.push({
                id: role.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.EmbedLinks,
                    PermissionFlagsBits.Connect,
                    PermissionFlagsBits.Speak
                ]
            });
        }
    }

    return overwrites;
}

function managementOverwrites(guild) {
    const overwrites = [
        {
            id: guild.roles.everyone.id,
            deny: [
                PermissionFlagsBits.ViewChannel
            ]
        }
    ];

    for (const roleName of MANAGEMENT_ROLES) {
        const role = findRole(guild, roleName);

        if (role) {
            overwrites.push({
                id: role.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.EmbedLinks,
                    PermissionFlagsBits.Connect,
                    PermissionFlagsBits.Speak
                ]
            });
        }
    }

    return overwrites;
}

// ============================================================
// SMAZÁNÍ KANÁLŮ
// ============================================================

async function deleteAllChannels(guild) {
    console.log("🗑️ Začínám mazat staré kanály...");

    const channels = [...guild.channels.cache.values()];

    for (const channel of channels) {
        try {
            await channel.delete(
                "Imperial CZ/SK - kompletní server setup"
            );
        } catch (error) {
            console.error(
                `⚠️ Nepodařilo se smazat ${channel.name}: ${error.message}`
            );
        }
    }

    console.log("✅ Staré kanály byly odstraněny.");
}

// ============================================================
// SETUP
// ============================================================

async function setupServer(guild) {
    console.log("🚀 Spouštím Imperial CZ/SK setup...");

    // --------------------------------------------------------
    // ROLE
    // --------------------------------------------------------

    await createRoles(guild);

    const staffPerms = staffOverwrites(guild);
    const managementPerms = managementOverwrites(guild);

    // --------------------------------------------------------
    // SMAZÁNÍ STARÝCH KANÁLŮ
    // --------------------------------------------------------

    await deleteAllChannels(guild);

    // --------------------------------------------------------
    // 📌 INFORMACE
    // --------------------------------------------------------

    const information = await createCategory(
        guild,
        "📌 INFORMACE"
    );

    const welcome = await createText(
        guild,
        "👋・vítejte",
        information
    );

    const rules = await createText(
        guild,
        "📜・pravidla",
        information
    );

    const serverInfo = await createText(
        guild,
        "📖・informace-o-serveru",
        information
    );

    const announcements = await createText(
        guild,
        "📢・oznámení",
        information
    );

    const faq = await createText(
        guild,
        "❓・faq",
        information
    );

    // --------------------------------------------------------
    // 🎛️ NASTAVENÍ
    // --------------------------------------------------------

    const setupCategory = await createCategory(
        guild,
        "🎛️ NASTAVENÍ"
    );

    const chooseRoles = await createText(
        guild,
        "🎭・vyber-si-roli",
        setupCategory
    );

    const chooseNotifications = await createText(
        guild,
        "🔔・nastavení-oznámení",
        setupCategory
    );

    // --------------------------------------------------------
    // 💬 KOMUNITA
    // --------------------------------------------------------

    const community = await createCategory(
        guild,
        "💬 KOMUNITA"
    );

    const chat = await createText(
        guild,
        "💬・chat",
        community
    );

    const media = await createText(
        guild,
        "📸・media",
        community
    );

    const roblox = await createText(
        guild,
        "🎮・roblox",
        community
    );

    const suggestions = await createText(
        guild,
        "💡・návrhy",
        community
    );

    const bugs = await createText(
        guild,
        "🐛・hlášení-chyb",
        community
    );

    // --------------------------------------------------------
    // 🎮 ROLEPLAY
    // --------------------------------------------------------

    const rp = await createCategory(
        guild,
        "🎮 ROLEPLAY"
    );

    const rpRules = await createText(
        guild,
        "📜・rp-pravidla",
        rp
    );

    const rpAnnouncements = await createText(
        guild,
        "🚨・rp-oznámení",
        rp
    );

    const dispatch = await createText(
        guild,
        "📻・dispatch",
        rp
    );

    const factions = await createText(
        guild,
        "🏢・frakce",
        rp
    );

    const ranks = await createText(
        guild,
        "⭐・hodnosti",
        rp
    );

    // --------------------------------------------------------
    // 📝 NÁBOR
    // --------------------------------------------------------

    const recruitment = await createCategory(
        guild,
        "📝 NÁBOR"
    );

    const recruitmentInfo = await createText(
        guild,
        "📋・nábor",
        recruitment
    );

    const applications = await createText(
        guild,
        "📨・přihlášky",
        recruitment
    );

    const training = await createText(
        guild,
        "🎓・školení",
        recruitment
    );

    const results = await createText(
        guild,
        "📊・výsledky-náboru",
        recruitment
    );

    // --------------------------------------------------------
    // 🎫 PODPORA
    // --------------------------------------------------------

    const support = await createCategory(
        guild,
        "🎫 PODPORA"
    );

    const tickets = await createText(
        guild,
        "🎫・ticket",
        support
    );

    const help = await createText(
        guild,
        "🆘・podpora",
        support
    );

    const contact = await createText(
        guild,
        "📩・kontakt-staff",
        support
    );

    // --------------------------------------------------------
    // 🛡️ STAFF
    // --------------------------------------------------------

    const staff = await createCategory(
        guild,
        "🛡️ STAFF",
        staffPerms
    );

    const staffChat = await createText(
        guild,
        "🔒・staff-chat",
        staff,
        staffPerms
    );

    const staffInfo = await createText(
        guild,
        "📋・staff-info",
        staff,
        staffPerms
    );

    const staffLogs = await createText(
        guild,
        "📝・staff-log",
        staff,
        staffPerms
    );

    const staffHours = await createText(
        guild,
        "⏱️・staff-směny",
        staff,
        staffPerms
    );

    const punishments = await createText(
        guild,
        "⚠️・tresty",
        staff,
        staffPerms
    );

    const staffStats = await createText(
        guild,
        "📊・staff-statistiky",
        staff,
        staffPerms
    );

    // --------------------------------------------------------
    // 🤖 BOT
    // --------------------------------------------------------

    const botCategory = await createCategory(
        guild,
        "🤖 BOT"
    );

    const botCommands = await createText(
        guild,
        "🤖・bot-příkazy",
        botCategory
    );

    const botLogs = await createText(
        guild,
        "📜・bot-log",
        botCategory,
        staffPerms
    );

    const raidLogs = await createText(
        guild,
        "🚨・raid-log",
        botCategory,
        staffPerms
    );

    // --------------------------------------------------------
    // 👑 VEDENÍ
    // --------------------------------------------------------

    const management = await createCategory(
        guild,
        "👑 VEDENÍ",
        managementPerms
    );

    const managementText = await createText(
        guild,
        "👑・vedení",
        management,
        managementPerms
    );

    // --------------------------------------------------------
    // 🔊 ADMIN CALL
    // --------------------------------------------------------

    const adminCalls = await createCategory(
        guild,
        "🔊 ADMIN CALL"
    );

    await createVoice(
        guild,
        "🔊・AT1",
        adminCalls,
        staffPerms
    );

    await createVoice(
        guild,
        "🔊・AT2",
        adminCalls,
        staffPerms
    );

    await createVoice(
        guild,
        "🔊・AT3",
        adminCalls,
        staffPerms
    );

    await createVoice(
        guild,
        "🔊・AT5",
        adminCalls,
        staffPerms
    );

    await createVoice(
        guild,
        "🔊・AT6",
        adminCalls,
        staffPerms
    );

    // --------------------------------------------------------
    // 👑 VEDENÍ CALL
    // --------------------------------------------------------

    const managementVoice = await createCategory(
        guild,
        "👑 VEDENÍ CALL",
        managementPerms
    );

    await createVoice(
        guild,
        "👑・vedení-call",
        managementVoice,
        managementPerms
    );

    // ========================================================
    // EMBEDY
    // ========================================================

    await sendEmbed(
        welcome,
        "👋 VÍTEJ V IMPERIAL CZ/SK",
        "Vítej na oficiálním serveru Imperial CZ/SK.\n\n" +
        "Imperial vznikl s cílem vytvořit kvalitní CZ/SK RP komunitu, " +
        "ve které má smysl hrát, tvořit a společně budovat projekt.\n\n" +
        "Než se zapojíš do komunity, projdi si pravidla a následně " +
        "si nastav své role a oznámení v kategorii 🎛️ NASTAVENÍ.\n\n" +
        "Užij si Imperial. ❤️",
        COLORS.red
    );

    await sendEmbed(
        rules,
        "📜 PRAVIDLA SERVERU",
        "**1. Respekt**\n" +
        "Chovej se slušně k ostatním členům.\n\n" +

        "**2. Zákaz šikany**\n" +
        "Urážky, obtěžování a cílené napadání členů nejsou tolerovány.\n\n" +

        "**3. Spam**\n" +
        "Nespamuj zprávy, emoji, mentiony ani příkazy.\n\n" +

        "**4. Reklama**\n" +
        "Reklama bez povolení vedení je zakázána.\n\n" +

        "**5. Staff**\n" +
        "Respektuj práci administrace a vedení.\n\n" +

        "**6. Tresty**\n" +
        "Porušení pravidel může vést k warnu, timeoutu, kicku nebo banu.\n\n" +

        "**7. Úmyslné narušování**\n" +
        "Záměrné ničení komunity, raidování nebo zneužívání botů je zakázáno.\n\n" +

        "**8. Kanály**\n" +
        "Používej jednotlivé kanály podle jejich účelu.\n\n" +

        "**9. Účty**\n" +
        "Nevydávej se za jiné členy ani za staff.\n\n" +

        "**10. Rozhodnutí vedení**\n" +
        "Vedení si vyhrazuje právo řešit situace individuálně.",
        COLORS.yellow
    );

    await sendEmbed(
        serverInfo,
        "📖 INFORMACE O SERVERU",
        "**Imperial CZ/SK** je komunitní projekt zaměřený na kvalitní CZ/SK Roleplay.\n\n" +
        "Na hlavním serveru najdeš komunitu, RP informace, nábor, " +
        "eventy, podporu a systém propojení s jednotlivými IZS složkami.\n\n" +
        "👮 Policie\n" +
        "🚒 Hasiči\n" +
        "🚑 Záchranáři\n" +
        "👤 Civilista\n\n" +
        "Frakční servery pro jednotlivé IZS budou vytvořeny později.",
        COLORS.cyan
    );

    await sendEmbed(
        announcements,
        "📢 OZNÁMENÍ",
        "Tento kanál slouží pro důležité informace, změny a novinky projektu.",
        COLORS.blue
    );

    await sendEmbed(
        faq,
        "❓ FAQ",
        "**Jak začnu?**\n" +
        "Nastav si role v kategorii 🎛️ NASTAVENÍ.\n\n" +

        "**Jak se dostanu do IZS?**\n" +
        "Vyber Policii, Hasiče nebo Záchranáře. Další část náboru bude probíhat na příslušném frakčním serveru.\n\n" +

        "**Musím si vybrat frakci?**\n" +
        "Ne. Můžeš zůstat Civilistou.\n\n" +

        "**Jak získám staff?**\n" +
        "Sleduj informace v sekci 📝 NÁBOR.",
        COLORS.purple
    );

    // ========================================================
    // VÝBĚR ROLÍ
    // ========================================================

    const roleEmbed = new EmbedBuilder()
        .setColor(COLORS.blue)
        .setTitle("🎭 VÝBĚR RP ROLE")
        .setDescription(
            "Vyber si, jakou roli chceš na Imperial CZ/SK.\n\n" +
            "👤 **Civilista** – zůstaneš na hlavním serveru.\n\n" +
            "👮 **Policie** – dostaneš roli Člen + Policie. " +
            "Později obdržíš pozvánku na Police Department server.\n\n" +
            "🚒 **Hasiči** – dostaneš roli Člen + Hasiči.\n\n" +
            "🚑 **Záchranáři** – dostaneš roli Člen + Záchranáři.\n\n" +
            "⚠️ Frakční servery zatím nejsou vytvořené. Pozvánky doplníme později."
        )
        .setFooter({
            text: "Imperial CZ/SK • Role System"
        });

    const roleRow1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("role_civilista")
            .setLabel("Civilista")
            .setEmoji("👤")
            .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
            .setCustomId("role_policie")
            .setLabel("Policie")
            .setEmoji("👮")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("role_hasici")
            .setLabel("Hasiči")
            .setEmoji("🚒")
            .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
            .setCustomId("role_zachranari")
            .setLabel("Záchranáři")
            .setEmoji("🚑")
            .setStyle(ButtonStyle.Success)
    );

    await chooseRoles.send({
        embeds: [roleEmbed],
        components: [roleRow1]
    });

    // ========================================================
    // OZNÁMENÍ
    // ========================================================

    const notificationEmbed = new EmbedBuilder()
        .setColor(COLORS.yellow)
        .setTitle("🔔 NASTAVENÍ OZNÁMENÍ")
        .setDescription(
            "Vyber si, jaké typy oznámení chceš dostávat.\n\n" +
            "Můžeš si vybrat všechny nebo pouze ty, které tě zajímají.\n\n" +
            "🎉 **Eventy**\n" +
            "📢 **Oznámení**\n" +
            "🎭 **RP oznámení**"
        )
        .setFooter({
            text: "Kliknutím na tlačítko roli získáš nebo odebereš."
        });

    const notificationRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("notify_eventy")
            .setLabel("Eventy")
            .setEmoji("🎉")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("notify_oznameni")
            .setLabel("Oznámení")
            .setEmoji("📢")
            .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
            .setCustomId("notify_rp")
            .setLabel("RP oznámení")
            .setEmoji("🎭")
            .setStyle(ButtonStyle.Primary)
    );

    await chooseNotifications.send({
        embeds: [notificationEmbed],
        components: [notificationRow]
    });

    // ========================================================
    // RP
    // ========================================================

    await sendEmbed(
        rpRules,
        "📜 RP PRAVIDLA",
        "**RDM** – bezdůvodné napadení nebo zabití.\n\n" +
        "**VDM** – úmyslné použití vozidla jako zbraně.\n\n" +
        "**FailRP** – jednání, které nedává v RP smysl.\n\n" +
        "**Metagaming** – používání informací získaných mimo RP.\n\n" +
        "**Powergaming** – vnucování výsledku RP druhému hráči.\n\n" +
        "**NLR** – po smrti se nesmíš okamžitě vracet do stejné situace.\n\n" +
        "Cílem RP není pouze vyhrát. Cílem je vytvořit kvalitní příběh společně.",
        COLORS.purple
    );

    await sendEmbed(
        rpAnnouncements,
        "🚨 RP OZNÁMENÍ",
        "Zde budou zveřejňovány důležité informace týkající se Roleplay.",
        COLORS.red
    );

    await sendEmbed(
        dispatch,
        "📻 DISPATCH",
        "Prostor pro RP komunikaci a informace související s probíhajícími situacemi.",
        COLORS.blue
    );

    await sendEmbed(
        factions,
        "🏢 FRAKCE",
        "Imperial CZ/SK bude postupně rozšiřovat systém frakcí.\n\n" +
        "👮 Police Department\n" +
        "🚒 Fire Department\n" +
        "🚑 Emergency Medical Services\n\n" +
        "Jednotlivé frakce budou mít vlastní servery a vlastní nábor.",
        COLORS.green
    );

    await sendEmbed(
        ranks,
        "⭐ HODNOSTI",
        "Hodnosti jednotlivých IZS složek budou řešeny na jejich vlastních frakčních serverech.",
        COLORS.yellow
    );

    // ========================================================
    // NÁBOR
    // ========================================================

    await sendEmbed(
        recruitmentInfo,
        "📋 NÁBOR",
        "Informace o aktuálně otevřených náborech do týmu Imperial CZ/SK.",
        COLORS.blue
    );

    await sendEmbed(
        applications,
        "📨 PŘIHLÁŠKY",
        "Zde budou dostupné přihlášky do staff týmu a dalších částí projektu.",
        COLORS.purple
    );

    await sendEmbed(
        training,
        "🎓 ŠKOLENÍ",
        "Informace o školeních, která budou probíhat v rámci Imperial CZ/SK.",
        COLORS.green
    );

    await sendEmbed(
        results,
        "📊 VÝSLEDKY NÁBORU",
        "Zde budou zveřejňovány výsledky vybraných náborů.",
        COLORS.yellow
    );

    // ========================================================
    // PODPORA
    // ========================================================

    await sendEmbed(
        tickets,
        "🎫 TICKET",
        "Systém ticketů bude sloužit pro individuální řešení problémů, žádostí a podpory.",
        COLORS.blue
    );

    await sendEmbed(
        help,
        "🆘 PODPORA",
        "Potřebuješ pomoc? Popiš svůj problém a staff se ti pokusí co nejdříve pomoci.",
        COLORS.green
    );

    await sendEmbed(
        contact,
        "📩 KONTAKT STAFF",
        "Pro důležité záležitosti můžeš kontaktovat administraci.",
        COLORS.red
    );

    // ========================================================
    // STAFF
    // ========================================================

    await sendEmbed(
        staffInfo,
        "🛡️ STAFF INFO",
        "Interní informace pro členy administrátorského týmu.",
        COLORS.red
    );

    await sendEmbed(
        staffChat,
        "🔒 STAFF CHAT",
        "Interní komunikace administrátorského týmu.",
        COLORS.red
    );

    await sendEmbed(
        staffLogs,
        "📝 STAFF LOG",
        "Interní záznamy důležitých akcí staff týmu.",
        COLORS.dark
    );

    await sendEmbed(
        staffHours,
        "⏱️ STAFF SMĚNY",
        "Zde bude připraven systém evidence staff směn.",
        COLORS.blue
    );

    await sendEmbed(
        punishments,
        "⚠️ TRESTY",
        "Evidence řešení porušení pravidel.",
        COLORS.red
    );

    await sendEmbed(
        staffStats,
        "📊 STAFF STATISTIKY",
        "Statistiky aktivity staff týmu.",
        COLORS.purple
    );

    // ========================================================
    // BOT
    // ========================================================

    await sendEmbed(
        botCommands,
        "🤖 BOT PŘÍKAZY",
        "Zde budou používány veřejné příkazy Imperial CZ/SK bota.",
        COLORS.cyan
    );

    await sendEmbed(
        botLogs,
        "📜 BOT LOG",
        "Interní logy bot systému.",
        COLORS.dark
    );

    await sendEmbed(
        raidLogs,
        "🚨 RAID LOG",
        "Bezpečnostní logy a informace o podezřelé aktivitě.",
        COLORS.red
    );

    // ========================================================
    // VEDENÍ
    // ========================================================

    await sendEmbed(
        managementText,
        "👑 VEDENÍ",
        "Soukromý prostor vedení Imperial CZ/SK.",
        COLORS.yellow
    );

    console.log("==========================================");
    console.log("✅ IMPERIAL CZ/SK SERVER VYTVOŘEN");
    console.log("==========================================");
}

// ============================================================
// SLASH COMMANDS
// ============================================================

const commands = [
    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Zkontroluje odezvu bota."),

    new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("Zobrazí informace o serveru."),

    new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Vytvoří Imperial CZ/SK server od nuly.")
        .addStringOption(option =>
            option
                .setName("potvrzeni")
                .setDescription("Napiš POTVRZUJI.")
                .setRequired(true)
        )
];

// ============================================================
// READY
// ============================================================

client.once("clientReady", async () => {
    console.log(`✅ Bot je online jako ${client.user.tag}`);

    try {
        const rest = new REST({
            version: "10"
        }).setToken(TOKEN);

        await rest.put(
            Routes.applicationCommands(client.user.id),
            {
                body: commands.map(command => command.toJSON())
            }
        );

        console.log("✅ Slash příkazy zaregistrovány.");
    } catch (error) {
        console.error(
            "❌ Chyba při registraci příkazů:",
            error
        );
    }
});

// ============================================================
// INTERAKCE
// ============================================================

client.on("interactionCreate", async interaction => {

    // ========================================================
    // BUTTONS
    // ========================================================

    if (interaction.isButton()) {

        const member = interaction.member;
        const guild = interaction.guild;

        if (!guild || !member) return;

        // ----------------------------------------------------
        // NOTIFICATION ROLES
        // ----------------------------------------------------

        const notificationRoles = {
            notify_eventy: "🎉 Eventy",
            notify_oznameni: "📢 Oznámení",
            notify_rp: "🎭 RP oznámení"
        };

        if (notificationRoles[interaction.customId]) {
            const roleName =
                notificationRoles[interaction.customId];

            const role = findRole(guild, roleName);

            if (!role) {
                return interaction.reply({
                    content: "❌ Role nebyla nalezena.",
                    ephemeral: true
                });
            }

            if (member.roles.cache.has(role.id)) {
                await member.roles.remove(role);

                return interaction.reply({
                    content:
                        `🔕 Role **${role.name}** byla odebrána.`,
                    ephemeral: true
                });
            }

            await member.roles.add(role);

            return interaction.reply({
                content:
                    `🔔 Role **${role.name}** byla přidána.`,
                ephemeral: true
            });
        }

        // ----------------------------------------------------
        // RP ROLE
        // ----------------------------------------------------

        const factionRoles = {
            role_civilista: "👤 Civilista",
            role_policie: "👮 Policie",
            role_hasici: "🚒 Hasiči",
            role_zachranari: "🚑 Záchranáři"
        };

        if (factionRoles[interaction.customId]) {

            const selectedRoleName =
                factionRoles[interaction.customId];

            const selectedRole =
                findRole(guild, selectedRoleName);

            const memberRole =
                findRole(guild, "👤 Člen");

            if (!selectedRole || !memberRole) {
                return interaction.reply({
                    content:
                        "❌ Potřebné role nebyly nalezeny.",
                    ephemeral: true
                });
            }

            const oldFactionNames = [
                "👤 Civilista",
                "👮 Policie",
                "🚒 Hasiči",
                "🚑 Záchranáři"
            ];

            for (const oldName of oldFactionNames) {
                const oldRole = findRole(guild, oldName);

                if (
                    oldRole &&
                    member.roles.cache.has(oldRole.id)
                ) {
                    await member.roles.remove(oldRole);
                }
            }

            // Každý dostane Člen
            if (!member.roles.cache.has(memberRole.id)) {
                await member.roles.add(memberRole);
            }

            await member.roles.add(selectedRole);

            if (selectedRoleName === "👤 Civilista") {
                return interaction.reply({
                    content:
                        "✅ Máš nastaveno **👤 Civilista**.\n" +
                        "Zůstáváš na hlavním Imperial CZ/SK serveru.",
                    ephemeral: true
                });
            }

            const factionNames = {
                "👮 Policie": "Police Department",
                "🚒 Hasiči": "Fire Department",
                "🚑 Záchranáři": "Emergency Medical Services"
            };

            return interaction.reply({
                content:
                    `✅ Byla ti nastavena role **${selectedRoleName}**.\n\n` +
                    `👤 Automaticky máš také roli **Člen**.\n\n` +
                    `🏢 Další krok bude nábor na serveru **${factionNames[selectedRoleName]}**.\n\n` +
                    "🔗 Pozvánku doplníme, až společně vytvoříme frakční servery.",
                ephemeral: true
            });
        }

        return;
    }

    // ========================================================
    // SLASH COMMANDS
    // ========================================================

    if (!interaction.isChatInputCommand()) return;

    // --------------------------------------------------------
    // PING
    // --------------------------------------------------------

    if (interaction.commandName === "ping") {

        const ping = client.ws.ping;

        const embed = new EmbedBuilder()
            .setColor(COLORS.green)
            .setTitle("🏓 PONG!")
            .setDescription(
                `Bot funguje správně.\n\n` +
                `📡 Ping: **${ping} ms**`
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // --------------------------------------------------------
    // SERVER INFO
    // --------------------------------------------------------

    if (interaction.commandName === "serverinfo") {

        const guild = interaction.guild;

        const embed = new EmbedBuilder()
            .setColor(COLORS.blue)
            .setTitle(`ℹ️ ${guild.name}`)
            .addFields(
                {
                    name: "👥 Členové",
                    value: `${guild.memberCount}`,
                    inline: true
                },
                {
                    name: "📁 Kanály",
                    value: `${guild.channels.cache.size}`,
                    inline: true
                },
                {
                    name: "🎭 Role",
                    value: `${guild.roles.cache.size}`,
                    inline: true
                }
            )
            .setTimestamp();

        return interaction.reply({
            embeds: [embed]
        });
    }

    // --------------------------------------------------------
    // SETUP
    // --------------------------------------------------------

    if (interaction.commandName === "setup") {

        if (!isOwner(interaction)) {
            return interaction.reply({
                content:
                    "❌ Tento příkaz může použít pouze **majitel serveru**.",
                ephemeral: true
            });
        }

        const confirmation =
            interaction.options.getString("potvrzeni");

        if (confirmation !== "POTVRZUJI") {
            return interaction.reply({
                content:
                    "❌ Setup nebyl potvrzen.\n\n" +
                    "Použij:\n" +
                    "`/setup potvrzeni:POTVRZUJI`",
                ephemeral: true
            });
        }

        await interaction.reply({
            content:
                "⏳ **Spouštím Imperial CZ/SK setup...**\n\n" +
                "⚠️ Staré kanály budou odstraněny a vytvoří se nová struktura.",
            ephemeral: true
        });

        try {

            await setupServer(interaction.guild);

            await interaction.editReply({
                content:
                    "✅ **IMPERIAL CZ/SK JE PŘIPRAVEN!**\n\n" +
                    "🏛️ Informace\n" +
                    "🎛️ Nastavení rolí\n" +
                    "💬 Komunita\n" +
                    "🎮 Roleplay\n" +
                    "📝 Nábor\n" +
                    "🎫 Podpora\n" +
                    "🛡️ Staff\n" +
                    "🤖 Bot\n" +
                    "👑 Vedení\n" +
                    "🔊 Admin Calls\n\n" +
                    "Další funkce můžeme nyní přidávat postupně."
            });

        } catch (error) {

            console.error("❌ SETUP ERROR:", error);

            await interaction.editReply({
                content:
                    "❌ **Setup selhal.**\n\n" +
                    "Zkontroluj, že bot má na serveru oprávnění **Administrator**.\n\n" +
                    `Chyba: ${error.message}`
            });
        }
    }
});

// ============================================================
// CHYBY
// ============================================================

process.on("unhandledRejection", error => {
    console.error(
        "❌ Unhandled Promise Rejection:",
        error
    );
});

process.on("uncaughtException", error => {
    console.error(
        "❌ Uncaught Exception:",
        error
    );
});

// ============================================================
// LOGIN
// ============================================================

client.login(TOKEN);

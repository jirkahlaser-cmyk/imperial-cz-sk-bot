const {
    Client,
    GatewayIntentBits,
    Partials,
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    Events
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
    console.error("❌ Chybí DISCORD_TOKEN v Railway Variables.");
    process.exit(1);
}

/* =========================================================
   NASTAVENÍ
========================================================= */

const CONFIG = {
    categoryNames: {
        INFO: "📌 INFORMACE",
        COMMUNITY: "💬 KOMUNITA",
        NOTIFICATIONS: "📢 OZNÁMENÍ",
        TICKETS: "🎫 TICKETY",
        STAFF: "🛡️ ADMIN TEAM",
        MANAGEMENT: "🏛️ VEDENÍ",
        PENALTIES: "⚖️ TRESTY",
        VOICE: "🔊 VOICE"
    },

    roles: {
        MEMBER: "Člen",
        ADMIN: "Admin",
        MANAGEMENT: "Vedení",
        POLICE: "Policie",
        FIRE: "Hasiči",
        EMS: "Záchranka",
        CIVIL: "Civilista"
    }
};

/* =========================================================
   POMOCNÉ FUNKCE
========================================================= */

async function getOrCreateRole(guild, name, options = {}) {
    let role = guild.roles.cache.find(r => r.name === name);

    if (!role) {
        role = await guild.roles.create({
            name,
            ...options,
            reason: "Imperial CZ/SK Bot - vytvoření systému"
        });

        console.log(`✅ Role vytvořena: ${name}`);
    }

    return role;
}

async function getOrCreateCategory(guild, name) {
    let category = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name === name
    );

    if (!category) {
        category = await guild.channels.create({
            name,
            type: ChannelType.GuildCategory,
            reason: "Imperial CZ/SK Bot - vytvoření serveru"
        });

        console.log(`✅ Kategorie vytvořena: ${name}`);
    }

    return category;
}

async function getOrCreateChannel(guild, name, type, parent, permissionOverwrites = []) {
    let channel = guild.channels.cache.find(
        c => c.name === name && c.type === type
    );

    if (!channel) {
        channel = await guild.channels.create({
            name,
            type,
            parent,
            permissionOverwrites,
            reason: "Imperial CZ/SK Bot - vytvoření kanálu"
        });

        console.log(`✅ Kanál vytvořen: ${name}`);
    } else {
        try {
            await channel.setParent(parent.id, {
                lockPermissions: false,
                reason: "Imperial CZ/SK Bot - oprava struktury"
            });

            if (permissionOverwrites.length) {
                await channel.permissionOverwrites.set(permissionOverwrites);
            }
        } catch (error) {
            console.log(`⚠️ Nepodařilo se upravit ${name}:`, error.message);
        }
    }

    return channel;
}

function everyoneDeny(guild) {
    return {
        id: guild.roles.everyone.id,
        deny: [
            PermissionFlagsBits.ViewChannel
        ]
    };
}

function everyoneReadOnly(guild) {
    return {
        id: guild.roles.everyone.id,
        allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory
        ],
        deny: [
            PermissionFlagsBits.SendMessages
        ]
    };
}

function roleAllow(role) {
    return {
        id: role.id,
        allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak
        ]
    };
}

/* =========================================================
   ROLE
========================================================= */

async function setupRoles(guild) {
    const roles = {};

    roles.member = await getOrCreateRole(guild, CONFIG.roles.MEMBER, {
        color: 0x3498db,
        mentionable: true
    });

    roles.admin = await getOrCreateRole(guild, CONFIG.roles.ADMIN, {
        color: 0xe74c3c,
        mentionable: true
    });

    roles.management = await getOrCreateRole(guild, CONFIG.roles.MANAGEMENT, {
        color: 0x9b59b6,
        mentionable: true
    });

    roles.police = await getOrCreateRole(guild, CONFIG.roles.POLICE, {
        color: 0x2980b9,
        mentionable: true
    });

    roles.fire = await getOrCreateRole(guild, CONFIG.roles.FIRE, {
        color: 0xe67e22,
        mentionable: true
    });

    roles.ems = await getOrCreateRole(guild, CONFIG.roles.EMS, {
        color: 0x2ecc71,
        mentionable: true
    });

    roles.civil = await getOrCreateRole(guild, CONFIG.roles.CIVIL, {
        color: 0x95a5a6,
        mentionable: true
    });

    return roles;
}

/* =========================================================
   KANÁLY
========================================================= */

async function setupChannels(guild, roles) {
    const categories = {};

    for (const [key, name] of Object.entries(CONFIG.categoryNames)) {
        categories[key] = await getOrCreateCategory(guild, name);
    }

    /* -----------------------------------------------------
       INFORMACE
    ----------------------------------------------------- */

    await getOrCreateChannel(
        guild,
        "📜・pravidla",
        ChannelType.GuildText,
        categories.INFO,
        [everyoneReadOnly(guild)]
    );

    await getOrCreateChannel(
        guild,
        "🗺️・mapa",
        ChannelType.GuildText,
        categories.INFO,
        [everyoneReadOnly(guild)]
    );

    await getOrCreateChannel(
        guild,
        "🏠・domy",
        ChannelType.GuildText,
        categories.INFO,
        [everyoneReadOnly(guild)]
    );

    /* -----------------------------------------------------
       KOMUNITA
    ----------------------------------------------------- */

    await getOrCreateChannel(
        guild,
        "💬・chat",
        ChannelType.GuildText,
        categories.COMMUNITY
    );

    await getOrCreateChannel(
        guild,
        "📸・media",
        ChannelType.GuildText,
        categories.COMMUNITY
    );

    await getOrCreateChannel(
        guild,
        "🤖・bot-příkazy",
        ChannelType.GuildText,
        categories.COMMUNITY
    );

    /* -----------------------------------------------------
       OZNÁMENÍ
    ----------------------------------------------------- */

    await getOrCreateChannel(
        guild,
        "🎉・eventy",
        ChannelType.GuildText,
        categories.NOTIFICATIONS,
        [everyoneReadOnly(guild)]
    );

    await getOrCreateChannel(
        guild,
        "📢・oznámení",
        ChannelType.GuildText,
        categories.NOTIFICATIONS,
        [everyoneReadOnly(guild)]
    );

    await getOrCreateChannel(
        guild,
        "🚨・rm-oznámení",
        ChannelType.GuildText,
        categories.NOTIFICATIONS,
        [everyoneReadOnly(guild)]
    );

    /* -----------------------------------------------------
       TICKETY
    ----------------------------------------------------- */

    const ticketChannel = await getOrCreateChannel(
        guild,
        "🎫・vytvořit-ticket",
        ChannelType.GuildText,
        categories.TICKETS,
        [everyoneReadOnly(guild)]
    );

    await sendTicketPanel(ticketChannel);

    /* -----------------------------------------------------
       ADMIN TEAM
    ----------------------------------------------------- */

    const staffPermissions = [
        everyoneDeny(guild),
        roleAllow(roles.admin),
        roleAllow(roles.management)
    ];

    const adminChat = await getOrCreateChannel(
        guild,
        "🛡️・admin-chat",
        ChannelType.GuildText,
        categories.STAFF,
        staffPermissions
    );

    await adminChat.send({
        embeds: [
            new EmbedBuilder()
                .setTitle("🛡️ ADMIN TEAM")
                .setDescription(
                    "Soukromý prostor pro Admin Team.\n\n" +
                    "Diskutujte zde o moderaci, hráčích, RP situacích a dalších věcech."
                )
                .setColor(0xe74c3c)
        ]
    }).catch(() => {});

    for (let i = 1; i <= 6; i++) {
        await getOrCreateChannel(
            guild,
            `🔊・AT${i}`,
            ChannelType.GuildVoice,
            categories.STAFF,
            staffPermissions
        );
    }

    /* -----------------------------------------------------
       VEDENÍ
    ----------------------------------------------------- */

    const managementPermissions = [
        everyoneDeny(guild),
        {
            id: roles.management.id,
            allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak
            ]
        }
    ];

    await getOrCreateChannel(
        guild,
        "🏛️・vedení-chat",
        ChannelType.GuildText,
        categories.MANAGEMENT,
        managementPermissions
    );

    await getOrCreateChannel(
        guild,
        "🏛️・vedení-call",
        ChannelType.GuildVoice,
        categories.MANAGEMENT,
        managementPermissions
    );

    /* -----------------------------------------------------
       TRESTY
    ----------------------------------------------------- */

    const punishmentPermissions = [
        everyoneDeny(guild),
        roleAllow(roles.admin),
        roleAllow(roles.management)
    ];

    const punishmentPanel = await getOrCreateChannel(
        guild,
        "⚖️・zápis-trestů",
        ChannelType.GuildText,
        categories.PENALTIES,
        punishmentPermissions
    );

    await sendPunishmentPanel(punishmentPanel);

    await getOrCreateChannel(
        guild,
        "⚠️・warny",
        ChannelType.GuildText,
        categories.PENALTIES,
        punishmentPermissions
    );

    await getOrCreateChannel(
        guild,
        "🔨・bany",
        ChannelType.GuildText,
        categories.PENALTIES,
        punishmentPermissions
    );

    console.log("✅ Kanály jsou připravené.");
}

/* =========================================================
   TICKET PANEL
========================================================= */

async function sendTicketPanel(channel) {
    const oldMessages = await channel.messages.fetch({ limit: 20 }).catch(() => null);

    if (
        oldMessages &&
        oldMessages.some(m =>
            m.author.id === client.user.id &&
            m.components.length > 0
        )
    ) {
        return;
    }

    const menu = new StringSelectMenuBuilder()
        .setCustomId("ticket_type")
        .setPlaceholder("🎫 Vyber typ ticketu")
        .addOptions([
            {
                label: "Stížnost na admina",
                value: "admin_complaint",
                emoji: "🛡️"
            },
            {
                label: "Mafie",
                value: "mafia",
                emoji: "🔫"
            },
            {
                label: "Mafie 1",
                value: "mafia1",
                emoji: "1️⃣"
            },
            {
                label: "Mafie 2",
                value: "mafia2",
                emoji: "2️⃣"
            },
            {
                label: "Mafie 3",
                value: "mafia3",
                emoji: "3️⃣"
            },
            {
                label: "Stížnost na hráče",
                value: "player_complaint",
                emoji: "👤"
            },
            {
                label: "Žádost o unban",
                value: "unban",
                emoji: "🔓"
            },
            {
                label: "Jiná žádost",
                value: "other",
                emoji: "📩"
            }
        ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await channel.send({
        embeds: [
            new EmbedBuilder()
                .setTitle("🎫 CENTRUM TICKETŮ")
                .setDescription(
                    "Potřebuješ něco vyřešit s vedením nebo Admin Teamem?\n\n" +
                    "Vyber kategorii níže a vytvoř ticket.\n\n" +
                    "⚠️ Ticket nezneužívej. Falešné nebo spamovací tickety mohou být potrestány."
                )
                .setColor(0x5865f2)
                .setFooter({
                    text: "Imperial CZ/SK • Ticket System"
                })
        ],
        components: [row]
    });
}

/* =========================================================
   PUNISHMENT PANEL
========================================================= */

async function sendPunishmentPanel(channel) {
    const oldMessages = await channel.messages.fetch({ limit: 20 }).catch(() => null);

    if (
        oldMessages &&
        oldMessages.some(m =>
            m.author.id === client.user.id &&
            m.components.length > 0
        )
    ) {
        return;
    }

    const warnButton = new ButtonBuilder()
        .setCustomId("punishment_warn")
        .setLabel("Udělil jsem WARN")
        .setEmoji("⚠️")
        .setStyle(ButtonStyle.Secondary);

    const banButton = new ButtonBuilder()
        .setCustomId("punishment_ban")
        .setLabel("Udělil jsem BAN")
        .setEmoji("🔨")
        .setStyle(ButtonStyle.Danger);

    await channel.send({
        embeds: [
            new EmbedBuilder()
                .setTitle("⚖️ ZÁPIS TRESTŮ")
                .setDescription(
                    "Admin zde zapisuje udělené tresty.\n\n" +
                    "⚠️ **WARN** – upozornění hráče\n" +
                    "🔨 **BAN** – ban hráče\n\n" +
                    "Po dosažení 3 warnů bot upozorní Admin Team."
                )
                .setColor(0xed4245)
        ],
        components: [
            new ActionRowBuilder().addComponents(
                warnButton,
                banButton
            )
        ]
    });
}

/* =========================================================
   TICKET VYTVOŘENÍ
========================================================= */

async function createTicket(interaction, type) {
    const guild = interaction.guild;

    const safeName = interaction.user.username
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .slice(0, 20);

    const existing = guild.channels.cache.find(
        c => c.name === `ticket-${safeName}`
    );

    if (existing) {
        return interaction.reply({
            content: `❌ Už máš otevřený ticket: ${existing}`,
            ephemeral: true
        });
    }

    const adminRole = guild.roles.cache.find(
        r => r.name === CONFIG.roles.ADMIN
    );

    const managementRole = guild.roles.cache.find(
        r => r.name === CONFIG.roles.MANAGEMENT
    );

    const ticketCategory = guild.channels.cache.find(
        c =>
            c.type === ChannelType.GuildCategory &&
            c.name === CONFIG.categoryNames.TICKETS
    );

    const channel = await guild.channels.create({
        name: `ticket-${safeName}`,
        type: ChannelType.GuildText,
        parent: ticketCategory?.id,
        permissionOverwrites: [
            {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: interaction.user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            },
            ...(adminRole
                ? [{
                    id: adminRole.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                }]
                : []),
            ...(managementRole
                ? [{
                    id: managementRole.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                }]
                : [])
        ]
    });

    const names = {
        admin_complaint: "Stížnost na admina",
        mafia: "Mafie",
        mafia1: "Mafie 1",
        mafia2: "Mafie 2",
        mafia3: "Mafie 3",
        player_complaint: "Stížnost na hráče",
        unban: "Žádost o unban",
        other: "Jiná žádost"
    };

    const closeButton = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Uzavřít ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

    await channel.send({
        content: `<@${interaction.user.id}>`,
        embeds: [
            new EmbedBuilder()
                .setTitle(`🎫 ${names[type] || "Ticket"}`)
                .setDescription(
                    `Vítej v ticketu.\n\n` +
                    `**Typ:** ${names[type] || "Jiná žádost"}\n\n` +
                    `Popiš co nejpřesněji svůj problém nebo žádost. ` +
                    `Admin Team se ti ozve.` 
                )
                .setColor(0x5865f2)
        ],
        components: [
            new ActionRowBuilder().addComponents(closeButton)
        ]
    });

    await interaction.reply({
        content: `✅ Ticket vytvořen: ${channel}`,
        ephemeral: true
    });
}

/* =========================================================
   WARN
========================================================= */

async function processWarn(interaction) {
    const modal = new ModalBuilder()
        .setCustomId("warn_modal")
        .setTitle("⚠️ Zapsat WARN");

    const player = new TextInputBuilder()
        .setCustomId("roblox_name")
        .setLabel("Roblox jméno")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(50);

    const reason = new TextInputBuilder()
        .setCustomId("reason")
        .setLabel("Důvod WARNu")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(500);

    modal.addComponents(
        new ActionRowBuilder().addComponents(player),
        new ActionRowBuilder().addComponents(reason)
    );

    await interaction.showModal(modal);
}

/* =========================================================
   BAN
========================================================= */

async function processBan(interaction) {
    const modal = new ModalBuilder()
        .setCustomId("ban_modal")
        .setTitle("🔨 Zapsat BAN");

    const player = new TextInputBuilder()
        .setCustomId("roblox_name")
        .setLabel("Roblox jméno")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(50);

    const days = new TextInputBuilder()
        .setCustomId("days")
        .setLabel("Počet dní")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(5);

    const reason = new TextInputBuilder()
        .setCustomId("reason")
        .setLabel("Důvod BANu")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(500);

    modal.addComponents(
        new ActionRowBuilder().addComponents(player),
        new ActionRowBuilder().addComponents(days),
        new ActionRowBuilder().addComponents(reason)
    );

    await interaction.showModal(modal);
}

/* =========================================================
   READY
========================================================= */

client.once(Events.ClientReady, async readyClient => {
    console.log(`✅ Bot je online jako ${readyClient.user.tag}`);

    try {
        const guilds = readyClient.guilds.cache;

        for (const [, guild] of guilds) {
            console.log(`🔧 Nastavuji server: ${guild.name}`);

            const roles = await setupRoles(guild);

            await setupChannels(guild, roles);

            console.log(`✅ Server ${guild.name} je připraven.`);
        }
    } catch (error) {
        console.error("❌ CHYBA PŘI SETUPU:");
        console.error(error);
    }
});

/* =========================================================
   INTERACTIONS
========================================================= */

client.on(Events.InteractionCreate, async interaction => {

    try {

        /* -----------------------------
           SELECT MENU
        ----------------------------- */

        if (interaction.isStringSelectMenu()) {

            if (interaction.customId === "ticket_type") {
                await createTicket(
                    interaction,
                    interaction.values[0]
                );
                return;
            }

            if (interaction.customId === "notification_select") {

                const selected = interaction.values;

                const roleNames = {
                    events: "Eventy",
                    announcements: "Oznámení",
                    rm: "RM oznámení"
                };

                let result = selected
                    .map(x => roleNames[x] || x)
                    .join(", ");

                await interaction.reply({
                    content:
                        `✅ Nastavení oznámení uloženo.\n\n` +
                        `Vybral/a sis: **${result}**`,
                    ephemeral: true
                });

                return;
            }

            if (interaction.customId === "department_select") {

                const roleMap = {
                    police: CONFIG.roles.POLICE,
                    fire: CONFIG.roles.FIRE,
                    ems: CONFIG.roles.EMS,
                    civil: CONFIG.roles.CIVIL
                };

                const roleName = roleMap[interaction.values[0]];

                const role = interaction.guild.roles.cache.find(
                    r => r.name === roleName
                );

                const memberRole = interaction.guild.roles.cache.find(
                    r => r.name === CONFIG.roles.MEMBER
                );

                if (role) {
                    await interaction.member.roles.add(role);
                }

                if (memberRole) {
                    await interaction.member.roles.add(memberRole);
                }

                let message;

                if (interaction.values[0] === "police") {
                    message =
                        "👮 Vybral/a sis **Policii**.\n\n" +
                        "Dostal/a jsi roli **Člen**. " +
                        "Později zde bot může automaticky poslat pozvánku na server Policie.";
                }

                if (interaction.values[0] === "fire") {
                    message =
                        "🚒 Vybral/a sis **Hasiče**.\n\n" +
                        "Dostal/a jsi roli **Člen**. " +
                        "Později zde bot může automaticky poslat pozvánku na server Hasičů.";
                }

                if (interaction.values[0] === "ems") {
                    message =
                        "🚑 Vybral/a sis **Záchranku**.\n\n" +
                        "Dostal/a jsi roli **Člen**. " +
                        "Později zde bot může automaticky poslat pozvánku na server Záchranky.";
                }

                if (interaction.values[0] === "civil") {
                    message =
                        "👤 Vybral/a sis **Civilistu**.\n\n" +
                        "Dostal/a jsi roli **Člen**.";
                }

                await interaction.reply({
                    content: `✅ ${message}`,
                    ephemeral: true
                });

                return;
            }
        }

        /* -----------------------------
           BUTTONS
        ----------------------------- */

        if (interaction.isButton()) {

            if (interaction.customId === "punishment_warn") {

                const adminRole = interaction.guild.roles.cache.find(
                    r => r.name === CONFIG.roles.ADMIN
                );

                const managementRole = interaction.guild.roles.cache.find(
                    r => r.name === CONFIG.roles.MANAGEMENT
                );

                if (
                    !interaction.member.roles.cache.has(adminRole?.id) &&
                    !interaction.member.roles.cache.has(managementRole?.id)
                ) {
                    return interaction.reply({
                        content: "❌ Tento formulář je pouze pro Admin Team a Vedení.",
                        ephemeral: true
                    });
                }

                await processWarn(interaction);
                return;
            }

            if (interaction.customId === "punishment_ban") {

                const adminRole = interaction.guild.roles.cache.find(
                    r => r.name === CONFIG.roles.ADMIN
                );

                const managementRole = interaction.guild.roles.cache.find(
                    r => r.name === CONFIG.roles.MANAGEMENT
                );

                if (
                    !interaction.member.roles.cache.has(adminRole?.id) &&
                    !interaction.member.roles.cache.has(managementRole?.id)
                ) {
                    return interaction.reply({
                        content: "❌ Tento formulář je pouze pro Admin Team a Vedení.",
                        ephemeral: true
                    });
                }

                await processBan(interaction);
                return;
            }

            if (interaction.customId === "close_ticket") {

                const channel = interaction.channel;

                await interaction.reply({
                    content: "🔒 Ticket bude uzavřen za 3 sekundy."
                });

                setTimeout(async () => {
                    await channel.delete().catch(() => {});
                }, 3000);

                return;
            }
        }

        /* -----------------------------
           MODALS
        ----------------------------- */

        if (interaction.isModalSubmit()) {

            if (interaction.customId === "warn_modal") {

                const robloxName =
                    interaction.fields.getTextInputValue("roblox_name");

                const reason =
                    interaction.fields.getTextInputValue("reason");

                const warnChannel = interaction.guild.channels.cache.find(
                    c => c.name === "⚠️・warny"
                );

                if (!warnChannel) {
                    return interaction.reply({
                        content: "❌ Kanál ⚠️・warny nebyl nalezen.",
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle("⚠️ NOVÝ WARN")
                    .addFields(
                        {
                            name: "👤 Roblox hráč",
                            value: robloxName
                        },
                        {
                            name: "🛡️ Udělil",
                            value: `<@${interaction.user.id}>`
                        },
                        {
                            name: "📋 Důvod",
                            value: reason
                        }
                    )
                    .setColor(0xf1c40f)
                    .setTimestamp();

                await warnChannel.send({
                    embeds: [embed]
                });

                await interaction.reply({
                    content:
                        `✅ WARN pro **${robloxName}** byl zapsán do ${warnChannel}.`,
                    ephemeral: true
                });

                return;
            }

            if (interaction.customId === "ban_modal") {

                const robloxName =
                    interaction.fields.getTextInputValue("roblox_name");

                const days =
                    interaction.fields.getTextInputValue("days");

                const reason =
                    interaction.fields.getTextInputValue("reason");

                const banChannel = interaction.guild.channels.cache.find(
                    c => c.name === "🔨・bany"
                );

                if (!banChannel) {
                    return interaction.reply({
                        content: "❌ Kanál 🔨・bany nebyl nalezen.",
                        ephemeral: true
                    });
                }

                const embed = new EmbedBuilder()
                    .setTitle("🔨 NOVÝ BAN")
                    .addFields(
                        {
                            name: "👤 Roblox hráč",
                            value: robloxName
                        },
                        {
                            name: "🛡️ Udělil",
                            value: `<@${interaction.user.id}>`
                        },
                        {
                            name: "⏱️ Délka",
                            value: `${days} dní`
                        },
                        {
                            name: "📋 Důvod",
                            value: reason
                        }
                    )
                    .setColor(0xe74c3c)
                    .setTimestamp();

                await banChannel.send({
                    embeds: [embed]
                });

                await interaction.reply({
                    content:
                        `✅ BAN pro **${robloxName}** byl zapsán do ${banChannel}.`,
                    ephemeral: true
                });

                return;
            }
        }

    } catch (error) {

        console.error("❌ Interaction error:", error);

        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: "❌ Nastala chyba. Zkontroluj Railway logs.",
                ephemeral: true
            }).catch(() => {});
        }
    }
});

/* =========================================================
   PŘÍKAZY
========================================================= */

client.on(Events.MessageCreate, async message => {

    if (message.author.bot) return;

    if (message.content === "!panel") {

        const memberRole = message.guild.roles.cache.find(
            r => r.name === CONFIG.roles.MEMBER
        );

        const menu = new StringSelectMenuBuilder()
            .setCustomId("department_select")
            .setPlaceholder("👥 Vyber svou složku")
            .addOptions([
                {
                    label: "Policie",
                    value: "police",
                    emoji: "👮"
                },
                {
                    label: "Hasiči",
                    value: "fire",
                    emoji: "🚒"
                },
                {
                    label: "Záchranka",
                    value: "ems",
                    emoji: "🚑"
                },
                {
                    label: "Civilista",
                    value: "civil",
                    emoji: "👤"
                }
            ]);

        const notificationMenu = new StringSelectMenuBuilder()
            .setCustomId("notification_select")
            .setPlaceholder("📢 Vyber oznámení")
            .setMinValues(0)
            .setMaxValues(3)
            .addOptions([
                {
                    label: "Eventy",
                    value: "events",
                    emoji: "🎉"
                },
                {
                    label: "Oznámení",
                    value: "announcements",
                    emoji: "📢"
                },
                {
                    label: "RM oznámení",
                    value: "rm",
                    emoji: "🚨"
                }
            ]);

        await message.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle("🌐 IMPERIAL CZ/SK")
                    .setDescription(
                        "Vítej na hlavním serveru Imperial CZ/SK.\n\n" +
                        "### 👥 Vyber si svou složku\n" +
                        "Vyber Policii, Hasiče, Záchranku nebo Civilistu.\n\n" +
                        "### 📢 Oznámení\n" +
                        "Můžeš si vybrat, která oznámení chceš dostávat.\n\n" +
                        "Pokud zvolíš některou složku IZS, dostaneš také roli **Člen**."
                    )
                    .setColor(0x5865f2)
            ],
            components: [
                new ActionRowBuilder().addComponents(menu),
                new ActionRowBuilder().addComponents(notificationMenu)
            ]
        });

        return;
    }

    if (message.content === "!setup") {

        const owner = message.guild.ownerId === message.author.id;

        const adminRole = message.guild.roles.cache.find(
            r => r.name === CONFIG.roles.ADMIN
        );

        const managementRole = message.guild.roles.cache.find(
            r => r.name === CONFIG.roles.MANAGEMENT
        );

        const isStaff =
            owner ||
            message.member.roles.cache.has(adminRole?.id) ||
            message.member.roles.cache.has(managementRole?.id);

        if (!isStaff) {
            return message.reply(
                "❌ `!setup` může použít pouze Vedení nebo vlastník serveru."
            );
        }

        await message.reply("🔧 Spouštím kompletní setup serveru...");

        try {
            const roles = await setupRoles(message.guild);
            await setupChannels(message.guild, roles);

            await message.channel.send(
                "✅ **SETUP DOKONČEN.**\n\n" +
                "Role, kategorie, kanály, práva, ticket panel a trestní systém jsou připravené."
            );

        } catch (error) {

            console.error(error);

            await message.channel.send(
                "❌ Setup se nepodařilo dokončit.\n" +
                "Podívej se do Railway Logs."
            );
        }
    }
});

/* =========================================================
   LOGIN
========================================================= */

client.login(TOKEN).catch(error => {
    console.error("❌ Bot se nepodařilo přihlásit:");
    console.error(error);
});

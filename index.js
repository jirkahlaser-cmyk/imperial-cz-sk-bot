const {
    Client,
    GatewayIntentBits,
    Partials,
    ChannelType,
    PermissionsBitField,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel]
});

const PREFIX = "!";

const shifts = new Map();

function embed(title, description) {
    return new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(0x2b2d31)
        .setTimestamp();
}

async function getOrCreateCategory(guild, name) {
    let category = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name === name
    );

    if (!category) {
        category = await guild.channels.create({
            name,
            type: ChannelType.GuildCategory
        });
    }

    return category;
}

async function getOrCreateChannel(guild, name, category, options = {}) {
    let channel = guild.channels.cache.find(
        c =>
            c.type === ChannelType.GuildText &&
            c.name === name &&
            c.parentId === category.id
    );

    if (!channel) {
        channel = await guild.channels.create({
            name,
            type: ChannelType.GuildText,
            parent: category.id,
            ...options
        });
    }

    return channel;
}

async function sendRules(channel) {
    await channel.send({
        embeds: [
            embed(
                "📜 RP PRAVIDLA",
                `
**1. Základní pravidla**
• Chovej se slušně k ostatním hráčům.
• Respektuj ostatní členy komunity.
• Zákaz spamování a úmyslného narušování RP.
• Rozhodnutí vedení serveru respektuj.

**2. FearRP**
• Pokud ti hrozí vážné nebezpečí, musíš na něj adekvátně reagovat.
• Nemůžeš se chovat, jako kdyby ti nic nehrozilo.

**3. RDM**
• Random Deathmatch je zakázán.
• Nesmíš bezdůvodně napadat nebo zabíjet jiné hráče.

**4. VDM**
• Úmyslné najíždění do hráčů vozidlem je zakázáno.

**5. Metagaming**
• Nepoužívej informace získané mimo RP v rámci RP.

**6. Powergaming**
• Nedělej věci, které by v reálné situaci nebyly možné.

**7. Combat Logging**
• Neodcházej ze hry během probíhajícího RP.

**8. FailRP**
• Hraj realisticky a podle situace.

**9. OOC**
• OOC informace nepoužívej během RP bez oprávněného důvodu.

**10. Peace Time**
• Během vyhlášeného Peace Time se řiď pokyny vedení.

❗ Neznalost pravidel není omluva.
                `
            )
        ]
    });
}

async function sendStaffRules(channel) {
    await channel.send({
        embeds: [
            embed(
                "🛡️ STAFF RP PRAVIDLA",
                `
**1. Staff musí být nestranný.**

**2. Admin nesmí zneužívat pravomoci.**

**3. Zákaz používání administrátorských pravomocí pro vlastní výhodu.**

**4. Admin nesmí trestat hráče kvůli osobním konfliktům.**

**5. Před udělením trestu si vždy zjisti situaci.**

**6. Pokud si nejsi jistý, kontaktuj vyššího administrátora.**

**7. Zákaz ghostování hráčů a neoprávněného sledování RP.**

**8. Admin musí být příkladem pro ostatní hráče.**

**9. Zákaz rozdávání věcí, peněz nebo výhod bez povolení.**

**10. Interní informace staffu se nesmí zveřejňovat.**

⚠️ Závažné porušení staff pravidel může vést k odebrání práv.
                `
            )
        ]
    });
}

async function sendPunishments(channel) {
    await channel.send({
        embeds: [
            embed(
                "⚖️ TRESTY",
                `
**VAROVÁNÍ**
Používá se u menšího porušení pravidel.

**KICK**
Používá se při opakovaném nebo závažnějším porušení.

**TEMPBAN**
Dočasný ban při vážném porušení nebo opakovaných problémech.

**BAN**
Trvalý ban při velmi závažném porušení pravidel.

**STAFF TREST**
• Odebrání práv
• Varování
• Suspendace
• Odebrání role

### PŘÍKLADY

RDM → Warn / Kick / Tempban  
VDM → Warn / Kick / Tempban  
Metagaming → Warn / Kick  
Combat Logging → Warn / Tempban  
Toxicita → Warn / Mute / Kick  
Spam → Warn / Mute  
Obcházení banu → Ban  
Závažné zneužití exploitů → Ban

❗ Trest se vždy přizpůsobuje konkrétní situaci.
                `
            )
        ]
    });
}

async function sendEvents(channel) {
    await channel.send({
        embeds: [
            embed(
                "🎉 EVENTY",
                `
Na serveru se mohou pořádat například:

🚓 Policejní honička  
🚑 Hromadná dopravní nehoda  
🔥 Požár budovy  
🏦 Bankovní loupež  
🚔 Velká policejní operace  
🚨 Únos  
🚗 Nelegální závod  
✈️ Incident na letišti  
🌪️ Přírodní katastrofa  
👮 SWAT operace  
🚧 Dopravní uzávěra  
🏙️ Velká městská evakuace

Každý event musí mít jasná pravidla a organizátora.
                `
            )
        ]
    });
}

async function sendStaffEvents(channel) {
    await channel.send({
        embeds: [
            embed(
                "🛠️ STAFF EVENTY",
                `
Tento kanál slouží pro plánování eventů staffem.

Staff může připravovat například:

• Bankovní loupež
• Velkou policejní operaci
• Hromadnou nehodu
• Požár
• Únos
• Evakuaci města
• Dopravní nehodu
• Speciální policejní akci
• Tajnou operaci

Před velkým eventem se doporučuje vytvořit:
1. Název eventu
2. Organizátora
3. Datum a čas
4. Místo
5. Počet účastníků
6. Pravidla eventu
                `
            )
        ]
    });
}

async function sendApplications(channel) {
    await channel.send({
        embeds: [
            embed(
                "📝 PŘIHLÁŠKY NA SMĚNU",
                `
Tento kanál je určen **POUZE PRO ADMINY**.

Pokud jdeš jako admin OORP, použij:

\`!startshift\`

Po skončení směny použij:

\`!endshift\`

Bot následně zaznamená délku směny.

📊 Celkový čas může vedení kontrolovat pomocí:

\`!leaderboard\`
                `
            )
        ]
    });
}

async function sendTicketMessage(channel) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("ticket")
            .setLabel("🎫 Vytvořit ticket")
            .setStyle(ButtonStyle.Primary)
    );

    await channel.send({
        embeds: [
            embed(
                "🎫 TICKET SYSTÉM",
                `
Potřebuješ pomoc?

Klikni na tlačítko níže a vytvoř ticket.

V ticketu můžeš požádat například o:

• Pomoc s RP
• Nahlášení hráče
• Nahlášení admina
• Odvolání proti trestu
• Technickou pomoc
• Kontaktování vedení

Po vytvoření ticketu popiš svůj problém co nejpodrobněji.
                `
            )
        ],
        components: [row]
    });
}

client.once("ready", () => {
    console.log(`✅ Bot je online jako ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "ticket") {
        const guild = interaction.guild;

        const existing = guild.channels.cache.find(
            c =>
                c.type === ChannelType.GuildText &&
                c.name === `ticket-${interaction.user.username.toLowerCase()}`
        );

        if (existing) {
            return interaction.reply({
                content: `❌ Už máš otevřený ticket: ${existing}`,
                ephemeral: true
            });
        }

        const category = await getOrCreateCategory(guild, "🎫 TICKETY");

        const channel = await guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: interaction.user.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory
                    ]
                }
            ]
        });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("close_ticket")
                .setLabel("🔒 Zavřít ticket")
                .setStyle(ButtonStyle.Danger)
        );

        await channel.send({
            content: `${interaction.user}`,
            embeds: [
                embed(
                    "🎫 Ticket vytvořen",
                    `
Napiš zde svůj problém.

Pokud je potřeba, ticket může být předán **vedení serveru**.

Prosím poskytni:
• Co se stalo
• Kdy se to stalo
• Kdo byl účastníkem
• Důkazy / screenshoty, pokud je máš
                    `
                )
            ],
            components: [row]
        });

        await interaction.reply({
            content: `✅ Ticket vytvořen: ${channel}`,
            ephemeral: true
        });
    }

    if (interaction.customId === "close_ticket") {
        await interaction.reply("🔒 Ticket bude uzavřen.");

        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch {}
        }, 3000);
    }
});

client.on("messageCreate", async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();

    if (command === "ping") {
        return message.reply(`🏓 Pong! ${client.ws.ping}ms`);
    }

    if (command === "startshift") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return message.reply("❌ Tento příkaz je pouze pro staff.");
        }

        if (shifts.has(message.author.id)) {
            return message.reply("❌ Směnu už máš spuštěnou.");
        }

        shifts.set(message.author.id, Date.now());

        return message.reply(
            `🟢 **Směna zahájena!**\nAdmin: ${message.author}\nPoužij \`!endshift\` až skončíš.`
        );
    }

    if (command === "endshift") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return message.reply("❌ Tento příkaz je pouze pro staff.");
        }

        const start = shifts.get(message.author.id);

        if (!start) {
            return message.reply("❌ Nemáš spuštěnou směnu.");
        }

        const elapsed = Date.now() - start;

        shifts.delete(message.author.id);

        const totalMinutes = Math.floor(elapsed / 60000);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return message.reply(
            `🔴 **Směna ukončena!**\nOdpracovaný čas: **${hours}h ${minutes}min**`
        );
    }

    if (command === "leaderboard") {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return message.reply("❌ Tento příkaz je pouze pro staff.");
        }

        if (shifts.size === 0) {
            return message.reply(
                "📊 Momentálně nejsou žádní admini s aktivní směnou."
            );
        }

        let text = "";

        let position = 1;

        for (const [userId, start] of shifts) {
            const elapsed = Date.now() - start;
            const minutes = Math.floor(elapsed / 60000);
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;

            text += `**${position}.** <@${userId}> — ${hours}h ${mins}min\n`;
            position++;
        }

        return message.reply({
            embeds: [
                embed(
                    "🏆 STAFF LEADERBOARD",
                    text || "Žádné aktivní směny."
                )
            ]
        });
    }

    if (command === "setup") {
        if (
            !message.member.permissions.has(
                PermissionsBitField.Flags.Administrator
            )
        ) {
            return message.reply(
                "❌ Setup může spustit pouze administrátor serveru."
            );
        }

        await message.reply("⚙️ Spouštím kompletní setup serveru...");

        // VEŘEJNÁ ČÁST
        const publicCategory = await getOrCreateCategory(
            message.guild,
            "📢 VEŘEJNÉ"
        );

        const welcome = await getOrCreateChannel(
            message.guild,
            "👋・vítejte",
            publicCategory
        );

        const rules = await getOrCreateChannel(
            message.guild,
            "📜・rp-pravidla",
            publicCategory
        );

        const info = await getOrCreateChannel(
            message.guild,
            "ℹ️・informace",
            publicCategory
        );

        const events = await getOrCreateChannel(
            message.guild,
            "🎉・eventy",
            publicCategory
        );

        const emergencyMap = await getOrCreateChannel(
            message.guild,
            "🗺️・mapa-emergency",
            publicCategory
        );

        await welcome.send({
            embeds: [
                embed(
                    "👋 VÍTEJ NA SERVERU",
                    `
Vítej na našem Emergency Hamburg RP serveru!

Před hraním si přečti pravidla a informace.

Užij si kvalitní RP a respektuj ostatní hráče. ❤️
                    `
                )
            ]
        });

        await rules.send({
            embeds: [
                embed(
                    "📜 RP PRAVIDLA",
                    "Pravidla serveru najdeš níže."
                )
            ]
        });

        await sendRules(rules);

        await info.send({
            embeds: [
                embed(
                    "ℹ️ INFORMACE",
                    `
🎮 Hra: Emergency Hamburg

🇨🇿 Česká / 🇸🇰 slovenská RP komunita

Pro pomoc použij ticket systém.

Pro aktuální informace sleduj oznámení serveru.
                    `
                )
            ]
        });

        await sendEvents(events);

        await emergencyMap.send({
            embeds: [
                embed(
                    "🗺️ MAPA EMERGENCY HAMBURG",
                    `
Zde bude umístěna mapa Emergency Hamburg.

Pokud používáš vlastní mapu serveru, můžeš sem později vložit její odkaz.

📍 Místa důležitá pro RP:
• Policie
• Nemocnice
• Hasičská stanice
• Banka
• Letiště
• Přístav
• Centrum města
• Dálnice
• Čerpací stanice
                    `
                )
            ]
        });

        // TICKETY
        const ticketCategory = await getOrCreateCategory(
            message.guild,
            "🎫 PODPORA"
        );

        const tickets = await getOrCreateChannel(
            message.guild,
            "🎫・vytvořit-ticket",
            ticketCategory
        );

        await sendTicketMessage(tickets);

        // STAFF
        const staffCategory = await getOrCreateCategory(
            message.guild,
            "🛡️ STAFF"
        );

        const staffChat = await getOrCreateChannel(
            message.guild,
            "💬・staff-chat",
            staffCategory
        );

        const staffAnnouncements = await getOrCreateChannel(
            message.guild,
            "📢・staff-oznámení",
            staffCategory
        );

        const staffRules = await getOrCreateChannel(
            message.guild,
            "📜・staff-rp-pravidla",
            staffCategory
        );

        const punishments = await getOrCreateChannel(
            message.guild,
            "⚖️・tresty",
            staffCategory
        );

        const applications = await getOrCreateChannel(
            message.guild,
            "📝・přihlášky",
            staffCategory
        );

        const staffEvents = await getOrCreateChannel(
            message.guild,
            "🛠️・staff-eventy",
            staffCategory
        );

        const leaderboard = await getOrCreateChannel(
            message.guild,
            "🏆・leaderboard",
            staffCategory
        );

        await staffChat.send({
            embeds: [
                embed(
                    "💬 STAFF CHAT",
                    "Interní komunikace administrátorského týmu."
                )
            ]
        });

        await staffAnnouncements.send({
            embeds: [
                embed(
                    "📢 STAFF OZNÁMENÍ",
                    "Zde vedení zveřejňuje důležitá oznámení pro staff."
                )
            ]
        });

        await sendStaffRules(staffRules);
        await sendPunishments(punishments);
        await sendApplications(applications);
        await sendStaffEvents(staffEvents);

        await leaderboard.send({
            embeds: [
                embed(
                    "🏆 STAFF LEADERBOARD",
                    `
Zde se budou zobrazovat statistiky směn adminů.

Příkazy:

\`!startshift\`
→ zahájí směnu

\`!endshift\`
→ ukončí směnu

\`!leaderboard\`
→ zobrazí aktuální statistiky
                    `
                )
            ]
        });

        await message.channel.send({
            embeds: [
                embed(
                    "✅ SETUP DOKONČEN",
                    `
Server byl připraven.

Vytvořeny / připraveny byly:

📢 Veřejná část
🎫 Ticket systém
📜 RP pravidla
🗺️ Mapa Emergency
🎉 Veřejné eventy
🛡️ Staff část
💬 Staff chat
📢 Staff oznámení
📜 Staff RP pravidla
⚖️ Tresty
📝 Přihlášky na směny
🛠️ Staff eventy
🏆 Staff leaderboard

Bot je připraven k používání.
                    `
                )
            ]
        });
    }
});

client.login(process.env.DISCORD_TOKEN);

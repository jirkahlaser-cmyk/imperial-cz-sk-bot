const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SlashCommandBuilder,
  REST,
  Routes
} = require("discord.js");

const TOKEN = process.env.DISCORD_TOKEN;

if (!TOKEN) {
  console.error("❌ Chybí DISCORD_TOKEN v Railway Variables.");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

/* =========================================================
   ROLE
========================================================= */

const ROLE_NAMES = {
  member: "Člen",
  admin: "Admin",
  moderator: "Moderátor",
  management: "Vedení",
  owner: "Majitel",

  pd: "🚔 PD",
  fire: "🚒 Hasiči",
  ems: "🚑 Záchranáři",
  civilian: "👤 Civilista",

  event: "🔔 Eventy",
  announcements: "🔔 Oznámení",
  rm: "🔔 RM Oznámení",

  at1: "AT1",
  at2: "AT2",
  at3: "AT3",
  at5: "AT5",
  at6: "AT6"
};

/* =========================================================
   BARVY
========================================================= */

const COLORS = {
  blue: "#3498DB",
  green: "#2ECC71",
  red: "#E74C3C",
  yellow: "#F1C40F",
  purple: "#9B59B6",
  gold: "#FFD700",
  gray: "#95A5A6",
  dark: "#2C3E50"
};

/* =========================================================
   TEXTY
========================================================= */

const TEXTS = {

  welcome: `Vítej na oficiálním Discord serveru Imperial CZ/SK! Tento server je hlavním místem pro komunitu, informace, oznámení, eventy, komunikaci a organizaci celého projektu. Než začneš server používat naplno, projdi si pravidla a následně si v sekci VÝBĚR nastav oznámení, která chceš dostávat. Můžeš si vybrat Eventy, běžná Oznámení a RM Oznámení podle toho, co tě zajímá. Poté si vyber právě jednu hlavní složku: Policii, Hasiče, Záchranáře nebo Civilistu. Pokud si vybereš jednu ze složek IZS, dostaneš příslušnou roli a zároveň roli Člen, protože členství na hlavním Imperial serveru je potřebné pro další fungování projektu. Tato volba určuje přístup do příslušných soukromých částí serveru. Výběr můžeš později změnit, ale vždy můžeš mít pouze jednu z těchto čtyř hlavních rolí. Respektuj ostatní členy, administraci a pravidla projektu. Zakázané je úmyslné vyvolávání konfliktů, spam, reklama bez povolení, obcházení trestů a zneužívání ticket systému. Pokud máš problém s hráčem nebo administrátorem, použij ticket a popiš situaci věcně. Cílem serveru je vytvořit přehlednou, aktivní a férovou CZ/SK komunitu kolem Imperialu. Užij si server, zapojuj se do eventů a pomáhej nám ho společně zlepšovat.`,

  rules: `📜 PRAVIDLA IMPERIAL CZ/SK

Tento kanál slouží jako hlavní přehled pravidel, která platí pro všechny členy serveru bez ohledu na jejich roli. Chovej se slušně a respektuj ostatní členy, administrátory, moderátory i vedení. Je zakázáno cílené urážení, vyhrožování, obtěžování, spamování, úmyslné vyvolávání hádek a jakékoliv jednání, které narušuje komunitu. Reklama, propagace jiných serverů nebo projektů a nevyžádané odkazy jsou povoleny pouze tehdy, pokud je výslovně schválí vedení. Nepoužívej tickety k trollingu, falešným stížnostem nebo opakovanému řešení stejné věci.

Pokud podáváš stížnost na hráče nebo admina, uveď co nejvíce konkrétních informací, například Roblox jméno, čas, místo, popis situace a důkazy, pokud je máš. Tresty se udělují podle závažnosti situace. Opakované porušování pravidel může vést k warnu, banu nebo dalšímu omezení přístupu. Pokus o obcházení banu nebo trestu může být považován za další porušení.

Administrace má právo zasáhnout i v situacích, které nejsou popsány doslova v tomto seznamu, pokud je zřejmé, že chování poškozuje server nebo komunitu. Při rozhodování se očekává férovost, důkazy a přiměřenost. Pokud nesouhlasíš s trestem, nehádej se veřejně; použij žádost o unban nebo příslušný ticket. Pravidla mohou být aktualizována vedením, proto doporučujeme tento kanál pravidelně kontrolovat. Připojením a používáním serveru potvrzuješ, že jsi pravidla četl a budeš je respektovat.`,

  notifications: `🔔 VÝBĚR OZNÁMENÍ

Zde si můžeš nastavit, jaké typy oznámení chceš dostávat. Nemusíš sledovat všechno a můžeš si vybrat pouze informace, které tě opravdu zajímají. K dispozici jsou tři samostatné role: 🎉 Eventy, 📢 Oznámení a 📣 RM Oznámení. Role můžeš libovolně kombinovat, takže například můžeš dostávat pouze eventy, nebo všechny tři typy.

Eventy slouží především pro informace o plánovaných akcích, RP situacích, komunitních aktivitách a dalších událostech. Oznámení jsou určena pro důležité informace týkající se fungování serveru, změn systému, údržby nebo zásadních aktualizací. RM Oznámení jsou určena pro informace související s RM a jeho aktivitami.

Výběr se provádí přes menu pod touto zprávou. Po potvrzení bot automaticky přidá zvolené role a odebere role, které sis nezvolil. Pokud změníš názor, stačí menu použít znovu. Nastavení se týká pouze tvého účtu a nijak nemění tvé ostatní role. Prosíme, vybírej role podle toho, jaké zprávy chceš skutečně dostávat, aby oznámení zůstala přehledná. Pokud máš problém s výběrem nebo ti role nejdou nastavit, kontaktuj administraci přes ticket.`,

  factions: `🎖️ VÝBĚR HLAVNÍ SLOŽKY

Na tomto místě si vybereš svou hlavní roli v Imperial CZ/SK. Na výběr je 🚔 Policie, 🚒 Hasiči, 🚑 Záchranáři a 👤 Civilista. Z těchto čtyř možností můžeš mít současně pouze jednu.

Pokud zvolíš Policii, Hasiče nebo Záchranáře, dostaneš příslušnou roli IZS a zároveň roli Člen. Příslušná role ti následně umožní vstup do zabezpečené sekce dané složky. Do ostatních IZS sekcí přístup mít nebudeš.

Pokud si vybereš Civilistu, získáš roli Civilista a Člen a zůstaneš v běžné komunitní části serveru. Výběr můžeš později změnit. Bot při nové volbě automaticky odebere starou hlavní roli a nastaví novou, takže není potřeba psát administrátorům.

Tato volba sama o sobě neznamená přijetí do služby ani automatické přijetí do PD, Hasičů nebo Záchranářů. U IZS může následovat další nábor, ověření nebo přidělení do specializované služby podle pravidel dané složky.

Do budoucna budou jednotlivé složky fungovat také na samostatných serverech, kam může bot po splnění podmínek posílat pozvánku. Tento hlavní Imperial server ale zůstává společným místem pro celou komunitu. Pokud si nejsi jistý, kterou roli zvolit, vyber Civilistu a později svou volbu změň.`,

  map: `🗺️ MAPA A INFORMACE O SERVERU

Tento kanál je určen pro přehledné informace o mapě a důležitých místech používaných v rámci Imperial projektu. Pokud bude zveřejněna aktuální mapa, změna lokací, nové oblasti, důležité body nebo jiná navigační informace, budou umístěny právě sem.

Při používání mapy mysli na to, že některé lokace mohou být dostupné pouze určitým složkám nebo mohou mít specifická RP pravidla. Informace v tomto kanálu jsou určeny hlavně pro orientaci a neměly by být zneužívány k narušování RP situací.

Pokud najdeš chybu v mapě, neaktuální označení nebo místo, které podle tebe potřebuje doplnit, vytvoř ticket a popiš problém. Administrace může mapové informace průběžně upravovat podle vývoje projektu.

Před důležitými eventy vždy sleduj také oznámení, protože pravidla nebo dostupnost lokací se mohou dočasně změnit. Pokud budou později přidány informace o domech, veřejných budovách, službách nebo dalších herních mechanikách, budou přehledně rozděleny tak, aby se v nich členové snadno orientovali.

Cílem je mít jedno spolehlivé místo, kde každý rychle najde základní informace o prostředí Imperialu.`,

  houses: `🏠 DOMY A MAJETEK

Tento kanál bude sloužit jako centrální místo pro informace o domech, nemovitostech a případném systému jejich získávání v Imperialu. Pokud bude zaveden nákup, pronájem, rezervace nebo převod domu, budou zde zveřejněny aktuální podmínky, ceny, pravidla a postup.

Nekupuj ani nepřeváděj žádný majetek mimo oficiální systém, pokud ti administrace výslovně nepotvrdí, že je daný postup platný. Každý dům může mít vlastní pravidla, lokaci nebo omezení.

Pokud bude potřeba vytvořit žádost o dům, bude možné využít ticket systém a uvést Roblox jméno, požadovanou lokaci, typ nemovitosti a další potřebné informace. Falešné žádosti, pokusy obejít pravidla nebo vydávání se za administraci mohou být potrestány.

Veškeré změny vlastnictví musí být dohledatelné, aby bylo možné řešit případné spory. Pokud se systém domů bude v budoucnu rozšiřovat, budou informace aktualizovány zde a v oznámeních. Sleduj proto tento kanál před každou žádostí.

Smyslem systému je vytvořit férový způsob, jak získat a spravovat nemovitosti, bez chaosu a bez zvýhodňování jednotlivých hráčů.`,

  admin: `🛡️ ADMIN TEAM – INTERNÍ INFORMACE

Tato sekce je určena pouze pro členy administrace a vyšší vedení. Obsah interních diskusí, reportů, rozhodnutí, důkazů a dalších materiálů nesmí být bez oprávnění zveřejňován mimo zabezpečenou část serveru.

Administrátor by měl při řešení situací postupovat klidně, objektivně a podle pravidel. Před udělením trestu je vhodné ověřit dostupné důkazy a dát hráči možnost situaci vysvětlit, pokud to okolnosti dovolují.

Admin tým může řešit stížnosti, tickety, reporty, RP incidenty a další problémy. Každý důležitý trest musí být zaznamenán pomocí systému trestů, aby existoval dohledatelný přehled o warnu nebo banu, důvodu, Roblox jménu hráče, autorovi trestu a případně délce banu.

Zneužití pravomocí, mazání důkazů, rozdávání trestů bez důvodu nebo využívání administrátorských možností pro osobní výhodu může vést k odebrání pravomocí.

Admini mají respektovat také rozhodnutí vedení a v případě nejasnosti se obrátit na vyšší hodnost. Tato část serveru je pracovní prostor, proto zde udržuj pořádek a používej správné kanály.

AT voice kanály jsou určeny pro interní komunikaci. Vedení má oddělenou sekci, do které běžní admini nemají přístup. Majitel serveru má plný přístup ke všem částem podle nastavení serveru.`,

  management: `👑 VEDENÍ – INTERNÍ PROSTOR

Tato sekce je vyhrazena vedení projektu a majiteli serveru. Slouží pro plánování, důležitá rozhodnutí, vývoj serveru, budoucí změny, spolupráci s jednotlivými složkami a řešení citlivějších záležitostí.

Informace z této sekce se nemají bez povolení přeposílat členům, adminům ani mimo projekt. Vedení může diskutovat o změnách pravidel, náboru administrace, rozvoji IZS serverů, ekonomice projektu, eventech, partnerstvích a dalších dlouhodobých plánech.

Každé rozhodnutí by mělo být co nejvíce srozumitelné a následně, pokud je veřejné, oznámeno vhodným způsobem v hlavní části serveru. Vedení má zároveň dbát na to, aby administrace dostávala jasné instrukce a aby jednotlivé složky nebyly zbytečně zvýhodňovány.

Majitel má plný přístup a odpovědnost za hlavní server, zatímco role Vedení slouží k řízení a organizaci projektu podle svěřených pravomocí.

Tento prostor není určen pro běžný chat ani veřejné řešení ticketů. Pokud je potřeba něco projednat s administrací, použijte admin sekci. Pokud je potřeba rozhodnutí zaznamenat, využijte plánovací kanál, aby bylo možné se k němu později vrátit.`,

  punishments: `⚠️ SYSTÉM TRESTŮ

Tato část serveru slouží k evidenci trestů udělených hráčům. Každý WARN nebo BAN musí mít jasně uvedené Roblox jméno hráče, důvod, jméno administrátora, který trest udělil, a u banu také počet dní.

Cílem je zabránit chaosu a zajistit, aby administrace měla dohledatelnou historii. Warn je upozornění na porušení pravidel a měl by být použit přiměřeně situaci.

Pokud hráč nasbírá tři warny, systém upozorní administraci, že má být řešen třídenní ban podle nastaveného pravidla. Tento automatický upozorňovací systém není náhradou za kontrolu administrátora – před udělením banu je vždy potřeba ověřit historii a okolnosti.

BAN může být dočasný podle počtu dní nebo jinak nastavený podle pravidel projektu. Záznamy v logu nemažte a neupravujte bez oprávnění. Pokud byl trest udělen omylem, řešte opravu přes vedení a zachovejte původní záznam pro dohledatelnost.

Hráči, kteří se domnívají, že dostali trest neprávem, mohou využít žádost o unban nebo ticket. Administrace by neměla tresty používat jako prostředek osobního konfliktu. Každý trest má být založený na pravidlech a dostupných důkazech.

Tento systém je určen k ochraně komunity a k transparentnímu internímu přehledu.`,

  tickets: `🎫 TICKET SYSTÉM

Pokud potřebuješ pomoc administrace, použij menu níže a vyber správný typ ticketu. K dispozici je stížnost na admina, stížnost na hráče, záležitosti týkající se mafie, Mafie 1, Mafie 2, Mafie 3 a žádost o unban.

Vyber vždy možnost, která nejlépe odpovídá tvému problému. Do ticketu napiš co nejvíce konkrétních informací: Roblox jméno, Discord jméno, čas události, místo, popis situace a případné důkazy.

U stížnosti na admina se snaž popsat konkrétní jednání, nikoliv pouze napsat, že admin je špatný. U stížnosti na hráče uveď, co přesně hráč udělal a jaká pravidla podle tebe porušil.

U žádosti o unban vysvětli, proč žádáš o zrušení nebo zkrácení trestu a případně uveď, co se od udělení trestu změnilo.

Ticket systém není určen pro spam, trollení, falešná hlášení nebo opakované zakládání stejné žádosti. Administrace může ticket uzavřít, pokud je vyřešený, neobsahuje potřebné informace nebo porušuje pravidla.

Pokud je problém urgentní, napiš to jasně a věcně. Nikdy nezveřejňuj citlivé osobní údaje, hesla ani tokeny. Cílem ticket systému je umožnit rychlou, přehlednou a férovou komunikaci mezi hráči a administrací.`
};

/* =========================================================
   HELPERS
========================================================= */

async function getOrCreateRole(guild, name, color = null) {
  let role = guild.roles.cache.find(r => r.name === name);

  if (!role) {
    role = await guild.roles.create({
      name,
      color: color || "Default",
      reason: "Imperial CZ/SK server setup"
    });
  }

  return role;
}

async function getOrCreateCategory(guild, name) {
  let category = guild.channels.cache.find(
    c =>
      c.type === ChannelType.GuildCategory &&
      c.name === name
  );

  if (!category) {
    category = await guild.channels.create({
      name,
      type: ChannelType.GuildCategory,
      reason: "Imperial CZ/SK setup"
    });
  }

  return category;
}

async function getOrCreateText(guild, name, category) {
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
      reason: "Imperial CZ/SK setup"
    });
  }

  return channel;
}

async function getOrCreateVoice(guild, name, category) {
  let channel = guild.channels.cache.find(
    c =>
      c.type === ChannelType.GuildVoice &&
      c.name === name &&
      c.parentId === category.id
  );

  if (!channel) {
    channel = await guild.channels.create({
      name,
      type: ChannelType.GuildVoice,
      parent: category.id,
      reason: "Imperial CZ/SK setup"
    });
  }

  return channel;
}

function denyEveryone(guild) {
  return {
    id: guild.roles.everyone.id,
    deny: [PermissionFlagsBits.ViewChannel]
  };
}

function textAccess(role) {
  return {
    id: role.id,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks
    ]
  };
}

function voiceAccess(role) {
  return {
    id: role.id,
    allow: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak
    ]
  };
}

async function setPrivateText(channel, guild, roles) {
  const overwrites = [
    denyEveryone(guild),
    {
      id: guild.ownerId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks
      ]
    }
  ];

  for (const role of roles) {
    overwrites.push(textAccess(role));
  }

  await channel.permissionOverwrites.set(overwrites);
}

async function setPrivateVoice(channel, guild, roles) {
  const overwrites = [
    denyEveryone(guild),
    {
      id: guild.ownerId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak
      ]
    }
  ];

  for (const role of roles) {
    overwrites.push(voiceAccess(role));
  }

  await channel.permissionOverwrites.set(overwrites);
}

async function setCategoryPermissions(category, guild, roles) {
  const overwrites = [
    denyEveryone(guild),
    {
      id: guild.ownerId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.Connect,
        PermissionFlagsBits.Speak
      ]
    }
  ];

  for (const role of roles) {
    overwrites.push(textAccess(role));
  }

  await category.permissionOverwrites.set(overwrites);
}

async function sendInfo(channel, title, description, color) {
  const messages = await channel.messages.fetch({ limit: 10 });

  if (
    messages.some(
      m =>
        m.author.id === client.user.id &&
        m.embeds.length > 0 &&
        m.embeds[0].title === title
    )
  ) {
    return;
  }

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setFooter({
          text: "Imperial CZ/SK • Oficiální systém"
        })
        .setTimestamp()
    ]
  });
}

/* =========================================================
   SETUP SERVERU
========================================================= */

async function setupServer(guild) {
  console.log(`🔧 Spouštím setup: ${guild.name}`);

  const member = await getOrCreateRole(
    guild,
    ROLE_NAMES.member,
    COLORS.blue
  );

  const admin = await getOrCreateRole(
    guild,
    ROLE_NAMES.admin,
    COLORS.red
  );

  const moderator = await getOrCreateRole(
    guild,
    ROLE_NAMES.moderator,
    COLORS.yellow
  );

  const management = await getOrCreateRole(
    guild,
    ROLE_NAMES.management,
    COLORS.purple
  );

  const owner = await getOrCreateRole(
    guild,
    ROLE_NAMES.owner,
    COLORS.gold
  );

  const pd = await getOrCreateRole(
    guild,
    ROLE_NAMES.pd,
    COLORS.blue
  );

  const fire = await getOrCreateRole(
    guild,
    ROLE_NAMES.fire,
    COLORS.red
  );

  const ems = await getOrCreateRole(
    guild,
    ROLE_NAMES.ems,
    COLORS.green
  );

  const civilian = await getOrCreateRole(
    guild,
    ROLE_NAMES.civilian,
    COLORS.gray
  );

  const eventRole = await getOrCreateRole(
    guild,
    ROLE_NAMES.event,
    COLORS.green
  );

  const announcementRole = await getOrCreateRole(
    guild,
    ROLE_NAMES.announcements,
    COLORS.blue
  );

  const rmRole = await getOrCreateRole(
    guild,
    ROLE_NAMES.rm,
    COLORS.purple
  );

  const at1 = await getOrCreateRole(guild, ROLE_NAMES.at1);
  const at2 = await getOrCreateRole(guild, ROLE_NAMES.at2);
  const at3 = await getOrCreateRole(guild, ROLE_NAMES.at3);
  const at5 = await getOrCreateRole(guild, ROLE_NAMES.at5);
  const at6 = await getOrCreateRole(guild, ROLE_NAMES.at6);

  /* =====================================================
     KATEGORIE
  ===================================================== */

  const info = await getOrCreateCategory(
    guild,
    "📢・INFORMACE"
  );

  const selection = await getOrCreateCategory(
    guild,
    "🎛️・VÝBĚR"
  );

  const serverCategory = await getOrCreateCategory(
    guild,
    "🗺️・SERVER"
  );

  const tickets = await getOrCreateCategory(
    guild,
    "🎫・TICKETY"
  );

  const adminCategory = await getOrCreateCategory(
    guild,
    "🛡️・ADMIN TEAM"
  );

  const adminCalls = await getOrCreateCategory(
    guild,
    "📞・ADMIN CALL"
  );

  const managementCategory = await getOrCreateCategory(
    guild,
    "👑・VEDENÍ"
  );

  const punishmentCategory = await getOrCreateCategory(
    guild,
    "⚠️・TRESTY"
  );

  const logsCategory = await getOrCreateCategory(
    guild,
    "📋・LOGY"
  );

  const pdCategory = await getOrCreateCategory(
    guild,
    "🚔・POLICIE"
  );

  const fireCategory = await getOrCreateCategory(
    guild,
    "🚒・HASIČI"
  );

  const emsCategory = await getOrCreateCategory(
    guild,
    "🚑・ZÁCHRANÁŘI"
  );

  /* =====================================================
     VEŘEJNÉ KANÁLY
  ===================================================== */

  const welcome = await getOrCreateText(
    guild,
    "👋・vítej",
    info
  );

  const rules = await getOrCreateText(
    guild,
    "📜・pravidla",
    info
  );

  const announcements = await getOrCreateText(
    guild,
    "📢・oznámení",
    info
  );

  const events = await getOrCreateText(
    guild,
    "🎉・eventy",
    info
  );

  const rmAnnouncements = await getOrCreateText(
    guild,
    "📣・rm-oznámení",
    info
  );

  /* =====================================================
     VÝBĚR
  ===================================================== */

  const notificationChannel = await getOrCreateText(
    guild,
    "🔔・výběr-oznámení",
    selection
  );

  const factionChannel = await getOrCreateText(
    guild,
    "🎖️・výběr-složky",
    selection
  );

  /* =====================================================
     SERVER
  ===================================================== */

  const mapChannel = await getOrCreateText(
    guild,
    "🗺️・mapa",
    serverCategory
  );

  const housesChannel = await getOrCreateText(
    guild,
    "🏠・domy",
    serverCategory
  );

  /* =====================================================
     TICKETY
  ===================================================== */

  const ticketChannel = await getOrCreateText(
    guild,
    "🎫・ticket",
    tickets
  );

  /* =====================================================
     ADMIN
  ===================================================== */

  const adminChat = await getOrCreateText(
    guild,
    "💬・admin-chat",
    adminCategory
  );

  const adminRules = await getOrCreateText(
    guild,
    "📜・admin-pravidla",
    adminCategory
  );

  const adminLog = await getOrCreateText(
    guild,
    "📋・admin-log",
    adminCategory
  );

  /* =====================================================
     VEDENÍ
  ===================================================== */

  const managementChat = await getOrCreateText(
    guild,
    "👑・vedení-chat",
    managementCategory
  );

  const managementPlans = await getOrCreateText(
    guild,
    "📋・vedení-plány",
    managementCategory
  );

  const managementCall = await getOrCreateVoice(
    guild,
    "🔊・vedení-call",
    managementCategory
  );

  /* =====================================================
     TRESTY
  ===================================================== */

  const punishmentInfo = await getOrCreateText(
    guild,
    "⚠️・zápis-trestů",
    punishmentCategory
  );

  const warnChannel = await getOrCreateText(
    guild,
    "⚠️・warn",
    punishmentCategory
  );

  const banChannel = await getOrCreateText(
    guild,
    "🔨・ban",
    punishmentCategory
  );

  /* =====================================================
     LOGY
  ===================================================== */

  const warnLog = await getOrCreateText(
    guild,
    "⚠️・warn-log",
    logsCategory
  );

  const banLog = await getOrCreateText(
    guild,
    "🔨・ban-log",
    logsCategory
  );

  /* =====================================================
     IZS
  ===================================================== */

  const pdChat = await getOrCreateText(
    guild,
    "🚔・pd-chat",
    pdCategory
  );

  const pdCall = await getOrCreateVoice(
    guild,
    "🔊・pd-call",
    pdCategory
  );

  const fireChat = await getOrCreateText(
    guild,
    "🚒・hasici-chat",
    fireCategory
  );

  const fireCall = await getOrCreateVoice(
    guild,
    "🔊・hasici-call",
    fireCategory
  );

  const emsChat = await getOrCreateText(
    guild,
    "🚑・zachranari-chat",
    emsCategory
  );

  const emsCall = await getOrCreateVoice(
    guild,
    "🔊・zachranari-call",
    emsCategory
  );

  /* =====================================================
     ZABEZPEČENÍ ADMIN
  ===================================================== */

  const adminRoles = [
    admin,
    moderator,
    management,
    owner
  ];

  await setCategoryPermissions(
    adminCategory,
    guild,
    adminRoles
  );

  await setCategoryPermissions(
    adminCalls,
    guild,
    adminRoles
  );

  /* =====================================================
     VEDENÍ POUZE VEDENÍ + MAJITEL
  ===================================================== */

  const managementRoles = [
    management,
    owner
  ];

  await setCategoryPermissions(
    managementCategory,
    guild,
    managementRoles
  );

  await setPrivateVoice(
    managementCall,
    guild,
    managementRoles
  );

  /* =====================================================
     TRESTY
  ===================================================== */

  await setCategoryPermissions(
    punishmentCategory,
    guild,
    adminRoles
  );

  await setCategoryPermissions(
    logsCategory,
    guild,
    adminRoles
  );

  /* =====================================================
     AT CALLY
  ===================================================== */

  const atChannels = [
    ["🔊・AT1", at1],
    ["🔊・AT2", at2],
    ["🔊・AT3", at3],
    ["🔊・AT5", at5],
    ["🔊・AT6", at6]
  ];

  for (const [name, role] of atChannels) {
    const channel = await getOrCreateVoice(
      guild,
      name,
      adminCalls
    );

    await setPrivateVoice(
      channel,
      guild,
      [
        role,
        admin,
        moderator,
        management,
        owner
      ]
    );
  }

  /* =====================================================
     PD
  ===================================================== */

  await setCategoryPermissions(
    pdCategory,
    guild,
    [
      pd,
      admin,
      moderator,
      management,
      owner
    ]
  );

  await setPrivateText(
    pdChat,
    guild,
    [
      pd,
      admin,
      moderator,
      management,
      owner
    ]
  );

  await setPrivateVoice(
    pdCall,
    guild,
    [
      pd,
      admin,
      moderator,
      management,
      owner
    ]
  );

  /* =====================================================
     HASIČI
  ===================================================== */

  await setCategoryPermissions(
    fireCategory,
    guild,
    [
      fire,
      admin,
      moderator,
      management,
      owner
    ]
  );

  await setPrivateText(
    fireChat,
    guild,
    [
      fire,
      admin,
      moderator,
      management,
      owner
    ]
  );

  await setPrivateVoice(
    fireCall,
    guild,
    [
      fire,
      admin,
      moderator,
      management,
      owner
    ]
  );

  /* =====================================================
     ZÁCHRANÁŘI
  ===================================================== */

  await setCategoryPermissions(
    emsCategory,
    guild,
    [
      ems,
      admin,
      moderator,
      management,
      owner
    ]
  );

  await setPrivateText(
    emsChat,
    guild,
    [
      ems,
      admin,
      moderator,
      management,
      owner
    ]
  );

  await setPrivateVoice(
    emsCall,
    guild,
    [
      ems,
      admin,
      moderator,
      management,
      owner
    ]
  );

  /* =====================================================
     INFO TEXTY
  ===================================================== */

  await sendInfo(
    welcome,
    "👋 VÍTEJ V IMPERIAL CZ/SK",
    TEXTS.welcome,
    COLORS.blue
  );

  await sendInfo(
    rules,
    "📜 PRAVIDLA SERVERU",
    TEXTS.rules,
    COLORS.red
  );

  await sendInfo(
    notificationChannel,
    "🔔 VÝBĚR OZNÁMENÍ",
    TEXTS.notifications,
    COLORS.blue
  );

  await sendInfo(
    factionChannel,
    "🎖️ VÝBĚR SLOŽKY",
    TEXTS.factions,
    COLORS.purple
  );

  await sendInfo(
    mapChannel,
    "🗺️ MAPA",
    TEXTS.map,
    COLORS.green
  );

  await sendInfo(
    housesChannel,
    "🏠 DOMY",
    TEXTS.houses,
    COLORS.gold
  );

  await sendInfo(
    adminRules,
    "🛡️ ADMIN TEAM",
    TEXTS.admin,
    COLORS.red
  );

  await sendInfo(
    managementChat,
    "👑 VEDENÍ",
    TEXTS.management,
    COLORS.gold
  );

  await sendInfo(
    punishmentInfo,
    "⚠️ SYSTÉM TRESTŮ",
    TEXTS.punishments,
    COLORS.red
  );

  await sendInfo(
    ticketChannel,
    "🎫 TICKET SYSTÉM",
    TEXTS.tickets,
    COLORS.purple
  );

  /* =====================================================
     OZNÁMENÍ MENU
  ===================================================== */

  const notificationMessages =
    await notificationChannel.messages.fetch({
      limit: 20
    });

  const notificationExists =
    notificationMessages.some(
      m =>
        m.author.id === client.user.id &&
        m.components.length > 0 &&
        m.components[0].components.some(
          c => c.customId === "notification_select"
        )
    );

  if (!notificationExists) {
    const menu =
      new StringSelectMenuBuilder()
        .setCustomId("notification_select")
        .setPlaceholder("🔔 Vyber oznámení")
        .setMinValues(1)
        .setMaxValues(3)
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Eventy")
            .setDescription(
              "Chci dostávat oznámení o eventech"
            )
            .setValue("event")
            .setEmoji("🎉"),

          new StringSelectMenuOptionBuilder()
            .setLabel("Oznámení")
            .setDescription(
              "Chci dostávat důležitá oznámení"
            )
            .setValue("announcement")
            .setEmoji("📢"),

          new StringSelectMenuOptionBuilder()
            .setLabel("RM Oznámení")
            .setDescription(
              "Chci dostávat RM oznámení"
            )
            .setValue("rm")
            .setEmoji("📣")
        );

    await notificationChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔔 NASTAVENÍ OZNÁMENÍ")
          .setDescription(
            "Vyber si jedno nebo více oznámení, která chceš dostávat."
          )
          .setColor(COLORS.blue)
          .setFooter({
            text: "Imperial CZ/SK • Nastavení oznámení"
          })
      ],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  /* =====================================================
     SLOŽKY MENU
  ===================================================== */

  const factionMessages =
    await factionChannel.messages.fetch({
      limit: 20
    });

  const factionExists =
    factionMessages.some(
      m =>
        m.author.id === client.user.id &&
        m.components.length > 0 &&
        m.components[0].components.some(
          c => c.customId === "faction_select"
        )
    );

  if (!factionExists) {
    const menu =
      new StringSelectMenuBuilder()
        .setCustomId("faction_select")
        .setPlaceholder("🎖️ Vyber jednu hlavní složku")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Policie")
            .setDescription(
              "Přístup do sekce Policie"
            )
            .setValue("pd")
            .setEmoji("🚔"),

          new StringSelectMenuOptionBuilder()
            .setLabel("Hasiči")
            .setDescription(
              "Přístup do sekce Hasičů"
            )
            .setValue("fire")
            .setEmoji("🚒"),

          new StringSelectMenuOptionBuilder()
            .setLabel("Záchranáři")
            .setDescription(
              "Přístup do sekce Záchranářů"
            )
            .setValue("ems")
            .setEmoji("🚑"),

          new StringSelectMenuOptionBuilder()
            .setLabel("Civilista")
            .setDescription(
              "Běžný civilista"
            )
            .setValue("civilian")
            .setEmoji("👤")
        );

    await factionChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎖️ VYBER SI SVOU SLOŽKU")
          .setDescription(
            "Vyber si přesně jednu hlavní složku. " +
            "Při nové volbě bot automaticky odebere předchozí."
          )
          .setColor(COLORS.purple)
          .setFooter({
            text: "Imperial CZ/SK • Výběr složky"
          })
      ],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  /* =====================================================
     TICKET MENU
  ===================================================== */

  const ticketMessages =
    await ticketChannel.messages.fetch({
      limit: 20
    });

  const ticketExists =
    ticketMessages.some(
      m =>
        m.author.id === client.user.id &&
        m.components.length > 0 &&
        m.components[0].components.some(
          c => c.customId === "ticket_select"
        )
    );

  if (!ticketExists) {
    const menu =
      new StringSelectMenuBuilder()
        .setCustomId("ticket_select")
        .setPlaceholder("🎫 Vyber typ ticketu")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Stížnost na admina")
            .setDescription(
              "Stížnost na člena administrace"
            )
            .setValue("admin_complaint")
            .setEmoji("🛡️"),

          new StringSelectMenuOptionBuilder()
            .setLabel("Stížnost na hráče")
            .setDescription(
              "Nahlášení hráče"
            )
            .setValue("player_complaint")
            .setEmoji("👤"),

          new StringSelectMenuOptionBuilder()
            .setLabel("Mafie")
            .setDescription(
              "Obecná záležitost týkající se mafie"
            )
            .setValue("mafia")
            .setEmoji("🔫"),

          new StringSelectMenuOptionBuilder()
            .setLabel("Mafie 1")
            .setDescription("Záležitost Mafie 1")
            .setValue("mafia1")
            .setEmoji("1️⃣"),

          new StringSelectMenuOptionBuilder()
            .setLabel("Mafie 2")
            .setDescription("Záležitost Mafie 2")
            .setValue("mafia2")
            .setEmoji("2️⃣"),

          new StringSelectMenuOptionBuilder()
            .setLabel("Mafie 3")
            .setDescription("Záležitost Mafie 3")
            .setValue("mafia3")
            .setEmoji("3️⃣"),

          new StringSelectMenuOptionBuilder()
            .setLabel("Žádost o unban")
            .setDescription(
              "Žádost o zrušení nebo zkrácení banu"
            )
            .setValue("unban")
            .setEmoji("🔓")
        );

    await ticketChannel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎫 TICKET CENTRUM")
          .setDescription(
            "Potřebuješ pomoc administrace? Vyber níže typ ticketu a postupuj podle instrukcí."
          )
          .setColor(COLORS.purple)
          .setFooter({
            text: "Imperial CZ/SK • Ticket systém"
          })
      ],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  /* =====================================================
     ADMIN INFO
  ===================================================== */

  await sendInfo(
    adminChat,
    "🛡️ ADMIN TEAM",
    TEXTS.admin,
    COLORS.red
  );

  await sendInfo(
    managementPlans,
    "📋 PLÁNOVÁNÍ VEDENÍ",
    TEXTS.management,
    COLORS.gold
  );

  console.log(
    `✅ SETUP DOKONČEN: ${guild.name}`
  );
}

/* =========================================================
   SLASH COMMANDS
========================================================= */

client.once("ready", async () => {
  console.log(
    `✅ Bot online: ${client.user.tag}`
  );

  try {
    for (const guild of client.guilds.cache.values()) {

      const commands = [
        new SlashCommandBuilder()
          .setName("setup")
          .setDescription(
            "Vytvoří nebo opraví kompletní Imperial CZ/SK server."
          ),

        new SlashCommandBuilder()
          .setName("warn")
          .setDescription(
            "Udělí hráči WARN a zapíše ho do logu."
          )
          .addStringOption(option =>
            option
              .setName("roblox")
              .setDescription(
                "Roblox jméno hráče"
              )
              .setRequired(true)
          )
          .addStringOption(option =>
            option
              .setName("duvod")
              .setDescription(
                "Důvod WARNu"
              )
              .setRequired(true)
          ),

        new SlashCommandBuilder()
          .setName("ban")
          .setDescription(
            "Zapíše BAN hráči."
          )
          .addStringOption(option =>
            option
              .setName("roblox")
              .setDescription(
                "Roblox jméno hráče"
              )
              .setRequired(true)
          )
          .addIntegerOption(option =>
            option
              .setName("dny")
              .setDescription(
                "Počet dní banu"
              )
              .setRequired(true)
              .setMinValue(1)
          )
          .addStringOption(option =>
            option
              .setName("duvod")
              .setDescription(
                "Důvod BANu"
              )
              .setRequired(true)
          )
      ];

      const rest =
        new REST({ version: "10" })
          .setToken(TOKEN);

      await rest.put(
        Routes.applicationGuildCommands(
          client.user.id,
          guild.id
        ),
        {
          body: commands.map(
            command => command.toJSON()
          )
        }
      );

      console.log(
        `✅ Příkazy registrovány: ${guild.name}`
      );
    }
  } catch (error) {
    console.error(
      "❌ Chyba registrace příkazů:"
    );
    console.error(error);
  }
});

/* =========================================================
   INTERACTIONS
========================================================= */

client.on(
  "interactionCreate",
  async interaction => {

    try {

      /* ===================================================
         SETUP
      =================================================== */

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "setup"
      ) {

        if (
          interaction.guild.ownerId !==
          interaction.user.id
        ) {
          return interaction.reply({
            content:
              "❌ Tento příkaz může použít pouze majitel serveru.",
            ephemeral: true
          });
        }

        await interaction.deferReply({
          ephemeral: true
        });

        await setupServer(
          interaction.guild
        );

        return interaction.editReply(
          "✅ Imperial CZ/SK server byl vytvořen a zabezpečen."
        );
      }

      /* ===================================================
         WARN
      =================================================== */

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "warn"
      ) {

        const member =
          interaction.member;

        const allowed =
          member.roles.cache.some(
            role =>
              [
                ROLE_NAMES.admin,
                ROLE_NAMES.moderator,
                ROLE_NAMES.management,
                ROLE_NAMES.owner
              ].includes(role.name)
          );

        if (!allowed) {
          return interaction.reply({
            content:
              "❌ Tento příkaz mohou používat pouze oprávnění členové administrace.",
            ephemeral: true
          });
        }

        const roblox =
          interaction.options.getString(
            "roblox"
          );

        const reason =
          interaction.options.getString(
            "duvod"
          );

        const warnLog =
          interaction.guild.channels.cache.find(
            c =>
              c.name === "⚠️・warn-log" &&
              c.type === ChannelType.GuildText
          );

        const warnEmbed =
          new EmbedBuilder()
            .setTitle("⚠️ NOVÝ WARN")
            .addFields(
              {
                name: "👤 Roblox hráč",
                value: roblox,
                inline: true
              },
              {
                name: "🛡️ Udělil",
                value: interaction.user.tag,
                inline: true
              },
              {
                name: "📄 Důvod",
                value: reason
              }
            )
            .setColor(COLORS.yellow)
            .setTimestamp()
            .setFooter({
              text: "Imperial CZ/SK • Trestní systém"
            });

        if (warnLog) {
          await warnLog.send({
            embeds: [warnEmbed]
          });
        }

        return interaction.reply({
          content:
            `⚠️ WARN pro **${roblox}** byl zapsán do systému.`,
          ephemeral: true
        });
      }

      /* ===================================================
         BAN
      =================================================== */

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "ban"
      ) {

        const member =
          interaction.member;

        const allowed =
          member.roles.cache.some(
            role =>
              [
                ROLE_NAMES.admin,
                ROLE_NAMES.moderator,
                ROLE_NAMES.management,
                ROLE_NAMES.owner
              ].includes(role.name)
          );

        if (!allowed) {
          return interaction.reply({
            content:
              "❌ Tento příkaz mohou používat pouze oprávnění členové administrace.",
            ephemeral: true
          });
        }

        const roblox =
          interaction.options.getString(
            "roblox"
          );

        const days =
          interaction.options.getInteger(
            "dny"
          );

        const reason =
          interaction.options.getString(
            "duvod"
          );

        const banLog =
          interaction.guild.channels.cache.find(
            c =>
              c.name === "🔨・ban-log" &&
              c.type === ChannelType.GuildText
          );

        const banEmbed =
          new EmbedBuilder()
            .setTitle("🔨 NOVÝ BAN")
            .addFields(
              {
                name: "👤 Roblox hráč",
                value: roblox,
                inline: true
              },
              {
                name: "🛡️ Udělil",
                value: interaction.user.tag,
                inline: true
              },
              {
                name: "⏱️ Délka",
                value: `${days} dní`,
                inline: true
              },
              {
                name: "📄 Důvod",
                value: reason
              }
            )
            .setColor(COLORS.red)
            .setTimestamp()
            .setFooter({
              text: "Imperial CZ/SK • Trestní systém"
            });

        if (banLog) {
          await banLog.send({
            embeds: [banEmbed]
          });
        }

        return interaction.reply({
          content:
            `🔨 BAN pro **${roblox}** na **${days} dní** byl zapsán do systému.`,
          ephemeral: true
        });
      }

      /* ===================================================
         OZNÁMENÍ
      =================================================== */

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId ===
          "notification_select"
      ) {

        const map = {
          event: ROLE_NAMES.event,
          announcement:
            ROLE_NAMES.announcements,
          rm: ROLE_NAMES.rm
        };

        for (
          const roleName of
          Object.values(map)
        ) {

          const role =
            interaction.guild.roles.cache.find(
              r => r.name === roleName
            );

          if (
            role &&
            interaction.member.roles.cache.has(
              role.id
            )
          ) {
            await interaction.member.roles
              .remove(role)
              .catch(() => {});
          }
        }

        for (
          const value of
          interaction.values
        ) {

          const role =
            interaction.guild.roles.cache.find(
              r =>
                r.name === map[value]
            );

          if (role) {
            await interaction.member.roles
              .add(role)
              .catch(() => {});
          }
        }

        return interaction.reply({
          content:
            "✅ Tvé nastavení oznámení bylo uloženo.",
          ephemeral: true
        });
      }

      /* ===================================================
         SLOŽKA
      =================================================== */

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId ===
          "faction_select"
      ) {

        const factionMap = {
          pd: ROLE_NAMES.pd,
          fire: ROLE_NAMES.fire,
          ems: ROLE_NAMES.ems,
          civilian:
            ROLE_NAMES.civilian
        };

        for (
          const roleName of
          Object.values(factionMap)
        ) {

          const role =
            interaction.guild.roles.cache.find(
              r => r.name === roleName
            );

          if (
            role &&
            interaction.member.roles.cache.has(
              role.id
            )
          ) {
            await interaction.member.roles
              .remove(role)
              .catch(() => {});
          }
        }

        const selected =
          factionMap[
            interaction.values[0]
          ];

        const selectedRole =
          interaction.guild.roles.cache.find(
            r => r.name === selected
          );

        const memberRole =
          interaction.guild.roles.cache.find(
            r =>
              r.name === ROLE_NAMES.member
          );

        if (selectedRole) {
          await interaction.member.roles
            .add(selectedRole)
            .catch(() => {});
        }

        if (memberRole) {
          await interaction.member.roles
            .add(memberRole)
            .catch(() => {});
        }

        return interaction.reply({
          content:
            `✅ Vybral/a sis **${selectedRole ? selectedRole.name : "Civilista"}**.\n` +
            "Dostal/a jsi také roli **Člen**.",
          ephemeral: true
        });
      }

      /* ===================================================
         TICKET
      =================================================== */

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId ===
          "ticket_select"
      ) {

        const names = {
          admin_complaint:
            "stížnost-admin",
          player_complaint:
            "stížnost-hráč",
          mafia:
            "mafie",
          mafia1:
            "mafie-1",
          mafia2:
            "mafie-2",
          mafia3:
            "mafie-3",
          unban:
            "žádost-unban"
        };

        const selected =
          interaction.values[0];

        const ticketName =
          `${names[selected] || "ticket"}-${interaction.user.username}`
            .toLowerCase()
            .replace(/[^a-z0-9\-]/g, "")
            .slice(0, 80);

        const existing =
          interaction.guild.channels.cache.find(
            c => c.name === ticketName
          );

        if (existing) {
          return interaction.reply({
            content:
              `🎫 Už máš otevřený ticket: <#${existing.id}>`,
            ephemeral: true
          });
        }

        const ticketCategory =
          interaction.guild.channels.cache.find(
            c =>
              c.type ===
                ChannelType.GuildCategory &&
              c.name === "🎫・TICKETY"
          );

        const adminRoles =
          interaction.guild.roles.cache.filter(
            role =>
              [
                ROLE_NAMES.admin,
                ROLE_NAMES.moderator,
                ROLE_NAMES.management,
                ROLE_NAMES.owner
              ].includes(role.name)
          );

        const overwrites = [
          {
            id:
              interaction.guild.roles
                .everyone.id,
            deny: [
              PermissionFlagsBits.ViewChannel
            ]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          },
          {
            id: interaction.guild.ownerId,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          }
        ];

        for (
          const role of adminRoles.values()
        ) {
          overwrites.push({
            id: role.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          });
        }

        const ticket =
          await interaction.guild.channels.create(
            {
              name: ticketName,
              type: ChannelType.GuildText,
              parent:
                ticketCategory?.id || null,
              permissionOverwrites:
                overwrites,
              reason:
                "Imperial CZ/SK ticket"
            }
          );

        await ticket.send({
          content:
            `<@${interaction.user.id}>`,
          embeds: [
            new EmbedBuilder()
              .setTitle(
                "🎫 NOVÝ TICKET"
              )
              .setDescription(
                `**Typ:** ${selected}\n\n` +
                "Popiš zde svůj problém co nejpodrobněji. " +
                "Uveď Roblox jméno, čas události, co se stalo, " +
                "a pokud máš důkazy, přilož je. " +
                "Administrace se ti bude věnovat co nejdříve."
              )
              .setColor(COLORS.purple)
              .setTimestamp()
          ]
        });

        return interaction.reply({
          content:
            `✅ Ticket byl vytvořen: <#${ticket.id}>`,
          ephemeral: true
        });
      }

    } catch (error) {

      console.error(
        "❌ Interaction error:"
      );

      console.error(error);

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {

        await interaction.reply({
          content:
            "❌ Nastala chyba při zpracování požadavku.",
          ephemeral: true
        }).catch(() => {});

      }
    }
  }
);

/* =========================================================
   LOGIN
========================================================= */

client.login(TOKEN);

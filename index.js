const {
  Client, GatewayIntentBits, PermissionFlagsBits, ChannelType, SlashCommandBuilder,
  REST, Routes, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder, Events
} = require("discord.js");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) { console.error("Missing DISCORD_TOKEN Railway variable."); process.exit(1); }

const client = new Client({ intents: [
  GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent
]});

const DATA_FILE = path.join(__dirname, "imperial-data.json");
const blank = () => ({ shifts:{}, warnings:{}, tickets:{}, applications:{}, ticketCounter:0 });
let data = blank();
try { if (fs.existsSync(DATA_FILE)) data = {...blank(), ...JSON.parse(fs.readFileSync(DATA_FILE,"utf8"))}; }
catch (e) { console.error("Data load:", e.message); }
function save() {
  try { const tmp=DATA_FILE+".tmp"; fs.writeFileSync(tmp,JSON.stringify(data,null,2)); fs.renameSync(tmp,DATA_FILE); }
  catch(e) { console.error("Data save:",e.message); }
}

const ROLE_DEFS = [
 ["Owner",0xff3333,true],["Vedení",0x8e44ad,true],["Head Admin",0xe74c3c,true],
 ["TR. Admin",0xc0392b,true],["ZK. Admin",0xd35400,true],["JR. Admin",0xf39c12,true],
 ["ADV. JR. Admin",0xf1c40f,true],["Media Admin",0x3498db,false],["Event Admin",0x9b59b6,false],
 ["Moderátor",0x2ecc71,false],["Support",0x1abc9c,false],["Police",0x2980b9,false],
 ["EMS",0xe91e63,false],["Fire",0xe67e22,false],["ADAC",0xf1c40f,false],
 ["Vláda",0x34495e,false],["Verified",0x95a5a6,false],["Občan",0x7f8c8d,false]
];
const STAFF=["Owner","Vedení","Head Admin","TR. Admin","ZK. Admin","JR. Admin","ADV. JR. Admin","Media Admin","Event Admin","Moderátor","Support"];
const SENIOR=["Owner","Vedení","Head Admin"];
const ADMIN=["Owner","Vedení","Head Admin","TR. Admin","ZK. Admin","JR. Admin","ADV. JR. Admin"];
const MODS=["Owner","Vedení","Head Admin","TR. Admin","ZK. Admin","JR. Admin","Moderátor"];

const TYPES={
 support:{label:"🆘 Podpora",slug:"podpora",color:0x3498db,desc:"Obecná pomoc a dotazy."},
 report:{label:"🚨 Report hráče",slug:"report",color:0xe74c3c,desc:"Nahlášení hráče; přilož důkazy."},
 complaint:{label:"⚠️ Stížnost na staff",slug:"stiznost-staff",color:0xf1c40f,desc:"Důvěrná stížnost na člena týmu."},
 technical:{label:"🔧 Technický problém",slug:"technicky-problem",color:0x2ecc71,desc:"Problém s Discordem, botem nebo hrou."},
 adminapp:{label:"📝 Admin přihláška",slug:"admin-prihlaska",color:0x9b59b6,desc:"Přihláška do administračního týmu."},
 faction:{label:"👮 Frakce",slug:"frakce",color:0x2980b9,desc:"Police, EMS, hasiči, ADAC nebo vláda."},
 economy:{label:"💰 Majetek / ekonomika",slug:"ekonomika",color:0xf39c12,desc:"Majetek, firmy, peníze a pozemky."},
 court:{label:"⚖️ Soud / právní RP",slug:"soud",color:0x7f8c8d,desc:"Soudní a právní RP."},
 event:{label:"🎉 Event",slug:"event",color:0xe67e22,desc:"Návrhy a problémy s eventy."},
 media:{label:"🎥 Media Team",slug:"media",color:0x1abc9c,desc:"Video, reklama, média a spolupráce."}
};

const DISCORD_RULES=[
 ["01 • Respekt","Chovej se slušně. Zakázané jsou urážky, šikana, výhrůžky, diskriminace a cílené obtěžování."],
 ["02 • Spam a reklama","Nespamuj a neposílej reklamu bez povolení vedení."],
 ["03 • Soukromí","Nezveřejňuj osobní údaje ani soukromé zprávy bez souhlasu. Nikdy neposílej hesla nebo tokeny."],
 ["04 • Hlasové kanály","Nekřič, nepouštěj rušivé zvuky a respektuj ostatní."],
 ["05 • Staff","Respektuj pokyny staffu. Pokud nesouhlasíš, podej ticket místo veřejné hádky."],
 ["06 • Tickety","Nevytvářej falešné nebo duplicitní tickety. Reporty podkládej důkazy."],
 ["07 • Bezpečnost","Zakázané jsou podvody, phishing, škodlivé soubory a krádeže účtů."],
 ["08 • Obsah","Neposílej pornografický, extrémně násilný nebo jinak nevhodný obsah."],
 ["09 • Tresty","Neobcházej ban ani timeout alternativním účtem."],
 ["10 • Odvolání","O trestu se slušně odvolej přes ticket. Rozhodnutí se přezkoumá podle dostupných důkazů."]
];
const RP_RULES=[
 ["01 • IC a OOC","Odděluj dění ve hře (IC) od komunikace mimo hru (OOC)."],
 ["02 • Metagaming","Nepoužívej informace získané mimo RP k získání výhody ve hře."],
 ["03 • Powergaming","Nevynucuj nereálné akce a nech ostatním možnost reagovat."],
 ["04 • Fear RP","Ber vážně ohrožení života a reaguj přiměřeně situaci."],
 ["05 • RDM / VDM","Neútoč ani nikoho nepřejížděj bez platného RP důvodu."],
 ["06 • Fail RP","Jednej realisticky a neporušuj logiku situace jen kvůli výhodě."],
 ["07 • Combat logging","Neodcházej ze hry, abys unikl zatčení nebo následkům RP."],
 ["08 • Frakce","Nevydávej se za státní složku bez oprávnění a nezneužívej její pravomoci."],
 ["09 • Bugy a exploity","Nezneužívej chyby hry; nahlas je staffu přes ticket."],
 ["10 • Spory","Spory řeš klidně přes report ticket a přilož důkazy."]
];

function em(title,desc,color=0x5865f2){return new EmbedBuilder().setColor(color).setTitle(title).setDescription(desc).setTimestamp().setFooter({text:"IMPERIAL RP • OFFICIAL SYSTEM"});}
function role(g,n){return g.roles.cache.find(r=>r.name===n);}
function chan(g,n){return g.channels.cache.find(c=>c.name===n);}
function staff(m){return !!m&&(m.permissions.has(PermissionFlagsBits.Administrator)||STAFF.some(n=>m.roles.cache.some(r=>r.name===n)));}
function senior(m){return !!m&&(m.permissions.has(PermissionFlagsBits.Administrator)||SENIOR.some(n=>m.roles.cache.some(r=>r.name===n)));}
function admin(m){return !!m&&(m.permissions.has(PermissionFlagsBits.Administrator)||ADMIN.some(n=>m.roles.cache.some(r=>r.name===n)));}
function moderator(m){return !!m&&(m.permissions.has(PermissionFlagsBits.Administrator)||MODS.some(n=>m.roles.cache.some(r=>r.name===n)));}
async function ensureRole(g,d){if(!role(g,d[0])) await g.roles.create({name:d[0],color:d[1],hoist:d[2],reason:"Imperial RP setup"});}
async function category(g,name,overwrites){
 let c=g.channels.cache.find(x=>x.type===ChannelType.GuildCategory&&x.name===name);
 if(!c)c=await g.channels.create({name,type:ChannelType.GuildCategory,permissionOverwrites:overwrites});
 else if(overwrites)await c.permissionOverwrites.set(overwrites).catch(()=>{});
 return c;
}
async function textChannel(g,name,parent,overwrites){
 let c=g.channels.cache.find(x=>x.type===ChannelType.GuildText&&x.name===name&&x.parentId===parent.id);
 if(!c)c=await g.channels.create({name,type:ChannelType.GuildText,parent:parent.id,permissionOverwrites:overwrites});
 return c;
}
async function voiceChannel(g,name,parent){
 let c=g.channels.cache.find(x=>x.type===ChannelType.GuildVoice&&x.name===name&&x.parentId===parent.id);
 if(!c)c=await g.channels.create({name,type:ChannelType.GuildVoice,parent:parent.id}); return c;
}
function privateOW(g,names){
 const ow=[{id:g.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]}];
 for(const n of names){const r=role(g,n);if(r)ow.push({id:r.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]});}
 return ow;
}
function ticketPanelRows(){
 const b=Object.entries(TYPES).map(([id,t])=>new ButtonBuilder().setCustomId(`ticket:create:${id}`).setLabel(t.label).setStyle(["report","complaint"].includes(id)?ButtonStyle.Danger:ButtonStyle.Primary));
 return [new ActionRowBuilder().addComponents(b.slice(0,5)),new ActionRowBuilder().addComponents(b.slice(5,10))];
}
function ticketControls(){return[
 new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("ticket:claim").setLabel("👤 Převzít").setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId("ticket:staff").setLabel("👥 Předat staffu").setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId("ticket:lead").setLabel("👑 Předat vedení").setStyle(ButtonStyle.Danger)),
 new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("ticket:transcript").setLabel("📄 Transcript").setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId("ticket:close").setLabel("🔒 Zavřít ticket").setStyle(ButtonStyle.Danger))
];}
function logChannel(g){return chan(g,"🎫・ticket-log")||chan(g,"⚙️・server-log");}
async function log(g,title,desc,color=0x5865f2,buffer,filename){
 const c=logChannel(g);if(!c)return;
 const p={embeds:[em(title,desc,color)]};
 if(buffer)p.files=[new AttachmentBuilder(buffer,{name:filename||"transcript.txt"})];
 await c.send(p).catch(e=>console.error("Log:",e.message));
}
async function transcript(c){
 let all=[],before;
 for(let i=0;i<10;i++){
  const batch=await c.messages.fetch({limit:100,before}).catch(()=>null);
  if(!batch?.size)break;all.push(...batch.values());if(batch.size<100)break;before=batch.last().id;
 }
 all.sort((a,b)=>a.createdTimestamp-b.createdTimestamp);
 const lines=["IMPERIAL RP — TICKET TRANSCRIPT",`Kanál: ${c.name} | ID: ${c.id}`,`Vytvořeno: ${new Date().toLocaleString("cs-CZ")}`,"Přílohy jsou uvedeny jako odkazy.","================================================",""];
 for(const m of all){
  const body=(m.content||"[zpráva bez textu]").replace(/\r?\n/g," ");
  const files=[...m.attachments.values()].map(a=>a.url).join(" ");
  lines.push(`[${new Date(m.createdTimestamp).toLocaleString("cs-CZ")}] ${m.author?.tag||"Unknown"} (${m.author?.id||"?"}): ${body}${files?` | Přílohy: ${files}`:""}`);
 }
 return Buffer.from(lines.join("\n"),"utf8");
}
function shift(id){data.shifts[id] ||= {total:0,count:0,active:null};return data.shifts[id];}
function duration(ms){const m=Math.floor(ms/60000);return `${Math.floor(m/60)} h ${m%60} min`;}
function openTicket(g,id){return g.channels.cache.find(c=>c.type===ChannelType.GuildText&&data.tickets[c.id]?.owner===id&&!data.tickets[c.id]?.closed);}
async function postOnce(c,title,description,color,components=[]){
 const msgs=await c.messages.fetch({limit:50}).catch(()=>null);
 if(msgs?.some(m=>m.author.id===client.user.id&&m.embeds.some(e=>e.title===title)))return;
 await c.send({embeds:[em(title,description,color)],components});
}

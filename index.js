const { Client, Intents, MessageActionRow, MessageButton } = require('discord.js');
const mongoose = require('mongoose');

// توصيل قاعدة البيانات MongoDB
mongoose.connect('mongodb://rfrfth:thmanangerfrf@cluster0-shard-00-00.8mvvl.mongodb.net:27017,cluster0-shard-00-01.8mvvl.mongodb.net:27017,cluster0-shard-00-02.8mvvl.mongodb.net:27017/Majnuntest?replicaSet=atlas-2bqsim-shard-0&ssl=true&authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('Error connecting to MongoDatabase : ', error);
});

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

const userPointsSchema = new mongoose.Schema({
  discordId: String,
  points: Number,
});

const UserPoints = mongoose.model('UserPoints', userPointsSchema);

const usedButtons = new Set();

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'change_ticket_name') {
    if (usedButtons.has(interaction.user.id)) {
      await interaction.reply(`**لقد استلمت التذكرة بالفعل!**`);
    } else {
      const member = interaction.member;
      if (member) {
        const username = member.user.username;
        const mainChannelName = interaction.channel.name;
        const mainChannelNumber = mainChannelName.match(/\d+/);

        if (mainChannelNumber) {
          const newTicketName = `${member.user.username}-${mainChannelNumber}`;
          await interaction.channel.setName(newTicketName);
          await interaction.reply(`**تم استلام الـتـكـت من طرف ${interaction.user.toString()}**`);
          usedButtons.add(interaction.user.id); // تم وضع علامة على الزر كمستخدم مستخدم
          
          // إضافة نقاط واحدة للمستخدم إلى قاعدة البيانات
          const pointsToAdd = 1;
          const existingUserPoints = await UserPoints.findOne({ discordId: member.id });

          if (existingUserPoints) {
            existingUserPoints.points += pointsToAdd;
            await existingUserPoints.save();
          } else {
            const newUserPoints = new UserPoints({
              discordId: member.id,
              points: pointsToAdd,
            });
            await newUserPoints.save();
          }

          // عرض عدد النقاط للمستخدم
          const updatedUserPoints = await UserPoints.findOne({ discordId: member.id });
          await interaction.followUp(`**لديك الآن ${updatedUserPoints.points} نقاط.**`);
        }
      }
    }
  }
});

client.on('channelCreate', async (channel) => {
  if (channel.name.startsWith('ticket-')) {
    setTimeout(async () => {
      const row = new MessageActionRow().addComponents(
        new MessageButton()
          .setCustomId('change_ticket_name')
          .setLabel('اسـتـلام الـتـذكـرة')
          .setStyle('SUCCESS') 
      );

      await channel.send({ components: [row] });
    }, 600);
  }
});


client.login("MTEzMjcxMjI2MDg3NjM3ODIzMg.GEk7tP.zlV9TXps3ytykejOrjUjMo_JzeLQGJAhpxJnjk").catch((err) => {
  console.log(err.message);
});

const express = require('express');
const mongoose = require('mongoose');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const posts = require('./routes/posts');
const adminRoutes = require('./routes/admin');
const app = express();
const port = process.env.PORT || 3001;
require('dotenv').config();

app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// 방문자 수 카운팅
const db = new sqlite3.Database('./visitorCount.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE,
      count INTEGER
    )
  `);
});


app.get('/api/visit', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  db.serialize(() => {
    db.run(
      `
      INSERT INTO visitors (date, count)
      VALUES (?, 1)
      ON CONFLICT(date) DO UPDATE SET count = count + 1
    `,
      [today]
    );

    db.get(
      'SELECT SUM(count) as totalVisitors FROM visitors',
      (err, rowTotal) => {
        db.get(
          'SELECT count FROM visitors WHERE date = ?',
          [today],
          (err, rowToday) => {
            res.json({
              todayVisitors: rowToday ? rowToday.count : 0,
              totalVisitors: rowTotal ? rowTotal.totalVisitors : 0,
            });
          }
        );
      }
    );
  });
});

// db 연결 & 방명록 저장
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});

const EntrySchema = new mongoose.Schema({
  id: Number,
  name: String,
  message: String,
  image: String,
  date: String,
});

const Entry = mongoose.model('Entry', EntrySchema);

app.get('/api/entries', async (req, res) => {
  const entries = await Entry.find();
  res.json(entries);
});

app.post('/api/entries', async (req, res) => {
  const { id, name, message, image } = req.body;
  const newEntry = new Entry({
    id,
    name,
    message,
    image,
    date: new Date().toLocaleDateString(),
  });
  await newEntry.save();
  res.json(newEntry);
});

app.get('/', (req, res) => {
  res.send('Server is running!');
});


// 게시물 작성
app.use('/api/posts', posts);

// 로그인
app.use('/api/admin', adminRoutes);

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

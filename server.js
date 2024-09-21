const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const posts = require('./routes/posts');
const projects = require('./routes/projects');
const adminRoutes = require('./routes/admin');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // 50MB로 크기 제한 설정
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

// Multer 설정: 파일 저장 경로 및 파일명 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
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
mongoose.connect('mongodb+srv://minji:p33mk0chW29W5ewz@cluster0.7aje40r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected successfully!');
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

// 게시물 작성
app.use('/api/posts', posts);

// 프로젝트 작성
app.use('/api/projects', projects);

// 로그인
app.use('/api/admin', adminRoutes);

// 게시물 메인 이미지
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

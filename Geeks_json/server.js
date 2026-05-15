// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());

app.use(express.static(path.join(__dirname)));

app.post('/save-data', (req, res) => {
    const updatedDatabase = req.body;

    fs.writeFile('data.json', JSON.stringify(updatedDatabase, null, 2), (err) => {
        if (err) {
            console.error('Ошибка записи файла:', err);
            return res.status(500).send('Ошибка при сохранении');
        }
        res.send('Успешно сохранено');
    });
});

app.listen(port, () => {
    console.log(`✅ Проект запущен! Открой в браузере: http://localhost:${port}`);
});
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
   fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
   destination: function (req, file, cb) {
       cb(null, uploadDir);
   },
   filename: function (req, file, cb) {
       const timestamp = Date.now();
       const originalName = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9]/g, '_');
       const extension = path.extname(file.originalname);
       cb(null, `${originalName}-${timestamp}${extension}`);
   }
});

const upload = multer({
   storage: storage,
   limits: {
       fileSize: 100 * 1024 * 1024
   }
}).single('file');
app.use(express.static(path.join(__dirname, 'public')));
app.use('/media', express.static(path.join(__dirname, 'uploads')));
app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.post('/upload', (req, res) => {
   upload(req, res, function (err) {
       if (err) {
           const message = (err.code === 'LIMIT_FILE_SIZE') ? 'File terlalu besar. Maksimal 100MB.' : err.message;
           return res.status(400).json({ message });
       }
       
       if (!req.file) {
           return res.status(400).json({ message: 'Tidak ada file yang diunggah.' });
       }
       const fileUrl = `${req.protocol}://${req.get('host')}/media/${req.file.filename}`;
       res.status(200).json({
           message: 'File berhasil diunggah!',
           url: fileUrl
       });
   });
});
app.listen(PORT, () => {
   console.log(`http://localhost:${PORT}`);
   console.log(`http://localhost:${PORT}/media/<nama-file>`);
});
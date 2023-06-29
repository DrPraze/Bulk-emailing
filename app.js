const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const nodemailer = require('nodemailer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

const app = express();
const port = 3007;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/send-emails', upload.single('csv_file'), (req, res, next) => {
  const transporter = nodemailer.createTransport({
    host: 'lon108.truehost.cloud',
    auth: {
      user: req.body.user_email,
      pass: req.body.user_password,
    },
  });

  const message = {
    from: req.body.user_email,
    subject: req.body.subject,
    text: req.body.message,
    replyTo: req.body.reply_to,
  };

  const emails = [];

  try {
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        if (row['Email']) {
          emails.push(row['Email']);
        }
      })
      .on('end', () => {
        const mailOptions = {
          message: message,
          to: emails.join(', '),
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error(error);
            res.send('Error sending emails');
          } else {
            console.log('Emails sent:', info.response);
            res.send('Emails sent successfully');
          }
        });
        // Delete the uploaded file after processing
        fs.unlinkSync(req.file.path);
      });
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

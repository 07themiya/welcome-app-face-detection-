const nodemailer = require('nodemailer');

const sendAppointmentEmail = async ({ toEmail, toName, subject, htmlContent, qrBuffer }) => {
  const transporter = nodemailer.createTransport({
    host: 'mail.smtp2go.com',
    port: 587,
    auth: {
      user: 'service@cloudsyntex.com',
      pass: '1wAF2wEMvElGmj6p'
    }
  });

  const mailOptions = {
    from: `"Appointment Service" <service@cloudsyntex.com>`,
    to: toEmail,
    subject,
    html: htmlContent,
    attachments: [
      {
        filename: 'qrcode.png',
        content: qrBuffer,
        contentType: 'image/png'
      }
    ]
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendAppointmentEmail;

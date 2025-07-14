const express = require('express');
const sendAppointmentEmail = require('../mailer');
const router = express.Router();

router.post('/', async (req, res) => {
  const { toEmail, toName, department, date, time, appointmentId, qrBase64 } = req.body;

  try {
    const htmlContent = `
      <h2>Appointment Confirmation</h2>
      <p>Hello ${toName},</p>
      <p>Your appointment has been scheduled.</p>
      <ul>
        <li><strong>Department:</strong> ${department}</li>
        <li><strong>Date:</strong> ${date}</li>
        <li><strong>Time:</strong> ${time}</li>
        <li><strong>ID:</strong> ${appointmentId}</li>
      </ul>
      <img src="${qrBase64}" alt="QR Code" width="150" />
    `;

    const qrBuffer = Buffer.from(qrBase64.split(',')[1], 'base64');

    await sendAppointmentEmail({
      toEmail,
      toName,
      subject: 'Appointment Confirmation',
      htmlContent,
      qrBuffer
    });

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email sending failed:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;

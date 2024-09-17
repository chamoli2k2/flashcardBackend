import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVICE,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendOtpToUser = async (userEmail, otp) => {
    const mailOptions = {
        from: `"Flashy Flash Cards" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
        html: `
            <h3>Your OTP Code</h3>
            <p>Your OTP code is <b>${otp}</b>. It will expire in 10 minutes.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP sent to ${userEmail}`);
    } catch (error) {
        console.error('Error sending OTP email:', error);
    }
};

const sendFeedbackEmail = async (feedback, user) => {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.DEVELOPER_EMAIL, // developer's email address
        subject: 'User Account Deletion Feedback',
        text: `Feedback from ${user.username} (${user.email}):\n\n${feedback}`,
      };
  
      await transporter.sendMail(mailOptions);
      console.log("Feedback email sent successfully.");
    } catch (error) {
      console.error("Error sending feedback email:", error);
    }
};


export { sendOtpToUser, sendFeedbackEmail };
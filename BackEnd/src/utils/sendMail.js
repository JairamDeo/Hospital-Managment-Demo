import { createTransport } from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
    try {
        // Configure your email service
        
        const transporter = createTransport({
            host: "smtp.zoho.in", 
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL, // Your email address from environment variables
                pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
            },
            tls: {
                rejectUnauthorized: false, // For self-signed certificates (if applicable)
            },
            // debug: true, // Enable debugging output
            // logger: true, // Log communication with SMTP server
        });

    
        // Email options
        const mailOptions = {
            from: `"HMS" <${process.env.EMAIL}>`,
            to,
            subject,
            html, // Email body
            bcc: process.env.BCC_EMAIL,
        };

        // Send the email
        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
        return { success: true, message: "Email sent successfully." };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, message: "Error sending email.", error };
    }
};

export default {sendEmail};

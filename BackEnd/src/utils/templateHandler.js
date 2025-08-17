
import path from 'path';
import fs from 'fs';
import handlebars from 'handlebars';
import { sendEmail } from './sendMail.js';
import { fileURLToPath } from 'url';


// Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const templatesPath = path.join(__dirname, '../templates'); // Adjust the relative path

export const sendEmailTemplate = async ({data, templateName, subject}) => {

    // Read the HTML template from the templates folder
    const filePath = path.join(templatesPath, templateName);
    let emailContent = fs.readFileSync(filePath, 'utf8');
    
    // Compile the template
    const template = handlebars.compile(emailContent);
    
    // Generate HTML with user data
    const html = template({ ...data });

    console.log(html);
    // Send the email
    await sendEmail({
        to: data.email,
        subject: subject,
        html: html,
    });
    
    return { success: true, message: "Email sent successfully." };

}

export default {sendEmailTemplate};


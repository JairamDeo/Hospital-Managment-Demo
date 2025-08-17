import ContactUs from "../models/contact.model.js";
export const createContact = async (contactData) => {
    const contact = new ContactUs(contactData);
    return await contact.save();
}

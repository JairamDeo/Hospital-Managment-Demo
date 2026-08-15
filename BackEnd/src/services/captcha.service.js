import axios from 'axios';
export const verifyCaptcha = async (token) => {
    const secretKey = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      {},
      {
        params: {
          secret: secretKey,
          response: token
        }
      }
    );
    return response.data.success;
  };
  
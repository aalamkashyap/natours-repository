/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
import Stripe from 'stripe';
const stripe = Stripe(
  'pk_test_51PgLtU2KNjZ6UmvUM3Cq6WEHaUl1ZpIINlF40b8BmoDZ7eileuuIKPP0nuzFLJuvcHn2WUtYanWgmza4Qqx6YEYr009iNUt3Vk',
);

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`,
    );

    // 2) Create checkout form + charge credit card
    const checkoutPageUrl = session.data.session.url;
    window.location.assign(checkoutPageUrl);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};

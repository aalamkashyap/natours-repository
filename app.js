const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Serving static files
// app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
// app.use(
//   helmet({

//     // contentSecurityPolicy: {
//     //   directives: {
//     //     defaultSrc: ["'self'", 'cdnjs.cloudflare.com', 'http://127.0.0.1:8000'],
//     //     scriptSrc: ["'self'", 'cdnjs.cloudflare.com'],
//     //   },
//     // },
//   }),
// );

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // ... other directives
        'script-src': [
          "'self'", // allow scripts from your own domain
          "'unsafe-inline'", // allow inline scripts (you may want to remove this depending on your needs)
          'https://api.mapbox.com', // allow scripts from the Mapbox CDN
          'https://cdnjs.cloudflare.com',
          'https://js.stripe.com/v3/',
          'https://js.stripe.com/',
        ],
        'worker-src': [
          "'self'", // allow web workers from your own domain
          'http://localhost:8000', // allow web workers from the current host (development environment)
          'https://api.mapbox.com', // allow web workers from the Mapbox CDN,
          'https://cdnjs.cloudflare.com',
          'https://js.stripe.com/v3/',
          'https://js.stripe.com/',
          'blob:', // allow web workers from blob URLs
        ],
        'connect-src': [
          "'self'", // allow connections to your own domain
          'https://api.mapbox.com', // allow connections to the Mapbox API
          'https://events.mapbox.com', // allow connections to Mapbox events
          'https://cdnjs.cloudflare.com',
          'https://js.stripe.com/v3/',
          'https://js.stripe.com/',
        ],
      },
    },
  }),
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limiting number of requests from a single IP - to prevents DDos and brute force attacks
// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body - body more than 10kb wont be send
app.use(
  express.json({
    limit: '10kb',
  }),
);
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against Cross-site scripting attacks - XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whiteList: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  }),
);

// app.use((req, res, next) => {
//   console.log('Hello from the middleware');
//   next();
// });

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  next();
});

// 2) ROUTES

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// Handling Unhandled Requests
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on this server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err);

  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

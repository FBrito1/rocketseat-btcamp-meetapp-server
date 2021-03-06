import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import SessionController from './app/controllers/SessionController';
import UserController from './app/controllers/UserController';
import FileController from './app/controllers/FileController';
import MeetupController from './app/controllers/MeetupController';
import MeetupOwnerController from './app/controllers/MeetupOwnerController';
import SubscriptionController from './app/controllers/SubscriptionController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

// Auth
routes.post('/sessions', SessionController.store);
routes.post('/users', UserController.store);

routes.use(authMiddleware);

// Users
routes.get('/users/:userId', UserController.index);
routes.put('/users', UserController.update);
routes.delete('/users/:userId', UserController.delete);

// Files
routes.post('/files', upload.single('file'), FileController.store);

// Meetups
routes.get('/meetups', MeetupController.index);
routes.post('/meetups', MeetupController.store);
routes.put('/meetups/:meetupId', MeetupController.update);
routes.delete('/meetups/:meetupId', MeetupController.delete);

// Meetup Owner
routes.get('/owner_meetups', MeetupOwnerController.index);

// Subscription
routes.post('/meetups/:meetupId/subscriptions', SubscriptionController.store);
routes.get('/meetups/subscriptions', SubscriptionController.index);

export default routes;

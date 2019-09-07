import { Router } from 'express';

import SessionController from './app/controllers/SessionController';
import UserController from './app/controllers/UserController';
import FileController from './app/controllers/FileController';

import authMiddleware from './app/middlewares/auth';

const routes = new Router();

routes.post('/sessions', SessionController.store);
routes.post('/users', UserController.store);

routes.use(authMiddleware);

routes.get('/users/:userId', UserController.index);
routes.put('/users', UserController.update);
routes.delete('/users/:userId', UserController.delete);

routes.post('/files', FileController.store);

export default routes;

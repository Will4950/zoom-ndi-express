import {logger} from './logger.js';
import {router as errors} from './errors.js';
import {router} from './router.js';
import favicon from 'serve-favicon';
import express from 'express';
import expressWinston from 'express-winston';

export const app = express();

app.set('trust proxy', 1);
app.set('strict routing', true);
app.set('query parser', 'simple');
app.set('x-powered-by', false);
app.set('view engine', 'pug');
app.set('views', './client/views');

app.use('/', express.static('dist'));
app.use('/assets', express.static('client/assets'));
app.use(favicon('client/assets/favicon.png'));

app.use(expressWinston.logger({winstonInstance: logger, level: 'http'}));

app.use(router);
app.use(errors);

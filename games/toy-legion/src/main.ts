import './style.css';
import { Game } from './game';

const game = new Game();
if (import.meta.env.DEV) Object.assign(window, { __game: game });

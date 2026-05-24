import './style.css';
import { Application } from './application.ts';

const app = new Application();
const parent = document.getElementById('app')!;
parent.appendChild(app);
app.initialize();

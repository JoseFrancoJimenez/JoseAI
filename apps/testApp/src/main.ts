import './style.css';
import { Application } from './application.ts';

const app = new Application();
document.getElementById('app')!.appendChild(app);
app.initialize();

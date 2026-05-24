import './style.css';
import { Application } from './application.ts';

const app = new Application();
app.initialize(document.getElementById('app')!);

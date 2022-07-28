import './style.css'
import { WindProfileSvg } from './src/wind-profile-svg'
const windProfileSvg = new WindProfileSvg({ width: 1200, height: 600, top: 30, left: 60, bottom: 30, right: 80});
document.querySelector('#app').append(windProfileSvg.containerElement);

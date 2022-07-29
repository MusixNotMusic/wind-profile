import './style.css'
import { WindProfileSvg, defaultOptions, data } from 'wind-profile'
const options = { overlay: true, tooltip: { show: true } };
const boxModel = { width: 1200, height: 600, margin: {
    top: 30, 
    left: 60, 
    bottom: 30, 
    right: 80
} };

const windProfileSvg = new WindProfileSvg(data, options, boxModel);
document.querySelector('#app').append(windProfileSvg.containerElement);

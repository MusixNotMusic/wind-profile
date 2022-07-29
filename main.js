import './style.css'
import { WindProfileSvg } from './src/WindProfileSvg'
import { data } from './src/data';
const options = { overlay: true, tooltip: { show: false } };
const boxModel = { width: 1200, height: 600, margin: {
    top: 30, 
    left: 60, 
    bottom: 30, 
    right: 80
} };

const windProfileSvg = new WindProfileSvg(data, options, boxModel);
document.querySelector('#app').append(windProfileSvg.containerElement);

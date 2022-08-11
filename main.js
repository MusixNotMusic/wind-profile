import './style.css'
import { defaultOptions, data } from 'wind-profile'
import { WindProfileSvg } from './src/WindProfileSvg'
const options = { 
    overlay: true, 
    tooltip: { show: true }, 
    styleConfig: 
    { 
        backgroundColor: '#fff', 
        color: '#000',
        tooltip: {
            fontSize: 14,
            color: 'orange',
            background: 'rgba(0, 0, 0, 0.8)'
        }
    } 
};
const boxModel = { width: 1200, height: 600, margin: {
    top: 30, 
    left: 60, 
    bottom: 30, 
    right: 80
} };

const windProfileSvg = new WindProfileSvg(data, options, boxModel);
document.querySelector('#app').append(windProfileSvg.containerElement);

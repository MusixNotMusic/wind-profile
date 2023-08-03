import './style.css'
import { defaultOptions, data } from 'wind-profile'
import { WindProfileSvg } from './src/WindProfileSvg'
import { WindProfileCanvas } from './src/WindProfileCanvas'
const options = { 
    overlay: true, 
    tooltip: { show: true }, 
    overlayType: 1,
    styleConfig: 
    { 
        backgroundColor: '#fff', 
        color: '#000',
        tooltip: {
            fontSize: 16,
            color: '#000',
            background: 'rgba(255, 255, 255, 0.8)'
        }
    } 
};
const boxModel = { width: 1200, height: 600, margin: {
    top: 30, 
    left: 60, 
    bottom: 40, 
    right: 80
} };

// const windProfileSvg = new WindProfileSvg(data, options, boxModel);
const windProfileCanvas = new WindProfileCanvas(data, options, boxModel);
document.querySelector('#app').append(windProfileCanvas.containerElement);

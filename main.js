import './style.css'
import javascriptLogo from './javascript.svg'
import { setupCounter } from './counter.js'

import { createZoomDemo } from './src/d3-demo'
import { WindProfileSvg } from './src/wind-profile-svg'

// const svg = createZoomDemo({ width: 1000, height: 600 });
// document.querySelector('#app').append(svg);
const windProfileSvg = new WindProfileSvg({ width: 1200, height: 600, top: 30, left: 60, bottom: 30, right: 80});
document.querySelector('#app').append(windProfileSvg.svgDom);

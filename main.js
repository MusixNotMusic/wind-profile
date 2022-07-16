import './style.css'
import javascriptLogo from './javascript.svg'
import { setupCounter } from './counter.js'

import { createZoomDemo } from './src/d3-demo'

const svg = createZoomDemo({ width: 1000, height: 600 });

document.querySelector('#app').append(svg);
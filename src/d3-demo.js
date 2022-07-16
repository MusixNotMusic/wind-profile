import * as d3 from 'd3';
import * as moment from 'moment';
import { data } from './data';
window.data = data;

const windPaths = [
    'M 4 2 Q 4 1.2 3.4 0.6 2.8 0 2 0 1.2 0 0.6 0.6 0 1.2 0 2 0 2.8 0.6 3.4 1.2 4 2 4 2.8 4 3.4 3.4 4 2.8 4 2 M 3.1 0.9 Q 3.6 1.3 3.6 2 3.6 2.7 3.1 3.1 2.6 3.6 2 3.6 1.3 3.6 0.8 3.1 0.4 2.7 0.4 2 0.4 1.3 0.8 0.9 1.3 0.4 2 0.4 2.6 0.4 3.1 0.9 Z',
    'M 5.3 0 L 3.7 0 3.7 30 5.3 30 5.3 0 Z',
    'M 2.1 0 L 2.1 30 3.7 30 3.7 1.6 6.9 1.6 6.9 0 2.1 0 Z',
    'M 0 30 L 1.6 30 1.6 1.6 9 1.6 9 0 0 0 0 30 Z',
    'M 9 0 L 0 0 0 30 1.6 30 1.6 5.2 4.8 5.2 4.8 3.6 1.6 3.6 1.6 1.6 9 1.6 9 0 Z',
    'M 9 -0.05 L 0 -0.05 0 30 1.6 30 1.6 5.15 9 5.15 9 3.55 1.6 3.55 1.6 1.55 9 1.55 9 -0.05 Z',
    'M 9 5.15 L 9 3.55 1.6 3.55 1.6 1.6 9 1.6 9 0 0 0 0 30 1.6 30 1.6 8.75 4.8 8.75 4.8 7.15 1.6 7.15 1.6 5.15 9 5.15 Z',
    'M 9 5.2 L 9 3.6 1.6 3.6 1.6 1.6 9 1.6 9 0 0 0 0 30 1.6 30 1.6 8.75 9 8.75 9 7.15 1.6 7.15 1.6 5.2 9 5.2 Z',
    'M 9 1.6 L 9 0 0 0 0 30 1.6 30 1.6 12.3 4.8 12.3 4.8 10.7 1.6 10.7 1.6 8.75 9 8.75 9 7.15 1.6 7.15 1.6 5.2 9 5.2 9 3.6 1.6 3.6 1.6 1.6 9 1.6 Z',
    'M 9 1.6 L 9 0 0 0 0 30 1.6 30 1.6 12.25 9 12.25 9 10.65 1.6 10.65 1.6 8.7 9 8.7 9 7.1 1.6 7.1 1.6 5.15 9 5.15 9 3.55 1.6 3.55 1.6 1.6 9 1.6 Z',
    'M 9 1.6 L 9 0 0 0 0 30 1.6 30 1.6 15.8 4.8 15.8 4.8 14.2 1.6 14.2 1.6 12.25 9 12.25 9 10.65 1.6 10.65 1.6 8.7 9 8.7 9 7.1 1.6 7.1 1.6 5.15 9 5.15 9 3.55 1.6 3.55 1.6 1.6 9 1.6 Z',
    'M 1.8 7.2 L 9 0 0 0 0 30.05 1.8 30.05 1.8 7.2 M 1.8 4.65 L 1.8 1.8 4.65 1.8 1.8 4.65 Z',
    'M 9 -0.05 L 0 -0.05 0 30 1.6 30 1.6 8.95 9 8.95 9 7.35 1.6 7.35 9 -0.05 M 1.8 1.75 L 4.65 1.75 1.8 4.6 1.8 1.75 Z',
    'M 9 -0.05 L 0 -0.05 0 30 1.6 30 1.6 12.15 9 12.15 9 10.55 1.6 10.55 1.6 8.95 9 8.95 9 7.35 1.6 7.35 9 -0.05 M 1.8 4.6 L 1.8 1.75 4.65 1.75 1.8 4.6 Z',
    'M 1.6 10.55 L 1.6 9 9 9 9 7.4 1.6 7.4 9 0 0 0 0 30 1.6 30 1.6 15.3 9 15.3 9 13.7 1.6 13.7 1.6 12.15 9 12.15 9 10.55 1.6 10.55 M 1.8 4.65 L 1.8 1.8 4.65 1.8 1.8 4.65 Z',
    'M 1.6 10.6 L 1.6 9 9 9 9 7.4 1.6 7.4 9 0 0 0 0 30 1.6 30 1.6 18.55 9 18.55 9 16.95 1.6 16.95 1.6 15.35 9 15.35 9 13.75 1.6 13.75 1.6 12.2 9 12.2 9 10.6 1.6 10.6 M 1.8 4.65 L 1.8 1.8 4.65 1.8 1.8 4.65 Z',
    'M 9 7.4 L 1.6 7.4 9 0 0 0 0 30 1.6 30 1.6 14.8 9 7.4 M 1.8 1.8 L 4.65 1.8 1.8 4.65 1.8 1.8 M 4.65 9.2 L 1.8 12.05 1.8 9.2 4.65 9.2 Z',
    'M 1.6 7.4 L 8.95 0 0 0 0 30 1.55 30 1.55 22.2 8.95 14.8 1.6 14.8 8.95 7.4 1.6 7.4 M 1.8 4.65 L 1.8 1.8 4.65 1.8 1.8 4.65 M 1.8 9.2 L 4.65 9.2 1.8 12.05 1.8 9.2 M 1.8 19.45 L 1.8 16.6 4.65 16.6 1.8 19.45 Z',
    'M 1.9 5 L 9 0 0 0 0 30.05 1.8 30.05 1.8 20.15 9 15.1 1.8 15.1 1.8 15.05 9 10 1.9 10 9 5 1.9 5 M 1.8 3.25 L 1.8 1.25 4.65 1.25 1.8 3.25 M 1.8 11.25 L 4.65 11.25 1.8 13.25 1.8 11.25 M 1.8 6.25 L 4.65 6.25 1.8 8.25 1.8 6.25 M 1.8 18.35 L 1.8 16.35 4.65 16.35 1.8 18.35 Z'
]


function timeFormat (timeStamp, index, textList) {
    // console.log(timeStamp, index, textList)
    const formatString = index === 1 ? 'YYYY-MM-DD HH:mm' : 'HH:mm';
    return index === 0 ? '' : moment(timeStamp).format(formatString);
    // return moment(timeStamp).format('HH:mm');
}

function drawArc(svg, data, boxArea, transform, x, y) {
    // svg.
    const dataAreaDom = document.querySelector('svg .data--area');
    if (dataAreaDom) {
        document.querySelector('svg .data--area').remove();
    }
    const group = svg.append('group').attr('class', 'data--area')
    const { xMinVal, xMaxVal, yMinVal, yMaxVal } = boxArea;
    data.forEach(item => {
        if (item.timeStamp <= xMaxVal && item.timeStamp >= xMinVal) {
            const xCoord = transform.applyX(x(item.timeStamp));
            if (item.metricList && item.metricList.length > 0) {
                item.metricList.forEach(mtr => {
                    mtr.hei = +mtr.hei;
                    if (mtr && mtr.hei > yMinVal && mtr.hei < yMaxVal) {
                        let yCoord = transform.applyY(y(+mtr.hei));

                        group.append('circle')
                             .attr('cx', xCoord )
                             .attr('cy', yCoord )
                             .attr('r','20')
                             .attr('stroke','orange')
                             .attr('stroke-width','2')
                            //  .attr('fill','steelblue')
                    }
                })
            }
        }
    })
    

}

let maxTimeStamp = 0;
let minTimeStamp = Infinity;
let maxHeight = 0;
function calculateData () {
    data.forEach(item => {
        let timeStamp = moment(item.groundTime).valueOf()
        item.timeStamp = timeStamp
        if (maxTimeStamp < timeStamp) {
            maxTimeStamp = timeStamp;
        }
        if (minTimeStamp > timeStamp) {
            minTimeStamp = timeStamp;
        }
        if (item.metricList && item.metricList[item.metricList.length - 1] && (+item.metricList[item.metricList.length - 1].hei) > maxHeight) {
            maxHeight = (+item.metricList[item.metricList.length - 1].hei);
        }
    })
    console.log(minTimeStamp, maxTimeStamp, maxHeight);
}
/**
 * 宽度像素转换为 X数值 (列数据)
 */
function widthPiexlToColDataVal (width, transform, invertX) { 
    return invertX(transform.invertX(width))
}

/**
 * 高度像素转换为 Y数值 (行数据)
 */
 function heightPiexlToRowDataVal (height, transform, invertY) { 
    return invertY(transform.invertY(height))
}

function createAxis (width, height, options) {
    const { minX, maxX, minY, maxY } = options;
    // axis x
    const x = d3.scaleLinear()
        .range([0, width])
        .domain([minX, maxX])
    
    const invertX = d3.scaleLinear()
        .domain([0, width])
        .range([minX, maxX])

    const xAxis = d3.axisBottom(x)
        .ticks(((width + 2) / (height + 2)) * 10)
        .tickSize(height)
        .tickPadding(8 - height)
        .tickFormat(timeFormat)
    // axis y
    const y = d3.scaleLinear()
        .domain([minY, maxY])
        .range([-1, height + 1])
    
    const invertY = d3.scaleLinear()
        .range([minY, maxY])
        .domain([-1, height + 1])

    const yAxis = d3.axisRight(y)
        .ticks(10)
        .tickSize(width)
        .tickPadding(30 - width)
    
    return { xAxis, yAxis, x, y, invertX, invertY }
}

export function createZoomDemo (options) {
  const { top, right, bottom, left } = options.padding || {top: 10, left: 10, bottom: 10, right: 10}
  const boxWidth = options.width + right + left;
  const boxHeight = options.height + top + bottom;

  const width = options.width;
  const height = options.height;

  calculateData();
  
  // svg DOM  
  const svg = d3.create("svg")
       .attr("viewBox", [top, right, width, height])
       .attr("width", boxWidth)
       .attr("height", boxHeight)

  const { xAxis, yAxis, x, y, invertX, invertY } = createAxis(width, height, { maxX: maxTimeStamp, minX: minTimeStamp, minY: 0, maxY: maxHeight});

  window._x = x
  window._y = y
  window.invertX = invertX
  window.invertY = invertY
  window.svg = svg

  const gX = svg.append("g").attr("class", "axis axis--x").call(xAxis);
  const gY = svg.append("g").attr("class", "axis axis--y").call(yAxis);

  const zoom = d3.zoom()
    .scaleExtent([1, 40])
    .translateExtent([[0, 0], [width + 100, height]])
    .filter(filter)
    .on("zoom", zoomed);

  window.zoom = zoom


  function zoomed({ transform }) {
    window.transform = transform
    // view.attr("transform", transform);
    gX.call(xAxis.scale(transform.rescaleX(x)));
    gY.call(yAxis.scale(transform.rescaleY(y)));

    const boxArea = viewBoxFilter(transform, x, y, invertX, invertY, width, height);
    drawArc(svg, data, boxArea, transform, x, y);

    const { xMinVal, xMaxVal, yMinVal, yMaxVal } = boxArea;
    console.log(xMinVal, xMaxVal, yMinVal, yMaxVal);
  }

  function reset() {
    svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity);
  }

  // prevent scrolling then apply the default filter
  function filter(event) {
    event.preventDefault();
    return (!event.ctrlKey || event.type === 'wheel') && !event.button;
  }

  return Object.assign(svg.call(zoom).node(), {reset});
}

/**
 * 视图范围内的数据
 * @param {*} transform 
 * @param {*} x 
 * @param {*} y 
 * @param {*} invertX 
 * @param {*} invertY 
 * @param {*} width 
 * @param {*} height 
 * @returns 
 */
function viewBoxFilter (transform, x, y, invertX, invertY, width, height) {
    const xMinVal = widthPiexlToColDataVal(0,      transform, invertX);
    const xMaxVal = widthPiexlToColDataVal(width,  transform, invertX);
    const yMinVal = heightPiexlToRowDataVal(0,      transform, invertY);
    const yMaxVal = heightPiexlToRowDataVal(height, transform, invertY);
    return {
        xMinVal,
        xMaxVal,
        yMinVal,
        yMaxVal
    }
}
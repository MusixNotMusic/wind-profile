import * as d3 from 'd3';
import debounce from 'lodash.debounce';
import * as moment from 'moment';
import { data } from './data';
import { colors } from './color';
import { windPaths, pathsCenter } from './constant';

export class WindProfileSvg {
    bboxFromData = null; // 数据边界
    bboxFromWindow = null; // 数据窗口彬姐
    constructor(options) {
        this._drawWind = debounce(this.drawWind.bind(this), 200);

        this.bboxFromWindow = options;
        // 计算 数据区间
        this.calculateBboxFromData();
        // 创建比例尺
        this.createScale();
        // 创建坐标轴
        this.createAxis();
        // 创建 svg
        this.createSvg();
    }
    /**
     * 计算数据真实 数值范围
     */
    calculateBboxFromData () {
        let maxTimeStamp = 0;
        let minTimeStamp = Infinity;
        let maxHeight = 0;
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
        this.bboxFromData = { maxX: maxTimeStamp, minX: minTimeStamp, minY: 0, maxY: maxHeight };
    }
    

    /**
     * 创建比例尺
     */
    createScale () {
        const { minX, maxX, minY, maxY } = this.bboxFromData;
        const { top, right, bottom, left, width, height } = this.bboxFromWindow;
        this.xScale = d3.scaleLinear()
            .range([0, width - right - left])
            .domain([minX, maxX])

        this.invertXScale = d3.scaleLinear()
            .domain([0, width - right - left])
            .range([minX, maxX]);

        this.yScale = d3.scaleLinear()
            .domain([minY, maxY])
            .range([height - bottom - top, 0])

        this.invertYScale = d3.scaleLinear()
            .range([minY, maxY])
            .domain([height - bottom - top, 0]);
    }
    /**
     * 创建 坐标轴
     */
    createAxis () {
        const { width, height, right} = this.bboxFromWindow;
        this.xAxis = d3.axisBottom(this.xScale)
            .ticks(((width + 2) / (height + 2)) * 10)
            // .tickSize(height)
            // .tickPadding(8 - height)
            .tickFormat(this.timeFormat)

        this.yAxis = d3.axisRight(this.yScale)
            .ticks(10)
            .tickSize(width)
            .tickPadding(- width)
    }
    /**
     * 宽度像素 映射 数据
     * @param {*} transform
     * @returns 
     */
    widthPiexlToColDataVal (widthPixel, transform) { 
        return this.invertXScale(transform.invertX(widthPixel))
    }

    /**
     * 高度像素 映射 数据
     * @param {*} transform 
     * @returns 
     */
    heightPiexlToRowDataVal (heightPixel, transform) { 
        return this.invertYScale(transform.invertY(heightPixel))
    }

    viewBoxFilter (transform) {
        const { top, right, bottom, left, width, height } = this.bboxFromWindow;
        const xMinVal = this.widthPiexlToColDataVal(0,      transform);
        const xMaxVal = this.widthPiexlToColDataVal(width - right - left,  transform);
        const yMinVal = this.heightPiexlToRowDataVal(height - top - bottom,      transform);
        const yMaxVal = this.heightPiexlToRowDataVal(0, transform);
        return {
            xMinVal,
            xMaxVal,
            yMinVal,
            yMaxVal
        }
    }

    /**
     * 格式化时间
     */
     timeFormat (timeStamp, index) {
        const formatString = index === 0 ? 'YYYY-MM-DD HH:mm' : 'HH:mm';
        return moment(timeStamp).format(formatString)
    }


    drawWind(svg, data, transform) {
        const { width, height, top, right } = this.bboxFromWindow;

        const boxArea = this.viewBoxFilter(transform);
        
        const dataAreaDom = document.querySelector('svg .data--area');
        
        if (dataAreaDom) {
            document.querySelector('svg .data--area').remove();
        }
        const group = svg.append('g')
            .attr("transform", `translate(${right}, ${top})`)
            .attr('class', 'data--area');
        
        const { xMinVal, xMaxVal, yMinVal, yMaxVal } = boxArea;
    
        const xMinPiexl = this.xScale(xMinVal);
        const xMaxPiexl = this.xScale(xMaxVal);
        // 
        const delta = xMaxPiexl - xMinPiexl
        // scale
        const scale = delta / width * transform.k / 1.5;

        data.forEach(item => {
            if (item.timeStamp <= xMaxVal && item.timeStamp >= xMinVal) {
                const xCoord = transform.applyX(this.xScale(item.timeStamp));
                if (item.metricList && item.metricList.length > 0) {
                    item.metricList.forEach(mtr => {
                        mtr.hei = +mtr.hei;
                        if (mtr && mtr.hei > yMinVal && mtr.hei < yMaxVal) {
                            let yCoord = transform.applyY(this.yScale(+mtr.hei));
                            let index = (+mtr.vh) | 0;
                            index = index > windPaths.length ? windPaths.length - 1 : index;
                            group.append('path')
                                 .attr('transform', `
                                        translate(${xCoord - pathsCenter[index].x}, ${yCoord - pathsCenter[index].y}) 
                                        scale(${scale}, ${scale}) 
                                        rotate(${+mtr.dir})`
                                       )
                                 .attr('d', windPaths[index] )
                                 .attr('fill', colors[index * 3 + 40])
                        }
                    })
                }
            }
        })
    }

    createSvg () {
        // const { top, right, bottom, left } = this.bboxFromData;
        const { width, height, top, right, bottom, left } = this.bboxFromWindow;
      
        // svg DOM  
        const svg = d3.create("svg")
             .attr("viewBox", [0, 0, width, height])
             .attr("width", width)
             .attr("height", height)
      
        const gX = svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", `translate(${right}, ${height - top})`)
            .call(this.xAxis.bind(this));

        const gY = svg.append("g")
            .attr("class", "axis axis--y")
            .attr("transform", `translate(0, ${top})`)
            .call(this.yAxis.bind(this))
            .call(g => g.select(".domain")
            .remove())
            .call(g => g.selectAll("line")
                .attr("stroke-opacity", 0.5)
                .attr("stroke-dasharray", "2,2"))
            .call(g => g.selectAll(".tick text")
            .attr("x", 4)
            .attr("dy", -4));
      
        const zoomed = ({ transform }) => {
          window.transform = transform
          gX.call(this.xAxis.scale(transform.rescaleX(this.xScale)));
          gY.call(this.yAxis.scale(transform.rescaleY(this.yScale)))
            .call(g => g.select(".domain")
            .remove())
            .call(g => g.selectAll("line")
                .attr("stroke-opacity", 0.5)
                .attr("stroke-dasharray", "2,2"))
            .call(g => g.selectAll(".tick text")
            .attr("x", 4)
            .attr("dy", -4));;
      
          this._drawWind(svg, data, transform);
        }

        const zoom = d3.zoom()
          .scaleExtent([1, 40])
          .translateExtent([[0, 0], [width, height]])
          .filter(filter)
          .on("zoom", zoomed);
      
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
        
        this.drawWind(svg, data, d3.zoomIdentity);
        Object.assign(svg.call(zoom).node(), {reset})
        this.svgDom = svg.node();
      }
}
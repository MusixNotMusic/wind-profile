import * as d3 from 'd3';
import debounce from 'lodash.debounce';
import * as moment from 'moment';
import { data } from './data';
import { rectColors, windColors } from './color';
import { windPaths, pathsCenter, defaultOption } from './constant';
import { getColorCardLegendDom, getWindLegendDom } from './colorCard';

export class WindProfileSvg {
    bboxFromData = null; // 数据边界
    bboxFromWindow = null; // 数据窗口
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
            .tickSize(width - right)
            .tickPadding(-width)
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
        const formatString = index === -1 ? 'YYYY-MM-DD HH:mm' : 'HH:mm';
        return moment(timeStamp).format(formatString)
    }


    drawWind(svg, data, transform) {
        const { width, height, top, right, left, bottom } = this.bboxFromWindow;

        const boxArea = this.viewBoxFilter(transform);
        
        const dataAreaDom = document.querySelector('svg .data--area');
        
        if (dataAreaDom) {
            document.querySelector('svg .data--area').remove();
        }
        const group = svg.append('g')
            .attr("transform", `translate(${left}, ${top})`)
            .attr('class', 'data--area');
        
        const { xMinVal, xMaxVal, yMinVal, yMaxVal } = boxArea;
    
        const xMinPiexl = this.xScale(xMinVal);
        const xMaxPiexl = this.xScale(xMaxVal);

        const delta = xMaxPiexl - xMinPiexl;

        const filterArr = [];
        let maxHeight = -1;
        data.forEach(item => {
            if (item.timeStamp <= xMaxVal && item.timeStamp >= xMinVal) {
                const obj = { timeStamp: item.timeStamp, groundTime: item.groundTime }
                const metrics = [];
                if (item.metricList && item.metricList.length > 0) {
                    item.metricList.forEach(mtr => {
                        mtr.hei = +mtr.hei;
                        if (mtr && mtr.hei > yMinVal && mtr.hei < yMaxVal) {
                            metrics.push(mtr);
                        }
                    })
                }
                obj.metricList = metrics;
                if (metrics.length > maxHeight) {
                    maxHeight = metrics.length;
                }
                filterArr.push(obj);
            }
        })
        let avgWidth = (width - left - right)  / filterArr.length;
        let avgHeight =  (height - top - bottom) / maxHeight;
        let scaleW = avgWidth / 9;
        let scaleH = avgHeight / 30;
        scaleW = scaleW > 1 ? 1 : scaleW;
        scaleH = scaleH > 1 ? 1 : scaleH;

        let overflowHight = 0;
        filterArr.forEach(item => {
            const xCoord = transform.applyX(this.xScale(item.timeStamp));
            item.metricList.forEach((mtr, idx)=> {
                let yCoord = transform.applyY(this.yScale(+mtr.hei));
                let index = (+mtr.vh) | 0;
                index = index > windPaths.length ? windPaths.length - 1 : index;
                
                if (idx === 0 && (yCoord + avgHeight / 2 > (height - bottom - top))) {
                    overflowHight = yCoord + avgHeight / 2 - height + bottom + top;
                    overflowHight = avgHeight - overflowHight;
                } else if (idx === item.metricList.length - 1 && (yCoord - avgHeight / 2 < top)) {
                    overflowHight = avgHeight
                } else {
                    overflowHight = avgHeight
                }

                group.append('rect')
                        .attr('x', xCoord - avgWidth)
                        .attr('y', yCoord - avgHeight / 2)
                        .attr('width', avgWidth)
                        .attr('height', overflowHight)
                        .attr('fill', rectColors[index % rectColors.length])
                        .on('click', () => {
                            console.log('mtr ==>', mtr, item.groundTime)
                        })
            })
        })    

        filterArr.forEach(item => {
            const xCoord = transform.applyX(this.xScale(item.timeStamp));
            item.metricList.forEach(mtr => {
                let yCoord = transform.applyY(this.yScale(+mtr.hei));
                let index = (+mtr.vh) | 0;
                index = index > windPaths.length ? windPaths.length - 1 : index;
                //  translate(${xCoord - pathsCenter[index].x}, ${yCoord + pathsCenter[index].y / 2})
                group.append('path')
                        .attr('transform', `
                            translate(${xCoord - avgWidth / 2}, ${yCoord + pathsCenter[index].y / 2})
                            scale(${scaleW}, ${scaleW}) 
                            rotate(${(+mtr.dir)})`
                            )
                        .attr('d', windPaths[index])
                        .attr('fill', windColors[index | 0])
                        // .on('click', () => {
                        //     console.log('mtr ==>', mtr)
                        // })
            })
        })
    }

    createSvg () {
        const { width, height, top, right, bottom, left } = this.bboxFromWindow;
      
        // svg DOM  
        const svg = d3.create("svg")
             .attr("viewBox", [0, 0, width, height])
             .attr("width", width)
             .attr("height", height)
             .style('background', defaultOption.backgourndColor)
             .on('mousemove', (event) => { console.log('mousemove', event, event.offsetX, event.offsetY)});

        const container = d3.create("div")
             .style('width', width + 'px')
             .style('height', height + 'px')
             .style('position', 'relative')

        container.node().append(svg.node());

      
        const gX = svg.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", `translate(${left}, ${height - bottom})`)
            .style("font-size", defaultOption.fontSize + 'px')
            .style("color", defaultOption.color)
            .call(this.xAxis.bind(this))

        const gY = svg.append("g")
            .attr("class", "axis axis--y")
            .attr("transform", `translate(0, ${top})`)
            .style("font-size", defaultOption.fontSize + 'px')
            .style("color", defaultOption.color)
            .call(this.yAxis.bind(this))
            .call(g => g.select(".domain")
            .remove())
            .call(g => g.selectAll("line")
                .attr("stroke-opacity", 0.5)
                .attr("stroke-dasharray", "2,2"))
            .call(g => g.selectAll(".tick text")
            .attr("x", 10)
            .attr("dy", -4));

        // 生成色卡

        const colorCardLegend = getColorCardLegendDom(rectColors, 11)
        d3.select(colorCardLegend)
            .style('position', 'absolute')
            .style('right', 0 + 'px')
            .style('bottom', bottom - 10 + 'px')
        container.node().append(colorCardLegend)

        const windLegend = getWindLegendDom(windColors);
        d3.select(windLegend)
            .style('position', 'absolute')
            .style('right', 0 + 'px')
            .style('top', top + 'px')
        container.node().append(windLegend)

        
      
        const zoomed = ({ transform }) => {
          window.transform = transform
          gX.call(this.xAxis.scale(transform.rescaleX(this.xScale)))
          
          gY.call(this.yAxis.scale(transform.rescaleY(this.yScale)))
            .call(g => g.select(".domain")
            .remove())
            .call(g => g.selectAll("line")
                .attr("stroke-opacity", 0.5)
                .attr("stroke-dasharray", "2,2"))
            .call(g => g.selectAll(".tick text")
            .attr("x", 10)
            .attr("dy", -4));;
      
          this._drawWind(svg, data, transform);
        }

        const zoom = d3.zoom()
          .scaleExtent([1, 10])
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
        this.svgDom = container.node();
      }
}
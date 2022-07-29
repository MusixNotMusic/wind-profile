import * as d3 from 'd3';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import defaultsDeep from 'lodash.defaultsdeep';
import * as moment from 'moment';
import { rectColors, windColors } from './color';
import { windPaths, pathsCenter, styleConfig } from './constant';
import { getColorCardLegendDom, getWindLegendDom } from './Legend';
import { Tooltip } from './Tooltip';

export class WindProfileSvg {
    bboxView = null; // 视图范围
    bboxData = null; // 数据边界
    boxModel = null; // 数据窗口
    constructor(data, options, boxModel) {
        this._drawMainView = debounce(this.drawMainView.bind(this), 200);
        this._tooltipPickUp = throttle(this.tooltipPickUp.bind(this), 30);
        
        this.data = data;

        // options
        this.overlay = options.overlay || false;

        this.overlayType = options.overlayType || '11';

        this.windValueFunction = options.windValueFunction;
        
        this.windOverlayValueFunction = options.windOverlayValueFunction;
        // 高度列表数据
        this.altitudeListLabel = options.altitudeListLabel || 'metricList';
        // 海拔字段
        this.altitudeLabel = options.altitudeLabel || 'hei';
        // 时间字段 long long 整形字符串
        this.timeStampLabel = options.timeStampLabel || 'timeStamp';
        // 风向角度 direction 字段
        this.directionLabel = options.directionLabel || 'dir';
        // 是否显示 tooltip
        this.tooltipShow = options.tooltip && options.tooltip.show;
        
        // options color path 
        this.windColors = options.colors ? options.colors.windColors : windColors;
        this.rectColors = options.colors ? options.colors.rectColors : rectColors;
        // options path
        this.windPaths = options.path ? options.path.windPaths : windPaths;

        this.styleConfig = defaultsDeep(styleConfig, options.style ? options.style.config : {});

        this.transform = d3.zoomIdentity;
        // 盒子模型
        this.boxModel = boxModel;
        // 计算 视图范围
        this.calculateBboxView();
        // 计算 数据区间
        this.calculateBboxData();
        // 创建比例尺
        this.createScale();
        // 创建坐标轴
        this.createAxis();
        // 创建 svg
        this.createSvg();

        // ========DRAW===========
        // 绘制 色卡图例
        this.overlay && this.drawColorCardLegend();
        // 绘制 风羽图例
        this.drawWindLegend();

        this.drawXAxis();

        this.drawYAxis();

        this.drawMainView();

        this.tooltip = new Tooltip({}, this.containerElement, this.boxModel);

        window.wind = this;
    }

    /**
     * 计算数据真实 数值范围
     */
    calculateBboxData () {
        let maxTimeStamp = 0;
        let minTimeStamp = Infinity;
        let maxHeight = 0;
        this.data.forEach(item => {
            let timeStamp = moment(item.groundTime).valueOf()
            item[this.timeStampLabel] = timeStamp
            if (maxTimeStamp < timeStamp) {
                maxTimeStamp = timeStamp;
            }
            if (minTimeStamp > timeStamp) {
                minTimeStamp = timeStamp;
            }
            const metricList = item[this.altitudeListLabel];
            if (metricList && metricList[metricList.length - 1] && (+metricList[metricList.length - 1][this.altitudeLabel]) > maxHeight) {
                maxHeight = (+metricList[metricList.length - 1][this.altitudeLabel]);
            }
        })
        console.log(minTimeStamp, maxTimeStamp, maxHeight);
        this.bboxData = { maxX: maxTimeStamp, minX: minTimeStamp, minY: 0, maxY: maxHeight };
    }
    
    /**
     * 计算视图 盒子范围
     */
    calculateBboxView () {
        const { width, height } = this.boxModel;
        const { top, right, bottom, left } = this.boxModel.margin;

        this.bboxView = { minX: 0, maxX: width - right - left, minY: 0, maxY: height - bottom - top }
    }

    /**
     * 创建比例尺
     */
    createScale () {    
        const { minX, maxX, minY, maxY } = this.bboxData;
        
        const viewMinX = this.bboxView.minX;
        const viewMaxX = this.bboxView.maxX;
        const viewMinY = this.bboxView.minY;
        const viewMaxY = this.bboxView.maxY;
       

        this.xScale = d3.scaleLinear()
            .range([viewMinX, viewMaxX])
            .domain([minX, maxX])

        this.invertXScale = d3.scaleLinear()
            .domain([viewMinX, viewMaxX])
            .range([minX, maxX]);

        this.yScale = d3.scaleLinear()
            .domain([minY, maxY])
            .range([viewMaxY, viewMinY])

        this.invertYScale = d3.scaleLinear()
            .range([minY, maxY])
            .domain([viewMaxY, viewMinY]);
    }
    /**
     * 创建 坐标轴
     */
    createAxis () {
        const { width, height } = this.boxModel;
        const { right } = this.boxModel.margin;

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
        const { minX, maxX, minY, maxY } = this.bboxView;

        const xMinVal = this.widthPiexlToColDataVal(minX,  transform);
        const xMaxVal = this.widthPiexlToColDataVal(maxX,  transform);
        const yMinVal = this.heightPiexlToRowDataVal(maxY, transform);
        const yMaxVal = this.heightPiexlToRowDataVal(minY, transform);
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


    drawMainView() {
        const { top, left } = this.boxModel.margin;

        const dataAreaDom = document.querySelector('svg .data--area');
        
        if (dataAreaDom) {
            document.querySelector('svg .data--area').remove();
        }

        const group = this.svg.append('g')
            .attr("transform", `translate(${left}, ${top})`)
            .attr('class', 'data--area');
        
    
        // 计算 filterArr
        const { filterArr, maxHeight } = this.calcAreaFilter();
        
        // 叠加
        if (this.overlay) {
            this.drawRect(filterArr, maxHeight, group);
        }

        // 风羽
        this.drawWindProfile(filterArr, maxHeight, group);
    }

    /**
     * 筛选 bbox 范围内数据
     */
    calcAreaFilter () {
        const boxArea = this.viewBoxFilter(this.transform);

        const { xMinVal, xMaxVal, yMinVal, yMaxVal } = boxArea;
        
        const filterArr = [];
        
        let maxHeight = -1;

        this.data.forEach(item => {
            const timeStamp = item[this.timeStampLabel];
            if (timeStamp <= xMaxVal && timeStamp >= xMinVal) {
                const obj = { timeStamp: timeStamp, groundTime: item.groundTime }
                const metrics = [];
                const metricList = item[this.altitudeListLabel];
                if (metricList && metricList.length > 0) {
                    metricList.forEach(mtr => {
                        mtr[this.altitudeLabel] = +mtr[this.altitudeLabel];
                        if (mtr && mtr[this.altitudeLabel] > yMinVal && mtr[this.altitudeLabel] < yMaxVal) {
                            metrics.push(mtr);
                        }
                    })
                }
                obj[this.altitudeListLabel] = metrics;
                if (metrics.length > maxHeight) {
                    maxHeight = metrics.length;
                }
                filterArr.push(obj);
            }
        })

        return { maxHeight, filterArr };
    }

    /**
     * 叠加 cn2 风切变
     * @param {*} filterArr 
     */
    drawRect (filterArr, maxHeight, group) {
        const { top } = this.boxModel.margin;

        const { minX, maxX, minY, maxY } = this.bboxView;

        const transform = this.transform;

        let avgWidth = (maxX)  / filterArr.length;
        let avgHeight =  (maxY) / maxHeight;

        let overflowHight = 0;
        filterArr.forEach(item => {
            const xCoord = transform.applyX(this.xScale(item[this.timeStampLabel]));

            item[this.altitudeListLabel].forEach((mtr, idx)=> {
                let yCoord = transform.applyY(this.yScale(+mtr[this.altitudeLabel]));
                let index = this.windOverlayValueFunction ? this.windOverlayValueFunction(mtr) : (mtr.cn2 * 1e10 | 0);
                index = index > this.windPaths.length ? this.windPaths.length - 1 : index;
                
                if (idx === 0 && (yCoord + avgHeight / 2 > (maxY))) {
                    
                    overflowHight = yCoord + avgHeight / 2 - maxY;
                    overflowHight = avgHeight - overflowHight;

                } else if (idx === item[this.altitudeListLabel].length - 1 && (yCoord - avgHeight / 2 < top)) {

                    overflowHight = avgHeight

                } else {

                    overflowHight = avgHeight
                    
                }

                group.append('rect')
                        .attr('x', xCoord - avgWidth / 2)
                        .attr('y', yCoord - avgHeight / 2)
                        .attr('width', avgWidth)
                        .attr('height', overflowHight)
                        .attr('fill', this.rectColors[index % this.rectColors.length])
            })
        })
    }
    /**
     * 绘制风羽图
     * @param {*} filterArr 
     */
    drawWindProfile (filterArr, maxHeight, group) {
        const { width, height } = this.boxModel;
        const { top, right, left, bottom } = this.boxModel.margin;

        const transform = this.transform;

        const { minX, maxX, minY, maxY } = this.bboxView;

        let avgWidth = maxX / filterArr.length;
        let avgHeight = maxY / maxHeight;
        let scaleW = avgWidth / 9;
        let scaleH = avgHeight / 30;
        scaleW = scaleW > 1 ? 1 : scaleW;
        scaleH = scaleH > 1 ? 1 : scaleH;

        filterArr.forEach(item => {
            const xCoord = transform.applyX(this.xScale(item[this.timeStampLabel]));

            item[this.altitudeListLabel].forEach(mtr => {
                let yCoord = transform.applyY(this.yScale(+mtr[this.altitudeLabel]));

                let index = this.windValueFunction ? this.windValueFunction(mtr) : (mtr.vh | 0);

                index = index > this.windPaths.length ? this.windPaths.length - 1 : index;
                
                group.append('path')
                        .attr('transform', `
                            translate(${xCoord - avgWidth / 2}, ${yCoord + pathsCenter[index].y / 2})
                            scale(${scaleW}, ${scaleW}) 
                            rotate(${(+mtr[this.directionLabel])})`
                            )
                        .attr('d', this.windPaths[index])
                        .attr('fill', this.windColors[index | 0])
            })
        })
    }

    createSvg () {
        const { width, height } = this.boxModel;
        const { top, right, left, bottom } = this.boxModel.margin;
      
        // svg DOM  
        const svg = d3.create("svg")
             .attr("viewBox", [0, 0, width, height])
             .attr("width", width)
             .attr("height", height)
             .style('background', this.styleConfig.backgourndColor);
             
        this.svg = svg;

        // container
        const container = d3.create("div")
             .attr('id', 'w-p-container')
             .style('width', width + 'px')
             .style('height', height + 'px')
             .style('position', 'relative')

        container.node().append(svg.node());

        // containerElement
        this.containerElement = container.node();

        const zoom = d3.zoom()
          .scaleExtent([1, 10])
          .translateExtent([[0, 0], [width, height]])
          .filter(filter)
          .on("zoom", this.zoomed.bind(this));

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
        
        Object.assign(svg.call(zoom).node(), {reset})
    }
    /**
     * 缩放回调
     * @param {*} param0 
     */
    zoomed({ transform }) {
        this.transform = transform;
        if (this.gX) {
            this.gX.call(this.xAxis.scale(transform.rescaleX(this.xScale)))
        }
        if (this.gY) {
            this.gY.call(this.yAxis.scale(transform.rescaleY(this.yScale)))
            .call(g => g.select(".domain")
            .remove())
            .call(g => g.selectAll("line")
                .attr("stroke-opacity", 0.5)
                .attr("stroke-dasharray", "2,2"))
            .call(g => g.selectAll(".tick text")
            .attr("x", 10)
            .attr("dy", -4));;
        }
    
        this._drawMainView(this.svg);
    }
    /**
     * 绘制X坐标
     */
    drawXAxis () {
      const { height } = this.boxModel;
      const { left, bottom } = this.boxModel.margin;

      this.gX = this.svg.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", `translate(${left}, ${height - bottom})`)
        .style("font-size", styleConfig.fontSize + 'px')
        .style("color", styleConfig.color)
        .call(this.xAxis.bind(this))
    }

    drawYAxis () {
      const { top } = this.boxModel.margin;
      this.gY = this.svg.append("g")
            .attr("class", "axis axis--y")
            .attr("transform", `translate(0, ${top})`)
            .style("font-size", styleConfig.fontSize + 'px')
            .style("color", styleConfig.color)
            .call(this.yAxis.bind(this))
            .call(g => g.select(".domain")
            .remove())
            .call(g => g.selectAll("line")
                .attr("stroke-opacity", 0.5)
                .attr("stroke-dasharray", "2,2"))
            .call(g => g.selectAll(".tick text")
            .attr("x", 10)
            .attr("dy", -4));
    }
    /**
     * 绘制色卡图例
     */
    drawColorCardLegend () {
        const { bottom } = this.boxModel.margin;
        
        const colorCardLegend = getColorCardLegendDom(this.rectColors, this.overlayType);

        d3.select(colorCardLegend)
            .style('position', 'absolute')
            .style('right', 0 + 'px')
            .style('bottom', bottom - 10 + 'px');

        this.containerElement.append(colorCardLegend);
    }

    /**
     * 绘制风羽图例
     */
     drawWindLegend () {
        const { top } = this.boxModel.margin;

        const windLegend = getWindLegendDom(this.windColors);

        d3.select(windLegend)
            .style('position', 'absolute')
            .style('right', 0 + 'px')
            .style('top', top + 'px');
            
        this.containerElement.append(windLegend);
    }

    setTooltipShow (show) {
        this.tooltipShow = show;
        if (this.svg) {
            if (this.tooltipShow) {
                this.svg.on('mousemove', (event) => { 
                    this._tooltipPickUp(event.offsetX, event.offsetY)
                });
            } else {
                this.svg.on('mousemove', () => {});
                this.tooltip.removeElement();
            }
        }
    }

    /**
     * 
     * @param {*} offsetX 
     * @param {*} offsetY 
     */
    tooltipPickUp (offsetX, offsetY) {
        const { width, height } = this.boxModel;
        const { top, right, left, bottom } = this.boxModel.margin;

        const x = offsetX - left;
        const y = offsetY - top;
        if (top <= offsetY && offsetY <= height - bottom && offsetX >= left && offsetX <= width - right) {
            const timeStamp = this.widthPiexlToColDataVal(x, this.transform);
            const height = this.heightPiexlToRowDataVal(y, this.transform);
            
            let pickUpX = -1, pickUpY = -1;
            let deltaTime = Infinity;    
            for(let i = 0; i < this.data.length; i++){
                const absDiff = Math.abs(this.data[i][this.timeStampLabel] - timeStamp);
                if (absDiff < deltaTime) {
                    deltaTime = this.data[i][this.timeStampLabel] - timeStamp;
                    pickUpX = i;
                }
            }

            const metricList = this.data[pickUpX][this.altitudeListLabel] || [];
            for(let k = 0; k < metricList.length; k++) {
                if (+metricList[k][this.altitudeLabel] < height && height <= +metricList[metricList.length -1][this.altitudeLabel]) {
                    let delta1 = Math.abs(height - (+metricList[k][this.altitudeLabel]));
                    let delta2 = Math.abs(height - (+metricList[k + 1] ? +metricList[k + 1][this.altitudeLabel] : 0));
                    pickUpY = delta1 < delta2 ? k : k + 1;
                }
            }
            if (metricList.length > 0 && metricList[pickUpY]) {
                const groundTime = moment(this.data[pickUpX][this.timeStampLabel]).format('YYYY-MM-DD HH:mm:ss');

                const { hei, vv, vh, cn2, dir, chop } = metricList[pickUpY];
                let options = [
                    { name: '时间:', value: groundTime, unit: '' },
                    { name: '高度:', value: hei, unit: 'm' },
                    { name: '风向:', value: dir, unit: '°' },
                    { name: '风速',  value: vh, unit: 'm/s' },
                    { name: '垂直风速', value: vv, unit: 'm/s' },
                    { name: 'CN²', value: cn2, unit: '' },
                    { name: '风切变', value: chop, unit: 'l/s' }
                ]
                this.tooltip.updateElement(options, offsetX, offsetY);
            } else {
                this.tooltip.removeElement();
            }
        } else {
            this.tooltip.removeElement();
        }
    }
    /**
     * 销毁
     */
    destroy () {
        if (this.containerElement) {
            this.containerElement.remove();
        }

        if (this.tooltip) {
            this.tooltip.destroy();
        }
        
        this._drawMainView.cancel();
        this._tooltipPickUp.cancel();

        this.data = null;

        this.transform = null;

        this.svg = null;

        this.bboxData = null;
        this.bboxView = null;
        this.boxModel = null;
        this.xScale = null;
        this.yScale = null;
        this.invertXScale = null;
        this.invertYScale = null;
        this.xAxis = null;
        this.yAxis = null;
    }
}
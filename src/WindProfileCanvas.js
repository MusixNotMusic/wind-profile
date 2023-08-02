import * as d3 from 'd3';
import debounce from 'lodash.debounce';
import throttle from 'lodash.throttle';
import defaultsDeep from 'lodash.defaultsdeep';
import moment from 'moment';
import { rectColors, windColors } from './color';
import { windPaths, pathsCenter, styleConfig } from './constant';
import { getColorCardLegendDom, getWindLegendDom } from './Legend';
import { Tooltip } from './Tooltip';

export class WindProfileCanvas {
    constructor(data, options, boxModel) {
        this.bboxView = null; // 视图范围
        this.bboxData = null; // 数据边界
        this.boxModel = null; // 数据窗口

        this._tooltipPickUp = throttle(this.tooltipPickUp.bind(this), 30);
        
        this.data = data.slice(200);

        // options
        this.overlay = options.overlay || false;

        this.overlayType = options.overlayType || 11;

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

        this.styleConfig = defaultsDeep(options.styleConfig ? options.styleConfig : {}, styleConfig);
        console.log(this.styleConfig, options.styleConfig)
        this.transform = d3.zoomIdentity;
        // 盒子模型
        this.boxModel = boxModel;
        // 计算 数据区间
        this.calculateBboxData();
        // 计算 视图范围
        this.calculateBboxView();
        // 创建比例尺
        this.createScale();
        // 创建坐标轴
        // this.createAxis();
        // 创建 svg
        this.createCanvasDom();

        // ========DRAW===========
        // 绘制 色卡图例
        this.overlay && this.drawColorCardLegend();
        // 绘制 风羽图例
        this.drawWindLegend();

        this.drawXAxis();

        this.drawYAxis();

        this.drawRect(this.data);

        this.drawWindProfile(this.data);


        // this.tooltip = new Tooltip({}, this.containerElement, this.boxModel, this.styleConfig);

        // this.setTooltipShow(this.tooltipShow);

        window.wind = this;
    }

    /**
     * 计算数据真实 数值范围
     */
    calculateBboxData () {
        let maxTimeStamp = 0;
        let minTimeStamp = Infinity;
        let maxHeight = 0;
        let heightSize = 0;
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
                heightSize = metricList.length - 1;
            }
        })
        this.widthSize = this.data.length;
        this.heightSize = heightSize;
        console.log(minTimeStamp, maxTimeStamp, maxHeight);
        this.bboxData = { maxX: maxTimeStamp, minX: minTimeStamp, minY: 0, maxY: maxHeight };
    }
    
    /**
     * 计算视图 盒子范围
     */
    calculateBboxView () {
        const { width, height } = this.boxModel;
        const { top, right, bottom, left } = this.boxModel.margin;

        this.unitWidthPixel = (width - left - right) / this.widthSize;
        this.unitHeightPixel = (height - top - bottom) / this.heightSize;

        this.bboxView = { minX: left, maxX: width - right, minY: height - bottom, maxY: top }
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
            .domain([minX, maxX])
            .range([viewMinX, viewMaxX])

        this.invertXScale = this.xScale.invert;

        this.yScale = d3.scaleLinear()
            .domain([minY, maxY])
            .range([viewMinY, viewMaxY])

        this.invertYScale = this.yScale.invert;
    }
    

    /**
     * 格式化时间
     */
     timeFormat (timeStamp) {
        const formatDateString = 'YYYY-MM-DD';
        const formatTimeString = 'HH:mm';
        return  { 
          date: moment(timeStamp).format(formatDateString),
          time: moment(timeStamp).format(formatTimeString)
        }
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
     * 截取可视区
     */
    clipViewBox (ctx) {
      const { width, height } = this.boxModel;
      const { top, right, bottom, left } = this.boxModel.margin;

      ctx.beginPath();
      ctx.rect(left + 1, top, width - right - left - 1, height - top - bottom - 1);
      ctx.clip();
    }

    /**
     * 叠加 cn2 风切变
     * @param {*} filterArr 
     */

    drawRect (filterArr) {
      const ctx = this.gridCanvas.getContext('2d');
      // clip view box
      this.clipViewBox(ctx);

      console.time('drawRect');
      filterArr.forEach(item => {
          const x = this.xScale(item[this.timeStampLabel]);
          item[this.altitudeListLabel].forEach((mtr, idx)=> {
              ctx.beginPath();
              let y = this.yScale(+mtr[this.altitudeLabel]);
              let index = this.windOverlayValueFunction ? this.windOverlayValueFunction(mtr) : (mtr.cn2 * 1e10 | 0);
              index = index > this.windPaths.length ? this.windPaths.length - 1 : index;
              ctx.fillStyle = this.rectColors[index % this.rectColors.length]
              ctx.rect(x - this.unitWidthPixel / 2, y - this.unitHeightPixel / 2, this.unitWidthPixel, this.unitHeightPixel);
              ctx.fill();
          })
      })

      console.timeEnd('drawRect');
  }
    /**
     * 绘制风羽图
     * @param {*} filterArr 
     */
    drawWindProfile (filterArr) {
      const ctx = this.gridCanvas.getContext('2d');
      // clip view box
      this.clipViewBox(ctx);

      console.time('drawWindProfile');
      filterArr.forEach(item => {
          const x = this.xScale(item[this.timeStampLabel]);
          item[this.altitudeListLabel].forEach((mtr, idx)=> {
              ctx.beginPath();
              let y = this.yScale(+mtr[this.altitudeLabel]);
              let index = this.windValueFunction ? this.windValueFunction(mtr) : (mtr.vh | 0);
              index = index > this.windPaths.length ? this.windPaths.length - 1 : index;
              const path = this.windPaths[index];
              const color = this.windColors[index | 0];
              const p = new Path2D();
              const centerX = pathsCenter[index].x;
              const centerY = pathsCenter[index].y;
              const scaleX = this.unitWidthPixel < centerX * 2 ? this.unitWidthPixel / centerX * 0.5 : 1;
              const scaleY = this.unitHeightPixel < centerY * 2 ? this.unitHeightPixel / centerX * 0.5 : 1;
              // const scaleY = this.unitHeightPixel / centerY * 0.5;
              p.addPath(new Path2D(path), new DOMMatrix().translate(x - centerX, y -centerY).scale(scaleX, scaleY).rotate(+mtr[this.directionLabel]))
              ctx.fillStyle = color;
              ctx.fill(p);
          })
      })

      console.timeEnd('drawWindProfile');
    }

    createCanvasDom () {
        const { width, height } = this.boxModel;
        const { top, right, left, bottom } = this.boxModel.margin;
      

        this.gridCanvas = document.createElement('canvas');
        this.gridCanvas.width = width;
        this.gridCanvas.height = height;
        this.gridCanvas.style.position = "absolute"
        this.gridCanvas.style.top = "0"
        this.gridCanvas.style.left = "0"

        this.profileCanvas = document.createElement('canvas');
        this.profileCanvas.width = width;
        this.profileCanvas.height = height;
        this.profileCanvas.style.position = "absolute"
        this.profileCanvas.style.top = "0"
        this.profileCanvas.style.left = "0"
        this.profileCanvas.style.pointerEvents = "none"

        // container
        const container = d3.create("div")
             .attr('id', 'w-p-container')
             .style('width', width + 'px')
             .style('height', height + 'px')
             .style('position', 'relative')
             .style('border', '1px solid steelblue')

        container.node().append(this.gridCanvas);
        container.node().append(this.profileCanvas);

        // containerElement
        this.containerElement = container.node();
       
    }

    _drawXAxis (context, xScale, Y, xExtent) {
        const [startX, endX] = xExtent;
        let tickSize = 6,
            xTicks = xScale.ticks(12), // You may choose tick counts. ex: xScale.ticks(20)
            xTickFormat = this.timeFormat; // you may choose the format. ex: xScale.tickFormat(tickCount, ".0s")

        context.translate(0.5, 0.5);
        context.strokeStyle = "black";
        context.lineWidth = 1;

        context.beginPath();
        xTicks.forEach((d, index) => {
            context.moveTo(xScale(d), Y);
            context.lineTo(xScale(d), Y + tickSize);
        });
        context.stroke();

        context.beginPath();
        // context.moveTo(startX, Y - tickSize);
        // context.lineTo(startX, Y);
        context.moveTo(startX, Y);
        context.lineTo(endX, Y);
        context.lineTo(endX, Y + tickSize);
        context.stroke();

        context.textAlign = "center";
        context.textBaseline = "top";
        context.fillStyle = "black";
        xTicks.forEach(d => {
            const {date, time} = this.timeFormat(d);
            context.beginPath();
            context.fillText(date, xScale(d), Y + tickSize * 2);
            context.fillText(time, xScale(d), Y + tickSize * 4);
        });
    }
    /**
     * 绘制X坐标
     */
    drawXAxis () {
      const { width, height } = this.boxModel;
      const { left, right, bottom } = this.boxModel.margin;
      const ctx = this.gridCanvas.getContext('2d');
      this._drawXAxis(ctx, this.xScale, height - bottom, [left, width - right]);  
    }

    _drawYAxis = (context, yScale, X, yExtent) => {
        const [startY, endY] = yExtent;
      
        const tickPadding = 3,
          tickSize = 6,
          yTicks = yScale.ticks(),
          yTickFormat = yScale.tickFormat();
      
        context.strokeStyle = "black";
        context.beginPath();
        yTicks.forEach((d, index) => {
          context.moveTo(X, yScale(d));
          context.lineTo(X - tickSize, yScale(d));
        });
        context.stroke();
      
        context.beginPath();
        // context.moveTo(X + tickSize, startY);
        // context.lineTo(X, startY);
        context.moveTo(X, startY);
        context.lineTo(X, endY);
        context.lineTo(X - tickSize, endY);
        context.stroke();
      
        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillStyle = "black";
        yTicks.forEach(d => {
          context.beginPath();
          context.fillText(yTickFormat(d), X - tickSize - tickPadding, yScale(d));
        });
      }

    drawYAxis () {
      const { top } = this.boxModel.margin;
      const { width, height } = this.boxModel;
      const { left, right, bottom } = this.boxModel.margin;
      const ctx = this.gridCanvas.getContext('2d');
      this._drawYAxis(ctx, this.yScale, left, [height - bottom, top]); 
    }
    /**
     * 绘制色卡图例
     */
    drawColorCardLegend () {
        const { bottom } = this.boxModel.margin;
        
        const colorCardLegend = getColorCardLegendDom(this.rectColors, this.overlayType, this.styleConfig);

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

        const windLegend = getWindLegendDom(this.windColors, this.styleConfig);

        d3.select(windLegend)
            .style('position', 'absolute')
            .style('right', 0 + 'px')
            .style('top', top + 'px');
            
        this.containerElement.append(windLegend);
    }

    // setTooltipShow (show) {
    //     this.tooltipShow = show;
    //     if (this.svg) {
    //         if (this.tooltipShow) {
    //             this.svg.on('mousemove', (event) => { 
    //                 this._tooltipPickUp(event.offsetX, event.offsetY)
    //             });
    //         } else {
    //             this.svg.on('mousemove', () => {});
    //             this.tooltip.removeElement();
    //         }
    //     }
    // }

    /**
     * 
     * @param {*} offsetX 
     * @param {*} offsetY 
     */
    tooltipPickUp (offsetX, offsetY) {
        // const { width, height } = this.boxModel;
        // const { top, right, left, bottom } = this.boxModel.margin;

        // const x = offsetX - left;
        // const y = offsetY - top;
        // if (top <= offsetY && offsetY <= height - bottom && offsetX >= left && offsetX <= width - right) {
        //     const timeStamp = this.widthPiexlToColDataVal(x, this.transform);
        //     const height = this.heightPiexlToRowDataVal(y, this.transform);
            
        //     let pickUpX = -1, pickUpY = -1;
        //     let deltaTime = Infinity;    
        //     for(let i = 0; i < this.data.length; i++){
        //         const absDiff = Math.abs(this.data[i][this.timeStampLabel] - timeStamp);
        //         if (absDiff < deltaTime) {
        //             deltaTime = this.data[i][this.timeStampLabel] - timeStamp;
        //             pickUpX = i;
        //         }
        //     }

        //     const metricList = this.data[pickUpX][this.altitudeListLabel] || [];
        //     for(let k = 0; k < metricList.length; k++) {
        //         if (+metricList[k][this.altitudeLabel] < height && height <= +metricList[metricList.length -1][this.altitudeLabel]) {
        //             let delta1 = Math.abs(height - (+metricList[k][this.altitudeLabel]));
        //             let delta2 = Math.abs(height - (+metricList[k + 1] ? +metricList[k + 1][this.altitudeLabel] : 0));
        //             pickUpY = delta1 < delta2 ? k : k + 1;
        //         }
        //     }
        //     if (metricList.length > 0 && metricList[pickUpY]) {
        //         const groundTime = moment(this.data[pickUpX][this.timeStampLabel]).format('YYYY-MM-DD HH:mm:ss');

        //         const { hei, vv, vh, cn2, dir, chop } = metricList[pickUpY];
        //         let options = [
        //             { name: '时间:', value: groundTime, unit: '' },
        //             { name: '高度:', value: hei, unit: 'm' },
        //             { name: '风向:', value: dir, unit: '°' },
        //             { name: '风速',  value: vh, unit: 'm/s' },
        //             { name: '垂直风速', value: vv, unit: 'm/s' },
        //             { name: 'CN²', value: cn2, unit: '' },
        //             { name: '风切变', value: chop, unit: 'l/s' }
        //         ]
        //         this.tooltip.updateElement(options, offsetX, offsetY);
        //     } else {
        //         this.tooltip.removeElement();
        //     }
        // } else {
        //     this.tooltip.removeElement();
        // }
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
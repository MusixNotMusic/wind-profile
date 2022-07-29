# WindProfile

## 1. 使用方式
```js
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
```

## 2. 数据结构 data

```json
[{
        "station": "xxxx",
        "stationId": "YW0001",
        "time": "20210520175420",
        "gv": "0.00",
        "gd": "78.77",
        "gt": "0.00",
        "gh": "0.00",
        "metricList": [
            {
                "hei": "0",
                "vh": "0.00",
                "dir": "0.00",
                "vv": "0.00",
                "cn2": "0.00e+00",
                "chop": "0.0137"
            },
            {
                "hei": "100",
                "vh": "1.37",
                "dir": "9.63",
                "vv": "0.15",
                "cn2": "4.84e-12",
                "chop": "0.0109"
            },
            ...
            {
                "hei": "5300",
                "vh": "0.50",
                "dir": "122.47",
                "vv": "-4.76",
                "cn2": "4.86e-09",
                "chop": "0.0000"
            }
        ],
        "dateFormat": "YYYYMMDDHHmmss",
        "groundTime": "2021-05-20 17:54:20"
    }]
```

## 3. 配置内容 
|参数名|类型|默认值|描述|例子|
|:----|:----|:----|:----|:----:|
| overlay | boolean | false | 是否叠加cn2、风切变 |--| 
| overlayType | number | 11 | 叠加产品的类型 （0 风羽图，1 垂直气流， 2 CN2, 11 风切变） |--| 
| windValueFunction | function | undefined | 回调函数映射风羽图风矢图Path路径对应索引 | (item)=> { return +item.vh | 0; }|
| windValueFunction | function | undefined | 回调函数映射cn2、风切变色卡对应索引 | (item)=> { return +item.cn2 * 1e10 | 0;}|
| altitudeListLabel | string | metricList | 对应数据中metricList字段，可根据自定义数据结构修改 |--| 
| altitudeLabel | string | hei | 对应数据中metricList数组内hei字段，可根据自定义数据结构修改 |--| 
| timeStampLabel | string | timeStamp | 对应数据中timeStamp字段，可根据自定义数据结构修改 |--|
| directionLabel | string | dir |  对应数据中metricList数组内dir字段，可根据自定义数据结构修改 |--|
| tooltip.show | boolean | false |  是否显示tooltip |--|
| windColors | Array | ['#00ff00', '#00ff00', '#00ff00', '#00ff00','#0000ff', '#0000ff', '#0000ff', '#ff00ff', '#ff00ff', '#ff00ff', '#ff00ff', '#ff00ff', '#ff00ff', '#ff00ff', '#ff00ff', '#ff0000', '#ff0000', '#ff0000', '#ff0000'] |  风羽图、风矢图色卡 |--|
| rectColors | Array | ['#FFF', '#C7FFC7', '#94FF93', '#5DFF5D', '#26FF26', '#0CF219', '#43BB86', '#7A84F4', '#9780E7', '#B180CD', '#CD80B1', '#E78097', '#FF8080'] |  叠加图色卡 |--|
| windPaths | Array | svg path2D 数组 |  风羽路径 |--|
| styleConfig | Object | -- |  styleConfig |--|

### styleConfig

|参数名|默认值|描述|
|:----|:----|:----:|
|backgourndColor|#0b1f21|画布背景颜色|
|fontSize|12|全局字号|
|color|white|全局字体颜色|
|tooltip.fontSize|12| tooltip字号 |
|tooltip.color|white|tooltip字体颜色|
|tooltip.background|rgba(0, 0, 0, 0.8)|tooltip背景颜色|

## 4. boxModel 盒子模型
|参数名|默认值|描述|
|:----|:----|:----:|
|width|1200| 盒子宽度 |
|height|600| 盒子高度 |
|margin.top|30| 盒子marginTop|
|margin.right|80| 盒子marginRight |
|margin.bottom|30|盒子marginBottom|
|margin.left|60|盒子marginLeft|



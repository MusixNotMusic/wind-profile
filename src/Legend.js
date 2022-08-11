import { windRange, windPaths, styleConfig } from './constant';

/**
 * 设置是否叠加，叠加的类型
 * @param type 叠加产品的类型 （0 风羽图，1 垂直气流， 2 CN2, 11 风切变）
 */
export function getColorCardLegendDom (colors, type, styleConfig) {
    let colorToValueArr = [];
    let unit = '';
    let linearGradientStyle;
    switch (type) {
      case 0:
        colorToValueArr = [40, 36, 32, 28, 24, 20, 18, 12, 8, 4, 0];
        unit = 'm/s';
        linearGradientStyle = getColorBarStyle(colors);
        break
      case 1:
        colorToValueArr = colorCalcRage(-2, 8);
        unit = 'm/s';
        linearGradientStyle = getColorBarStyle(colors);
        break
      case 2:
        colorToValueArr = [1e-13, 1e-11, 2e-11, 3e-11, 4e-11, 5e-11, 6e-11, 7e-11, 8e-11, 9e-11, 1e-10].reverse();
        unit = 'cn2';
        linearGradientStyle = getColorBarStyle(colors);
        break
      case 11:
        colorToValueArr = [0, 0.02, 0.04, 0.06, 0.08, 0.10, 0.12, 0.14, 0.16, 0.18, 0.20, 0.22, 0.24].reverse();
        unit = '风切变(l/s)';
        linearGradientStyle = getColorBarStyle(colors);
        break
    }
    return generateDom(linearGradientStyle, colorToValueArr, unit, styleConfig);
}

/**
 * 获取风羽图图例
 * @param {*} colors 
 */
export function getWindLegendDom (colors, styleConfig) {
    let colorsVal = [];
    const iconsPath = [];
    for (let len = windRange.length - 1, i = len - 1; i >= 0; i--) {
        colorsVal.push(windRange[i][1])
        iconsPath.push({ color: colors[i], path: windPaths[i] })
    }
    colorsVal = ['≥30', '10-30', '6-10', '0-5'];
    const path = [iconsPath[0], iconsPath[5], iconsPath[12], iconsPath[15]];
    // dom
    const parser = new window.DOMParser();
    const chartColorStyle = `width: 70px; height: 100%; display: flex; flex-direction: column; font-size: ${styleConfig.fontSize}px; color: ${styleConfig.color}`;
    const iconBarStyle = ` display: flex; flex-direction: column; height: 133px; width: 100%;`;
    const svgContainerStyle = `height: 20px; display: flex; align-items: center; margin: 0px; margin-left: 12px;`;
    const svgStyle = `transform: rotate(90deg);`;
    const spanStyle = `margin-left: 16px;`;
    const unitStyle = 'height: 20px; text-align: left;';


    const htmlString = `
        <div style="${chartColorStyle}"> 
            <div style="${unitStyle}">m/s</div>
            <div style="${iconBarStyle}">
                ${path.map((icon, i) => `
                <div style="${svgContainerStyle}">
                    <svg style="${svgStyle}" viewBox="0 0 9 30" width="9px" height="30px">
                        <path fill="${icon.color}" d="${icon.path}"></path>
                    </svg>
                    <span style="${spanStyle}">${colorsVal[i]}</span>
                </div>`).join(' ')}
            </div>
        </div>`;

    const doc = parser.parseFromString(htmlString, "text/html");
    return doc.body.children[0];
}

/**
 * 生成 色卡
 * @param {*} linearGradientStyle 
 * @param {*} colorToValueArr 
 * @param {*} unit 
 * @returns 
 */
function generateDom (linearGradientStyle, colorToValueArr, unit, styleConfig) {
    const parser = new window.DOMParser();
    const chartColorStyle = `width: 70px; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; font-size: ${styleConfig.fontSize}px; color: ${styleConfig.color}`;
    const unitStyle = 'height: 20px; text-align: left;';
    const colorListStyle = 'height: 328px; margin-bottom: 10px; display: flex; align-items: center;';
    const colorBarStyle = 'width: 24px; height: 100%;';
    const colorValStyle = 'margin-left: 6px; height: 100%; display: flex; flex-direction: column; justify-content: space-between;';
    console.log(colorToValueArr.map(ctv => `<span>${ctv}</span>`))
    const htmlString = `
        <div style="${chartColorStyle}"> 
            <div style="${unitStyle}" >${unit}</div>
            <div style="${colorListStyle}">
                <div style="background: ${linearGradientStyle.background}; ${colorBarStyle}"></div>
                <div style="${colorValStyle}">
                    ${colorToValueArr.map(ctv => `<span>${ctv}</span>`).join(' ')}
                </div>
            </div>
        </div>`;

    const doc = parser.parseFromString(htmlString, "text/html")
    return doc.body.children[0];
}

/**
 * 
 * @param {*} min 
 * @param {*} max 
 * @returns 
 */
function colorCalcRage (min, max, size = 10) {
    const per = (max - min) / size;
    const arr = []
    for (let i = 0; i < size; i++) {
      arr.push(Number(min + per * i).toFixed(1))
    }
    arr.push(max.toFixed(1))
    arr.reverse()
    return arr
}

/**
 * 生成色卡
 * @param {*} colorArr 
 * @returns 
 */
function getColorBarStyle (colorArr) {
    console.log('getColorBar colorArr', colorArr)
    let str = ''
    const len = colorArr.length
    const per = 100 / (colorArr.length - 1)
    for (let i = 0; i < len; i++) {
      str += ' ' + colorArr[len - i - 1] + ' ' + per * i + '%,'
    }
    str = str.substr(0, str.length - 1)
    const bg = `linear-gradient(to bottom,${str})`
    return { background: bg }
}
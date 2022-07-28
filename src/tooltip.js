import Vue from 'vue';
import { config } from './constant';
// import debounce from 'lodash.debounce';
export class Tooltip {
    constructor (options, parentNode, bbox) {
        this.id = 'w-p-tooltip-' + Date.now(); 
        this.bbox = bbox;
        this.options = options;
        this.parentNode = parentNode;
        this.vue = null;
        this.show = false;
        window.tooltip = this;
    }

    createElemet (offsetX, offsetY) {
        this.removeElement();
        const _offsetX = 10;
        const _offsetY = 10;
        offsetX += _offsetX;
        offsetY += _offsetY;

        const tooltipStyle = `position: absolute; top: ${offsetY}px; left: ${offsetX}px; min-width: 150px; padding: 10px; border-radius:3px; font-size: ${config.tooltip.fontSize}px; color: ${config.tooltip.color}; background: ${config.tooltip.background}; pointer-events: none;`
        const itemStyle = `display: flex; justify-content: space-between; align-items: center;`
        const htmlTemplate = `
            <div id="${this.id}" style="${tooltipStyle}">
                ${this.options.map(item => {
                    return `
                    <div style="${itemStyle}">
                        <span style="margin-right: 5px;">${item.name}</span>
                        <span>${item.value} ${item.unit}</span>
                    </div> `
                }).join('')}
            </div>
        `;

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlTemplate, "text/html");
        const dom = doc.body.children[0];
        this.parentNode.append(dom);

        const { width, height } = dom.getBoundingClientRect();

        let translateX = 0;
        let translateY = 0;
        if (offsetX + width > (this.bbox.width - this.bbox.right)) {
            translateX = -width - 2 * _offsetX + 'px';
        }

        if (offsetY + height > (this.bbox.height - this.bbox.bottom)) {
            translateY = -height - 2 * _offsetY + 'px';
        }
        dom.style.transform = `translate(${translateX}, ${translateY})`;
    }

    removeElement () {
        const dom = document.getElementById(this.id);
        if (dom) dom.remove();
    }

    updateElement (options, offsetX, offsetY) {
        this.options = options;
        this.createElemet(offsetX, offsetY);
    }
}
/*
 * Copyright (c) 2023 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-12-17 18:28:19
 * @FilePath     : /src/libs/setting-utils.ts
 * @LastEditTime : 2024-04-27 16:38:09
 * @Description  : 
 */

import { Plugin, Setting } from 'siyuan';

export class SettingUtils {
    plugin: Plugin;
    name: string;
    file: string;

    settings: Map<string, ISettingItem> = new Map();
    elements: Map<string, HTMLElement> = new Map();

    constructor(plugin: Plugin, name?: string, callback?: (data: any) => void, width?: string, height?: string) {
        this.name = name ?? 'settings';
        this.plugin = plugin;
        this.file = this.name.endsWith('.json') ? this.name : `${this.name}.json`;
        this.plugin.setting = new Setting({
            width: width,
            height: height,
            confirmCallback: () => {
                for (let key of this.settings.keys()) {
                    this.updateValueFromElement(key);
                }
                let data = this.dump();
                if (callback !== undefined) {
                    callback(data);
                } else {
                    this.plugin.data[this.name] = data;
                    this.save();
                }
            },
            destroyCallback: () => {
                //从值恢复元素
                for (let key of this.settings.keys()) {
                    this.updateElementFromValue(key);
                }
            }
        });
    }

    async load() {
        let data = await this.plugin.loadData(this.file);
        console.debug('Load config:', data);
        if (data) {
            for (let [key, item] of this.settings) {
                item.value = data?.[key] ?? item.value;
            }
        }
        this.plugin.data[this.name] = this.dump();
        return data;
    }

    async save() {
        let data = this.dump();
        await this.plugin.saveData(this.file, this.dump());
        console.debug('Save config:', data);
        return data;
    }

    /**
     * read the data after saving
     * @param key key name
     * @returns setting item value
     */
    get(key: string) {
        return this.settings.get(key)?.value;
    }

    /**
      * Read in real time, 
      * do not read from the configuration file
      * @param key key name
      * @returns value in html 
      */
    take(key: string) {
        let element = this.elements.get(key) as any;
        if (!element){
            return
        }
        this.settings.set(key, element.value)
        return element.value 
    }

    /**
     * Set data to this.settings, 
     * but do not save it to the configuration file
     * @param key key name
     * @param value value
     */
    set(key: string, value: any) {
        let item = this.settings.get(key);
        if (item) {
            item.value = value;
            this.updateElementFromValue(key);
        }
    }

    /**
     * Set and save setting item value
     * If you want to set and save immediately you can use this method
     * @param key key name
     * @param value value
     */
    async setAndSave(key: string, value: any) {
        let item = this.settings.get(key);
        if (item) {
            item.value = value;
            this.updateElementFromValue(key);
            await this.save()
        }
    }

    /**
     * Read data from html and save it
     * @param key key name
     * @param value value
     * @return value in html 
     */
    async takeAndSave(key: string) {
        let value = this.take(key)
        await this.save()
        return value
    }

    /**
     * Disable setting item
     * @param key key name
     */
    disable(key: string) {
        let element = this.elements.get(key) as any;
        if (element) {
            element.disabled = true;
        }
    }

    /**
     * Enable setting item
     * @param key key name
     */
    enable(key: string) {
        let element = this.elements.get(key) as any;
        if (element) {
            element.disabled = false;
        }
    }

    /**
     * 将设置项目导出为 JSON 对象
     * @returns object
     */
    dump(): Object {
        let data: any = {};


        for (let [key, item] of this.settings) {
            if (item.type === 'button') continue;
            data[key] = item.value;
        }
        return data;
    }

    addItem(item: ISettingItem) {
        this.settings.set(item.key, item);
        let itemElement: HTMLElement;
        switch (item.type) {
            case 'checkbox':
                let element: HTMLInputElement = document.createElement('input');
                element.type = 'checkbox';
                element.checked = item.value;
                element.className = "b3-switch fn__flex-center";
                itemElement = element;
                element.onchange = item.action?.callback ?? (() => { });
                break;
            case 'select':
                let selectElement: HTMLSelectElement = document.createElement('select');
                selectElement.className = "b3-select fn__flex-center fn__size200";
                let options = item?.options ?? {};
                for (let val in options) {
                    let optionElement = document.createElement('option');
                    let text = options[val];
                    optionElement.value = val;
                    optionElement.text = text;
                    selectElement.appendChild(optionElement);
                }
                selectElement.value = item.value;
                selectElement.onchange = item.action?.callback ?? (() => { });
                itemElement = selectElement;
                break;
            case 'slider':
                let sliderElement: HTMLInputElement = document.createElement('input');
                sliderElement.type = 'range';
                sliderElement.className = 'b3-slider fn__size200 b3-tooltips b3-tooltips__n';
                sliderElement.ariaLabel = item.value;
                sliderElement.min = item.slider?.min.toString() ?? '0';
                sliderElement.max = item.slider?.max.toString() ?? '100';
                sliderElement.step = item.slider?.step.toString() ?? '1';
                sliderElement.value = item.value;
                sliderElement.onchange = () => {
                    sliderElement.ariaLabel = sliderElement.value;
                    item.action?.callback();
                }
                itemElement = sliderElement;
                break;
            case 'textinput':
                let textInputElement: HTMLInputElement = document.createElement('input');
                textInputElement.className = 'b3-text-field fn__flex-center fn__size200';
                textInputElement.value = item.value;
                textInputElement.onchange = item.action?.callback ?? (() => { });
                itemElement = textInputElement;

                break;
            case 'textarea':
                let textareaElement: HTMLTextAreaElement = document.createElement('textarea');
                textareaElement.className = "b3-text-field fn__block";
                textareaElement.value = item.value;
                textareaElement.onchange = item.action?.callback ?? (() => { });
                itemElement = textareaElement;
                break;
            case 'number':
                let numberElement: HTMLInputElement = document.createElement('input');
                numberElement.type = 'number';
                numberElement.className = 'b3-text-field fn__flex-center fn__size200';
                numberElement.value = item.value;
                itemElement = numberElement;
                break;
            case 'button':
                let buttonElement: HTMLButtonElement = document.createElement('button');
                buttonElement.className = "b3-button b3-button--outline fn__flex-center fn__size200";
                buttonElement.innerText = item.button?.label ?? 'Button';
                buttonElement.onclick = item.button?.callback ?? (() => { });
                itemElement = buttonElement;
                break;
            case 'hint':
                let hintElement: HTMLElement = document.createElement('div');
                hintElement.className = 'b3-label fn__flex-center';
                itemElement = hintElement;
                break;
        }
        this.elements.set(item.key, itemElement);
        this.plugin.setting.addItem({
            title: item.title,
            description: item?.description,
            createActionElement: () => {
                let element = this.getElement(item.key);
                return element;
            }
        })
    }

    /**
     * Set the value in the setting to the value of the element 
     * and return the element information
     * @param key key name
     * @returns element
     */
    getElement(key: string) {
        let item = this.settings.get(key);
        let element = this.elements.get(key) as any;
        switch (item.type) {
            case 'checkbox':
                element.value = element.checked ? true : false;
                element.checked = item.value;
                break;
            case 'select':
                element.value = item.value;
                break;
            case 'slider':
                element.value = item.value;
                element.ariaLabel = item.value;
                break;
            case 'textinput':
                element.value = item.value;
                break;
            case 'textarea':
                element.value = item.value;
                break;
        }
        return element;
    }

    private updateValueFromElement(key: string) {
        let item = this.settings.get(key);
        let element = this.elements.get(key) as any;
        // console.debug(element, element?.value);
        switch (item.type) {
            case 'checkbox':
                item.value = element.checked;
                break;
            case 'select':
                item.value = element.value;
                break;
            case 'slider':
                item.value = element.value;
                break;
            case 'textinput':
                item.value = element.value;
                break;
            case 'textarea':
                item.value = element.value;
                break;
        }
    }

    private updateElementFromValue(key: string) {
        let item = this.settings.get(key);
        let element = this.elements.get(key) as any;
        switch (item.type) {
            case 'checkbox':
                element.checked = item.value;
                break;
            case 'select':
                element.value = item.value;
                break;
            case 'slider':
                element.value = item.value;
                break;
            case 'textinput':
                element.value = item.value;
                break;
            case 'textarea':
                element.value = item.value;
                break;
        }
    }
}
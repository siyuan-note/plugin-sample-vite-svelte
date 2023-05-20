/**
 * Copyright (c) 2023 frostime. All rights reserved.
 * https://github.com/frostime/sy-plugin-template-vite
 */
import { Plugin, showMessage, confirm, Dialog, Menu, isMobile, openTab } from "siyuan";
import "./index.scss";

import HelloExample from "./hello.svelte";
import DockExample from "./dock.svelte";
import SettingPannel from "./libs/setting-panel.svelte";

const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

export default class SamplePlugin extends Plugin {

    counter: { [key: string]: number } = {
        hello: 0,
    };
    private customTab: () => any;

    async onload() {
        showMessage("Hello SiYuan Plugin");
        console.log(this.i18n.helloPlugin);

        const topBarElement = this.addTopBar({
            icon: "iconEmoji",
            title: this.i18n.addTopBarIcon,
            position: "left",
            callback: () => {
                this.addMenu(topBarElement.getBoundingClientRect());
            }
        });

        let div = document.createElement("div");
        new HelloExample({
            target: div,
            props: {
                name: this.i18n.name,
                i18n: this.i18n.hello
            }
        });
        this.customTab = this.addTab({
            type: TAB_TYPE,
            init() {
                this.element.appendChild(div);
                console.log(this.element);
            },
            destroy() {
                console.log("destroy tab:", TAB_TYPE);
            }
        });

        this.addDock({
            config: {
                position: "LeftBottom",
                size: { width: 200, height: 0 },
                icon: "iconEmoji",
                title: "Custom Dock",
            },
            data: {
                text: "This is my custom dock"
            },
            type: DOCK_TYPE,
            init() {
                this.component = new DockExample({
                    target: this.element,
                    props: {
                        text: this.data.text,
                    }
                });
            },
            destroy() {
                console.log("destroy dock:", DOCK_TYPE);
                this.component.$destroy();
            }
        });

    }

    private wsEvent({ detail }: any) {
        console.log(detail);
    }

    private async addMenu(rect: DOMRect) {
        const menu = new Menu("topBarSample", () => {
            console.log(this.i18n.byeMenu);
        });
        menu.addItem({
            icon: "iconHelp",
            label: "Confirm",
            click() {
                confirm("Confirm", "Is this a confirm?", () => {
                    showMessage("confirm");
                }, () => {
                    showMessage("cancel");
                });
            }
        });
        menu.addItem({
            icon: "iconFeedback",
            label: "Message",
            click: () => {
                showMessage(this.i18n.helloPlugin);
            }
        });
        menu.addItem({
            icon: "iconInfo",
            label: "Dialog",
            click: () => this.openHelloInDialog()
        });
        menu.addItem({
            icon: "iconLayoutBottom",
            label: "Open Tab",
            click: () => {
                openTab({
                    custom: {
                        icon: "iconEmoji",
                        title: "Custom Tab",
                        data: {
                            text: "This is my custom tab",
                        },
                        fn: this.customTab
                    },
                });
            }
        });
        menu.addItem({
            icon: "iconTrashcan",
            label: "Remove Data",
            click: () => {
                this.removeData(STORAGE_NAME);
            }
        });
        menu.addItem({
            icon: "iconSelect",
            label: "On ws-main",
            click: () => {
                this.eventBus.on("ws-main", this.wsEvent);
            }
        });
        menu.addItem({
            icon: "iconClose",
            label: "Off ws-main",
            click: () => {
                this.eventBus.off("ws-main", this.wsEvent);
            }
        });
        menu.addSeparator();
        menu.addItem({
            icon: "iconSparkles",
            label: this.data[STORAGE_NAME] || "Readonly",
            type: "readonly",
        });
        if (isMobile()) {
            menu.fullscreen();
        } else {
            menu.open({
                x: rect.right,
                y: rect.bottom,
                isLeft: true,
            });
        }
    }

    openSetting(): void {
        let dialog = new Dialog({
            title: "SettingPannel",
            content: `<div id="SettingPanel"></div>`,
            width: "600px",
            destroyCallback: (options) => {
                console.log("destroyCallback", options);
                //You must destroy the component when the dialog is closed
                pannel.$destroy();
            }
        });
        let pannel = new SettingPannel({
            target: dialog.element.querySelector("#SettingPanel"),
        });
    }

    private openHelloInDialog() {
        this.counter.hello++;
        let dialog = new Dialog({
            title: "Hello World",
            content: `<div id="helloPanel"></div>`,
            destroyCallback(options) {
                //You must destroy the component when the dialog is closed
                hello.$destroy();
            },
        });
        let hello = new HelloExample({
            target: dialog.element.querySelector("#helloPanel"),
            props: {
                name: this.i18n.name,
                i18n: this.i18n.hello
            }
        });
    }

    async onunload() {
        showMessage("Goodbye SiYuan Plugin");
        console.log("onunload");
    }
}

/**
 * Copyright (c) 2023 frostime. All rights reserved.
 * https://github.com/frostime/sy-plugin-template-vite
 */
import { Plugin, showMessage, Dialog } from "siyuan";
import Hello from "./hello.svelte";
import SettingPannel from "./libs/setting-panel.svelte";
import "./index.scss";

export default class SamplePlugin extends Plugin {

    counter: { [key: string]: number } = {
        hello: 0,
    };

    async onload() {
        console.log("onload");
        showMessage("Hello World");
        this.addTopBar(
            {
                icon: "iconEmoji",
                "title": "Hello SiYuan",
                "callback": () => this.openHelloInDialog()
            }
        )
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
        let hello = new Hello({
            target: dialog.element.querySelector("#helloPanel"),
            props: {
                name: this.i18n.name,
                opendCount: this.counter.hello,
                i18n: this.i18n.hello
            }
        });
    }

    async onunload() {
        showMessage("Goodbye World");
        console.log("onunload");
    }
}

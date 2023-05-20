/**
 * Copyright (c) 2023 frostime. All rights reserved.
 * https://github.com/frostime/sy-plugin-template-vite
 */
import { Plugin, showMessage, Dialog } from "siyuan";
import Hello from "./hello.svelte";
import SettingPannel from "./libs/setting-panel.svelte";
import "./index.scss";

export default class SamplePlugin extends Plugin {

    async onload() {
        console.log("onload");
        showMessage("Hello World");
        this.addTopBar(
            {
                icon: "iconEmoji",
                "title": "Hello SiYuan",
                "callback": () => this.openHelloDialog()
            }
        )
    }

    openSetting(): void {
        let dialog = new Dialog({
            title: "SettingPannel",
            content: `<div id="SettingPanel"></div>`,
            width: "600px"
        });
        new SettingPannel({
            target: dialog.element.querySelector("#SettingPanel"),
        });
    }

    private openHelloDialog() {
        let dialog = new Dialog({
            title: "Hello World",
            content: `<div id="helloPanel"></div>`,
        });
        new Hello({
            target: dialog.element.querySelector("#helloPanel"),
            props: {
                name: this.i18n.name,
            }
        });
    }

    async onunload() {
        showMessage("Goodbye World");
        console.log("onunload");
    }
}

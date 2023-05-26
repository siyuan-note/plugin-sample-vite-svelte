import { Plugin, showMessage, confirm, Dialog, Menu, isMobile, openTab, adaptHotkey } from "siyuan";
import "./index.scss";

import HelloExample from "./hello.svelte";
import SettingPannel from "./libs/setting-panel.svelte";

const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

export default class SamplePlugin extends Plugin {

    private customTab: () => any;

    async onload() {
        showMessage("Hello SiYuan Plugin");
        this.data[STORAGE_NAME] = {readonlyText: "Readonly"};

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
                size: {width: 200, height: 0},
                icon: "iconEmoji",
                title: "Custom Dock",
            },
            data: {
                text: "This is my custom dock"
            },
            type: DOCK_TYPE,
            init() {
                this.element.innerHTML = `<div class="fn__flex-1 fn__flex-column">
    <div class="block__icons">
        <div class="block__logo">
            <svg><use xlink:href="#iconEmoji"></use></svg>
            Custom Dock
        </div>
        <span class="fn__flex-1 fn__space"></span>
        <span data-type="min" class="block__icon b3-tooltips b3-tooltips__sw" aria-label="Min ${adaptHotkey("⌘W")}"><svg><use xlink:href="#iconMin"></use></svg></span>
    </div>
    <div class="fn__flex-1 plugin-sample__custom-dock">
        ${this.data.text}
    </div>
</div>`;
            },
            destroy() {
                console.log("destroy dock:", DOCK_TYPE);
            }
        });

    }

    onLayoutReady() {
        this.loadData(STORAGE_NAME);
    }

    onunload() {
        console.log(this.i18n.byePlugin);
        showMessage("Goodbye SiYuan Plugin");
        console.log("onunload");
    }

    private wsEvent({ detail }: any) {
        console.log(detail);
    }

    private blockIconEvent({detail}: any) {
        console.log(detail);
        detail.menu.addSeparator(0);
        const ids: string[] = [];
        detail.blockElements.forEach((item: HTMLElement) => {
            ids.push(item.getAttribute("data-node-id"));
        });
        detail.menu.addItem({
            index: 1,
            iconHTML: "",
            type: "readonly",
            label: "IDs<br>" + ids.join("<br>"),
        });
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
            icon: "iconLayout",
            label: "Open Float Layer(open help)",
            click: () => {
                this.addFloatLayer({
                    ids: ["20230523173319-xj1l3qu", "20230523173321-55o0w2n"],
                    defIds: ["20230523173323-imgm9tp", "20230523173324-cxu98t3"],
                    x: window.innerWidth - 768 - 120,
                    y: 32
                });
            }
        });
        menu.addItem({
            icon: "iconTrashcan",
            label: "Remove Data",
            click: () => {
                this.removeData(STORAGE_NAME).then(() => {
                    this.data[STORAGE_NAME] = {readonlyText: "Readonly"};
                });
            }
        });
        menu.addItem({
            icon: "iconScrollHoriz",
            label: "Event Bus",
            type: "submenu",
            submenu: [{
                icon: "iconSelect",
                label: "On ws-main",
                click: () => {
                    this.eventBus.on("ws-main", this.wsEvent);
                }
            }, {
                icon: "iconClose",
                label: "Off ws-main",
                click: () => {
                    this.eventBus.off("ws-main", this.wsEvent);
                }
            }, {
                icon: "iconSelect",
                label: "On click-blockicon",
                click: () => {
                    this.eventBus.on("click-blockicon", this.blockIconEvent);
                }
            }, {
                icon: "iconClose",
                label: "Off click-blockicon",
                click: () => {
                    this.eventBus.off("click-blockicon", this.blockIconEvent);
                }
            }, {
                icon: "iconSelect",
                label: "On click-pdf",
                click: () => {
                    this.eventBus.on("click-pdf", this.wsEvent);
                }
            }, {
                icon: "iconClose",
                label: "Off click-pdf",
                click: () => {
                    this.eventBus.off("click-pdf", this.wsEvent);
                }
            }, {
                icon: "iconSelect",
                label: "On click-editorcontent",
                click: () => {
                    this.eventBus.on("click-editorcontent", this.wsEvent);
                }
            }, {
                icon: "iconClose",
                label: "Off click-editorcontent",
                click: () => {
                    this.eventBus.off("click-editorcontent", this.wsEvent);
                }
            }]
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
}

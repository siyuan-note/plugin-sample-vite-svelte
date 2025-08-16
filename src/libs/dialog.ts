/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2024-03-23 21:37:33
 * @FilePath     : /src/libs/dialog.ts
 * @LastEditTime : 2025-08-16 15:39:48
 * @Description  : Kits about dialogs
 */
import { Dialog } from "siyuan";
import { Component, mount, unmount } from "svelte";

export const inputDialog = (args: {
    title: string, placeholder?: string, defaultText?: string,
    confirm?: (text: string) => void, cancel?: () => void,
    width?: string, height?: string
}) => {
    const dialog = new Dialog({
        title: args.title,
        content: `<div class="b3-dialog__content">
    <div class="ft__breakword"><textarea class="b3-text-field fn__block" style="height: 100%;" placeholder=${args?.placeholder ?? ''}>${args?.defaultText ?? ''}</textarea></div>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text" id="confirmDialogConfirmBtn">${window.siyuan.languages.confirm}</button>
</div>`,
        width: args.width ?? "520px",
        height: args.height
    });
    const target: HTMLTextAreaElement = dialog.element.querySelector(".b3-dialog__content>div.ft__breakword>textarea");
    const btnsElement = dialog.element.querySelectorAll(".b3-button");
    btnsElement[0].addEventListener("click", () => {
        if (args?.cancel) {
            args.cancel();
        }
        dialog.destroy();
    });
    btnsElement[1].addEventListener("click", () => {
        if (args?.confirm) {
            args.confirm(target.value);
        }
        dialog.destroy();
    });
};

export const inputDialogSync = async (args: {
    title: string, placeholder?: string, defaultText?: string,
    width?: string, height?: string
}) => {
    return new Promise<string>((resolve) => {
        let newargs = {
            ...args, confirm: (text) => {
                resolve(text);
            }, cancel: () => {
                resolve(null);
            }
        };
        inputDialog(newargs);
    });
}


interface IConfirmDialogArgs {
    title: string;
    content: string | HTMLElement;
    confirm?: (ele?: HTMLElement) => void;
    cancel?: (ele?: HTMLElement) => void;
    width?: string;
    height?: string;
}

export const confirmDialog = (args: IConfirmDialogArgs) => {
    const { title, content, confirm, cancel, width, height } = args;

    const dialog = new Dialog({
        title,
        content: `<div class="b3-dialog__content">
    <div class="ft__breakword">
    </div>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel">${window.siyuan.languages.cancel}</button><div class="fn__space"></div>
    <button class="b3-button b3-button--text" id="confirmDialogConfirmBtn">${window.siyuan.languages.confirm}</button>
</div>`,
        width: width,
        height: height
    });

    const target: HTMLElement = dialog.element.querySelector(".b3-dialog__content>div.ft__breakword");
    if (typeof content === "string") {
        target.innerHTML = content;
    } else {
        target.appendChild(content);
    }

    const btnsElement = dialog.element.querySelectorAll(".b3-button");
    btnsElement[0].addEventListener("click", () => {
        if (cancel) {
            cancel(target);
        }
        dialog.destroy();
    });
    btnsElement[1].addEventListener("click", () => {
        if (confirm) {
            confirm(target);
        }
        dialog.destroy();
    });
};


export const confirmDialogSync = async (args: IConfirmDialogArgs) => {
    return new Promise<HTMLElement>((resolve) => {
        let newargs = {
            ...args, confirm: (ele: HTMLElement) => {
                resolve(ele);
            }, cancel: (ele: HTMLElement) => {
                resolve(ele);
            }
        };
        confirmDialog(newargs);
    });
};


export const simpleDialog = (args: {
    title: string, ele: HTMLElement | DocumentFragment,
    width?: string, height?: string,
    callback?: () => void;
}) => {
    const dialog = new Dialog({
        title: args.title,
        content: `<div class="dialog-content" style="display: flex; height: 100%;"/>`,
        width: args.width,
        height: args.height,
        destroyCallback: args.callback
    });
    dialog.element.querySelector(".dialog-content").appendChild(args.ele);
    return {
        dialog,
        close: dialog.destroy.bind(dialog)
    };
}


export const svelteDialog = (args: {
    title: string,
    component: Component<any>, // Svelte 5 component constructor
    props?: Record<string, any>,
    width?: string,
    height?: string,
    callback?: () => void;
}) => {
    let container = document.createElement('div')
    container.style.display = 'contents';

    // 内部处理 mount
    let componentInstance = mount(args.component, {
        target: container,
        props: args.props || {}
    });

    const { dialog, close } = simpleDialog({
        ...args,
        ele: container,
        callback: () => {
            // 内部处理 unmount
            unmount(componentInstance);
            if (args.callback) args.callback();
        }
    });

    return {
        component: componentInstance,
        dialog,
        close
    }
}

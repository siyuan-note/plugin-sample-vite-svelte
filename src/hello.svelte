<!--
 * Copyright (c) 2023 frostime. All rights reserved.
 * https://github.com/frostime/sy-plugin-template-vite
-->
<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { version } from "./api";
    import { showMessage } from "siyuan";
    export let name: string;
    export let i18n: any;

    let time;
    let ver;

    let intv1 = setInterval(async () => {
        time = new Date();
    }, 1000);

    let intv2 = setInterval(async () => {
        ver = await version();
        showMessage(
            `Hello ${name} v${ver}`,
            5000
        );
    }, 10000);

    onMount(async () => {
        time = new Date();
        ver = await version();
    });

    /**
     * You must call this function when the component is destroyed.
    */
    onDestroy(() => {
        showMessage("Hello panel closed");
        clearInterval(intv1);
        clearInterval(intv2);
    });

    $: time_str = new Date(time).toLocaleTimeString();

</script>

<div id="hello">
    <div class="fn__flex">
        <div class="fn__flex-1">
            <h2>Hello {name} v{ver}</h2>
        </div>
        <div class="fn__flex-1 b3-label__text __text-alignright">
            {time_str}
        </div>
    </div>

    <br />

    <div class="fn__flex-column">
        <div class="fn__flex-1">
            <ul class="b3-list b3-list--background">
                <li class="b3-list-item">
                    <span class="b3-list-item__text">
                        {@html i18n.makesure}
                    </span>
                </li>
            </ul>
        </div>
        <div class="fn__space-column"></div>
    </div>

</div>

<style lang="scss">
    #hello {
        margin: 20px;
    }
    .__text-alignright {
        text-align: right;
    }
    .fn__space-column {
        height: 8px;
        display: inline-block;
        flex-shrink: 0;
    }
</style>

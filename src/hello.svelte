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
    });

    $: time_str = new Date(time).toLocaleTimeString();

</script>

<div id="hello">
    <div class="fn__flex">
        <div class="fn__flex-1">
            <h2>Hello {name} v{ver}</h2>
        </div>
        <div class="fn__flex-1 b3-label__text __text-right">
            {time_str}
        </div>
    </div>

    <div>
        <p>{@html i18n.makesure}</p>
    </div>

</div>

<style lang="scss">
    #hello {
        margin: 20px;
        div {
            margin-bottom: 10px;
        }
    }
    .__text-right {
        text-align: right;
    }
</style>

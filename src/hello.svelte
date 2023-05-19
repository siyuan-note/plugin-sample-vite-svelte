<!--
 * Copyright (c) 2023 frostime. All rights reserved.
 * https://github.com/frostime/sy-plugin-template-vite
-->
<script lang="ts">
    import { onMount } from "svelte";
    import { version } from "./api";
    export let name: string;

    let time;
    let ver;

    onMount(async () => {
        time = new Date();
        ver = await version();
    });

    $: time_str = new Date(time).toLocaleTimeString();

    setInterval(async () => {
        time = new Date();
    }, 1000);

</script>

<div id="hello">
    <div class="row">
        <div class="col left">
            <h2>Hello {name} v{ver}</h2>
        </div>
        <div class="col right">
            {time_str}
        </div>
    </div>

    <br />

    <p>
        使用这个模板之前，请阅读<a
            href="https://github.com/siyuan-note/plugin-sample">官方教程</a
        >, 确保自己已经理解了插件的基本开发流程。
    </p>

    <p>
        Before using this template, please read the <a
            href="https://github.com/siyuan-note/plugin-sample">offical sample</a
        >, make sure that you've known about the pipeline for plugin developing.
    </p>
</div>

<style lang="scss">
    #hello {
        margin: 1rem;
        text-align: left;
    }
    .row {
        display: flex;
        flex-direction: row;

        .col {
            flex: 1;
        }
        .left {
            text-align: left;
        }
        .right {
            text-align: right;
        }
    }
</style>

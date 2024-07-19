<!--
 Copyright (c) 2024 by frostime. All Rights Reserved.
 Author       : frostime
 Date         : 2024-06-07 18:49:52
 FilePath     : /src/libs/components/input-item.svelte
 LastEditTime : 2024-06-07 20:07:58
 Description  : 
-->
<script lang="ts">
    import { createEventDispatcher } from "svelte";
    export let type: string; // Setting Type
    export let key: string;
    export let value: any;

    //Optional
    export let placeholder: string = "";
    export let options: { [key: string | number]: string } = {};
    export let slider: {
        min: number;
        max: number;
        step: number;
    } = { min: 0, max: 100, step: 1 };
    export let button: {
        label: string;
        callback?: () => void;
    } = { label: value, callback: () => {} };

    const dispatch = createEventDispatcher();

    function click() {
        button?.callback();
        dispatch("click", { key: key });
    }

    function changed() {
        dispatch("changed", { key: key, value: value });
    }
</script>

{#if type === "checkbox"}
    <!-- Checkbox -->
    <input
        class="b3-switch fn__flex-center"
        id={key}
        type="checkbox"
        bind:checked={value}
        on:change={changed}
    />
{:else if type === "textinput"}
    <!-- Text Input -->
    <input
        class="b3-text-field fn__flex-center fn__size200"
        id={key}
        {placeholder}
        bind:value={value}
        on:change={changed}
    />
{:else if type === "textarea"}
    <textarea
        class="b3-text-field fn__block"
        style="resize: vertical; height: 10em; white-space: nowrap;"
        bind:value={value}
        on:change={changed}
    />
{:else if type === "number"}
    <input
        class="b3-text-field fn__flex-center fn__size200"
        id={key}
        type="number"
        bind:value={value}
        on:change={changed}
    />
{:else if type === "button"}
    <!-- Button Input -->
    <button
        class="b3-button b3-button--outline fn__flex-center fn__size200"
        id={key}
        on:click={click}
    >
        {button.label}
    </button>
{:else if type === "select"}
    <!-- Dropdown select -->
    <select
        class="b3-select fn__flex-center fn__size200"
        id="iconPosition"
        bind:value={value}
        on:change={changed}
    >
        {#each Object.entries(options) as [value, text]}
            <option {value}>{text}</option>
        {/each}
    </select>
{:else if type == "slider"}
    <!-- Slider -->
    <div class="b3-tooltips b3-tooltips__n" aria-label={value}>
        <input
            class="b3-slider fn__size200"
            id="fontSize"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            type="range"
            bind:value={value}
            on:change={changed}
        />
    </div>
{/if}

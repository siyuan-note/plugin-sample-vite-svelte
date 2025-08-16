<script lang="ts">
    // Optional parameters
    interface Props {
        type: string;
        key: string;
        value: any;
        placeholder?: string;
        options?: { [key: string | number]: string };
        slider?: {
        min: number;
        max: number;
        step: number;
    };
        button?: {
        label: string;
        callback?: () => void;
    };
        fnSize?: boolean;
        style?: string;
        onclick?: (detail: {key: string}) => void;
        onchanged?: (detail: {key: string, value: any}) => void;
    }

    let {
        type,
        key,
        value = $bindable(),
        placeholder = "",
        options = {},
        slider = { min: 0, max: 100, step: 1 },
        button = { label: value, callback: () => {} },
        fnSize = true,
        style = "",
        onclick,
        onchanged
    }: Props = $props();

    function handleClick() {
        button?.callback();
        onclick?.({ key: key });
    }

    function handleChanged() {
        onchanged?.({ key: key, value: value });
    }
</script>

{#if type === "checkbox"}
    <!-- Checkbox -->
    <input
        class="b3-switch fn__flex-center"
        id={key}
        type="checkbox"
        bind:checked={value}
        onchange={handleChanged}
        style={style}
    />
{:else if type === "textinput"}
    <!-- Text Input -->
    <input
        class:b3-text-field={true}
        class:fn__flex-center={true}
        class:fn__size200={fnSize}
        id={key}
        {placeholder}
        bind:value={value}
        onchange={handleChanged}
        style={style}
    />
{:else if type === "textarea"}
    <textarea
        class="b3-text-field fn__block"
        style={`resize: vertical; height: 10em; white-space: nowrap; ${style}`}
        bind:value={value}
        onchange={handleChanged}
></textarea>
{:else if type === "number"}
    <input
        class:b3-text-field={true}
        class:fn__flex-center={true}
        class:fn__size200={fnSize}
        id={key}
        type="number"
        bind:value={value}
        onchange={handleChanged}
        style={style}
    />
{:else if type === "button"}
    <!-- Button Input -->
    <button
        class:b3-button={true}
        class:b3-button--outline={true}
        class:fn__flex-center={true}
        class:fn__size200={fnSize}
        id={key}
        onclick={handleClick}
        style={style}
    >
        {button.label}
    </button>
{:else if type === "select"}
    <!-- Dropdown select -->
    <select
        class:b3-select={true}
        class:fn__flex-center={true}
        class:fn__size200={fnSize}
        id="iconPosition"
        bind:value={value}
        onchange={handleChanged}
        style={style}
    >
        {#each Object.entries(options) as [value, text]}
            <option {value}>{text}</option>
        {/each}
    </select>
{:else if type == "slider"}
    <!-- Slider -->
    <div class="b3-tooltips b3-tooltips__n" aria-label={value}>
        <input
            class:b3-slider={true}
            class:fn__size200={fnSize}
            id="fontSize"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            type="range"
            bind:value={value}
            onchange={handleChanged}
            style={style}
        />
    </div>
{/if}

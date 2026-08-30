<script lang="ts">
    interface Props extends Omit<ISettingItemCore, 'type' | 'key' | 'value'> {
        type: TSettingItemType;
        key: string;
        value?: any;
        fnSize?: boolean;
        style?: string;
        password?: boolean;
        spellcheck?: boolean;
        onclick?: (detail: { key: string }) => void;
        onchanged?: (detail: { key: string; value: any }) => void;
        createElement?: (currentVal: any) => HTMLElement;
        getEleVal?: (ele: HTMLElement) => any;
        setEleVal?: (ele: HTMLElement, value: any) => void;
    }

    let {
        type,
        key,
        value = $bindable(),
        placeholder = "",
        options = {},
        slider = { min: 0, max: 100, step: 1 },
        number = {},
        button = { label: value, callback: () => {} },
        fnSize = true,
        style = "",
        password = false,
        spellcheck,
        onclick,
        onchanged,
        createElement,
        getEleVal,
        setEleVal
    }: Props = $props();

    function handleClick() {
        button?.callback?.();
        onclick?.({ key });
    }

    function handleChanged() {
        onchanged?.({ key, value });
    }

    function mountCustom(node: HTMLDivElement, currentValue: any) {
        const customElement = createElement?.(currentValue);
        if (!customElement) {
            return;
        }

        node.append(customElement);
        const handleCustomChanged = () => {
            if (getEleVal) {
                value = getEleVal(customElement);
            }
            handleChanged();
        };
        customElement.addEventListener('input', handleCustomChanged);
        customElement.addEventListener('change', handleCustomChanged);

        return {
            update(nextValue: any) {
                setEleVal?.(customElement, nextValue);
            },
            destroy() {
                customElement.removeEventListener('input', handleCustomChanged);
                customElement.removeEventListener('change', handleCustomChanged);
                customElement.remove();
            }
        };
    }
</script>

{#if type === "checkbox"}
    <input class="b3-switch fn__flex-center" id={key} type="checkbox" bind:checked={value} onchange={handleChanged} style={style} />
{:else if type === "textinput"}
    <input class="b3-text-field fn__flex-center" class:fn__size200={fnSize} id={key} {placeholder} type={password ? "password" : "text"} spellcheck={spellcheck} bind:value={value} onchange={handleChanged} style={style} />
{:else if type === "textarea"}
    <textarea class="b3-text-field fn__block" id={key} {placeholder} spellcheck={spellcheck} style={`resize: vertical; height: 10em; white-space: nowrap; ${style}`} bind:value={value} onchange={handleChanged}></textarea>
{:else if type === "number"}
    <input class="b3-text-field fn__flex-center" class:fn__size200={fnSize} id={key} type="number" min={number?.min} max={number?.max} step={number?.step} bind:value={value} onchange={handleChanged} style={style} />
{:else if type === "button"}
    <button class="b3-button b3-button--outline fn__flex-center" class:fn__size200={fnSize} id={key} type="button" onclick={handleClick} style={style}>{button?.label ?? value}</button>
{:else if type === "select"}
    <select class="b3-select fn__flex-center" class:fn__size200={fnSize} id={key} bind:value={value} onchange={handleChanged} style={style}>
        {#each Object.entries(options) as [optionValue, text]}
            <option value={optionValue}>{text}</option>
        {/each}
    </select>
{:else if type === "slider"}
    <div class="b3-tooltips b3-tooltips__n" aria-label={String(value)}>
        <input class="b3-slider" class:fn__size200={fnSize} id={key} min={slider.min} max={slider.max} step={slider.step} type="range" bind:value={value} onchange={handleChanged} style={style} />
    </div>
{:else if type === "hint"}
    <div class="b3-label fn__flex-center" style={style}>{value}</div>
{:else if type === "custom"}
    <div use:mountCustom={value}></div>
{/if}

<!--
 Copyright (c) 2023 by frostime All Rights Reserved.
 Author       : frostime
 Date         : 2023-07-01 19:23:50
 FilePath     : /src/libs/components/setting-panel.svelte
 LastEditTime : 2024-08-09 21:41:07
 Description  : 
-->
<script lang="ts">
    import Form from './Form';

    interface Props {
        group: string;
        settingItems: ISettingItem[];
        display?: boolean;
        children?: import('svelte').Snippet;
        onclick?: (detail: {key: string}) => void;
        onchanged?: (detail: {group: string, key: string, value: any}) => void;
    }

    let {
        group,
        settingItems: _settingItems,
        display = true,
        children,
        onclick,
        onchanged
    }: Props = $props();

    // 使用 $state 让 settingItems 变成响应式
    let settingItems = $state(_settingItems);

    function handleClick(detail: {key: string}) {
        onclick?.(detail);
    }
    function handleChanged(detail: {key: string, value: any}) {
        onchanged?.({group: group, key: detail.key, value: detail.value});
    }

    let fn__none = $derived(display ? "" : "fn__none");

</script>

<div class="config__tab-container {fn__none}" data-name={group}>
    {@render children?.()}
    {#each settingItems as item (item.key)}
        <Form.Wrap
            title={item.title}
            description={item.description}
            direction={item?.direction}
        > 
            <Form.Input
                type={item.type}
                key={item.key}
                bind:value={item.value}
                placeholder={item?.placeholder}
                options={item?.options}
                slider={item?.slider}
                button={item?.button}
                onclick={handleClick}
                onchanged={handleChanged}
            />
        </Form.Wrap>
    {/each}
</div>
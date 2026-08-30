<script lang="ts">
    import type { Snippet } from 'svelte';

    export interface SidebarTab {
        key: string;
        title: string;
    }

    interface Props {
        tabs: SidebarTab[];
        initialKey?: string;
        content?: Snippet<[SidebarTab]>;
        onactivechange?: (detail: { key: string }) => void;
    }

    let {
        tabs,
        initialKey,
        content,
        onactivechange
    }: Props = $props();

    let activeKey = $state<string | undefined>();

    $effect(() => {
        if (!activeKey || !tabs.some((tab) => tab.key === activeKey)) {
            activeKey = initialKey ?? tabs[0]?.key;
        }
    });

    function selectTab(tab: SidebarTab) {
        if (tab.key === activeKey) {
            return;
        }

        activeKey = tab.key;
        onactivechange?.({ key: tab.key });
    }

    function handleTabKeydown(event: KeyboardEvent, tab: SidebarTab) {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectTab(tab);
        }
    }
</script>

<div class="fn__flex-1 fn__flex sidebar-tabs-layout">
    <ul class="b3-tab-bar b3-list b3-list--background" role="tablist">
        {#each tabs as tab (tab.key)}
            <li
                class="b3-list-item"
                class:b3-list-item--focus={tab.key === activeKey}
                role="tab"
                aria-selected={tab.key === activeKey}
                tabindex={tab.key === activeKey ? 0 : -1}
                onclick={() => selectTab(tab)}
                onkeydown={(event) => handleTabKeydown(event, tab)}
            >
                <span class="b3-list-item__text">{tab.title}</span>
            </li>
        {/each}
    </ul>

    <div class="sidebar-tabs-layout__content">
        {#each tabs as tab (tab.key)}
            <div
                class="sidebar-tabs-layout__panel"
                class:fn__none={tab.key !== activeKey}
                role="tabpanel"
                aria-hidden={tab.key !== activeKey}
            >
                {@render content?.(tab)}
            </div>
        {/each}
    </div>
</div>

<style lang="scss">
    .sidebar-tabs-layout {
        min-width: 0;
        min-height: 0;
    }

    .sidebar-tabs-layout > .b3-tab-bar {
        width: 150px;
        flex: 0 0 150px;
        min-width: 60px;
        overflow: auto;
        box-sizing: border-box;
    }

    .sidebar-tabs-layout > .b3-tab-bar > li {
        padding-left: 1rem;
    }

    .sidebar-tabs-layout__content {
        flex: 1 1 auto;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
    }

    .sidebar-tabs-layout__panel {
        height: 100%;
        min-width: 0;
        min-height: 0;
        overflow: auto;
    }

    @media screen and (max-width: 768px) {
        .sidebar-tabs-layout > .b3-tab-bar {
            width: 100px;
            flex-basis: 100px;
        }

        .sidebar-tabs-layout .b3-list-item__text {
            font-size: 14px;
            overflow: visible !important;
            text-overflow: clip !important;
            white-space: normal !important;
            word-wrap: break-word !important;
            display: block !important;
        }

        .sidebar-tabs-layout .b3-list-item {
            min-height: 40px;
            line-height: 40px;
            padding: 0 0.5rem !important;
            white-space: normal !important;
            word-break: break-word !important;
        }
    }
</style>

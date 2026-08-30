<script lang="ts">
    import { showMessage } from "siyuan";
    import SettingPanel from "./libs/components/setting-panel.svelte";
    import SidebarTabsLayout, { type SidebarTab } from "./libs/components/sidebar-tabs-layout.svelte";

    const tabs: SidebarTab[] = [
        { key: "group-1", title: "🌈 Group-A" },
        { key: "group-2", title: "✨ Group-B" }
    ];

    const group1Items: ISettingItem[] = [
        {
            type: 'checkbox',
            title: 'checkbox',
            description: 'checkbox',
            key: 'a',
            value: true
        },
        {
            type: 'textinput',
            title: 'text',
            description: 'This is a text',
            key: 'b',
            value: 'This is a text',
            placeholder: 'placeholder'
        },
        {
            type: 'textarea',
            title: 'textarea',
            description: 'This is a textarea',
            key: 'b2',
            value: 'This is a textarea',
            placeholder: 'placeholder',
            direction: 'row'
        },
        {
            type: 'select',
            title: 'select',
            description: 'select',
            key: 'c',
            value: 'x',
            options: {
                x: 'x',
                y: 'y',
                z: 'z'
            }
        }
    ];

    const group2Items: ISettingItem[] = [
        {
            type: 'button',
            title: 'button',
            description: 'This is a button',
            key: 'e',
            value: 'Click Button',
            button: {
                label: 'Click Me',
                callback: () => {
                    showMessage('Hello, world!');
                }
            }
        },
        {
            type: 'slider',
            title: 'slider',
            description: 'slider',
            key: 'd',
            value: 50,
            slider: {
                min: 0,
                max: 100,
                step: 1
            }
        }
    ];

    /********** Events **********/
    interface ChangeEvent {
        group: string;
        key: string;
        value: any;
    }

    const onChanged = (detail: ChangeEvent) => {
        if (detail.group === tabs[0].key) {
            // setting.set(detail.key, detail.value);
            //Please add your code here
            //Udpate the plugins setting data, don't forget to call plugin.save() for data persistence
        }
    };
</script>

<SidebarTabsLayout
    tabs={tabs}
    onactivechange={(detail) => { console.debug("Active tab:", detail.key); }}
>
    {#snippet content(tab)}
        {#if tab.key === tabs[0].key}
            <SettingPanel
                group={tab.key}
                settingItems={group1Items}
                onchanged={onChanged}
                onclick={(detail) => { console.debug("Click:", detail.key); }}
            >
                <div class="fn__flex b3-label">
                    💡 This is our default settings.
                </div>
            </SettingPanel>
        {:else if tab.key === tabs[1].key}
            <SettingPanel
                group={tab.key}
                settingItems={group2Items}
                onchanged={onChanged}
                onclick={(detail) => { console.debug("Click:", detail.key); }}
            />
        {/if}
    {/snippet}
</SidebarTabsLayout>


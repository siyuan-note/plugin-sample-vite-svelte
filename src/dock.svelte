<script lang="ts">
    import { adaptHotkey } from "siyuan";
    export let text: string;
</script>

<div class="fn__flex-1 fn__flex-column">
    <div class="block__icons">
        <div class="block__logo">
            <svg><use xlink:href="#iconEmoji" /></svg>
            Custom Dock
        </div>
        <span class="fn__flex-1 fn__space" />
        <span
            data-type="min"
            class="block__icon b3-tooltips b3-tooltips__sw"
            aria-label="Min ${adaptHotkey('⌘W')}"
            ><svg><use xlink:href="#iconMin" /></svg></span
        >
    </div>
    <div class="fn__flex-1 plugin-sample__custom-dock">
        {text}
    </div>
</div>

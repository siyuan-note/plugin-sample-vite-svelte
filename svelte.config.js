/*
 * Copyright (c) 2024 by frostime. All Rights Reserved.
 * @Author       : frostime
 * @Date         : 2023-05-19 19:49:13
 * @FilePath     : /svelte.config.js
 * @LastEditTime : 2024-04-19 19:01:55
 * @Description  : 
 */
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte"

const NoWarns = new Set([
    "a11y_click_events_have_key_events",
    "a11y_no_static_element_interactions",
    "a11y_no_noninteractive_element_interactions"
]);

export default {
    // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
    // for more information about preprocessors
    preprocess: vitePreprocess(),
    onwarn: (warning, handler) => {
        // suppress warnings on `vite dev` and `vite build`; but even without this, things still work
        if (NoWarns.has(warning.code)) return;
        handler(warning);
    }
}

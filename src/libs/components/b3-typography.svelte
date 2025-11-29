<script>
    /** @type {{children?: import('svelte').Snippet}} */
    let { children } = $props();
</script>

<div class="item__readme b3-typography">
    {@render children?.()}
</div>
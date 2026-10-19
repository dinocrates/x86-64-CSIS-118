<script lang="ts">
  import { editorFontSize, editorFontSizes } from '../core/displayPreferences';
  import TextSizeControl from './TextSizeControl.svelte';
</script>

<TextSizeControl
  value={editorFontSize}
  sizes={editorFontSizes}
  groupLabel="Code editor text size"
  selectLabel="Editor text size"
  decreaseLabel="Decrease editor text size"
  increaseLabel="Increase editor text size"
/>

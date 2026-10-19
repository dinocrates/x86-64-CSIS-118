<script lang="ts">
  import { debugPanelFontSize, editorFontSizes } from '../core/displayPreferences';
  import TextSizeControl from './TextSizeControl.svelte';
</script>

<TextSizeControl
  value={debugPanelFontSize}
  sizes={editorFontSizes}
  groupLabel="Debug panels text size"
  selectLabel="Debug panels text size"
  decreaseLabel="Decrease debug panels text size"
  increaseLabel="Increase debug panels text size"
/>

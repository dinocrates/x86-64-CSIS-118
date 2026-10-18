<script lang="ts">
import { PaneGroup, Pane, PaneResizer } from "paneforge";
import Hexdump from './components/Hexdump.svelte';
import Editor from './components/Editor.svelte';
import Registers from './components/Registers.svelte';
import Disassembler from './components/Disassembler.svelte';
import Terminal from './components/Terminal.svelte';
import Controls from './components/Controls.svelte';
import CollapsiblePane from './components/CollapsiblePane.svelte';

</script>


<PaneGroup direction="horizontal" class="pf__panegroup pf__panegroup--horizontal">

	<Pane defaultSize={25} class="pf__pane pf__pane--h100">
		<div class="pane">

          <Controls mobile={false} showEditor={true}/>
          <div class="pane__content">
            <Editor />
          </div>
		</div>
	</Pane>

	<PaneResizer class="pf__resizer pf__resizer--vertical" />

	<Pane defaultSize={75} class="pf__pane pf__pane--h100">
		<PaneGroup direction="vertical" class="pf__panegroup pf__panegroup--vertical">

			<!-- Debugger row: Disassembly | Registers | Stack memory -->
			<Pane defaultSize={65} class="pf__pane">
				<PaneGroup direction="horizontal" class="pf__panegroup pf__panegroup--horizontal">

					<CollapsiblePane title="Disassembly" defaultSize={35} minSize={15} defaultCollapsed={false}>
						<Disassembler />
					</CollapsiblePane>

					<PaneResizer class="pf__resizer pf__resizer--vertical" />
					<Pane defaultSize={30} minSize={15} class="pf__pane">
						<div class="pane">
							<div class="pane__bar">
								<p>Registers</p>
							</div>
							<div class="pane__content">
								<Registers />
							</div>
						</div>
					</Pane>

					<PaneResizer class="pf__resizer pf__resizer--vertical" />

					<CollapsiblePane title="Stack memory" defaultSize={35} minSize={15} defaultCollapsed={true}>
						<Hexdump />
					</CollapsiblePane>

				</PaneGroup>
			</Pane>

			<PaneResizer class="pf__resizer pf__resizer--horizontal" />

			<!-- Terminal row: full width, below the debugger row -->
			<Pane defaultSize={35} minSize={10} class="pf__pane">
				<div class="pane">
					<div class="pane__bar">
						<p>Terminal</p>
					</div>
					<div class="pane__content">
						<Terminal/>
					</div>
				</div>
			</Pane>

		</PaneGroup>
	</Pane>
</PaneGroup>


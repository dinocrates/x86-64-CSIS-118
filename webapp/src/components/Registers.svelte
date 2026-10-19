<script>
import { blinkStore, manual_render } from "../core/store";
import { REGISTER_FAMILIES, NUMBER_BASES } from "../core/registerFamilies";
import RegisterBreakdown from "./RegisterBreakdown.svelte";

const blink = blinkStore.getInstance();

let registers = [
	{ name: "rax", updated: false, str: "0x00", value: 0n },
	{ name: "rbx", updated: false, str: "0x00", value: 0n },
	{ name: "rcx", updated: false, str: "0x00", value: 0n },
	{ name: "rdx", updated: false, str: "0x00", value: 0n },

	{ name: "rsp", updated: false, str: "0x00", value: 0n },
	{ name: "rbp", updated: false, str: "0x00", value: 0n },
	{ name: "rsi", updated: false, str: "0x00", value: 0n },
	{ name: "rdi", updated: false, str: "0x00", value: 0n },

	{ name: "r8 ", updated: false, str: "0x00", value: 0n },
	{ name: "r9 ", updated: false, str: "0x00", value: 0n },
	{ name: "r10", updated: false, str: "0x00", value: 0n },
	{ name: "r11", updated: false, str: "0x00", value: 0n },
	{ name: "r12", updated: false, str: "0x00", value: 0n },
	{ name: "r13", updated: false, str: "0x00", value: 0n },
	{ name: "r14", updated: false, str: "0x00", value: 0n },
	{ name: "r15", updated: false, str: "0x00", value: 0n },
	{ name: "rip", updated: true, str: "0x00", value: 0n },
];

// numeric base used by every expanded/hovered register breakdown
let numberBase = "hex";

// names (trimmed) of registers currently pinned open by a click
let expanded = new Set();

function toggleExpand(name) {
	const key = name.trim();
	if (expanded.has(key)) {
		expanded.delete(key);
	} else {
		expanded.add(key);
	}
	expanded = expanded;
}

let eflagsStr = "0x0";
let eflagsBytes = BigInt(0x0);
let eflagsUpdated = false;
let eflags = [
	{
		name: "CF",
		name_short: "C",
		name_long: "Carry Flag",
		name_gef: "carry",
		name_1: "CY",
		name_0: "NC",
		mask: 0x00000001,
		value: 0,
		updated: false,
		description:
			"1=Carry, 0=No carry. Indicates an arithmetic carry or borrow out of the most significant bit in arithmetic operations.",
	},
	{
		name: "PF",
		name_short: "P",
		name_long: "Parity Flag",
		name_gef: "parity",
		name_1: "PE",
		name_0: "PO",
		mask: 0x00000004,
		value: 0,
		updated: false,
		description:
			"1=Even, 0=Odd. Set if the least significant byte of the result contains an even number of set bits.",
	},
	{
		name: "AF",
		name_short: "A",
		name_long: "Auxiliary Carry Flag",
		name_gef: "auxiliary",
		name_1: "AC",
		name_0: "NA",
		mask: 0x00000010,
		value: 0,
		updated: false,
		description:
			"1=Auxiliary carry, 0=No auxiliary carry. Indicates a carry or borrow between bit 3 and bit 4 of the lower nibble (used in BCD arithmetic).",
	},
	{
		name: "ZF",
		name_short: "Z",
		name_long: "Zero Flag",
		name_gef: "zero",
		name_1: "ZR",
		name_0: "NZ",
		mask: 0x00000040,
		value: 0,
		updated: false,
		description:
			"1=Zero, 0=Nonzero. Set if the result of an arithmetic or logical operation is zero.",
	},
	{
		name: "SF",
		name_short: "S",
		name_long: "Sign Flag",
		name_gef: "sign",
		name_1: "NG",
		name_0: "PL",
		mask: 0x00000080,
		value: 0,
		updated: false,
		description:
			"1=Negative, 0=Positive. Reflects the sign (most significant bit) of the result of the last arithmetic operation.",
	},
	{
		name: "TF",
		name_short: "T",
		name_long: "Trap Flag",
		name_gef: "trap",
		display: false,
		name_1: "ST",
		name_0: "NT",
		mask: 0x00000100,
		value: 0,
		updated: false,
		description:
			"1=Enable single-step mode for debugging; generates a debug exception after each instruction.",
	},
	{
		name: "DF",
		name_short: "D",
		name_long: "Direction Flag",
		name_gef: "direction",
		name_1: "DN",
		name_0: "UP",
		mask: 0x00000400,
		value: 0,
		updated: false,
		description:
			"1=Decrement, 0=Increment. Controls string operations; if set, string instructions process data from high addresses to low addresses.",
	},
	{
		name: "OF",
		name_short: "O",
		name_long: "Overflow Flag",
		name_gef: "overflow",
		name_1: "OV",
		name_0: "NV",
		mask: 0x00000800,
		value: 0,
		updated: false,
		description:
			"1=Overflow, 0=No overflow. Indicates that the signed result of an operation is too large to fit in the destination operand.",
	},
];

// sys_exit's syscall number (Linux x86-64). exit_program (from csis118b.inc)
// always does `mov rax, 60` immediately before the `syscall` that ends the
// process, so once the program has fully stopped, rax holding exactly this
// value means it's showing that bookkeeping, not the student's own code.
const SYS_EXIT = 60n;
let showPostExitNote = false;

function updateRegisters() {
	if (
		!(
			blink.state === blink.states.PROGRAM_RUNNING ||
			blink.state === blink.states.PROGRAM_STOPPED
		)
	)
		return;

	for (const reg of registers) {
		const new_str = blink.m.stringReadU64(reg.name.trim());
		reg.value = blink.m.readU64(reg.name.trim());
		if (new_str === reg.str) {
			reg.updated = false;
		} else {
			reg.updated = true;
			reg.str = new_str;
		}
	}
	//force svelte rendering
	registers = registers;

	const rax = registers.find((reg) => reg.name.trim() === "rax");
	showPostExitNote =
		blink.state === blink.states.PROGRAM_STOPPED &&
		!!rax &&
		rax.value === SYS_EXIT;

	eflagsStr = blink.m.stringReadU64("flags");
	const new_eflagsBytes = blink.m.readU64("flags");
	if (new_eflagsBytes === eflagsBytes) {
		eflagsUpdated = false;
	} else {
		eflagsUpdated = true;
		eflagsBytes = new_eflagsBytes;
	}
	for (const flag of eflags) {
		const new_value = (BigInt(flag.mask) & eflagsBytes) > 0;
		if (new_value === flag.value) {
			flag.updated = false;
		} else {
			flag.updated = true;
			flag.value = new_value;
		}
	}
	//force svelte rerendering
	eflags = eflags;
}

//rerender registers on machine step
$: $manual_render && updateRegisters();
</script>

<section class="registers">
    <div class="base-toggle" role="group" aria-label="Number base for register breakdown">
      {#each NUMBER_BASES as b}
        <button
          type="button"
          class="base-toggle__btn"
          class:active={numberBase === b.id}
          on:click={() => (numberBase = b.id)}
        >{b.label}</button>
      {/each}
    </div>
    {#if showPostExitNote}
      <p class="postexit-note">
        Program exited: RAX now holds the exit syscall number (60), not your program's last value.
        Use Debug + Step to inspect registers before the <code>exit</code> call.
      </p>
    {/if}
{#each registers as r}
    {@const key = r.name.trim()}
    {@const hasFamily = !!REGISTER_FAMILIES[key]}
    <div class="reg-row">
      <p>
        {#if hasFamily}
          <button
            type="button"
            class="name regname-btn infotooltip"
            class:updated={r.updated}
            aria-expanded={expanded.has(key)}
            on:click={() => toggleExpand(r.name)}
          ><span class="chevron">{expanded.has(key) ? "▾" : "▸"}</span>{r.name}</button>
        {:else}
          <span class="name infotooltip" tabindex="0" aria-describedby="info-tooltip" class:updated={r.updated}>{r.name}</span>
        {/if}
         :
        <span class="int">{r.str}</span>
      </p>
      {#if hasFamily && expanded.has(key)}
        <div class="reg-panel reg-panel--pinned">
          <RegisterBreakdown regName={key} value={r.value} base={numberBase} />
        </div>
      {/if}
    </div>
{/each}
    <br/>
    <p>
      <span class="name" class:updated={eflagsUpdated}>eflags</span> : 
      <span class="int">
            {eflagsStr}
        </span>
        <br/>
        [
{#each eflags as f}
    {#if f.value}
        <span class="flag infotooltip" tabindex="0" aria-describedby="info-tooltip" class:updated={f.updated} 
                    title={f.name_long + ": " + f.description}
                >{f.name_gef}</span>
    {/if}
            <span></span>
{/each}
        ]
    </p>
    <br/>

</section>


<style>
.registers {
  padding: .5rem;
  padding-left: 1rem;

  font-family: var(--code-font-family);
  font-size: var(--debug-panel-font-size, .9rem);
}
.registers p{
  margin: 0;
}

.registers {
  & .name {
    color: var(--theme-reg-name);
    white-space: pre;
  }
  & .updated{
    color: var(--theme-reg-name-updated);
  }
  & .int {
    color: var(--theme-reg-value-int);
  }
  & .infotooltip:hover {
    text-decoration: underline;
    cursor: pointer;
  }
}

.base-toggle {
  display: inline-flex;
  gap: 2px;
  margin-bottom: 0.4rem;
}
.base-toggle__btn {
  background: none;
  border: 1px solid var(--theme-panel-border);
  color: var(--theme-text-fg-disabled);
  font: inherit;
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  cursor: pointer;
  border-radius: 3px;
}
.base-toggle__btn.active {
  color: var(--theme-text-fg-contrasting);
  background-color: var(--theme-selected-bg);
  border-color: var(--theme-focus);
}

.postexit-note {
  margin: 0 0 0.5rem 0;
  padding: 0.35rem 0.5rem;
  background-color: var(--theme-hint-bg);
  border: 1px solid var(--theme-hint-border);
  border-radius: 4px;
  color: var(--color-gold-50);
  font-family: var(--font-family);
  font-size: 0.75rem;
}
.postexit-note code {
  font-family: var(--code-font-family);
}

.regname-btn {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}
.chevron {
  display: inline-block;
  width: 0.8em;
  font-size: 0.7em;
  opacity: 0.7;
}

.reg-panel {
  background-color: var(--theme-panel-controls-bg);
  border: 1px solid var(--theme-panel-border);
  border-radius: 4px;
  margin: 0.1rem 0 0.25rem;
}

</style>

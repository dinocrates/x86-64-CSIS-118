<script>
import { REGISTER_FAMILIES, formatValue } from "../core/registerFamilies";

export let regName; // e.g. "rax", lowercase, trimmed
export let value = 0n; // full 64-bit content, as a bigint
export let base = "hex";

$: names = REGISTER_FAMILIES[regName];

// bit slices, computed straight off the 64-bit value - no extra wasm calls needed
$: upper32 = (value >> 32n) & 0xffffffffn; // bits 63-32, unnamed
$: dHigh16 = (value >> 16n) & 0xffffn; // bits 31-16, unnamed on its own
$: hi8 = (value >> 8n) & 0xffn; // bits 15-8
$: lo8 = value & 0xffn; // bits 7-0

// full named registers, for the summary rows below the bar
$: dVal = value & 0xffffffffn; // e.g. eax
$: wVal = value & 0xffffn; // e.g. ax
</script>

{#if names}
<div class="regbreak">
	<div class="regbreak__grid regbreak__grid--toplabel">
		<div class="toplabel">{regName.toUpperCase()} &mdash; 64 bits</div>
	</div>

	<div class="regbreak__grid regbreak__grid--bar">
		<div class="seg seg--upper">
			<span class="seg__name">Upper 32</span>
			<span class="seg__sub">{regName.toUpperCase()} only</span>
			<span class="seg__val">{formatValue(upper32, 32, base)}</span>
		</div>
		<div class="seg seg--d">
			<span class="seg__name">bits 31&ndash;16</span>
			<span class="seg__sub">part of {names.d.toUpperCase()}</span>
			<span class="seg__val">{formatValue(dHigh16, 16, base)}</span>
		</div>
		<div class="seg seg--hi8">
			<span class="seg__name">{names.hi8 ? names.hi8.toUpperCase() : "—"}</span>
			<span class="seg__sub">bits 15&ndash;8</span>
			<span class="seg__val">{formatValue(hi8, 8, base)}</span>
		</div>
		<div class="seg seg--lo8">
			<span class="seg__name">{names.lo8.toUpperCase()}</span>
			<span class="seg__sub">bits 7&ndash;0</span>
			<span class="seg__val">{formatValue(lo8, 8, base)}</span>
		</div>
	</div>

	<div class="regbreak__grid regbreak__grid--bracket">
		<div class="bracket bracket--d">{names.d.toUpperCase()} &mdash; lower 32 bits</div>
	</div>
	<div class="regbreak__grid regbreak__grid--bracket">
		<div class="bracket bracket--w">{names.w.toUpperCase()} &mdash; 16 bits</div>
	</div>

	<table class="regbreak__values">
		<tbody>
			<tr>
				<td class="regbreak__values-name">{regName.toUpperCase()}</td>
				<td class="regbreak__values-val">{formatValue(value, 64, base)}</td>
			</tr>
			<tr>
				<td class="regbreak__values-name">{names.d.toUpperCase()}</td>
				<td class="regbreak__values-val">{formatValue(dVal, 32, base)}</td>
			</tr>
			<tr>
				<td class="regbreak__values-name">{names.w.toUpperCase()}</td>
				<td class="regbreak__values-val">{formatValue(wVal, 16, base)}</td>
			</tr>
			{#if names.hi8}
			<tr>
				<td class="regbreak__values-name">{names.hi8.toUpperCase()}</td>
				<td class="regbreak__values-val">{formatValue(hi8, 8, base)}</td>
			</tr>
			{/if}
			<tr>
				<td class="regbreak__values-name">{names.lo8.toUpperCase()}</td>
				<td class="regbreak__values-val">{formatValue(lo8, 8, base)}</td>
			</tr>
		</tbody>
	</table>
</div>
{/if}

<style>
.regbreak {
	font-family: var(--code-font-family);
	font-size: 0.7rem;
	line-height: 1.25;
	padding: 0.25rem 0.2rem 0.35rem;
}

.regbreak__grid {
	display: grid;
	grid-template-columns: 32fr 16fr 8fr 8fr;
	column-gap: 2px;
}

.toplabel {
	grid-column: 1 / 5;
	text-align: center;
	color: var(--theme-text-fg-disabled);
	padding-bottom: 0.15rem;
}

.seg {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 0.15rem 0.2rem;
	border-radius: 3px;
	border: 1px solid var(--theme-hex-section-border);
	overflow: hidden;
	min-width: 0;
}
.seg__name {
	font-weight: bold;
	white-space: nowrap;
}
.seg__sub {
	opacity: 0.75;
	font-size: 0.6rem;
	white-space: nowrap;
}
.seg__val {
	font-size: 0.65rem;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	max-width: 100%;
}

.seg--upper {
	background-color: var(--theme-regbar-upper);
}
.seg--d {
	background-color: var(--theme-hex-section-blue);
}
.seg--hi8 {
	background-color: var(--theme-hex-section-green);
}
.seg--lo8 {
	background-color: var(--theme-regbar-lo8);
}

.regbreak__grid--bracket {
	margin-top: 0.15rem;
}
.bracket {
	position: relative;
	text-align: center;
	font-size: 0.6rem;
	padding-top: 0.3rem;
	color: var(--theme-text-fg-disabled);
}
.bracket::before {
	content: "";
	position: absolute;
	top: 0;
	left: 3px;
	right: 3px;
	height: 4px;
	border-left: 1px solid var(--theme-panel-border);
	border-right: 1px solid var(--theme-panel-border);
	border-bottom: 1px solid var(--theme-panel-border);
}
.bracket--d {
	grid-column: 2 / 5;
}
.bracket--w {
	grid-column: 3 / 5;
}

.regbreak__values {
	margin-top: 0.3rem;
	border-collapse: collapse;
	width: 100%;
}
.regbreak__values-name {
	color: var(--theme-reg-name);
	padding: 0.05rem 0.5rem 0.05rem 0;
	white-space: nowrap;
}
.regbreak__values-val {
	color: var(--theme-reg-value-int);
	width: 100%;
	word-break: break-all;
}
</style>

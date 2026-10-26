<script>
  import { app } from './stores.svelte.js';
  import { clock } from './clock.svelte.js';
  import { deleteTask, finishTask, startTask, undoTask } from './actions.js';
  import { plannedPoints } from './points.js';
  import { TYPE_LABEL, fmtClock, ms } from './util.js';

  let { task, readonly = false } = $props();
  let busy = $state(false);

  const planned = $derived(plannedPoints(task.estMinutes, task.type));
  const running = $derived(!task.done && task.startedAt);
  const elapsed = $derived(running ? (clock.now - ms(task.startedAt)) / 1000 : 0);

  async function run(fn) { busy = true; try { await fn(); } catch (e) { console.error(e); } busy = false; }
</script>

<div class="card">
  <div class="row between">
    <div class="grow">
      <strong class:done={task.done}>{task.title}</strong>
      <div class="muted">{TYPE_LABEL[task.type]} - {task.estMinutes} دقيقة - المخطط {planned} نقطة</div>
    </div>
    {#if task.done}<span class="pts">+{task.pointsAwarded}</span>{/if}
  </div>
  {#if !readonly}
    <div class="row actions">
      {#if task.done}
        <button class="btn small" disabled={busy} onclick={() => run(() => undoTask(task))}>إلغاء التعليم</button>
      {:else if running}
        <span class="timer">{fmtClock(elapsed)}</span>
        <button class="btn primary small" disabled={busy} onclick={() => run(() => finishTask(task, app.tasks))}>خلصت</button>
      {:else}
        <button class="btn primary small" disabled={busy} onclick={() => run(() => startTask(task))}>ابدأ</button>
      {/if}
      {#if !running}<button class="btn danger small" disabled={busy} onclick={() => run(() => deleteTask(task))}>حذف</button>{/if}
    </div>
  {/if}
</div>

<style>
  .done { text-decoration: line-through; color: var(--muted); }
  .pts { color: var(--accent); font-weight: 700; }
  .actions { margin-top: .6rem; }
  .timer { font-variant-numeric: tabular-nums; font-weight: 700; color: var(--primary); }
</style>

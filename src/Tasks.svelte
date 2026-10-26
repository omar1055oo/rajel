<script>
  import { app } from './stores.svelte.js';
  import { addTask } from './actions.js';
  import { plannedPoints } from './points.js';
  import { TYPE_LABEL, todayStr } from './util.js';
  import TaskItem from './TaskItem.svelte';

  let title = $state('');
  let type = $state('reading');
  let est = $state(30);
  let error = $state('');

  const mine = $derived(app.tasks.filter((t) => t.ownerUid === app.uid && t.date === todayStr()));
  const preview = $derived(est > 0 ? plannedPoints(est, type) : 0);

  async function add() {
    if (!title.trim()) return (error = 'اكتب عنوان المهمة.');
    if (!(est > 0)) return (error = 'اكتب الوقت المتوقع بالدقايق.');
    error = '';
    try { await addTask(app.uid, { title: title.trim(), type, estMinutes: Number(est) }); title = ''; }
    catch { error = 'مقدرتش أضيف المهمة. جرّب تاني.'; }
  }
</script>

<h1>مهامي</h1>
<div class="card">
  <input placeholder="عنوان المهمة" bind:value={title} />
  <div class="row fields">
    <select bind:value={type}>
      {#each Object.entries(TYPE_LABEL) as [k, v]}<option value={k}>{v}</option>{/each}
    </select>
    <input type="number" min="1" inputmode="numeric" bind:value={est} />
    <span class="muted nowrap">دقيقة</span>
  </div>
  <p class="muted">النقاط المخطط لها: {preview}</p>
  {#if error}<p class="err">{error}</p>{/if}
  <button class="btn primary" onclick={add}>إضافة</button>
</div>

{#each mine as t (t.id)}<TaskItem task={t} />{:else}<p class="muted">مفيش مهام النهارده.</p>{/each}

<style>
  h1 { color: var(--primary); font-size: 1.4rem; margin: 0 0 .8rem; }
  .fields { margin: .6rem 0; }
  .nowrap { white-space: nowrap; }
</style>

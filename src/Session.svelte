<script>
  import { app } from './stores.svelte.js';
  import { clock } from './clock.svelte.js';
  import { createSession, endSession, joinSession } from './actions.js';
  import { fmtClock, ms, todayStr } from './util.js';
  import TaskItem from './TaskItem.svelte';

  const available = $derived(app.tasks.filter((t) => t.ownerUid === app.uid && t.date === todayStr() && !t.done && !t.sessionId));
  const s = $derived(app.session && app.session.status !== 'ended' ? app.session : null);
  const invite = $derived(app.invites[0] ?? null);
  const names = (uid) => app.users[uid]?.name || '';
  const stat = (uid) => {
    const m = s.members[uid];
    const ts = app.tasks.filter((t) => m.taskIds.includes(t.id));
    return { done: ts.filter((t) => t.done).length, total: ts.length };
  };

  let picked = $state([]);
  let busy = $state(false);
  let error = $state('');
  const toggle = (id) => (picked = picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);
  const chosen = () => available.filter((t) => picked.includes(t.id));

  async function run(fn) {
    if (!picked.length && fn !== end) return (error = 'اختار مهمة واحدة على الأقل.');
    busy = true; error = '';
    try { await fn(); picked = []; } catch (e) { console.error(e); error = 'حصلت مشكلة. جرّب تاني.'; }
    busy = false;
  }
  const create = () => createSession(app.uid, chosen());
  const join = () => joinSession(app.uid, invite, chosen());
  const end = () => endSession(s.id, app.tasks);
</script>

<h1>جلسة مذاكرة</h1>

{#snippet picker()}
  {#each available as t (t.id)}
    <label class="card row pick">
      <input type="checkbox" checked={picked.includes(t.id)} onchange={() => toggle(t.id)} />
      <span>{t.title}</span>
    </label>
  {:else}<p class="muted">مفيش مهام متاحة. ضيف مهام من تاب المهام الأول.</p>{/each}
  {#if error}<p class="err">{error}</p>{/if}
{/snippet}

{#if s?.status === 'active'}
  <div class="card">
    <div class="timer">{fmtClock((clock.now - ms(s.startedAt)) / 1000)}</div>
    {#each Object.keys(s.members) as uid}
      {@const st = stat(uid)}
      <div class="row between"><span>{names(uid)}</span><span>{st.done} من {st.total} مهام</span></div>
      <div class="bar"><div style="width:{st.total ? (st.done / st.total) * 100 : 0}%"></div></div>
    {/each}
  </div>
  {#each app.tasks.filter((t) => s.members[app.uid]?.taskIds.includes(t.id)) as t (t.id)}<TaskItem task={t} />{/each}
  <button class="btn danger" disabled={busy} onclick={() => run(end)}>إنهاء الجلسة</button>
{:else if s?.status === 'waiting'}
  <div class="card"><p>استنى {names(Object.keys(app.users).find((u) => u !== app.uid))} ينضم للجلسة.</p>
    <button class="btn danger" disabled={busy} onclick={() => run(end)}>إلغاء الجلسة</button></div>
{:else if invite}
  <div class="card"><h2>{names(invite.createdBy)} بيدعيك لجلسة مذاكرة</h2><p class="muted">اختار مهامك للجلسة.</p></div>
  {@render picker()}
  <button class="btn primary" disabled={busy} onclick={() => run(join)}>انضمام</button>
{:else}
  <div class="card"><h2>ابدأ جلسة جديدة</h2><p class="muted">اختار مهامك، والتاني هيشوف الدعوة وينضم.</p></div>
  {@render picker()}
  <button class="btn primary" disabled={busy} onclick={() => run(create)}>ابدأ جلسة</button>
{/if}

<style>
  h1 { color: var(--primary); font-size: 1.4rem; margin: 0 0 .8rem; }
  .timer { font-size: 2rem; font-weight: 700; text-align: center; color: var(--primary); font-variant-numeric: tabular-nums; margin-bottom: .6rem; }
  .pick input { width: auto; }
</style>

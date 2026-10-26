<script>
  import { app, otherUid } from './stores.svelte.js';
  import { clock } from './clock.svelte.js';
  import { CONFIG } from './config.js';
  import { logout, saveGoal, setStatus } from './actions.js';
  import { currentStreak } from './points.js';
  import { STATUS_LABEL, daysAgoStr, ms, sinceText, todayStr } from './util.js';
  import TaskItem from './TaskItem.svelte';

  const today = todayStr();
  const yesterday = daysAgoStr(1);
  const me = $derived(app.users[app.uid]);
  const oid = $derived(otherUid());
  const other = $derived(oid ? app.users[oid] : null);
  const online = (u) => u && clock.now - ms(u.lastSeen) < CONFIG.ONLINE_THRESHOLD_SECONDS * 1000;
  const total = (uid) => app.points.filter((p) => p.uid === uid).reduce((a, p) => a + p.amount, 0);
  const dayTasks = (uid) => app.tasks.filter((t) => t.ownerUid === uid && t.date === today);
  const dayPoints = (uid) => dayTasks(uid).reduce((a, t) => a + (t.pointsAwarded || 0), 0);
  const goal = $derived(me?.goalMinutes || CONFIG.DAILY_GOAL_MINUTES);
  const minutes = $derived(dayTasks(app.uid).filter((t) => t.done).reduce((a, t) => a + (t.actualMinutes || 0), 0));
  const pct = $derived(Math.min(100, Math.round((minutes / goal) * 100)));
  let goalInput = $state('');
  $effect(() => { if (goalInput === '' && me) goalInput = goal; });

  const toggle = () => setStatus(app.uid, me?.status === 'studying' ? 'idle' : 'studying', me?.status === 'studying' ? me?.statusText : '');
</script>

<h1>الرئيسية</h1>

{#if other}
  <div class="card">
    <div class="row between">
      <strong>{other.name}</strong>
      <span class="row"><span class="dot" class:on={online(other)}></span>{online(other) ? 'متصل' : 'آخر ظهور ' + sinceText(other.lastSeen, clock.now)}</span>
    </div>
    <p>{STATUS_LABEL[other.status] || 'فاضي'}{other.statusText ? ' - ' + other.statusText : ''}</p>
    <div class="muted">نقاط النهارده {dayPoints(oid)} - الإجمالي {total(oid)} - السلسلة {currentStreak(other, today, yesterday)} يوم</div>
  </div>
{/if}

<div class="card">
  <h2>أنا ({me?.name})</h2>
  <div class="row between">
    <span>{STATUS_LABEL[me?.status] || 'فاضي'}{me?.statusText ? ' - ' + me.statusText : ''}</span>
    <button class="btn small" onclick={toggle}>{me?.status === 'studying' ? 'فاضي' : 'بذاكر'}</button>
  </div>
  <p class="muted">نقاط النهارده {dayPoints(app.uid)} - الإجمالي {total(app.uid)} - السلسلة {currentStreak(me, today, yesterday)} يوم</p>
  <div class="bar"><div style="width:{pct}%"></div></div>
  <p class="muted">{Math.round(minutes)} من {goal} دقيقة النهارده</p>
  <div class="row">
    <input type="number" min="1" inputmode="numeric" bind:value={goalInput} />
    <button class="btn small nowrap" onclick={() => goalInput > 0 && saveGoal(app.uid, Number(goalInput))}>حفظ الهدف</button>
  </div>
</div>

{#if other}
  <h2>مهام {other.name} النهارده</h2>
  {#each dayTasks(oid) as t (t.id)}<TaskItem task={t} readonly />{:else}<p class="muted">مفيش مهام.</p>{/each}
{/if}

<button class="btn danger out" onclick={logout}>خروج</button>

<style>
  h1 { color: var(--primary); font-size: 1.4rem; margin: 0 0 .8rem; }
  .nowrap { white-space: nowrap; }
  .out { margin-top: 1rem; }
</style>

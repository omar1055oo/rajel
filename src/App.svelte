<script>
  import { app, initAuth } from './stores.svelte.js';
  import { CONFIG } from './config.js';
  import { endSession, flushFocus, heartbeat, markFinished, settleMine } from './actions.js';
  import { ms } from './util.js';
  import Login from './Login.svelte';
  import Home from './Home.svelte';
  import Tasks from './Tasks.svelte';
  import Session from './Session.svelte';
  import Chat from './Chat.svelte';

  const tabs = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'tasks', label: 'المهام' },
    { id: 'session', label: 'جلسة' },
    { id: 'chat', label: 'شات' }
  ];
  let current = $state('home');
  let lastRead = $state(Number(localStorage.getItem('lastRead') || 0));

  initAuth();

  /* عداد الرسايل غير المقروءة */
  const unread = $derived(app.messages.filter((m) => m.fromUid !== app.uid && ms(m.createdAt) > lastRead).length);
  $effect(() => {
    if (current === 'chat') { lastRead = Date.now(); localStorage.setItem('lastRead', String(lastRead)); }
  });

  /* Heartbeat: بيقف لما التطبيق يتخبّى */
  $effect(() => {
    const uid = app.uid;
    if (!uid) return;
    const beat = () => document.visibilityState === 'visible' && heartbeat(uid);
    beat();
    const iv = setInterval(beat, CONFIG.HEARTBEAT_SECONDS * 1000);
    document.addEventListener('visibilitychange', beat);
    return () => { clearInterval(iv); document.removeEventListener('visibilitychange', beat); };
  });

  /* وقت التركيز: يتحسب والتطبيق ظاهر وحالتك "بذاكر" بس، ويتبعت كل 15 ثانية */
  const sid = $derived(app.session?.id);
  const tracking = $derived(app.session?.status === 'active' && app.users[app.uid]?.status === 'studying');
  $effect(() => {
    if (!tracking) return;
    const id = sid, uid = app.uid;
    let pending = 0;
    const flush = () => { if (pending > 0) { flushFocus(id, uid, pending); pending = 0; } };
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible') pending++;
      if (pending >= 15) flush();
    }, 1000);
    return () => { clearInterval(iv); flush(); };
  });

  /* لما كل مهام جلستي تخلص يتسجل finishedAt، ولما الاتنين يخلصوا الجلسة تتنهي */
  const myAllDone = $derived.by(() => {
    const m = app.session?.members?.[app.uid];
    if (app.session?.status !== 'active' || !m || m.finishedAt) return false;
    const ts = app.tasks.filter((t) => m.taskIds.includes(t.id));
    return ts.length > 0 && ts.every((t) => t.done);
  });
  $effect(() => { if (myAllDone) markFinished(sid, app.uid).catch(console.error); });

  const bothDone = $derived(
    app.session?.status === 'active' && Object.values(app.session.members).length === 2 && Object.values(app.session.members).every((m) => m.finishedAt)
  );
  $effect(() => { if (bothDone) endSession(sid, app.tasks).catch(console.error); });

  /* تسوية نقاطي لما الجلسة تنتهي (مرة واحدة) */
  let settling = null;
  $effect(() => {
    const s = app.session;
    if (s?.status !== 'ended' || app.sessionId !== s.id || settling === s.id) return;
    settling = s.id;
    settleMine(app.uid, s).then((n) => (app.notice = n > 0 ? `الجلسة خلصت. بونص الجلسة: ${n} نقطة.` : 'الجلسة خلصت.')).catch((e) => { console.error(e); settling = null; });
  });
</script>

{#if !app.ready}
  <p class="center muted">استنى شوية...</p>
{:else if !app.uid}
  <Login />
{:else}
  <div class="shell">
    {#if app.notice}<button class="notice" onclick={() => (app.notice = '')}>{app.notice}</button>{/if}
    <main>
      {#if current === 'home'}<Home />
      {:else if current === 'tasks'}<Tasks />
      {:else if current === 'session'}<Session />
      {:else}<Chat />{/if}
    </main>
    <nav>
      {#each tabs as t}
        <button class:active={current === t.id} onclick={() => (current = t.id)}>
          {t.label}{#if t.id === 'chat' && unread > 0 && current !== 'chat'}<span class="badge">{unread}</span>{/if}
        </button>
      {/each}
    </nav>
  </div>
{/if}

<style>
  .center { text-align: center; padding-top: 30vh; }
  .shell { display: flex; flex-direction: column; height: 100%; }
  main { flex: 1; overflow-y: auto; padding: 1.25rem; padding-top: calc(1.25rem + env(safe-area-inset-top, 0px)); }
  .notice { border: 0; background: var(--accent); color: #fff; padding: .6rem; padding-top: calc(.6rem + env(safe-area-inset-top, 0px)); }
  nav { display: flex; background: var(--surface); border-top: 1px solid var(--line); padding-bottom: env(safe-area-inset-bottom, 0px); }
  nav button { flex: 1; padding: .85rem 0; border: 0; background: none; color: var(--muted); border-top: 3px solid transparent; cursor: pointer; }
  nav button.active { color: var(--primary); border-top-color: var(--primary); font-weight: 700; }
  .badge { background: #a33; color: #fff; border-radius: 999px; font-size: .75rem; padding: 0 .4rem; margin-inline-start: .3rem; }
</style>

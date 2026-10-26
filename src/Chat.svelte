<script>
  import { tick } from 'svelte';
  import { app } from './stores.svelte.js';
  import { CONFIG } from './config.js';
  import { sendMessage } from './actions.js';

  let text = $state('');
  let box;

  $effect(() => { app.messages.length; tick().then(() => box && (box.scrollTop = box.scrollHeight)); });

  async function send(t, type = 'text') {
    t = t.trim();
    if (!t) return;
    text = '';
    try { await sendMessage(app.uid, t, type); } catch (e) { console.error(e); }
  }
</script>

<div class="chat">
  <div class="msgs" bind:this={box}>
    {#each app.messages as m (m.id)}
      <div class="bubble" class:mine={m.fromUid === app.uid} class:quick={m.type === 'quick'}>{m.text}</div>
    {:else}<p class="muted">مفيش رسايل لسه.</p>{/each}
  </div>
  <div class="chips">
    {#each CONFIG.QUICK_MESSAGES as q}<button class="chip" onclick={() => send(q, 'quick')}>{q}</button>{/each}
  </div>
  <div class="row">
    <input placeholder="اكتب رسالة" bind:value={text} onkeydown={(e) => e.key === 'Enter' && send(text)} />
    <button class="btn primary" onclick={() => send(text)}>إرسال</button>
  </div>
</div>

<style>
  .chat { display: flex; flex-direction: column; gap: .6rem; height: 100%; }
  .msgs { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: .4rem; }
  .bubble { max-width: 80%; padding: .5rem .8rem; border-radius: 14px; background: var(--surface); border: 1px solid var(--line); align-self: flex-start; }
  .bubble.mine { align-self: flex-end; background: var(--primary); color: #fff; border-color: var(--primary); }
  .bubble.quick { font-size: .9rem; }
</style>

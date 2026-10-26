<script>
  import { ACCOUNTS } from './accounts.js';
  import { login } from './actions.js';

  let selected = $state(ACCOUNTS[0]);
  let code = $state('');
  let error = $state('');
  let busy = $state(false);

  const messages = {
    'auth/invalid-credential': 'الكود السري غلط، جرّب تاني.',
    'auth/wrong-password': 'الكود السري غلط، جرّب تاني.',
    'auth/user-not-found': 'الحساب ده مش موجود. اتأكد من الإعدادات.',
    'auth/too-many-requests': 'محاولات كتير. استنى شوية وجرّب تاني.',
    'auth/network-request-failed': 'مفيش إنترنت. اتأكد من الاتصال وجرّب تاني.'
  };

  async function submit() {
    if (!code) return (error = 'اكتب الكود السري.');
    busy = true; error = '';
    try { await login(selected, code); }
    catch (e) { error = messages[e.code] || 'حصلت مشكلة في الدخول. جرّب تاني.'; }
    busy = false;
  }
</script>

<div class="wrap">
  <h1>راجل ولا مش راجل</h1>
  <p class="muted">اختار اسمك واكتب الكود السري.</p>
  <div class="row names">
    {#each ACCOUNTS as a}
      <button class="btn grow" class:primary={selected.key === a.key} onclick={() => (selected = a)}>{a.name}</button>
    {/each}
  </div>
  <input type="password" placeholder="الكود السري" bind:value={code} onkeydown={(e) => e.key === 'Enter' && submit()} />
  {#if error}<p class="err">{error}</p>{/if}
  <button class="btn primary" disabled={busy} onclick={submit}>{busy ? 'استنى شوية...' : 'دخول'}</button>
</div>

<style>
  .wrap { max-width: 380px; margin: 0 auto; padding: 18vh 1.25rem 1rem; display: flex; flex-direction: column; gap: .8rem; }
  h1 { color: var(--primary); margin: 0; }
  .names { gap: .5rem; }
</style>

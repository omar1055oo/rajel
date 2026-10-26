import {
  addDoc, collection, deleteDoc, doc, getDoc, increment, runTransaction, serverTimestamp, setDoc, updateDoc, writeBatch
} from 'firebase/firestore';
import { signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth, db } from './firebase.js';
import { CONFIG } from './config.js';
import { ACCOUNTS } from './accounts.js';
import { applyDailyCap, nextStreak, plannedPoints, settleSession, streakBonus, taskPoints } from './points.js';
import { daysAgoStr, ms, todayStr } from './util.js';

const userRef = (uid) => doc(db, 'users', uid);

/* ---------- الدخول والحالة ---------- */
export async function login(account, code) {
  await setPersistence(auth, browserLocalPersistence);
  const { user } = await signInWithEmailAndPassword(auth, account.email, code);
  const ref = userRef(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) await updateDoc(ref, { name: account.name, lastSeen: serverTimestamp() });
  else await setDoc(ref, { name: account.name, status: 'idle', statusText: '', lastSeen: serverTimestamp(), activeSessionId: null });
}
export const logout = () => signOut(auth);
export const accountName = (email) => ACCOUNTS.find((a) => a.email === email)?.name;

export const heartbeat = (uid) => updateDoc(userRef(uid), { lastSeen: serverTimestamp() }).catch(() => {});
export const setStatus = (uid, status, statusText = '') => updateDoc(userRef(uid), { status, statusText });
export const saveGoal = (uid, minutes) => updateDoc(userRef(uid), { goalMinutes: minutes });

/* ---------- المهام ---------- */
export const addTask = (uid, { title, type, estMinutes }) =>
  addDoc(collection(db, 'tasks'), {
    ownerUid: uid, title, type, estMinutes, date: todayStr(),
    startedAt: null, actualMinutes: null, done: false, doneAt: null, pointsAwarded: 0, sessionId: null
  });

export const startTask = (task) => updateDoc(doc(db, 'tasks', task.id), { startedAt: new Date() });

async function deletePointDocs(taskId) {
  const batch = writeBatch(db);
  for (const id of [`task_${taskId}`, `eff_${taskId}`]) {
    const ref = doc(db, 'points', id);
    if ((await getDoc(ref)).exists()) batch.delete(ref);
  }
  return batch;
}

export async function deleteTask(task) {
  const batch = await deletePointDocs(task.id);
  batch.delete(doc(db, 'tasks', task.id));
  await batch.commit();
}

export async function undoTask(task) {
  const batch = await deletePointDocs(task.id);
  batch.update(doc(db, 'tasks', task.id), { done: false, doneAt: null, startedAt: null, actualMinutes: null, pointsAwarded: 0 });
  await batch.commit();
}

export async function finishTask(task, allTasks, user) {
  const uid = task.ownerUid;
  const actualSeconds = (Date.now() - ms(task.startedAt)) / 1000;
  const raw = taskPoints({ estMinutes: task.estMinutes, type: task.type, actualSeconds });
  const doneToday = allTasks.filter((t) => t.ownerUid === uid && t.date === task.date && t.done && t.id !== task.id);
  const before = doneToday.reduce((a, t) => a + (t.pointsAwarded || 0), 0);
  const { task: tp, efficiency: ep } = applyDailyCap(before, raw);
  const actualMinutes = Math.round(actualSeconds / 6) / 10;
  const batch = writeBatch(db);
  batch.update(doc(db, 'tasks', task.id), { done: true, doneAt: new Date(), actualMinutes, pointsAwarded: tp + ep });
  const ledger = (id, amount, reason) =>
    amount > 0 && batch.set(doc(db, 'points', id), { uid, amount, reason, refId: task.id, createdAt: serverTimestamp() });
  ledger(`task_${task.id}`, tp, 'task');
  ledger(`eff_${task.id}`, ep, 'efficiency');
  await batch.commit();
  const minutes = doneToday.reduce((a, t) => a + (t.actualMinutes || 0), 0) + actualMinutes;
  await checkGoal(uid, task.date, before + tp + ep, minutes, user);
}

async function checkGoal(uid, date, dayPoints, minutes, user) {
  if (date !== todayStr()) return;
  await runTransaction(db, async (tx) => {
    const ref = userRef(uid);
    const u = (await tx.get(ref)).data();
    const goal = u.goalMinutes || CONFIG.DAILY_GOAL_MINUTES;
    if (minutes < goal || u.lastGoalDate === date) return;
    const streak = nextStreak(u.lastGoalDate, u.streak || 0, date, daysAgoStr(1));
    const bonus = streakBonus({ dayPoints, streak });
    if (bonus > 0) tx.set(doc(db, 'points', `streak_${uid}_${date}`), { uid, amount: bonus, reason: 'streak', refId: date, createdAt: serverTimestamp() });
    tx.update(ref, { streak, lastGoalDate: date });
  });
}

/* ---------- الشات ---------- */
export async function sendMessage(uid, text, type = 'text') {
  await addDoc(collection(db, 'messages'), { fromUid: uid, text, type, createdAt: serverTimestamp() });
  if (type === 'quick') {
    const clears = text === 'رجعت' || text === 'خلصت!';
    await updateDoc(userRef(uid), clears ? { statusText: '', status: 'idle' } : { statusText: text, status: 'away' });
  }
}

/* ---------- الجلسات ---------- */
const sumPlanned = (tasks) => tasks.reduce((a, t) => a + plannedPoints(t.estMinutes, t.type), 0);
const member = (tasks) => ({ taskIds: tasks.map((t) => t.id), plannedPoints: sumPlanned(tasks), focusSeconds: 0, finishedAt: null });

export async function createSession(uid, tasks) {
  const ref = doc(collection(db, 'sessions'));
  const batch = writeBatch(db);
  batch.set(ref, { createdBy: uid, status: 'waiting', startedAt: null, endedAt: null, result: null, members: { [uid]: member(tasks) } });
  tasks.forEach((t) => batch.update(doc(db, 'tasks', t.id), { sessionId: ref.id }));
  batch.update(userRef(uid), { activeSessionId: ref.id });
  await batch.commit();
}

export async function joinSession(uid, session, tasks) {
  const batch = writeBatch(db);
  batch.update(doc(db, 'sessions', session.id), { [`members.${uid}`]: member(tasks), status: 'active', startedAt: new Date() });
  tasks.forEach((t) => batch.update(doc(db, 'tasks', t.id), { sessionId: session.id }));
  batch.update(userRef(uid), { activeSessionId: session.id, status: 'studying', statusText: '' });
  await batch.commit();
}

export const flushFocus = (sessionId, uid, seconds) =>
  updateDoc(doc(db, 'sessions', sessionId), { [`members.${uid}.focusSeconds`]: increment(seconds) }).catch(() => {});

export const markFinished = (sessionId, uid) =>
  updateDoc(doc(db, 'sessions', sessionId), { [`members.${uid}.finishedAt`]: new Date() });

// بتتنفذ مرة واحدة بس (transaction + فحص status). النتيجة بتتخزن في الجلسة وكل واحد بيكتب نقاطه هو.
export async function endSession(sessionId, tasks) {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, 'sessions', sessionId);
    const s = (await tx.get(ref)).data();
    if (!s || s.status === 'ended') return;
    const endedAt = new Date();
    let result = {};
    if (s.status === 'active') {
      const members = {};
      for (const [uid, m] of Object.entries(s.members)) {
        const mine = tasks.filter((t) => m.taskIds.includes(t.id) && t.done);
        members[uid] = {
          plannedPoints: m.plannedPoints,
          donePlannedPoints: sumPlanned(mine),
          awardedPoints: mine.reduce((a, t) => a + (t.pointsAwarded || 0), 0),
          focusSeconds: m.focusSeconds || 0
        };
      }
      result = settleSession({ durationSeconds: (endedAt - ms(s.startedAt)) / 1000, members });
    }
    tx.update(ref, { status: 'ended', endedAt, result });
  });
}

export async function settleMine(uid, session) {
  const amount = session.result?.[uid] || 0;
  const batch = writeBatch(db);
  if (amount > 0) batch.set(doc(db, 'points', `sess_${session.id}_${uid}`), { uid, amount, reason: 'session_bonus', refId: session.id, createdAt: serverTimestamp() });
  batch.update(userRef(uid), { activeSessionId: null, status: 'idle', statusText: '' });
  await batch.commit();
  return amount;
}

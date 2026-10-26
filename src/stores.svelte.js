import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { auth, db } from './firebase.js';
import { daysAgoStr } from './util.js';

const fresh = () => ({ users: {}, tasks: [], points: [], messages: [], invites: [], session: null, sessionId: null, notice: '' });
export const app = $state({ ready: false, uid: null, ...fresh() });

let unsubs = [];
let sessUnsub = null;
let sessId = null;

function stop() {
  unsubs.forEach((f) => f());
  unsubs = [];
  if (sessUnsub) sessUnsub();
  sessUnsub = null;
  sessId = null;
  Object.assign(app, fresh());
}

function watchSession(id) {
  if (id === sessId) return;
  if (sessUnsub) sessUnsub();
  sessUnsub = null;
  sessId = id;
  app.session = null;
  if (id) sessUnsub = onSnapshot(doc(db, 'sessions', id), (s) => (app.session = s.exists() ? { id: s.id, ...s.data() } : null));
}

function start(uid) {
  const list = (s, opts) => s.docs.map((d) => ({ id: d.id, ...d.data(opts) }));
  unsubs.push(
    onSnapshot(collection(db, 'users'), (s) => {
      const m = {};
      s.forEach((d) => (m[d.id] = d.data({ serverTimestamps: 'estimate' })));
      app.users = m;
      app.sessionId = m[uid]?.activeSessionId ?? null;
      watchSession(app.sessionId);
    }),
    onSnapshot(query(collection(db, 'tasks'), where('date', '>=', daysAgoStr(30))), (s) => (app.tasks = list(s))),
    onSnapshot(collection(db, 'points'), (s) => (app.points = list(s))),
    onSnapshot(query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(100)), (s) => (app.messages = list(s, { serverTimestamps: 'estimate' }).reverse())),
    onSnapshot(query(collection(db, 'sessions'), where('status', '==', 'waiting')), (s) => (app.invites = list(s).filter((x) => x.createdBy !== uid)))
  );
}

export function initAuth() {
  onAuthStateChanged(auth, (u) => {
    stop();
    app.uid = u ? u.uid : null;
    app.ready = true;
    if (u) start(u.uid);
  });
}

export const otherUid = () => Object.keys(app.users).find((u) => u !== app.uid) ?? null;

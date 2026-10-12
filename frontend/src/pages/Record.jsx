import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mic, Square, Check, Sparkles, Loader, RotateCcw } from 'lucide-react';
import api, { errorMessage } from '../api';
import { TRANSACTION_TYPES as T, TYPE_META } from '../lib/constants';
import { parseTransactionText } from '../lib/parseVoice';

const EXAMPLES = [
  'Sold milk for 250 rupees',
  'Ram took goods on credit 500',
  'Sita paid back 1200',
  'Paid shop rent 5000',
  'दूध बेचेको १५० रुपैयाँ',
];

const CAN_RECORD = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
const SpeechRecognition = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

const fmt = (n) => `NPR ${Number(n).toLocaleString('en-IN')}`;

export default function Record({ onSave }) {
  const [text, setText] = useState('');
  const [lang, setLang] = useState('ne');
  const [transcribing, setTranscribing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [listening, setListening] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const recorder = useRef(null);
  const stream = useRef(null);
  const recognition = useRef(null);
  const keepListening = useRef(false);
  const finalTranscript = useRef('');
  const restartTimer = useRef(null);

  useEffect(() => {
    Promise.all([api.get('/customers/'), api.get('/categories/')])
      .then(([c, k]) => {
        setCustomers(c.data);
        setCategories(k.data.map((x) => x.name));
      })
      .catch((e) => setError(errorMessage(e)));
    return () => {
      clearTimeout(restartTimer.current);
      keepListening.current = false;
      recognition.current?.abort();
      stream.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!listening) return undefined;
    setSeconds(0);
    const id = setInterval(() => setSeconds((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [listening]);

  const analyse = useCallback((sentence) => {
    if (!sentence.trim()) return;
    setError('');
    setDraft(parseTransactionText(sentence, customers, categories));
  }, [customers, categories]);

  const startListening = async () => {
    setError('');
    setText('');
    setDraft(null);

    // Native browser speech recognition returns interim/final text directly and
    // avoids uploading audio when it is supported (Chrome/Edge commonly use Google's service).
    if (SpeechRecognition) {
      try {
        const instance = new SpeechRecognition();
        recognition.current = instance;
        instance.lang = lang === 'ne' ? 'ne-NP' : lang === 'en' ? 'en-IN' : 'en-IN';
        instance.interimResults = true;
        instance.continuous = true;
        finalTranscript.current = '';
        keepListening.current = true;
        instance.onresult = (event) => {
          const newFinal = [];
          const interim = [];
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
            const result = event.results[i];
            if (result.isFinal) newFinal.push(result[0].transcript.trim());
            else interim.push(result[0].transcript.trim());
          }
          if (newFinal.length) finalTranscript.current = `${finalTranscript.current} ${newFinal.join(' ')}`.trim();
          const heard = `${finalTranscript.current} ${interim.join(' ')}`.trim();
          setText(heard);
        };
        instance.onerror = (event) => {
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') keepListening.current = false;
          if (event.error !== 'aborted' && event.error !== 'no-speech') setError(event.error === 'not-allowed'
            ? 'Microphone permission denied. Allow microphone access and try again.'
            : 'Speech recognition failed. Try again or type the transaction.');
        };
        instance.onend = () => {
          if (keepListening.current) {
            // Some browsers stop recognition after a short pause even in continuous mode.
            restartTimer.current = setTimeout(() => {
              if (keepListening.current) {
                try { instance.start(); } catch { /* A start already in progress will emit its own end event. */ }
              }
            }, 200);
            return;
          }
          recognition.current = null;
          setListening(false);
          const heard = finalTranscript.current.trim();
          if (heard) analyse(heard);
        };
        setListening(true);
        instance.start();
        return;
      } catch {
        recognition.current = null;
        setError('Could not start speech recognition. Try again or type the transaction.');
        return;
      }
    }

    if (!CAN_RECORD) return setError('Voice recording is not available here. Type the transaction instead.');
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      return setError('Microphone permission denied or no microphone found.');
    }
    const chunks = [];
    const rec = new MediaRecorder(stream.current);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = async () => {
      stream.current?.getTracks().forEach((t) => t.stop());
      setListening(false);
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      if (blob.size < 1000) return setError('No audio captured. Try again.');
      setTranscribing(true);
      try {
        const form = new FormData();
        form.append('audio', blob, `voice.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`);
        if (lang) form.append('language', lang);
        const res = await api.post('/voice/transcribe', form, { timeout: 120000 });
        const heard = res.data.text;
        if (!heard) return setError("Couldn't hear anything. Try again or type it.");
        setText(heard);
        analyse(heard);
      } catch (err) {
        setError(errorMessage(err, 'Voice transcription failed. You can type instead.'));
      } finally {
        setTranscribing(false);
      }
    };
    recorder.current = rec;
    setListening(true);
    rec.start();
  };

  const stopListening = () => {
    if (recognition.current) {
      keepListening.current = false;
      recognition.current.stop();
    } else if (recorder.current?.state === 'recording') recorder.current.stop();
  };

  const setField = (k, v) => setDraft((d) => {
    const next = { ...d, [k]: v };
    if (k === 'type') next.status = v === T.CREDIT_SALE ? 'UNPAID' : 'PAID';
    return next;
  });

  const needsCustomer = draft && (draft.type === T.CREDIT_SALE || draft.type === T.REPAYMENT);

  const save = async (e) => {
    e.preventDefault();
    setError('');
    const amount = parseFloat(draft.amount);
    if (!(amount > 0)) return setError('Enter an amount greater than 0.');
    if (needsCustomer && !draft.customer_id) return setError('Select a customer for credit sales and repayments.');
    setSaving(true);
    try {
      const res = await api.post('/transactions/', {
        type: draft.type,
        amount,
        description: draft.description || null,
        category: draft.category || 'Others',
        status: draft.status,
        customer_id: needsCustomer || draft.customer_id ? Number(draft.customer_id) || null : null,
      });
      setSaved(res.data);
      onSave?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => { setText(''); setDraft(null); setSaved(null); setError(''); };

  if (saved) {
    return (
      <div className="page">
        <div className="card record-card" style={{ textAlign: 'center', padding: 40 }}>
          <div className="success-badge"><Check size={30} /></div>
          <h2 style={{ marginBottom: 6 }}>Transaction saved</h2>
          <p className="text-muted" style={{ marginBottom: 20 }}>
            {TYPE_META[saved.type].label} · <strong>{fmt(saved.amount)}</strong>
            {saved.customer ? ` · ${saved.customer.name}` : ''}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={reset}><Mic size={16} /> Record another</button>
            <Link to="/transactions" className="btn btn-secondary">View transactions</Link>
          </div>
        </div>
      </div>
    );
  }

  const status = transcribing ? 'Transcribing…' : listening
    ? `Listening… ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
    : 'Tap the mic and speak';

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Quick record</h1>
          <p className="page-sub">Speak or type a sentence — we fill in the details, you confirm.</p>
        </div>
      </div>

      <div className="record-grid">
        {/* Capture */}
        <section className="card rec-hero">
          <div className="rec-stage">
            {CAN_RECORD || SpeechRecognition ? (
              <>
                <div className={`mic-orb ${listening ? 'live' : ''}`}>
                  <i /><i /><i />
                  <button
                    type="button"
                    className={`mic-btn xl ${listening ? 'listening' : ''}`}
                    onClick={listening ? stopListening : startListening}
                    disabled={transcribing}
                    aria-label={listening ? 'Stop recording' : 'Start recording'}
                  >
                    {transcribing ? <Loader size={30} className="spin" /> : listening ? <Square size={28} /> : <Mic size={32} />}
                  </button>
                </div>
                <div className={`wave ${listening ? 'on' : ''}`} aria-hidden="true">
                  {Array.from({ length: 21 }).map((_, i) => <span key={i} style={{ animationDelay: `${(i % 7) * 0.09}s` }} />)}
                </div>
                <div className="rec-status">{status}</div>
                <div className="segmented sm">
                  {[['ne', 'नेपाली'], ['en', 'English'], ['', 'Auto']].map(([v, label]) => (
                    <button key={label} type="button" className={lang === v ? 'on' : ''} disabled={listening || transcribing} onClick={() => setLang(v)}>{label}</button>
                  ))}
                </div>
              </>
            ) : (
              <div className="rec-status">Voice recording is not available here (needs a microphone and https or localhost). Type below instead.</div>
            )}
          </div>

          <div className="rec-type">
            <div className="rec-or"><span>or type it</span></div>
            <textarea
              className="form-control"
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='e.g. "Ram took goods on credit 500"'
            />
            <button type="button" className="btn btn-primary btn-full" style={{ marginTop: 12 }} disabled={!text.trim() || listening || transcribing} onClick={() => analyse(text)}>
              <Sparkles size={15} /> Analyse
            </button>
            <div className="chips">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" className="chip" onClick={() => { setText(ex); analyse(ex); }}>{ex}</button>
              ))}
            </div>
          </div>
        </section>

        {/* Review */}
        <section>
          {error && <div className="alert alert-error">{error}</div>}
          {draft ? (
            <form className="card" onSubmit={save}>
              <div className="card-head">
                <div>
                  <div className="card-title">Review &amp; confirm</div>
                  <div className="card-sub">Fix anything we got wrong, then save.</div>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={reset}><RotateCcw size={14} /> Clear</button>
              </div>
              <div className="card-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={draft.type} onChange={(e) => setField('type', e.target.value)}>
                      {Object.values(T).map((t) => <option key={t} value={t}>{TYPE_META[t].label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (NPR)</label>
                    <input className="form-control" type="number" min="0" step="0.01" value={draft.amount} onChange={(e) => setField('amount', e.target.value)} placeholder="0" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer{needsCustomer ? ' *' : ' (optional)'}</label>
                    <select className="form-select" value={draft.customer_id} onChange={(e) => setField('customer_id', e.target.value)}>
                      <option value="">— None —</option>
                      {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={draft.category} onChange={(e) => setField('category', e.target.value)}>
                      {[...new Set([...categories, draft.category])].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <input className="form-control" value={draft.description} onChange={(e) => setField('description', e.target.value)} />
                </div>
                <button className="btn btn-primary btn-lg btn-full" disabled={saving}>
                  {saving ? <Loader size={16} className="spin" /> : <Check size={16} />} Save transaction
                </button>
              </div>
            </form>
          ) : (
            <div className="card rec-placeholder">
              <div className="rec-ph-icon"><Sparkles size={22} /></div>
              <div style={{ fontWeight: 600 }}>Your entry will appear here</div>
              <p className="text-muted text-sm">Record or type a sentence and we turn it into a transaction you can review.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

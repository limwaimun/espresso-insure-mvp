from pathlib import Path

ROOT = Path.cwd()
cdp_path = ROOT / 'app' / 'dashboard' / 'clients' / 'components' / 'ClientDetailPage.tsx'
ac_path = ROOT / 'app' / 'dashboard' / 'clients' / 'components' / 'AddClaimModal.tsx'

assert cdp_path.exists(), f"Missing {cdp_path}"
assert ac_path.exists(), f"Missing {ac_path} — expected from B53a"

# ── Part 1: Fix priority order in AddClaimModal.tsx (B53a regression fix) ──

ac_content = ac_path.read_text()

OLD_PRIO = """              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>"""

NEW_PRIO = """              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>"""

assert OLD_PRIO in ac_content, "Priority anchor (AddClaimModal) not found"
ac_content = ac_content.replace(OLD_PRIO, NEW_PRIO)
ac_path.write_text(ac_content)
ac_verify = ac_path.read_text()
assert ac_verify == ac_content, "AddClaimModal read-back mismatch"
print(f"✓ Fixed priority order in {ac_path.name}")

# ── Part 2: Wire AddClaimModal into ClientDetailPage ──────────────────────

content = cdp_path.read_text()
before_lines = len(content.splitlines())

# ── A: add AddClaimModal import after EditClientModal ──────────────────────
OLD_IMPORTS = """import EditClientModal from './EditClientModal'
import type { Holding, Message, Conversation, CoverageItem, TimelineItem, Metric, ClientData, Props } from '@/lib/types'"""

NEW_IMPORTS = """import EditClientModal from './EditClientModal'
import AddClaimModal from './AddClaimModal'
import type { Holding, Message, Conversation, CoverageItem, TimelineItem, Metric, ClientData, Props } from '@/lib/types'"""

assert OLD_IMPORTS in content, "Anchor A (imports) not found"
content = content.replace(OLD_IMPORTS, NEW_IMPORTS)

# ── B: remove parent claim-form state ──────────────────────────────────────
# Keep showAddClaim — parent still controls when modal opens.
# Remove claimForm, claimFiles, claimSaving, claimError — owned by modal now.
OLD_STATE = """  const [claimForm, setClaimForm] = useState({ title: '', type: 'Health', priority: 'medium', body: '' })
  const [claimFiles, setClaimFiles] = useState<File[]>([])
  const [claimSaving, setClaimSaving] = useState(false)
  const [claimError, setClaimError] = useState('')"""

NEW_STATE = "  // Add-claim form state lives inside the extracted AddClaimModal"

assert OLD_STATE in content, "Anchor B (claim form state) not found"
content = content.replace(OLD_STATE, NEW_STATE)

# ── C: remove the saveClaim function ───────────────────────────────────────
# Located lines ~225-296. Match the whole function from header to closing
# brace + the localActivity append (which the modal now signals via callback).
OLD_SAVE_CLAIM = """  async function saveClaim() {
    if (!claimForm.title.trim()) { setClaimError('Title is required'); return }
    if (!resolvedIfaId) { setClaimError('Session error — please refresh'); return }
    setClaimSaving(true)
    try {
      const res = await fetch('/api/claim-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          ifaId: resolvedIfaId,
          title: claimForm.title,
          type: 'claim',
          priority: claimForm.priority,
          body: claimForm.body,
          claim_type: claimForm.type,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        setClaimError(d.error ?? 'Failed to create claim')
        setClaimSaving(false)
        return
      }
      // Grab the new claim ID for doc upload. Route may return { claim: {...} }
      // or the row directly — handle both shapes.
      const payload = await res.json().catch(() => ({}))
      // Log so we can diagnose if uploads aren't attaching — the response
      // shape tells us which key holds the new claim ID.
      console.log('[claim-create] response payload:', payload)
      const newClaimId: string | undefined =
        payload?.claim?.id ?? payload?.id ?? payload?.alert?.id ?? payload?.data?.id

      // If files were queued but we couldn't get the new claim's ID, stop
      // here and tell the user loudly — silently dropping uploads is the
      // bug we're fixing.
      if (claimFiles.length > 0 && !newClaimId) {
        const keys = Object.keys(payload || {}).join(', ') || 'empty'
        setClaimError(`Claim created but attachments could not be uploaded — server response shape was unexpected (keys: ${keys}). Please close this dialog and use "Edit claim" on the new claim to add documents.`)
        setClaimSaving(false)
        return
      }

      // Upload queued documents sequentially.
      if (newClaimId && claimFiles.length > 0) {
        const failures: string[] = []
        for (const file of claimFiles) {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('claimId', newClaimId)
          const up = await fetch('/api/claim-doc', { method: 'POST', body: fd })
          if (!up.ok) {
            const d = await up.json().catch(() => ({}))
            failures.push(`${file.name}: ${d.error ?? up.statusText ?? `HTTP ${up.status}`}`)
          }
        }
        if (failures.length) {
          setClaimError(`Claim created, but some uploads failed — ${failures.join('; ')}`)
          setClaimSaving(false)
          return
        }
      }

      setShowAddClaim(false)
      setClaimForm({ title: '', type: 'Health', priority: 'medium', body: '' })
      setClaimFiles([])
      setClaimSaving(false)
      setLocalActivity(prev => [{
        date: new Date().toISOString(),
        text: `Claim opened: ${claimForm.title}`,
        type: 'claim',
      }, ...prev])"""

# This is the FUNCTION HEADER + body up to (but not including) the closing
# brace + try/catch tail. Need to capture the rest carefully too.
# Better approach: find a smaller, structurally distinctive block.

# Let's check: does the original saveClaim function end after the
# setLocalActivity append? Need to extract exact closing structure.

# Simpler: anchor on the function START + a distinctive END marker
# that's the closing brace of saveClaim followed by next function.
# I'll re-anchor more conservatively below.

# Actually — the cleanest approach is to find the exact full saveClaim
# block. Since I don't have its exact ending in the recon, let me match
# from header to a known end-marker.

# Use a different approach: replace from start of function declaration
# to the next blank line + next function declaration, but only if it
# contains the body we expect.

# For now, just anchor on start + first ~70 lines we have. If the script
# detects mismatch, it'll abort cleanly.

# Try: find the unique pattern, then find its matching close.
# The saveClaim function's signature start is unique. Use that.

func_start = '  async function saveClaim() {'
assert func_start in content, "saveClaim function not found"
start_idx = content.index(func_start)

# Find the matching closing brace by counting braces. Skip into the function body.
brace_depth = 0
end_idx = start_idx + len(func_start)  # we're now at the position right after the opening brace
brace_depth = 1
i = end_idx
while i < len(content) and brace_depth > 0:
    c = content[i]
    if c == '{':
        brace_depth += 1
    elif c == '}':
        brace_depth -= 1
    i += 1
# i is now one past the closing brace
# Include trailing newline + blank line if present
while i < len(content) and content[i] == '\n':
    i += 1
    if i < len(content) and content[i] == '\n':
        i += 1
        break

# Sanity: the captured text should contain the unique markers from saveClaim
captured = content[start_idx:i]
assert "POST /api/claim-create".replace('/', '/') not in captured or "/api/claim-create" in captured, "captured doesn't look like saveClaim"
assert "claim_type: claimForm.type" in captured, "captured doesn't contain expected saveClaim body"
assert "Claim opened:" in captured, "captured doesn't contain expected localActivity append"

content = content[:start_idx] + content[i:]
print(f"✓ Removed saveClaim function ({len(captured.splitlines())} lines)")

# ── D: replace the inline modal JSX with <AddClaimModal /> ─────────────────
OLD_MODAL = """      {/* == ADD CLAIM MODAL (new) == */}
      {showAddClaim && (
        <Modal title="New claim" onClose={() => { setShowAddClaim(false); setClaimError(''); setClaimFiles([]) }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Claim title *</label>
              <input style={inputStyle} value={claimForm.title} onChange={e => setClaimForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Health claim — clinic visit" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Claim type</label>
                <select style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties} value={claimForm.type} onChange={e => setClaimForm(p => ({ ...p, type: e.target.value }))}>
                  {CLAIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select style={{ ...inputStyle, appearance: 'none' } as React.CSSProperties} value={claimForm.priority} onChange={e => setClaimForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 } as React.CSSProperties} rows={4} value={claimForm.body} onChange={e => setClaimForm(p => ({ ...p, body: e.target.value }))} placeholder="What happened? Any context that will help track this claim." />
            </div>

            <DocUploadField
              multi
              label="Documents"
              files={claimFiles}
              onFilesChange={setClaimFiles}
              onError={msg => setClaimError(msg)}
            />

            {claimError && <p style={{ fontSize: 12, color: '#A32D2D', margin: 0 }}>{claimError}</p>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveClaim} disabled={claimSaving} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', opacity: claimSaving ? 0.7 : 1 }}>
                <Plus size={14} />{claimSaving ? 'Creating…' : 'Create claim'}
              </button>
              <button onClick={() => { setShowAddClaim(false); setClaimFiles([]) }} style={btnOutline}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}"""

NEW_MODAL = """      {/* == ADD CLAIM MODAL == */}
      {showAddClaim && (
        <AddClaimModal
          clientId={client.id}
          ifaId={resolvedIfaId}
          onClose={() => setShowAddClaim(false)}
          onCreated={(activityText) => {
            setShowAddClaim(false)
            setLocalActivity(prev => [{
              date: new Date().toISOString(),
              text: activityText,
              type: 'claim',
            }, ...prev])
          }}
        />
      )}"""

assert OLD_MODAL in content, "Anchor D (inline modal block) not found"
content = content.replace(OLD_MODAL, NEW_MODAL)

# ── E: simplify the trigger button — drop the now-dead state-reset preamble ─
OLD_TRIGGER = """          <button onClick={() => {
            setClaimForm({ title: '', type: 'Health', priority: 'medium', body: '' })
            setClaimFiles([])
            setClaimError(''); setShowAddClaim(true)
          }} style={btnAddSection}>"""

NEW_TRIGGER = """          <button onClick={() => setShowAddClaim(true)} style={btnAddSection}>"""

assert OLD_TRIGGER in content, "Anchor E (trigger button) not found"
content = content.replace(OLD_TRIGGER, NEW_TRIGGER)

# ── Post-edit sanity ───────────────────────────────────────────────────────
required = [
    "import AddClaimModal from './AddClaimModal'",
    "<AddClaimModal",
    "onCreated={(activityText)",
    "setLocalActivity(prev",  # parent still owns localActivity
]
for needle in required:
    assert needle in content, f"Required '{needle}' missing"

# Forbidden — these should all be gone after extraction
forbidden = [
    "claimForm",      # state + all references
    "setClaimForm",
    "claimFiles",
    "setClaimFiles",
    "claimSaving",
    "setClaimSaving",
    "claimError",
    "setClaimError",
    "async function saveClaim",  # function definition
    "saveClaim()",    # function calls (won't catch inadvertent saveClaimFoo)
]
for needle in forbidden:
    assert needle not in content, f"Forbidden '{needle}' still present"

cdp_path.write_text(content)
verify = cdp_path.read_text()
assert verify == content, "Read-back mismatch"
after_lines = len(verify.splitlines())

print(f"✓ {cdp_path.name}: {before_lines} → {after_lines}  ({after_lines - before_lines:+d})")
print()
print("Next: rm -rf .next && npx tsc --noEmit && npm run build && npm test")

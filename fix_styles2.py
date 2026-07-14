import re

with open('src/components/AttendeesAdmin.tsx', 'r') as f:
    content = f.read()

# Fix the main border
content = content.replace(
    '<div className="glass-panel p-6" style={{ borderColor: isAdmin ? \'var(--accent-warning)\' : \'rgba(255,255,255,0.1)\' }}>',
    '<div className="glass-panel p-6" style={{ borderColor: \'rgba(255,255,255,0.2)\' }}>'
)

# Fix the buttons borders
content = content.replace(
    'style={{ backgroundColor: \'transparent\', color: \'#fff\', border: \'1px solid rgba(255, 255, 255, 0.3)\' }}',
    'style={{ backgroundColor: \'transparent\', color: \'#fff\', border: \'1px solid rgba(255, 255, 255, 0.2)\' }}'
)
content = content.replace(
    'style={{ backgroundColor: \'transparent\', color: \'var(--accent-danger)\', border: \'1px solid rgba(248, 113, 113, 0.3)\' }}',
    'style={{ backgroundColor: \'transparent\', color: \'var(--accent-danger)\', border: \'1px solid rgba(255, 255, 255, 0.2)\' }}'
)

# Clean up Tailwind classes safely
replacements = {
    'className="bg-black/30 p-3 rounded-lg border flex flex-col gap-2" style={{ borderColor: \'rgba(255,255,255,0.05)\' }}': 'className="flex flex-col gap-2" style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "0.75rem", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" }}',
    'className="text-sm font-bold truncate pr-2"': 'style={{ fontSize: "0.875rem", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", paddingRight: "0.5rem" }}',
    'className="text-secondary font-normal"': 'className="text-secondary" style={{ fontWeight: "normal" }}',
    'className="flex flex-col gap-2 text-sm mt-1"': 'className="flex flex-col gap-2 mt-1" style={{ fontSize: "0.875rem" }}',
    'className="flex justify-between p-2 rounded bg-black/40 border border-white/5"': 'className="flex justify-between" style={{ padding: "0.5rem", borderRadius: "0.25rem", backgroundColor: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.05)" }}',
    'className="flex flex-col gap-3 mt-2 border-t border-white/10 pt-2"': 'className="flex flex-col gap-3 mt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "0.5rem" }}',
    'className="text-sm font-bold text-warning mb-1"': 'style={{ fontSize: "0.875rem", fontWeight: "bold", color: "var(--accent-warning)", marginBottom: "0.25rem" }}',
    'className="text-sm text-secondary"': 'className="text-secondary" style={{ fontSize: "0.875rem" }}',
    'className="input-field text-sm p-1 text-center w-full"': 'className="input-field w-full text-center" style={{ fontSize: "0.875rem", padding: "0.25rem" }}',
    'className="input-field text-sm p-2 w-full"': 'className="input-field w-full" style={{ fontSize: "0.875rem", padding: "0.5rem" }}',
    'className="text-secondary font-bold text-sm"': 'className="text-secondary" style={{ fontWeight: "bold", fontSize: "0.875rem" }}',
    'className="mt-6 pt-5 border-t border-white/10"': 'className="mt-6" style={{ paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}',
    'className="text-sm font-bold"': 'style={{ fontSize: "0.875rem", fontWeight: "bold" }}',
    'className="text-xs text-secondary italic mb-2"': 'className="text-secondary" style={{ fontSize: "0.75rem", fontStyle: "italic", marginBottom: "0.5rem" }}',
    'className="mt-6 flex items-center gap-2"': 'className="flex items-center gap-2 mt-6"',
    'className="flex items-center justify-center btn"': 'className="btn flex items-center justify-center"',
    'className="mt-4 flex justify-center"': 'className="flex justify-center mt-4"',
    'className="text-xs p-1.5 rounded bg-warning/20 text-warning inline-block mt-1"': 'style={{ fontSize: "0.75rem", padding: "0.375rem", borderRadius: "0.25rem", backgroundColor: "rgba(234, 179, 8, 0.2)", color: "var(--accent-warning)", display: "inline-block", marginTop: "0.25rem" }}',
    'className="pb-3 px-2"': 'style={{ paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}',
    'className="pb-3 px-2 text-center"': 'className="text-center" style={{ paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}',
    'className="pb-3 px-2 text-right"': 'style={{ textAlign: "right", paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}',
    'className="py-3 px-2 align-top"': 'style={{ paddingTop: "0.75rem", paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", verticalAlign: "top" }}',
    'className="text-secondary text-xs"': 'className="text-secondary" style={{ fontSize: "0.75rem" }}',
    'className="text-xs mt-1 p-1 rounded bg-warning/20 text-warning inline-block"': 'style={{ fontSize: "0.75rem", marginTop: "0.25rem", padding: "0.25rem", borderRadius: "0.25rem", backgroundColor: "rgba(234, 179, 8, 0.2)", color: "var(--accent-warning)", display: "inline-block" }}',
    'className="py-3 px-2 text-center text-secondary align-top"': 'className="text-center text-secondary" style={{ paddingTop: "0.75rem", paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", verticalAlign: "top" }}',
    'className="py-3 px-2 text-right align-top"': 'style={{ textAlign: "right", paddingTop: "0.75rem", paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", verticalAlign: "top" }}',
    'className="input-field text-right text-sm w-full"': 'className="input-field w-full" style={{ textAlign: "right", fontSize: "0.875rem" }}',
    'className="py-3 px-2 text-right align-top text-success font-bold"': 'style={{ textAlign: "right", paddingTop: "0.75rem", paddingBottom: "0.75rem", paddingLeft: "0.5rem", paddingRight: "0.5rem", verticalAlign: "top", color: "var(--accent-success)", fontWeight: "bold" }}',
    'className="flex flex-col gap-5 min-w-[280px]"': 'className="flex flex-col gap-5" style={{ minWidth: "280px" }}',
    'className="bg-black/30 p-2 rounded border border-white/5"': 'style={{ backgroundColor: "rgba(0,0,0,0.3)", padding: "0.5rem", borderRadius: "0.25rem", border: "1px solid rgba(255,255,255,0.05)" }}',
    'className="text-xs text-warning mb-1"': 'style={{ fontSize: "0.75rem", color: "var(--accent-warning)", marginBottom: "0.25rem" }}',
    'className="input-field text-xs p-2 mb-2 w-full"': 'className="input-field w-full" style={{ fontSize: "0.75rem", padding: "0.5rem", marginBottom: "0.5rem" }}',
    'className="btn px-3 text-xs font-bold"': 'className="btn" style={{ paddingLeft: "0.75rem", paddingRight: "0.75rem", fontSize: "0.75rem", fontWeight: "bold" }}',
    'className="text-xs font-bold"': 'style={{ fontSize: "0.75rem", fontWeight: "bold" }}',
    'className="mt-3 flex justify-center"': 'className="flex justify-center" style={{ marginTop: "0.75rem" }}',
    'className="btn btn-secondary py-1 px-3 text-xs w-full"': 'className="btn btn-secondary w-full" style={{ padding: "0.25rem 0.75rem", fontSize: "0.75rem" }}',
    'className="text-xs text-secondary"': 'className="text-secondary" style={{ fontSize: "0.75rem" }}',
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open('src/components/AttendeesAdmin.tsx', 'w') as f:
    f.write(content)


"""Export PPTX slides to PNG via PowerPoint COM for visual verification."""
import os
import win32com.client

src = os.path.abspath('AuditAI_Investor_Pitch_Deck.pptx')
outdir = os.path.abspath('scripts/out/pptx_check')
os.makedirs(outdir, exist_ok=True)

app = win32com.client.Dispatch('PowerPoint.Application')
pres = app.Presentations.Open(src, WithWindow=False)
pres.SaveAs(outdir, 18)  # ppSaveAsPNG
pres.Close()
app.Quit()
print('Exported to', outdir)
print(sorted(os.listdir(outdir)))

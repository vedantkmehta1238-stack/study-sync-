# Run Doc — StudySync

## Reproduce uncommitted artifacts

No special artifacts needed beyond `node_modules`:

```bash
bun install
```

## Run the dev server

```bash
bun run dev
```

The dev server starts on port **5173** by default. If that port is in use, Vite picks the next available one (check terminal output).

On Windows, detach with PowerShell:

```powershell
powershell -NoProfile -Command "(Start-Process -FilePath 'C:\Users\Vedant\.bun\bin\bun.exe' -ArgumentList 'run','dev' -WorkingDirectory 'D:\project\studysync-daily-main' -RedirectStandardOutput 'D:\project\studysync-daily-main\.freebuff\preview-6b7d97a5-2ddf-47da-9c30-2ae68a3c0fd0.log' -RedirectStandardError 'D:\project\studysync-daily-main\.freebuff\preview-6b7d97a5-2ddf-47da-9c30-2ae68a3c0fd0.log.err' -WindowStyle Hidden -PassThru).Id"
```

Confirm the PID survived:
```powershell
powershell -NoProfile -Command "Get-Process -Id <pid>"
```

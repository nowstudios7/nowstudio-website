# 🚀 Push Guide - NOW·STUDIO Website

## Quick Push (cho Development)

### Cách 1: Dùng Terminal
```bash
cd ~/nowstudio-push-temp  # hoặc folder repo của bạn
git add .
git commit -m "✨ Description of your changes"
git push origin master
```

### Cách 2: Dùng Script Auto-Push
```bash
~/TẠO\ WEBSITE/AUTO-PUSH-FIXED.command
```

## Quy Trình Đầy Đủ

1. **Làm việc trên Claude Design**
   - Design website
   - Export HTML

2. **Push lên GitHub**
   ```bash
   git add index.html
   git commit -m "✨ Design update from Claude Design"
   git push origin master
   ```

3. **Cloudflare Pages Auto-Deploy** (tự động)
   - GitHub webhook trigger
   - Cloudflare Pages build từ master branch
   - Website live tại: https://nowstudio-website.pages.dev

4. **Custom Domain** (DNS propagation)
   - www.nowstudio.vn → CNAME → nowstudio-website.pages.dev
   - Status: Verifying (chờ DNS propagate 15-30 phút)

## Workflow

```
Claude Design (design) 
  ↓
Export HTML → index.html
  ↓
Copy to repo folder
  ↓
git add index.html
git commit -m "message"
git push origin master
  ↓
GitHub webhook triggers
  ↓
Cloudflare Pages auto-deploy
  ↓
Website live ✨
```

## Success Indicators ✅

Sau khi push:
- [ ] Commit shows on GitHub: https://github.com/nowstudios7/nowstudio-website
- [ ] Cloudflare Pages dashboard shows "Deployment Successful"
- [ ] Website updated tại https://nowstudio-website.pages.dev
- [ ] Custom domain www.nowstudio.vn ready (after DNS propagate)

## Config (Cloudflare Pages)

**wrangler.toml** (3 lines only):
```toml
name = "nowstudio-website"
pages_build_output_dir = "."
compatibility_date = "2024-04-10"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Git push failed | Check internet, verify remote URL |
| Pages deployment failed | Check wrangler.toml format (only 3 lines) |
| Custom domain not working | Wait for DNS propagation (15-30 min) |
| Changes not showing | Hard refresh browser or clear cache |

---

**Branch:** master  
**Repository:** https://github.com/nowstudios7/nowstudio-website.git  
**Pages:** https://nowstudio-website.pages.dev  
**Custom Domain:** www.nowstudio.vn (pending DNS)

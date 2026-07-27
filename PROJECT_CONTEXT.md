You are working on the RIPPLE Bakes & Makes website.

Project:
A small artisan business website combining:
1. Bakery products:
- breads
- cakes
- cookies
- filled pockets

2. Fabric crafts:
- custom shirts
- hats
- rice packs
- baby products


Technology:
- Astro 6.x
- Static site
- GitHub Pages deployment
- No paid services
- No backend server
- Google Sheets + Google Drive as data sources
- Google Apps Script order workflow
- Mobile-first responsive design


Current status:
- Website already builds successfully
- Deployment to GitHub Pages works
- Routes:
  /
  /bakery
  /sewing
  /gallery
  /contact
  /about
  /cart
  /checkout


Existing architecture:
Components:
- Header
- Footer
- Logo
- ProductCard
- CollectionGrid
- FormRenderer
- CartSummary
- GalleryGrid

Data:
- Google Sheets → generated JSON → typed loaders (src/data/)
- Google Drive → dynamic image discovery (public/images/)
- Static data (gallery, testimonials) in src/data/static/


Brand identity:
Warm artisan handmade feeling.

Colors:
Honey gold:
#D9A441

Cream:
#FFF7E8

Dark brown:
#5A3825

Sage green:
#879B72

Dusty rose:
#C9827A


Logo concept:
A ripple-inspired symbol.
Inside:
- left: wheat/bakery
- right: thread spool/needle
- bee connecting both.


Design goal:
Professional small business website.
Avoid generic templates.
Should feel handmade, warm, premium, trustworthy.


Important:
Before changing architecture:
- inspect existing files
- preserve working functionality
- make minimal changes
- explain what you plan to modify
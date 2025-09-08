// app/web/mapHtml.ts
export const MAP_HTML = `
<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  html,body,#map{height:100%;margin:0;padding:0}
  .leaflet-popup-content-wrapper{border-radius:10px}
  .poi-img { display:block; width:240px; max-width:80vw; height:auto; margin-top:6px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,.25); }
  .poi-title { font:700 14px/1.3 sans-serif; margin:0; }

  .leaflet-div-icon{background:transparent;border:none;}

  .num-pin{
    width:32px;height:32px;border-radius:50%;
    display:flex;align-items:center;justify-content:center;
    font:700 16px/1 sans-serif;color:#fff;
    border:3px solid #fff;
    box-shadow:0 2px 8px rgba(0,0,0,.25);
  }
  .num-pin.start { background:#16a34a; }   /* verde pentru Start */
  .num-pin.middle { background:#2563eb; }  /* albastru pentru POI-uri */
  .num-pin.end { background:#dc2626; }     /* roșu pentru Final */
  .num-pin.transit { background:#f59e0b; } /* portocaliu pentru transport */
</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  console.log('[MapHTML] Starting simple map initialization...');

  // Simple, direct initialization
  let map;

  try {
    console.log('[MapHTML] Creating map...');
    map = L.map('map', { zoomControl: true });

    console.log('[MapHTML] Adding tiles...');
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    console.log('[MapHTML] Setting initial view...');
    map.setView([44.4268, 26.1025], 10); // Bucharest

    console.log('[MapHTML] Map ready!');
  } catch (error) {
    console.error('[MapHTML] Failed to initialize map:', error);
    document.getElementById('map').innerHTML = '<div style="padding:20px;text-align:center;color:#666;">Map failed to load. Please refresh.</div>';
  }

  let markers = [];
  let routeLayer = null;

  function clearAll(){
    if (!map) return;
    markers.forEach(m => map.removeLayer(m));
    markers = [];
    if(routeLayer){ map.removeLayer(routeLayer); routeLayer = null; }
  }

  function numberedIcon(n, cls){
    return L.divIcon({
      html: '<div class="num-pin '+cls+'">'+n+'</div>',
      className: "",
      iconSize: [32,32],
      iconAnchor: [16,32],
      popupAnchor: [0,-32]
    });
  }

  function transitIcon(kind){
    var sym = kind === 'metro' ? 'M' : '🚌';
    return L.divIcon({
      html: '<div class="num-pin transit">'+sym+'</div>',
      className: "",
      iconSize: [28,28],
      iconAnchor: [14,28],
      popupAnchor: [0,-28]
    });
  }

  // Disabled route drawing - no longer needed
  async function drawRoute(coords, mode, dashed){
    console.log('[MapHTML] Route drawing disabled - showing only markers');
    return;
  }

  function fitTo(coords){
    const ll = coords.map(c => [c.lat, c.lon]);
    const b = L.latLngBounds(ll);
    map.fitBounds(b.pad(0.2));
  }

  // (Transit shapes disabled for stability)

  // transit icon (avoid emojis to prevent encoding issues)
  function transitIcon(kind){
    var sym = (kind === 'metro') ? 'M' : 'B';
    return L.divIcon({
      html: '<div class="num-pin transit" style="background:#111;font-size:16px;width:22px;height:22px;line-height:22px">'+sym+'</div>',
      className: "",
      iconSize: [22,22],
      iconAnchor: [11,22],
      popupAnchor: [0,-22]
    });
  }

  // unified step icon: numbered with optional transit badge above
  function stepIcon(num, kind, transit){
    var badge = '';
    if (kind === 'transit'){
      var sym = (transit === 'metro') ? 'M' : 'B';
      badge = '<div style="position:absolute;top:-12px;left:50%;transform:translateX(-50%);font:700 12px/1 sans-serif;color:#0ea5e9;text-shadow:0 1px 2px rgba(0,0,0,.35)">'+sym+'</div>';
    }
    return L.divIcon({
      html: '<div style="position:relative"><div class="num-pin middle">'+num+'</div>'+badge+'</div>',
      className: "",
      iconSize: [28,28],
      iconAnchor: [14,28],
      popupAnchor: [0,-28]
    });
  }

  // Simplified function - no longer draws route segments, only markers
  async function drawSegments(segs){
    console.log('[MapHTML] Skipping route drawing - showing only location markers');
    // No route drawing - users will navigate themselves
    return;
  }

  async function fetchNearbyPhoto(lat, lon){
    try{
      var url1 = "https://commons.wikimedia.org/w/api.php?action=query&list=geosearch&gscoord=" + lat + "|" + lon + "&gsradius=300&gslimit=10&gsnamespace=6&format=json&origin=*";
      var r1 = await fetch(url1); var j1 = await r1.json();
      var first = j1 && j1.query && j1.query.geosearch && j1.query.geosearch[0];
      var pgTitle = first && first.title;
      if(!pgTitle) return null;
      var t = encodeURIComponent(pgTitle);
      var url2 = "https://commons.wikimedia.org/w/api.php?action=query&titles=" + t + "&prop=imageinfo&iiprop=url&iiurlwidth=600&format=json&origin=*";
      var r2 = await fetch(url2); var j2 = await r2.json();
      var page = j2 && j2.query && j2.query.pages && Object.values(j2.query.pages)[0];
      var info = page && page.imageinfo && page.imageinfo[0];
      return (info && (info.thumburl || info.url)) || null;
    }catch(_){ return null; }
  }

  window.renderPlan = function(payload){
    try{
      console.log('[MapHTML] renderPlan called with payload:', payload);

      // Check if map is available
      if (!map) {
        console.error('[MapHTML] Map not available');
        return;
      }

      clearAll();
      const points = payload.points || [];
      const avatar = payload.userAvatar || null;
      console.log('[MapHTML] Processing ' + points.length + ' points, avatar: ' + (avatar ? 'present' : 'none'));
      var poiIndex = 1;
      for (let idx=0; idx<points.length; idx++){
        const p = points[idx];
        var icon;
        if (p.kind === 'transit') {
          icon = transitIcon(p.transit);
        } else if (p.kind === 'poi') {
          icon = numberedIcon(poiIndex++, 'middle');
        } else {
          // Simple user location marker
          console.log('[MapHTML] Creating start marker');
          icon = L.divIcon({
            html: '<div style="width:32px;height:32px;border-radius:50%;background:#16a34a;border:3px solid #fff;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:16px">📍</div>',
            className: "",
            iconSize: [32,32],
            iconAnchor: [16,32],
            popupAnchor: [0,-32]
          });
        }
        var m = L.marker([p.lat, p.lon], { icon }).addTo(map);
        var pid = 'poi_' + idx;
        var title = (idx+1)+'. '+(p.name || 'Punct');
        var imgHtml = p.imageUrl ? ('<img class="poi-img" src="'+p.imageUrl+'" />') : ('<div id="'+pid+'"></div>');
        m.bindPopup('<div><div class="poi-title">'+title+'</div>'+imgHtml+'</div>');
        m.on('popupopen', async () => {
          if(p.imageUrl) return; // already has
          var url = await fetchNearbyPhoto(p.lat, p.lon);
          if(!url) return;
          var el = document.getElementById(pid);
          if(el){ el.innerHTML = '<img class="poi-img" src="'+url+'" />'; }
        });
        markers.push(m);
      }
      if(points.length){
        fitTo(points);
        console.log('[MapHTML] Map fitted to bounds');
      }
      // Route drawing disabled - showing only markers
      console.log('[MapHTML] Successfully displayed ' + points.length + ' location markers');
    }catch(e){
      console.error('[MapHTML] Error in renderPlan:', e);
    }
  };

  // Confirm renderPlan is available
  console.log('[MapHTML] renderPlan function defined:', typeof window.renderPlan);

  // Add ready event
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[MapHTML] DOM loaded, map ready for renderPlan calls');
  });
</script>
</body></html>
`.trim();



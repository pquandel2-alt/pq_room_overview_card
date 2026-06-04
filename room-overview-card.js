// =====================================================================
//  Room Overview Card v1.0.0
// =====================================================================

const ROC_STATE_MAP = {
  on:'An', off:'Aus',
  open:'Offen', closed:'Zu', opening:'Öffnet', closing:'Schließt',
  locked:'Verriegelt', unlocked:'Offen',
  detected:'Erkannt', clear:'Frei',
  idle:'Bereit', playing:'Spielt', paused:'Pausiert', standby:'Standby',
  cleaning:'Saugt', docked:'In Station', returning:'Kehrt zurück',
  heat:'Heizen', cool:'Kühlen', auto:'Auto', heat_cool:'Auto',
  dry:'Trocknen', fan_only:'Lüfter',
  active:'Aktiv', inactive:'Inaktiv',
  unavailable:'–', unknown:'–',
};

const ROC_CLIMATE_MODES = {
  heat:'Heizen', cool:'Kühlen', auto:'Auto', heat_cool:'Auto Temp',
  dry:'Trocknen', fan_only:'Lüfter', off:'Aus',
};

const ROC_DOMAIN_ICONS = {
  light:'mdi:lightbulb', switch:'mdi:toggle-switch', sensor:'mdi:eye',
  binary_sensor:'mdi:radiobox-marked', climate:'mdi:thermostat',
  cover:'mdi:window-shutter', media_player:'mdi:television',
  input_boolean:'mdi:toggle-switch', script:'mdi:script-text',
  automation:'mdi:robot', vacuum:'mdi:robot-vacuum', camera:'mdi:camera',
  person:'mdi:account', device_tracker:'mdi:map-marker',
  input_select:'mdi:form-select', input_number:'mdi:numeric',
  input_text:'mdi:form-textbox', timer:'mdi:timer',
  lock:'mdi:lock', fan:'mdi:fan', number:'mdi:numeric',
  button:'mdi:gesture-tap-button', input_button:'mdi:gesture-tap-button',
  scene:'mdi:palette', select:'mdi:form-select',
};

function rocDomainIcon(entityId) {
  if (!entityId) return 'mdi:help-circle';
  return ROC_DOMAIN_ICONS[entityId.split('.')[0]] || 'mdi:help-circle';
}
function rocEntityIcon(hass, entityId) {
  if (!hass || !entityId) return rocDomainIcon(entityId);
  const st = hass.states[entityId];
  if (!st) return rocDomainIcon(entityId);
  return st.attributes.icon || rocDomainIcon(entityId);
}
function rocEntityId(item) {
  return typeof item === 'string' ? item : (item?.entity || '');
}
function rocEntityLabel(item, hass) {
  const entityId = rocEntityId(item);
  if (typeof item === 'object' && item.name) return item.name;
  return hass?.states[entityId]?.attributes.friendly_name || entityId;
}

// ── Popup entity row HTML builder ──────────────────────────────────
function rocBuildEntityRow(item, hass) {
  const entityId = rocEntityId(item);
  if (!entityId) return '';
  const st = hass?.states[entityId];
  const label = rocEntityLabel(item, hass);
  const domain = entityId.split('.')[0];
  const icon = rocEntityIcon(hass, entityId);
  const IC = (ic, color = 'rgba(255,255,255,0.55)') =>
    `<ha-icon icon="${ic}" style="--mdc-icon-size:20px;color:${color};flex-shrink:0;"></ha-icon>`;
  const TOGGLE = (eid, isOn) => `
    <label class="toggle-sw">
      <input type="checkbox" data-entity="${eid}" data-control="toggle" ${isOn ? 'checked' : ''} />
      <span class="tog-track"><span class="tog-thumb"></span></span>
    </label>`;
  const SLIDER = (eid, min, max, step, val, unit, type) => `
    <div class="popup-row-head" style="padding:0;">
      <span class="popup-val-badge" data-val="${eid}">${val}${unit ? ' '+unit : ''}</span>
    </div>
    <input type="range" class="popup-slider" data-entity="${eid}" data-control="slider"
      data-type="${type}" data-unit="${unit}" min="${min}" max="${max}" step="${step}" value="${val}" />`;
  const COVBTN = (eid, ctrl, lbl) =>
    `<button class="cov-btn" data-entity="${eid}" data-control="${ctrl}">${lbl}</button>`;
  const ACTBTN = (eid, ctrl, lbl) =>
    `<button class="act-btn" data-entity="${eid}" data-control="${ctrl}">${lbl}</button>`;

  if (!st) {
    return `<div class="popup-row">${IC(icon,'rgba(255,255,255,0.2)')}<span class="popup-label" style="opacity:.4">${label} (nicht verfügbar)</span></div>`;
  }

  const s = st.state;
  const isOn = s === 'on';

  // Button / Scene / Script
  if (['button', 'input_button', 'scene'].includes(domain)) {
    return `<div class="popup-row">${IC(icon)}<span class="popup-label">${label}</span>
      ${ACTBTN(entityId, 'press', domain === 'scene' ? 'Aktivieren' : 'Auslösen')}</div>`;
  }
  if (domain === 'script') {
    return `<div class="popup-row">${IC(icon, isOn ? '#ffd54f' : 'rgba(255,255,255,0.55)')}
      <span class="popup-label">${label}</span>
      ${isOn ? `<span class="popup-state-val">Läuft…</span>` : ''}
      ${ACTBTN(entityId, 'press', 'Ausführen')}</div>`;
  }

  // Lock
  if (domain === 'lock') {
    const locked = s === 'locked';
    return `<div class="popup-row">
      ${IC(locked ? 'mdi:lock' : 'mdi:lock-open-outline', locked ? '#ffd54f' : 'rgba(255,255,255,0.5)')}
      <span class="popup-label">${label}</span>
      <span class="popup-state-val">${locked ? 'Verriegelt' : 'Offen'}</span>
      ${TOGGLE(entityId, locked)}</div>`;
  }

  // Cover
  if (domain === 'cover') {
    const pos = st.attributes.current_position;
    return `<div class="popup-row">${IC(icon)}
      <span class="popup-label">${label}</span>
      ${pos !== undefined ? `<span class="popup-state-val">${pos} %</span>` : ''}
      <div class="btn-grp">
        ${COVBTN(entityId,'cover-open','Auf')}
        ${COVBTN(entityId,'cover-stop','Stop')}
        ${COVBTN(entityId,'cover-close','Zu')}
      </div></div>`;
  }

  // Climate
  if (domain === 'climate') {
    const modes = st.attributes.hvac_modes || [];
    const temp = st.attributes.temperature;
    const currTemp = st.attributes.current_temperature;
    const minT = st.attributes.min_temp ?? 5;
    const maxT = st.attributes.max_temp ?? 35;
    const stepT = st.attributes.target_temp_step ?? 0.5;
    return `<div class="popup-row popup-col">
      <div class="popup-row-head">
        ${IC(icon, s !== 'off' ? '#ffd54f' : 'rgba(255,255,255,0.4)')}
        <span class="popup-label">${label}</span>
        ${currTemp !== undefined ? `<span class="popup-state-val">${currTemp} °C</span>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:10px;padding:2px 0;">
        <span style="font-size:12px;color:rgba(255,255,255,0.4);flex:1;">Modus</span>
        <select class="popup-select" data-entity="${entityId}" data-control="select">
          ${modes.map(m=>`<option value="${m}" ${m===s?'selected':''}>${ROC_CLIMATE_MODES[m]||m}</option>`).join('')}
        </select>
      </div>
      ${temp !== undefined ? SLIDER(entityId, minT, maxT, stepT, temp, '°C', 'climate-temp') : ''}
    </div>`;
  }

  // Media Player
  if (domain === 'media_player') {
    const isPlaying = s === 'playing';
    const isOff = ['off','unavailable','unknown'].includes(s);
    const vol = Math.round((st.attributes.volume_level ?? 0) * 100);
    const title = st.attributes.media_title || '';
    const artist = st.attributes.media_artist || '';
    const mediaText = title ? (artist ? `${artist} – ${title}` : title) : '';
    return `<div class="popup-row popup-col">
      <div class="popup-row-head">
        ${IC(icon, isPlaying ? '#ffd54f' : 'rgba(255,255,255,0.5)')}
        <span class="popup-label">${label}</span>
        ${!isOff ? `<button class="act-btn" data-entity="${entityId}" data-control="media-play" style="padding:5px 8px;">
          <ha-icon icon="${isPlaying ? 'mdi:pause' : 'mdi:play'}" style="--mdc-icon-size:16px;"></ha-icon>
        </button>` : `<span class="popup-state-val">${ROC_STATE_MAP[s]||s}</span>`}
      </div>
      ${mediaText ? `<div style="font-size:12px;color:rgba(255,255,255,0.4);padding-left:32px;" data-media-info="${entityId}">${mediaText}</div>` : ''}
      ${!isOff && st.attributes.volume_level !== undefined ? `
      <div style="display:flex;align-items:center;gap:8px;">
        <ha-icon icon="mdi:volume-medium" style="--mdc-icon-size:16px;color:rgba(255,255,255,0.35);flex-shrink:0;"></ha-icon>
        <input type="range" class="popup-slider" style="flex:1;" data-entity="${entityId}" data-control="slider" data-type="volume" data-unit="%" min="0" max="100" step="1" value="${vol}" />
        <span class="popup-val-badge" data-val="${entityId}">${vol} %</span>
      </div>` : ''}
    </div>`;
  }

  // Vacuum
  if (domain === 'vacuum') {
    const isCleaning = s === 'cleaning';
    const isDocked = s === 'docked';
    const isPaused = s === 'paused';
    const stLbl = {cleaning:'Saugt',returning:'Kehrt zurück',docked:'In Station',idle:'Bereit',paused:'Pausiert',error:'Fehler'}[s] || s;
    return `<div class="popup-row">${IC(icon, isCleaning ? '#ffd54f' : 'rgba(255,255,255,0.5)')}
      <span class="popup-label">${label}</span>
      <span class="popup-state-val">${stLbl}</span>
      <div class="btn-grp">
        ${!isCleaning && !isPaused ? COVBTN(entityId,'vacuum-start','Start') : ''}
        ${isCleaning ? COVBTN(entityId,'vacuum-pause','Pause') : ''}
        ${isPaused ? COVBTN(entityId,'vacuum-start','Weiter') : ''}
        ${!isDocked ? COVBTN(entityId,'vacuum-dock','Dock') : ''}
      </div></div>`;
  }

  // Timer
  if (domain === 'timer') {
    const isActive = s === 'active';
    const isPaused = s === 'paused';
    const remaining = st.attributes.remaining || '–';
    return `<div class="popup-row">${IC(icon, isActive ? '#ffd54f' : 'rgba(255,255,255,0.5)')}
      <span class="popup-label">${label}</span>
      <span class="popup-val-badge" data-timer="${entityId}">${remaining}</span>
      <div class="btn-grp">
        ${!isActive || isPaused ? COVBTN(entityId,'timer-start', isPaused ? 'Weiter' : 'Start') : ''}
        ${isActive && !isPaused ? COVBTN(entityId,'timer-pause','Pause') : ''}
        ${(isActive || isPaused) ? COVBTN(entityId,'timer-cancel','Stop') : ''}
      </div></div>`;
  }

  // Input Text
  if (domain === 'input_text') {
    return `<div class="popup-row popup-col">
      <div class="popup-row-head">${IC(icon)}<span class="popup-label">${label}</span></div>
      <input type="text" class="popup-text-input" data-entity="${entityId}" data-control="text" value="${s}" maxlength="${st.attributes.max ?? 100}" />
    </div>`;
  }

  // Automation
  if (domain === 'automation') {
    return `<div class="popup-row">${IC(icon, isOn ? '#ffd54f' : 'rgba(255,255,255,0.5)')}
      <span class="popup-label">${label}</span>
      ${ACTBTN(entityId,'automation-trigger','Auslösen')}
      ${TOGGLE(entityId, isOn)}</div>`;
  }

  // Fan
  if (domain === 'fan') {
    const hasPct = st.attributes.percentage !== undefined && st.attributes.percentage_step !== undefined;
    const pct = st.attributes.percentage ?? 0;
    const pctStep = st.attributes.percentage_step ?? 1;
    return `<div class="popup-row popup-col">
      <div class="popup-row-head">
        ${IC(icon, isOn ? '#ffd54f' : 'rgba(255,255,255,0.5)')}
        <span class="popup-label">${label}</span>
        ${TOGGLE(entityId, isOn)}
      </div>
      ${hasPct && isOn ? SLIDER(entityId, 0, 100, pctStep, pct, '%', 'fan-pct') : ''}
    </div>`;
  }

  // Input Number / Number
  if (['input_number', 'number'].includes(domain)) {
    const min = st.attributes.min ?? 0;
    const max = st.attributes.max ?? 100;
    const step = st.attributes.step ?? 1;
    const val = parseFloat(s);
    const unit = st.attributes.unit_of_measurement || '';
    return `<div class="popup-row popup-col">
      <div class="popup-row-head">${IC(icon)}<span class="popup-label">${label}</span></div>
      ${SLIDER(entityId, min, max, step, val, unit, 'number')}
    </div>`;
  }

  // Input Select / Select
  if (['input_select', 'select'].includes(domain)) {
    const opts = st.attributes.options || [];
    return `<div class="popup-row">${IC(icon)}<span class="popup-label">${label}</span>
      <select class="popup-select" data-entity="${entityId}" data-control="select">
        ${opts.map(o=>`<option value="${o}" ${o===s?'selected':''}>${o}</option>`).join('')}
      </select></div>`;
  }

  // Generic: options attribute → select
  if (Array.isArray(st.attributes.options) && st.attributes.options.length) {
    const opts = st.attributes.options;
    return `<div class="popup-row">${IC(icon)}<span class="popup-label">${label}</span>
      <select class="popup-select" data-entity="${entityId}" data-control="select">
        ${opts.map(o=>`<option value="${o}" ${o===s?'selected':''}>${o}</option>`).join('')}
      </select></div>`;
  }

  // Generic: min/max attributes → slider
  if (st.attributes.min !== undefined && st.attributes.max !== undefined) {
    const min = st.attributes.min, max = st.attributes.max;
    const step = st.attributes.step ?? 1;
    const val = parseFloat(s);
    const unit = st.attributes.unit_of_measurement || '';
    return `<div class="popup-row popup-col">
      <div class="popup-row-head">${IC(icon)}<span class="popup-label">${label}</span></div>
      ${SLIDER(entityId, min, max, step, val, unit, 'number')}
    </div>`;
  }

  // Generic: on/off → toggle
  if (s === 'on' || s === 'off') {
    return `<div class="popup-row">${IC(icon, isOn ? '#ffd54f' : 'rgba(255,255,255,0.45)')}
      <span class="popup-label">${label}</span>
      ${TOGGLE(entityId, isOn)}</div>`;
  }

  // Fallback: display + more-info
  const disp = s + (st.attributes.unit_of_measurement ? ` ${st.attributes.unit_of_measurement}` : '');
  return `<div class="popup-row">${IC(icon)}
    <span class="popup-label">${label}</span>
    <span class="popup-state-val">${disp}</span>
    <button class="act-btn" data-entity="${entityId}" data-control="more-info" style="padding:4px 8px;">
      <ha-icon icon="mdi:information-outline" style="--mdc-icon-size:16px;"></ha-icon>
    </button></div>`;
}

// =====================================================================
//  Main Card
// =====================================================================
class RoomOverviewCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._lastRenderKey = null;
    this._popupEl = null;
    this._popupOpen = false;
  }

  setConfig(config) {
    if (!config) throw new Error('Keine Konfiguration angegeben');
    this._config = { border_radius: 16, sections: [], ...config };
  }

  set hass(hass) {
    this._hass = hass;
    if (this._popupOpen) {
      this._refreshPopup();
    } else {
      this._render();
    }
  }

  _allEntities() {
    return (this._config.sections || []).flatMap(s => s.entities || []);
  }

  _countLights() {
    const hass = this._hass;
    const lights = this._allEntities().filter(e => rocEntityId(e).startsWith('light.'));
    const on = lights.filter(e => hass?.states[rocEntityId(e)]?.state === 'on').length;
    return { on, total: lights.length };
  }

  _countOpenSensors() {
    const hass = this._hass;
    const OPEN_DC = ['door','window','opening','garage_door'];
    return this._allEntities().filter(e => {
      const id = rocEntityId(e);
      if (!id.startsWith('binary_sensor.')) return false;
      const st = hass?.states[id];
      return st && OPEN_DC.includes(st.attributes.device_class) && st.state === 'on';
    }).length;
  }

  _render() {
    if (!this._hass) return;
    const c = this._config;
    const name = c.name || 'Zimmer';
    const icon = c.icon || 'mdi:home';

    const tempSt = c.temperature_entity ? this._hass.states[c.temperature_entity] : null;
    const humSt  = c.humidity_entity  ? this._hass.states[c.humidity_entity]  : null;
    const temp = tempSt ? parseFloat(tempSt.state) : null;
    const hum  = humSt  ? parseFloat(humSt.state)  : null;
    const lights = this._countLights();
    const open   = this._countOpenSensors();

    const renderKey = `${name}|${icon}|${temp}|${hum}|${lights.on}|${lights.total}|${open}|${JSON.stringify(c)}`;
    if (renderKey === this._lastRenderKey) return;
    this._lastRenderKey = renderKey;

    let badges = '';
    if (temp !== null && !isNaN(temp)) {
      badges += `<div class="badge"><ha-icon icon="mdi:thermometer"></ha-icon><span>${temp.toFixed(1)} °C</span></div>`;
    }
    if (hum !== null && !isNaN(hum)) {
      badges += `<div class="badge"><ha-icon icon="mdi:water-percent"></ha-icon><span>${Math.round(hum)} %</span></div>`;
    }
    if (lights.total > 0) {
      badges += `<div class="badge ${lights.on > 0 ? 'badge-active' : ''}">
        <ha-icon icon="mdi:lightbulb-multiple-outline"></ha-icon>
        <span>${lights.on}<span style="opacity:.5">/${lights.total}</span></span>
      </div>`;
    }
    if (open > 0) {
      badges += `<div class="badge badge-warn"><ha-icon icon="mdi:door-open"></ha-icon><span>${open} offen</span></div>`;
    }

    const hasSections = (c.sections || []).some(s => (s.entities || []).length > 0);

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .card {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: ${c.border_radius || 16}px;
          padding: 16px 18px;
          cursor: ${hasSections ? 'pointer' : 'default'};
          user-select: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .card:active { transform: ${hasSections ? 'scale(0.98)' : 'none'}; }
        .header {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 13px;
        }
        .room-icon { --mdc-icon-size: 26px; color: rgba(255,255,255,0.85); }
        .room-name {
          font-size: 15px;
          font-weight: 600;
          color: rgba(255,255,255,0.92);
          flex: 1;
        }
        .popup-hint {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .popup-hint ha-icon { --mdc-icon-size: 14px; }
        .badges {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .badge {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.11);
          border-radius: 20px;
          padding: 4px 10px 4px 7px;
          font-size: 13px;
          color: rgba(255,255,255,0.72);
        }
        .badge ha-icon { --mdc-icon-size: 15px; }
        .badge-active {
          background: rgba(255,213,79,0.14);
          border-color: rgba(255,213,79,0.38);
          color: #ffd54f;
        }
        .badge-warn {
          background: rgba(255,152,50,0.14);
          border-color: rgba(255,152,50,0.38);
          color: #ff9632;
        }
        .no-badges {
          font-size: 12px;
          color: rgba(255,255,255,0.28);
        }
      </style>
      <div class="card" id="card">
        <div class="header">
          <ha-icon class="room-icon" icon="${icon}"></ha-icon>
          <span class="room-name">${name}</span>
          ${hasSections ? `<span class="popup-hint"><ha-icon icon="mdi:chevron-right"></ha-icon></span>` : ''}
        </div>
        <div class="badges">
          ${badges || `<span class="no-badges">Keine Sensoren konfiguriert</span>`}
        </div>
      </div>
    `;

    this._ensurePopup();

    if (hasSections) {
      this.shadowRoot.getElementById('card').addEventListener('click', () => this._openPopup());
    }
  }

  // ── Popup ─────────────────────────────────────────────────────────

  _openPopup() {
    this._popupOpen = true;
    if (!this._popupEl) {
      this._popupEl = document.createElement('div');
      this.shadowRoot.appendChild(this._popupEl);
    } else if (!this.shadowRoot.contains(this._popupEl)) {
      this.shadowRoot.appendChild(this._popupEl);
    }
    this._popupEl.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end;justify-content:center;';
    this._buildPopupContent();
  }

  _closePopup() {
    this._popupOpen = false;
    if (this._popupEl) this._popupEl.style.display = 'none';
    this._lastRenderKey = null;
    this._render();
  }

  _ensurePopup() {
    if (!this._popupEl) return;
    if (!this.shadowRoot.contains(this._popupEl)) this.shadowRoot.appendChild(this._popupEl);
    this._popupEl.style.cssText = `position:fixed;inset:0;z-index:9999;display:${this._popupOpen ? 'flex' : 'none'};align-items:flex-end;justify-content:center;`;
  }

  _refreshPopup() {
    if (!this._popupEl || !this._hass) return;
    this._allEntities().forEach(item => {
      const entityId = rocEntityId(item);
      if (!entityId) return;
      const st = this._hass.states[entityId];
      if (!st) return;
      const domain = entityId.split('.')[0];

      const cb = this._popupEl.querySelector(`[data-entity="${entityId}"][data-control="toggle"]`);
      if (cb) cb.checked = (domain === 'lock') ? st.state === 'locked' : st.state === 'on';

      const slider = this._popupEl.querySelector(`[data-entity="${entityId}"][data-control="slider"]`);
      if (slider) {
        const t = slider.dataset.type;
        let val;
        if (t === 'climate-temp')  val = st.attributes.temperature;
        else if (t === 'volume')   val = Math.round((st.attributes.volume_level ?? 0) * 100);
        else if (t === 'fan-pct')  val = st.attributes.percentage ?? 0;
        else                       val = parseFloat(st.state);
        if (!isNaN(val)) slider.value = val;
      }

      const valEl = this._popupEl.querySelector(`[data-val="${entityId}"]`);
      if (valEl && slider) {
        const t = slider.dataset.type;
        const unit = slider.dataset.unit || '';
        if (t === 'climate-temp') valEl.textContent = `${st.attributes.temperature ?? '–'} °C`;
        else if (t === 'volume')  valEl.textContent = `${Math.round((st.attributes.volume_level ?? 0) * 100)} %`;
        else if (t === 'fan-pct') valEl.textContent = `${st.attributes.percentage ?? 0} %`;
        else { const u = st.attributes.unit_of_measurement || unit; valEl.textContent = `${parseFloat(st.state)}${u ? ' '+u : ''}`; }
      }

      const sel = this._popupEl.querySelector(`[data-entity="${entityId}"][data-control="select"]`);
      if (sel) sel.value = st.state;

      const timerEl = this._popupEl.querySelector(`[data-timer="${entityId}"]`);
      if (timerEl) timerEl.textContent = st.attributes.remaining || '–';

      const mediaInfo = this._popupEl.querySelector(`[data-media-info="${entityId}"]`);
      if (mediaInfo) {
        const t = st.attributes.media_title || '';
        const a = st.attributes.media_artist || '';
        mediaInfo.textContent = t ? (a ? `${a} – ${t}` : t) : '';
      }
    });
  }

  _buildPopupContent() {
    const c = this._config;
    const hass = this._hass;
    const sections = c.sections || [];
    const cardName = c.name || 'Zimmer';

    let content = '';
    sections.forEach(section => {
      const entities = section.entities || [];
      if (!section.title && entities.length === 0) return;

      if (section.title) {
        content += `<div class="section-heading">${section.title}</div>`;
      }
      entities.forEach(item => {
        content += rocBuildEntityRow(item, hass);
      });
    });

    if (!content) {
      content = `<div style="text-align:center;padding:20px 0;color:rgba(255,255,255,0.35);font-size:13px;">Keine Entitäten konfiguriert</div>`;
    }

    this._popupEl.innerHTML = `
      <style>
        .popup-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);}
        .popup-sheet{
          position:relative;width:100%;max-width:500px;max-height:85vh;overflow-y:auto;
          background:rgba(28,28,38,0.96);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          border:1px solid rgba(255,255,255,0.14);border-radius:20px 20px 0 0;
          padding:20px;box-sizing:border-box;animation:rocSlideUp .25s ease;
        }
        @keyframes rocSlideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
        .popup-header{display:flex;align-items:center;gap:12px;margin-bottom:16px;}
        .popup-header ha-icon{--mdc-icon-size:22px;color:rgba(255,255,255,0.7);}
        .popup-title{font-size:16px;font-weight:600;color:rgba(255,255,255,0.92);flex:1;}
        .popup-close{background:rgba(255,255,255,0.1);border:none;border-radius:50%;width:28px;height:28px;color:rgba(255,255,255,0.7);cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;}
        .popup-close:hover{background:rgba(255,255,255,0.2);}
        .section-heading{
          font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;
          color:rgba(255,255,255,0.4);margin:14px 0 4px;padding-bottom:6px;
          border-bottom:1px solid rgba(255,255,255,0.1);
        }
        .section-heading:first-child{margin-top:0;}
        .popup-row{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.06);}
        .popup-row:last-child{border-bottom:none;}
        .popup-col{flex-direction:column;align-items:stretch;gap:8px;}
        .popup-row-head{display:flex;align-items:center;gap:12px;}
        .popup-label{flex:1;font-size:14px;color:rgba(255,255,255,0.87);}
        .popup-state-val{font-size:13px;color:rgba(255,255,255,0.45);font-weight:500;}
        .popup-val-badge{font-size:13px;color:#ffd54f;font-weight:600;white-space:nowrap;}
        .popup-slider{width:100%;accent-color:#ffd54f;cursor:pointer;}
        .popup-select{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:rgba(255,255,255,0.9);padding:6px 10px;font-size:13px;outline:none;max-width:160px;}
        .popup-select option{background:#2a2a3a;color:#fff;}
        .popup-text-input{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:rgba(255,255,255,0.9);padding:8px 10px;font-size:13px;outline:none;width:100%;box-sizing:border-box;}
        .popup-text-input:focus{border-color:#ffd54f;}
        .toggle-sw{position:relative;display:inline-block;width:42px;height:24px;flex-shrink:0;}
        .toggle-sw input{opacity:0;width:0;height:0;position:absolute;}
        .tog-track{position:absolute;inset:0;background:rgba(255,255,255,0.15);border-radius:24px;cursor:pointer;transition:.3s;}
        .toggle-sw input:checked+.tog-track{background:#ffd54f;}
        .tog-thumb{position:absolute;top:3px;left:3px;width:18px;height:18px;background:#fff;border-radius:50%;transition:.3s;}
        .toggle-sw input:checked+.tog-track .tog-thumb{transform:translateX(18px);}
        .btn-grp{display:flex;gap:6px;}
        .cov-btn{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:rgba(255,255,255,0.85);padding:6px 12px;font-size:12px;cursor:pointer;transition:.2s;}
        .cov-btn:hover{background:rgba(255,255,255,0.2);}
        .act-btn{background:rgba(255,213,79,0.14);border:1px solid rgba(255,213,79,0.35);border-radius:8px;color:#ffd54f;padding:6px 14px;font-size:12px;cursor:pointer;transition:.2s;display:flex;align-items:center;gap:4px;flex-shrink:0;}
        .act-btn:hover{background:rgba(255,213,79,0.26);}
      </style>
      <div class="popup-backdrop" id="rocBackdrop"></div>
      <div class="popup-sheet">
        <div class="popup-header">
          <ha-icon icon="${c.icon || 'mdi:home'}"></ha-icon>
          <span class="popup-title">${cardName}</span>
          <button class="popup-close" id="rocClose">&#x2715;</button>
        </div>
        ${content}
      </div>
    `;

    this._popupEl.querySelector('#rocClose').addEventListener('click', () => this._closePopup());
    this._popupEl.querySelector('#rocBackdrop').addEventListener('click', () => this._closePopup());

    // Toggle
    this._popupEl.querySelectorAll('[data-control="toggle"]').forEach(cb => {
      cb.addEventListener('change', e => {
        const entityId = e.target.dataset.entity;
        const domain = entityId.split('.')[0];
        if (domain === 'lock') {
          this._hass.callService('lock', e.target.checked ? 'lock' : 'unlock', { entity_id: entityId });
        } else {
          this._hass.callService('homeassistant', e.target.checked ? 'turn_on' : 'turn_off', { entity_id: entityId });
        }
      });
    });

    // Slider
    this._popupEl.querySelectorAll('[data-control="slider"]').forEach(slider => {
      slider.addEventListener('input', e => {
        const valEl = this._popupEl.querySelector(`[data-val="${e.target.dataset.entity}"]`);
        const unit = e.target.dataset.unit || '';
        if (valEl) valEl.textContent = `${e.target.value}${unit ? ' '+unit : ''}`;
      });
      slider.addEventListener('change', e => {
        const entityId = e.target.dataset.entity;
        const domain = entityId.split('.')[0];
        const t = e.target.dataset.type;
        const val = parseFloat(e.target.value);
        if (t === 'climate-temp') this._hass.callService('climate', 'set_temperature', { entity_id: entityId, temperature: val });
        else if (t === 'volume')  this._hass.callService('media_player', 'volume_set', { entity_id: entityId, volume_level: val/100 });
        else if (t === 'fan-pct') this._hass.callService('fan', 'set_percentage', { entity_id: entityId, percentage: val });
        else if (domain === 'input_number') this._hass.callService('input_number', 'set_value', { entity_id: entityId, value: val });
        else this._hass.callService('number', 'set_value', { entity_id: entityId, value: val });
      });
    });

    // Select
    this._popupEl.querySelectorAll('[data-control="select"]').forEach(sel => {
      sel.addEventListener('change', e => {
        const entityId = e.target.dataset.entity;
        const domain = entityId.split('.')[0];
        if (domain === 'input_select') this._hass.callService('input_select', 'select_option', { entity_id: entityId, option: e.target.value });
        else if (domain === 'climate') this._hass.callService('climate', 'set_hvac_mode', { entity_id: entityId, hvac_mode: e.target.value });
        else this._hass.callService('select', 'select_option', { entity_id: entityId, option: e.target.value });
      });
    });

    // Cover
    this._popupEl.querySelectorAll('[data-control^="cover-"]').forEach(btn => {
      btn.addEventListener('click', e => {
        const entityId = e.currentTarget.dataset.entity;
        const ctrl = e.currentTarget.dataset.control;
        const svc = ctrl==='cover-open'?'open_cover':ctrl==='cover-close'?'close_cover':'stop_cover';
        this._hass.callService('cover', svc, { entity_id: entityId });
      });
    });

    // Press (button/scene/script)
    this._popupEl.querySelectorAll('[data-control="press"]').forEach(btn => {
      btn.addEventListener('click', e => {
        const entityId = e.currentTarget.dataset.entity;
        const domain = entityId.split('.')[0];
        const svcMap = { button:'press', input_button:'press', scene:'turn_on', script:'turn_on' };
        this._hass.callService(domain, svcMap[domain] || 'turn_on', { entity_id: entityId });
      });
    });

    // Media play/pause
    this._popupEl.querySelectorAll('[data-control="media-play"]').forEach(btn => {
      btn.addEventListener('click', e => {
        const entityId = e.currentTarget.dataset.entity;
        const svc = this._hass.states[entityId]?.state === 'playing' ? 'media_pause' : 'media_play';
        this._hass.callService('media_player', svc, { entity_id: entityId });
      });
    });

    // Vacuum
    this._popupEl.querySelectorAll('[data-control^="vacuum-"]').forEach(btn => {
      btn.addEventListener('click', e => {
        const entityId = e.currentTarget.dataset.entity;
        const svc = {'vacuum-start':'start','vacuum-pause':'pause','vacuum-dock':'return_to_base'}[e.currentTarget.dataset.control];
        if (svc) this._hass.callService('vacuum', svc, { entity_id: entityId });
      });
    });

    // Timer
    this._popupEl.querySelectorAll('[data-control^="timer-"]').forEach(btn => {
      btn.addEventListener('click', e => {
        const entityId = e.currentTarget.dataset.entity;
        const svc = {'timer-start':'start','timer-pause':'pause','timer-cancel':'cancel'}[e.currentTarget.dataset.control];
        if (svc) this._hass.callService('timer', svc, { entity_id: entityId });
      });
    });

    // Automation trigger
    this._popupEl.querySelectorAll('[data-control="automation-trigger"]').forEach(btn => {
      btn.addEventListener('click', e => this._hass.callService('automation', 'trigger', { entity_id: e.currentTarget.dataset.entity }));
    });

    // Input text
    this._popupEl.querySelectorAll('[data-control="text"]').forEach(inp => {
      const save = e => this._hass.callService('input_text', 'set_value', { entity_id: e.target.dataset.entity, value: e.target.value });
      inp.addEventListener('change', save);
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') save(e); });
    });

    // More-info
    this._popupEl.querySelectorAll('[data-control="more-info"]').forEach(btn => {
      btn.addEventListener('click', e => {
        const ev = new Event('hass-more-info', { bubbles: true, composed: true });
        ev.detail = { entityId: e.currentTarget.dataset.entity };
        this.dispatchEvent(ev);
      });
    });
  }

  getCardSize() { return 2; }
  static getConfigElement() { return document.createElement('room-overview-card-editor'); }
  static getStubConfig() {
    return {
      name: 'Wohnzimmer', icon: 'mdi:sofa',
      sections: [{ title: 'Beleuchtung', entities: [] }],
    };
  }
}

customElements.define('room-overview-card', RoomOverviewCard);

// =====================================================================
//  Editor
// =====================================================================
class RoomOverviewCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._rendered = false;
  }

  setConfig(config) { this._config = { ...config }; this._render(); }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) this._render();
  }

  _update(key, value) {
    this._config = { ...this._config, [key]: value };
    this._emit();
  }

  _emit() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config }, bubbles: true, composed: true,
    }));
  }

  // ── Entity Picker ──────────────────────────────────────────────────
  _buildEntityPicker(container, currentValue, onChange) {
    container.innerHTML = '';
    const hass = this._hass;
    const entities = hass ? Object.keys(hass.states).sort() : [];

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;';

    const inputRow = document.createElement('div');
    inputRow.style.cssText = 'display:flex;align-items:center;gap:8px;border:1px solid var(--divider-color,#e0e0e0);border-radius:8px;background:var(--card-background-color,#fff);padding:5px 10px;';

    const iconEl = document.createElement('ha-icon');
    iconEl.icon = rocEntityIcon(hass, currentValue);
    iconEl.style.cssText = '--mdc-icon-size:18px;color:var(--secondary-text-color,#727272);flex-shrink:0;';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Entität suchen…';
    input.style.cssText = 'flex:1;border:none;outline:none;background:transparent;color:var(--primary-text-color,#212121);font-size:13px;';
    if (currentValue && hass?.states[currentValue]) {
      input.value = hass.states[currentValue].attributes.friendly_name || currentValue;
    } else {
      input.value = currentValue || '';
    }

    inputRow.appendChild(iconEl);
    inputRow.appendChild(input);

    const dropdown = document.createElement('div');
    dropdown.style.cssText = 'position:absolute;top:100%;left:0;right:0;max-height:200px;overflow-y:auto;background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#e0e0e0);border-radius:8px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.15);display:none;margin-top:2px;';

    const showDropdown = (filter = '') => {
      dropdown.innerHTML = '';
      const lower = filter.toLowerCase().trim();
      const filtered = entities.filter(e => {
        if (!lower) return true;
        const fn = (hass.states[e]?.attributes.friendly_name || '').toLowerCase();
        return fn.includes(lower) || e.toLowerCase().includes(lower);
      }).slice(0, 150);
      filtered.forEach(e => {
        const fn = hass.states[e]?.attributes.friendly_name || '';
        const item = document.createElement('div');
        item.style.cssText = 'display:flex;align-items:center;gap:8px;padding:7px 11px;cursor:pointer;border-bottom:1px solid var(--divider-color,#f0f0f0);';
        const ic = document.createElement('ha-icon');
        ic.icon = rocEntityIcon(hass, e);
        ic.style.cssText = '--mdc-icon-size:16px;color:var(--secondary-text-color,#727272);flex-shrink:0;';
        const textDiv = document.createElement('div');
        textDiv.innerHTML = `<div style="font-size:12px;font-weight:500;">${fn||e}</div><div style="font-size:10px;color:var(--secondary-text-color,#727272);">${e}</div>`;
        item.appendChild(ic);
        item.appendChild(textDiv);
        item.addEventListener('mousedown', ev => {
          ev.preventDefault();
          input.value = fn || e;
          iconEl.icon = rocEntityIcon(hass, e);
          dropdown.style.display = 'none';
          onChange(e);
        });
        item.addEventListener('mouseover', () => item.style.background = 'var(--secondary-background-color,#f5f5f5)');
        item.addEventListener('mouseout', () => item.style.background = '');
        dropdown.appendChild(item);
      });
      dropdown.style.display = filtered.length ? 'block' : 'none';
    };

    input.addEventListener('focus', () => showDropdown(input.value));
    input.addEventListener('input', () => showDropdown(input.value));
    input.addEventListener('blur', () => setTimeout(() => { dropdown.style.display = 'none'; }, 150));

    wrapper.appendChild(inputRow);
    wrapper.appendChild(dropdown);
    container.appendChild(wrapper);
  }

  // ── Section entity list ───────────────────────────────────────────
  _renderSectionEntities(container, sIdx) {
    container.innerHTML = '';
    const section = (this._config.sections || [])[sIdx];
    if (!section) return;
    const entities = section.entities || [];

    if (entities.length === 0) {
      const hint = document.createElement('div');
      hint.style.cssText = 'font-size:11px;color:var(--secondary-text-color,#999);padding:4px 0;';
      hint.textContent = 'Noch keine Entitäten.';
      container.appendChild(hint);
    }

    entities.forEach((item, eIdx) => {
      const entityId = rocEntityId(item);
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:flex-start;gap:5px;margin-bottom:6px;';

      const moveWrap = document.createElement('div');
      moveWrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;flex-shrink:0;margin-top:1px;';

      const upBtn = this._mkMoveBtn('▲', eIdx === 0, () => {
        const arr = this._deepCloneSections();
        [arr[sIdx].entities[eIdx-1], arr[sIdx].entities[eIdx]] = [arr[sIdx].entities[eIdx], arr[sIdx].entities[eIdx-1]];
        this._config = { ...this._config, sections: arr };
        this._emit();
        this._renderSectionEntities(container, sIdx);
      });
      const downBtn = this._mkMoveBtn('▼', eIdx === entities.length - 1, () => {
        const arr = this._deepCloneSections();
        [arr[sIdx].entities[eIdx], arr[sIdx].entities[eIdx+1]] = [arr[sIdx].entities[eIdx+1], arr[sIdx].entities[eIdx]];
        this._config = { ...this._config, sections: arr };
        this._emit();
        this._renderSectionEntities(container, sIdx);
      });
      moveWrap.appendChild(upBtn);
      moveWrap.appendChild(downBtn);

      const pickerDiv = document.createElement('div');
      pickerDiv.style.cssText = 'flex:1;';

      const removeBtn = document.createElement('button');
      removeBtn.textContent = '×';
      removeBtn.style.cssText = 'flex-shrink:0;width:32px;height:32px;background:rgba(200,60,60,0.1);border:1px solid rgba(200,60,60,0.3);border-radius:6px;color:rgb(180,40,40);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;padding:0;';
      removeBtn.addEventListener('click', () => {
        const arr = this._deepCloneSections();
        arr[sIdx].entities.splice(eIdx, 1);
        this._config = { ...this._config, sections: arr };
        this._emit();
        this._renderSectionEntities(container, sIdx);
      });

      row.appendChild(moveWrap);
      row.appendChild(pickerDiv);
      row.appendChild(removeBtn);
      container.appendChild(row);

      this._buildEntityPicker(pickerDiv, entityId, newId => {
        const arr = this._deepCloneSections();
        arr[sIdx].entities[eIdx] = newId;
        this._config = { ...this._config, sections: arr };
        this._emit();
      });
    });
  }

  // ── Section list ──────────────────────────────────────────────────
  _renderSections(container) {
    container.innerHTML = '';
    const sections = this._config.sections || [];

    sections.forEach((section, sIdx) => {
      const box = document.createElement('div');
      box.style.cssText = 'border:1px solid var(--divider-color,#e0e0e0);border-radius:10px;padding:10px 12px;margin-bottom:10px;background:var(--secondary-background-color,rgba(0,0,0,0.02));';

      // Section header row
      const headerRow = document.createElement('div');
      headerRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:10px;';

      const moveWrap = document.createElement('div');
      moveWrap.style.cssText = 'display:flex;flex-direction:column;gap:2px;flex-shrink:0;';
      const upBtn  = this._mkMoveBtn('▲', sIdx === 0, () => {
        const arr = this._deepCloneSections();
        [arr[sIdx-1], arr[sIdx]] = [arr[sIdx], arr[sIdx-1]];
        this._config = { ...this._config, sections: arr };
        this._emit();
        this._renderSections(container);
      });
      const downBtn = this._mkMoveBtn('▼', sIdx === sections.length - 1, () => {
        const arr = this._deepCloneSections();
        [arr[sIdx], arr[sIdx+1]] = [arr[sIdx+1], arr[sIdx]];
        this._config = { ...this._config, sections: arr };
        this._emit();
        this._renderSections(container);
      });
      moveWrap.appendChild(upBtn);
      moveWrap.appendChild(downBtn);

      const titleInput = document.createElement('input');
      titleInput.type = 'text';
      titleInput.value = section.title || '';
      titleInput.placeholder = 'Abschnittsname (optional)';
      titleInput.style.cssText = 'flex:1;padding:6px 10px;border-radius:6px;border:1px solid var(--divider-color,#e0e0e0);background:var(--card-background-color,#fff);color:var(--primary-text-color,#212121);font-size:13px;font-weight:600;outline:none;';
      titleInput.addEventListener('change', e => {
        const arr = this._deepCloneSections();
        arr[sIdx].title = e.target.value;
        this._config = { ...this._config, sections: arr };
        this._emit();
      });

      const removeSection = document.createElement('button');
      removeSection.textContent = '×';
      removeSection.title = 'Abschnitt löschen';
      removeSection.style.cssText = 'flex-shrink:0;width:28px;height:28px;background:rgba(200,60,60,0.1);border:1px solid rgba(200,60,60,0.3);border-radius:6px;color:rgb(180,40,40);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;padding:0;';
      removeSection.addEventListener('click', () => {
        const arr = this._deepCloneSections();
        arr.splice(sIdx, 1);
        this._config = { ...this._config, sections: arr };
        this._emit();
        this._renderSections(container);
      });

      headerRow.appendChild(moveWrap);
      headerRow.appendChild(titleInput);
      headerRow.appendChild(removeSection);
      box.appendChild(headerRow);

      // Entity list within this section
      const entContainer = document.createElement('div');
      this._renderSectionEntities(entContainer, sIdx);
      box.appendChild(entContainer);

      // Add entity button
      const addEntBtn = document.createElement('button');
      addEntBtn.textContent = '+ Entität hinzufügen';
      addEntBtn.style.cssText = 'width:100%;margin-top:6px;padding:6px;border-radius:6px;border:1px dashed var(--divider-color,#ccc);background:transparent;color:var(--secondary-text-color,#727272);font-size:12px;cursor:pointer;';
      addEntBtn.addEventListener('click', () => {
        const arr = this._deepCloneSections();
        arr[sIdx].entities = [...(arr[sIdx].entities || []), ''];
        this._config = { ...this._config, sections: arr };
        this._emit();
        this._renderSectionEntities(entContainer, sIdx);
      });
      box.appendChild(addEntBtn);

      container.appendChild(box);
    });

    // Add section button
    const addSectionBtn = document.createElement('button');
    addSectionBtn.textContent = '+ Abschnitt hinzufügen';
    addSectionBtn.style.cssText = 'width:100%;padding:9px;border-radius:8px;border:1px solid rgba(3,169,244,0.3);background:rgba(3,169,244,0.08);color:var(--primary-color,#03a9f4);font-size:13px;cursor:pointer;';
    addSectionBtn.addEventListener('click', () => {
      const arr = this._deepCloneSections();
      arr.push({ title: '', entities: [] });
      this._config = { ...this._config, sections: arr };
      this._emit();
      this._renderSections(container);
    });
    container.appendChild(addSectionBtn);
  }

  _mkMoveBtn(label, disabled, onClick) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.disabled = disabled;
    btn.style.cssText = `width:22px;height:18px;padding:0;border:1px solid var(--divider-color,#ddd);border-radius:4px;background:var(--card-background-color,#fff);cursor:${disabled ? 'default' : 'pointer'};font-size:9px;opacity:${disabled ? '0.3' : '0.8'};display:flex;align-items:center;justify-content:center;`;
    if (!disabled) btn.addEventListener('click', onClick);
    return btn;
  }

  _deepCloneSections() {
    return JSON.parse(JSON.stringify(this._config.sections || []));
  }

  _render() {
    this._rendered = true;
    const root = this.shadowRoot;
    const c = this._config;

    root.innerHTML = `
      <style>
        .editor{display:flex;flex-direction:column;gap:14px;padding:8px 0;}
        .field{display:flex;flex-direction:column;gap:5px;}
        .row{display:flex;gap:12px;} .row .field{flex:1;}
        label{font-size:13px;font-weight:500;color:var(--primary-text-color,#212121);}
        .hint{font-size:11px;color:var(--secondary-text-color,#727272);}
        input[type=text],input[type=number]{
          padding:9px 11px;border-radius:8px;border:1px solid var(--divider-color,#e0e0e0);
          background:var(--card-background-color,#fff);color:var(--primary-text-color,#212121);
          font-size:14px;outline:none;box-sizing:border-box;width:100%;}
        input:focus{border-color:var(--primary-color,#03a9f4);}
        .section{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;
          color:var(--secondary-text-color,#727272);margin-top:6px;
          border-bottom:1px solid var(--divider-color,#e0e0e0);padding-bottom:4px;}
      </style>
      <div class="editor">
        <div class="section">Allgemein</div>
        <div class="row">
          <div class="field">
            <label>Raumname</label>
            <input type="text" id="name" value="${c.name||''}" placeholder="z.B. Wohnzimmer" />
          </div>
          <div class="field">
            <label>Icon</label>
            <input type="text" id="icon" value="${c.icon||'mdi:home'}" placeholder="mdi:sofa" />
          </div>
        </div>
        <div class="field">
          <label>Eckenradius (px)</label>
          <input type="number" id="border_radius" value="${c.border_radius||16}" min="0" max="40" step="1" />
        </div>

        <div class="section">Sensor-Badges</div>
        <div class="hint" style="margin-bottom:2px;">Werden oben auf der Karte als Badges angezeigt. Lichter und offene Sensoren werden automatisch aus den Abschnitten gezählt.</div>
        <div class="field">
          <label>Temperatur-Sensor</label>
          <div id="tempContainer"></div>
        </div>
        <div class="field">
          <label>Luftfeuchte-Sensor</label>
          <div id="humContainer"></div>
        </div>

        <div class="section">Abschnitte im Popup</div>
        <div class="hint" style="margin-bottom:6px;">Erstelle Abschnitte mit Überschriften. Entitäten lassen sich per ▲▼ sortieren.</div>
        <div id="sectionsContainer"></div>
      </div>
    `;

    const on = (id, key, fn = v => v) => {
      const el = root.getElementById(id);
      if (el) el.addEventListener('change', e => this._update(key, fn(e.target.value)));
    };
    on('name', 'name');
    on('icon', 'icon');
    on('border_radius', 'border_radius', v => parseInt(v));

    this._buildEntityPicker(root.getElementById('tempContainer'), c.temperature_entity || '', id => this._update('temperature_entity', id));
    this._buildEntityPicker(root.getElementById('humContainer'),  c.humidity_entity  || '', id => this._update('humidity_entity',  id));

    this._renderSections(root.getElementById('sectionsContainer'));
  }
}

customElements.define('room-overview-card-editor', RoomOverviewCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'room-overview-card',
  name: 'Room Overview Card',
  description: 'Zimmerübersicht mit Sensorbadges und Popup mit sortierbaren Abschnitten',
  preview: true,
  documentationURL: 'https://github.com/pquandel2-alt/pq_room_overview_card',
});

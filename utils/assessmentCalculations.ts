// Inteligência Omron: % de Gordura Corporal
export const getBodyFatStatus = (value: any, gender: string | undefined, age: number, protocol?: string) => {
  const v = Number(value);
  if (!v || isNaN(v) || !gender || !age) return null;
  const isM = gender.toUpperCase() === 'M';

  let low, normal, high;
  if (isM) {
    if (age < 40) { low = 8; normal = 20; high = 25; }
    else if (age < 60) { low = 11; normal = 22; high = 28; }
    else { low = 13; normal = 25; high = 30; }
  } else { 
    if (age < 40) { low = 21; normal = 33; high = 39; }
    else if (age < 60) { low = 23; normal = 34; high = 40; }
    else { low = 24; normal = 36; high = 42; }
  }

  // Faixas Fitdays — mesma referência OMS mas ajustada para o protocolo
  if (protocol === 'fitdays') {
    if (isM) {
      if (age < 40) { low = 8; normal = 21; high = 26; }
      else if (age < 60) { low = 11; normal = 23; high = 29; }
      else { low = 13; normal = 25; high = 31; }
    } else {
      if (age < 40) { low = 21; normal = 33; high = 39; }
      else if (age < 60) { low = 23; normal = 35; high = 41; }
      else { low = 24; normal = 36; high = 42; }
    }
  }

  let pos = 0;
  if (v < low) pos = Math.min((v / low) * 25, 24);
  else if (v < normal) pos = 25 + ((v - low) / (normal - low)) * 25;
  else if (v < high) pos = 50 + ((v - normal) / (high - normal)) * 25;
  else pos = Math.min(75 + ((v - high) / 10) * 25, 96);

  return { 
    label: v < low ? 'BAIXO' : v < normal ? 'NORMAL' : v < high ? 'ALTO' : 'MUITO ALTO', 
    color: v < low ? '#0284c7' : v < normal ? '#16a34a' : v < high ? '#d97706' : '#dc2626', 
    bg: v < low ? '#e0f2fe' : v < normal ? '#dcfce3' : v < high ? '#fef3c7' : '#fee2e2', 
    pos,
    ranges: {
      baixo: `< ${low.toFixed(1)}`,
      normal: `${low.toFixed(1)} - ${(normal - 0.1).toFixed(1)}`,
      alto: `${normal.toFixed(1)} - ${(high - 0.1).toFixed(1)}`,
      muitoAlto: `≥ ${high.toFixed(1)}`
    }
  }; 
};

// Inteligência Omron: % de Massa Muscular
export const getMuscleStatus = (value: any, gender: string | undefined, age: number, protocol?: string) => {
  const v = Number(value);
  if (!v || isNaN(v) || !gender || !age) return null;
  const isM = gender.toUpperCase() === 'M';

  let low, normal, high;
  if (isM) {
    if (age < 40) { low = 33.3; normal = 39.4; high = 44.1; }
    else if (age < 60) { low = 33.1; normal = 39.2; high = 43.9; }
    else { low = 32.9; normal = 39.0; high = 43.7; }
  } else { 
    if (age < 40) { low = 24.3; normal = 30.4; high = 35.4; }
    else if (age < 60) { low = 24.1; normal = 30.2; high = 35.2; }
    else { low = 22.5; normal = 28.8; high = 33.7; }
  }

  // Faixas Fitdays — baseadas em Taxa Muscular (escala 60-75%)
  if (protocol === 'fitdays') {
    if (isM) {
      if (age < 40) { low = 60.0; normal = 65.0; high = 70.0; }
      else if (age < 60) { low = 58.0; normal = 63.0; high = 68.0; }
      else { low = 56.0; normal = 61.0; high = 66.0; }
    } else {
      if (age < 40) { low = 55.0; normal = 60.0; high = 65.0; }
      else if (age < 60) { low = 53.0; normal = 58.0; high = 63.0; }
      else { low = 51.0; normal = 56.0; high = 61.0; }
    }
  }

  let pos = 0;
  if (v < low) pos = Math.min((v / low) * 25, 24);
  else if (v < normal) pos = 25 + ((v - low) / (normal - low)) * 25;
  else if (v < high) pos = 50 + ((v - normal) / (high - normal)) * 25;
  else pos = Math.min(75 + ((v - high) / 10) * 25, 96);

  return { 
    label: v < low ? 'BAIXO' : v < normal ? 'NORMAL' : v < high ? 'ALTO' : 'ELITE', 
    color: v < low ? '#dc2626' : v < normal ? '#65a30d' : v < high ? '#16a34a' : '#0284c7', 
    bg: v < low ? '#fee2e2' : v < normal ? '#ecfccb' : v < high ? '#dcfce3' : '#e0f2fe', 
    pos,
    ranges: {
      baixo: `< ${low.toFixed(1)}`,
      normal: `${low.toFixed(1)} - ${(normal - 0.1).toFixed(1)}`,
      alto: `${normal.toFixed(1)} - ${(high - 0.1).toFixed(1)}`,
      muitoAlto: `≥ ${high.toFixed(1)}`
    }
  }; 
};

// Inteligência Omron: Gordura Visceral
export const getVisceralStatus = (value: any) => {
  const v = Number(value);
  if (!v || isNaN(v)) return null;

  let pos = 0;
  if (v <= 4) pos = Math.min((v / 4) * 25, 24);
  else if (v <= 8) pos = 25 + ((v - 4) / 4) * 25;
  else if (v <= 12) pos = 50 + ((v - 8) / 4) * 25;
  else pos = Math.min(75 + ((v - 12) / 4) * 25, 96);

  let label, color, bg;
  if (v <= 4) { label = 'IDEAL'; color = '#16a34a'; bg = '#dcfce3'; }
  else if (v <= 8) { label = 'BOM'; color = '#65a30d'; bg = '#ecfccb'; }
  else if (v <= 12) { label = 'RUIM'; color = '#d97706'; bg = '#fef3c7'; }
  else { label = 'CRÍTICO'; color = '#dc2626'; bg = '#fee2e2'; }

  return { 
    label, color, bg, pos,
    ranges: { ideal: '1 - 4', bom: '5 - 8', ruim: '9 - 12', atencao: '≥ 13' }
  };
};

// Inteligência Metabólica
export const getMetabolicStatus = (metabolicAge: any, actualAge: number) => {
  const m = Number(metabolicAge);
  if (!m || isNaN(m) || !actualAge) return null;
  if (m < actualAge) return { label: 'EXCELENTE 🔥', color: '#16a34a', bg: '#dcfce3' };
  if (m === actualAge) return { label: 'ADEQUADO', color: '#2563eb', bg: '#dbeafe' };
  return { label: 'ATENÇÃO', color: '#ea580c', bg: '#ffedd5' };
};

// Cores do Histórico
export const getHistoryColor = (current: any, previous: any, type: 'fat' | 'muscle') => {
  const c = Number(current);
  const p = Number(previous);
  
  if (!c || !p || isNaN(c) || isNaN(p)) return '#0f172a'; 
  if (c === p) return '#0f172a'; 

  if (type === 'fat') return c < p ? '#16a34a' : '#dc2626'; 
  if (type === 'muscle') return c > p ? '#16a34a' : '#dc2626'; 
  
  return '#0f172a';
};

// Inteligência do Peso
export const getSmartWeightColor = (currW: any, prevW: any, currF: any, prevF: any, currM: any, prevM: any) => {
  const cw = Number(currW), pw = Number(prevW);
  const cf = Number(currF), pf = Number(prevF);
  const cm = Number(currM), pm = Number(prevM);

  if (!cw || !pw || isNaN(cw) || isNaN(pw)) return '#0f172a'; 
  if (!cf || !pf || !cm || !pm || isNaN(cf) || isNaN(pf) || isNaN(cm) || isNaN(pm)) return '#0f172a';

  if (cw < pw) { 
    if (cf > pf || cm < pm) return '#dc2626'; 
    if (cf < pf && cm > pm) return '#16a34a'; 
  } 
  else if (cw > pw) { 
    if (cf < pf && cm > pm) return '#16a34a'; 
    if (cf > pf && cm > pm) {
      const muscleGain = cm - pm;
      const fatGain = cf - pf;
      if (muscleGain > fatGain) return '#16a34a'; 
      return '#dc2626'; 
    }
    if (cf > pf || cm < pm) return '#dc2626'; 
  } 
  else { 
    if (cm > pm) return '#16a34a'; 
    if (cm < pm || cf > pf) return '#dc2626'; 
  }

  return '#0f172a'; 
};


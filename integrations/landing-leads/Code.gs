const SHEET_ID = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
const NOTIFY = PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL');

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.sitio_web) return json({ ok: true });
    const cache = CacheService.getScriptCache();
    const key = 'wa_' + String(data.whatsapp || '');
    if (key !== 'wa_' && cache.get(key)) return json({ ok: true, dup: true });
    if (key !== 'wa_') cache.put(key, '1', 600);
    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('Leads');
    sheet.appendRow([
      new Date(),
      data.interes || '',
      data.nombre || '',
      data.cargo || '',
      data.institucion || '',
      data.departamento || '',
      data.municipio || '',
      data.estudiantes11 || '',
      data.whatsapp || '',
      data.correo || '',
      data.utm_source || '',
      data.utm_campaign || '',
      data.referrer || '',
    ]);
    if (NOTIFY) {
      MailApp.sendEmail(NOTIFY, 'Nuevo lead Alianza: ' + (data.institucion || 'sin institución'), JSON.stringify(data, null, 2));
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false });
  }
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

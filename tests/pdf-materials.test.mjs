import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as core from '../site/js/core.mjs';
import { uploadMaterial, downloadMaterial } from '../site/js/backend.mjs';

test('El catálogo del aula contiene solo las diez versiones PDF originales', async () => {
  const rows=JSON.parse(await readFile(new URL('../site/catalog.json',import.meta.url),'utf8'));
  assert.equal(rows.length,10);
  assert.ok(rows.every(r=>r.format==='PDF' && /\.pdf$/i.test(r.filename)));
  assert.equal(new Set(rows.map(r=>r.title)).size,10);
});
test('Material PDF requiere formato y extensión coherentes', () => {
  assert.equal(typeof core.isPDFMaterial,'function');
  assert.equal(core.isPDFMaterial({format:'PDF',filename:'Guía.pdf'}),true);
  for(const row of [{format:'DOCX',filename:'Guía.docx'},{format:'PDF',filename:'Guía.docx'},{format:'PPTX',filename:'Diapositivas.pptx'},{format:'PNG',filename:'Ruta.png'},null])
    assert.equal(core.isPDFMaterial(row),false);
});
test('Carga y descarga rechazan Word o PowerPoint antes de acceder al servicio',async()=>{
  for(const format of ['DOCX','PPTX','PNG']){
    const row={format,filename:`Material.${format.toLowerCase()}`,paths:['original']};
    await assert.rejects(downloadMaterial(null,{},row),/PDF/);
    await assert.rejects(uploadMaterial(null,{}, {name:row.filename},row,'general'),/PDF/);
  }
});
test('Un archivo renombrado PDF sin cabecera PDF no se carga',async()=>{
  const file=new Blob(['no es un documento PDF']);
  file.name='Guía.pdf';
  await assert.rejects(uploadMaterial(null,{},file,{format:'PDF',filename:'Guía.pdf'},'general'),/PDF/);
});

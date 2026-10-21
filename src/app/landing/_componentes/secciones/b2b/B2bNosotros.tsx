import { Capacidades } from './diagramas/Portafolio';
import { Ficha } from './diagramas/Laminas';
import { ProblemaQuienes } from './diagramas/ProblemaQuienes';

export function B2bNosotros() {
  return (
    <section id="porque" className="ag-section ag-tone-white ag-b2b" aria-labelledby="b2b-porque-title">
      <div className="ag-wrap ag-b2b-sec">
        <ProblemaQuienes />
        <Capacidades />
        <Ficha />
      </div>
    </section>
  );
}

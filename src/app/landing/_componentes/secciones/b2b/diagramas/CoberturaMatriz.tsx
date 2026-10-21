import { B2B_CADENA, B2B_COBERTURA } from '../../../../_contenido/b2b/modelo';
import { AlEntrar } from '../base/AlEntrar';

function Celda({ cubre, paso }: { cubre: boolean; paso: string }) {
  return (
    <td className={cubre ? 'is-on' : undefined}>
      <span className="ag-b2b-sr">{cubre ? 'Cubre' : 'No cubre'} {paso}</span>
      <span aria-hidden="true">{cubre ? '●' : '○'}</span>
    </td>
  );
}

export function CoberturaMatriz() {
  const pasos = B2B_CADENA.eslabones;
  return (
    <AlEntrar className="ag-b2b-matriz">
      <div className="ag-b2b-solo-ancho">
        <table>
          <caption>Cobertura de la cadena por nivel</caption>
          <thead>
            <tr>
              <th scope="col">Nivel</th>
              {pasos.map((paso) => (
                <th key={paso.title} scope="col">{paso.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {B2B_COBERTURA.map((fila, nivel) => (
              <tr key={nivel}>
                <th scope="row">Nivel {nivel + 1}</th>
                {fila.map((cubre, index) => (
                  <Celda key={pasos[index].title} cubre={cubre} paso={pasos[index].title} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="ag-b2b-solo-estrecho">
        <table>
          <caption>Cobertura de la cadena por nivel</caption>
          <thead>
            <tr>
              <th scope="col">Paso</th>
              <th scope="col">N1</th>
              <th scope="col">N2</th>
              <th scope="col">N3</th>
            </tr>
          </thead>
          <tbody>
            {pasos.map((paso, index) => (
              <tr key={paso.title}>
                <th scope="row">{paso.title}</th>
                {B2B_COBERTURA.map((fila, nivel) => (
                  <Celda key={nivel} cubre={fila[index]} paso={paso.title} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AlEntrar>
  );
}

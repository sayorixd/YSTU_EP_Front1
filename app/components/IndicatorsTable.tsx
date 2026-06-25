'use client';

import { useDownloadIndicatorsTable } from '@/app/hooks/useIndicatorsTable'
import '../../styles/IndicatorsTable.css';

type Props = {
  educationalPlanId: number;
};

export function IndicatorsTable({ educationalPlanId } : Props) {
  const { downloadExcel, isDownloading } =
      useDownloadIndicatorsTable(educationalPlanId, (x) => {});
  
  return (
    <div className="indicators-table">
      <h3>
        Таблица компетенций и индикаторов
      </h3>
      <div className="indicators-table__actions">
        <button onClick={() => {
                  downloadExcel();
                }}
                title={"Экспорт в Excel"}
                >
          Экспорт в Excel
        </button>
      </div>
    </div>
  );
}
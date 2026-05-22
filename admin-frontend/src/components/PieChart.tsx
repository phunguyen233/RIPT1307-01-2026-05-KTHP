import React from "react";

type Slice = { label: string; value: number; color?: string };

const PieChart: React.FC<{ data: Slice[]; size?: number }> = ({ data, size = 200 }) => {
  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0) || 1;
  return (
    <div style={{ width: size, height: size }}>
      {data.map((d, i) => {
        const percent = Math.round(((Number(d.value) || 0) / total) * 100);
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ width: 12, height: 12, background: d.color || '#ccc', marginRight: 8 }} />
            <div style={{ fontSize: 14 }}>{d.label}: <strong>{percent}%</strong></div>
          </div>
        );
      })}
    </div>
  );
};

export default PieChart;

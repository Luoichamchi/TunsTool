"use client";

import React, { useMemo } from "react";
import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export default function RevenueChart({ series = [] }) {
  const option = useMemo(() => {
    const labels = series.map((item) => item.period_label);
    const revenue = series.map((item) => Number(item.revenue || 0));
    const expense = series.map((item) => Number(item.expense || 0));
    const profit = series.map((item) => Number(item.profit || 0));

    return {
      tooltip: {
        trigger: "axis",
        valueFormatter: (value) => formatCurrency(value),
      },
      legend: {
        top: 0,
        data: ["Doanh thu", "Chi phí", "Lợi nhuận"],
      },
      grid: {
        left: 16,
        right: 16,
        bottom: 16,
        top: 48,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: labels,
      },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (value) => formatCurrency(value),
        },
      },
      series: [
        {
          name: "Doanh thu",
          type: "bar",
          data: revenue,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
          },
        },
        {
          name: "Chi phí",
          type: "bar",
          data: expense,
          itemStyle: {
            borderRadius: [6, 6, 0, 0],
          },
        },
        {
          name: "Lợi nhuận",
          type: "line",
          smooth: true,
          data: profit,
        },
      ],
    };
  }, [series]);

  if (!series.length) {
    return null;
  }

  return <ReactECharts option={option} style={{ height: 360, width: "100%" }} opts={{ renderer: "svg" }} />;
}

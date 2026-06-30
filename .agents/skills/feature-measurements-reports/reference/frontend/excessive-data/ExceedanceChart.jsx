"use client";
import React, { useRef, useEffect } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import * as echarts from "echarts";

export default function ExceedanceChart({ data = [], loading = false }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;

    if (loading || !data.length) {
      chart.clear();
      return;
    }

    const categories = data.map((d) => d.parameter_name);
    const exceedanceValues = data.map((d) => d.exceedance_count);
    const colors = data.map((d) => d.color || theme.palette.primary.main);

    const option = {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: isDark ? "#1e1e1e" : "#fff",
        borderColor: isDark ? "#444" : "#e0e0e0",
        textStyle: {
          color: isDark ? "#fff" : "#333",
          fontFamily: theme.typography.fontFamily,
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: 16,
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: categories,
        axisLabel: {
          color: isDark ? "#aaa" : "#666",
          fontSize: 12,
          fontFamily: theme.typography.fontFamily,
        },
        axisLine: { lineStyle: { color: isDark ? "#444" : "#e0e0e0" } },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: isDark ? "#aaa" : "#666",
          fontFamily: theme.typography.fontFamily,
        },
        splitLine: { lineStyle: { color: isDark ? "#333" : "#f0f0f0" } },
      },
      series: [
        {
          name: "Số lần vượt ngưỡng",
          type: "bar",
          barWidth: "45%",
          data: exceedanceValues.map((val, idx) => ({
            value: val,
            itemStyle: { color: colors[idx] },
          })),
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [data, loading, isDark]);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  if (!loading && data.length === 0) {
    return (
      <Box
        sx={{
          height: 300,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Không có dữ liệu vượt ngưỡng
        </Typography>
      </Box>
    );
  }

  return <Box ref={chartRef} sx={{ width: "100%", height: 300 }} />;
}

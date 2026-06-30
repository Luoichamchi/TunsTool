'use client'
import React, { useEffect, useState, useCallback } from 'react'
import CardOverview from './cardOverview'
import { StationDataNotFound } from './view/stationDataNotFound'
import Grid from '@mui/material/Grid';
import { Box, CircularProgress } from '@mui/material';
import api from '@/app/api/api';
import { getFetcher } from '@/app/api/globalFetcher';
import { toast } from "react-toastify";
import { useTenantFilterVersion } from '@/app/context/TenantFilterContext';
import usePullToRefreshListener from '@/app/utils/hooks/usePullToRefreshListener';

const pageOverview = () => {
  const [isLoading, setLoading] = useState(true);
  const [dataTram, setDataTram] = useState([]);
  const filterVersion = useTenantFilterVersion();

  const loadStations = useCallback(() => {
    setLoading(true);
    getFetcher(`${api.GET_STATION_LIST}?page=0&page_size=100`)
      .then((data) => setDataTram(data.data))
      .catch(() => {
        toast.error('Lỗi khi lấy dữ liệu trạm', {
          position: "top-right",
          autoClose: 3000,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadStations();
  }, [loadStations, filterVersion]);

  usePullToRefreshListener(loadStations);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!dataTram?.length) {
    return (
      <StationDataNotFound
        title="Chưa có trạm nào được kết nối"
        description="Hiện chưa có trạm quan trắc trong hệ thống."
      />
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Grid container spacing={2}>
          {dataTram.map((item, idx) => (
            <Grid
              key={item.id ?? idx}
              size={{ xs: 12, lg: 3, md: 4, sm: 6 }}
            >
              <CardOverview
                tenTram={item.name}
                active={item.status === 'active'}
                idTram={item.id}
                station_code={item.station_code}
                status_mqtt={item.mqtt_status}
                address={item.address}
              />
            </Grid>
          ))}
        </Grid>
      </div>
    </div>
  )
}

export default pageOverview

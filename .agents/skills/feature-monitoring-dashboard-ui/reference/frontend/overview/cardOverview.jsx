import React from 'react'
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import {useEffect, useState, useRef} from 'react';
import mqtt from 'mqtt';
import { useRuntimeConfig } from '@/app/utils/hooks/useRuntimeConfig';
const normalizeMqttUrl = (value) => {
  if (!value || typeof value !== "string") return null;
  if (!/^(mqtt|ws|wss):\/\//.test(value)) {
    value = "mqtt://" + value;
  }
  try {
    new URL(value);
    return value;
  } catch {
    return null;
  }
};

const cardOverview = ({tenTram, active, idTram, station_code, status_mqtt, address}) => {
  const { mqttServer } = useRuntimeConfig();
  const [received, setReceived] = useState(false);
  const clientRef = useRef(null);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const [mqttStatus, setMqttStatus] = useState(false);
  const handleMessage = (topic, message) => {
    const dataMqtt = JSON.parse(message.toString());
    if (topic !== "VIPiLOG/Station/Status") {
    if(dataMqtt)
    {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      setReceived(true);
      setMqttStatus(true);
    }
  }else if(topic === "VIPiLOG/Station/Status"){
    if (dataMqtt.event === "client.disconnected" && dataMqtt.clientid === station_code) {
      setReceived(false);
      setMqttStatus(false);
    }
  }
  }
  useEffect(() => {
    if (!mqttServer) return;
    const mqttUrl = normalizeMqttUrl(mqttServer);
    if (!mqttUrl) {
      console.warn("MQTT server không hợp lệ:", mqttServer);
      return;
    }
    const client = mqtt.connect(mqttUrl, { clean: true });
    clientRef.current = client;
    if(status_mqtt)
    {
      client.subscribe(`VIPiLOG/${station_code}/data`, (err) => {
        // else {
        //   timeoutRef.current = setTimeout(() => {
        //     if (!received) {
        //       if (!intervalRef.current) {
        //         intervalRef.current = setInterval(fetchData, 60000);
        //       }
        //     }
        //   }, 10000);
        // }
      })
      client.subscribe("VIPiLOG/Station/Status")
    }
    client.on("message", handleMessage);
    return () => {
      client.off("message", handleMessage);
      client.end(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mqttServer, station_code, status_mqtt]);
  const isConnected = status_mqtt !== true ? active : mqttStatus;
  const statusColor = isConnected ? 'green' : '#ff6b6b';
  const borderColor = isConnected ? '#18a84a' : '#777';
  const statusText = isConnected ? 'Kết nối' : 'Mất kết nối';

  return (
    <Link 
      href={`/apps/overview/view/?idTram=${idTram}`}
      style={{
        width: '100%', 
        height: '100%', 
        display: 'block',
        textDecoration: 'none'
      }}
    >
      <Card
        sx={{
          borderRadius: 2,
          padding: 0,
          border: '2px solid',
          borderColor,
          backgroundColor: 'background.paper',
          position: 'relative',
          cursor:'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          height: '100%',
          width: '100%',   
          display: 'flex',
          flexDirection: 'column',
          marginBottom: 0,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)', 
          },
        }}
      >
      <span
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: statusColor,
          fontWeight: 600,
          zIndex: 2,
          fontSize: 14,
        }}
        title={statusText}
      >
        <span
          style={{
            display: 'inline-block',
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: statusColor,
            border: '2px solid #fff',
          }}
        />
        {statusText}
      </span>
      <CardContent sx={{ 
        p: 2, 
        color: statusColor,
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        '& .MuiTypography-root': {
          mb: 1.5
        },
        '& .MuiTypography-root:last-child': {
          mb: 0
        }
      }}>
        <Typography component="div" gutterBottom sx={{ fontWeight: 500,marginBottom: 0 }}>
          <span style={{color: '#777'}}>Tên trạm:</span>
        </Typography>
        <Typography variant="h3" sx={{ 
          color: '#1f2937',
          fontWeight: 700,
          marginBottom: 0,
          wordBreak: 'break-word', // Xử lý text dài
          overflow: 'hidden',       // Ẩn text bị tràn
          textOverflow: 'ellipsis', // Hiển thị dấu ... khi text quá dài
          display: '-webkit-box',
          WebkitLineClamp: 2,      
          WebkitBoxOrient: 'vertical',
          lineHeight: '1.2',       
          // minHeight: '2.4em'        
        }}>
          {tenTram}
        </Typography>
        <Typography component="div" gutterBottom sx={{ fontWeight: 600,marginBottom: 0 }}>
          {/* địa chỉ: Hà Nội */}
         <span style={{color: '#444'}}> <strong>Địa chỉ:</strong></span> {" "} <span style={{color: '#777'}}>{address}</span>
        </Typography>
      </CardContent>
      </Card>
    </Link>
  )
}

export default cardOverview

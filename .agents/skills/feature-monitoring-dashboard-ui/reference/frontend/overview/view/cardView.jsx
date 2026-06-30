import React from 'react'
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { keyframes } from '@mui/system';

// Animation nhấp nháy glow khi vượt ngưỡng
const blinkGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 12px 4px rgba(244, 67, 54, 0.7),
                0 0 28px 8px rgba(244, 67, 54, 0.35);
  }
  50% {
    box-shadow: 0 0 6px 2px rgba(244, 67, 54, 0.2),
                0 0 12px 4px rgba(244, 67, 54, 0.08);
  }
`;

// Mapping trạng thái → style viền
const getStatusBorderStyle = (trangThai) => {
  switch (trangThai) {
    case 'Normal':
      return {
        boxShadow: '0 0 10px 3px rgba(76, 175, 80, 0.35)',
      };
    case 'Không có dữ liệu':
      return {
        boxShadow: '0 0 8px 2px rgba(158, 158, 158, 0.25)',
      };
    default:
      return {
        animation: `${blinkGlow} 1.5s ease-in-out infinite`,
      };
  }
};

const CardView = ({ chiTieu, trangThai, soLieu, gioiHan, color, donVi }) => {
  const borderStyle = getStatusBorderStyle(trangThai);

  return (
    <div style={{ width: '100%' }}>
      <Card
        sx={{
          borderRadius: 2,
          backgroundColor: color,
          position: 'relative',
          cursor: 'pointer',
          padding: '15px 0',
          transition: 'box-shadow 0.3s ease',
          ...borderStyle,
        }}
        title={
          trangThai === 'Normal'
            ? 'Trong ngưỡng'
            : trangThai === 'Không có dữ liệu'
              ? 'Mất tín hiệu'
              : 'Vượt ngưỡng'
        }
      >
        <CardContent
          sx={{
            p: 0,
            color: 'white',
            textAlign: 'center',
            '&:last-child': { paddingBottom: 0 }
          }}
        >
          <Typography component="div" gutterBottom sx={{ fontWeight: 'bold', fontSize: 16 }}>
            {chiTieu}
          </Typography>
          <div
            style={{
              borderTop: '1px solid #e0e0e0',
              width: '100%',
              marginTop: 15,
              marginBottom: 20
            }}
          ></div>
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold', fontSize: 32 }}>
            {soLieu}
          </Typography>
          <Typography variant="body2" sx={{ color: 'white', marginTop: 1 }}>
            {donVi || '\u00A0'}
          </Typography>
          <div
            style={{
              borderTop: '1px solid #e0e0e0',
              width: '100%',
              marginBottom: 15,
              marginTop: 20
            }}
          ></div>
          <Typography variant="body2" sx={{ color: 'white', marginTop: 1, padding: 0 }}>
            Giới hạn: {gioiHan}
          </Typography>
        </CardContent>
      </Card>
    </div>
  )
}

export default CardView

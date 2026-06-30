export const fetchFakeDataTram = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        DataTram: [
          {
            id: 1,
            tenTram: 'Bắc Nhạc Sơn',
            active: true
          },
          {
            id: 2,
            tenTram: 'Hà Nội',
            active: false
          },
          {
            id: 3,
            tenTram: 'Hà Nam',
            active: true
          },
          {
            id: 4,
            tenTram: 'Hà Tây',
            active: false
          },
          {
            id: 5,
            tenTram: 'Hà Đông',
            active: true
          }, {
            id: 1,
            tenTram: 'Bắc Nhạc Sơn',
            active: true
          },
          {
            id: 2,
            tenTram: 'Hà Nội',
            active: false
          },
          {
            id: 3,
            tenTram: 'Hà Nam',
            active: true
          },
          {
            id: 4,
            tenTram: 'Hà Tây',
            active: false
          },
          {
            id: 5,
            tenTram: 'Hà Đông',
            active: true
          }
        ]
      });
    }, 1000); // giả lập delay 500ms
  });
};

export const fetchFakeDuLieuQuanTrac = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        chatLuongNuoc: [
          {
            chiTieu: "pH",
            gioiHan: "6.5 - 8.5",
            giaTri: 7.5,
            trangThai: "Normal"
          },
          {
            chiTieu: "COD",
            gioiHan: "0 - 150 mg/l",
            giaTri: 43.99,
            trangThai: "Normal"
          },
          {
            chiTieu: "TSS",
            gioiHan: "0 - 150 mg/l",
            giaTri: 43.99,
            trangThai: "Normal"
          },
          {
            chiTieu: "AMONIA",
            gioiHan: "0 - 150 mg/l",
            giaTri: 0.06,
            trangThai: "Warning"
          },
          {
            chiTieu: "Nhiệt độ",
            gioiHan: "0°C - 50°C",
            giaTri: 25,
            trangThai: "Danger"
          },
          {
            chiTieu: "Lưu lượng",
            gioiHan: "1 - 800 m3/h",
            giaTri: 1013.24,
            trangThai: "Normal"
          }
        ]
      });
    }, 1000); // giả lập delay 500ms
  });
};

export const fetchFakeDataChartOverview = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        chartData: [
          {
            tenBieuDo: "pH"
          },
          {
            tenBieuDo: "COD"
          },
          {
            tenBieuDo: "TSS"
          },
          {
            tenBieuDo: "AMONIA"
          },
          {
            tenBieuDo: "Nhiệt độ"
          },
          {
            tenBieuDo: "Lưu lượng"
          }
        ]
      });
    }, 1000); // giả lập delay 500ms
  });
};
export const fetchFakeDataDuLieuTrungBinh = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        duLieuTrungBinh: [
          {
            "ThongSo": "COD",
            "ThoiGianVuotToiDa": "2025-08-10 14:20",
            "GiaTriToiDa": 52.30,
            "ThoiGianGiamToiThieu": "2025-08-11 09:45",
            "GiaTriToiThieu": 46.80,
            "GiaTriTrungBinh": 49.75
          },
          {
            "ThongSo": "TSS",
            "ThoiGianVuotToiDa": "2025-08-09 23:10",
            "GiaTriToiDa": 28.50,
            "ThoiGianGiamToiThieu": "2025-08-10 06:55",
            "GiaTriToiThieu": 23.90,
            "GiaTriTrungBinh": 25.85
          },
          {
            "ThongSo": "pH",
            "ThoiGianVuotToiDa": "2025-08-11 03:15",
            "GiaTriToiDa": 8.45,
            "ThoiGianGiamToiThieu": "2025-08-09 15:20",
            "GiaTriToiThieu": 7.55,
            "GiaTriTrungBinh": 7.88
          },
          {
            "ThongSo": "Temp",
            "ThoiGianVuotToiDa": "2025-08-10 12:40",
            "GiaTriToiDa": 35.20,
            "ThoiGianGiamToiThieu": "2025-08-11 04:10",
            "GiaTriToiThieu": 31.85,
            "GiaTriTrungBinh": 33.50
          },
          {
            "ThongSo": "NH4",
            "ThoiGianVuotToiDa": "2025-08-11 01:05",
            "GiaTriToiDa": 1.53,
            "ThoiGianGiamToiThieu": "2025-08-10 12:00",
            "GiaTriToiThieu": 1.38,
            "GiaTriTrungBinh": 1.45
          },
          {
            "ThongSo": "FLOWIN",
            "ThoiGianVuotToiDa": "2025-08-10 16:30",
            "GiaTriToiDa": 85.70,
            "ThoiGianGiamToiThieu": "2025-08-10 13:15",
            "GiaTriToiThieu": 48.25,
            "GiaTriTrungBinh": 67.45
          },
          {
            "ThongSo": "FLOWOUT",
            "ThoiGianVuotToiDa": "2025-08-10 22:05",
            "GiaTriToiDa": 96.10,
            "ThoiGianGiamToiThieu": "2025-08-10 17:20",
            "GiaTriToiThieu": 82.95,
            "GiaTriTrungBinh": 92.35
          }
        ]
      });
    }, 1000); // giả lập delay 500ms
  });
};
export const fetchFakeDataDetailReport = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        detailReport: [
          {
            "ThoiGian": "11/08/2025 00:00",
            "PH": 7.02,
            "COD": 38.95,
            "TSS": 4.55,
            "AMONIA": 0.25,
            "NhietDo": 33.10,
            "LuuLuong": 370.25
          },
          {
            "ThoiGian": "11/08/2025 00:05",
            "PH": 7.03,
            "COD": 39.80,
            "TSS": 4.68,
            "AMONIA": 0.28,
            "NhietDo": 33.08,
            "LuuLuong": 371.90
          },
          {
            "ThoiGian": "11/08/2025 00:10",
            "PH": 7.04,
            "COD": 39.65,
            "TSS": 4.78,
            "AMONIA": 0.32,
            "NhietDo": 33.05,
            "LuuLuong": 376.12
          },
          {
            "ThoiGian": "11/08/2025 00:15",
            "PH": 7.05,
            "COD": 39.45,
            "TSS": 4.60,
            "AMONIA": 0.31,
            "NhietDo": 33.02,
            "LuuLuong": 365.50
          },
          {
            "ThoiGian": "11/08/2025 00:20",
            "PH": 7.02,
            "COD": 39.22,
            "TSS": 4.85,
            "AMONIA": 0.29,
            "NhietDo": 33.00,
            "LuuLuong": 362.45
          },
          {
            "ThoiGian": "11/08/2025 00:25",
            "PH": 7.01,
            "COD": 39.15,
            "TSS": 4.50,
            "AMONIA": 0.27,
            "NhietDo": 32.98,
            "LuuLuong": 366.32
          },
          {
            "ThoiGian": "11/08/2025 00:30",
            "PH": 7.06,
            "COD": 41.80,
            "TSS": 4.65,
            "AMONIA": 0.28,
            "NhietDo": 32.95,
            "LuuLuong": 369.75
          }
        ]
      });
    }, 1000); // giả lập delay 500ms
  });
};
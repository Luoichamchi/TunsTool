import { ConfigProvider, DatePicker, theme } from "antd";
import viVN from "antd/locale/vi_VN";
import dayjs from "dayjs";
import "dayjs/locale/vi";
const { RangePicker } = DatePicker;
import { styled } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import { useEffect } from "react";
export const StyledRangePicker = styled(RangePicker)(({ theme }) => ({
    width: "100%",
    height: "44.13px",
    "& .mui-1jqdoeo": {
      height: "44.13px !important",
    },
    "& [class*='mui-']": {
      height: "44.13px !important",
    },
    "& .ant-picker": {
      height: "56px",
      borderRadius: "4px",
      border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.23)" : "rgba(0, 0, 0, 0.23)"}`,
      backgroundColor: "transparent",
      fontSize: "16px",
      fontFamily: theme.typography.fontFamily,
      transition: theme.transitions.create(["border-color", "box-shadow"]),
      padding: "16.5px 14px",
      "&:hover": {
        borderColor: theme.palette.text.primary,
      },
      "&.ant-picker-focused": {
        borderColor: theme.palette.primary.main,
        boxShadow: `0 0 0 2px ${theme.palette.primary.main}20`,
      },
      "& .ant-picker-input": {
        "& input": {
          fontSize: "16px",
          fontFamily: theme.typography.fontFamily,
          color: theme.palette.text.primary,
          padding: 0,
          "&::placeholder": {
            color: theme.palette.text.secondary,
            opacity: 1,
          },
        },
      },
      "& .ant-picker-suffix": {
        color: theme.palette.text.secondary,
        marginLeft: "8px",
      },
      "& .ant-picker-clear": {
        color: theme.palette.text.secondary,
        marginLeft: "8px",
      },
      "& .ant-picker-separator": {
        color: theme.palette.text.secondary,
        margin: "0 8px",
      },
    },
    "& .ant-picker-dropdown": {
      "& .ant-picker-panel": {
        backgroundColor: theme.palette.mode === "dark" ? theme.palette.background.paper : "#fff",
        borderRadius: "4px",
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[8],
      },
      "& .ant-picker-panel-container": {
        backgroundColor: theme.palette.mode === "dark" ? theme.palette.background.paper : "#fff",
      },
      "& .ant-picker-header": {
        backgroundColor: theme.palette.mode === "dark" ? theme.palette.background.paper : "#fff",
        borderBottom: `1px solid ${theme.palette.divider}`,
        padding: "8px 12px",
        "& .ant-picker-header-view": {
          color: theme.palette.text.primary,
          fontWeight: 500,
          fontSize: "16px",
        },
        "& .ant-picker-header-super-prev-btn, .ant-picker-header-super-next-btn, .ant-picker-header-prev-btn, .ant-picker-header-next-btn": {
          color: theme.palette.text.secondary,
          "&:hover": {
            color: theme.palette.primary.main,
            backgroundColor: theme.palette.action.hover,
          },
        },
      },
      "& .ant-picker-body": {
        backgroundColor: theme.palette.mode === "dark" ? theme.palette.background.paper : "#fff",
        padding: "8px",
        "& .ant-picker-content": {
          "& .ant-picker-cell": {
            color: theme.palette.text.primary,
            "&:hover .ant-picker-cell-inner": {
              backgroundColor: theme.palette.action.hover,
            },
            "&.ant-picker-cell-selected .ant-picker-cell-inner": {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            },
            "&.ant-picker-cell-today .ant-picker-cell-inner": {
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
            },
            "&.ant-picker-cell-in-range": {
              backgroundColor: `${theme.palette.primary.main}10`,
            },
            "&.ant-picker-cell-range-start, &.ant-picker-cell-range-end": {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            },
          },
        },
      },
      "& .ant-picker-footer": {
        backgroundColor: theme.palette.mode === "dark" ? theme.palette.background.paper : "#fff",
        borderTop: `1px solid ${theme.palette.divider}`,
        padding: "8px 12px",
        "& .ant-picker-now-btn": {
          color: theme.palette.primary.main,
          "&:hover": {
            color: theme.palette.primary.dark,
          },
        },
      },
      "& .ant-picker-time-panel": {
        backgroundColor: theme.palette.mode === "dark" ? theme.palette.background.paper : "#fff",
        "& .ant-picker-time-panel-column": {
          "& .ant-picker-time-panel-cell": {
            color: theme.palette.text.primary,
            "&:hover .ant-picker-time-panel-cell-inner": {
              backgroundColor: theme.palette.action.hover,
            },
            "&.ant-picker-time-panel-cell-selected .ant-picker-time-panel-cell-inner": {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
            },
          },
        },
      },
    },
  }));

export const StyledRangePickerAnt = (props) => {
  const muiTheme = useTheme();
  
  const antdTheme = {
    algorithm: muiTheme.palette.mode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorBgContainer: muiTheme.palette.mode === "dark" ? muiTheme.palette.background.paper : "#fff",
      colorText: muiTheme.palette.text.primary,
      colorTextSecondary: muiTheme.palette.text.secondary,
      colorBorder: muiTheme.palette.divider,
      colorPrimary: muiTheme.palette.primary.main,
      colorBgElevated: muiTheme.palette.mode === "dark" ? muiTheme.palette.background.paper : "#fff",
    },
  };

  useEffect(() => {
    // Inject CSS global cho responsive dropdown
    const styleId = 'ant-picker-responsive';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      @media (max-width: 768px) {
        /* Đảm bảo dropdown không bị cắt */
        .ant-picker-dropdown {
          max-width: calc(100vw - 16px) !important;
          left: 8px !important;
          right: 8px !important;
        }
        
        .ant-picker-dropdown .ant-picker-panel-container {
          max-width: 100% !important;
          width: 100% !important;
        }
        
        .ant-picker-dropdown .ant-picker-panel {
          max-width: 100% !important;
          width: 100% !important;
          overflow-x: auto !important;
          overflow-y: visible !important;
        }
        
        .ant-picker-dropdown .ant-picker-time-panel {
          max-width: 100% !important;
          overflow-x: visible !important;
        }
        
        .ant-picker-dropdown .ant-picker-panel-container > * {
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
      }
      
      @media (max-width: 600px) {
        .ant-picker-dropdown {
          max-width: calc(100vw - 16px) !important;
          width: calc(100vw - 16px) !important;
          left: 8px !important;
          right: 8px !important;
          position: fixed !important;
          box-sizing: border-box !important;
        }
        .ant-picker-dropdown .ant-picker-panel-container .ant-picker-presets ul{
          font-size: 10px !important;
          width: 90px !important;
        }
        .ant-picker-dropdown .ant-picker-panel-container .ant-picker-presets {
        min-width: 90px !important;
          }

          .ant-picker-dropdown .ant-picker-datetime-panel .ant-picker-date-panel{
          width: 200px !important;
          }
        .ant-picker-dropdown .ant-picker-panel-container {
          max-width: 100% !important;
          width: 100% !important;
          overflow-x: auto !important;
          overflow-y: visible !important;
          box-sizing: border-box !important;
          padding: 4px !important;
        }
        
        .ant-picker-dropdown .ant-picker-panel {
          max-width: 100% !important;
          width: 100% !important;
          min-width: auto !important;
          overflow-x: auto !important;
          overflow-y: visible !important;
          box-sizing: border-box !important;
          padding: 4px !important;
        }
        
        .ant-picker-dropdown .ant-picker-header {
          padding: 4px 8px !important;
        }
        
        .ant-picker-dropdown .ant-picker-header-view {
          font-size: 12px !important;
        }
        
        .ant-picker-dropdown .ant-picker-header-super-prev-btn,
        .ant-picker-dropdown .ant-picker-header-super-next-btn,
        .ant-picker-dropdown .ant-picker-header-prev-btn,
        .ant-picker-dropdown .ant-picker-header-next-btn {
          font-size: 10px !important;
          padding: 2px !important;
          width: 20px !important;
          height: 20px !important;
        }
        
        .ant-picker-dropdown .ant-picker-body {
          padding: 4px !important;
          font-size: 10px;
          width: 200px !important;
        }



        .ant-picker-dropdown .ant-picker-cell {
          padding: 2px !important;
        }
        
        .ant-picker-dropdown .ant-picker-cell-inner {
          width: 24px !important;
          height: 24px !important;
          font-size: 11px !important;
          line-height: 24px !important;
          min-width: 24px !important;
          min-height: 24px !important;
        }
        
        .ant-picker-dropdown .ant-picker-time-panel {
          max-width: 60px !important;
          width: 60px !important;
          min-width: 60px !important;
          overflow-x: visible !important;
          box-sizing: border-box !important;
        }
          
        
        .ant-picker-dropdown .ant-picker-time-panel-column {
          max-width: 60px !important;
          width: 60px !important;
          min-width: 60px !important;
          box-sizing: border-box !important;
        }
        
        .ant-picker-dropdown .ant-picker-time-panel-cell {
          padding: 1px 2px !important;
          width: 100% !important;
        }
        
        .ant-picker-dropdown .ant-picker-time-panel-cell-inner {
          font-size: 10px !important;
          padding: 2px 4px !important;
          line-height: 18px !important;
          width: 100% !important;
          text-align: center !important;
        }
        
        .ant-picker-dropdown .ant-picker-time-panel-column::before {
          width: 60px !important;
        }
        
        .ant-picker-dropdown .ant-picker-footer {
          padding: 4px 8px !important;
        }
        
        .ant-picker-dropdown .ant-picker-now-btn {
          font-size: 11px !important;
          padding: 4px 8px !important;
        }
        
        .ant-picker-dropdown .ant-picker-range-arrow {
          display: none !important;
        }
        
        .ant-picker-dropdown .ant-picker-range-wrapper {
          max-width: 100% !important;
          width: 100% !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-wrap: wrap !important;
        }
        
        .ant-picker-dropdown .ant-picker-range-wrapper .ant-picker-panel {
          margin: 0 2px !important;
        }
        
        .ant-picker-dropdown .ant-picker-panel:not(.ant-picker-time-panel) {
          flex: 1 1 auto !important;
          min-width: 0 !important;
        }
        
        .ant-picker-dropdown .ant-picker-range-arrow {
          display: none !important;
        }
        
        .ant-picker-dropdown .ant-picker-panel-container .ant-picker-panel:last-child {
          flex-shrink: 0 !important;
          width: 30px !important;
          max-width: 30px !important;
        }
      }
    `;

    return () => {
      // Keep styles for all instances
    };
  }, []);

  return (
    <ConfigProvider theme={{...antdTheme,hashed:false}} locale={viVN}>
      <StyledRangePicker {...props} />
    </ConfigProvider>
  );
};
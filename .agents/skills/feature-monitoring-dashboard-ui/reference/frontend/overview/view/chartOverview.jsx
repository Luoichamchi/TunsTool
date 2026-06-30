import dynamic from 'next/dynamic';
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography } from '@mui/material';
import moment from 'moment';
import { useRef, memo, useMemo } from 'react';
import * as echarts from 'echarts';
// const margin = { right: 24 };
// const uData = [4000, 3000, 2000, 2780, 1890, 2390, 3490];
// const pData = [2400, 1398, 9800, 3908, 4800, 3800, 4300];
// const xLabels = [
//     'Page A',
//     'Page B',
//     'Page C',
//     'Page D',
//     'Page E',
//     'Page F',
//     'Page G',
// ];

const ChartPH = ({ tenBieuDo, colorChart, donVi, xData = [], yData = [], primaryColor, primaryContrastText,showTime = false,isMobile = false }) => {
    const theme = useTheme();
    const chartRef = useRef(null);
    
    // Validate data first
    if (!xData || !yData || xData.length === 0 || yData.length === 0) {
        return (
            <Card variant='outlined' sx={{padding: isMobile ? "10px" : ""}}>
                <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: 16, backgroundColor: primaryColor, color: primaryContrastText, padding: 1, borderRadius: 1 }}>
                        BIỂU ĐỒ {tenBieuDo?.toUpperCase()} {donVi !== 'null' && donVi !== '' ? `(${donVi})` : ''}
                    </Typography>
                    <Typography variant="body2" sx={{ textAlign: 'center', padding: 2 }}>
                        Không có dữ liệu để hiển thị
                    </Typography>
                </CardContent>
            </Card>
        );
    }
    
    const minValue = Math.min(...yData);
    const maxValue = Math.max(...yData);
    // Làm tròn giá trị cho đẹp mắt
    const roundedMin = Math.floor(minValue / 10) * 10;
    const roundedMax = Math.ceil(maxValue / 10) * 10;
    
    // Check if data contains timestamps (numbers) or date strings
    const hasTimestamps = xData.some(x => typeof x === 'number');
    const isDateOnly = !hasTimestamps && xData.every(x => /^\d{4}-\d{2}-\d{2}$/.test(x));
    
    // Memoize categories calculation
    const categories = useMemo(() => {
        // Re-detect multiple days each time
        let multipleDays = false;
        if (hasTimestamps && xData.length > 1) {
            let previousDate = null;
            xData.forEach((timestamp) => {
                if (typeof timestamp === 'number') {
                    const currentDate = moment(timestamp).utcOffset(7).format('YYYY-MM-DD');
                    if (previousDate !== null && currentDate !== previousDate) {
                        multipleDays = true;
                    }
                    previousDate = currentDate;
                }
            });
        }
        
        return xData.map(timestamp => {
            if (typeof timestamp === 'number') {
                return multipleDays
                    ? moment(timestamp).utcOffset(7).format('DD/MM HH:mm')
                    : moment(timestamp).utcOffset(7).format('HH:mm');
            }
            return timestamp;
        });
    }, [xData, hasTimestamps]);
    
    // Prepare data for ECharts - for category axis, just use yData values
    const chartData = useMemo(() => {
        return yData;
    }, [yData]);
    
    // Create gradient color for area fill
    const gradientColor = useMemo(() => {
        const color = colorChart || theme.palette.primary.main;
        // Convert color to rgba for gradient
        const colorToRgba = (colorStr, alpha) => {
            // If already rgba/rgb, extract and modify
            if (colorStr.startsWith('rgba')) {
                const matches = colorStr.match(/rgba?\(([^)]+)\)/);
                if (matches) {
                    const values = matches[1].split(',').map(v => v.trim());
                    return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${alpha})`;
                }
            }
            // If hex color
            if (colorStr.startsWith('#')) {
                const hex = colorStr.length === 7 ? colorStr.slice(1) : colorStr.slice(1, 4).split('').map(c => c + c).join('');
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            }
            // Fallback: try to use as is (ECharts might handle it)
            return colorStr;
        };
        
        return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
                offset: 0,
                color: colorToRgba(color, 0.45)
            },
            {
                offset: 1,
                color: colorToRgba(color, 0)
            }
        ]);
    }, [colorChart, theme.palette.primary.main]);
    
    const options = useMemo(() => ({
        backgroundColor: 'transparent',
        textStyle: {
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            color: theme.palette.mode === 'dark' ? '#adb0bb' : '#6b7280',
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(50, 50, 50, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: theme.palette.mode === 'dark' ? '#555' : '#ccc',
            textStyle: {
                color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            },
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: theme.palette.mode === 'dark' ? '#6a7985' : '#6a7985',
                }
            },
            formatter: function(params) {
                const param = params[0];
                const dataIndex = param.dataIndex;
                const value = param.value;
                const xLabel = xData[dataIndex];
                let formattedTime = '';
                
                if (!xLabel) {
                    formattedTime = categories[dataIndex] || '';
                } else if (hasTimestamps) {
                    formattedTime = moment(xLabel).utcOffset(7).format('DD/MM/YYYY HH:mm');
                } else if (isDateOnly) {
                    formattedTime = moment(xLabel).utcOffset(7).format('DD/MM/YYYY');
                } else {
                    formattedTime = moment(xLabel).utcOffset(7).format('HH:mm');
                }
                
                return `${formattedTime}<br/>${tenBieuDo || 'Dữ liệu'}: ${value}${donVi !== 'null' && donVi !== '' ? ` ${donVi}` : ''}`;
            }
        },
        grid: {
            left: '1%',
            right: '1%',
            bottom: '2%',
            top: '10%',
            containLabel: false
        },
        toolbox: {
            show: true,
            feature: {
                dataZoom: {
                    yAxisIndex: false,
                    title: {
                        zoom: 'Zoom',
                        back: 'Reset Zoom'
                    }
                },
                restore: {
                    title: 'Restore'
                }
            },
            iconStyle: {
                borderColor: theme.palette.mode === 'dark' ? '#adb0bb' : '#6b7280',
            },
            emphasis: {
                iconStyle: {
                    borderColor: colorChart || theme.palette.primary.main,
                }
            },
            right: 10,
            top: 10
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: categories,
            axisLabel: {
                rotate: 0,
                fontSize: 12,
                fontWeight: 400,
                color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            },
            axisLine: {
                lineStyle: {
                    color: theme.palette.mode === 'dark' ? '#555' : '#ccc',
                }
            }
        },
        yAxis: {
            type: 'value',
            min: 0,
            max: roundedMax * 1.5,
            axisLabel: {
                fontSize: 12,
                fontWeight: 400,
                color: theme.palette.mode === 'dark' ? '#fff' : '#000',
            },
            axisLine: {
                lineStyle: {
                    color: theme.palette.mode === 'dark' ? '#555' : '#ccc',
                }
            },
            splitLine: {
                lineStyle: {
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                }
            }
        },
        dataZoom: [
            {
                type: 'slider',
                show: false,
                xAxisIndex: [0]
            }
        ],
        series: [
            {
                name: tenBieuDo || 'Dữ liệu',
                type: 'line',
                smooth: true,
                symbol: 'none',
                lineStyle: {
                    width: 2,
                    color: colorChart || theme.palette.primary.main,
                },
                areaStyle: {
                    color: gradientColor,
                },
                data: chartData,
            }
        ]
    }), [theme.palette.mode, categories, xData, hasTimestamps, isDateOnly, roundedMax, colorChart, gradientColor, chartData, tenBieuDo, donVi]);
    
    return (
        <Card variant='outlined' sx={{padding: isMobile ? "10px" : ""}}>
            <CardContent sx={{ padding: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: 16, backgroundColor: primaryColor, color: primaryContrastText, padding: 1, borderRadius: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        BIỂU ĐỒ {tenBieuDo.toUpperCase()} {donVi !== 'null' && donVi !== '' ? `(${donVi})` : ''}
                    </div>
                    <div>
                        {showTime && xData[0] ? moment(xData[0]).utcOffset(7).format('DD/MM/YYYY') : ''}
                    </div>
                    </div>
                    
                </Typography>

                <Typography variant="body2" component={"div"}>
                    <ReactECharts
                        ref={chartRef}
                        option={options}
                        style={{ height: '300px', width: '100%' }}
                        opts={{ renderer: 'svg' }}
                        notMerge={true}
                    />
                </Typography>
            </CardContent>
        </Card>
    )
}

export default memo(ChartPH);
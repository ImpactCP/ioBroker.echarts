import React from 'react';
import PropTypes from 'prop-types';
import withWidth from '@material-ui/core/withWidth';
import {withStyles} from '@material-ui/core/styles';
import LinearProgress from '@material-ui/core/LinearProgress';

import moment from 'moment';

import ReactEchartsCore from 'echarts-for-react/lib/core';
import echarts from 'echarts/lib/echarts';
import 'echarts/lib/chart/line';
import 'echarts/lib/chart/scatter';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/grid';

import 'echarts/lib/component/toolbox';
import 'echarts/lib/component/title';

import 'echarts/lib/component/dataZoom';
import 'echarts/lib/component/timeline';
import 'zrender/lib/svg/svg';

function padding2(num) {
    return num.toString().padStart(2, '0');
}

const styles = theme => ({
    chart: {
        maxHeight: '100%',
        maxWidth: '100%',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
    },
});

const GRID_PADDING_LEFT = 80;
const GRID_PADDING_RIGHT = 25;

class ChartView extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            chartHeight: 300,
            chartWidth: 500,
        };

        this.echartsReact = React.createRef();
        // this.rangeRef     = React.createRef();

        this.divRef = React.createRef();

        this.chart = {};
    }

    componentDidMount() {
        window.addEventListener('resize', this.onResize)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.onResize);
    }

    UNSAFE_componentWillReceiveProps(props) {
        if (props.data !== this.state.data) {
            if (typeof this.echartsReact.getEchartsInstance === 'function') {
                const chartInstance = this.echartsReact.getEchartsInstance();
                chartInstance.clear();  // may be it is not required
                chartInstance.setOption(this.getOption(props));
            }
        } else {
            return null;
        }
    }

    onResize = () => {
        this.timerResize && clearTimeout(this.timerResize);

        this.timerResize = setTimeout(() => {
            this.timerResize = null;
            this.componentDidUpdate();
        });
    };

    /*onChange = (id, state) => {
        if (id === this.props.obj._id &&
            state &&
            this.rangeValues &&
            (!this.rangeValues.length || this.rangeValues[this.rangeValues.length - 1].ts < state.ts)) {

            this.chartValues && this.chartValues.push({val: state.val, ts: state.ts});
            this.rangeValues.push({val: state.val, ts: state.ts});

            // update only if end is near to now
            if (state.ts >= this.chart.min && state.ts <= this.chart.max + 300000) {
                this.updateChart();
            }
        }
    };*/

    convertData(props, i) {
        props = props || this.props;
        const values = props.data[i];
        if (!values || !values.length) {
            return [];
        }

        if (this.chart.min === null || this.chart.min > values[0].value[0]) {
            this.chart.min = values[0].value[0];

        }
        if (this.chart.max === null || this.chart.max < values[values.length - 1].value[0]) {
            this.chart.max = values[values.length - 1].value[0];
        }

        return values;
    }

    getSeries(props) {
        props = props || this.props;
        this.chart.min = null;
        this.chart.max = null;

        return props.config.l.map((oneLine, i) => {
            const cfg = {
                name: oneLine.name,
                xAxisIndex: 0,
                type: oneLine.chartType === 'scatterplot' ? 'scatter' : 'line',
                showSymbol: oneLine.chartType === 'scatterplot' || oneLine.points,
                hoverAnimation: true,
                animation: false,
                step: oneLine.chartType === 'steps' ? 'start' : undefined,
                smooth: oneLine.chartType === 'spline',
                data: this.convertData(props, i),
                itemStyle: {
                    color: oneLine.color
                },
                symbolSize: oneLine.chartType === 'scatterplot' || oneLine.points ? oneLine.symbolSize || 3 : undefined,
                symbol: 'circle',
                lineStyle: {
                    width:          oneLine.thickness || 1,
                    shadowBlur:     oneLine.shadowsize ? oneLine.shadowsize + 1 : 0,
                    shadowOffsetY:  oneLine.shadowsize ? oneLine.shadowsize + 1 : 0,
                    shadowColor:    oneLine.color,
                    type:           oneLine.dashes ? 'dashed' : (oneLine.lineStyle || 'solid'),
                }
            };
            if (oneLine.fill) {
                cfg.areaStyle = {
                    color: oneLine.color,
                    opacity: parseFloat(oneLine.fill),
                };
            }

            return cfg;
        });
    }

    yFormatter(val, line, props) {
        props = props || this.props;
        if (props.config.l[line].type === 'boolean') {
            return val ? 'TRUE' : 'FALSE';
        }

        const afterComma = props.config.l[line].afterComma;
        if (afterComma !== undefined && afterComma !== null) {
            val = parseFloat(val);
            if (props.config.useComma) {
                return val.toFixed(afterComma).replace('.', ',');
            } else {
                return val.toFixed(afterComma);
            }
        } else {
            if (props.config.useComma) {
                val = parseFloat(val);
                return val.toString().replace('.', ',');
            } else {
                return val;
            }
        }
    }

    getOption(props) {
        props = props || this.props;
        this.debug = props.config && props.config.debug;

        this.debug && console.log(JSON.stringify(props.config, null, 2));

        let titlePos = {};
        if (props.config.titlePos) {
            props.config.titlePos.split(';').forEach(a => {
                const parts = a.split(':');
                titlePos[parts[0].trim()] = parseInt(parts[1].trim(), 10);
            });
        }

        const xAxisHeight = 20;

        const legend = !props.config.legend || props.config.legend === 'none' ? undefined : {
            data: props.config.l.map(oneLine => oneLine.name),
            show: true,
        };

        const series = this.getSeries(props);

        if (props.config.start) {
            if (this.chart.max < props.config.end) {
                this.chart.max = props.config.end;
            }
            if (this.chart.min > props.config.start) {
                this.chart.min = props.config.start;
            }
        }

        this.chart.diff        = this.chart.max - this.chart.min;
        this.chart.withTime    = this.chart.diff < 3600000 * 24 * 7;
        this.chart.withSeconds = this.chart.diff < 60000 * 30;

        const options = {
            backgroundColor: 'transparent',
            animation: !props.config.noAnimation && !props.config.noLoader,
            title: {
                text: props.config.title || '',
                textStyle: {
                    fontSize: props.config.titleSize ? parseInt(props.config.titleSize, 10) : undefined,
                    color: props.config.titleColor || undefined
                },
                padding: [
                    8,  // up
                    0,  // right
                    0,  // down
                    90, // left
                ],
                textVerticalAlign: titlePos.bottom      ? 'bottom' : 'top',
                textAlign:         titlePos.left === 50 ? 'center' : (titlePos.right === -5 ? 'right' : 'left'),
                top:               titlePos.top  === 35 ? 0 : (titlePos.top === 50 ? '50%' : undefined),
                left:              titlePos.left === 50 ? '50%' : (titlePos.left === 65 ? 0 : undefined),
                bottom:            titlePos.bottom      ? (titlePos.bottom > 0 ? titlePos.bottom + xAxisHeight : titlePos.bottom) : undefined,
                right:             titlePos.right === 5 ? 25 : undefined,
            },
            legend,
            grid: {
                backgroundColor: props.config.bg_custom || 'transparent',
                show: !!props.config.bg_custom,
                left:   GRID_PADDING_LEFT,
                top:    8,
                right:  GRID_PADDING_RIGHT,
                bottom: 40,
            },
            tooltip: props.config.hoverDetail ? {
                trigger: 'axis',
                formatter: params => {
                    const date = new Date(params[0].value[0]);

                    const values = params.map(param => {
                        let val = param.value[1] === null ?
                            'null' :
                            this.yFormatter(param.value[1], param.seriesIndex, props);

                        return `<div style="width: 100%; display: inline-flex; justify-content: space-around; color: ${props.config.l[param.seriesIndex].color}">` +
                            `<div style="display: flex;">${props.config.l[param.seriesIndex].name}:</div>` +
                            `<div style="display: flex; flex-grow: 1"></div>` +
                            `<div style="display: flex;"><b>${val}</b>${param.value[1] !== null ? props.config.l[param.seriesIndex].unit : ''}</div>` +
                         `</div>`
                    });

                    return `<b>${moment(date).format('dddd, MMMM Do YYYY, h:mm:ss.SSS')}</b><br/>${values.join('<br/>')}`;
                },
                axisPointer: {
                    animation: true
                }
            } : undefined,
            xAxis:
            [{
                type: 'time',
                splitLine: {
                    show: !props.config.grid_hideX,
                    lineStyle: props.config.grid_color ? {
                        color: props.config.grid_color,
                    } : undefined,
                },
                //splitNumber: Math.round((this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT) / 50),
                min: this.chart.min,
                max: this.chart.max,
                axisTick: {
                    alignWithLabel: true,
                },
                axisLabel: {
                    formatter: (value, index) => {
                        const date = new Date(value);
                        if (this.chart.withSeconds) {
                            return padding2(date.getHours()) + ':' + padding2(date.getMinutes()) + ':' + padding2(date.getSeconds());
                        } else if (this.chart.withTime) {
                            return padding2(date.getHours()) + ':' + padding2(date.getMinutes()) + '\n' + padding2(date.getDate()) + '.' + padding2(date.getMonth() + 1);
                        } else {
                            return padding2(date.getDate()) + '.' + padding2(date.getMonth() + 1) + '\n' + date.getFullYear();
                        }
                    },
                    color: props.config.x_labels_color || undefined,
                }
            }],
            yAxis: [
                {
                    type: 'value',
                    boundaryGap: [0, '100%'],
                    splitLine: {
                        show: !props.config.grid_hideY,
                        lineStyle: props.config.grid_color ? {
                            color: props.config.grid_color,
                        } : undefined,
                    },
                    //splitNumber: Math.round(this.state.chartHeight / 100),
                    axisLabel: {
                        formatter: '{value}' + props.config.l[0].unit,
                        color: props.config.y_labels_color || undefined,
                    },
                    axisTick: {
                        alignWithLabel: true,
                    }
                }
            ],
            toolbox: props.config.export === true || props.config.export === 'true' ? {
                left: 'right',
                feature: {
                    /*dataZoom: {
                        yAxisIndex: 'none',
                        title: props.t('Zoom'),
                    },
                    restore: {
                        title: props.t('Restore')
                    },*/
                    saveAsImage: {
                        title: props.t('Save as image'),
                        show: true,
                    }
                }
            } : undefined,
            /*dataZoom: [
                {
                    show: true,
                    realtime: true,
                    startValue: this.start,
                    endValue: this.end,
                    y: this.state.chartHeight - 50,
                    dataBackground: {
                        lineStyle: {
                            color: '#FFFFFF'
                        },
                        areaStyle: {
                            color: '#FFFFFFE0'
                        }
                    },
                },
                {
                    show: true,
                    type: 'inside',
                    realtime: true,
                },
            ],*/
            series
        };

        if (!props.config.grid_color) {
            options.yAxis.forEach(axis => delete axis.splitLine.lineStyle);
            options.xAxis.forEach(axis => delete axis.splitLine.lineStyle);
        }

        return options;
    }

    updateChart(start, end, withReadData, cb) {
        if (start) {
            this.start = start;
        }
        if (end) {
            this.end = end;
        }
        start = start || this.start;
        end   = end   || this.end;

        this.readTimeout && clearTimeout(this.readTimeout);

        this.readTimeout = setTimeout(() => {
            this.readTimeout = null;

            const diff = this.chart.max - this.chart.min;
            if (diff !== this.chart.diff) {
                this.chart.diff        = diff;
                this.chart.withTime    = this.chart.diff < 3600000 * 24 * 7;
                this.chart.withSeconds = this.chart.diff < 60000 * 30;
            }

            if (withReadData) {
                this.readHistory(start, end)
                    .then(values => {
                        typeof this.echartsReact.getEchartsInstance === 'function' && this.echartsReact.getEchartsInstance().setOption({
                            series: [{data: this.convertData(values)}],
                            xAxis: {
                                min: this.chart.min,
                                max: this.chart.max,
                            }
                        }, true);
                        cb && cb();
                    });
            } else {
                typeof this.echartsReact.getEchartsInstance === 'function' && this.echartsReact.getEchartsInstance().setOption({
                    series: [{data: this.convertData()}],
                    xAxis: {
                        min: this.chart.min,
                        max: this.chart.max,
                    }
                }, true);
                cb && cb();
            }
        }, 400);
    }

    setNewRange(updateChart) {
        /*if (this.rangeRef.current &&
            this.rangeRef.current.childNodes[1] &&
            this.rangeRef.current.childNodes[1].value) {
            this.rangeRef.current.childNodes[0].innerHTML = '';
            this.rangeRef.current.childNodes[1].value = '';
        }*/
        this.chart.diff        = this.chart.max - this.chart.min;
        this.chart.withTime    = this.chart.diff < 3600000 * 24 * 7;
        this.chart.withSeconds = this.chart.diff < 60000 * 30;

        if (this.state.relativeRange !== 'absolute') {
            this.setState({ relativeRange: 'absolute' });
        } else {
            this.echartsReact.getEchartsInstance().setOption({
                xAxis: {
                    min: this.chart.min,
                    max: this.chart.max,
                }
            }, true);

            updateChart && this.updateChart(this.chart.min, this.chart.max, true);
        }
    }

    setRelativeInterval(mins, dontSave, cb) {
        if (!dontSave) {
            window.localStorage.setItem('App.relativeRange', mins);
            this.setState({ relativeRange: mins });
        }

        const now = new Date();
        if (now.getMilliseconds()) {
            now.setMilliseconds(1000);
        }
        if (now.getSeconds()) {
            now.setSeconds(60);
        }

        this.chart.max = now.getTime();

        if (mins === 'day') {
            now.setHours(0);
            now.setMinutes(0);
            this.chart.min = now.getTime();
        } else if (mins === 'week') {
            now.setHours(0);
            now.setMinutes(0);
            now.setFullYear(now.getFullYear() - 1);
            // find week start
            if (now.getDay()) { // if not sunday
                now.setDate(now.getDate() - now.getDay() - 1);
            } else {
                now.setDate(now.getDate() - 6);
            }

            this.chart.min = now.getTime();
        } else if (mins === '2weeks') {
            now.setHours(0);
            now.setMinutes(0);
            now.setFullYear(now.getFullYear() - 1);
            // find week start
            if (now.getDay()) { // if not sunday
                now.setDate(now.getDate() - now.getDay() - 8);
            } else {
                now.setDate(now.getDate() - 13);
            }
            this.chart.min = now.getTime();
        } else if (mins === 'month') {
            now.setHours(0);
            now.setMinutes(0);
            now.setDate(1);
            this.chart.min = now.getTime();
        } else if (mins === 'year') {
            now.setHours(0);
            now.setMinutes(0);
            now.setDate(1);
            now.setMonth(0);
            this.chart.min = now.getTime();
        } else if (mins === '12months') {
            now.setHours(0);
            now.setMinutes(0);
            now.setFullYear(now.getFullYear() - 1);
            this.chart.min = now.getTime();
        } else {
            mins = parseInt(mins, 10);
            this.chart.min = this.chart.max - mins * 60000;
        }
        this.updateChart(this.chart.min, this.chart.max, true, cb);
    }

    installEventHandlers() {
        const zr = this.echartsReact.getEchartsInstance().getZr();

        if (false && !zr._iobInstalled) {
            zr._iobInstalled = true;

            zr.on('mousedown', e => {
                console.log('mouse down');
                this.mouseDown = true;
                this.chart.lastX = e.offsetX;
            });

            zr.on('mouseup', () => {
                console.log('mouse up');
                this.mouseDown = false;
                this.setNewRange(true);
            });

            zr.on('mousewheel', e => {
                let diff = this.chart.max - this.chart.min;
                const width = this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT;
                const x = e.offsetX - GRID_PADDING_LEFT;
                const pos = x / width;

                const oldDiff = diff;
                const amount = e.wheelDelta > 0 ? 1.1 : 0.9;
                diff = diff * amount;
                const move = oldDiff - diff;
                this.chart.max += move * (1 - pos);
                this.chart.min -= move * pos;

                this.setNewRange();
            });

            zr.on('mousemove', e => {
                if (this.mouseDown) {
                    const moved = this.chart.lastX - (e.offsetX - GRID_PADDING_LEFT);
                    this.chart.lastX = e.offsetX - GRID_PADDING_LEFT;
                    const diff = this.chart.max - this.chart.min;
                    const width = this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT;

                    const shift = Math.round(moved * diff / width);
                    this.chart.min += shift;
                    this.chart.max += shift;
                    this.setNewRange();
                }
            });

            zr.on('touchstart', e => {
                e.preventDefault();
                this.mouseDown = true;
                const touches = e.touches || e.originalEvent.touches;
                if (touches) {
                    this.chart.lastX = touches[touches.length - 1].pageX;
                    if (touches.length > 1) {
                        this.chart.lastWidth = Math.abs(touches[0].pageX - touches[1].pageX);
                    } else {
                        this.chart.lastWidth = null;
                    }
                }
            });

            zr.on('touchend', e => {
                e.preventDefault();
                this.mouseDown = false;
                this.setNewRange(true);
            });

            zr.on('touchmove', e => {
                e.preventDefault();
                const touches = e.touches || e.originalEvent.touches;
                if (!touches) {
                    return;
                }
                const pageX = touches[touches.length - 1].pageX - GRID_PADDING_LEFT;
                if (this.mouseDown) {
                    if (touches.length > 1) {
                        // zoom
                        const fingerWidth = Math.abs(touches[0].pageX - touches[1].pageX);
                        if (this.chart.lastWidth !== null && fingerWidth !== this.chart.lastWidth) {
                            let diff = this.chart.max - this.chart.min;
                            const chartWidth = this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT;

                            const amount     = fingerWidth > this.chart.lastWidth ? 1.1 : 0.9;
                            const positionX  = touches[0].pageX > touches[1].pageX ?
                                touches[1].pageX - GRID_PADDING_LEFT + fingerWidth / 2 :
                                touches[0].pageX - GRID_PADDING_LEFT + fingerWidth / 2;

                            const pos = positionX / chartWidth;

                            const oldDiff = diff;
                            diff = diff * amount;
                            const move = oldDiff - diff;

                            this.chart.max += move * (1 - pos);
                            this.chart.min -= move * pos;

                            this.setNewRange();
                        }
                        this.chart.lastWidth = fingerWidth;
                    } else {
                        // swipe
                        const moved = this.chart.lastX - pageX;
                        const diff  = this.chart.max - this.chart.min;
                        const chartWidth = this.state.chartWidth - GRID_PADDING_RIGHT - GRID_PADDING_LEFT;

                        const shift = Math.round(moved * diff / chartWidth);
                        this.chart.min += shift;
                        this.chart.max += shift;

                        this.setNewRange();
                    }
                }
                this.chart.lastX = pageX;
            });
        }
    }

    renderChart() {
        if (this.props.data) {
            const option = this.getOption();

            //console.log(JSON.stringify(option, null, 2));

            return <ReactEchartsCore
                ref={e => this.echartsReact = e}
                echarts={ echarts }
                option={ option }
                notMerge={ true }
                lazyUpdate={ true }
                theme={ this.props.themeType === 'dark' ? 'dark' : '' }
                style={{ height: this.state.chartHeight + 'px', width: '100%' }}
                opts={{ renderer: 'svg' }}
                onEvents={ {
                    /*datazoom: e => {
                        const {startValue, endValue} = e.batch[0];
                        this.updateChart(startValue, endValue, true);
                    },*/
                    rendered: e => {
                        this.installEventHandlers();
                    }
                }}
            />;
        } else {
            return <LinearProgress/>;
        }
    }

    componentDidUpdate() {
        if (this.divRef.current) {
            const height = this.divRef.current.offsetHeight;
            if (this.state.chartHeight !== height) {
                const width  = this.divRef.current.offsetWidth;
                setTimeout(() => this.setState({ chartHeight: height, chartWidth: width }), 10);
            }
        }
    }

    render() {
        if (!this.divRef.current) {
            setTimeout(() => this.forceUpdate(), 10);
        }

        return <div ref={ this.divRef } className={ this.props.classes.chart } style={{background: this.props.config.window_bg || undefined}}>
            { this.renderChart() }
        </div>;
    }
}

ChartView.propTypes = {
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    config: PropTypes.object,
    themeType: PropTypes.string,
    data: PropTypes.array,
    noAnimation: PropTypes.bool,
};

export default withWidth()(withStyles(styles)(ChartView));
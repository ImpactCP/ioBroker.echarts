import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@material-ui/core/styles';
import clsx from 'clsx';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { ChromePicker } from 'react-color'

import IconButton from '@material-ui/core/IconButton';
import TabList from '@material-ui/lab/TabList';
import Tab from '@material-ui/core/Tab';
import TabPanel from '@material-ui/lab/TabPanel';
import TabContext from '@material-ui/lab/TabContext';
import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import Dialog from '@material-ui/core/Dialog';
import DialogTitle from '@material-ui/core/DialogTitle';
import DialogActions from '@material-ui/core/DialogActions';
import Button from '@material-ui/core/Button';
import Fab from '@material-ui/core/Fab';

import {MdAdd as IconAdd} from 'react-icons/md';
import {MdSave as IconSave} from 'react-icons/md';
import {MdExpandLess as IconCollapse} from 'react-icons/md';
import {MdExpandMore as IconExpand} from 'react-icons/md';

import I18n from '@iobroker/adapter-react/i18n';
import Utils from '@iobroker/adapter-react/Components/Utils';

import {IOTextField, IOCheckbox, IOSelect, IODateTimeField} from './Fields';
import Line from './Line';
import Mark from './Mark';
import getDefaultPreset from './DefaultPreset';
import ColorPicker from '@iobroker/adapter-react/Components/ColorPicker';
import TextField from '@material-ui/core/TextField';
import ClearIcon from '@material-ui/icons/Close';

const styles = theme => ({
    tabsBody: {
        overflowY: 'auto',
        flex: 1
    },
    tabsContainer: {
        flexDirection: 'row'
    },
    tabContent: {
        paddingTop: theme.spacing(1),
        position: 'relative',
        minHeight: 'calc(100% - 32px)'
    },
    buttonAdd: {
        position: 'absolute',
        top: theme.spacing(1),
        right: theme.spacing(1),
        zIndex: 3,
    },
    buttonExpandAll: {
        position: 'absolute',
        top: theme.spacing(1) + 42,
        right: theme.spacing(1),
        opacity: 0.5,
        zIndex: 3,
    },
    buttonCollapseAll: {
        position: 'absolute',
        top: theme.spacing(1) + 42 * 2,
        right: theme.spacing(1),
        opacity: 0.5,
        zIndex: 3,
    },
    buttonSave: {
        color: theme.type === 'dark' ? '#CC0000' : '#CC0000'
    },
    noContent : {
        padding: theme.spacing(1),
        height: 64,
        verticalAlign: 'middle',
        lineHeight: '64px',
        width: '100%',
    },
    dragHint: {
        paddingLeft: theme.spacing(1),
        fontSize: 10,
        fontStyle: 'italic',
        opacity: 0.8,
    },
    marginTop: {
        marginTop: theme.spacing(2),
    },
    group: {
        display: 'block',
        '& > div': {
            display: 'inline-flex',
            paddingRight: 20,
            width: 200,
        },
        position: 'relative',
        paddingBottom: theme.spacing(2),
        borderBottom: '1px dotted ' + theme.palette.grey[400]
    },
    title: {
        width: 'inherit',
        position: 'absolute',
        whiteSpace: 'nowrap',
        right: 0,
        fontSize: 48,
        opacity: 0.1,
        lineHeight: '48px',
        padding: 0,
        marginTop: 20,
        marginLeft: 0,
        marginRight: 0,
        marginBottom: 0,
        paddingRight: 10,
    },
});

const PREDEFINED_COLORS_MARKS = [
    '#144578',
    '#1868A8',
    '#665191',
    '#a05195',
    '#d45087',
    '#f95d6a',
    '#ff7c43',
    '#ffa600',
];

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    width: '100%',
    // change background colour if dragging
    background: isDragging ? 'lightgreen' : 'grey',
    // styles we need to apply on draggables
    ...draggableStyle
});

class PresetTabs extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            presetData: getDefaultPreset(this.props.systemConfig),
            selectedTab: window.localStorage.getItem('PresetTabs.selectedTab') !== null ? window.localStorage.getItem('PresetTabs.selectedTab') : '0',
            linesOpened: window.localStorage.getItem('Lines.opened') !== null ? JSON.parse(window.localStorage.getItem('Lines.opened')) : [],
            marksOpened: window.localStorage.getItem('Marks.opened') !== null ? JSON.parse(window.localStorage.getItem('Marks.opened')) : [],
            deleteLineDialog: null,
            deleteMarkDialog: null,
            showColorDialog: false,
            colorDialogValue: '',
        };
        this.colorPickerCb = null;
    }

    lineOpenToggle = index => {
        let linesOpened = JSON.parse(JSON.stringify(this.state.linesOpened));
        linesOpened[index] = !this.state.linesOpened[index];
        this.setState({linesOpened});
        window.localStorage.setItem('Lines.opened', JSON.stringify(linesOpened));
    };

    markOpenToggle = index => {
        let marksOpened = JSON.parse(JSON.stringify(this.state.marksOpened));
        marksOpened[index] = !this.state.marksOpened[index];
        this.setState({marksOpened});
        window.localStorage.setItem('Marks.opened', JSON.stringify(marksOpened));
    };

    updateField = (name, value, time) => {
        const presetData = JSON.parse(JSON.stringify(this.props.presetData));
        presetData[name] = value;
        if (time) {
            presetData[name + '_time'] = time;
        }
        this.props.onChange(presetData);
    };

    updateMark = (index, markData) => {
        let marks = JSON.parse(JSON.stringify(this.props.presetData.marks));
        marks[index] = markData;
        this.updateField('marks', marks);
    };

    updateLine = (index, lineData) => {
        let lines = JSON.parse(JSON.stringify(this.props.presetData.lines));
        lines[index] = lineData;
        this.updateField('lines', lines);
    };

    addMark = () => {
        const len = this.props.presetData.marks.length;
        const color = PREDEFINED_COLORS_MARKS[len % PREDEFINED_COLORS_MARKS.length];
        let presetData = JSON.parse(JSON.stringify(this.props.presetData));
        presetData.marks.push({color});
        this.props.onChange(presetData);
    };

    expandAllLines = () => {
        const linesOpened = this.props.presetData.lines.map(() => true);
        window.localStorage.setItem('Lines.opened', JSON.stringify(linesOpened));
        this.setState({linesOpened});
    };

    collapseAllLines = () => {
        window.localStorage.setItem('Lines.opened', JSON.stringify([]));
        this.setState({linesOpened: []});
    };

    expandAllMarks = () => {
        const marksOpened = this.props.presetData.marks.map(() => true);
        window.localStorage.setItem('Marks.opened', JSON.stringify([]));
        this.setState({marksOpened});
    };

    collapseAllMarks = () => {
        window.localStorage.setItem('Marks.opened', JSON.stringify([]));
        this.setState({marksOpened: []});
    };

    deleteMark = index => {
        const presetData = JSON.parse(JSON.stringify(this.props.presetData));
        presetData.marks.splice(index, 1);
        const marksOpened = [...this.state.marksOpened];
        marksOpened.splice(index, 1);
        this.setState({marksOpened}, () =>
            this.props.onChange(presetData));
    };

    addLine = () => {
        const len = this.props.presetData.lines.length;
        const color = this.props.PREDEFINED_COLORS[len % this.props.PREDEFINED_COLORS.length];
        const presetData = JSON.parse(JSON.stringify(this.props.presetData));
        presetData.lines.push({
            instance: 'system.adapter.' + this.props.systemConfig.common.defaultHistory,
            color,
            xaxe: !len ? undefined : 'off',
            chartType: 'auto',
            aggregate: 'minmax'
        });
        this.props.onChange(presetData);
    };

    deleteLine = index => {
        const presetData = JSON.parse(JSON.stringify(this.props.presetData));
        presetData.lines.splice(index, 1);
        const linesOpened = [...this.state.linesOpened];
        linesOpened.splice(index, 1);
        this.setState({linesOpened}, () => this.props.onChange(presetData));
    };

    renderDeleteLineDialog() {
        return this.state.deleteLineDialog !== null ? <Dialog
            open={ true }
            key="deleteLineDialog"
            onClose={ () => this.setState({deleteLineDialog: null}) }
        >
            <DialogTitle>{ I18n.t('Are you sure for delete this line?') }</DialogTitle>
            <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                <Button variant="contained" onClick={ () => this.setState({deleteLineDialog: null}) }>
                    {I18n.t('Cancel')}
                </Button>
                <Button variant="contained" color="secondary" onClick={() => {
                    this.deleteLine(this.state.deleteLineDialog);
                    this.setState({deleteLineDialog: null});
                }}>
                    { I18n.t('Delete') }
                </Button>
            </DialogActions>
        </Dialog> : null;
    }

    renderDeleteMarkDialog() {
        return this.state.deleteMarkDialog !== null ? <Dialog
            open={ true }
            key="deleteMarkDialog"
            onClose={ () => this.setState({deleteMarkDialog: null}) }
        >
            <DialogTitle>{ I18n.t('Are you sure for delete this mark?') }</DialogTitle>
            <DialogActions className={ clsx(this.props.classes.alignRight, this.props.classes.buttonsContainer) }>
                <Button variant="contained" onClick={ () => this.setState({deleteMarkDialog: null}) }>
                    {I18n.t('Cancel')}
                </Button>
                <Button variant="contained" color="secondary" onClick={() => {
                    this.deleteMark(this.state.deleteMarkDialog);
                    this.setState({deleteMarkDialog: null});
                }}>
                    { I18n.t('Delete') }
                </Button>
            </DialogActions>
        </Dialog> : null;
    }

    showColorPicker(value, cb) {
        this.colorPickerCb = cb;
        this.setState({colorDialogValue: value, showColorDialog: true});
    }

    renderColorDialog() {
        return <Dialog onClose={() => {
            this.colorPickerCb = null;
            this.setState({showColorDialog: false});
        }} open={this.state.showColorDialog}>
            {/*<DialogTitle id="simple-dialog-title">Set backup account</DialogTitle>*/}
            <ChromePicker
                color={this.state.colorDialogValue}
                onChange={value => {
                    this.setState({colorDialogValue: value}, () =>
                        this.colorPickerCb(value));
                }}
            />
        </Dialog>;
    }

    renderTabLines() {
        const anyClosed = this.props.presetData.lines.length > 1 && this.props.presetData.lines.find((l, i) => !this.state.linesOpened[i]);
        const anyOpened = this.props.presetData.lines.length > 1 && this.props.presetData.lines.find((l, i) => this.state.linesOpened[i]);

        return <Droppable droppableId="droppable">
            {(provided, snapshot) =>
                <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{
                        background: snapshot.isDraggingOver ? this.props.theme.palette.secondary.dark : undefined,
                        width: '100%',
                        minHeight: '100%',
                    }}
                >
                    <TabPanel value="0" classes={{root: this.props.classes.tabContent}}>
                        <Fab onClick={this.addLine}     size="small" color="secondary" className={this.props.classes.buttonAdd}         title={I18n.t('Add line to chart')}><IconAdd/></Fab>
                        {anyClosed ? <Fab onClick={this.expandAllLines}   size="small" color="default" className={this.props.classes.buttonExpandAll}  title={I18n.t('Expand all lines')}><IconExpand/></Fab> : null}
                        {anyOpened ? <Fab onClick={this.collapseAllLines} size="small" color="default" className={this.props.classes.buttonCollapseAll} title={I18n.t('Collapse all lines')}><IconCollapse/></Fab> : null}
                        {this.props.presetData.lines.length ? this.props.presetData.lines.map((line, index) =>
                            <Draggable key={line.id + '_' + index} draggableId={line.id + '_' + index} index={index}>
                                {(provided, snapshot) =>
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                                    >
                                        <Line
                                            provided={provided}
                                            snapshot={snapshot}
                                            theme={this.props.theme}
                                            instances={this.props.instances}
                                            line={line}
                                            width={this.props.width}
                                            updateLine={this.updateLine}
                                            deleteLine={index => this.setState({deleteLineDialog: index})}
                                            index={index}
                                            key={index}
                                            socket={this.props.socket}
                                            opened={typeof this.state.linesOpened[index] !== 'undefined' && this.state.linesOpened[index] === true}
                                            lineOpenToggle={this.lineOpenToggle}
                                            maxLines={this.props.presetData.lines.length}
                                            onSelectColor={(value, cb) => this.showColorPicker(value, cb)}
                                        />
                                    </div>
                                }
                            </Draggable>)
                        :
                            <div className={this.props.classes.noContent}>
                                {I18n.t('Create a new line with a "+" on the right.')}
                            </div>
                        }
                        <div className={this.props.classes.dragHint}>{I18n.t('You can drag and drop simple lines from the left list.')}</div>
                    </TabPanel>
                </div>}
            </Droppable>;
    }

    renderTabMarkings() {
        const anyClosed = this.props.presetData.marks.length > 1 && this.props.presetData.marks.find((l, i) => !this.state.marksOpened[i]);
        const anyOpened = this.props.presetData.marks.length > 1 && this.props.presetData.marks.find((l, i) =>  this.state.marksOpened[i]);

        return <TabPanel value="1" classes={{root: this.props.classes.tabContent}}>
            <Fab onClick={this.addMark} size="small" color="secondary" className={this.props.classes.buttonAdd} title={I18n.t('Add marking line to chart')}>
                <IconAdd/>
            </Fab>
            {anyClosed ? <Fab onClick={this.expandAllMarks}   size="small" color="default" className={this.props.classes.buttonExpandAll}  title={I18n.t('Expand all markings')}><IconExpand/></Fab> : null}
            {anyOpened ? <Fab onClick={this.collapseAllMarks} size="small" color="default" className={this.props.classes.buttonCollapseAll} title={I18n.t('Collapse all markings')}><IconCollapse/></Fab> : null}
            {
                this.props.presetData.marks.length ?
                    this.props.presetData.marks.map((mark, index) => <Mark
                        mark={mark}
                        presetData={this.props.presetData}
                        updateMark={this.updateMark}
                        deleteMark={(index) => {this.setState({deleteMarkDialog: index})}}
                        index={index}
                        key={index}
                        socket={this.props.socket}
                        opened={typeof this.state.marksOpened[index] !== 'undefined' && this.state.marksOpened[index] === true}
                        markOpenToggle={this.markOpenToggle}
                        onSelectColor={(value, cb) => this.showColorPicker(value, cb)}
                    />) :
                    <div className={this.props.classes.noContent}>
                        {I18n.t('You can create a new markings with a "+" on the right.')}
                    </div>
            }
        </TabPanel>;
    }

    renderTabTime() {
        return <TabPanel value="2" classes={{root: this.props.classes.tabContent}}>
                    <div className={this.props.classes.group}>
                        <p className={this.props.classes.title}>{I18n.t('Type')}</p>
                        <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="timeType" label="Type" options={{
                            'relative': 'relative',
                            'static': 'static',
                        }}/>
                    </div>
                    <div className={this.props.classes.group}>
                        { this.props.presetData.timeType === 'static' ?
                            <>
                                <p className={this.props.classes.title}>{I18n.t('Start and end')}</p>
                                <IODateTimeField formData={this.props.presetData} updateValue={this.updateField} name="start" label="Start" />
                                <IODateTimeField formData={this.props.presetData} updateValue={this.updateField} name="end" label="End" />
                            </> : <>
                                <p className={this.props.classes.title}>{I18n.t('Relative')}</p>
                                <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="relativeEnd" label="End" options={{
                                    'now': 'now',
                                    '1minute': 'end of minute',
                                    '5minutes': 'end of 5 minutes',
                                    '10minutes': 'end of 10 minutes',
                                    '30minutes': 'end of 30 minutes',
                                    '1hour': 'end of hour',
                                    '2hours': 'end of 2 hours',
                                    '3hours': 'end of 3 hours',
                                    '4hours': 'end of 4 hours',
                                    '6hours': 'end of 6 hours',
                                    '8hours': 'end of 8 hours',
                                    '12hours': 'end of 12 hours',
                                    'today': 'end of day',
                                    'weekEurope': 'end of sunday',
                                    'weekUsa': 'end of saturday',
                                    'month': 'this month',
                                    'year': 'this year',
                                }}/>
                                <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="range" label="Range" options={{
                                    '10': '10 minutes',
                                    '30': '30 minutes',
                                    '60': '1 hour',
                                    '120': '2 hours',
                                    '180': '3 hours',
                                    '360': '6 hours',
                                    '720': '12 hours',
                                    '1440': '1 day',
                                    '2880': '2 days',
                                    '4320': '3 days',
                                    '10080': '7 days',
                                    '20160': '14 days',
                                    '1m': '1 month',
                                    '2m': '2 months',
                                    '3m': '3 months',
                                    '6m': '6 months',
                                    '1y': '1 year',
                                    '2y': '2 years',
                                }}/>
                                <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="live" label="Live update every" options={{
                                    '': 'none',
                                    '5': '5 seconds',
                                    '10': '10 seconds',
                                    '15': '15 seconds',
                                    '20': '20 seconds',
                                    '30': '30 seconds',
                                    '60': '1 minute',
                                    '120': '2 minutes',
                                    '300': '5 minutes',
                                    '600': '10 minutes',
                                    '900': '15 minutes',
                                    '1200': '20 minutes',
                                    '1800': '30 minutes',
                                    '3600': '1 hour',
                                    '7200': '2 hours',
                                    '10800': '3 hours',
                                    '21600': '6 hours',
                                    '43200': '12 hours',
                                    '86400': '1 day',
                                }}/>
                            </>
                        }
                    </div>
                    {/*<div className={this.props.classes.group}>
                        <p className={this.props.classes.title}>{I18n.t('Start and end')}</p>
                        <IOObjectField socket={this.props.socket} formData={this.props.presetData} updateValue={this.updateField} name="ticks" label="Use X-ticks from" />
                    </div>*/}
                {this.props.presetData.lines.find(line => line.aggregate !== 'onchange') ?
                    <div className={this.props.classes.group}>
                        <p className={this.props.classes.title}>{I18n.t('Aggregate')}</p>
                        <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="aggregateType" label="Step type" options={{
                            'count': 'counts',
                            'step': 'seconds',
                        }}/>
                        <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="aggregateSpan"
                                     label={this.props.presetData.aggregateType === 'step' ? 'Seconds' : 'Counts'}
                        />
                    </div> : null }
            <div className={this.props.classes.group}>
                <p className={this.props.classes.title}>{I18n.t('Time format')}</p>
                <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label="Custom time format" name="timeFormatCustom" />
                {!this.props.presetData.timeFormatCustom ?
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} label="Time format" name="timeFormat" options={{
                        '': 'Default',
                        'HH:mm DD.MM': 'HH:MM dd.mm',
                        'HH:mm DD.MM.': 'HH:MM dd.mm.',
                        'HH:mm <br/> DD.MM': 'HH:MM / dd.mm',
                        'HH:mm <br/> DD.MM.': 'HH:MM / dd.mm.',
                        'HH:mm <br/> DD.MM.YY': 'HH:MM / dd.mm.yy',
                        'HH:mm:ss DD.MM.YY': 'HH:MM:SS dd.mm.yy',
                        'HH:mm DD.MM.YY': 'HH:MM dd.mm.yy',
                        'hh:mm:ss MM/DD/YY a': 'HH:MM:SS mm/dd/yy am (US)',
                        'HH:mm:ss DD/MM/YY': 'HH:MM:SS dd/mm/yy (UK)',
                        'HH:mm:ss MM.DD.YY': 'HH:MM:SS mm.dd.yy',
                        'HH:mm ddd': 'HH:MM dow',
                        'HH:mm:ss ddd': 'HH:MM:SS dow',
                        'HH:mm MM.DD': 'HH:MM mm.dd',
                        'HH:mm:ss': 'HH:MM:SS',
                        'HH:mm': 'HH:MM',
                        'DD.MM': 'dd.mm',
                        'DD.MM.': 'dd.mm.',
                        'MM/DD': 'mm/dd',
                        'DD': 'dd',
                        'MM': 'mm',
                        'YY': 'y',
                        'HH': 'HH',
                        'mm': 'MM',
                        'ddd': 'dow',
                        'DD.MM.YY': 'dd.mm.yy',
                    }}/> :
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} label="Time format" name="timeFormat" helperLink="https://momentjs.com/docs/#/displaying/format/"/>
                }
                {/*<IOSelect formData={this.props.presetData} updateValue={this.updateField} label="Animation" name="animation" options={{
                                '0': 'no',
                                '300': '300ms',
                                '500': '500ms',
                                '1000': '1 second',
                                '2000': '2 seconds',
                                '3000': '3 seconds',
                                '5000': '5 seconds',
                                '10000': '10 seconds',
                            }}/>*/}
            </div>
        </TabPanel>;
    }

    renderTabOptions() {
        return <TabPanel value="3" classes={{root: this.props.classes.tabContent}}>
            <div className={this.props.classes.group}>
                <p className={this.props.classes.title}>{I18n.t('Legend')}</p>
                <IOSelect formData={this.props.presetData} updateValue={this.updateField} label="Show legend" name="legend" options={{
                    '': 'none',
                    'nw': 'Top, left',
                    'ne': 'Top, right',
                    'sw': 'Bottom, left',
                    'se': 'Bottom, right',
                }}/>
                {this.props.presetData.legend ?
                <>
                    {/*<IOTextField formData={this.props.presetData} updateValue={this.updateField} label="Legend columns" name="legColumns" min="1" type="number" />*/}
                    {/*<IOTextField formData={this.props.presetData} updateValue={this.updateField} label="Legend opacity (0-1)" name="legBgOpacity" />*/}
                    {this.renderColorField(this.props.presetData, this.updateField, 'Legend background', 'legBg')}
                </> : null}
            </div>
            <div className={this.props.classes.group}>
                <p className={this.props.classes.title}>{I18n.t('Options')}</p>
                <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label={'Hover details'} name="hoverDetail" />
                <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label={'Use comma'} name="useComma" />
                <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label={'Enable zoom and pan'} name="zoom" />
                {/*<IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label={'Hide edit button'} name="noedit" />*/}
                <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label={'Show export button'} name="export" />
            </div>
            <div className={this.props.classes.group}>
                <p className={this.props.classes.title}>{I18n.t('Time format')}</p>
                <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} label="Custom time format" name="timeFormatCustom" />
                {!this.props.presetData.timeFormatCustom ?
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} label="Time format" name="timeFormat" options={{
                        '': 'Default',
                        'HH:mm DD.MM': 'HH:MM dd.mm',
                        'HH:mm DD.MM.': 'HH:MM dd.mm.',
                        'HH:mm <br/> DD.MM': 'HH:MM / dd.mm',
                        'HH:mm <br/> DD.MM.': 'HH:MM / dd.mm.',
                        'HH:mm <br/> DD.MM.YY': 'HH:MM / dd.mm.yy',
                        'HH:mm:ss DD.MM.YY': 'HH:MM:SS dd.mm.yy',
                        'HH:mm DD.MM.YY': 'HH:MM dd.mm.yy',
                        'hh:mm:ss MM/DD/YY a': 'HH:MM:SS mm/dd/yy am (US)',
                        'HH:mm:ss DD/MM/YY': 'HH:MM:SS dd/mm/yy (UK)',
                        'HH:mm:ss MM.DD.YY': 'HH:MM:SS mm.dd.yy',
                        'HH:mm ddd': 'HH:MM dow',
                        'HH:mm:ss ddd': 'HH:MM:SS dow',
                        'HH:mm MM.DD': 'HH:MM mm.dd',
                        'HH:mm:ss': 'HH:MM:SS',
                        'HH:mm': 'HH:MM',
                        'DD.MM': 'dd.mm',
                        'DD.MM.': 'dd.mm.',
                        'MM/DD': 'mm/dd',
                        'DD': 'dd',
                        'MM': 'mm',
                        'YY': 'y',
                        'HH': 'HH',
                        'mm': 'MM',
                        'ddd': 'dow',
                        'DD.MM.YY': 'dd.mm.yy',
                    }}/> :
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} label="Time format" name="timeFormat" helperLink="https://momentjs.com/docs/#/displaying/format/"/>
                }
                {/*<IOSelect formData={this.props.presetData} updateValue={this.updateField} label="Animation" name="animation" options={{
                                '0': 'no',
                                '300': '300ms',
                                '500': '500ms',
                                '1000': '1 second',
                                '2000': '2 seconds',
                                '3000': '3 seconds',
                                '5000': '5 seconds',
                                '10000': '10 seconds',
                            }}/>*/}
            </div>
        </TabPanel>;
    }

    renderTabTitle() {
        return <TabPanel value="4" classes={{root: this.props.classes.tabContent}}>
            <div className={this.props.classes.group}>
                <p className={this.props.classes.title}>{I18n.t('Title')}</p>
                <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="title" label="Title"/>
                {this.props.presetData.title ?
                    <>
                        <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="titlePos" label="Title position" options={{
                            '': 'none',
                            'top:35;left:65': 'Top, left, inside',
                            'top:35;right:5': 'Top, right, inside',
                            'top:35;left:50': 'Top, center, inside',
                            'top:50;left:65': 'Middle, left, inside',
                            'top:50;right:5': 'Middle, right, inside',
                            'bottom:5;left:65': 'Bottom, left, inside',
                            'bottom:5;right:5': 'Bottom, right, inside',
                            'bottom:5;left:50': 'Bottom, center, inside',
                            /*'top:5;right:-5': 'Top, right, outside',
                            'top:50;right:-5': 'Middle, right, outside',
                            'bottom:5;right:-5': 'Bottom, right, outside',
                            'bottom:-5;left:50': 'Bottom, center, outside',*/
                        }}/>
                        {this.renderColorField(this.props.presetData, this.updateField, 'Title color', 'titleColor')}
                        <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="titleSize" label="Title size" min="0" type="number" />
                    </>
                    : null}
            </div>
        </TabPanel>;
    }

    renderTabAppearance() {
        return <TabPanel value="5" classes={{root: this.props.classes.tabContent}}>
                {/*<h4>{I18n.t('Appearance')}</h4>*/}
                <div className={this.props.classes.group}>
                    <p className={this.props.classes.title}>{I18n.t('Chart size')}</p>
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="width"  label="Width"  type="number" classes={{fieldContainer: this.props.classes.marginTop}}/>
                    <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="height" label="Height" type="number" classes={{fieldContainer: this.props.classes.marginTop}} />
                </div>
                <div className={this.props.classes.group}>
                    <p className={this.props.classes.title}>{I18n.t('Backgrounds')}</p>
                    {this.renderColorField(this.props.presetData, this.updateField, 'Window background', 'window_bg', undefined, this.props.classes.marginTop)}
                    {this.renderColorField(this.props.presetData, this.updateField, 'Chart background', 'bg_custom', undefined, this.props.classes.marginTop)}
                </div>
                <div className={this.props.classes.group}>
                    <p className={this.props.classes.title}>{I18n.t('Labels')}</p>
                    {this.renderColorField(this.props.presetData, this.updateField, 'X labels color', 'x_labels_color', undefined, this.props.classes.marginTop)}
                    {this.renderColorField(this.props.presetData, this.updateField, 'Y labels color', 'y_labels_color', undefined, this.props.classes.marginTop)}
                </div>
                <div className={this.props.classes.group}>
                    <p className={this.props.classes.title}>{I18n.t('Grid')}</p>
                    <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} name="grid_hideX" label="Hide X grid" />
                    <IOCheckbox formData={this.props.presetData} updateValue={this.updateField} name="grid_hideY" label="Hide Y grid" />
                    {!this.props.presetData.grid_hideX || !this.props.presetData.grid_hideY ?
                        this.renderColorField(this.props.presetData, this.updateField, 'Grid color', 'grid_color')
                        : null }
                </div>
                <div className={this.props.classes.group}>
                    <p className={this.props.classes.title}>{I18n.t('Border')}</p>
                    <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="noBorder" label="Border" options={{
                        '': 'With border',
                        'noborder': 'Without border',
                    }}/>
                    {this.props.presetData.noBorder !== 'noborder' ?
                        <>
                            <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="border_width" label="Border width" min="0" type="number"/>
                            {this.props.presetData.border_width ? this.renderColorField(this.props.presetData, this.updateField, 'Border color', 'border_color') : null}
                            {this.props.presetData.border_width ? <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="border_style" label="Border style" options={{
                                'solid':  'solid',
                                'dotted': 'dotted',
                                'dashed': 'dashed',
                                'double': 'double',
                                'groove': 'groove',
                                'ridge':  'ridge',
                                'inset':  'inset',
                                'outset': 'outset',
                            }}/> : null}
                            <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="border_padding" label="Border padding" min="0" type="number"/>

                        </> : null}
                </div>
                {
                    !!this.props.presetData.lines.find(line => line.chartType === 'bar') ?
                        <Grid item sm={6} xs={12}>
                            <h4>{I18n.t('Bar settings')}</h4>
                            {this.renderColorField(this.props.presetData, this.updateField, 'Fill color', 'barColor')}
                            <IOSelect formData={this.props.presetData} updateValue={this.updateField} name="barLabels" label="Show labels" options={{
                                '': 'none',
                                'topover': 'top over',
                                'topunder': 'top under',
                                'bottom': 'bottom',
                                'middle': 'middle',
                            }}/>
                            <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="barWidth" label="Bars width" min="0" type="number"/>
                            <IOTextField formData={this.props.presetData} updateValue={this.updateField} name="barFontSize" label="Label font size" min="0" type="number"/>
                            {this.renderColorField(this.props.presetData, this.updateField, 'Label color', 'barFontColor')}
                        </Grid>
                        : null
                }
        </TabPanel>;
    }

    renderColorField(formData, onUpdate, label, name, minWidth, className) {
        const textColor = Utils.invertColor(formData[name], true);
        return <div className={className}>
            <TextField
                style={{minWidth, width: '100%', color: textColor}}
                label={I18n.t(label)}
                value={formData[name]}
                onClick={() =>
                    this.showColorPicker(this.state['_c_' + name], color =>
                        this.setState({['_c_' + name]: color}, () =>
                            onUpdate(name, ColorPicker.getColor(color))))}
                onChange={e => {
                    const color = e.target.value;
                    this.setState({['_c_' + name]: color}, () =>
                        onUpdate(name, color));
                }}
                inputProps={{style: {backgroundColor: formData[name]}}}
                InputProps={{
                    endAdornment: formData[name] ?
                        <IconButton
                            size="small"
                            onClick={e => {
                                e.stopPropagation();
                                this.setState({['_c_' + name]: ''}, () => onUpdate(name, ''));
                            }}>
                            <ClearIcon />
                        </IconButton>
                        : undefined,
                }}
                InputLabelProps={{shrink: true}}
            />
        </div>;
    }

    render() {
        return <>
            <TabContext value={this.state.selectedTab}>
                <AppBar position="static" className={this.props.classes.tabsContainer}>
                    <IconButton
                        className={this.props.classes.buttonSave}
                        style={{visibility: this.props.selectedPresetChanged ? 'visible' : 'hidden'}}
                        onClick={() =>
                            this.props.savePreset(this.props.selectedPresetId)}
                    >
                        <IconSave/>
                    </IconButton>
                    <TabList
                        onChange={(event, newValue)=>{
                            window.localStorage.setItem('PresetTabs.selectedTab', newValue);
                            this.setState({selectedTab: newValue})
                        }}
                        variant="scrollable"
                        scrollButtons="on"
                    >
                        <Tab label={I18n.t('Data')} value="0"/>
                        <Tab label={I18n.t('Markings')} value="1"/>
                        <Tab label={I18n.t('Time')} value="2"/>
                        <Tab label={I18n.t('Options')} value="3"/>
                        <Tab label={I18n.t('Title')} value="4"/>
                        <Tab label={I18n.t('Appearance')} value="5"/>
                    </TabList>
                </AppBar>
                <div className={this.props.classes.tabsBody}>
                    {this.state.selectedTab === '0' ? this.renderTabLines()      : null}
                    {this.state.selectedTab === '1' ? this.renderTabMarkings()   : null}
                    {this.state.selectedTab === '2' ? this.renderTabTime()       : null}
                    {this.state.selectedTab === '3' ? this.renderTabOptions()    : null}
                    {this.state.selectedTab === '4' ? this.renderTabTitle()      : null}
                    {this.state.selectedTab === '5' ? this.renderTabAppearance() : null}
                </div>
            </TabContext>
            {this.renderDeleteLineDialog()}
            {this.renderDeleteMarkDialog()}
            {this.renderColorDialog()}
        </>
    }
}

PresetTabs.propTypes = {
    onChange: PropTypes.func,
    presetData: PropTypes.object,
    socket: PropTypes.object,
    instances: PropTypes.array,
    selectedPresetId: PropTypes.string,
    savePreset: PropTypes.func,
    selectedPresetChanged: PropTypes.bool,
    width: PropTypes.number,
    PREDEFINED_COLORS: PropTypes.array,
    theme: PropTypes.object,
    systemConfig: PropTypes.object,
};

export default withStyles(styles)(PresetTabs)